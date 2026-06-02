import { hasPermission } from "../../utils/permissions";

const PermissionGuard = ({ resource, action, children, fallback = null }) => {
  if (!hasPermission(resource, action)) return fallback;
  return children;
};

export default PermissionGuard;