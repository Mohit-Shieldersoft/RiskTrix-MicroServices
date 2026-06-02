const BASE = "/api/v1";

const heartbeatApi = {
  // Simulate a device agent check-in (useful for testing)
  checkin: async (payload) => {
    const res = await fetch(`${BASE}/agent/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Get heartbeat status for a single device
  getStatus: async (deviceId) => {
    const res = await fetch(`${BASE}/agent/status/${deviceId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Get heartbeat status for ALL devices
  getAllStatus: async () => {
    const res = await fetch(`${BASE}/agent/status`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Manually trigger offline detection
  markOffline: async () => {
    const res = await fetch(`${BASE}/agent/mark-offline`, { method: "POST" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

export default heartbeatApi;
