import api from './api';

const ASSIGNMENT_API = '/api/v1/assignments';

const assignmentApi = {
  list: async (params = {}) => {
    const response = await api.get(ASSIGNMENT_API, { params });
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`${ASSIGNMENT_API}/${id}`);
    return response.data;
  },
  getAssessments: async (id) => {
    const response = await api.get(`${ASSIGNMENT_API}/${id}/assessments`);
    return response.data;
  },
  create: async (payload) => {
    const response = await api.post(ASSIGNMENT_API, payload);
    return response.data;
  },
  updateAssessment: async (assessmentId, payload) => {
    const response = await api.put(`${ASSIGNMENT_API}/assessments/${assessmentId}`, payload);
    return response.data;
  },
  uploadPoc: async (assessmentId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(`${ASSIGNMENT_API}/assessments/${assessmentId}/poc-upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  downloadPoc: async (assessmentId) => {
    return api.get(`${ASSIGNMENT_API}/assessments/${assessmentId}/poc`, { responseType: "blob" });
  },
};

export default assignmentApi;
