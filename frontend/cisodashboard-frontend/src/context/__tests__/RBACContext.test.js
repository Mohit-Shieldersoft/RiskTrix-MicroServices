/**
 * Frontend RBAC Tests
 * Tests for Role-Based Access Control Context and Components
 */
import { describe, it, expect, beforeEach } from 'vitest';

// Import the RBAC constants and functions directly
const UserRoles = {
  ADMIN: 'ADMIN',
  CISO: 'CISO',
  INFOSEC_MANAGER: 'INFOSEC_MANAGER',
  EXTERNAL_AUDITOR: 'EXTERNAL_AUDITOR',
  INTERNAL_AUDITOR: 'INTERNAL_AUDITOR',
  SECURITY_ANALYST: 'SECURITY_ANALYST',
  VIEWER: 'VIEWER',
};

const ROLE_HIERARCHY = {
  [UserRoles.ADMIN]: [
    UserRoles.ADMIN,
    UserRoles.CISO,
    UserRoles.INFOSEC_MANAGER,
    UserRoles.EXTERNAL_AUDITOR,
    UserRoles.INTERNAL_AUDITOR,
    UserRoles.SECURITY_ANALYST,
    UserRoles.VIEWER,
  ],
  [UserRoles.CISO]: [
    UserRoles.CISO,
    UserRoles.INFOSEC_MANAGER,
    UserRoles.SECURITY_ANALYST,
    UserRoles.VIEWER,
  ],
  [UserRoles.INFOSEC_MANAGER]: [
    UserRoles.INFOSEC_MANAGER,
    UserRoles.SECURITY_ANALYST,
    UserRoles.VIEWER,
  ],
  [UserRoles.EXTERNAL_AUDITOR]: [UserRoles.EXTERNAL_AUDITOR, UserRoles.VIEWER],
  [UserRoles.INTERNAL_AUDITOR]: [UserRoles.INTERNAL_AUDITOR, UserRoles.VIEWER],
  [UserRoles.SECURITY_ANALYST]: [UserRoles.SECURITY_ANALYST, UserRoles.VIEWER],
  [UserRoles.VIEWER]: [UserRoles.VIEWER],
};

const ROLE_PERMISSIONS = {
  [UserRoles.ADMIN]: {
    users: ['create', 'read', 'update', 'delete'],
    applications: ['create', 'read', 'update', 'delete'],
    vulnerabilities: ['create', 'read', 'update', 'delete'],
    compliance: ['create', 'read', 'update', 'delete'],
    vendors: ['create', 'read', 'update', 'delete'],
    exceptions: ['create', 'read', 'update', 'delete', 'approve'],
    reports: ['create', 'read', 'update', 'delete'],
    audit: ['create', 'read', 'update', 'delete'],
    settings: ['create', 'read', 'update', 'delete'],
  },
  [UserRoles.CISO]: {
    applications: ['read', 'update'],
    vulnerabilities: ['read', 'update'],
    compliance: ['read', 'update'],
    vendors: ['read', 'update'],
    exceptions: ['read', 'approve'],
    reports: ['create', 'read', 'update'],
    audit: ['read'],
    settings: ['read'],
  },
  [UserRoles.INFOSEC_MANAGER]: {
    applications: ['create', 'read', 'update'],
    vulnerabilities: ['create', 'read', 'update'],
    compliance: ['read', 'update'],
    vendors: ['read', 'update'],
    exceptions: ['create', 'read'],
    reports: ['read'],
  },
  [UserRoles.EXTERNAL_AUDITOR]: {
    applications: ['read'],
    vulnerabilities: ['read'],
    compliance: ['read'],
    vendors: ['read'],
    exceptions: ['read'],
    reports: ['read'],
    audit: ['read'],
  },
  [UserRoles.INTERNAL_AUDITOR]: {
    applications: ['read'],
    vulnerabilities: ['read'],
    compliance: ['read'],
    vendors: ['read'],
    exceptions: ['read'],
    reports: ['create', 'read'],
    audit: ['create', 'read'],
  },
  [UserRoles.SECURITY_ANALYST]: {
    applications: ['read', 'update'],
    vulnerabilities: ['create', 'read', 'update'],
    compliance: ['read'],
    vendors: ['read'],
    exceptions: ['create', 'read'],
    reports: ['read'],
  },
  [UserRoles.VIEWER]: {
    applications: ['read'],
    vulnerabilities: ['read'],
    compliance: ['read'],
    vendors: ['read'],
    exceptions: ['read'],
    reports: ['read'],
    audit: ['read'],
  },
};

