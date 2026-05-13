// Microservices API Router
// Routes requests to the appropriate microservice based on the endpoint

import axios from "axios";
import { getToken } from "./auth";

// Microservice base URLs
const APPLICATION_SERVICE_URL =
  import.meta.env.VITE_APPLICATION_SERVICE_URL || "http://localhost:8001";
const AUDIT_SERVICE_URL =
  import.meta.env.VITE_AUDIT_SERVICE_URL || "http://localhost:8002";
const MONOLITH_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const AGENT_SERVICE_URL =
  import.meta.env.VITE_AGENT_SERVICE_URL || "http://localhost:8010";
const BINARY_ANALYSIS_SERVICE_URL =
  import.meta.env.VITE_BINARY_ANALYSIS_SERVICE_URL || "http://localhost:8011";
const INTEGRITY_SERVICE_URL =
  import.meta.env.VITE_INTEGRITY_SERVICE_URL || "http://localhost:8012";
const THREAT_INTELLIGENCE_SERVICE_URL =
  import.meta.env.VITE_THREAT_INTELLIGENCE_SERVICE_URL ||
  "http://localhost:8013";

// Define which paths belong to which service
const SERVICE_ROUTES = {
  application: [
    "/api/v1/applications",
    "/api/v1/vulnerabilities",
    "/api/v1/app-history",
    "/api/v1/dashboard", // Vulnerability dashboard/ageing data
    "/api/v1/reminders",
    "/api/v1/eosl",
    "/api/v1/auth",
  ],
  audit: [
    "/api/v1/audit",
    "/api/v1/vendors",
    "/api/v1/vendor-notifications",
    "/api/v1/certificates",
    "/api/v1/exceptions",
    "/api/v1/compliance",
    "/api/v1/assignments",
    "/api/v1/assessments",
    "/api/v1/tprm",
    "/api/v1/audit-reminders",
  ],
  monolith: [
    "/api/v1/users",
    "/api/v1/auth",
    "/api/v1/login",
    "/api/v1/register",
    "/api/v1/organizations",
  ],
  agent: ["/api/v1/agents", "/api/v1/endpoints"],
  binaryAnalysis: ["/api/v1/binary", "/api/v1/yara"],
  integrity: ["/api/v1/integrity"],
  threatIntelligence: ["/api/v1/threats", "/api/v1/cve"],
};

// Determine which service to use based on the request path
function getServiceURL(path) {
  // Check agent service routes
  for (const route of SERVICE_ROUTES.agent) {
    if (path.startsWith(route)) {
      return AGENT_SERVICE_URL;
    }
  }

  // Check binary analysis service routes
  for (const route of SERVICE_ROUTES.binaryAnalysis) {
    if (path.startsWith(route)) {
      return BINARY_ANALYSIS_SERVICE_URL;
    }
  }

  // Check integrity service routes
  for (const route of SERVICE_ROUTES.integrity) {
    if (path.startsWith(route)) {
      return INTEGRITY_SERVICE_URL;
    }
  }

  // Check threat intelligence service routes
  for (const route of SERVICE_ROUTES.threatIntelligence) {
    if (path.startsWith(route)) {
      return THREAT_INTELLIGENCE_SERVICE_URL;
    }
  }

  // Check application service routes
  for (const route of SERVICE_ROUTES.application) {
    if (path.startsWith(route)) {
      return APPLICATION_SERVICE_URL;
    }
  }

  // Check audit service routes
  for (const route of SERVICE_ROUTES.audit) {
    if (path.startsWith(route)) {
      return AUDIT_SERVICE_URL;
    }
  }

  // Check monolith routes (fallback for auth, users, etc.)
  for (const route of SERVICE_ROUTES.monolith) {
    if (path.startsWith(route)) {
      return MONOLITH_URL;
    }
  }

  // Default fallback to monolith
  console.warn(
    `[API Router] No service route found for ${path}, using monolith`,
  );
  return MONOLITH_URL;
}

// Create axios instance with intelligent routing
const api = axios.create({
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

// Request interceptor - route to correct service and attach token
api.interceptors.request.use(
  (config) => {
    // Determine the correct base URL for this request
    const path = config.url || "";
    const baseURL = getServiceURL(path);

    // Set the base URL for this request
    config.baseURL = baseURL;

    // Attach auth token
    const token = getToken();
    if (token && config && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log for debugging (remove in production)
    console.log(
      `[API Router] ${config.method?.toUpperCase()} ${path} → ${baseURL}`,
    );

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(
        `[API Router] Error ${error.response.status}:`,
        error.response.data,
      );
    } else if (error.request) {
      console.error("[API Router] No response received:", error.message);
      // Friendly message for service down
      if (error.config?.baseURL?.includes("8000")) {
        console.warn(
          "💡 Monolith service (port 8000) is not running. Auth/Users features unavailable.",
        );
      }
    } else {
      console.error("[API Router] Request error:", error.message);
    }
    return Promise.reject(error);
  },
);

export default api;

// Export service URLs for direct access if needed
export { APPLICATION_SERVICE_URL, AUDIT_SERVICE_URL, MONOLITH_URL };
