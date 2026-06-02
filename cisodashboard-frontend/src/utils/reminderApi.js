/**
 * API client for Application Reminders
 */
import api from "./api";

/**
 * Get complete reminder data including owners and applications
 * @returns {Promise<Object>} Reminder data with ownerData, applicationData, and stats
 */
export const getReminderData = async () => {
  try {
    const response = await api.get("/api/v1/reminders/");
    return response.data;
  } catch (error) {
    console.error("Error fetching reminder data:", error);
    throw error.response?.data || error;
  }
};

/**
 * Compatibility alias used by Reminder page. Returns the same payload as getReminderData.
 */
export const getFrontendReminderData = async () => {
  try {
    const response = await api.get("/api/v1/audit-reminders/frontend");
    return response.data;
  } catch (error) {
    console.error("Error fetching frontend reminder data:", error);
    throw error.response?.data || error;
  }
};

/**
 * Send a reminder for an application
 * @param {number} applicationId - Application ID
 * @param {number|null} ownerId - Optional owner ID
 * @returns {Promise<Object>} Send reminder response
 */
export const sendReminder = async (...args) => {
  // Backwards-compatible: sendReminder(applicationId, ownerId)
  // Or: sendReminder({ applicationId, ownerId, targetType, targetId })
  let payload = {};

  if (args.length === 1 && typeof args[0] === "object") {
    payload = args[0];
  } else {
    const [applicationId, ownerId] = args;
    payload = { applicationId, ownerId };
  }

  try {
    const response = await api.post("/api/v1/reminders/send", payload);
    return response.data;
  } catch (error) {
    console.error("Error sending reminder:", error);
    throw error.response?.data || error;
  }
};

export default {
  getReminderData,
  getFrontendReminderData,
  sendReminder,
};