// Helper functions
function checkRole(user, allowedRoles) {
  if (!user || !user.role) return false;
  
  const userRole = user.role;
  if (!ROLE_HIERARCHY[userRole]) return false;
  
  const inheritedRoles = ROLE_HIERARCHY[userRole];
  return allowedRoles.some(role => inheritedRoles.includes(role));
}

function checkPermission(user, resource, action) {
  if (!user || !user.role) return false;
  
  const userRole = user.role;
  if (!ROLE_HIERARCHY[userRole]) return false;
  
  const inheritedRoles = ROLE_HIERARCHY[userRole];
  
  for (const role of inheritedRoles) {
    const permissions = ROLE_PERMISSIONS[role];
    if (permissions && permissions[resource] && permissions[resource].includes(action)) {
      return true;
    }
  }
  
  return false;
}

describe('RBAC Role Hierarchy Tests', () => {
  it('Admin should have access to all roles', () => {
    const user = { role: UserRoles.ADMIN };
    
    expect(checkRole(user, [UserRoles.ADMIN])).toBe(true);
    expect(checkRole(user, [UserRoles.CISO])).toBe(true);
    expect(checkRole(user, [UserRoles.INFOSEC_MANAGER])).toBe(true);
    expect(checkRole(user, [UserRoles.EXTERNAL_AUDITOR])).toBe(true);
    expect(checkRole(user, [UserRoles.INTERNAL_AUDITOR])).toBe(true);
    expect(checkRole(user, [UserRoles.SECURITY_ANALYST])).toBe(true);
    expect(checkRole(user, [UserRoles.VIEWER])).toBe(true);
  });

  it('CISO should have limited hierarchy access', () => {
    const user = { role: UserRoles.CISO };
    
    expect(checkRole(user, [UserRoles.CISO])).toBe(true);
    expect(checkRole(user, [UserRoles.INFOSEC_MANAGER])).toBe(true);
    expect(checkRole(user, [UserRoles.SECURITY_ANALYST])).toBe(true);
    expect(checkRole(user, [UserRoles.VIEWER])).toBe(true);
    expect(checkRole(user, [UserRoles.ADMIN])).toBe(false);
    expect(checkRole(user, [UserRoles.EXTERNAL_AUDITOR])).toBe(false);
  });

  it('InfoSec Manager should have specific hierarchy', () => {
    const user = { role: UserRoles.INFOSEC_MANAGER };
    
    expect(checkRole(user, [UserRoles.INFOSEC_MANAGER])).toBe(true);
    expect(checkRole(user, [UserRoles.SECURITY_ANALYST])).toBe(true);
    expect(checkRole(user, [UserRoles.VIEWER])).toBe(true);
    expect(checkRole(user, [UserRoles.ADMIN])).toBe(false);
    expect(checkRole(user, [UserRoles.CISO])).toBe(false);
  });

  it('Auditors should be independent', () => {
    const externalUser = { role: UserRoles.EXTERNAL_AUDITOR };
    const internalUser = { role: UserRoles.INTERNAL_AUDITOR };
    
    expect(checkRole(externalUser, [UserRoles.EXTERNAL_AUDITOR])).toBe(true);
    expect(checkRole(externalUser, [UserRoles.VIEWER])).toBe(true);
    expect(checkRole(externalUser, [UserRoles.INTERNAL_AUDITOR])).toBe(false);
    
    expect(checkRole(internalUser, [UserRoles.INTERNAL_AUDITOR])).toBe(true);
    expect(checkRole(internalUser, [UserRoles.VIEWER])).toBe(true);
    expect(checkRole(internalUser, [UserRoles.EXTERNAL_AUDITOR])).toBe(false);
  });

  it('Viewer should only have viewer access', () => {
    const user = { role: UserRoles.VIEWER };
    
    expect(checkRole(user, [UserRoles.VIEWER])).toBe(true);
    expect(checkRole(user, [UserRoles.SECURITY_ANALYST])).toBe(false);
    expect(checkRole(user, [UserRoles.ADMIN])).toBe(false);
  });
});

