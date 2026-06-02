const BASE = "/api/v1";

const queueApi = {
  getStats: async () => {
    const res = await fetch(`${BASE}/queue/stats`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getEvents: async ({ status = "", limit = 50 } = {}) => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (limit) params.append("limit", String(limit));
    const res = await fetch(`${BASE}/queue/events?${params.toString()}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getEvent: async (eventId) => {
    const res = await fetch(`${BASE}/queue/events/${eventId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  replayEvent: async (eventId) => {
    const res = await fetch(`${BASE}/queue/replay/${eventId}`, { method: "POST" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

export default queueApi;
