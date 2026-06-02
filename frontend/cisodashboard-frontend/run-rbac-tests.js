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
    exceptions: ['create', 'read', 'update', 'delete', 'approve'],
    reports: ['create', 'read', 'update', 'delete'],
    settings: ['create', 'read', 'update', 'delete'],
  },
  [UserRoles.CISO]: {
    applications: ['read', 'update'],
    vulnerabilities: ['read', 'update'],
    exceptions: ['read', 'approve'],
    reports: ['create', 'read', 'update'],
  },
  [UserRoles.INFOSEC_MANAGER]: {
    applications: ['create', 'read', 'update'],
    vulnerabilities: ['create', 'read', 'update'],
    exceptions: ['create', 'read'],
  },
  [UserRoles.EXTERNAL_AUDITOR]: {
    applications: ['read'],
    vulnerabilities: ['read'],
    reports: ['read'],
  },
  [UserRoles.INTERNAL_AUDITOR]: {
    applications: ['read'],
    vulnerabilities: ['read'],
    reports: ['create', 'read'],
  },
  [UserRoles.SECURITY_ANALYST]: {
    applications: ['read', 'update'],
    vulnerabilities: ['create', 'read', 'update'],
    exceptions: ['create', 'read'],
  },
  [UserRoles.VIEWER]: {
    applications: ['read'],
    vulnerabilities: ['read'],
    reports: ['read'],
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
