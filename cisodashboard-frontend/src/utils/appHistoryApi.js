import api from './api';

/**
 * Get application history data for vulnerability tracking
 * @param {number} year - Optional year to filter data (defaults to current year on backend)
 * @returns {Promise} - Promise resolving to app history data
 */
export const getAppHistoryData = async (year) => {
  try {
    const params = year ? { year } : {};
    const response = await api.get('/api/v1/app-history/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching app history data:', error);
    throw error;
  }
};

export default {
  getAppHistoryData
};
