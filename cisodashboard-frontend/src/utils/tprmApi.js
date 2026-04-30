/**
 * TPRM API Client
 * Handles API calls for Third-Party Risk Management
 */
import api from './api';

// Helper: convert snake_case keys from backend to camelCase expected by frontend
const toCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

const normalizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  Object.keys(obj).forEach((k) => {
    out[toCamel(k)] = obj[k];
  });
  return out;
};

const normalizeVendor = (v) => {
  if (!v) return v;
  // Some vendor fields come as snake_case (non_compliant_apps etc.)
  const normalized = normalizeObject(v);
  // Also normalize nested dates/ids if present
  if (normalized.expiryDate === undefined && v.expiry_date !== undefined) normalized.expiryDate = v.expiry_date;
  if (normalized.auditDate === undefined && v.audit_date !== undefined) normalized.auditDate = v.audit_date;
  return normalized;
};

/**
 * Get complete TPRM dashboard data
 * @returns {Promise<Object>} TPRM data with vendors, expiredVendors, and delayedVendors
 */
export const getTPRMData = async () => {
  try {
    const response = await api.get('/api/v1/tprm/');
    // Normalize backend snake_case keys to the camelCase shape used by the frontend
    const data = response.data || {};
    const rawVendors = data.vendors || [];
    const rawExpired = data.expiredVendors || data.expired_vendors || [];
    const rawDelayed = data.delayedVendors || data.delayed_vendors || [];

    return {
      vendors: rawVendors.map(normalizeVendor),
      expiredVendors: rawExpired.map(normalizeVendor),
      delayedVendors: rawDelayed.map(normalizeVendor),
      // include any other top-level keys transparently (keep originals)
      ...Object.fromEntries(Object.entries(data).filter(([k]) => !['vendors','expiredVendors','expired_vendors','delayedVendors','delayed_vendors'].includes(k)))
    };
  } catch (error) {
    console.error('Error fetching TPRM data:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get TPRM statistics
 * @returns {Promise<Object>} TPRM stats with counts
 */
export const getTPRMStats = async () => {
  try {
    const response = await api.get('/api/v1/tprm/');
    const data = response.data || {};

    // Backend returns snake_case keys: expired_vendors, delayed_vendors
    // Frontend expects: vendors, expiredVendors, delayedVendors
    const vendors = (data.vendors || []).map(normalizeVendor);
    const expiredVendors = (data.expired_vendors || data.expiredVendors || []).map(normalizeVendor);
    const delayedVendors = (data.delayed_vendors || data.delayedVendors || []).map(normalizeVendor);

    return { vendors, expiredVendors, delayedVendors };
  } catch (error) {
    console.error('Error fetching TPRM stats:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get vendor tracker data only
 * @returns {Promise<Array>} List of vendors with compliance metrics
 */
export const getVendorTrackerData = async () => {
  try {
    const response = await api.get('/api/v1/tprm/vendors');
    return (response.data || []).map(normalizeVendor);
  } catch (error) {
    console.error('Error fetching vendor tracker data:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get delayed vendors data only
 * @returns {Promise<Array>} List of delayed vendors
 */
export const getDelayedVendors = async () => {
  try {
    const response = await api.get('/api/v1/tprm/delayed');
    return (response.data || []).map(normalizeVendor);
  } catch (error) {
    console.error('Error fetching delayed vendors:', error);
    throw error.response?.data || error;
  }
};

/**
 * Get expired vendors data only
 * @returns {Promise<Array>} List of expired vendors
 */
export const getExpiredVendors = async () => {
  try {
    const response = await api.get('/api/v1/tprm/expired');
    return (response.data || []).map(normalizeVendor);
  } catch (error) {
    console.error('Error fetching expired vendors:', error);
    throw error.response?.data || error;
  }
};

/**
 * Send notification to a vendor
 * @param {number} vendorId - Vendor database ID (not the VEN-XXX string)
 * @param {string|null} message - Optional custom notification message
 * @returns {Promise<Object>} Notification response
 */
export const sendVendorNotification = async (vendorId, message = null) => {
  try {
    const response = await api.post(
      `/api/v1/tprm/notify/${vendorId}`,
      message ? { vendor_id: vendorId, message } : { vendor_id: vendorId }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending vendor notification:', error);
    throw error.response?.data || error;
  }
};

export default {
  getTPRMData,
  getTPRMStats,
  getVendorTrackerData,
  getDelayedVendors,
  getExpiredVendors,
  sendVendorNotification
};
