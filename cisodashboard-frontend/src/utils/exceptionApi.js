import api from './api';

const EXCEPTION_API_BASE_URL = '/api/v1/exceptions';

export const exceptionApi = {
  // Get all exceptions with optional filters
  getExceptions: async (params = {}) => {
    try {
      const response = await api.get(EXCEPTION_API_BASE_URL, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching exceptions:', error);
      throw error;
    }
  },

  // Get exception by ID
  getExceptionById: async (id) => {
    try {
      const response = await api.get(`${EXCEPTION_API_BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching exception:', error);
      throw error;
    }
  },

  // Create new exception
  createException: async (exceptionData) => {
    try {
      const response = await api.post(`${EXCEPTION_API_BASE_URL}/`, exceptionData);
      return response.data;
    } catch (error) {
      console.error('Error creating exception:', error);
      throw error;
    }
  },

  // Update exception
  updateException: async (id, exceptionData) => {
    try {
      const response = await api.put(`${EXCEPTION_API_BASE_URL}/${id}`, exceptionData);
      return response.data;
    } catch (error) {
      console.error('Error updating exception:', error);
      throw error;
    }
  },

  // Delete exception
  deleteException: async (id) => {
    try {
      const response = await api.delete(`${EXCEPTION_API_BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting exception:', error);
      throw error;
    }
  },

  // Approve or reject exception
  approveException: async (id, approvalStatus) => {
    try {
      const response = await api.post(
        `${EXCEPTION_API_BASE_URL}/${id}/approve?approval_status=${approvalStatus}`
      );
      return response.data;
    } catch (error) {
      console.error('Error approving exception:', error);
      throw error;
    }
  },

  // Get expiring exceptions
  getExpiringExceptions: async (days = 30, organizationId = null) => {
    try {
      const params = { days };
      if (organizationId) {
        params.organization_id = organizationId;
      }
      const response = await api.get(`${EXCEPTION_API_BASE_URL}/expiring/soon`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching expiring exceptions:', error);
      throw error;
    }
  },

  // Get exception statistics
  getExceptionStats: async (organizationId = null) => {
    try {
      const params = {};
      if (organizationId) {
        params.organization_id = organizationId;
      }
      const response = await api.get(`${EXCEPTION_API_BASE_URL}/stats/overview`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching exception statistics:', error);
      throw error;
    }
  },

  // Get exception form options (categories, severities, statuses)
  getExceptionOptions: async () => {
    try {
      const response = await api.get(`${EXCEPTION_API_BASE_URL}/meta/options`);
      return response.data;
    } catch (error) {
      console.error('Error fetching exception options:', error);
      throw error;
    }
  },

  // Update exception expiry date
  updateExpiry: async (exceptionId, expiryData) => {
    try {
      const params = {
        end_date: expiryData.expiryDate
      };
      if (expiryData.reason) {
        params.reason = expiryData.reason;
      }
      if (expiryData.notes) {
        params.notes = expiryData.notes;
      }
      const response = await api.patch(
        `${EXCEPTION_API_BASE_URL}/${exceptionId}/expiry`,
        null,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating exception expiry:', error);
      throw error;
    }
  }
};

export default exceptionApi;