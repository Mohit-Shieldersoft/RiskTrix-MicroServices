// Development Auth Bypass
// Use this to test microservices without running the monolith

import { setToken, setUserProfile } from "./auth";

// Mock JWT token for development (not a real token, just for testing routing)
const MOCK_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiJ9.mock";

// Mock user profile
const MOCK_USER = {
  id: 1,
  email: "admin@example.com",
  full_name: "Admin User",
  role: "admin",
  organization_id: 1,
};

export function enableDevMode() {
  console.log("🔧 [DEV MODE] Auth bypass enabled - using mock credentials");

  // Set mock token and user profile
  setToken(MOCK_TOKEN);
  setUserProfile(MOCK_USER);

  // Verify token was set
  const storedToken = localStorage.getItem("rt_access_token");
  console.log("✅ [DEV MODE] Token stored:", storedToken ? "YES" : "NO");

  // Redirect to app-history page after a brief delay to ensure storage is complete
  setTimeout(() => {
    window.location.href = "/tprm"; // TPRM page uses Audit Service (vendors)
  }, 100);
}
