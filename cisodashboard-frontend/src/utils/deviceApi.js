const BASE = "/api/v1";

const deviceApi = {
  // ── Devices ──────────────────────────────────────────────
  getDevices: async () => {
    const res = await fetch(`${BASE}/devices`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  getDeviceById: async (id) => {
    const res = await fetch(`${BASE}/devices/${id}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  deviceCheckin: async (data) => {
    const res = await fetch(`${BASE}/devices/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // ── Enrollment Tokens ────────────────────────────────────
  getTokens: async () => {
    const res = await fetch(`${BASE}/enrollment/tokens`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  generateToken: async (data) => {
    const res = await fetch(`${BASE}/enrollment/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const err = await res.json(); throw { response: { data: err } }; }
    return res.json();
  },
  revokeToken: async (tokenId) => {
    const res = await fetch(`${BASE}/enrollment/tokens/${tokenId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // ── Enrollment ───────────────────────────────────────────
  enrollDevice: async (data) => {
    const res = await fetch(`${BASE}/enrollment/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const err = await res.json(); throw { response: { data: err } }; }
    return res.json();
  },
  getEnrollmentHistory: async () => {
    const res = await fetch(`${BASE}/enrollment/history`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  getEnrollmentStats: async () => {
    const res = await fetch(`${BASE}/enrollment/stats`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // ── Bulk Upload ──────────────────────────────────────────
  bulkUploadDevices: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${BASE}/devices/bulk-upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) { const err = await res.json(); throw { response: { data: err } }; }
    return res.json();
  },

  getTemplateUrl: () => `${BASE}/devices/bulk-upload/template`,
};

export default deviceApi;