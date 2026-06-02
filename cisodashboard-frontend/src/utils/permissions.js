import { getUserProfile } from "./auth";

// Role hierarchy — what roles each role "encompasses" for permission inheritance.
// Auditors (internal/external) are a separate chain and do NOT inherit "viewer".
// This allows viewer-specific permissions to exclude auditors.
const ROLE_HIERARCHY = {
  admin: ["admin", "ciso", "infosec_manager", "external_auditor", "internal_auditor", "security_analyst", "viewer"],
  ciso: ["ciso", "infosec_manager", "security_analyst", "viewer"],
  infosec_manager: ["infosec_manager", "security_analyst", "viewer"],
  external_auditor: ["external_auditor"],
  internal_auditor: ["internal_auditor"],
  security_analyst: ["security_analyst", "viewer"],
  viewer: ["viewer"],
};

// Full permission matrix aligned with the Sidebar Accessibility Matrix
const PERMISSIONS = {

  // ── Application Module ─────────────────────────────────────────────────────
  application: {
    view:   ["viewer", "security_analyst", "external_auditor", "internal_auditor", "infosec_manager", "ciso", "admin"],
    create: ["infosec_manager", "ciso", "admin"],
    update: ["security_analyst", "infosec_manager", "ciso", "admin"],
    delete: ["admin"],
    export: ["external_auditor", "internal_auditor", "ciso", "admin"],
  },

  // ── Audit Module ───────────────────────────────────────────────────────────
  audit: {
    view:    ["viewer", "security_analyst", "external_auditor", "internal_auditor", "infosec_manager", "ciso", "admin"],
    create:  ["internal_auditor", "ciso", "admin"],
    update:  ["infosec_manager", "ciso", "admin"],
    approve: ["ciso", "admin"],
    export:  ["external_auditor", "internal_auditor", "ciso", "admin"],
  },

  // ── Asset Management ───────────────────────────────────────────────────────
  assets: {
    view:         ["viewer", "security_analyst", "external_auditor", "internal_auditor", "infosec_manager", "ciso", "admin"],
    create:       ["security_analyst", "infosec_manager", "ciso", "admin"],
    update:       ["security_analyst", "infosec_manager", "ciso", "admin"],
    delete:       ["admin"],
    bulk_import:  ["infosec_manager", "ciso", "admin"],
    export:       ["external_auditor", "internal_auditor", "ciso", "admin"],
  },

  // ── Vulnerabilities (Security module) ─────────────────────────────────────
  vulnerabilities: {
    view:             ["viewer", "security_analyst", "external_auditor", "internal_auditor", "infosec_manager", "ciso", "admin"],
    create:           ["security_analyst", "infosec_manager", "ciso", "admin"],
    update:           ["security_analyst", "infosec_manager", "ciso", "admin"],
    delete:           ["admin"],
    approve_exception: ["ciso", "admin"],
  },

  // ── Policies ───────────────────────────────────────────────────────────────
  policies: {
    view:          ["viewer", "security_analyst", "external_auditor", "internal_auditor", "infosec_manager", "ciso", "admin"],
    create:        ["infosec_manager", "ciso", "admin"],
    update:        ["infosec_manager", "ciso", "admin"],
    delete:        ["ciso", "admin"],
    bulk_assign:   ["ciso", "admin"],
    apply:         ["infosec_manager", "ciso", "admin"],
    enroll_device: ["infosec_manager", "ciso", "admin"],
    manage_groups: ["ciso", "admin"],
  },

  // ── Tickets ────────────────────────────────────────────────────────────────
  tickets: {
    view:              ["viewer", "security_analyst", "external_auditor", "internal_auditor", "infosec_manager", "ciso", "admin"],
    create:            ["security_analyst", "infosec_manager", "ciso", "admin"],
    update:            ["security_analyst", "infosec_manager", "ciso", "admin"],
    assign:            ["infosec_manager", "ciso", "admin"],
    close:             ["infosec_manager", "ciso", "admin"],
    bulk_close:        ["ciso", "admin"],
    bulk_reassign:     ["ciso", "admin"],
    resolve:           ["security_analyst", "infosec_manager", "ciso", "admin"],
    add_comment:       ["security_analyst", "infosec_manager", "ciso", "admin"],
    upload_attachment: ["security_analyst", "infosec_manager", "ciso", "admin"],
    export_csv:        ["external_auditor", "internal_auditor", "ciso", "admin"],
  },

  // ── Automation ─────────────────────────────────────────────────────────────
  automation: {
    view:    ["infosec_manager", "ciso", "admin"],
    create:  ["ciso", "admin"],
    update:  ["ciso", "admin"],
    delete:  ["admin"],
    execute: ["ciso", "admin"],
  },

  // ── File Manager ───────────────────────────────────────────────────────────
  files: {
    view:     ["viewer", "security_analyst", "external_auditor", "internal_auditor", "infosec_manager", "ciso", "admin"],
    upload:   ["security_analyst", "infosec_manager", "ciso", "admin"],
    delete:   ["ciso", "admin"],
    download: ["viewer", "security_analyst", "external_auditor", "internal_auditor", "infosec_manager", "ciso", "admin"],
  },

  // ── Agent Directory ────────────────────────────────────────────────────────
  // internal_auditor & external_auditor are intentionally excluded (no viewer inheritance)
  users: {
    view:          ["viewer", "security_analyst", "infosec_manager", "ciso", "admin"],
    schedule_calls:["security_analyst", "infosec_manager", "ciso", "admin"],
    manage:        ["infosec_manager", "ciso", "admin"],
    create:        ["admin"],
    update:        ["admin"],
    delete:        ["admin"],
    manage_roles:  ["admin"],
  },

  // ── Search ─────────────────────────────────────────────────────────────────
  search: {
    view:       ["viewer", "security_analyst", "external_auditor", "internal_auditor", "infosec_manager", "ciso", "admin"],
    advanced:   ["security_analyst", "infosec_manager", "ciso", "admin"],
    audit_logs: ["internal_auditor", "infosec_manager", "ciso", "admin"],
  },

  // ── Queue Monitor ──────────────────────────────────────────────────────────
  queue: {
    view:          ["external_auditor", "internal_auditor", "infosec_manager", "ciso", "admin"],
    replay:        ["admin"],
    publish:       ["ciso", "admin"],
    stats:         ["external_auditor", "internal_auditor", "infosec_manager", "ciso", "admin"],
    view_failures: ["external_auditor", "internal_auditor", "infosec_manager", "ciso", "admin"],
  },

  // ── EOSL ───────────────────────────────────────────────────────────────────
  eosl: {
    view:   ["viewer", "security_analyst", "external_auditor", "internal_auditor", "infosec_manager", "ciso", "admin"],
    manage: ["infosec_manager", "ciso", "admin"],
  },

  // ── Reports ────────────────────────────────────────────────────────────────
  reports: {
    view:      ["viewer", "security_analyst", "external_auditor", "internal_auditor", "infosec_manager", "ciso", "admin"],
    executive: ["ciso", "admin"],
    audit:     ["external_auditor", "internal_auditor", "ciso", "admin"],
    create:    ["internal_auditor", "ciso", "admin"],
  },

  // ── Exceptions ─────────────────────────────────────────────────────────────
  exceptions: {
    view:    ["viewer", "security_analyst", "external_auditor", "internal_auditor", "infosec_manager", "ciso", "admin"],
    create:  ["security_analyst", "infosec_manager", "ciso", "admin"],
    update:  ["security_analyst", "infosec_manager", "ciso", "admin"],
    approve: ["ciso", "admin"],
    delete:  ["admin"],
  },

  // ── Settings ───────────────────────────────────────────────────────────────
  settings: {
    view:         ["ciso", "admin"],
    update:       ["admin"],
    manage_users: ["admin"],
    manage_roles: ["admin"],
  },
};

