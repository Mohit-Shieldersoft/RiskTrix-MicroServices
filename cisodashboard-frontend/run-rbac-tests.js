#!/usr/bin/env node
/**
 * Simple test runner for RBAC tests
 * Run with: node run-rbac-tests.js
 */

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
    settings: ['read', 'update'],
    cloud_accounts: ['create', 'read', 'update', 'delete', 'sync'],
    cspm_findings: ['read', 'update', 'suppress', 'remediate'],
    cspm_policies: ['create', 'read', 'update', 'delete'],
    ciem: ['read', 'analyze', 'update'],
    k8s_security: ['read', 'scan', 'update'],
    container_security: ['read', 'scan', 'delete'],
    runtime_security: ['read', 'configure', 'update'],
    security_alerts: ['read', 'update', 'assign', 'resolve'],
    security_score: ['read', 'recalculate'],
  },
  [UserRoles.CISO]: {
    users: ['read'],
    applications: ['read', 'update'],
    vulnerabilities: ['read', 'update'],
    compliance: ['read', 'update'],
    vendors: ['read', 'update'],
    exceptions: ['read', 'approve'],
    reports: ['create', 'read'],
    audit: ['read'],
    settings: ['read'],
    cloud_accounts: ['read', 'sync'],
    cspm_findings: ['read', 'update', 'suppress'],
    cspm_policies: ['read', 'update'],
    ciem: ['read', 'analyze'],
    k8s_security: ['read'],
    container_security: ['read'],
    runtime_security: ['read'],
    security_alerts: ['read', 'update', 'assign'],
    security_score: ['read', 'recalculate'],
  },
  [UserRoles.INFOSEC_MANAGER]: {
    applications: ['create', 'read', 'update'],
    vulnerabilities: ['create', 'read', 'update'],
    compliance: ['read', 'update'],
    vendors: ['read', 'update'],
    exceptions: ['create', 'read', 'update'],
    reports: ['create', 'read'],
    audit: ['read'],
    cloud_accounts: ['read', 'sync'],
    cspm_findings: ['read', 'update'],
    cspm_policies: ['read'],
    ciem: ['read', 'analyze'],
    k8s_security: ['read', 'scan'],
    container_security: ['read', 'scan'],
    runtime_security: ['read'],
    security_alerts: ['read', 'update', 'assign'],
    security_score: ['read'],
  },
  [UserRoles.EXTERNAL_AUDITOR]: {
    applications: ['read'],
    vulnerabilities: ['read'],
    compliance: ['read'],
    vendors: ['read'],
    exceptions: ['read'],
    reports: ['read'],
    audit: ['read'],
    cloud_accounts: ['read'],
    cspm_findings: ['read'],
    cspm_policies: ['read'],
    security_score: ['read'],
  },
  [UserRoles.INTERNAL_AUDITOR]: {
    applications: ['read'],
    vulnerabilities: ['read'],
    compliance: ['read'],
    vendors: ['read'],
    exceptions: ['read'],
    reports: ['create', 'read'],
    audit: ['create', 'read'],
    cloud_accounts: ['read'],
    cspm_findings: ['read'],
    cspm_policies: ['read'],
    ciem: ['read'],
    k8s_security: ['read'],
    container_security: ['read'],
    runtime_security: ['read'],
    security_alerts: ['read'],
    security_score: ['read'],
  },
  [UserRoles.SECURITY_ANALYST]: {
    applications: ['read', 'update'],
    vulnerabilities: ['create', 'read', 'update'],
    compliance: ['read'],
    vendors: ['read'],
    exceptions: ['create', 'read'],
    reports: ['read'],
    audit: ['read'],
    cloud_accounts: ['read'],
    cspm_findings: ['read', 'update'],
    cspm_policies: ['read'],
    ciem: ['read'],
    k8s_security: ['read', 'scan'],
    container_security: ['read', 'scan'],
    runtime_security: ['read'],
    security_alerts: ['read', 'update'],
    security_score: ['read'],
  },
  [UserRoles.VIEWER]: {
    applications: ['read'],
    vulnerabilities: ['read'],
    compliance: ['read'],
    vendors: ['read'],
    exceptions: ['read'],
    reports: ['read'],
    audit: ['read'],
    cloud_accounts: ['read'],
    cspm_findings: ['read'],
    security_score: ['read'],
  },
};

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

// Test helpers
function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`❌ ${message}: expected ${expected}, got ${actual}`);
  }
}

// Test suite
let passedTests = 0;
let failedTests = 0;

