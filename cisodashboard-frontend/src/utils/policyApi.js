const BASE = "/api/v1";

const policyApi = {
  getPolicies: async () => {
    const res = await fetch(`${BASE}/policies`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  getPolicyById: async (id) => {
    const res = await fetch(`${BASE}/policies/${id}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  createPolicy: async (data) => {
    const res = await fetch(`${BASE}/policies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const err = await res.json(); throw { response: { data: err } }; }
    return res.json();
  },
  updatePolicy: async (id, data) => {
    const res = await fetch(`${BASE}/policies/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const err = await res.json(); throw { response: { data: err } }; }
    return res.json();
  },
  deletePolicy: async (id) => {
    const res = await fetch(`${BASE}/policies/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  getStats: async () => {
    const res = await fetch(`${BASE}/policies/stats`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  getDashboard: async () => {
    const res = await fetch(`${BASE}/policies/dashboard`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  getDashboardWidgets: async () => {
    const res = await fetch(`${BASE}/policies/dashboard/widgets`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  // ── Conflict Detection ─────────────────────────────────
  getConflictSummary: async () => {
    const res = await fetch(`${BASE}/policies/conflicts/summary`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  getAllConflicts: async () => {
    const res = await fetch(`${BASE}/policies/conflicts/all`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  getDeviceConflicts: async (deviceId) => {
    const res = await fetch(`${BASE}/policies/conflicts/device/${deviceId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  // ── Compliance Alerts ──────────────────────────────────
  getAlerts: async () => {
    const res = await fetch(`${BASE}/policies/alerts`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  // ── Policy Templates ───────────────────────────────────
  getTemplates: async () => {
    const res = await fetch(`${BASE}/policies/templates/list`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  getTemplateById: async (templateId) => {
    const res = await fetch(`${BASE}/policies/templates/${templateId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  applyTemplate: async (templateId, nameOverride = null) => {
    const res = await fetch(`${BASE}/policies/templates/${templateId}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name_override: nameOverride }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  getDevices: async () => {
    const res = await fetch(`${BASE}/devices`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  // ✅ NEW
  getDeviceById: async (id) => {
    const res = await fetch(`${BASE}/devices/${id}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  // Spec-compliant alias: GET /policies/device/{device_id}
  getDevicePolicies: async (deviceId) => {
    const res = await fetch(`${BASE}/policies/device/${deviceId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  getPolicyDevices: async (policyId) => {
    const res = await fetch(`${BASE}/policies/${policyId}/devices`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  assignDevices: async (policyId, deviceIds) => {
    const res = await fetch(`${BASE}/policies/${policyId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_ids: deviceIds }),
    });
    if (!res.ok) { const err = await res.json(); throw { response: { data: err } }; }
    return res.json();
  },
  unassignDevice: async (policyId, deviceId) => {
    const res = await fetch(`${BASE}/policies/${policyId}/devices/${deviceId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  getAssignmentStats: async (policyId) => {
    const res = await fetch(`${BASE}/policies/${policyId}/assignment-stats`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  simulateStatus: async (policyId, deviceId, status) => {
    const res = await fetch(`${BASE}/policies/${policyId}/devices/${deviceId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

    retryAssignment: async (assignmentId) => {
    const res = await fetch(`${BASE}/policies/assignments/${assignmentId}/retry`, {
      method: "POST",
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  deleteAssignment: async (assignmentId, deletedBy = "admin") => {
    const res = await fetch(
      `${BASE}/policies/assignments/${assignmentId}?deleted_by=${encodeURIComponent(deletedBy)}`,
      { method: "DELETE" }
    );
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  getPolicyDetails: async (policyId) => {
    const res = await fetch(`${BASE}/policies/${policyId}/details`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  getDeploymentStats: async () => {
    const res = await fetch(`${BASE}/policies/deployment/stats`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  getDeviceViolations: async (deviceId) => {
    const res = await fetch(`${BASE}/devices/${deviceId}/violations`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  getDeviceActivities: async (deviceId) => {
    const res = await fetch(`${BASE}/devices/${deviceId}/activities`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  getAuditLogs: async () => {
    const res = await fetch(`${BASE}/audit-logs`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // ── Bulk Assignment ────────────────────────────────────
  bulkAssign: async (policyIds, deviceIds, assignedBy = "admin") => {
    const res = await fetch(`${BASE}/policies/assign/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policy_ids: policyIds, device_ids: deviceIds, assigned_by: assignedBy }),
    });
    if (!res.ok) { const err = await res.json(); throw { response: { data: err } }; }
    return res.json();
  },

  // ── Device Groups ──────────────────────────────────────
  getGroups: async () => {
    const res = await fetch(`${BASE}/groups`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  getGroupById: async (id) => {
    const res = await fetch(`${BASE}/groups/${id}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  createGroup: async (data) => {
    const res = await fetch(`${BASE}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const err = await res.json(); throw { response: { data: err } }; }
    return res.json();
  },
  updateGroup: async (id, data) => {
    const res = await fetch(`${BASE}/groups/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  deleteGroup: async (id) => {
    const res = await fetch(`${BASE}/groups/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  getGroupMembers: async (id) => {
    const res = await fetch(`${BASE}/groups/${id}/members`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  addGroupMembers: async (id, deviceIds) => {
    const res = await fetch(`${BASE}/groups/${id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_ids: deviceIds }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  removeGroupMember: async (groupId, deviceId) => {
    const res = await fetch(`${BASE}/groups/${groupId}/members/${deviceId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  getGroupPolicies: async (id) => {
    const res = await fetch(`${BASE}/groups/${id}/policies`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  assignPolicyToGroup: async (groupId, policyId, assignedBy = "admin") => {
    const res = await fetch(`${BASE}/groups/${groupId}/policies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policy_id: policyId, assigned_by: assignedBy }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  removePolicyFromGroup: async (groupId, policyId) => {
    const res = await fetch(`${BASE}/groups/${groupId}/policies/${policyId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // ── Compliance Engine ──────────────────────────────────
  getComplianceDashboard: async () => {
    const res = await fetch(`${BASE}/compliance/dashboard`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  triggerFullScan: async () => {
    const res = await fetch(`${BASE}/compliance/scan/all`, { method: "POST" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  triggerAssignmentScan: async (assignmentId) => {
    const res = await fetch(`${BASE}/compliance/scan/assignment/${assignmentId}`, { method: "POST" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  getDeviceComplianceResults: async (deviceId) => {
    const res = await fetch(`${BASE}/compliance/device/${deviceId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  getAssignmentComplianceResults: async (assignmentId) => {
    const res = await fetch(`${BASE}/compliance/assignment/${assignmentId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

export default policyApi;