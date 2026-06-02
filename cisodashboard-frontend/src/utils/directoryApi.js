const BASE = "/api/v1";

const directoryApi = {
  // ── Agent CRUD ─────────────────────────────────────────────────────────

  getAgents: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.team) params.append("team", filters.team);
    if (filters.tier) params.append("tier", filters.tier);
    if (filters.active_only === false) params.append("active_only", "false");
    const res = await fetch(`${BASE}/directory/agents?${params.toString()}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getAgentById: async (id) => {
    const res = await fetch(`${BASE}/directory/agents/${id}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  createAgent: async (data) => {
    const res = await fetch(`${BASE}/directory/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw { response: { data: err } };
    }
    return res.json();
  },

  updateAgent: async (id, data) => {
    const res = await fetch(`${BASE}/directory/agents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw { response: { data: err } };
    }
    return res.json();
  },

  deleteAgent: async (id) => {
    const res = await fetch(`${BASE}/directory/agents/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  lookup: async (team, tier) => {
    const res = await fetch(
      `${BASE}/directory/agents/lookup?team=${encodeURIComponent(team)}&tier=${encodeURIComponent(tier)}`
    );
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // ── Availability & On-Call ─────────────────────────────────────────────

  getAvailability: async (agentId) => {
    const res = await fetch(`${BASE}/directory/agents/${agentId}/availability`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  setAvailability: async (agentId, data) => {
    const res = await fetch(`${BASE}/directory/agents/${agentId}/availability`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw { response: { data: err } }; }
    return res.json();
  },

  getAvailableNow: async () => {
    const res = await fetch(`${BASE}/directory/agents/available-now`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getCurrentOnCall: async () => {
    const res = await fetch(`${BASE}/directory/on-call`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getAllOnCall: async () => {
    const res = await fetch(`${BASE}/directory/on-call/all`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  scheduleOnCall: async (data) => {
    const res = await fetch(`${BASE}/directory/on-call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw { response: { data: err } }; }
    return res.json();
  },

  getAgentOnCall: async (agentId) => {
    const res = await fetch(`${BASE}/directory/agents/${agentId}/on-call`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  deleteOnCall: async (onCallId) => {
    const res = await fetch(`${BASE}/directory/on-call/${onCallId}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
  },

  // ── Performance Metrics ────────────────────────────────────────────────

  recordMetric: async (data) => {
    const res = await fetch(`${BASE}/directory/metrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw { response: { data: err } }; }
    return res.json();
  },

  getAgentMetrics: async (agentId, limit = 50) => {
    const res = await fetch(`${BASE}/directory/agents/${agentId}/metrics?limit=${limit}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getAgentMetricsSummary: async (agentId) => {
    const res = await fetch(`${BASE}/directory/agents/${agentId}/metrics/summary`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getLeaderboard: async () => {
    const res = await fetch(`${BASE}/directory/metrics/leaderboard`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

export default directoryApi;

// named exports for backward-compatibility
export const getAgents = (f) => directoryApi.getAgents(f);
export const createAgent = (d) => directoryApi.createAgent(d);
export const updateAgent = (id, d) => directoryApi.updateAgent(id, d);