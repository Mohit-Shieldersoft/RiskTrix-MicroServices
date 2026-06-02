import api from "./api";

const BASE = "/api/v1/automation";

// ── Rules ──────────────────────────────────────────────────────────────────

export async function listRules(filters = {}) {
  const params = {};
  if (filters.trigger_type) params.trigger_type = filters.trigger_type;
  if (filters.enabled !== undefined) params.enabled = filters.enabled;
  const res = await api.get(`${BASE}/rules`, { params });
  return res.data;
}

export async function getRule(id) {
  const res = await api.get(`${BASE}/rules/${id}`);
  return res.data;
}

export async function createRule(payload) {
  const res = await api.post(`${BASE}/rules`, payload);
  return res.data;
}

export async function updateRule(id, payload) {
  const res = await api.put(`${BASE}/rules/${id}`, payload);
  return res.data;
}

export async function deleteRule(id) {
  await api.delete(`${BASE}/rules/${id}`);
}

export async function toggleRule(id) {
  const res = await api.patch(`${BASE}/rules/${id}/toggle`);
  return res.data;
}

export async function testRule(id, context = {}) {
  const res = await api.post(`${BASE}/rules/${id}/test`, context);
  return res.data;
}

// ── Executions ─────────────────────────────────────────────────────────────

export async function listExecutions(filters = {}) {
  const params = {};
  if (filters.rule_id)   params.rule_id   = filters.rule_id;
  if (filters.device_id) params.device_id = filters.device_id;
  if (filters.status)    params.status    = filters.status;
  if (filters.limit)     params.limit     = filters.limit;
  const res = await api.get(`${BASE}/executions`, { params });
  return res.data;
}

export async function getStats() {
  const res = await api.get(`${BASE}/stats`);
  return res.data;
}
