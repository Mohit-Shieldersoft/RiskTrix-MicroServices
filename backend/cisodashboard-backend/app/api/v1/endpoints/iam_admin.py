import csv
import io
import json
import uuid
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.models import (
    User,
    Organization,
    Invitation,
    IamRole,
    PlatformAuditLog,
    ComplianceStandard,
    SmtpConfig,
)

router = APIRouter()

PERMISSION_CATALOG = [
    {"code": "cspm:scan", "group": "CSPM", "name": "Run CSPM scans"},
    {"code": "cspm:findings:update", "group": "CSPM", "name": "Update findings"},
    {"code": "ciem:analyze", "group": "CIEM", "name": "Analyze identities"},
    {"code": "ip-scanner:scan", "group": "IP Scanner", "name": "Run IP scans"},
    {"code": "ip-scanner:scan:range", "group": "IP Scanner", "name": "Scan CIDR ranges"},
    {"code": "runtime:ingest", "group": "Runtime", "name": "Ingest runtime threats"},
    {"code": "alerts:assign", "group": "Alerts", "name": "Assign alerts"},
    {"code": "users:invite", "group": "IAM", "name": "Invite users"},
]

SYSTEM_ROLES = [
    {"id": "ADMIN", "name": "Administrator", "system": True, "permissions": [p["code"] for p in PERMISSION_CATALOG]},
    {"id": "CISO", "name": "CISO", "system": True, "permissions": [p["code"] for p in PERMISSION_CATALOG if p["group"] != "IAM"]},
    {"id": "SECURITY_ANALYST", "name": "Security Analyst", "system": True, "permissions": ["cspm:scan", "cspm:findings:update", "alerts:assign"]},
    {"id": "VIEWER", "name": "Viewer", "system": True, "permissions": []},
]


class StandardCreate(BaseModel):
    name: str
    type: Optional[str] = None
    description: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    controls: Optional[int] = 0


class SmtpCreate(BaseModel):
    email: str
    host: str
    username: Optional[str] = None
    password: Optional[str] = None
    port: Optional[str] = None
    description: Optional[str] = None
    active: bool = True


def _role_payload(row: IamRole) -> dict:
    try:
        permissions = json.loads(row.permissions or "[]")
    except Exception:
        permissions = []
    return {"id": row.id, "name": row.name, "system": bool(row.system), "permissions": permissions}


def _invite_payload(row: Invitation) -> dict:
    return {
        "id": row.id,
        "email": row.email,
        "role": row.role,
        "token": row.token,
        "status": row.status,
        "expires_at": row.expires_at.isoformat() if row.expires_at else None,
    }


async def _audit(db: AsyncSession, action: str, detail: str, actor: str = "system"):
    db.add(PlatformAuditLog(
        id=str(uuid.uuid4()),
        action=action,
        detail=detail,
        actor=actor,
        created_at=datetime.utcnow(),
    ))


async def _ensure_system_roles(db: AsyncSession):
    existing = (await db.execute(select(IamRole))).scalars().all()
    have = {row.id for row in existing}
    for role in SYSTEM_ROLES:
        if role["id"] in have:
            continue
        db.add(IamRole(
            id=role["id"],
            name=role["name"],
            system=True,
            permissions=json.dumps(role["permissions"]),
        ))
    if len(have) < len(SYSTEM_ROLES):
        await db.commit()


@router.get("/organizations/me")
async def get_my_organization(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Organization))
    org = result.scalars().first()
    if not org:
        return {"id": 1, "name": "RiskTrix", "description": "Default organization"}
    return {
        "id": org.id,
        "name": org.name,
        "description": org.description,
        "industry": org.industry,
        "website": org.website,
        "contact_email": org.contact_email,
    }


