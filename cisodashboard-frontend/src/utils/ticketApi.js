const BASE = "/api/v1";

import { getToken } from "./auth";

// ✅ Use same auth utility as the rest of the app
const authHeaders = () => {
  const token = getToken(); // reads rt_access_token from localStorage
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleError = async (res) => {
  let err;
  try {
    err = await res.json();
  } catch {
    err = { detail: "Something went wrong" };
  }
  throw { status: res.status, data: err };
};

const ticketApi = {
  getTickets: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.priority) params.append("priority", filters.priority);
    if (filters.category) params.append("category", filters.category);
    if (filters.search) params.append("search", filters.search);
    const res = await fetch(`${BASE}/tickets?${params.toString()}`, {
      headers: authHeaders(),
    });
    if (!res.ok) await handleError(res);
    return res.json();
  },

  getTicketById: async (id) => {
    const res = await fetch(`${BASE}/tickets/${id}`, { headers: authHeaders() });
    if (!res.ok) await handleError(res);
    return res.json();
  },

  createTicket: async (data) => {
    const res = await fetch(`${BASE}/tickets`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) await handleError(res);
    return res.json();
  },

  updateTicket: async (id, data) => {
    const res = await fetch(`${BASE}/tickets/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) await handleError(res);
    return res.json();
  },

  updateStatus: async (id, status) => {
    const res = await fetch(`${BASE}/tickets/${id}/status`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) await handleError(res);
    return res.json();
  },

  assignTicket: async (id, data) => {
    const res = await fetch(`${BASE}/tickets/${id}/assign`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) await handleError(res);
    return res.json();
  },

  resolveTicket: async (id, data) => {
    const res = await fetch(`${BASE}/tickets/${id}/resolve`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) await handleError(res);
    return res.json();
  },

  addComment: async (id, data) => {
    const res = await fetch(`${BASE}/tickets/${id}/comments`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) await handleError(res);
    return res.json();
  },

  getSLA: async (id) => {
    const res = await fetch(`${BASE}/tickets/${id}/sla`, { headers: authHeaders() });
    if (!res.ok) await handleError(res);
    return res.json();
  },

  getStats: async () => {
    const res = await fetch(`${BASE}/tickets/stats`, { headers: authHeaders() });
    if (!res.ok) await handleError(res);
    return res.json();
  },

  getDashboard: async () => {
    const res = await fetch(`${BASE}/tickets/dashboard`, { headers: authHeaders() });
    if (!res.ok) await handleError(res);
    return res.json();
  },

  getAssignmentStats: async () => {
    const res = await fetch(`${BASE}/tickets/assignment-stats`, { headers: authHeaders() });
    if (!res.ok) await handleError(res);
    return res.json();
  },

  getWorkload: async () => {
    const res = await fetch(`${BASE}/tickets/workload`, { headers: authHeaders() });
    if (!res.ok) await handleError(res);
    return res.json();
  },

  exportCSV: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.priority) params.append("priority", filters.priority);
    if (filters.category) params.append("category", filters.category);
    if (filters.search) params.append("search", filters.search);
    const res = await fetch(`${BASE}/tickets/export?${params.toString()}`, {
      headers: authHeaders(),
    });
    if (!res.ok) await handleError(res);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tickets_export_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  // ── Field-level change history ──────────────────────────────────────
  getHistory: async (id) => {
    const res = await fetch(`${BASE}/tickets/${id}/history`, { headers: authHeaders() });
    if (!res.ok) await handleError(res);
    return res.json();
  },

  // ── Ticket linking (parent-child) ───────────────────────────────────
  linkChild: async (parentId, childId, changedBy = "system") => {
    const res = await fetch(
      `${BASE}/tickets/${parentId}/link/${childId}?changed_by=${encodeURIComponent(changedBy)}`,
      { method: "POST", headers: authHeaders() }
    );
    if (!res.ok) await handleError(res);
    return res.json();
  },

  unlinkChild: async (parentId, childId, changedBy = "system") => {
    const res = await fetch(
      `${BASE}/tickets/${parentId}/link/${childId}?changed_by=${encodeURIComponent(changedBy)}`,
      { method: "DELETE", headers: authHeaders() }
    );
    if (!res.ok) await handleError(res);
  },

  getChildren: async (ticketId) => {
    const res = await fetch(`${BASE}/tickets/${ticketId}/children`, { headers: authHeaders() });
    if (!res.ok) await handleError(res);
    return res.json();
  },

  getParent: async (ticketId) => {
    const res = await fetch(`${BASE}/tickets/${ticketId}/parent`, { headers: authHeaders() });
    if (!res.ok) await handleError(res);
    return res.json();
  },

  // ── Bulk operations ──────────────────────────────────────────────────
  bulkClose: async (ticketIds, resolutionNotes = "Bulk closed", resolvedBy = "system", changedBy = "system") => {
    const res = await fetch(`${BASE}/tickets/bulk/close`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ ticket_ids: ticketIds, resolution_notes: resolutionNotes, resolved_by: resolvedBy, changed_by: changedBy }),
    });
    if (!res.ok) await handleError(res);
    return res.json();
  },

  bulkReassign: async (ticketIds, assignedTo, assignmentGroup = "", changedBy = "system") => {
    const res = await fetch(`${BASE}/tickets/bulk/reassign`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ ticket_ids: ticketIds, assigned_to: assignedTo, assignment_group: assignmentGroup, changed_by: changedBy }),
    });
    if (!res.ok) await handleError(res);
    return res.json();
  },

  bulkUpdateStatus: async (ticketIds, status, changedBy = "system") => {
    const res = await fetch(`${BASE}/tickets/bulk/status`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ ticket_ids: ticketIds, status, changed_by: changedBy }),
    });
    if (!res.ok) await handleError(res);
    return res.json();
  },
};

export default ticketApi;