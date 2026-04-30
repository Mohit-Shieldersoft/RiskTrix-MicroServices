/**
 * Role-Based Access Control (RBAC) Context and Hooks
 */
import React, { createContext, useContext, useState, useEffect } from 'react';

// Define user roles - must match backend
export const UserRoles = {
  ADMIN: 'ADMIN',
  CISO: 'CISO',
  INFOSEC_MANAGER: 'INFOSEC_MANAGER',
  EXTERNAL_AUDITOR: 'EXTERNAL_AUDITOR',
  INTERNAL_AUDITOR: 'INTERNAL_AUDITOR',
  SECURITY_ANALYST: 'SECURITY_ANALYST',
  VIEWER: 'VIEWER'
};

// Role display names
export const RoleLabels = {
  [UserRoles.ADMIN]: 'Administrator',
  [UserRoles.CISO]: 'CISO',
  [UserRoles.INFOSEC_MANAGER]: 'InfoSec Manager',
  [UserRoles.EXTERNAL_AUDITOR]: 'External Auditor',
  [UserRoles.INTERNAL_AUDITOR]: 'Internal Auditor',
  [UserRoles.SECURITY_ANALYST]: 'Security Analyst',
  [UserRoles.VIEWER]: 'Viewer'
};

// Role hierarchy - higher roles inherit lower role permissions
const ROLE_HIERARCHY = {
  [UserRoles.ADMIN]: [
    UserRoles.ADMIN,
    UserRoles.CISO,
    UserRoles.INFOSEC_MANAGER,
    UserRoles.EXTERNAL_AUDITOR,
    UserRoles.INTERNAL_AUDITOR,
    UserRoles.SECURITY_ANALYST,
    UserRoles.VIEWER
  ],
  [UserRoles.CISO]: [
    UserRoles.CISO,
    UserRoles.INFOSEC_MANAGER,
    UserRoles.SECURITY_ANALYST,
    UserRoles.VIEWER
  ],
  [UserRoles.INFOSEC_MANAGER]: [
    UserRoles.INFOSEC_MANAGER,
    UserRoles.SECURITY_ANALYST,
    UserRoles.VIEWER
  ],
  [UserRoles.EXTERNAL_AUDITOR]: [
    UserRoles.EXTERNAL_AUDITOR,
    UserRoles.VIEWER
  ],
  [UserRoles.INTERNAL_AUDITOR]: [
    UserRoles.INTERNAL_AUDITOR,
    UserRoles.VIEWER
  ],
  [UserRoles.SECURITY_ANALYST]: [
    UserRoles.SECURITY_ANALYST,
    UserRoles.VIEWER
  ],
  [UserRoles.VIEWER]: [
    UserRoles.VIEWER
  ]
};

// Define permissions for each role
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
  },
  [UserRoles.INFOSEC_MANAGER]: {
    applications: ['create', 'read', 'update'],
    vulnerabilities: ['create', 'read', 'update'],
    compliance: ['read', 'update'],
    vendors: ['read', 'update'],
    exceptions: ['create', 'read', 'update'],
    reports: ['create', 'read'],
    audit: ['read'],
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
    audit: ['read'],
  },
  [UserRoles.VIEWER]: {
    applications: ['read'],
    vulnerabilities: ['read'],
    compliance: ['read'],
    vendors: ['read'],
    exceptions: ['read'],
    reports: ['read'],
    audit: ['read'],
  }
};

// Create RBAC Context
const RBACContext = createContext(null);

// RBAC Provider Component
export const RBACProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Load user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setUserRole(user.role || UserRoles.VIEWER);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    }
  }, []);

  const checkRole = (requiredRoles) => {
    if (!userRole) return false;
    if (!Array.isArray(requiredRoles)) {
      requiredRoles = [requiredRoles];
    }
    
    // Check if user has any of the required roles
    for (const required of requiredRoles) {
      if (ROLE_HIERARCHY[required]?.includes(userRole)) {
        return true;
      }
    }
    return false;
  };

  const checkPermission = (resource, action) => {
    if (!userRole) return false;
    
    const permissions = ROLE_PERMISSIONS[userRole] || {};
    const resourcePermissions = permissions[resource] || [];
    
    return resourcePermissions.includes(action);
  };

  const hasAnyPermission = (resource, actions) => {
    if (!Array.isArray(actions)) actions = [actions];
    return actions.some(action => checkPermission(resource, action));
  };

  const hasAllPermissions = (resource, actions) => {
    if (!Array.isArray(actions)) actions = [actions];
    return actions.every(action => checkPermission(resource, action));
  };

  const isAdmin = () => checkRole([UserRoles.ADMIN]);
  const isCISO = () => checkRole([UserRoles.CISO]);
  const isInfoSecManager = () => checkRole([UserRoles.INFOSEC_MANAGER]);
  const isAuditor = () => checkRole([UserRoles.EXTERNAL_AUDITOR, UserRoles.INTERNAL_AUDITOR]);

  const value = {
    currentUser,
    userRole,
    setCurrentUser: (user) => {
      setCurrentUser(user);
      setUserRole(user?.role || UserRoles.VIEWER);
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
      }
    },
    checkRole,
    checkPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isCISO,
    isInfoSecManager,
    isAuditor,
    UserRoles,
    RoleLabels,
  };

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>;
};

// Hook to use RBAC context
export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within RBACProvider');
  }
  return context;
};

// HOC to protect routes/components
export const withRBAC = (Component, requiredRoles, fallback = null) => {
  return (props) => {
    const { checkRole } = useRBAC();
    
    if (!checkRole(requiredRoles)) {
      return fallback || (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Access Denied</h2>
          <p>You don't have permission to access this resource.</p>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
};

// Component to conditionally render based on role
export const RoleGuard = ({ children, roles, fallback = null }) => {
  const { checkRole } = useRBAC();
  
  if (!checkRole(roles)) {
    return fallback;
  }
  
  return <>{children}</>;
};

// Component to conditionally render based on permission
export const PermissionGuard = ({ children, resource, action, fallback = null }) => {
  const { checkPermission } = useRBAC();
  
  if (!checkPermission(resource, action)) {
    return fallback;
  }
  
  return <>{children}</>;
};

export default RBACContext;