@router.patch("/organizations/me")
async def update_my_organization(
    name: Optional[str] = None,
    description: Optional[str] = None,
    industry: Optional[str] = None,
    website: Optional[str] = None,
    contact_email: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Organization))
    org = result.scalars().first()
    if not org:
        org = Organization(name=name or "RiskTrix", description=description, industry=industry, website=website, contact_email=contact_email)
        db.add(org)
    else:
        if name:
            org.name = name
        if description is not None:
            org.description = description
        if industry is not None:
            org.industry = industry
        if website is not None:
            org.website = website
        if contact_email is not None:
            org.contact_email = contact_email
    await _audit(db, "UPDATE", f"Updated organization {org.name}")
    await db.commit()
    return {
        "id": org.id,
        "name": org.name,
        "description": org.description,
        "industry": org.industry,
        "website": org.website,
        "contact_email": org.contact_email,
    }


@router.get("/roles")
async def list_roles(db: AsyncSession = Depends(get_db)):
    await _ensure_system_roles(db)
    rows = (await db.execute(select(IamRole))).scalars().all()
    return [_role_payload(row) for row in rows]


@router.post("/roles")
async def create_role(name: str, permissions: Optional[List[str]] = None, db: AsyncSession = Depends(get_db)):
    await _ensure_system_roles(db)
    role_id = name.upper().replace(" ", "_")
    existing = (await db.execute(select(IamRole).where(IamRole.id == role_id))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Role already exists")
    row = IamRole(id=role_id, name=name, system=False, permissions=json.dumps(permissions or []))
    db.add(row)
    await _audit(db, "CREATE", f"Created role {name}")
    await db.commit()
    return _role_payload(row)


@router.put("/roles/{role_id}/permissions")
async def set_role_permissions(role_id: str, permissions: List[str], db: AsyncSession = Depends(get_db)):
    await _ensure_system_roles(db)
    row = (await db.execute(select(IamRole).where(IamRole.id == role_id))).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Role not found")
    if row.system and role_id == "ADMIN":
        raise HTTPException(status_code=400, detail="Cannot rewrite ADMIN system role")
    row.permissions = json.dumps(permissions)
    await _audit(db, "UPDATE", f"Updated permissions for role {role_id}")
    await db.commit()
    return _role_payload(row)


@router.get("/permissions")
async def list_permissions():
    return PERMISSION_CATALOG


@router.get("/permissions/grouped")
async def grouped_permissions():
    groups = {}
    for perm in PERMISSION_CATALOG:
        groups.setdefault(perm["group"], []).append(perm)
    return groups


@router.get("/invitations")
async def list_invitations(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Invitation))).scalars().all()
    return [_invite_payload(row) for row in rows]


@router.post("/invitations")
async def create_invitation(email: str, role: str = "VIEWER", db: AsyncSession = Depends(get_db)):
    token = uuid.uuid4().hex
    row = Invitation(
        id=str(uuid.uuid4()),
        email=email,
        role=role,
        token=token,
        status="PENDING",
        expires_at=datetime.utcnow() + timedelta(days=7),
    )
    db.add(row)
    await _audit(db, "CREATE", f"Invited {email} as {role}")
    await db.commit()
    return _invite_payload(row)


@router.post("/invitations/{invite_id}/revoke")
async def revoke_invitation(invite_id: str, db: AsyncSession = Depends(get_db)):
    invite = (await db.execute(select(Invitation).where(Invitation.id == invite_id))).scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation not found")
    invite.status = "REVOKED"
    await _audit(db, "UPDATE", f"Revoked invitation {invite.email}")
    await db.commit()
    return _invite_payload(invite)


@router.post("/invitations/{invite_id}/resend")
async def resend_invitation(invite_id: str, db: AsyncSession = Depends(get_db)):
    invite = (await db.execute(select(Invitation).where(Invitation.id == invite_id))).scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation not found")
    invite.token = uuid.uuid4().hex
    invite.status = "PENDING"
    invite.expires_at = datetime.utcnow() + timedelta(days=7)
    await _audit(db, "UPDATE", f"Resent invitation {invite.email}")
    await db.commit()
    return _invite_payload(invite)


