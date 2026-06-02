import api from './api';

const VENDOR_API_BASE_URL = '/api/v1/vendors';

export const vendorApi = {
  // Get all vendors
  getVendors: async (params = {}) => {
    try {
      const response = await api.get(VENDOR_API_BASE_URL, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching vendors:', error);
      throw error;
    }
  },

  // Get vendor by ID
  getVendorById: async (id) => {
    try {
      const response = await api.get(`${VENDOR_API_BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching vendor:', error);
      throw error;
    }
  },

  // Create new vendor
  createVendor: async (vendorData) => {
    try {
      const response = await api.post(VENDOR_API_BASE_URL, vendorData);
      return response.data;
    } catch (error) {
      console.error('Error creating vendor:', error);
      throw error;
    }
  },

  // Update vendor
  updateVendor: async (id, vendorData) => {
    try {
      const response = await api.put(`${VENDOR_API_BASE_URL}/${id}`, vendorData);
      return response.data;
    } catch (error) {
      console.error('Error updating vendor:', error);
      throw error;
    }
  },

  // Delete vendor
  deleteVendor: async (id) => {
    try {
      const response = await api.delete(`${VENDOR_API_BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting vendor:', error);
      throw error;
    }
  },

  // Get compliance standards
  getComplianceStandards: async () => {
    try {
      const response = await api.get(`${VENDOR_API_BASE_URL}/standards`);
      return response.data;
    } catch (error) {
      console.error('Error fetching compliance standards:', error);
      throw error;
    }
  }
};

export default vendorApi;