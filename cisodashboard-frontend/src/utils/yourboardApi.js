/**
 * YourBoard API utilities
 * Aggregates real-time dashboard metrics from application-service and audit-service
 */

import api from "./api";

/**
 * Fetch YourBoard metrics aggregated from application-service and audit-service.
 * - App Track: total applications (application-service /api/v1/applications)
 * - Infra Track: open vulnerabilities (application-service /api/v1/vulnerabilities?status=open)
 * - Audit Track: non-compliant vendors (audit-service /api/v1/vendors/dashboard)
 * - Exceptions: active exceptions (audit-service /api/v1/exceptions/stats/overview)
 *
 * @returns {Promise<Object>} Dashboard metrics with trends
 */
export const fetchYourBoardMetrics = async () => {
  try {
    const [appsRes, vulnRes, vendorRes, exceptionsRes] =
      await Promise.allSettled([
        api.get("/api/v1/applications", { params: { skip: 0, limit: 1 } }),
        api.get("/api/v1/vulnerabilities", {
          params: { status: "open", skip: 0, limit: 1 },
        }),
        api.get("/api/v1/vendors/dashboard"),
        api.get("/api/v1/exceptions/stats/overview"),
      ]);

    // App Track: total application count
    let appCount = 0;
    if (appsRes.status === "fulfilled" && appsRes.value?.data) {
      appCount = appsRes.value.data.total ?? appsRes.value.data.length ?? 0;
    }

    // Infra Track: total open vulnerability count
    let vulnCount = 0;
    if (vulnRes.status === "fulfilled" && vulnRes.value?.data) {
      vulnCount = vulnRes.value.data.total ?? vulnRes.value.data.length ?? 0;
    }

    // Audit Track: non-compliant vendor count
    let nonCompliantCount = 0;
    if (vendorRes.status === "fulfilled" && vendorRes.value?.data) {
      const dash = vendorRes.value.data;
      // Response shape: { stats: { non_compliant_vendors: N }, risk_distribution: {...}, ... }
      nonCompliantCount =
        dash.stats?.non_compliant_vendors ??
        dash.non_compliant_vendors ??
        dash.nonCompliantVendors ??
        0;
    }

    // Exceptions: active exception count
    let exceptionsCount = 0;
    if (exceptionsRes.status === "fulfilled" && exceptionsRes.value?.data) {
      const stats = exceptionsRes.value.data;
      exceptionsCount =
        stats.active_exceptions ??
        stats.activeExceptions ??
        stats.total_active ??
        stats.active ??
        stats.total ??
        0;
    }

    const metrics = [
      {
        title: "App Track",
        count: appCount,
        unit: "apps",
        trend: 0,
        trendDirection: "up",
        trendPeriod: "This month",
      },
      {
        title: "Infra Track",
        count: vulnCount,
        unit: "vuln",
        trend: 0,
        trendDirection: "down",
        trendPeriod: "This month",
      },
      {
        title: "Audit Track",
        count: nonCompliantCount,
        unit: "NC",
        trend: 0,
        trendDirection: "up",
        trendPeriod: "This month",
      },
      {
        title: "Exceptions",
        count: exceptionsCount,
        unit: "cases",
        trend: 0,
        trendDirection: "up",
        trendPeriod: "This month",
      },
    ];

    return {
      success: true,
      data: {
        metrics,
        lastUpdated: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Error fetching YourBoard metrics:", error);
    return {
      success: false,
      error: error.message,
      data: getFallbackMetrics(),
    };
  }
};

/**
 * Fallback metrics when API is unavailable
 * Maintains UI functionality during development or API issues
 */
const getFallbackMetrics = () => {
  return {
    success: true,
    metrics: [
      {
        title: "App Track",
        count: 0,
        unit: "apps",
        trend: 0,
        trendDirection: "up",
        trendPeriod: "This month",
      },
      {
        title: "Infra Track",
        count: 0,
        unit: "vuln",
        trend: 0,
        trendDirection: "down",
        trendPeriod: "This month",
      },
      {
        title: "Audit Track",
        count: 0,
        unit: "NC",
        trend: 0,
        trendDirection: "up",
        trendPeriod: "This month",
      },
      {
        title: "Exceptions",
        count: 0,
        unit: "cases",
        trend: 0,
        trendDirection: "up",
        trendPeriod: "This month",
      },
    ],
    lastUpdated: new Date().toISOString(),
    currentMonth: new Date().toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
  };
};

/**
 * Format metrics data for UI consumption
 * Ensures consistent data structure for components
 */
export const formatMetricsForUI = (apiResponse) => {
  if (!apiResponse || !apiResponse.metrics) {
    return getFallbackMetrics().metrics;
  }

  return apiResponse.metrics.map((metric) => ({
    ...metric,
    // Ensure count is always a number for consistency
    count:
      typeof metric.count === "string"
        ? parseInt(metric.count, 10)
        : metric.count,
    // Ensure trend is absolute value
    trend: Math.abs(metric.trend),
  }));
};

export default {
  fetchYourBoardMetrics,
  formatMetricsForUI,
};
