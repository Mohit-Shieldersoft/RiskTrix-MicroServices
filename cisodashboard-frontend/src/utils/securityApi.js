const BASE = "/api/v1";

const securityApi = {
  getSummary: async () => {
    const res = await fetch(`${BASE}/security/summary`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getAlerts: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.severity)   params.set("severity",   filters.severity);
    if (filters.status)     params.set("status",     filters.status);
    if (filters.alert_type) params.set("alert_type", filters.alert_type);
    if (filters.device_id)  params.set("device_id",  filters.device_id);
    const qs = params.toString();
    const res = await fetch(`${BASE}/security/alerts${qs ? `?${qs}` : ""}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getRiskyDevices: async () => {
    const res = await fetch(`${BASE}/security/risky-devices`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getTrend: async () => {
    const res = await fetch(`${BASE}/security/trend`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getIssues: async () => {
    const res = await fetch(`${BASE}/security/issues`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  evaluateAll: async () => {
    const res = await fetch(`${BASE}/security/evaluate/all`, { method: "POST" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  evaluateDevice: async (deviceId) => {
    const res = await fetch(`${BASE}/security/evaluate/${deviceId}`, { method: "POST" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  submitAgentReport: async (deviceId, report) => {
    const res = await fetch(`${BASE}/security/profile/${deviceId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  updateAlertStatus: async (alertId, status) => {
    const res = await fetch(`${BASE}/security/alerts/${alertId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getDeviceSecurity: async (deviceId) => {
    const res = await fetch(`${BASE}/security/device/${deviceId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // ── Remediation ───────────────────────────────────────────────────────────
  getRemediation: async (deviceId) => {
    const res = await fetch(`${BASE}/security/remediation/${deviceId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  createRemediation: async (deviceId, body) => {
    const res = await fetch(`${BASE}/security/remediation/${deviceId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  updateRemediationStatus: async (actionId, status, notes = "") => {
    const res = await fetch(`${BASE}/security/remediation/action/${actionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notes }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

export default securityApi;
