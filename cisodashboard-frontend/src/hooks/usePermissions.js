import { hasPermission, hasRole, getCurrentRole, getRoleLabel, getRoleColor } from "../utils/permissions";

const usePermissions = () => {
  const role = getCurrentRole();

  return {
    role,
    roleLabel: getRoleLabel(role),
    roleColor: getRoleColor(role),
    can: (resource, action) => hasPermission(resource, action),
    hasRole: (requiredRole) => hasRole(requiredRole),

    // ✅ Shorthand helpers for common checks
    isAdmin: hasRole("admin"),
    isCISO: hasRole("ciso") && !hasRole("admin"),
    canManageUsers: hasPermission("users", "create"),
    canDeleteAssets: hasPermission("assets", "delete"),
    canCreateTickets: hasPermission("tickets", "create"),
    canExportTickets: hasPermission("tickets", "export_csv"),
    canUploadFiles: hasPermission("files", "upload"),
    canDeleteFiles: hasPermission("files", "delete"),
    canApproveExceptions: hasPermission("vulnerabilities", "approve_exception"),
    canManagePolicies: hasPermission("policies", "create"),
    canViewQueue: hasPermission("queue", "view"),
  };
};

export default usePermissions;