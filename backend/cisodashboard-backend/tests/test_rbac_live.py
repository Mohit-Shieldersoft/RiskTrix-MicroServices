"""
Live RBAC Integration Tests
============================
Runs against the real API at localhost:8000 with real JWT tokens.
Each test user logs in, then key permission-sensitive endpoints are verified.

Usage:
    python -m pytest tests/test_rbac_live.py -v
    # or run standalone:
    python tests/test_rbac_live.py

Requirements: docker compose must be up with all containers running.
"""
import sys
import requests

BASE = "http://localhost:8000/api/v1"

# ---------------------------------------------------------------------------
# Test accounts (must all exist in the DB)
# ---------------------------------------------------------------------------
USERS = {
    "admin":            {"email": "admin@risktrix.com",       "password": "Admin@123"},
    "ciso":             {"email": "ciso@risktrix.com",         "password": "Test@12345"},
    "infosec_manager":  {"email": "manager@risktrix.com",      "password": "Test@12345"},
    "internal_auditor": {"email": "int.auditor@risktrix.com",  "password": "Test@12345"},
    "external_auditor": {"email": "ext.auditor@risktrix.com",  "password": "Test@12345"},
    "security_analyst": {"email": "analyst@risktrix.com",      "password": "Test@12345"},
    "viewer":           {"email": "testviewer@risktrix.com",   "password": "Test@12345"},
}

# ---------------------------------------------------------------------------
# Permission matrix — derived from permissions.js
# Format: (endpoint, method, allowed_roles, description)
# ---------------------------------------------------------------------------
TESTS = [
    # ── Users (admin only) ─────────────────────────────────────────────────
    ("GET",  "/users",   ["admin"],
     "List users — admin only"),
    ("POST", "/users",   ["admin"],
     "Create user — admin only"),

    # ── Dashboard (all roles) ──────────────────────────────────────────────
    ("GET",  "/dashboard", ["admin","ciso","infosec_manager","internal_auditor","external_auditor","security_analyst","viewer"],
     "Dashboard — all authenticated"),

    # ── Applications ──────────────────────────────────────────────────────
    ("GET",  "/applications", ["admin","ciso","infosec_manager","internal_auditor","external_auditor","security_analyst","viewer"],
     "List applications — all authenticated"),

    # ── Vulnerabilities ────────────────────────────────────────────────────
    ("GET",  "/vulnerabilities", ["admin","ciso","infosec_manager","internal_auditor","external_auditor","security_analyst","viewer"],
     "List vulnerabilities — all authenticated"),

    # ── Vendors ────────────────────────────────────────────────────────────
    ("GET",  "/vendors", ["admin","ciso","infosec_manager","internal_auditor","external_auditor","security_analyst","viewer"],
     "List vendors — all authenticated"),

    # ── Compliance ─────────────────────────────────────────────────────────
    ("GET",  "/compliance", ["admin","ciso","infosec_manager","internal_auditor","external_auditor","security_analyst","viewer"],
     "Compliance — all authenticated"),

    # ── Exceptions ────────────────────────────────────────────────────────
    ("GET",  "/exceptions", ["admin","ciso","infosec_manager","internal_auditor","external_auditor","security_analyst","viewer"],
     "List exceptions — all authenticated"),

    # ── Automation ────────────────────────────────────────────────────────
    ("GET",  "/automation/rules",  ["admin","ciso","infosec_manager"],
     "Automation rules — admin/ciso/infosec_manager only"),
    ("GET",  "/automation/stats",  ["admin","ciso","infosec_manager"],
     "Automation stats — admin/ciso/infosec_manager only"),
    ("POST", "/automation/rules",  ["admin","ciso"],
     "Create automation rule — admin/ciso only"),

    # ── TPRM ──────────────────────────────────────────────────────────────
    ("GET",  "/tprm", ["admin","ciso","infosec_manager","internal_auditor","external_auditor","security_analyst","viewer"],
     "TPRM — all authenticated"),
]

ALL_ROLES = list(USERS.keys())


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_token_cache: dict[str, str] = {}


def get_token(role: str) -> str | None:
    if role in _token_cache:
        return _token_cache[role]
    creds = USERS[role]
    try:
        r = requests.post(f"{BASE}/auth/login", json=creds, timeout=10)
        if r.status_code == 200:
            tok = r.json().get("access_token")
            _token_cache[role] = tok
            return tok
        print(f"  [LOGIN FAIL] {role}: HTTP {r.status_code} — {r.text[:120]}")
    except Exception as e:
        print(f"  [LOGIN ERROR] {role}: {e}")
    return None


def call(method: str, path: str, token: str | None) -> int:
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    try:
        r = requests.request(method, f"{BASE}{path}", headers=headers, timeout=10)
        return r.status_code
    except Exception as e:
        print(f"  [REQUEST ERROR] {method} {path}: {e}")
        return -1


