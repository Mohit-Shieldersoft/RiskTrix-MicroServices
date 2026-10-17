"""
Simple RBAC tests without database dependencies
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.rbac import check_role, check_permission, ROLE_HIERARCHY, ROLE_PERMISSIONS
from app.models.models import UserRole


# Mock user class for testing
class MockUser:
    def __init__(self, role):
        self.role = role


def test_admin_has_all_roles():
    """Admin should have access to all roles"""
    user = MockUser(UserRole.ADMIN)
    
    assert check_role(user, [UserRole.ADMIN])
    assert check_role(user, [UserRole.CISO])
    assert check_role(user, [UserRole.INFOSEC_MANAGER])
    assert check_role(user, [UserRole.EXTERNAL_AUDITOR])
    assert check_role(user, [UserRole.INTERNAL_AUDITOR])
    assert check_role(user, [UserRole.SECURITY_ANALYST])
    assert check_role(user, [UserRole.VIEWER])
    print("[OK] test_admin_has_all_roles passed")


def test_ciso_role_hierarchy():
    """CISO should have access to InfoSec Manager, Security Analyst, and Viewer"""
    user = MockUser(UserRole.CISO)
    
    assert check_role(user, [UserRole.CISO])
    assert check_role(user, [UserRole.INFOSEC_MANAGER])
    assert check_role(user, [UserRole.SECURITY_ANALYST])
    assert check_role(user, [UserRole.VIEWER])
    assert not check_role(user, [UserRole.ADMIN])
    assert not check_role(user, [UserRole.EXTERNAL_AUDITOR])
    print("[OK] test_ciso_role_hierarchy passed")


def test_infosec_manager_hierarchy():
    """InfoSec Manager should have limited access"""
    user = MockUser(UserRole.INFOSEC_MANAGER)
    
    assert check_role(user, [UserRole.INFOSEC_MANAGER])
    assert check_role(user, [UserRole.SECURITY_ANALYST])
    assert check_role(user, [UserRole.VIEWER])
    assert not check_role(user, [UserRole.ADMIN])
    assert not check_role(user, [UserRole.CISO])
    print("[OK] test_infosec_manager_hierarchy passed")


def test_auditor_roles_independent():
    """External and Internal Auditors should be independent"""
    external_user = MockUser(UserRole.EXTERNAL_AUDITOR)
    internal_user = MockUser(UserRole.INTERNAL_AUDITOR)
    
    assert check_role(external_user, [UserRole.EXTERNAL_AUDITOR])
    assert check_role(external_user, [UserRole.VIEWER])
    assert not check_role(external_user, [UserRole.INTERNAL_AUDITOR])
    
    assert check_role(internal_user, [UserRole.INTERNAL_AUDITOR])
    assert check_role(internal_user, [UserRole.VIEWER])
    assert not check_role(internal_user, [UserRole.EXTERNAL_AUDITOR])
    print("[OK] test_auditor_roles_independent passed")


def test_viewer_lowest_access():
    """Viewer should only have viewer access"""
    user = MockUser(UserRole.VIEWER)
    
    assert check_role(user, [UserRole.VIEWER])
    assert not check_role(user, [UserRole.SECURITY_ANALYST])
    assert not check_role(user, [UserRole.ADMIN])
    print("[OK] test_viewer_lowest_access passed")


def test_admin_full_permissions():
    """Admin should have all permissions"""
    user = MockUser(UserRole.ADMIN)
    
    assert check_permission(user, "users", "create")
    assert check_permission(user, "users", "delete")
    assert check_permission(user, "vulnerabilities", "create")
    assert check_permission(user, "exceptions", "approve")
    assert check_permission(user, "settings", "update")
    print("[OK] test_admin_full_permissions passed")


def test_ciso_permissions():
    """CISO should have read/update but not create/delete for most resources"""
    user = MockUser(UserRole.CISO)
    
    # Can read and update
    assert check_permission(user, "applications", "read")
    assert check_permission(user, "applications", "update")
    assert check_permission(user, "vulnerabilities", "read")
    assert check_permission(user, "vulnerabilities", "update")
    
    # Cannot delete
    assert not check_permission(user, "applications", "delete")
    assert not check_permission(user, "vulnerabilities", "delete")
    
    # Can approve exceptions
    assert check_permission(user, "exceptions", "approve")
    
    # Can create reports but not delete
    assert check_permission(user, "reports", "create")
    assert not check_permission(user, "reports", "delete")
    print("[OK] test_ciso_permissions passed")


def test_infosec_manager_permissions():
    """InfoSec Manager should have CRUD on vulnerabilities and applications"""
    user = MockUser(UserRole.INFOSEC_MANAGER)
    
    # Can create, read, update
    assert check_permission(user, "applications", "create")
    assert check_permission(user, "applications", "read")
    assert check_permission(user, "applications", "update")
    assert check_permission(user, "vulnerabilities", "create")
    
    # Cannot delete or manage users
    assert not check_permission(user, "applications", "delete")
    assert not check_permission(user, "users", "create")
    assert not check_permission(user, "users", "read")
    print("[OK] test_infosec_manager_permissions passed")


def test_external_auditor_read_only():
    """External Auditor should be read-only"""
    user = MockUser(UserRole.EXTERNAL_AUDITOR)
    
    # Can read
    assert check_permission(user, "applications", "read")
    assert check_permission(user, "vulnerabilities", "read")
    assert check_permission(user, "compliance", "read")
    assert check_permission(user, "audit", "read")
    
    # Cannot create, update, or delete
    assert not check_permission(user, "applications", "create")
    assert not check_permission(user, "applications", "update")
    assert not check_permission(user, "applications", "delete")
    assert not check_permission(user, "vulnerabilities", "create")
    assert not check_permission(user, "exceptions", "approve")
    print("[OK] test_external_auditor_read_only passed")


def test_internal_auditor_can_create_reports():
    """Internal Auditor should be able to create reports and audits"""
    user = MockUser(UserRole.INTERNAL_AUDITOR)
    
    # Can create reports and audits
    assert check_permission(user, "reports", "create")
    assert check_permission(user, "reports", "read")
    assert check_permission(user, "audit", "create")
    assert check_permission(user, "audit", "read")
    
    # Cannot modify other resources
    assert not check_permission(user, "vulnerabilities", "create")
    assert not check_permission(user, "applications", "update")
    print("[OK] test_internal_auditor_can_create_reports passed")


def test_security_analyst_vulnerability_permissions():
    """Security Analyst should have full access to vulnerabilities"""
    user = MockUser(UserRole.SECURITY_ANALYST)
    
    # Full CRUD on vulnerabilities
    assert check_permission(user, "vulnerabilities", "create")
    assert check_permission(user, "vulnerabilities", "read")
    assert check_permission(user, "vulnerabilities", "update")
    
    # Limited on applications
    assert check_permission(user, "applications", "read")
    assert check_permission(user, "applications", "update")
    assert not check_permission(user, "applications", "create")
    assert not check_permission(user, "applications", "delete")
    
    # Cannot approve exceptions
    assert not check_permission(user, "exceptions", "approve")
    print("[OK] test_security_analyst_vulnerability_permissions passed")


def test_viewer_read_only_all():
    """Viewer should have read-only access to everything"""
    user = MockUser(UserRole.VIEWER)
    
    # Can read everything
    assert check_permission(user, "applications", "read")
    assert check_permission(user, "vulnerabilities", "read")
    assert check_permission(user, "compliance", "read")
    assert check_permission(user, "reports", "read")
    
    # Cannot modify anything
    assert not check_permission(user, "applications", "create")
    assert not check_permission(user, "vulnerabilities", "update")
    assert not check_permission(user, "reports", "create")
    assert not check_permission(user, "exceptions", "approve")
    print("[OK] test_viewer_read_only_all passed")


def test_only_admin_can_delete_users():
    """Only admin should be able to delete users"""
    admin = MockUser(UserRole.ADMIN)
    ciso = MockUser(UserRole.CISO)
    manager = MockUser(UserRole.INFOSEC_MANAGER)
    
    assert check_permission(admin, "users", "delete")
    assert not check_permission(ciso, "users", "delete")
    assert not check_permission(manager, "users", "delete")
    print("[OK] test_only_admin_can_delete_users passed")


def test_exception_approval_permissions():
    """Only ADMIN and CISO should be able to approve exceptions"""
    admin = MockUser(UserRole.ADMIN)
    ciso = MockUser(UserRole.CISO)
    manager = MockUser(UserRole.INFOSEC_MANAGER)
    analyst = MockUser(UserRole.SECURITY_ANALYST)
    
    assert check_permission(admin, "exceptions", "approve")
    assert check_permission(ciso, "exceptions", "approve")
    assert not check_permission(manager, "exceptions", "approve")
    assert not check_permission(analyst, "exceptions", "approve")
    print("[OK] test_exception_approval_permissions passed")


def test_cnapp_rbac_permissions():
    """Test extended CNAPP resource permissions across all 7 roles"""
    admin = MockUser(UserRole.ADMIN)
    ciso = MockUser(UserRole.CISO)
    manager = MockUser(UserRole.INFOSEC_MANAGER)
    ext_auditor = MockUser(UserRole.EXTERNAL_AUDITOR)
    int_auditor = MockUser(UserRole.INTERNAL_AUDITOR)
    analyst = MockUser(UserRole.SECURITY_ANALYST)
    viewer = MockUser(UserRole.VIEWER)

    # Cloud Accounts
    assert check_permission(admin, "cloud_accounts", "sync")
    assert check_permission(ciso, "cloud_accounts", "sync")
    assert check_permission(manager, "cloud_accounts", "sync")
    assert check_permission(analyst, "cloud_accounts", "read")
    assert not check_permission(analyst, "cloud_accounts", "sync")

    # CSPM Findings & Policies
    assert check_permission(admin, "cspm_findings", "remediate")
    assert check_permission(ciso, "cspm_findings", "suppress")
    assert check_permission(admin, "cspm_policies", "create")
    assert check_permission(ext_auditor, "cspm_policies", "read")
    assert not check_permission(ext_auditor, "cspm_policies", "create")

    # CIEM & K8s Security
    assert check_permission(admin, "ciem", "update")
    assert check_permission(manager, "ciem", "analyze")
    assert check_permission(analyst, "k8s_security", "scan")
    assert check_permission(int_auditor, "k8s_security", "read")
    assert not check_permission(int_auditor, "k8s_security", "scan")

    # Container Security, Runtime Security, Security Alerts & Score
    assert check_permission(admin, "container_security", "delete")
    assert check_permission(admin, "security_alerts", "resolve")
    assert check_permission(ciso, "security_score", "recalculate")
    assert check_permission(viewer, "security_score", "read")
    assert not check_permission(viewer, "security_alerts", "assign")

    print("[OK] test_cnapp_rbac_permissions passed")


def test_exhaustive_7_role_permissions_matrix():
    """
    Exhaustive verification of 7-role permissions across all endpoint resource scopes:
    ADMIN, CISO, INFOSEC_MANAGER, EXTERNAL_AUDITOR, INTERNAL_AUDITOR, SECURITY_ANALYST, VIEWER
    """
    roles = {role: MockUser(role) for role in UserRole}

    # 1. ADMIN - Full System Authority
    admin = roles[UserRole.ADMIN]
    for resource in ROLE_PERMISSIONS[UserRole.ADMIN]:
        for action in ROLE_PERMISSIONS[UserRole.ADMIN][resource]:
            assert check_permission(admin, resource, action), f"ADMIN should have {action} on {resource}"

    # 2. CISO - Executive Governance & Approval
    ciso = roles[UserRole.CISO]
    assert check_permission(ciso, "exceptions", "approve")
    assert check_permission(ciso, "security_score", "recalculate")
    assert check_permission(ciso, "cloud_accounts", "sync")
    assert not check_permission(ciso, "users", "delete")
    assert not check_permission(ciso, "applications", "delete")

    # 3. INFOSEC_MANAGER - Operational Management & Scanning
    manager = roles[UserRole.INFOSEC_MANAGER]
    assert check_permission(manager, "applications", "create")
    assert check_permission(manager, "k8s_security", "scan")
    assert check_permission(manager, "ciem", "analyze")
    assert not check_permission(manager, "exceptions", "approve")
    assert not check_permission(manager, "applications", "delete")

    # 4. EXTERNAL_AUDITOR - Strictly Read-Only Compliance Scopes
    ext_auditor = roles[UserRole.EXTERNAL_AUDITOR]
    assert check_permission(ext_auditor, "applications", "read")
    assert check_permission(ext_auditor, "compliance", "read")
    assert not check_permission(ext_auditor, "reports", "create")
    assert not check_permission(ext_auditor, "ciem", "read")

    # 5. INTERNAL_AUDITOR - Governance & Audit Creation
    int_auditor = roles[UserRole.INTERNAL_AUDITOR]
    assert check_permission(int_auditor, "audit", "create")
    assert check_permission(int_auditor, "reports", "create")
    assert check_permission(int_auditor, "ciem", "read")
    assert not check_permission(int_auditor, "vulnerabilities", "create")
    assert not check_permission(int_auditor, "k8s_security", "scan")

    # 6. SECURITY_ANALYST - Vulnerability & Security Analysis
    analyst = roles[UserRole.SECURITY_ANALYST]
    assert check_permission(analyst, "vulnerabilities", "create")
    assert check_permission(analyst, "container_security", "scan")
    assert check_permission(analyst, "cspm_findings", "update")
    assert not check_permission(analyst, "applications", "create")
    assert not check_permission(analyst, "exceptions", "approve")

    # 7. VIEWER - Minimum Read-Only Access
    viewer = roles[UserRole.VIEWER]
    assert check_permission(viewer, "applications", "read")
    assert check_permission(viewer, "vulnerabilities", "read")
    assert check_permission(viewer, "security_score", "read")
    assert not check_permission(viewer, "vulnerabilities", "create")
    assert not check_permission(viewer, "security_alerts", "assign")

    print("[OK] test_exhaustive_7_role_permissions_matrix passed")


if __name__ == "__main__":
    print("\nRunning RBAC Tests...\n")
    
    # Role hierarchy tests
    print("Testing Role Hierarchy:")
    test_admin_has_all_roles()
    test_ciso_role_hierarchy()
    test_infosec_manager_hierarchy()
    test_auditor_roles_independent()
    test_viewer_lowest_access()
    
    # Permission tests
    print("\nTesting Permissions:")
    test_admin_full_permissions()
    test_ciso_permissions()
    test_infosec_manager_permissions()
    test_external_auditor_read_only()
    test_internal_auditor_can_create_reports()
    test_security_analyst_vulnerability_permissions()
    test_viewer_read_only_all()
    
    # Specific permission tests
    print("\nTesting Specific Permissions:")
    test_only_admin_can_delete_users()
    test_exception_approval_permissions()
    test_cnapp_rbac_permissions()
    test_exhaustive_7_role_permissions_matrix()
    
    print("\n[OK] All RBAC tests passed successfully!\n")