@router.post("/invitations/accept")
async def accept_invitation(token: str, password: str, username: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    invite = (await db.execute(select(Invitation).where(Invitation.token == token))).scalar_one_or_none()
    if not invite or invite.status != "PENDING":
        raise HTTPException(status_code=400, detail="Invalid invitation")
    from app.core.security import SecurityManager
    from app.models.models import UserRole
    role_value = invite.role if invite.role in UserRole.__members__ else "VIEWER"
    user = User(
        email=invite.email,
        username=username or invite.email.split("@")[0],
        hashed_password=SecurityManager.get_password_hash(password),
        role=role_value,
        is_active=True,
    )
    db.add(user)
    invite.status = "ACCEPTED"
    await _audit(db, "CREATE", f"Accepted invite for {invite.email}")
    await db.commit()
    return {"status": "accepted", "email": invite.email}


@router.get("/platform-audit")
async def list_platform_audit(
    search: Optional[str] = None,
    action: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    rows = (await db.execute(select(PlatformAuditLog).order_by(PlatformAuditLog.created_at.desc()))).scalars().all()
    results = []
    for row in rows:
        if action and action.lower() not in str(row.action or "").lower():
            continue
        hay = f"{row.actor or ''} {row.detail or ''}".lower()
        if search and search.lower() not in hay:
            continue
        results.append(
            {
                "id": row.id,
                "action": row.action,
                "detail": row.detail,
                "actor": row.actor,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
        )
    return results


@router.get("/platform-audit/export")
async def export_platform_audit(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(PlatformAuditLog).order_by(PlatformAuditLog.created_at.desc()))).scalars().all()
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["id", "action", "detail", "actor", "created_at"])
    for row in rows:
        writer.writerow([row.id, row.action, row.detail, row.actor, row.created_at])
    return {"format": "csv", "content": buffer.getvalue(), "count": len(rows)}


@router.get("/standards")
async def list_standards(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(ComplianceStandard))).scalars().all()
    return [
        {
            "id": row.id,
            "name": row.name,
            "type": row.type,
            "description": row.description,
            "fileName": row.file_name,
            "fileType": row.file_type,
            "controls": row.controls,
            "uploadedOn": row.uploaded_on,
        }
        for row in rows
    ]


@router.post("/standards")
async def create_standard(payload: StandardCreate, db: AsyncSession = Depends(get_db)):
    row = ComplianceStandard(
        name=payload.name,
        type=payload.type,
        description=payload.description,
        file_name=payload.file_name,
        file_type=payload.file_type,
        controls=payload.controls or 0,
        uploaded_on=datetime.utcnow().strftime("%Y-%m-%d"),
    )
    db.add(row)
    await _audit(db, "CREATE", f"Added compliance standard {payload.name}")
    await db.commit()
    await db.refresh(row)
    return {
        "id": row.id,
        "name": row.name,
        "type": row.type,
        "description": row.description,
        "fileName": row.file_name,
        "fileType": row.file_type,
        "controls": row.controls,
        "uploadedOn": row.uploaded_on,
    }


@router.get("/smtp-configs")
async def list_smtp_configs(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(SmtpConfig))).scalars().all()
    return [
        {
            "id": row.id,
            "email": row.email,
            "host": row.host,
            "username": row.username,
            "password": row.password,
            "port": row.port,
            "description": row.description,
            "active": row.active,
        }
        for row in rows
    ]


@router.post("/smtp-configs")
async def create_smtp_config(payload: SmtpCreate, db: AsyncSession = Depends(get_db)):
    row = SmtpConfig(
        email=payload.email,
        host=payload.host,
        username=payload.username,
        password=payload.password,
        port=payload.port,
        description=payload.description,
        active=payload.active,
    )
    db.add(row)
    await _audit(db, "CREATE", f"Added SMTP config {payload.host}")
    await db.commit()
    await db.refresh(row)
    return {
        "id": row.id,
        "email": row.email,
        "host": row.host,
        "username": row.username,
        "password": row.password,
        "port": row.port,
        "description": row.description,
        "active": row.active,
    }
