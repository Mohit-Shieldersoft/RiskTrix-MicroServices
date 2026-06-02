// Microservices API Router
// Routes requests to the appropriate microservice based on the endpoint

import axios from "axios";
import { getToken } from "./auth";

// Microservice base URLs
const APPLICATION_SERVICE_URL =
  import.meta.env.VITE_APPLICATION_SERVICE_URL || "/";
const AUDIT_SERVICE_URL =
  import.meta.env.VITE_AUDIT_SERVICE_URL || "/";
const MONOLITH_URL =
  import.meta.env.VITE_API_BASE_URL || "/";

// Define which paths belong to which service
const SERVICE_ROUTES = {
  application: [
    "/api/v1/applications",
    "/api/v1/vulnerabilities",
    "/api/v1/reminders",
    "/api/v1/app-history",
  ],
  audit: [
    "/api/v1/vendors",
    "/api/v1/certificates",
    "/api/v1/exceptions",
    "/api/v1/compliance",
    "/api/v1/assignments",
    "/api/v1/assessments",
    "/api/v1/tprm",
  ],
  monolith: [
    "/api/v1/users",
    "/api/v1/auth",
    "/api/v1/login",
    "/api/v1/register",
    "/api/v1/organizations",
    "/api/v1/dashboard",
    "/api/v1/activity",
    "/api/v1/eosl",
    "/api/v1/yourboard",
    "/api/v1/intelligence",
    "/api/v1/closure-tracking",
  ],
};

// Determine which service to use based on the request path
function getServiceURL(path) {
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

// Request interceptor - attach token only (routing via Nginx proxy, no baseURL needed)
api.interceptors.request.use(
  (config) => {
    // Attach auth token
    const token = getToken();
    if (token && config && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log for debugging (remove in production)
    console.log(
      `[API Router] ${config.method?.toUpperCase()} ${config.url}`,
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
    } else {
      console.error("[API Router] Request error:", error.message);
    }
    return Promise.reject(error);
  },
);

export default api;

// Export service URLs for direct access if needed
export { APPLICATION_SERVICE_URL, AUDIT_SERVICE_URL, MONOLITH_URL };
