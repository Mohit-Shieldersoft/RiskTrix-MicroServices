from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.db.database import SessionLocal
from app.services.group_service import (
    get_all_groups, get_group_by_id, get_group_detail,
    create_group, update_group, delete_group,
    get_group_members, add_members_to_group, remove_member_from_group,
    get_group_policies, assign_policy_to_group, remove_policy_from_group,
)

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Pydantic schemas ──────────────────────────────────────
class GroupCreate(BaseModel):
    name: str
    description: str = ""
    group_type: str = "static"
    smart_rule: Optional[str] = None
    created_by: str = "admin"


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    smart_rule: Optional[str] = None


class MembersPayload(BaseModel):
    device_ids: list[int]


class AssignPolicyPayload(BaseModel):
    policy_id: int
    assigned_by: str = "admin"


# ── Group CRUD ────────────────────────────────────────────
@router.get("/groups")
def list_groups(db: Session = Depends(get_db)):
    return get_all_groups(db)


@router.post("/groups", status_code=201)
def create_new_group(body: GroupCreate, db: Session = Depends(get_db)):
    return create_group(
        db,
        name=body.name,
        description=body.description,
        group_type=body.group_type,
        smart_rule=body.smart_rule,
        created_by=body.created_by,
    )


@router.get("/groups/{group_id}")
def get_group(group_id: int, db: Session = Depends(get_db)):
    detail = get_group_detail(db, group_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Group not found")
    return detail


@router.put("/groups/{group_id}")
def update_group_endpoint(group_id: int, body: GroupUpdate, db: Session = Depends(get_db)):
    group = update_group(db, group_id, **body.model_dump(exclude_none=True))
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


@router.delete("/groups/{group_id}")
def delete_group_endpoint(group_id: int, db: Session = Depends(get_db)):
    ok = delete_group(db, group_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Group not found")
    return {"message": "Group deleted"}


# ── Members ───────────────────────────────────────────────
@router.get("/groups/{group_id}/members")
def list_members(group_id: int, db: Session = Depends(get_db)):
    return get_group_members(db, group_id)


@router.post("/groups/{group_id}/members")
def add_members(group_id: int, body: MembersPayload, db: Session = Depends(get_db)):
    if not body.device_ids:
        raise HTTPException(status_code=422, detail="No device IDs provided")
    return add_members_to_group(db, group_id, body.device_ids)


@router.delete("/groups/{group_id}/members/{device_id}")
def remove_member(group_id: int, device_id: int, db: Session = Depends(get_db)):
    ok = remove_member_from_group(db, group_id, device_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"message": "Device removed from group"}


# ── Group Policy Assignment ───────────────────────────────
@router.get("/groups/{group_id}/policies")
def list_group_policies(group_id: int, db: Session = Depends(get_db)):
    return get_group_policies(db, group_id)


@router.post("/groups/{group_id}/policies")
def assign_policy(group_id: int, body: AssignPolicyPayload, db: Session = Depends(get_db)):
    return assign_policy_to_group(db, group_id, body.policy_id, body.assigned_by)


@router.delete("/groups/{group_id}/policies/{policy_id}")
def remove_policy(group_id: int, policy_id: int, db: Session = Depends(get_db)):
    ok = remove_policy_from_group(db, group_id, policy_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Policy assignment not found")
    return {"message": "Policy removed from group"}