// ✅ Get current user role from profile
export function getCurrentRole() {
  const profile = getUserProfile();
  return profile?.role?.toLowerCase() || null;
}

// ✅ Check if current user has permission
export function hasPermission(resource, action) {
  const role = getCurrentRole();
  if (!role) return false;

  const resourcePerms = PERMISSIONS[resource];
  if (!resourcePerms) return false;

  const allowedRoles = resourcePerms[action];
  if (!allowedRoles) return false;

  // Check if user's role or any role in their hierarchy is allowed
  const userHierarchy = ROLE_HIERARCHY[role] || [role];
  return allowedRoles.some((allowed) => userHierarchy.includes(allowed));
}

// ✅ Check if user has a specific role or higher
export function hasRole(requiredRole) {
  const role = getCurrentRole();
  if (!role) return false;
  const userHierarchy = ROLE_HIERARCHY[role] || [role];
  return userHierarchy.includes(requiredRole);
}

// ✅ Get role display label
export function getRoleLabel(role) {
  const labels = {
    admin: "Administrator",
    ciso: "CISO",
    infosec_manager: "InfoSec Manager",
    external_auditor: "External Auditor",
    internal_auditor: "Internal Auditor",
    security_analyst: "Security Analyst",
    viewer: "Viewer",
  };
  return labels[role?.toLowerCase()] || role;
}

// ✅ Get role color for UI
export function getRoleColor(role) {
  const colors = {
    admin: "error",
    ciso: "primary",
    infosec_manager: "secondary",
    external_auditor: "warning",
    internal_auditor: "info",
    security_analyst: "success",
    viewer: "default",
  };
  return colors[role?.toLowerCase()] || "default";
}