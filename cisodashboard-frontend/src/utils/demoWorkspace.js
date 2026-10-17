import api from "./api";
import { isDemoAccount } from "./auth";

const DEMO_ENDPOINTS = [
  "/api/v1/cloud/accounts/demo/provision",
  "/api/v1/ciem/demo/provision",
  "/api/v1/kubernetes/demo/provision",
  "/api/v1/runtime/demo/provision",
  "/api/v1/alerts/demo/provision",
  "/api/v1/soar/demo/provision",
  "/api/v1/ip-scanner/demo/provision",
];

export async function provisionDemoWorkspace(profile) {
  if (!isDemoAccount(profile)) {
    return { skipped: true };
  }
  const results = await Promise.allSettled(
    DEMO_ENDPOINTS.map((path) => api.post(path)),
  );
  return {
    skipped: false,
    ready: results.filter((item) => item.status === "fulfilled").length,
    failed: results.filter((item) => item.status === "rejected").length,
  };
}