// Microservices API Router
// Routes requests to the appropriate microservice based on the endpoint

import axios from "axios";
import { getToken, isDemoAccount } from "./auth";

/**
 * Browser clients must never use Docker Compose DNS names
 * (audit-service, application-service, ...). Those only resolve
 * inside the compose network. Always pin to loopback ports.
 */
function forceLoopback(url) {
  if (!url) return url;
  return String(url).replace(
    /^https?:\/\/(?!127\.0\.0\.1|localhost)[A-Za-z0-9_-]+:/i,
    "http://127.0.0.1:",
  );
}

const APPLICATION_SERVICE_URL = forceLoopback(import.meta.env.VITE_APPLICATION_SERVICE_URL || "http://127.0.0.1:8001");
const AUDIT_SERVICE_URL = forceLoopback(import.meta.env.VITE_AUDIT_SERVICE_URL || "http://127.0.0.1:8002");
const MONOLITH_URL = forceLoopback(import.meta.env.VITE_MONOLITH_URL || "http://127.0.0.1:8000");
const AGENT_SERVICE_URL = forceLoopback(import.meta.env.VITE_AGENT_SERVICE_URL || "http://127.0.0.1:8010");
const BINARY_ANALYSIS_SERVICE_URL = forceLoopback(import.meta.env.VITE_BINARY_ANALYSIS_SERVICE_URL || "http://127.0.0.1:8011");
const INTEGRITY_SERVICE_URL = forceLoopback(import.meta.env.VITE_INTEGRITY_SERVICE_URL || "http://127.0.0.1:8012");
const THREAT_INTELLIGENCE_SERVICE_URL = forceLoopback(import.meta.env.VITE_THREAT_INTELLIGENCE_SERVICE_URL || "http://127.0.0.1:8013");
const CSPM_SERVICE_URL = forceLoopback(import.meta.env.VITE_CSPM_SERVICE_URL || "http://127.0.0.1:8014");
const CIEM_SERVICE_URL = forceLoopback(import.meta.env.VITE_CIEM_SERVICE_URL || "http://127.0.0.1:8015");
const K8S_CONTAINER_SERVICE_URL = forceLoopback(import.meta.env.VITE_K8S_CONTAINER_SERVICE_URL || "http://127.0.0.1:8016");
const ALERT_NOTIFICATION_SERVICE_URL = forceLoopback(import.meta.env.VITE_ALERT_NOTIFICATION_SERVICE_URL || "http://127.0.0.1:8017");
const IP_SCANNER_SERVICE_URL = forceLoopback(import.meta.env.VITE_IP_SCANNER_SERVICE_URL || "http://127.0.0.1:8018");

// Define which paths belong to which service
const SERVICE_ROUTES = {
  application: [
    "/api/v1/applications",
    "/api/v1/vulnerabilities",
    "/api/v1/app-history",
    "/api/v1/dashboard", // Vulnerability dashboard/ageing data
    "/api/v1/reminders",
    "/api/v1/eosl",
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
    "/api/v1/invitations",
    "/api/v1/roles",
    "/api/v1/permissions",
    "/api/v1/platform-audit",
    "/api/v1/standards",
    "/api/v1/smtp-configs",
  ],
  agent: ["/api/v1/agents", "/api/v1/endpoints"],
  binaryAnalysis: ["/api/v1/binary", "/api/v1/yara"],
  integrity: ["/api/v1/integrity"],
  threatIntelligence: ["/api/v1/threats", "/api/v1/cve"],
  cspm: [
    "/api/v1/cloud",
    "/api/v1/correlation",
    "/api/v1/search",
    "/api/v1/security-score",
  ],
  ciem: ["/api/v1/ciem"],
  k8sContainer: ["/api/v1/kubernetes", "/api/v1/containers", "/api/v1/runtime"],
  ipScanner: ["/api/v1/ip-scanner"],
  alertsNotification: [
    "/api/v1/alerts",
    "/api/v1/notifications",
    "/api/v1/webhooks",
    "/api/v1/soar",
  ],
};

// Determine which service to use based on the request path
function getServiceURL(path) {
  // Check IP Scanner service routes
  for (const route of SERVICE_ROUTES.ipScanner) {
    if (path.startsWith(route)) {
      return IP_SCANNER_SERVICE_URL;
    }
  }

  // Check Alert & Notification service routes
  for (const route of SERVICE_ROUTES.alertsNotification) {
    if (path.startsWith(route)) {
      return ALERT_NOTIFICATION_SERVICE_URL;
    }
  }

  // Check K8s container service routes
  for (const route of SERVICE_ROUTES.k8sContainer) {
    if (path.startsWith(route)) {
      return K8S_CONTAINER_SERVICE_URL;
    }
  }

  // Check CIEM service routes
  for (const route of SERVICE_ROUTES.ciem) {
    if (path.startsWith(route)) {
      return CIEM_SERVICE_URL;
    }
  }

  // Check CSPM service routes
  for (const route of SERVICE_ROUTES.cspm) {
    if (path.startsWith(route)) {
      return CSPM_SERVICE_URL;
    }
  }
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
    const baseURL = forceLoopback(getServiceURL(path));

    config.baseURL = baseURL;
    if (config.url) {
      config.url = forceLoopback(config.url);
    }

    // Attach auth token
    const token = getToken();
    if (token && config && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (isDemoAccount() && config && config.headers) {
      config.headers["X-RiskTrix-Demo"] = "1";
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
export {
  APPLICATION_SERVICE_URL,
  AUDIT_SERVICE_URL,
  MONOLITH_URL,
  K8S_CONTAINER_SERVICE_URL,
  ALERT_NOTIFICATION_SERVICE_URL,
  IP_SCANNER_SERVICE_URL,
};

