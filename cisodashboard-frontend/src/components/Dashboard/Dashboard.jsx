import React, { useEffect, useState, useCallback } from "react";
import {
  Grid,
  Box,
  Divider,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import RefreshIcon from "@mui/icons-material/Refresh";
import VulnerabilityTable from "../VulnerabilityTable/VulnerabilityTable";
import DelayedVulnerabilityChart from "../DelayedVulnerabilityChart/DelayedVulnerabilityChart";
import VulnerabilityStatusChart from "../VulnerabilityStatusChart/VulnerabilityStatusChart";
import ApplicationTypeChart from "../ApplicationTypeChart/ApplicationTypeChart";
import DetailedVulnerabilityTable from "../DetailedVulnerabilityTable/DetailedVulnerabilityTable";
import dashboardApi from "../../utils/dashboardApi";
import dashboardTheme from "../../theme/dashboardTheme";
import { getUserProfile } from "../../utils/auth";
import PageShell from "../common/PageShell";
import "../../styles/dashboardStyles.css";

const Dashboard = () => {
  // Animation state for dashboard elements
  const [animate, setAnimate] = useState(false);
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    open: 0,
    closed: 0,
  });
  const [loading, setLoading] = useState(true);

  // Dashboard data state
  const [applications, setApplications] = useState([]);
  const [delayedVulnerabilities, setDelayedVulnerabilities] = useState([]);
  const [overallVulnerabilityStatus, setOverallVulnerabilityStatus] = useState(
    [],
  );
  const [applicationTypeVulnerabilities, setApplicationTypeVulnerabilities] =
    useState([]);
  const [detailedVulnerabilities, setDetailedVulnerabilities] = useState([]);

  // Fetch dashboard data from API
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dashboardApi.getDashboardData();
      setApplications(data.applications || []);
      setDelayedVulnerabilities(data.delayedVulnerabilities || []);
      setOverallVulnerabilityStatus(data.overallVulnerabilityStatus || []);
      setApplicationTypeVulnerabilities(
        data.applicationTypeVulnerabilities || [],
      );
      setDetailedVulnerabilities(data.detailedVulnerabilities || []);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount + re-fetch whenever the user navigates back to this page
  useEffect(() => {
    fetchDashboardData();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchDashboardData();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchDashboardData]);

  // Calculate dashboard summary stats
  useEffect(() => {
    const openVulns =
      overallVulnerabilityStatus.find((item) => item.name === "Open")?.value ||
      0;
    const closedVulns =
      overallVulnerabilityStatus.find((item) => item.name === "Closed")
        ?.value || 0;

    setSummaryStats({
      total: openVulns + closedVulns,
      open: openVulns,
      closed: closedVulns,
    });

    // Trigger animation after a short delay
    if (!loading) {
      const timer = setTimeout(() => {
        setAnimate(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [overallVulnerabilityStatus, loading]);

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const displayName = getUserProfile()?.full_name || getUserProfile()?.email || "User";

  return (
    <Box
      sx={{
        flexGrow: 1,
        maxWidth: "100%",
        width: "100%",
        opacity: animate ? 1 : 0,
        transform: animate ? "translateY(0)" : "translateY(20px)",
        transition: dashboardTheme.transitions.slow,
      }}
    >
      <PageShell
        title="Vulnerability Ageing"
        subtitle={`${currentDate} · ${displayName}. Open findings by age, application, and closure status.`}
        actions={
          <Tooltip title="Refresh data">
            <IconButton onClick={fetchDashboardData} disabled={loading} color="primary">
              {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        }
      >
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
          <Chip icon={<SecurityIcon />} label={`Total ${summaryStats.total}`} color="primary" variant="outlined" />
          <Chip icon={<WarningAmberIcon />} label={`Open ${summaryStats.open}`} color="warning" variant="outlined" />
          <Chip icon={<TaskAltIcon />} label={`Closed ${summaryStats.closed}`} color="success" variant="outlined" />
        </Box>
      </PageShell>

      {/* Main Dashboard Content */}
      <Box sx={{ px: { xs: 2, md: 3 }, pb: 4 }}>
        {/* First Row - Two Cards (50% each) */}
        <Grid
          container
          spacing={3}
          sx={{
            mt: 1,
            mb: 3,
            width: "100%",
            display: "flex",
            flexWrap: "nowrap",
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{
              width: { xs: "100%", md: "50%" },
              flexGrow: 1,
              minWidth: { xs: "100%", md: "50%" },
            }}
          >
            <Box
              sx={{
                height: "100%",
                animation: animate ? "fadeInLeft 0.8s ease-out" : "none",
              }}
            >
              <DelayedVulnerabilityChart data={delayedVulnerabilities} />
            </Box>
          </Grid>

          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{
              width: { xs: "100%", md: "50%" },
              flexGrow: 1,
              minWidth: { xs: "100%", md: "50%" },
            }}
          >
            <Box
              sx={{
                height: "100%",
                animation: animate ? "fadeInRight 0.8s ease-out" : "none",
              }}
            >
              <VulnerabilityTable applications={applications} />
            </Box>
          </Grid>
        </Grid>

        {/* Second Row - Three Cards (33.3% each) */}
        <Grid
          container
          spacing={3}
          sx={{
            width: "100%",
            display: "flex",
            flexWrap: { xs: "wrap", lg: "nowrap" },
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Grid
            size={{ xs: 12, sm: 4 }}
            sx={{
              width: { xs: "100%", sm: "33.33%" },
              flexGrow: 1,
            }}
          >
            <Box
              sx={{
                animation: animate ? "fadeInUp 0.8s ease-out 0.2s" : "none",
                animationFillMode: "backwards",
              }}
            >
              <VulnerabilityStatusChart data={overallVulnerabilityStatus} />
            </Box>
          </Grid>

          <Grid
            size={{ xs: 12, sm: 4 }}
            sx={{
              width: { xs: "100%", sm: "33.33%" },
              flexGrow: 1,
            }}
          >
            <Box
              sx={{
                animation: animate ? "fadeInUp 0.8s ease-out 0.4s" : "none",
                animationFillMode: "backwards",
              }}
            >
              <ApplicationTypeChart data={applicationTypeVulnerabilities} />
            </Box>
          </Grid>

          <Grid
            size={{ xs: 12, sm: 4 }}
            sx={{
              width: { xs: "100%", sm: "33.33%" },
              flexGrow: 1,
            }}
          >
            <Box
              sx={{
                animation: animate ? "fadeInUp 0.8s ease-out 0.6s" : "none",
                animationFillMode: "backwards",
              }}
            >
              <DetailedVulnerabilityTable
                applications={detailedVulnerabilities}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
