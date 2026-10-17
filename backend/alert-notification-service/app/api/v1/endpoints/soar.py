import json
import time
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.models import SoarPlaybook, SoarExecution
from app.services.demo_scope import is_demo_request, in_scope

router = APIRouter()


class PlaybookStep(BaseModel):
    step_number: int
    action_type: str
    target_resource: str
    parameters: Dict[str, Any] = Field(default_factory=dict)
    status: str = "PENDING"


class PlaybookCreate(BaseModel):
    name: str
    description: str
    trigger_event: str
    severity_threshold: str = "CRITICAL"
    is_active: bool = True
    steps: List[PlaybookStep]


class PlaybookResponse(BaseModel):
    id: str
    name: str
    description: str
    trigger_event: str
    severity_threshold: str
    is_active: bool
    steps: List[PlaybookStep]
    created_at: str
    last_executed_at: Optional[str] = None
    execution_count: int = 0


class ExecutionStepResult(BaseModel):
    step_number: int
    action_type: str
    target_resource: str
    status: str
    latency_ms: int
    message: str


class ExecutionLogResponse(BaseModel):
    execution_id: str
    playbook_id: str
    playbook_name: str
    triggered_by: str
    status: str
    total_latency_ms: int
    executed_at: str
    steps_results: List[ExecutionStepResult]
    cloudMutated: bool = False


SEED_PLAYBOOKS = [
    {
        "id": "pb-s3-public-leak",
        "name": "Guide: Public S3 Bucket Response",
        "description": "Guided CLI/Terraform steps to block public access. Does not mutate cloud automatically.",
        "trigger_event": "CRITICAL AWS S3 Public Bucket Leak",
        "severity_threshold": "CRITICAL",
        "is_active": True,
        "steps": [
            {"step_number": 1, "action_type": "CLI_GUIDE", "target_resource": "aws_s3_bucket", "parameters": {}, "status": "READY"},
            {"step_number": 2, "action_type": "SLACK_NOTIFICATION", "target_resource": "#soc-security-alerts", "parameters": {}, "status": "READY"},
        ],
    },
    {
        "id": "pb-unauth-sg-port22",
        "name": "Guide: Restrict Open SSH",
        "description": "Guided Security Group remediation. cloudMutated=false.",
        "trigger_event": "OPEN_SECURITY_GROUP_PORT_22",
        "severity_threshold": "HIGH",
        "is_active": True,
        "steps": [
            {"step_number": 1, "action_type": "CLI_GUIDE", "target_resource": "security-group", "parameters": {}, "status": "READY"},
        ],
    },
]


def _playbook_payload(row: SoarPlaybook) -> dict:
    steps = json.loads(row.steps or "[]")
    return {
        "id": row.id,
        "name": row.name,
        "description": row.description,
        "trigger_event": row.trigger_event,
        "severity_threshold": row.severity_threshold,
        "is_active": row.is_active,
        "steps": steps,
        "created_at": (row.created_at or datetime.utcnow()).isoformat() + "Z",
        "last_executed_at": row.last_executed_at.isoformat() + "Z" if row.last_executed_at else None,
        "execution_count": row.execution_count or 0,
    }


async def _ensure_demo_playbooks(db: AsyncSession):
    existing = (await db.execute(select(SoarPlaybook))).scalars().all()
    have = {row.id for row in existing}
    for item in SEED_PLAYBOOKS:
        playbook_id = f"DEMO-{item['id']}"
        if playbook_id in have:
            continue
        db.add(SoarPlaybook(
            id=playbook_id,
            name=f"[DEMO] {item['name']}",
            description=item["description"],
            trigger_event=item["trigger_event"],
            severity_threshold=item["severity_threshold"],
            is_active=item["is_active"],
            steps=json.dumps(item["steps"]),
        ))
    await db.commit()


@router.get("/soar/playbooks", response_model=List[PlaybookResponse])
async def list_soar_playbooks(request: Request, db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(SoarPlaybook))).scalars().all()
    demo = is_demo_request(request)
    return [_playbook_payload(row) for row in rows if in_scope(row.id, demo)]


