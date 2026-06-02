"""
Integration tests for RBAC enforcement on API endpoints.

Strategy: use FastAPI dependency_overrides to inject mock users with specific
roles.  403-path tests never reach the database, so they are fully
deterministic without a running DB.  200-path tests assert only that the
RBAC gate was passed (status_code != 403) — the route may still return 500
if a database is unavailable, but that is outside the scope of RBAC testing.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock

from app.main import app
from app.modules.shared.api.auth import get_current_user


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _mock_user(role: str, user_id: int = 1):
    """Return a minimal mock SQLAlchemy-style user with the given role."""
    user = MagicMock()
    user.id = user_id
    user.email = f"{role}@test.com"
    user.is_active = True
    # Simulate SQLAlchemy enum: user.role.value == role
    user.role.value = role
    return user


def _override(role: str):
    """FastAPI dependency that returns a mock user for the given role."""
    mock = _mock_user(role)

    async def _get_user():
        return mock

    return _get_user


@pytest.fixture
def client():
    """Sync TestClient; each test manages dependency_overrides itself."""
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


# ---------------------------------------------------------------------------
# Users endpoint — admin only
# ---------------------------------------------------------------------------

class TestUserEndpointRBAC:
    """All user-management endpoints must be restricted to admin."""

    def test_ciso_cannot_list_users(self, client):
        app.dependency_overrides[get_current_user] = _override("ciso")
        try:
            assert client.get("/api/v1/users").status_code == 403
        finally:
            app.dependency_overrides.clear()

    def test_viewer_cannot_list_users(self, client):
        app.dependency_overrides[get_current_user] = _override("viewer")
        try:
            assert client.get("/api/v1/users").status_code == 403
        finally:
            app.dependency_overrides.clear()

    def test_security_analyst_cannot_list_users(self, client):
        app.dependency_overrides[get_current_user] = _override("security_analyst")
        try:
            assert client.get("/api/v1/users").status_code == 403
        finally:
            app.dependency_overrides.clear()

    def test_infosec_manager_cannot_create_user(self, client):
        app.dependency_overrides[get_current_user] = _override("infosec_manager")
        try:
            resp = client.post("/api/v1/users", json={
                "email": "new@test.com", "username": "new", "password": "Pass@123"
            })
            assert resp.status_code == 403
        finally:
            app.dependency_overrides.clear()

    def test_external_auditor_cannot_delete_user(self, client):
        app.dependency_overrides[get_current_user] = _override("external_auditor")
        try:
            assert client.delete("/api/v1/users/1").status_code == 403
        finally:
            app.dependency_overrides.clear()

    def test_unauthenticated_cannot_list_users(self, client):
        app.dependency_overrides.clear()
        # No auth → 401 or 403 depending on FastAPI HTTPBearer behaviour
        assert client.get("/api/v1/users").status_code in (401, 403)

    def test_admin_rbac_gate_passes(self, client):
        """Admin should pass the RBAC gate (status_code must not be 403)."""
        app.dependency_overrides[get_current_user] = _override("admin")
        try:
            assert client.get("/api/v1/users").status_code != 403
        finally:
            app.dependency_overrides.clear()

    def test_admin_rbac_gate_passes_for_delete(self, client):
        app.dependency_overrides[get_current_user] = _override("admin")
        try:
            # 404 (user not found) is acceptable — gate was passed
            assert client.delete("/api/v1/users/999999").status_code != 403
        finally:
            app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Exception approval — CISO and Admin only
# ---------------------------------------------------------------------------

class TestExceptionApprovalRBAC:
    """POST /exceptions/{id}/approve must be restricted to CISO and Admin."""

    def test_ciso_rbac_gate_passes(self, client):
        app.dependency_overrides[get_current_user] = _override("ciso")
        try:
            resp = client.post("/api/v1/exceptions/999999/approve?approval_status=approved")
            assert resp.status_code != 403
        finally:
            app.dependency_overrides.clear()

    def test_admin_rbac_gate_passes(self, client):
        app.dependency_overrides[get_current_user] = _override("admin")
        try:
            resp = client.post("/api/v1/exceptions/999999/approve?approval_status=approved")
            assert resp.status_code != 403
        finally:
            app.dependency_overrides.clear()

    def test_infosec_manager_forbidden(self, client):
        app.dependency_overrides[get_current_user] = _override("infosec_manager")
        try:
            resp = client.post("/api/v1/exceptions/1/approve?approval_status=approved")
            assert resp.status_code == 403
        finally:
            app.dependency_overrides.clear()

    def test_internal_auditor_forbidden(self, client):
        app.dependency_overrides[get_current_user] = _override("internal_auditor")
        try:
            resp = client.post("/api/v1/exceptions/1/approve?approval_status=approved")
            assert resp.status_code == 403
        finally:
            app.dependency_overrides.clear()

    def test_security_analyst_forbidden(self, client):
        app.dependency_overrides[get_current_user] = _override("security_analyst")
        try:
            resp = client.post("/api/v1/exceptions/1/approve?approval_status=approved")
            assert resp.status_code == 403
        finally:
            app.dependency_overrides.clear()

    def test_viewer_forbidden(self, client):
        app.dependency_overrides[get_current_user] = _override("viewer")
        try:
            resp = client.post("/api/v1/exceptions/1/approve?approval_status=approved")
            assert resp.status_code == 403
        finally:
            app.dependency_overrides.clear()

    def test_unauthenticated_forbidden(self, client):
        app.dependency_overrides.clear()
        resp = client.post("/api/v1/exceptions/1/approve?approval_status=approved")
        assert resp.status_code in (401, 403)


# ---------------------------------------------------------------------------
# General authentication enforcement
# ---------------------------------------------------------------------------

class TestUnauthenticatedBlocked:
    """Unauthenticated requests must be rejected on all protected routes."""

    @pytest.mark.parametrize("method,path", [
        ("GET",    "/api/v1/applications"),
        ("GET",    "/api/v1/vulnerabilities"),
        ("GET",    "/api/v1/vendors"),
        ("GET",    "/api/v1/dashboard"),
        ("GET",    "/api/v1/reports"),
        ("GET",    "/api/v1/audit/statistics"),
        ("GET",    "/api/v1/exceptions"),
        ("GET",    "/api/v1/tprm"),
    ])
    def test_protected_route_requires_auth(self, client, method, path):
        app.dependency_overrides.clear()
        resp = getattr(client, method.lower())(path)
        assert resp.status_code in (401, 403), (
            f"{method} {path} returned {resp.status_code}; expected 401 or 403"
        )

    def test_auth_login_is_public(self, client):
        """The login endpoint must not require authentication."""
        app.dependency_overrides.clear()
        resp = client.post("/api/v1/auth/login", json={"email": "x@y.com", "password": "x"})
        # May return 401 (bad creds) but must not return 403 (access denied)
        assert resp.status_code != 403


class TestAuthenticatedPasses:
    """Authenticated users with correct permissions must pass the RBAC gate."""

    def test_viewer_can_read_applications(self, client):
        app.dependency_overrides[get_current_user] = _override("viewer")
        try:
            resp = client.get("/api/v1/applications")
            assert resp.status_code not in (401, 403)
        finally:
            app.dependency_overrides.clear()

    def test_viewer_can_read_vendors(self, client):
        app.dependency_overrides[get_current_user] = _override("viewer")
        try:
            resp = client.get("/api/v1/vendors")
            assert resp.status_code not in (401, 403)
        finally:
            app.dependency_overrides.clear()

    def test_any_authenticated_user_can_read_dashboard(self, client):
        app.dependency_overrides[get_current_user] = _override("external_auditor")
        try:
            resp = client.get("/api/v1/dashboard")
            assert resp.status_code not in (401, 403)
        finally:
            app.dependency_overrides.clear()


class TestSettingsEndpointRBAC:
    """Test RBAC on settings endpoints"""

    def test_admin_can_update_settings(self, client):
        """Admin should be able to update settings"""
        app.dependency_overrides[get_current_user] = _override("admin")
        try:
            response = client.patch(
                "/api/v1/settings",
                json={"notification_enabled": True, "max_login_attempts": 5},
            )
            assert response.status_code in [200, 404, 422], (
                f"admin should not get 403 on PATCH /settings, got {response.status_code}"
            )
        finally:
            app.dependency_overrides.clear()

    def test_ciso_can_read_settings(self, client):
        """CISO should be able to read settings"""
        app.dependency_overrides[get_current_user] = _override("ciso")
        try:
            response = client.get("/api/v1/settings")
            assert response.status_code in [200, 404], (
                f"ciso should not get 403 on GET /settings, got {response.status_code}"
            )
        finally:
            app.dependency_overrides.clear()

    def test_viewer_cannot_update_settings(self, client):
        """Viewer should not be able to update settings"""
        app.dependency_overrides[get_current_user] = _override("viewer")
        try:
            response = client.patch(
                "/api/v1/settings",
                json={"notification_enabled": False},
            )
            assert response.status_code in [403, 404], (
                f"viewer should be denied PATCH /settings, got {response.status_code}"
            )
        finally:
            app.dependency_overrides.clear()


class TestRoleHierarchyInEndpoints:
    """Test that role hierarchy works correctly in endpoints"""

    def test_admin_has_access_to_all_endpoints(self, client):
        """Admin should have access to all protected endpoints"""
        app.dependency_overrides[get_current_user] = _override("admin")
        try:
            endpoints = [
                ("GET", "/api/v1/users"),
                ("GET", "/api/v1/applications"),
                ("GET", "/api/v1/vulnerabilities"),
                ("GET", "/api/v1/reports"),
            ]
            for method, endpoint in endpoints:
                response = client.request(method, endpoint)
                assert response.status_code != 403, (
                    f"admin should never get 403 on {method} {endpoint}, got {response.status_code}"
                )
        finally:
            app.dependency_overrides.clear()

    def test_ciso_inherits_infosec_manager_permissions(self, client):
        """CISO should have all InfoSec Manager permissions"""
        app.dependency_overrides[get_current_user] = _override("ciso")
        try:
            response = client.get("/api/v1/applications")
            assert response.status_code not in (401, 403), (
                f"ciso should be allowed on GET /applications, got {response.status_code}"
            )
        finally:
            app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Automation — view restricted to admin / ciso / infosec_manager
# ---------------------------------------------------------------------------

class TestAutomationRBAC:
    """
    Automation endpoints must only be reachable by admin, ciso, and
    infosec_manager.  All other roles (auditors, analyst, viewer) must
    receive 403.
    """

    _ALLOWED   = ["admin", "ciso", "infosec_manager"]
    _FORBIDDEN = ["external_auditor", "internal_auditor", "security_analyst", "viewer"]

    # ── allowed roles ────────────────────────────────────────────────────────

    @pytest.mark.parametrize("role", _ALLOWED)
    def test_allowed_roles_can_list_rules(self, client, role):
        app.dependency_overrides[get_current_user] = _override(role)
        try:
            resp = client.get("/api/v1/automation/rules")
            assert resp.status_code not in (401, 403), (
                f"[{role}] should be allowed to GET /automation/rules but got {resp.status_code}"
            )
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.parametrize("role", _ALLOWED)
    def test_allowed_roles_can_read_stats(self, client, role):
        app.dependency_overrides[get_current_user] = _override(role)
        try:
            resp = client.get("/api/v1/automation/stats")
            assert resp.status_code not in (401, 403), (
                f"[{role}] should be allowed to GET /automation/stats but got {resp.status_code}"
            )
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.parametrize("role", _ALLOWED)
    def test_allowed_roles_can_list_executions(self, client, role):
        app.dependency_overrides[get_current_user] = _override(role)
        try:
            resp = client.get("/api/v1/automation/executions")
            assert resp.status_code not in (401, 403), (
                f"[{role}] should be allowed to GET /automation/executions but got {resp.status_code}"
            )
        finally:
            app.dependency_overrides.clear()

    # ── forbidden roles ──────────────────────────────────────────────────────

    @pytest.mark.parametrize("role", _FORBIDDEN)
    def test_forbidden_roles_cannot_list_rules(self, client, role):
        app.dependency_overrides[get_current_user] = _override(role)
        try:
            resp = client.get("/api/v1/automation/rules")
            assert resp.status_code == 403, (
                f"[{role}] should be DENIED GET /automation/rules but got {resp.status_code}"
            )
        finally:
            app.dependency_overrides.clear()

    @pytest.mark.parametrize("role", _FORBIDDEN)
    def test_forbidden_roles_cannot_read_stats(self, client, role):
        app.dependency_overrides[get_current_user] = _override(role)
        try:
            resp = client.get("/api/v1/automation/stats")
            assert resp.status_code == 403, (
                f"[{role}] should be DENIED GET /automation/stats but got {resp.status_code}"
            )
        finally:
            app.dependency_overrides.clear()

    # ── create/delete restricted to admin/ciso only ──────────────────────────

    def test_infosec_manager_cannot_create_rule(self, client):
        """infosec_manager can VIEW automation but not CREATE."""
        app.dependency_overrides[get_current_user] = _override("infosec_manager")
        try:
            resp = client.post("/api/v1/automation/rules", json={
                "name": "test", "trigger_type": "manual"
            })
            assert resp.status_code == 403, (
                f"infosec_manager should not be able to create automation rules, got {resp.status_code}"
            )
        finally:
            app.dependency_overrides.clear()

    def test_admin_can_create_rule(self, client):
        app.dependency_overrides[get_current_user] = _override("admin")
        try:
            resp = client.post("/api/v1/automation/rules", json={
                "name": "test", "trigger_type": "manual"
            })
            # Gate passes — 201 created or DB error (500) both mean the route was reached
            assert resp.status_code != 403, (
                f"admin should be allowed to create automation rules, got {resp.status_code}"
            )
        finally:
            app.dependency_overrides.clear()

    def test_admin_can_delete_rule(self, client):
        app.dependency_overrides[get_current_user] = _override("admin")
        try:
            resp = client.delete("/api/v1/automation/rules/999999")
            assert resp.status_code != 403, (
                f"admin should be allowed to delete automation rules, got {resp.status_code}"
            )
        finally:
            app.dependency_overrides.clear()

    def test_ciso_can_create_rule(self, client):
        app.dependency_overrides[get_current_user] = _override("ciso")
        try:
            resp = client.post("/api/v1/automation/rules", json={
                "name": "test", "trigger_type": "manual"
            })
            assert resp.status_code != 403, (
                f"ciso should be allowed to create automation rules, got {resp.status_code}"
            )
        finally:
            app.dependency_overrides.clear()

    # ── unauthenticated ──────────────────────────────────────────────────────

    def test_unauthenticated_cannot_access_automation(self, client):
        app.dependency_overrides.clear()
        for path in ("/api/v1/automation/rules", "/api/v1/automation/stats",
                     "/api/v1/automation/executions"):
            resp = client.get(path)
            assert resp.status_code in (401, 403), (
                f"[anon] should be blocked from GET {path} but got {resp.status_code}"
            )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
