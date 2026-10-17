import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import MainLayout from "../src/components/layouts/MainLayout";
import Dashboard from "./components/Dashboard/Dashboard";
import ClosureTracking from "./pages/ClosureTracking/ClosureTracking";
import AppHistory from "./pages/AppHistory/AppHistory";
import TPRM from "./pages/TPRM/TPRM";
import ExceptionTracking from "./pages/ExceptionTracking/ExceptionTracking";
import AuditHistory from "./pages/AuditHistory/AuditHistory";
import "./App.css";
import "./styles/dashboardStyles.css";
import Audit from "./pages/Audit/Audit";
import Reminder from "./pages/Reminder/Reminder";
import ApplicationReminder from "./pages/ApplicationReminder/ApplicationReminder";
import Reports from "./pages/Reports/Reports";
import Compliance from "./pages/Compliance/Compliance";
import EOSL from "./pages/EOSL/EOSL";
import Settings from "./pages/Settings/Settings";
import YourBoard from "./pages/YourBoard/YourBoard";
import Login from "./pages/Login/Login";
import Signup from "./pages/Signup/Signup";
import AdminUsers from "./pages/AdminUsers/AdminUsers";
import EndpointSecurity from "./pages/EndpointSecurity/EndpointSecurity";
import BinaryInventory from "./pages/BinaryInventory/BinaryInventory";
import MalwareDetections from "./pages/MalwareDetections/MalwareDetections";
import IntegrityMonitoring from "./pages/IntegrityMonitoring/IntegrityMonitoring";
import ThreatIntelligence from "./pages/ThreatIntelligence/ThreatIntelligence";
import CVEFindings from "./pages/CVEFindings/CVEFindings";
import AgentManagement from "./pages/AgentManagement/AgentManagement";
import CloudAccounts from "./pages/CloudAccounts/CloudAccounts";
import AssetExplorer from "./pages/AssetExplorer/AssetExplorer";
import CSPMFindings from "./pages/CSPMFindings/CSPMFindings";
import Policies from "./pages/Policies/Policies";
import CIEM from "./pages/CIEM/CIEM";
import Kubernetes from "./pages/Kubernetes/Kubernetes";
import Containers from "./pages/Containers/Containers";
import SBOM from "./pages/Containers/SBOM";
import AlertInbox from "./pages/AlertInbox/AlertInbox";
import Notifications from "./pages/Notifications/Notifications";
import VulnerabilityFindings from "./pages/VulnerabilityFindings/VulnerabilityFindings";
import AttackPaths from "./pages/AttackPaths/AttackPaths";
import SecretsScanner from "./pages/SecretsScanner/SecretsScanner";
import SOARPlaybooks from "./pages/SOAR/SOARPlaybooks";
import ToxicRisks from "./pages/ToxicRisks/ToxicRisks";
import Runtime from "./pages/Runtime/Runtime";
import SecurityScore from "./pages/SecurityScore/SecurityScore";
import Search from "./pages/Search/Search";
import IpScanner from "./pages/IpScanner/IpScanner";
import CloudCompliance from "./pages/CloudCompliance/CloudCompliance";
import Roles from "./pages/Roles/Roles";
import AcceptInvite from "./pages/AcceptInvite/AcceptInvite";
import Help from "./pages/Help/Help";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ForgotPassword/ResetPassword";
import PlatformAudit from "./pages/PlatformAudit/PlatformAudit";
import { NetworkPage, DatabasesPage, ComputePage } from "./pages/CloudInventory/CloudInventory";
import { getToken, getUserProfile } from "./utils/auth";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { RBACProvider } from "./context/RBACContext";
// Create a Material UI theme based on our dashboard theme
import dashboardTheme from "./theme/dashboardTheme";