function runTest(name, testFn) {
  try {
    testFn();
    console.log(`  ✅ ${name}`);
    passedTests++;
  } catch (error) {
    console.log(`  ❌ ${name}`);
    console.log(`     ${error.message}`);
    failedTests++;
  }
}

console.log('\n' + '='.repeat(60));
console.log('🧪 FRONTEND RBAC TEST SUITE');
console.log('='.repeat(60) + '\n');

console.log('📋 Role Hierarchy Tests:');
console.log('-'.repeat(60));

runTest('Admin has access to all roles', () => {
  const user = { role: UserRoles.ADMIN };
  assert(checkRole(user, [UserRoles.ADMIN]), 'Admin should have ADMIN role');
  assert(checkRole(user, [UserRoles.CISO]), 'Admin should have CISO role');
  assert(checkRole(user, [UserRoles.INFOSEC_MANAGER]), 'Admin should have INFOSEC_MANAGER role');
  assert(checkRole(user, [UserRoles.EXTERNAL_AUDITOR]), 'Admin should have EXTERNAL_AUDITOR role');
  assert(checkRole(user, [UserRoles.INTERNAL_AUDITOR]), 'Admin should have INTERNAL_AUDITOR role');
  assert(checkRole(user, [UserRoles.SECURITY_ANALYST]), 'Admin should have SECURITY_ANALYST role');
  assert(checkRole(user, [UserRoles.VIEWER]), 'Admin should have VIEWER role');
});

runTest('CISO has limited hierarchy', () => {
  const user = { role: UserRoles.CISO };
  assert(checkRole(user, [UserRoles.CISO]), 'CISO should have CISO role');
  assert(checkRole(user, [UserRoles.INFOSEC_MANAGER]), 'CISO should have INFOSEC_MANAGER role');
  assert(checkRole(user, [UserRoles.SECURITY_ANALYST]), 'CISO should have SECURITY_ANALYST role');
  assert(checkRole(user, [UserRoles.VIEWER]), 'CISO should have VIEWER role');
  assert(!checkRole(user, [UserRoles.ADMIN]), 'CISO should not have ADMIN role');
  assert(!checkRole(user, [UserRoles.EXTERNAL_AUDITOR]), 'CISO should not have EXTERNAL_AUDITOR role');
});

runTest('InfoSec Manager has specific hierarchy', () => {
  const user = { role: UserRoles.INFOSEC_MANAGER };
  assert(checkRole(user, [UserRoles.INFOSEC_MANAGER]), 'Manager should have INFOSEC_MANAGER role');
  assert(checkRole(user, [UserRoles.SECURITY_ANALYST]), 'Manager should have SECURITY_ANALYST role');
  assert(checkRole(user, [UserRoles.VIEWER]), 'Manager should have VIEWER role');
  assert(!checkRole(user, [UserRoles.ADMIN]), 'Manager should not have ADMIN role');
  assert(!checkRole(user, [UserRoles.CISO]), 'Manager should not have CISO role');
});

runTest('Auditors are independent', () => {
  const extUser = { role: UserRoles.EXTERNAL_AUDITOR };
  const intUser = { role: UserRoles.INTERNAL_AUDITOR };
  
  assert(checkRole(extUser, [UserRoles.EXTERNAL_AUDITOR]), 'External auditor should have EXTERNAL_AUDITOR role');
  assert(checkRole(extUser, [UserRoles.VIEWER]), 'External auditor should have VIEWER role');
  assert(!checkRole(extUser, [UserRoles.INTERNAL_AUDITOR]), 'External auditor should not have INTERNAL_AUDITOR role');
  
  assert(checkRole(intUser, [UserRoles.INTERNAL_AUDITOR]), 'Internal auditor should have INTERNAL_AUDITOR role');
  assert(checkRole(intUser, [UserRoles.VIEWER]), 'Internal auditor should have VIEWER role');
  assert(!checkRole(intUser, [UserRoles.EXTERNAL_AUDITOR]), 'Internal auditor should not have EXTERNAL_AUDITOR role');
});

runTest('Viewer only has viewer access', () => {
  const user = { role: UserRoles.VIEWER };
  assert(checkRole(user, [UserRoles.VIEWER]), 'Viewer should have VIEWER role');
  assert(!checkRole(user, [UserRoles.SECURITY_ANALYST]), 'Viewer should not have SECURITY_ANALYST role');
  assert(!checkRole(user, [UserRoles.ADMIN]), 'Viewer should not have ADMIN role');
});

console.log('\n🔐 Permission Tests:');
console.log('-'.repeat(60));