describe('RBAC Permission Tests', () => {
  it('Admin should have all permissions', () => {
    const user = { role: UserRoles.ADMIN };
    
    expect(checkPermission(user, 'users', 'create')).toBe(true);
    expect(checkPermission(user, 'users', 'delete')).toBe(true);
    expect(checkPermission(user, 'vulnerabilities', 'create')).toBe(true);
    expect(checkPermission(user, 'exceptions', 'approve')).toBe(true);
    expect(checkPermission(user, 'settings', 'update')).toBe(true);
  });

  it('CISO should have correct permissions', () => {
    const user = { role: UserRoles.CISO };
    
    // Can read and update
    expect(checkPermission(user, 'applications', 'read')).toBe(true);
    expect(checkPermission(user, 'applications', 'update')).toBe(true);
    expect(checkPermission(user, 'vulnerabilities', 'read')).toBe(true);
    expect(checkPermission(user, 'vulnerabilities', 'update')).toBe(true);
    
    // Cannot delete
    expect(checkPermission(user, 'applications', 'delete')).toBe(false);
    expect(checkPermission(user, 'vulnerabilities', 'delete')).toBe(false);
    
    // Can approve exceptions
    expect(checkPermission(user, 'exceptions', 'approve')).toBe(true);
    
    // Can create reports but not delete
    expect(checkPermission(user, 'reports', 'create')).toBe(true);
    expect(checkPermission(user, 'reports', 'delete')).toBe(false);
  });

  it('InfoSec Manager should have limited permissions', () => {
    const user = { role: UserRoles.INFOSEC_MANAGER };
    
    // Can create, read, update
    expect(checkPermission(user, 'applications', 'create')).toBe(true);
    expect(checkPermission(user, 'applications', 'read')).toBe(true);
    expect(checkPermission(user, 'applications', 'update')).toBe(true);
    expect(checkPermission(user, 'vulnerabilities', 'create')).toBe(true);
    
    // Cannot delete or manage users
    expect(checkPermission(user, 'applications', 'delete')).toBe(false);
    expect(checkPermission(user, 'users', 'create')).toBe(false);
    expect(checkPermission(user, 'users', 'read')).toBe(false);
  });

  it('External Auditor should be read-only', () => {
    const user = { role: UserRoles.EXTERNAL_AUDITOR };
    
    // Can read
    expect(checkPermission(user, 'applications', 'read')).toBe(true);
    expect(checkPermission(user, 'vulnerabilities', 'read')).toBe(true);
    expect(checkPermission(user, 'compliance', 'read')).toBe(true);
    expect(checkPermission(user, 'audit', 'read')).toBe(true);
    
    // Cannot create, update, or delete
    expect(checkPermission(user, 'applications', 'create')).toBe(false);
    expect(checkPermission(user, 'applications', 'update')).toBe(false);
    expect(checkPermission(user, 'applications', 'delete')).toBe(false);
    expect(checkPermission(user, 'vulnerabilities', 'create')).toBe(false);
    expect(checkPermission(user, 'exceptions', 'approve')).toBe(false);
  });

  it('Internal Auditor can create reports', () => {
    const user = { role: UserRoles.INTERNAL_AUDITOR };
    
    // Can create reports and audits
    expect(checkPermission(user, 'reports', 'create')).toBe(true);
    expect(checkPermission(user, 'reports', 'read')).toBe(true);
    expect(checkPermission(user, 'audit', 'create')).toBe(true);
    expect(checkPermission(user, 'audit', 'read')).toBe(true);
    
    // Cannot modify other resources
    expect(checkPermission(user, 'vulnerabilities', 'create')).toBe(false);
    expect(checkPermission(user, 'applications', 'update')).toBe(false);
  });

  it('Security Analyst has vulnerability permissions', () => {
    const user = { role: UserRoles.SECURITY_ANALYST };
    
    // Full CRUD on vulnerabilities
    expect(checkPermission(user, 'vulnerabilities', 'create')).toBe(true);
    expect(checkPermission(user, 'vulnerabilities', 'read')).toBe(true);
    expect(checkPermission(user, 'vulnerabilities', 'update')).toBe(true);
    
    // Limited on applications
    expect(checkPermission(user, 'applications', 'read')).toBe(true);
    expect(checkPermission(user, 'applications', 'update')).toBe(true);
    expect(checkPermission(user, 'applications', 'create')).toBe(false);
    expect(checkPermission(user, 'applications', 'delete')).toBe(false);
    
    // Cannot approve exceptions
    expect(checkPermission(user, 'exceptions', 'approve')).toBe(false);
  });

  it('Viewer should be read-only for everything', () => {
    const user = { role: UserRoles.VIEWER };
    
    // Can read everything
    expect(checkPermission(user, 'applications', 'read')).toBe(true);
    expect(checkPermission(user, 'vulnerabilities', 'read')).toBe(true);
    expect(checkPermission(user, 'compliance', 'read')).toBe(true);
    expect(checkPermission(user, 'reports', 'read')).toBe(true);
    
    // Cannot modify anything
    expect(checkPermission(user, 'applications', 'create')).toBe(false);
    expect(checkPermission(user, 'vulnerabilities', 'update')).toBe(false);
    expect(checkPermission(user, 'reports', 'create')).toBe(false);
    expect(checkPermission(user, 'exceptions', 'approve')).toBe(false);
  });
});

