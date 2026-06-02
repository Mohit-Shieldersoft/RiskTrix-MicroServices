"""
automation_executor.py

Evaluates AutomationRules against a trigger context and runs actions.

Condition operators supported:
  eq, neq, gt, gte, lt, lte, is_true, is_false, contains

Action types supported:
  lock_device        — issues DeviceCommand(lock)
  wipe_device        — issues DeviceCommand(wipe)
  restart_device     — issues DeviceCommand(restart)
  sync_device        — issues DeviceCommand(sync)
  create_alert       — creates a SecurityAlert
  log_remediation    — creates a RemediationAction
  push_policy        — issues DeviceCommand(policy_push via sync)

Entry points:
  run_rules_for_trigger(trigger_type, context, db)
     — called after risk_evaluated, device_offline, agent_checkin events
"""
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.automation import AutomationRule, AutomationExecution
from app.models.device import DeviceActivity


# ── Condition evaluator ───────────────────────────────────────────────────────

def _eval_condition(cond: dict, ctx: dict) -> bool:
    field = cond.get("field")
    op    = cond.get("op", "eq")
    value = cond.get("value")

    actual = ctx.get(field)
    if actual is None:
        return False

    try:
        if op == "eq":      return actual == value
        if op == "neq":     return actual != value
        if op == "gt":      return float(actual) > float(value)
        if op == "gte":     return float(actual) >= float(value)
        if op == "lt":      return float(actual) < float(value)
        if op == "lte":     return float(actual) <= float(value)
        if op == "is_true": return bool(actual) is True
        if op == "is_false":return bool(actual) is False
        if op == "contains":return str(value).lower() in str(actual).lower()
    except (TypeError, ValueError):
        return False
    return False


def _conditions_match(conditions: list, ctx: dict) -> bool:
    """All conditions must pass (AND logic)."""
    if not conditions:
        return True
    return all(_eval_condition(c, ctx) for c in conditions)


# ── Action runner ─────────────────────────────────────────────────────────────

def _run_action(action: dict, device_id: int | None, rule_name: str, db: Session) -> str:
    """Execute a single action. Returns the action type string."""
    atype = action.get("type")

    if atype in ("lock_device", "wipe_device", "restart_device", "sync_device", "push_policy"):
        if device_id is None:
            return f"{atype}:skipped(no device)"
        from app.models.security import DeviceCommand
        cmd_map = {
            "lock_device":    "lock",
            "wipe_device":    "wipe",
            "restart_device": "restart",
            "sync_device":    "sync",
            "push_policy":    "sync",
        }
        cmd = DeviceCommand(
            device_id=device_id,
            command_type=cmd_map[atype],
            payload={},
            issued_by=f"automation:{rule_name}",
            status="pending",
        )
        db.add(cmd)

    elif atype == "create_alert":
        if device_id is None:
            return f"{atype}:skipped(no device)"
        from app.models.security import SecurityAlert
        db.add(SecurityAlert(
            device_id=device_id,
            alert_type=action.get("alert_type", "automation_trigger"),
            severity=action.get("severity", "high"),
            message=action.get("message") or f"Automation rule '{rule_name}' triggered.",
        ))

    elif atype == "log_remediation":
        if device_id is None:
            return f"{atype}:skipped(no device)"
        from app.models.security import RemediationAction
        db.add(RemediationAction(
            device_id=device_id,
            action_type=action.get("action_type", "note"),
            performed_by=f"automation:{rule_name}",
            notes=action.get("notes") or f"Auto-remediation from rule '{rule_name}'.",
            status="pending",
        ))

    elif atype == "log_activity":
        if device_id is None:
            return f"{atype}:skipped(no device)"
        db.add(DeviceActivity(
            device_id=device_id,
            event_type="automation",
            message=action.get("message") or f"[Automation] rule '{rule_name}' executed.",
        ))

    else:
        return f"{atype}:unknown"

    return atype


# ── Main entry point ──────────────────────────────────────────────────────────

def run_rules_for_trigger(trigger_type: str, context: dict, db: Session) -> list[dict]:
    """
    Evaluate all enabled rules for the given trigger_type.
    context keys vary by trigger:
      risk_evaluated:  risk_score, risk_level, is_rooted, encryption_enabled,
                       screen_lock_enabled, os_outdated, blacklisted_app_detected, device_id
      device_offline:  device_id, seconds_offline
      agent_checkin:   device_id, battery_level, storage_pct, network_status

    Returns list of execution result dicts.
    """
    rules = (
        db.query(AutomationRule)
        .filter(
            AutomationRule.trigger_type == trigger_type,
            AutomationRule.enabled == True,
        )
        .all()
    )

    results = []
    device_id = context.get("device_id")

    for rule in rules:
        try:
            conditions = rule.conditions_json or []
            actions    = rule.actions_json or []

            if not _conditions_match(conditions, context):
                continue  # conditions not met — skip silently

            actions_taken = []
            for action in actions:
                result = _run_action(action, device_id, rule.name, db)
                actions_taken.append(result)

            # Log the execution
            exec_log = AutomationExecution(
                rule_id=rule.id,
                rule_name=rule.name,
                trigger_type=trigger_type,
                device_id=device_id,
                actions_taken=actions_taken,
                status="success",
                detail=f"Context: {context}",
            )
            db.add(exec_log)
            db.commit()

            results.append({
                "rule_id": rule.id,
                "rule_name": rule.name,
                "actions_taken": actions_taken,
                "status": "success",
            })

        except Exception as e:
            db.rollback()
            db.add(AutomationExecution(
                rule_id=rule.id,
                rule_name=rule.name,
                trigger_type=trigger_type,
                device_id=device_id,
                actions_taken=[],
                status="failed",
                detail=str(e),
            ))
            db.commit()
            results.append({"rule_id": rule.id, "rule_name": rule.name, "status": "failed", "error": str(e)})

    return results
