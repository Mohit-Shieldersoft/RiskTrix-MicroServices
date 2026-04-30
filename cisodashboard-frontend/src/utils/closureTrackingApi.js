/**
 * API client for Closure Tracking (Vulnerability Management)
 * Routes via the shared api router → application-service (port 8001)
 */
import api from "./api";

const API_PREFIX = "/api/v1";

/**
 * Get all vulnerabilities with optional filters
 * @param {Object} params - Filter parameters
 * @param {string} params.search - Search term for title, description, CVE ID
 * @param {string} params.status - Filter by status (open/in_progress/closed/false_positive/accepted_risk)
 * @param {string} params.severity - Filter by severity (critical/high/medium/low)
 * @param {number} params.application_id - Filter by application ID
 * @param {number} params.vendor_id - Filter by vendor ID
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.size - Page size (default: 50)
 * @returns {Promise} Paginated list of vulnerabilities
 */
export const fetchVulnerabilities = async (params = {}) => {
  try {
    const response = await api.get(`${API_PREFIX}/vulnerabilities/`, {
      params: {
        search: params.search,
        status: params.status,
        severity: params.severity,
        application_id: params.application_id,
        vendor_id: params.vendor_id,
        page: params.page || 1,
        size: params.size || 50,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching vulnerabilities:", error);
    throw error;
  }
};

/**
 * Get vulnerability by ID
 * @param {number} id - Vulnerability ID
 * @returns {Promise} Vulnerability details
 */
export const fetchVulnerabilityById = async (id) => {
  try {
    const response = await api.get(`${API_PREFIX}/vulnerabilities/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching vulnerability ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new vulnerability
 * @param {Object} vulnerabilityData - Vulnerability data
 * @param {string} vulnerabilityData.title - Vulnerability title/name (required)
 * @param {string} vulnerabilityData.description - Description
 * @param {string} vulnerabilityData.severity - Risk level (critical/high/medium/low) (required)
 * @param {number} vulnerabilityData.application_id - Application ID
 * @param {string} vulnerabilityData.remarks - Additional remarks
 * @returns {Promise} Created vulnerability
 */
export const createVulnerability = async (vulnerabilityData) => {
  try {
    const response = await api.post(
      `${API_PREFIX}/vulnerabilities/`,
      vulnerabilityData,
    );
    return response.data;
  } catch (error) {
    console.error("Error creating vulnerability:", error);
    throw error;
  }
};

/**
 * Update an existing vulnerability
 * @param {number} id - Vulnerability ID
 * @param {Object} vulnerabilityData - Updated vulnerability data (partial)
 * @returns {Promise} Updated vulnerability
 */
export const updateVulnerability = async (id, vulnerabilityData) => {
  try {
    const response = await api.put(
      `${API_PREFIX}/vulnerabilities/${id}`,
      vulnerabilityData,
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating vulnerability ${id}:`, error);
    throw error;
  }
};

/**
 * Update vulnerability status
 * @param {number} id - Vulnerability ID
 * @param {string} status - New status (open/in_progress/closed/false_positive/accepted_risk)
 * @returns {Promise} Updated vulnerability
 */
export const updateVulnerabilityStatus = async (id, status) => {
  try {
    const response = await api.put(
      `${API_PREFIX}/vulnerabilities/${id}/status`,
      { status },
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating vulnerability status ${id}:`, error);
    throw error;
  }
};

/**
 * Update vulnerability remarks
 * @param {number} id - Vulnerability ID
 * @param {string} remarks - New remarks text
 * @returns {Promise} Updated vulnerability
 */
export const updateVulnerabilityRemarks = async (id, remarks) => {
  try {
    const response = await api.put(
      `${API_PREFIX}/vulnerabilities/${id}/remarks`,
      { remarks },
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating vulnerability remarks ${id}:`, error);
    throw error;
  }
};

/**
 * Upload POC file for vulnerability
 * @param {number} id - Vulnerability ID
 * @param {File} file - File to upload
 * @returns {Promise} Upload response with file path
 */
export const uploadPOCFile = async (id, file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(
      `${API_PREFIX}/vulnerabilities/${id}/poc-upload`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  } catch (error) {
    console.error(`Error uploading POC file for vulnerability ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a vulnerability
 * @param {number} id - Vulnerability ID
 * @returns {Promise} Success response
 */
export const deleteVulnerability = async (id) => {
  try {
    const response = await api.delete(`${API_PREFIX}/vulnerabilities/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting vulnerability ${id}:`, error);
    throw error;
  }
};

/**
 * Get vulnerability statistics
 * @param {number} application_id - Optional application ID filter
 * @returns {Promise} Statistics including total, open, closed counts
 */
export const fetchVulnerabilityStatistics = async (application_id = null) => {
  try {
    const params = application_id ? { application_id } : {};
    const response = await api.get(`${API_PREFIX}/vulnerabilities/statistics`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching vulnerability statistics:", error);
    throw error;
  }
};

export default {
  fetchVulnerabilities,
  fetchVulnerabilityById,
  createVulnerability,
  updateVulnerability,
  updateVulnerabilityStatus,
  updateVulnerabilityRemarks,
  uploadPOCFile,
  deleteVulnerability,
  fetchVulnerabilityStatistics,
};