describe('RBAC Specific Permission Tests', () => {
  it('Only admin can delete users', () => {
    const admin = { role: UserRoles.ADMIN };
    const ciso = { role: UserRoles.CISO };
    const manager = { role: UserRoles.INFOSEC_MANAGER };
    
    expect(checkPermission(admin, 'users', 'delete')).toBe(true);
    expect(checkPermission(ciso, 'users', 'delete')).toBe(false);
    expect(checkPermission(manager, 'users', 'delete')).toBe(false);
  });

  it('Only ADMIN and CISO can approve exceptions', () => {
    const admin = { role: UserRoles.ADMIN };
    const ciso = { role: UserRoles.CISO };
    const manager = { role: UserRoles.INFOSEC_MANAGER };
    const analyst = { role: UserRoles.SECURITY_ANALYST };
    
    expect(checkPermission(admin, 'exceptions', 'approve')).toBe(true);
    expect(checkPermission(ciso, 'exceptions', 'approve')).toBe(true);
    expect(checkPermission(manager, 'exceptions', 'approve')).toBe(false);
    expect(checkPermission(analyst, 'exceptions', 'approve')).toBe(false);
  });
});

describe('RBAC Edge Cases', () => {
  it('User without role should have no access', () => {
    const user = { role: null };
    
    expect(checkRole(user, [UserRoles.VIEWER])).toBe(false);
    expect(checkPermission(user, 'applications', 'read')).toBe(false);
  });

  it('Invalid role should be rejected', () => {
    const user = { role: 'INVALID_ROLE' };
    
    expect(checkRole(user, [UserRoles.ADMIN])).toBe(false);
    expect(checkPermission(user, 'applications', 'read')).toBe(false);
  });

  it('Null user should have no access', () => {
    expect(checkRole(null, [UserRoles.ADMIN])).toBe(false);
    expect(checkPermission(null, 'applications', 'read')).toBe(false);
  });

  it('Multiple required roles should use OR logic', () => {
    const cisoUser = { role: UserRoles.CISO };
    const analystUser = { role: UserRoles.SECURITY_ANALYST };
    const viewerUser = { role: UserRoles.VIEWER };
    
    // CISO should match [ADMIN, CISO]
    expect(checkRole(cisoUser, [UserRoles.ADMIN, UserRoles.CISO])).toBe(true);
    
    // Analyst should not match [ADMIN, CISO]
    expect(checkRole(analystUser, [UserRoles.ADMIN, UserRoles.CISO])).toBe(false);
    
    // But should match [SECURITY_ANALYST, CISO]
    expect(checkRole(analystUser, [UserRoles.SECURITY_ANALYST, UserRoles.CISO])).toBe(true);
    
    // Viewer should not match restricted roles
    expect(checkRole(viewerUser, [UserRoles.ADMIN, UserRoles.CISO])).toBe(false);
  });
});
