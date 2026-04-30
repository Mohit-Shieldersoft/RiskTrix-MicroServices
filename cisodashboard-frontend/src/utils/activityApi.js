import api from "./api";

/**
 * Fetch activity logs with optional filters
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.size - Items per page (default: 50)
 * @param {number} params.days - Days to look back (default: 7)
 * @param {string|string[]} params.activity_type - Filter by activity type(s)
 * @param {string|string[]} params.priority - Filter by priority level(s)
 * @param {string} params.entity_type - Filter by entity type
 * @param {number} params.entity_id - Filter by entity ID
 * @param {number} params.user_id - Filter by user ID
 * @param {boolean} params.is_read - Filter by read status
 * @param {string|string[]} params.tags - Filter by tags
 * @returns {Promise<Object>} Activity logs response
 */
export const fetchActivities = async (params = {}) => {
  try {
    const response = await api.get("/api/v1/activities", {
      params: {
        page: params.page || 1,
        size: params.size || 50,
        days: params.days || 7,
        activity_type: params.activity_type,
        priority: params.priority,
        entity_type: params.entity_type,
        entity_id: params.entity_id,
        user_id: params.user_id,
        is_read: params.is_read,
        tags: params.tags,
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error fetching activities:", error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message,
      data: null,
    };
  }
};

/**
 * Get activity statistics
 * @param {number} days - Days to calculate statistics for (default: 7)
 * @returns {Promise<Object>} Statistics response
 */
export const getActivityStatistics = async (days = 7) => {
  try {
    const response = await api.get("/api/v1/activities-statistics", {
      params: { days },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error fetching activity statistics:", error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message,
      data: null,
    };
  }
};

/**
 * Get activities for a specific entity
 * @param {string} entityType - Type of entity (e.g., 'application', 'vendor')
 * @param {number} entityId - ID of the entity
 * @returns {Promise<Object>} Activities response
 */
export const getActivitiesByEntity = async (entityType, entityId) => {
  try {
    const response = await api.get(
      `/api/v1/activities/by-entity/${entityType}/${entityId}`,
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error fetching entity activities:", error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message,
      data: null,
    };
  }
};

/**
 * Mark activities as read
 * @param {number[]} activityIds - Array of activity IDs to mark as read
 * @returns {Promise<Object>} Update response
 */
export const markActivitiesAsRead = async (activityIds) => {
  try {
    const response = await api.post(
      "/api/v1/activities/mark-read",
      activityIds,
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error marking activities as read:", error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message,
      data: null,
    };
  }
};

/**
 * Create a new activity log
 * @param {Object} activityData - Activity data
 * @returns {Promise<Object>} Created activity
 */
export const createActivity = async (activityData) => {
  try {
    const response = await api.post("/api/v1/activities", activityData);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error creating activity:", error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message,
      data: null,
    };
  }
};

/**
 * Get priority color for display
 * @param {string} priority - Priority level (low, medium, high, critical)
 * @returns {string} MUI color name
 */
export const getPriorityColor = (priority) => {
  const colors = {
    low: "default",
    medium: "info",
    high: "warning",
    critical: "error",
  };
  return colors[priority?.toLowerCase()] || "default";
};

/**
 * Get activity type icon name
 * @param {string} activityType - Activity type
 * @returns {string} Icon name
 */
export const getActivityIcon = (activityType) => {
  const type = activityType?.toLowerCase() || "";

  if (type.includes("application")) return "Computer";
  if (type.includes("vendor")) return "Store";
  if (type.includes("certificate")) return "Security";
  if (type.includes("vulnerability")) return "BugReport";
  if (type.includes("compliance")) return "Gavel";
  if (type.includes("exception")) return "ErrorOutline";
  if (type.includes("eosl")) return "CalendarToday";
  if (type.includes("user")) return "Person";
  if (type.includes("audit")) return "Assessment";
  if (type.includes("system")) return "Settings";

  return "NotificationsActive";
};

/**
 * Format activity type for display
 * @param {string} activityType - Activity type enum value
 * @returns {string} Formatted string
 */
export const formatActivityType = (activityType) => {
  if (!activityType) return "";

  return activityType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Format relative time
 * @param {string} dateString - ISO date string
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
};
