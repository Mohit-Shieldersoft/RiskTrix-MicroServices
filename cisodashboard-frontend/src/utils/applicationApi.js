import api from './api';

const BASE = '/api/v1/applications/'; // Added trailing slash to prevent 307 redirects

const applicationApi = {
  createApplication: async (payload) => {
    try {
      const resp = await api.post(BASE, payload);
      return resp.data;
    } catch (err) {
      // normalize axios error
      if (err.response && err.response.data) throw err.response.data;
      throw err;
    }
  },

  listApplications: async (params = {}) => {
    const resp = await api.get(BASE, { params });
    return resp.data;
  },

  getApplication: async (id) => {
    const resp = await api.get(`${BASE}${id}`); // Changed to avoid double slash
    return resp.data;
  },

  bulkUploadApplications: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const resp = await api.post(`${BASE}bulk-upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return resp.data;
    } catch (err) {
      if (err.response && err.response.data) throw err.response.data;
      throw err;
    }
  }
};

export default applicationApi;