# ---------------------------------------------------------------------------
# Test runner
# ---------------------------------------------------------------------------

def run() -> bool:
    print("\n" + "=" * 70)
    print("  RiskTrix Live RBAC Test Suite")
    print("=" * 70)

    # Pre-login all users
    tokens: dict[str, str | None] = {}
    print("\n[1/2] Logging in all test users …")
    all_login_ok = True
    for role in ALL_ROLES:
        tok = get_token(role)
        tokens[role] = tok
        status = "✅" if tok else "❌"
        print(f"  {status}  {role}")
        if not tok:
            all_login_ok = False

    if not all_login_ok:
        print("\n⚠  Some logins failed — make sure all test users exist in the DB.")
        print("   Run: docker exec -i micro-ciso-postgres psql -U postgres -d risktrix_db -c \"SELECT email, role FROM users;\"")

    # Run permission tests
    print("\n[2/2] Running permission matrix tests …\n")
    passed = 0
    failed = 0
    failures = []

    for method, path, allowed_roles, desc in TESTS:
        denied_roles = [r for r in ALL_ROLES if r not in allowed_roles]

        # Every allowed role must pass the gate (status != 401 and != 403)
        for role in allowed_roles:
            tok = tokens.get(role)
            if tok is None:
                print(f"  ⚠  SKIP  [{role}] {method} {path}  (no token)")
                continue
            code = call(method, path, tok)
            if code in (401, 403):
                msg = f"FAIL  [{role}] should ALLOW  {method} {path} → got {code}"
                print(f"  ❌  {msg}")
                failures.append(msg)
                failed += 1
            else:
                print(f"  ✅  PASS  [{role}] can {method} {path} → {code}")
                passed += 1

        # Every denied role must be blocked (401 or 403)
        for role in denied_roles:
            tok = tokens.get(role)
            if tok is None:
                print(f"  ⚠  SKIP  [{role}] {method} {path}  (no token)")
                continue
            code = call(method, path, tok)
            if code not in (401, 403):
                msg = f"FAIL  [{role}] should DENY   {method} {path} → got {code}"
                print(f"  ❌  {msg}")
                failures.append(msg)
                failed += 1
            else:
                print(f"  ✅  PASS  [{role}] blocked from {method} {path} → {code}")
                passed += 1

    # Unauthenticated must be blocked on protected routes
    print("\n  --- Unauthenticated access check ---")
    for method, path, _, _ in TESTS:
        if path in ("/auth/login",):
            continue
        code = call(method, path, None)
        if code in (401, 403):
            print(f"  ✅  PASS  [anon] blocked from {method} {path} → {code}")
            passed += 1
        else:
            msg = f"FAIL  [anon] should be blocked from {method} {path} → got {code}"
            print(f"  ❌  {msg}")
            failures.append(msg)
            failed += 1

    # Summary
    print("\n" + "=" * 70)
    print(f"  Results: {passed} passed, {failed} failed")
    if failures:
        print("\n  Failed tests:")
        for f in failures:
            print(f"    • {f}")
    else:
        print("  All tests passed! ✅")
    print("=" * 70 + "\n")

    return failed == 0


# ---------------------------------------------------------------------------
# pytest compatibility — expose as individual test functions
# ---------------------------------------------------------------------------

import pytest


@pytest.fixture(scope="module")
def tokens_fixture():
    """Login all users once per module and return token map."""
    return {role: get_token(role) for role in ALL_ROLES}


@pytest.mark.parametrize("method,path,allowed_roles,desc", TESTS)
@pytest.mark.parametrize("role", ALL_ROLES)
def test_rbac_matrix(role, method, path, allowed_roles, desc, tokens_fixture):
    token = tokens_fixture.get(role)
    if token is None:
        pytest.skip(f"Could not log in as {role} — check test user credentials")

    code = call(method, path, token)
    is_allowed = role in allowed_roles

    if is_allowed:
        assert code not in (401, 403), (
            f"[{role}] should be ALLOWED for {method} {path} ({desc}) but got {code}"
        )
    else:
        assert code in (401, 403), (
            f"[{role}] should be DENIED for {method} {path} ({desc}) but got {code}"
        )


@pytest.mark.parametrize("method,path,allowed_roles,desc", TESTS)
def test_unauthenticated_blocked(method, path, allowed_roles, desc):
    if path == "/auth/login":
        pytest.skip("Login endpoint is intentionally public")
    code = call(method, path, None)
    assert code in (401, 403), (
        f"[anon] should be blocked from {method} {path} but got {code}"
    )


# ---------------------------------------------------------------------------
# Standalone entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    ok = run()
    sys.exit(0 if ok else 1)
