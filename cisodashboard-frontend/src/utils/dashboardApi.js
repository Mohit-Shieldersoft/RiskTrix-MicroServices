/**
 * API client for Dashboard
 */
import api from './api';

/**
 * Get complete dashboard data
 * @returns {Promise<Object>} Dashboard data with all charts and tables
 */
export const getDashboardData = async () => {
  try {
    const response = await api.get('/api/v1/dashboard/data');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error.response?.data || error;
  }
};

export default {
  getDashboardData
};
