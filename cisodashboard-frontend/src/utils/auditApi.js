import api from "./api";

/**
 * Audit API service for dashboard statistics and compliance data
 */
const auditApi = {
  /**
   * Get audit history (compliance history, expired vendors, trends, standard compliance)
   */
  getAuditHistory: async () => {
    try {
      const resp = await api.get("/api/v1/audit/history");
      return resp.data;
    } catch (err) {
      console.error("Error fetching audit history:", err);
      throw err.response?.data || err;
    }
  },

  getStatistics: async () => {
    try {
      const response = await api.get("/api/v1/audit/statistics");
      return response.data;
    } catch (error) {
      console.error("Error fetching audit statistics:", error);
      throw error;
    }
  },

  getISO27001Compliance: async () => {
    try {
      const response = await api.get("/api/v1/audit/iso27001-compliance");
      return response.data;
    } catch (error) {
      console.error("Error fetching ISO 27001 compliance:", error);
      throw error;
    }
  },

  getPCIDSSCompliance: async () => {
    try {
      const response = await api.get("/api/v1/audit/pcidss-compliance");
      return response.data;
    } catch (error) {
      console.error("Error fetching PCI-DSS compliance:", error);
      throw error;
    }
  },

  getTopVendors: async (limit = 5) => {
    try {
      const response = await api.get(
        `/api/v1/audit/top-vendors?limit=${limit}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching top vendors:", error);
      throw error;
    }
  },

  /** GET /api/v1/vendors/ — list vendors with optional search */
  getVendors: async (params = {}) => {
    try {
      const response = await api.get("/api/v1/vendors/", { params });
      return response.data;
    } catch (error) {
      console.error("Error fetching vendors:", error);
      throw error;
    }
  },

  /** POST /api/v1/vendors/ — create a new vendor */
  createVendor: async (payload) => {
    try {
      const response = await api.post("/api/v1/vendors/", payload);
      return response.data;
    } catch (error) {
      console.error("Error creating vendor:", error);
      throw error;
    }
  },

  /** POST /api/v1/certificates/ — create a certificate for a vendor */
  createCertificate: async (payload) => {
    try {
      const response = await api.post("/api/v1/certificates/", payload);
      return response.data;
    } catch (error) {
      console.error("Error creating certificate:", error);
      throw error;
    }
  },
};

export default auditApi;
