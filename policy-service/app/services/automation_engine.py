"""
automation_engine.py

Automated security actions triggered when a device reaches critical risk
or specific threat conditions are met.

Current automations:
  1. risk_critical     — device risk_score >= 81: auto-log a "lock" remediation action
  2. rooted_device     — is_rooted=True: auto-log a "wipe" recommendation
  3. blacklisted_app   — blacklisted_app_detected=True: auto-log a "policy_push" action

Each automation:
  - Checks if the same action type was already logged today (deduplication)
  - Creates a RemediationAction with status="pending" and performed_by="automation"
  - Logs a DeviceActivity entry
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.security import DeviceSecurityProfile, RemediationAction
from app.models.device import DeviceActivity


def _already_logged_today(db: Session, device_id: int, action_type: str) -> bool:
    since = datetime.utcnow() - timedelta(hours=24)
    return (
        db.query(RemediationAction)
        .filter(
            RemediationAction.device_id == device_id,
            RemediationAction.action_type == action_type,
            RemediationAction.performed_by == "automation",
            RemediationAction.created_at >= since,
        )
        .first()
    ) is not None


def _log_action(db: Session, device_id: int, action_type: str, notes: str):
    action = RemediationAction(
        device_id=device_id,
        action_type=action_type,
        performed_by="automation",
        notes=notes,
        status="pending",
    )
    db.add(action)
    db.add(DeviceActivity(
        device_id=device_id,
        event_type="automated_action",
        message=f"[Automation] {action_type}: {notes}",
    ))


def run_automated_actions(profile: DeviceSecurityProfile, db: Session):
    """
    Evaluate a DeviceSecurityProfile and trigger automated remediation actions
    if conditions are met. Called after every risk evaluation.
    """
    device_id = profile.device_id
    triggered = []

    # ── 1. Critical risk → recommend remote lock ──────────
    if profile.risk_score >= 81:
        if not _already_logged_today(db, device_id, "lock"):
            _log_action(
                db, device_id, "lock",
                f"Auto-triggered: device risk score {profile.risk_score} (critical). "
                "Remote lock recommended until issue is resolved.",
            )
            triggered.append("lock")

    # ── 2. Rooted device → recommend wipe ─────────────────
    if profile.is_rooted:
        if not _already_logged_today(db, device_id, "wipe"):
            _log_action(
                db, device_id, "wipe",
                "Auto-triggered: rooted/jailbroken device detected. "
                "Remote wipe recommended to prevent data leakage.",
            )
            triggered.append("wipe")

    # ── 3. Blacklisted app → push updated policy ──────────
    if profile.blacklisted_app_detected:
        if not _already_logged_today(db, device_id, "policy_push"):
            _log_action(
                db, device_id, "policy_push",
                "Auto-triggered: blacklisted application detected. "
                "Push updated app-restriction policy to device.",
            )
            triggered.append("policy_push")

    if triggered:
        db.commit()

    return triggered
