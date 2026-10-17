from fastapi import Request

DEMO_PREFIX = "[DEMO]"
DEMO_HEADER = "X-RiskTrix-Demo"


def is_demo_request(request: Request | None) -> bool:
    if request is None:
        return False
    value = (request.headers.get(DEMO_HEADER) or "").strip().lower()
    return value in ("1", "true", "yes")


def is_demo_scan(summary: str | None) -> bool:
    return str(summary or "").startswith(DEMO_PREFIX)


def in_scope(summary: str | None, demo: bool) -> bool:
    marked = is_demo_scan(summary)
    return marked if demo else not marked
