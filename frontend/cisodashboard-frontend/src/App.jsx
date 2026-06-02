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
import { getToken, getUserProfile } from "./utils/auth";
import { hasPermission, hasRole } from "./utils/permissions";
import { RBACProvider } from "./context/RBACContext";
// Create a Material UI theme based on our dashboard theme
import dashboardTheme from "./theme/dashboardTheme";

import Assets from "./pages/Assets/Assets";
import AssetDashboard from "./pages/Assets/AssetDashboard";
import AssetDetail from "./pages/Assets/AssetDetail";
import Policies from "./pages/Policy/Policies";
import PolicyDetail from "./pages/Policy/PolicyDetail";
import PolicyAssignmentDashboard from "./pages/Policy/PolicyAssignmentDashboard";
import PolicyApply from "./pages/Policy/PolicyApply";
import PolicyEdit from "./pages/Policy/PolicyEdit";
import PolicyDashboard from "./pages/Policy/PolicyDashboard";
import DeviceManagement from "./pages/Policy/DeviceManagement";
import DeviceDetail from "./pages/Policy/DeviceDetail";
import DeviceGroups from "./pages/Policy/DeviceGroups";
import DeviceGroupDetail from "./pages/Policy/DeviceGroupDetail";
import BulkAssign from "./pages/Policy/BulkAssign";
import ConflictReport from "./pages/Policy/ConflictReport";
import PolicyTemplates from "./pages/Policy/PolicyTemplates";
import ComplianceDashboard from "./pages/Policy/ComplianceDashboard";
import EnrollmentDashboard from "./pages/Enrollment/EnrollmentDashboard";
import EnrollmentForm from "./pages/Enrollment/EnrollmentForm";
import Tickets from "./pages/Tickets/Tickets";
import TicketDetail from "./pages/Tickets/TicketDetail";
import TicketDashboard from "./pages/Tickets/TicketDashboard";
import TicketAssignmentDashboard from "./pages/Tickets/TicketAssignmentDashboard";
import SecurityDashboard from "./pages/Security/SecurityDashboard";
import DeviceSecurityDetail from "./pages/Security/DeviceSecurityDetail";
import AgentReportForm from "./pages/Security/AgentReportForm";
import AutomationDashboard from "./pages/Automation/AutomationDashboard";
import AutomationRuleBuilder from "./pages/Automation/AutomationRuleBuilder";
import FileManager from "./pages/Files/FileManager";
import DirectoryPage from "./pages/Directory/DirectoryPage";
import SearchPage from "./pages/Search/SearchPage";
import QueueMonitorPage from "./pages/Queue/QueueMonitorPage";

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
        },
        "#root": {
          width: "100%",
          maxWidth: "100%",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: dashboardTheme.borderRadius.md,
          boxShadow: dashboardTheme.shadows.card,
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
  if (profile?.role?.toLowerCase() !== "admin") {
    return <Navigate to="/" replace />;
  }
  return children;
};

// PermissionRoute: guards a route by permission or role.
// If the user lacks the required permission/role, redirects to fallback.
const PermissionRoute = ({ children, permission, role, fallback = "/" }) => {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;
  if (permission) {
    const [resource, action] = permission.split('.');
    if (!hasPermission(resource, action)) return <Navigate to={fallback} replace />;
  }
  if (role && !hasRole(role)) return <Navigate to={fallback} replace />;
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
    <RBACProvider>
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public route */}
          <Route
            path="/login"
            element={getToken() ? <Navigate to="/" replace /> : <Login />}
          />
          <Route path="/signup" element={<Signup />} />

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
              <PermissionRoute permission="settings.view">
                <MainLayout>
                  <Settings />
                </MainLayout>
              </PermissionRoute>
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
            path="/assets"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Assets />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/assets/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AssetDashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/assets/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AssetDetail />
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
            path="/policies/assignments"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PolicyAssignmentDashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/policies/bulk-assign"
            element={
              <PermissionRoute permission="policies.bulk_assign">
                <MainLayout>
                  <BulkAssign />
                </MainLayout>
              </PermissionRoute>
            }
          />
          <Route
            path="/policies/conflicts"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ConflictReport />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/policies/templates"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PolicyTemplates />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/compliance"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ComplianceDashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/policies/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PolicyDetail />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/policies/:id/apply"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PolicyApply />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/policies/:id/edit"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PolicyEdit />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/policies/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PolicyDashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/devices"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DeviceManagement />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/devices/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DeviceDetail />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DeviceGroups />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DeviceGroupDetail />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/enrollment"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <EnrollmentDashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/enrollment/enroll"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <EnrollmentForm />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/tickets"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Tickets />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <TicketDetail />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/tickets/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <TicketDashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/tickets/assignments"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <TicketAssignmentDashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Redirect unknown routes to dashboard */}
          <Route path="*" element={<Navigate to="/login" />} />

          <Route
            path="/security"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <SecurityDashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/security/device/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DeviceSecurityDetail />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/security/report"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <AgentReportForm />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/automation"
            element={
              <PermissionRoute permission="automation.view">
                <MainLayout>
                  <AutomationDashboard />
                </MainLayout>
              </PermissionRoute>
            }
          />
          <Route
            path="/automation/new"
            element={
              <PermissionRoute permission="automation.create">
                <MainLayout>
                  <AutomationRuleBuilder />
                </MainLayout>
              </PermissionRoute>
            }
          />
          <Route
            path="/automation/:id/edit"
            element={
              <PermissionRoute permission="automation.update">
                <MainLayout>
                  <AutomationRuleBuilder />
                </MainLayout>
              </PermissionRoute>
            }
          />

          <Route
            path="/files"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <FileManager />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/directory"
            element={
              <PermissionRoute permission="users.view">
                <MainLayout>
                  <DirectoryPage />
                </MainLayout>
              </PermissionRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <SearchPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/queue"
            element={
              <PermissionRoute permission="queue.view">
                <MainLayout>
                  <QueueMonitorPage />
                </MainLayout>
              </PermissionRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
    </RBACProvider>
  );
}

export default App;