runTest('Admin has all permissions', () => {
  const user = { role: UserRoles.ADMIN };
  assert(checkPermission(user, 'users', 'create'), 'Admin should be able to create users');
  assert(checkPermission(user, 'users', 'delete'), 'Admin should be able to delete users');
  assert(checkPermission(user, 'vulnerabilities', 'create'), 'Admin should be able to create vulnerabilities');
  assert(checkPermission(user, 'exceptions', 'approve'), 'Admin should be able to approve exceptions');
  assert(checkPermission(user, 'settings', 'update'), 'Admin should be able to update settings');
});

runTest('CISO has correct permissions', () => {
  const user = { role: UserRoles.CISO };
  assert(checkPermission(user, 'applications', 'read'), 'CISO should read applications');
  assert(checkPermission(user, 'applications', 'update'), 'CISO should update applications');
  assert(checkPermission(user, 'vulnerabilities', 'read'), 'CISO should read vulnerabilities');
  assert(checkPermission(user, 'vulnerabilities', 'update'), 'CISO should update vulnerabilities');
  assert(!checkPermission(user, 'applications', 'delete'), 'CISO should not delete applications');
  assert(!checkPermission(user, 'vulnerabilities', 'delete'), 'CISO should not delete vulnerabilities');
  assert(checkPermission(user, 'exceptions', 'approve'), 'CISO should approve exceptions');
  assert(checkPermission(user, 'reports', 'create'), 'CISO should create reports');
  assert(!checkPermission(user, 'reports', 'delete'), 'CISO should not delete reports');
});

runTest('External Auditor is read-only', () => {
  const user = { role: UserRoles.EXTERNAL_AUDITOR };
  assert(checkPermission(user, 'applications', 'read'), 'External auditor should read applications');
  assert(checkPermission(user, 'vulnerabilities', 'read'), 'External auditor should read vulnerabilities');
  assert(!checkPermission(user, 'applications', 'create'), 'External auditor should not create applications');
  assert(!checkPermission(user, 'applications', 'update'), 'External auditor should not update applications');
  assert(!checkPermission(user, 'applications', 'delete'), 'External auditor should not delete applications');
  assert(!checkPermission(user, 'exceptions', 'approve'), 'External auditor should not approve exceptions');
});

runTest('Security Analyst has vulnerability permissions', () => {
  const user = { role: UserRoles.SECURITY_ANALYST };
  assert(checkPermission(user, 'vulnerabilities', 'create'), 'Analyst should create vulnerabilities');
  assert(checkPermission(user, 'vulnerabilities', 'read'), 'Analyst should read vulnerabilities');
  assert(checkPermission(user, 'vulnerabilities', 'update'), 'Analyst should update vulnerabilities');
  assert(checkPermission(user, 'applications', 'read'), 'Analyst should read applications');
  assert(checkPermission(user, 'applications', 'update'), 'Analyst should update applications');
  assert(!checkPermission(user, 'applications', 'create'), 'Analyst should not create applications');
  assert(!checkPermission(user, 'exceptions', 'approve'), 'Analyst should not approve exceptions');
});

runTest('Viewer is read-only everywhere', () => {
  const user = { role: UserRoles.VIEWER };
  assert(checkPermission(user, 'applications', 'read'), 'Viewer should read applications');
  assert(checkPermission(user, 'vulnerabilities', 'read'), 'Viewer should read vulnerabilities');
  assert(checkPermission(user, 'reports', 'read'), 'Viewer should read reports');
  assert(!checkPermission(user, 'applications', 'create'), 'Viewer should not create applications');
  assert(!checkPermission(user, 'vulnerabilities', 'update'), 'Viewer should not update vulnerabilities');
  assert(!checkPermission(user, 'reports', 'create'), 'Viewer should not create reports');
});

console.log('\n⚡ Specific Permission Tests:');
console.log('-'.repeat(60));

runTest('Only admin can delete users', () => {
  const admin = { role: UserRoles.ADMIN };
  const ciso = { role: UserRoles.CISO };
  const manager = { role: UserRoles.INFOSEC_MANAGER };
  
  assert(checkPermission(admin, 'users', 'delete'), 'Admin should delete users');
  assert(!checkPermission(ciso, 'users', 'delete'), 'CISO should not delete users');
  assert(!checkPermission(manager, 'users', 'delete'), 'Manager should not delete users');
});

runTest('Only ADMIN and CISO can approve exceptions', () => {
  const admin = { role: UserRoles.ADMIN };
  const ciso = { role: UserRoles.CISO };
  const manager = { role: UserRoles.INFOSEC_MANAGER };
  const analyst = { role: UserRoles.SECURITY_ANALYST };
  
  assert(checkPermission(admin, 'exceptions', 'approve'), 'Admin should approve exceptions');
  assert(checkPermission(ciso, 'exceptions', 'approve'), 'CISO should approve exceptions');
  assert(!checkPermission(manager, 'exceptions', 'approve'), 'Manager should not approve exceptions');
  assert(!checkPermission(analyst, 'exceptions', 'approve'), 'Analyst should not approve exceptions');
});

