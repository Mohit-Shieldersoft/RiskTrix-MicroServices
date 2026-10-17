from fastapi import Request

DEMO_PREFIX = "DEMO-"
DEMO_HEADER = "X-RiskTrix-Demo"


def is_demo_request(request: Request | None) -> bool:
    if request is None:
        return False
    value = (request.headers.get(DEMO_HEADER) or "").strip().lower()
    return value in ("1", "true", "yes")


def is_demo_id(value: str | None) -> bool:
    return bool(value) and str(value).upper().startswith(DEMO_PREFIX)


def scope_ids(ids, demo: bool):
    values = [item for item in (ids or []) if item]
    if demo:
        return [item for item in values if is_demo_id(item)]
    return [item for item in values if not is_demo_id(item)]


def in_scope(account_id: str | None, demo: bool) -> bool:
    marked = is_demo_id(account_id)
    return marked if demo else not marked
