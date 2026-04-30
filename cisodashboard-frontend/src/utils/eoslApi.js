/**
 * EOSL API Client
 * Handles API calls for End of Service Life Management
 */
import api from './api';

/**
 * Get complete EOSL dashboard data
 * @param {number} year - Optional year for compliance data
 * @returns {Promise} - Promise resolving to EOSL dashboard data
 */
export const getEOSLDashboardData = async (year) => {
  try {
    const params = year ? { year } : {};
    const response = await api.get('/api/v1/eosl/dashboard', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching EOSL dashboard data:', error);
    throw error;
  }
};

/**
 * Get paginated list of EOSL assets
 * @param {number} skip - Number of records to skip
 * @param {number} limit - Number of records to return
 * @param {string} eoslType - Filter by EOSL type (EOS/EOL)
 * @param {string} owner - Filter by owner
 * @returns {Promise} - Promise resolving to paginated EOSL assets
 */
export const getEOSLAssets = async (skip = 0, limit = 100, eoslType = null, owner = null) => {
  try {
    const params = { skip, limit };
    if (eoslType) params.eosl_type = eoslType;
    if (owner) params.owner = owner;
    
    const response = await api.get('/api/v1/eosl/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching EOSL assets:', error);
    throw error;
  }
};

/**
 * Get single EOSL asset by ID
 * @param {number} assetId - Asset ID
 * @returns {Promise} - Promise resolving to asset details
 */
export const getEOSLAsset = async (assetId) => {
  try {
    const response = await api.get(`/api/v1/eosl/${assetId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching EOSL asset:', error);
    throw error;
  }
};

/**
 * Create new EOSL asset
 * @param {Object} assetData - Asset data
 * @returns {Promise} - Promise resolving to created asset
 */
export const createEOSLAsset = async (assetData) => {
  try {
    const payload = {
      asset_name: assetData.name || assetData.assetName,
      owner: assetData.owner,
      asset_type: assetData.type || assetData.assetType,
      eosl_type: assetData.eoslType || assetData.eosl_type,
      eosl_date: assetData.date || assetData.eoslDate,
      remark: assetData.remark || ''
    };
    
    const response = await api.post('/api/v1/eosl/', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating EOSL asset:', error);
    throw error;
  }
};

/**
 * Update EOSL asset
 * @param {number} assetId - Asset ID
 * @param {Object} assetData - Updated asset data
 * @returns {Promise} - Promise resolving to updated asset
 */
export const updateEOSLAsset = async (assetId, assetData) => {
  try {
    const payload = {};
    if (assetData.name || assetData.assetName) {
      payload.asset_name = assetData.name || assetData.assetName;
    }
    if (assetData.owner) payload.owner = assetData.owner;
    if (assetData.type || assetData.assetType) {
      payload.asset_type = assetData.type || assetData.assetType;
    }
    if (assetData.eoslType || assetData.eosl_type) {
      payload.eosl_type = assetData.eoslType || assetData.eosl_type;
    }
    if (assetData.date || assetData.eoslDate) {
      payload.eosl_date = assetData.date || assetData.eoslDate;
    }
    if (assetData.remark !== undefined) payload.remark = assetData.remark;
    
    const response = await api.put(`/api/v1/eosl/${assetId}`, payload);
    return response.data;
  } catch (error) {
    console.error('Error updating EOSL asset:', error);
    throw error;
  }
};

/**
 * Delete EOSL asset
 * @param {number} assetId - Asset ID
 * @returns {Promise} - Promise resolving when deleted
 */
export const deleteEOSLAsset = async (assetId) => {
  try {
    await api.delete(`/api/v1/eosl/${assetId}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting EOSL asset:', error);
    throw error;
  }
};

/**
 * Bulk upload EOSL assets
 * @param {Array} assets - Array of asset data
 * @returns {Promise} - Promise resolving to upload results
 */
export const bulkUploadAssets = async (assets) => {
  try {
    const payload = {
      assets: assets.map(asset => ({
        asset_name: asset.name || asset.assetName,
        owner: asset.owner,
        asset_type: asset.type || asset.assetType,
        eosl_type: asset.eoslType || asset.eosl_type,
        eosl_date: asset.date || asset.eoslDate,
        remark: asset.remark || ''
      }))
    };
    
    const response = await api.post('/api/v1/eosl/upload', payload);
    return response.data;
  } catch (error) {
    console.error('Error uploading EOSL assets:', error);
    throw error;
  }
};

export default {
  getEOSLDashboardData,
  getEOSLAssets,
  getEOSLAsset,
  createEOSLAsset,
  updateEOSLAsset,
  deleteEOSLAsset,
  bulkUploadAssets
};
