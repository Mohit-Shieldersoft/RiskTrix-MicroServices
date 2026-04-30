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
              <ProtectedRoute>
                <MainLayout>
                  <Settings />
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

          {/* Redirect unknown routes to dashboard */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
