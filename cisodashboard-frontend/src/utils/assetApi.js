import api from "./api";

const BASE = "/api/v1";

const assetApi = {
  getAssets: async () => {
    try {
      const res = await api.get("/api/v1/assets");
      return res.data;
    } catch (err) {
      console.error("Error fetching assets:", err);
      throw err;
    }
  },

  getAssetById: async (id) => {
    try {
      const res = await api.get(`/api/v1/assets/${id}`);
      return res.data;
    } catch (err) {
      console.error("Error fetching asset:", err);
      throw err;
    }
  },

  createAsset: async (data) => {
    try {
      const res = await api.post("/api/v1/assets", data);
      return res.data;
    } catch (err) {
      console.error("Error creating asset:", err);
      throw err;
    }
  },

  updateAsset: async (id, data) => {
    try {
      const res = await api.put(`/api/v1/assets/${id}`, data);
      return res.data;
    } catch (err) {
      console.error("Error updating asset:", err);
      throw err;
    }
  },

  // ✅ NEW
  deleteAsset: async (id) => {
    try {
      const res = await api.delete(`/api/v1/assets/${id}`);
      return res.data;
    } catch (err) {
      console.error("Error deleting asset:", err);
      throw err;
    }
  },

  getDashboard: async () => {
    try {
      const res = await api.get("/api/v1/assets/dashboard");
      return res.data;
    } catch (err) {
      console.error("Error fetching assets dashboard:", err);
      throw err;
    }
  },

  // ── Bulk import ──────────────────────────────────────────────────────────
  importAssets: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${BASE}/assets/import`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(err.detail || "Upload failed");
    }
    return res.json();
  },

  // ── Vulnerabilities ──────────────────────────────────────────────────────
  getVulnerabilities: async (assetId) => {
    const res = await fetch(`${BASE}/assets/${assetId}/vulnerabilities`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  addVulnerability: async (assetId, data) => {
    const res = await fetch(`${BASE}/assets/${assetId}/vulnerabilities`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const err = await res.json(); throw err; }
    return res.json();
  },
  updateVulnerability: async (assetId, vulnId, data) => {
    const res = await fetch(`${BASE}/assets/${assetId}/vulnerabilities/${vulnId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const err = await res.json(); throw err; }
    return res.json();
  },
  deleteVulnerability: async (assetId, vulnId) => {
    const res = await fetch(`${BASE}/assets/${assetId}/vulnerabilities/${vulnId}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
  },

  // ── Software inventory ───────────────────────────────────────────────────
  getSoftware: async (assetId) => {
    const res = await fetch(`${BASE}/assets/${assetId}/software`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  addSoftware: async (assetId, data) => {
    const res = await fetch(`${BASE}/assets/${assetId}/software`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const err = await res.json(); throw err; }
    return res.json();
  },
  deleteSoftware: async (assetId, swId) => {
    const res = await fetch(`${BASE}/assets/${assetId}/software/${swId}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
  },

  // ── Change log ───────────────────────────────────────────────────────────
  getChangelog: async (assetId) => {
    const res = await fetch(`${BASE}/assets/${assetId}/changelog`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

export default assetApi;