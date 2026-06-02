import axios from "axios";
import { getToken, setToken, setRefreshToken, removeToken, removeRefreshToken } from "./auth";

// Service URLs exported for reference (these are used through the Nginx proxy)
const APPLICATION_SERVICE_URL = "/";
const AUDIT_SERVICE_URL = "/";
const ASSET_SERVICE_URL = "/";
const MONOLITH_URL = "/";

// Create axios instance - no baseURL, use relative paths
const api = axios.create({
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

// Request interceptor - attach token and log requests
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && config && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error),
);

// Track if a refresh is in progress to avoid multiple simultaneous refreshes
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor — auto-refresh on 401, then redirect to login on failure
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid retrying the refresh endpoint itself
      if (originalRequest.url?.includes("/auth/refresh") || originalRequest.url?.includes("/auth/login")) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("rt_refresh_token");
      if (!refreshToken) {
        // No refresh token — send to login
        removeToken();
        removeRefreshToken();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const res = await axios.post("/api/v1/auth/refresh", { refresh_token: refreshToken });
        const newAccess = res.data.access_token;
        const newRefresh = res.data.refresh_token;
        setToken(newAccess);
        if (newRefresh) setRefreshToken(newRefresh);
        if (res.data.user) localStorage.setItem("rt_user_profile", JSON.stringify(res.data.user));
        api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
        processQueue(null, newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        removeToken();
        removeRefreshToken();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response) {
      console.error(`[API] Error ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      console.error("[API] No response received:", error.message);
    } else {
      console.error("[API] Request error:", error.message);
    }
    return Promise.reject(error);
  },
);

export default api;

// Export service URLs for reference
export { APPLICATION_SERVICE_URL, AUDIT_SERVICE_URL, ASSET_SERVICE_URL, MONOLITH_URL };