const muiTheme = createTheme({
  palette: {
    primary: {
      main: dashboardTheme.colors.primary,
    },
    secondary: {
      main: dashboardTheme.colors.secondary,
    },
    error: {
      main: dashboardTheme.colors.error,
    },
    warning: {
      main: dashboardTheme.colors.warning,
    },
    info: {
      main: dashboardTheme.colors.info,
    },
    success: {
      main: dashboardTheme.colors.success,
    },
    background: {
      default: dashboardTheme.colors.background.main,
      paper: dashboardTheme.colors.background.paper,
    },
  },
  typography: {
    fontFamily: dashboardTheme.typography.fontFamily,
  },
  shape: {
    borderRadius: parseInt(dashboardTheme.borderRadius.md),
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          padding: 0,
          boxSizing: "border-box",
          maxWidth: "100%",
          overflow: "auto",
          backgroundColor: dashboardTheme.colors.background.main,
        },
        "#root": {
          width: "100%",
          maxWidth: "100%",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: dashboardTheme.borderRadius.md,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: dashboardTheme.borderRadius.lg,
          boxShadow: dashboardTheme.shadows.card,
          border: "1px solid rgba(63, 81, 181, 0.08)",
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(63, 81, 181, 0.04)",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          color: dashboardTheme.colors.text.primary,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: dashboardTheme.borderRadius.lg,
        },
      },
    },
  },
});

// ProtectedRoute checks client-side auth state (presence of access token).
// If no token is present, redirect to /login. This enforces that routes
// wrapped with ProtectedRoute are inaccessible without a login.
const ProtectedRoute = ({ children }) => {
  const token = getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// AdminRoute: only ADMIN role may access; others get redirected to home.
const AdminRoute = ({ children }) => {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;
  const profile = getUserProfile();
  if (profile?.role?.toUpperCase() !== "ADMIN") {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For frontend-only mode: check client-side token presence (no network)
    const token = getToken();
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#f5f7fa",
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <RBACProvider>
      <Router>
        <ErrorBoundary>
        <Routes>
          {/* Public route */}
          <Route
            path="/login"
            element={getToken() ? <Navigate to="/" replace /> : <Login />}
          />
          <Route path="/signup" element={<Signup />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <YourBoard />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/ageing"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/closure-tracking"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ClosureTracking />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/app-history"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AppHistory />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/audit"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Audit />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/tprm"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <TPRM />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/exceptions"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ExceptionTracking />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/audit-history"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AuditHistory />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reminder"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Reminder />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/application-reminder"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ApplicationReminder />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Reports />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/compliance"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Compliance />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/eosl"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <EOSL />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Settings />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/cloud"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <CloudAccounts />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/assets"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AssetExplorer />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/findings"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <CSPMFindings />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/policies"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Policies />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/ciem"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <CIEM />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/kubernetes"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Kubernetes />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/containers"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Containers />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/containers/sbom"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <SBOM />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AlertInbox />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Notifications />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin-only: User & Role Management */}
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <MainLayout>
                  <AdminUsers />
                </MainLayout>
              </AdminRoute>
            }
          />

          <Route
            path="/endpoint-security/overview"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <EndpointSecurity />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/binary-inventory"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <BinaryInventory />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/malware-detections"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <MalwareDetections />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/integrity-monitoring"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <IntegrityMonitoring />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/threat-intelligence"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ThreatIntelligence />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/cve-findings"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <CVEFindings />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/cloud/vulnerabilities"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <VulnerabilityFindings />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/cloud/attack-paths"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AttackPaths />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/cloud/secrets"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <SecretsScanner />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/soar/playbooks"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <SOARPlaybooks />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/cloud/toxic-risks"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ToxicRisks />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/runtime"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Runtime />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/security-score"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <SecurityScore />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Search />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ip-scanner"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <IpScanner />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/cloud/compliance"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <CloudCompliance />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/network"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <NetworkPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/databases"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DatabasesPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/compute"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ComputePage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <AdminRoute>
                <MainLayout>
                  <Roles />
                </MainLayout>
              </AdminRoute>
            }
          />
          <Route
            path="/help"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Help />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/platform-audit"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PlatformAudit />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/vulnerability-findings"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <VulnerabilityFindings />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/endpoint-security/agents"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AgentManagement />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to={getToken() ? "/" : "/login"} replace />} />
        </Routes>
        </ErrorBoundary>
      </Router>
      </RBACProvider>
    </ThemeProvider>
  );
}

export default App;