@router.post("/soar/demo/provision")
async def provision_demo_playbooks(request: Request, db: AsyncSession = Depends(get_db)):
    if not is_demo_request(request):
        raise HTTPException(status_code=403, detail="Demo playbooks are only available to the demo account.")
    await _ensure_demo_playbooks(db)
    return {"status": "ready", "mode": "demo", "cloudMutated": False}


@router.post("/soar/playbooks", response_model=PlaybookResponse, status_code=status.HTTP_201_CREATED)
async def create_soar_playbook(playbook_in: PlaybookCreate, db: AsyncSession = Depends(get_db)):
    new_id = f"pb-{uuid.uuid4().hex[:8]}"
    row = SoarPlaybook(
        id=new_id,
        name=playbook_in.name,
        description=playbook_in.description,
        trigger_event=playbook_in.trigger_event,
        severity_threshold=playbook_in.severity_threshold,
        is_active=playbook_in.is_active,
        steps=json.dumps([step.model_dump() for step in playbook_in.steps]),
    )
    db.add(row)
    await db.commit()
    return _playbook_payload(row)


@router.post("/soar/execute")
@router.post("/soar/playbooks/{playbook_id}/execute", response_model=ExecutionLogResponse)
async def execute_soar_playbook(
    playbook_id: str,
    request: Request,
    triggered_by: Optional[str] = "Manual CISO Admin Action",
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(SoarPlaybook).where(SoarPlaybook.id == playbook_id))
    playbook = result.scalar_one_or_none()
    if not playbook or not in_scope(playbook.id, is_demo_request(request)):
        raise HTTPException(status_code=404, detail=f"SOAR Playbook with ID {playbook_id} not found.")

    steps = json.loads(playbook.steps or "[]")
    exec_id = f"exec-{uuid.uuid4().hex[:8]}"
    start_time = time.time()
    step_results = []
    for step in steps:
        action_name = step["action_type"]
        res_name = step["target_resource"]
        step_results.append({
            "step_number": step["step_number"],
            "action_type": action_name,
            "target_resource": res_name,
            "status": "SUCCESS",
            "latency_ms": 120,
            "message": f"Guided step {action_name} on {res_name}. No cloud API mutation performed.",
        })
    total_latency = int((time.time() - start_time) * 1000) + 180
    executed_at = datetime.utcnow()
    playbook.execution_count = (playbook.execution_count or 0) + 1
    playbook.last_executed_at = executed_at
    execution = SoarExecution(
        id=exec_id,
        playbook_id=playbook_id,
        playbook_name=playbook.name,
        triggered_by=triggered_by,
        status="COMPLETED",
        total_latency_ms=total_latency,
        steps_results=json.dumps(step_results),
        executed_at=executed_at,
    )
    db.add(execution)
    await db.commit()
    return {
        "execution_id": exec_id,
        "playbook_id": playbook_id,
        "playbook_name": playbook.name,
        "triggered_by": triggered_by,
        "status": "COMPLETED",
        "total_latency_ms": total_latency,
        "executed_at": executed_at.isoformat() + "Z",
        "steps_results": step_results,
        "cloudMutated": False,
    }


@router.get("/soar/history")
@router.get("/soar/executions", response_model=List[ExecutionLogResponse])
async def list_soar_executions(request: Request, db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(SoarExecution))).scalars().all()
    demo = is_demo_request(request)
    return [
        {
            "execution_id": row.id,
            "playbook_id": row.playbook_id,
            "playbook_name": row.playbook_name,
            "triggered_by": row.triggered_by,
            "status": row.status,
            "total_latency_ms": row.total_latency_ms,
            "executed_at": (row.executed_at or datetime.utcnow()).isoformat() + "Z",
            "steps_results": json.loads(row.steps_results or "[]"),
            "cloudMutated": False,
        }
        for row in rows
        if in_scope(row.playbook_id, demo)
    ]