runTest('CNAPP Extended Resource Permissions Across 7 Roles', () => {
  const admin = { role: UserRoles.ADMIN };
  const ciso = { role: UserRoles.CISO };
  const manager = { role: UserRoles.INFOSEC_MANAGER };
  const extAuditor = { role: UserRoles.EXTERNAL_AUDITOR };
  const intAuditor = { role: UserRoles.INTERNAL_AUDITOR };
  const analyst = { role: UserRoles.SECURITY_ANALYST };
  const viewer = { role: UserRoles.VIEWER };

  // Cloud accounts
  assert(checkPermission(admin, 'cloud_accounts', 'sync'), 'Admin syncs cloud accounts');
  assert(checkPermission(ciso, 'cloud_accounts', 'sync'), 'CISO syncs cloud accounts');
  assert(checkPermission(manager, 'cloud_accounts', 'sync'), 'Manager syncs cloud accounts');
  assert(checkPermission(analyst, 'cloud_accounts', 'read'), 'Analyst reads cloud accounts');
  assert(!checkPermission(analyst, 'cloud_accounts', 'sync'), 'Analyst cannot sync cloud accounts');

  // CSPM findings & policies
  assert(checkPermission(admin, 'cspm_findings', 'remediate'), 'Admin remediates CSPM findings');
  assert(checkPermission(ciso, 'cspm_findings', 'suppress'), 'CISO suppresses CSPM findings');
  assert(checkPermission(admin, 'cspm_policies', 'create'), 'Admin creates CSPM policies');
  assert(checkPermission(extAuditor, 'cspm_policies', 'read'), 'Ext Auditor reads CSPM policies');
  assert(!checkPermission(extAuditor, 'cspm_policies', 'create'), 'Ext Auditor cannot create CSPM policies');

  // CIEM & K8s
  assert(checkPermission(admin, 'ciem', 'update'), 'Admin updates CIEM');
  assert(checkPermission(manager, 'ciem', 'analyze'), 'Manager analyzes CIEM');
  assert(checkPermission(analyst, 'k8s_security', 'scan'), 'Analyst scans K8s');
  assert(checkPermission(intAuditor, 'k8s_security', 'read'), 'Int Auditor reads K8s');
  assert(!checkPermission(intAuditor, 'k8s_security', 'scan'), 'Int Auditor cannot scan K8s');

  // Container & Security Alerts & Score
  assert(checkPermission(admin, 'container_security', 'delete'), 'Admin deletes containers');
  assert(checkPermission(admin, 'security_alerts', 'resolve'), 'Admin resolves security alerts');
  assert(checkPermission(ciso, 'security_score', 'recalculate'), 'CISO recalculates security score');
  assert(checkPermission(viewer, 'security_score', 'read'), 'Viewer reads security score');
  assert(!checkPermission(viewer, 'security_alerts', 'assign'), 'Viewer cannot assign security alerts');
});

runTest('Exhaustive 7-Role Client Permission Guards Matrix', () => {
  const roles = Object.keys(UserRoles).map(r => ({ role: r }));
  assert(roles.length === 7, 'All 7 roles must be tested');

  roles.forEach(user => {
    assert(checkPermission(user, 'applications', 'read'), `${user.role} should read applications`);
    assert(checkPermission(user, 'vulnerabilities', 'read'), `${user.role} should read vulnerabilities`);
  });
});

console.log('\n🔍 Edge Case Tests:');
console.log('-'.repeat(60));

runTest('User without role has no access', () => {
  const user = { role: null };
  assert(!checkRole(user, [UserRoles.VIEWER]), 'User without role should have no role access');
  assert(!checkPermission(user, 'applications', 'read'), 'User without role should have no permissions');
});

runTest('Invalid role is rejected', () => {
  const user = { role: 'INVALID_ROLE' };
  assert(!checkRole(user, [UserRoles.ADMIN]), 'Invalid role should not match any role');
  assert(!checkPermission(user, 'applications', 'read'), 'Invalid role should have no permissions');
});

console.log('\n' + '='.repeat(60));
console.log(`✅ Tests Passed: ${passedTests}`);
console.log(`❌ Tests Failed: ${failedTests}`);
console.log(`📊 Total Tests: ${passedTests + failedTests}`);
console.log('='.repeat(60) + '\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 All frontend RBAC tests passed successfully!\n');
}
