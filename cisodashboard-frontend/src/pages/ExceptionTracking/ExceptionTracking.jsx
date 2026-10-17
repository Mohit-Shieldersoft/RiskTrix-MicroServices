import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  Paper,
  Fade,
  Divider,
  Alert,
  CircularProgress,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EventIcon from "@mui/icons-material/Event";
import UpdateIcon from "@mui/icons-material/Update";
import ExceptionStatusChart from "./components/ExceptionStatusChart";
import ExceptionApprovalChart from "./components/ExceptionApprovalChart";
import ExceptionRiskHistogram from "./components/ExceptionRiskHistogram";
import ExceptionTable from "./components/ExceptionTable";
import AddExceptionModel from "./components/AddExceptionModel";
import exceptionApi from "../../utils/exceptionApi";
import dashboardTheme from "../../theme/dashboardTheme";
import Toast from "../../components/common/Toast";
import { useToast } from "../../components/common/useToast";
import "./ExceptionTracking.css";
import AddExpiryModel from "./components/AddExpiryModel";

const ExceptionTracking = () => {
  // State variables
  const [exceptionData, setExceptionData] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddExceptionModalOpen, setIsAddExceptionModalOpen] = useState(false);
  const [isAddExpiryModalOpen, setIsAddExpiryModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast, showToast, closeToast } = useToast();

  // Current date and time
  const currentDate = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
  const currentUser = localStorage.getItem("userName") || "John Doe";

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        // Fetch exceptions and stats in parallel
        const [exceptionsResponse, statsResponse] = await Promise.all([
          exceptionApi.getExceptions({ page: 1, size: 1000 }), // Increase to get more exceptions for accurate stats
          exceptionApi.getExceptionStats().catch((error) => {
            console.warn(
              "Stats API failed, falling back to client calculation:",
              error,
            );
            return null;
          }),
        ]);

        // Transform exception list
        const exceptions = exceptionsResponse.exceptions || [];
        const transformedData = exceptions.map((exception) => ({
          id: exception.id,
          name: exception.exception_name,
          remarks: exception.risk_assessment || exception.comments || "",
          comments: exception.comments || "",
          startDate: exception.start_date,
          expiryDate: exception.end_date,
          risk: exception.severity
            ? exception.severity.charAt(0).toUpperCase() +
              exception.severity.slice(1).toLowerCase()
            : "Medium",
          approvalStatus: getApprovalStatus(
            exception.approval_status || exception.status,
          ),
          category: exception.category,
          severity: exception.severity,
          status: exception.status,
          isExpired:
            exception.is_expired ??
            (exception.end_date
              ? new Date(exception.end_date) < new Date()
              : false),
          pocDocument: exception.poc_document || null,
        }));
        setExceptionData(transformedData);

        // Use API stats if available, otherwise calculate from data
        if (statsResponse) {
          console.log("Using API stats:", statsResponse);
          setStatistics({
            total: statsResponse.total_exceptions ?? transformedData.length,
            active: statsResponse.active_exceptions ?? 0,
            expired: statsResponse.expired_exceptions ?? 0,
            pending: statsResponse.pending_exceptions ?? 0,
            expiringSoon: statsResponse.expiring_soon ?? 0,
            // Calculate approval status from transformed data since API doesn't provide this
            approved: transformedData.filter(
              (e) => e.approvalStatus === "Approved",
            ).length,
            rejected: transformedData.filter(
              (e) => e.approvalStatus === "Rejected",
            ).length,
            inProgress: transformedData.filter(
              (e) => e.approvalStatus === "In Progress",
            ).length,
            // Use API severity counts
            critical: statsResponse.by_severity?.critical ?? 0,
            high: statsResponse.by_severity?.high ?? 0,
            medium: statsResponse.by_severity?.medium ?? 0,
            low: statsResponse.by_severity?.low ?? 0,
          });
        } else {
          console.warn("Stats API failed, calculating from exception data");
          // Fallback: calculate from transformed data
          setStatistics({
            total: transformedData.length,
            active: transformedData.filter((e) => !e.isExpired).length,
            expired: transformedData.filter((e) => e.isExpired).length,
            approved: transformedData.filter(
              (e) => e.approvalStatus === "Approved",
            ).length,
            rejected: transformedData.filter(
              (e) => e.approvalStatus === "Rejected",
            ).length,
            inProgress: transformedData.filter(
              (e) => e.approvalStatus === "In Progress",
            ).length,
            critical: transformedData.filter(
              (e) => e.severity?.toLowerCase() === "critical",
            ).length,
            high: transformedData.filter(
              (e) => e.severity?.toLowerCase() === "high",
            ).length,
            medium: transformedData.filter(
              (e) => e.severity?.toLowerCase() === "medium",
            ).length,
            low: transformedData.filter(
              (e) => e.severity?.toLowerCase() === "low",
            ).length,
          });
        }
        setError("");
      } catch (error) {
        console.error("Error fetching exception data:", error);
        setError(`Failed to fetch exception data: ${error.message}`);
        setExceptionData([]);
        setStatistics({});
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshKey]);

  // Helper function to map API status to display status
  const getApprovalStatus = (apiStatus) => {
    switch (apiStatus?.toUpperCase()) {
      case "ACTIVE":
        return "Approved";
      case "INACTIVE":
      case "REJECTED":
        return "Rejected";
      case "PENDING":
        return "In Progress";
      default:
        return "In Progress";
    }
  };

  // Handle modal actions
  const handleAddException = (newException) => {
    setIsAddExceptionModalOpen(false);
    showToast("Exception created successfully", "success");
    setRefreshKey((prev) => prev + 1);
  };

  const handleAddExpiry = (expiryData) => {
    setIsAddExpiryModalOpen(false);
    showToast("Expiry date updated successfully", "success");
    setRefreshKey((prev) => prev + 1);
  };

  const handleUpdateAll = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        maxWidth: "100%",
        background:
          "linear-gradient(135deg, rgba(240,242,245,1) 0%, rgba(245,247,250,1) 100%)",
        minHeight: "calc(100vh - 64px)",
        overflow: "auto",
      }}
    >
      {/* Page Header */}
      <Box
        className="dashboard-header"
        sx={{
          mb: 4,
          pb: 2,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          background: "linear-gradient(135deg, #512DA8 0%, #673AB7 100%)",
          p: 3,
          borderRadius: 2,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: dashboardTheme.typography.fontWeights.bold,
              color: "#ffffff",
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            }}
          >
            Exception Tracking
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ color: "rgba(255, 255, 255, 0.9)", mt: 0.5 }}
          >
            {currentDate} • {currentUser}
          </Typography>
        </Box>

        {/* Header Stats */}
        <Box
          sx={{
            display: "flex",
            gap: 3,
            flexWrap: "wrap",
            mt: { xs: 2, sm: 0 },
          }}
        >
          {[
            { label: "Total", value: statistics.total ?? 0 },
            { label: "Active", value: statistics.active ?? 0 },
            { label: "Expired", value: statistics.expired ?? 0 },
            { label: "Expiring Soon", value: statistics.expiringSoon ?? 0 },
          ].map(({ label, value }) => (
            <Box key={label} sx={{ textAlign: "center" }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: "#fff", lineHeight: 1 }}
              >
                {loading ? "—" : value}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "rgba(255,255,255,0.8)" }}
              >
                {label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Action Buttons */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mt: { xs: 3, sm: 0 },
            flexWrap: { xs: "wrap", sm: "nowrap" },
          }}
        >
          {/* <Button
            variant="contained"
            color="secondary"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => setIsAddExceptionModalOpen(true)}
            sx={{
              background: 'linear-gradient(45deg, #f50057 30%, #ff4081 90%)',
              boxShadow: '0 5px 10px rgba(245, 0, 87, 0.3)',
              transition: 'all 0.3s',
              fontWeight: 'bold',
              '&:hover': {
                boxShadow: '0 8px 16px rgba(245, 0, 87, 0.4)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            Add Excep.
          </Button> */}

          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => setIsAddExceptionModalOpen(true)} // opens the modal
            sx={{
              background: "linear-gradient(45deg, #f50057 30%, #ff4081 90%)",
              boxShadow: "0 5px 10px rgba(245, 0, 87, 0.3)",
              transition: "all 0.3s",
              fontWeight: "bold",
              "&:hover": {
                boxShadow: "0 8px 16px rgba(245, 0, 87, 0.4)",
                transform: "translateY(-2px)",
              },
            }}
          >
            Add Excep.
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<EventIcon />}
            onClick={() => setIsAddExpiryModalOpen(true)}
            sx={{
              background: "linear-gradient(45deg, #3f51b5 30%, #536dfe 90%)",
              boxShadow: "0 5px 10px rgba(63, 81, 181, 0.3)",
              transition: "all 0.3s",
              fontWeight: "bold",
              "&:hover": {
                boxShadow: "0 8px 16px rgba(63, 81, 181, 0.4)",
                transform: "translateY(-2px)",
              },
            }}
          >
            Add Expiry
          </Button>

          <Button
            variant="contained"
            startIcon={<UpdateIcon />}
            onClick={handleUpdateAll}
            sx={{
              background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
              boxShadow: "0 5px 10px rgba(33, 150, 243, 0.3)",
              transition: "all 0.3s",
              fontWeight: "bold",
              "&:hover": {
                boxShadow: "0 8px 16px rgba(33, 150, 243, 0.4)",
                transform: "translateY(-2px)",
              },
            }}
          >
            Update All
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={40} />
        </Box>
      )}

      {/* Top Half - Charts */}
      <Fade in={!loading} timeout={800}>
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2} alignItems="stretch">
            {/* Exception Status Chart */}
            <Grid
              size={{ xs: 12 }}
              sx={{ flexBasis: { md: "30%" }, maxWidth: { md: "30%" } }}
            >
              <Paper
                elevation={0}
                className="futuristic-card"
                sx={{
                  p: 0,
                  overflow: "hidden",
                  height: "450px",
                  width: "100%",
                  maxWidth: "100%",
                }}
              >
                <Box
                  sx={{ p: 2, bgcolor: dashboardTheme.colors.background.card }}
                >
                  <Typography variant="h6" sx={{ fontWeight: "medium" }}>
                    Exception Status
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ height: "calc(100% - 53px)", p: 2 }}>
                  <ExceptionStatusChart
                    active={statistics.active ?? 0}
                    expired={statistics.expired ?? 0}
                  />
                </Box>
              </Paper>
            </Grid>

            {/* Exception Approval Chart */}
            <Grid
              size={{ xs: 12 }}
              sx={{ flexBasis: { md: "30%" }, maxWidth: { md: "30%" } }}
            >
              <Paper
                elevation={0}
                className="futuristic-card"
                sx={{
                  p: 0,
                  overflow: "hidden",
                  height: "450px",
                  width: "100%",
                  maxWidth: "100%",
                }}
              >
                <Box
                  sx={{ p: 2, bgcolor: dashboardTheme.colors.background.card }}
                >
                  <Typography variant="h6" sx={{ fontWeight: "medium" }}>
                    Approval Status
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ height: "calc(100% - 53px)", p: 2 }}>
                  <ExceptionApprovalChart
                    approved={statistics.approved ?? 0}
                    rejected={statistics.rejected ?? 0}
                    inProgress={statistics.inProgress ?? 0}
                  />
                </Box>
              </Paper>
            </Grid>

            {/* Exception Risk Histogram */}
            <Grid
              size={{ xs: 12 }}
              sx={{ flexBasis: { md: "40%" }, maxWidth: { md: "40%" } }}
            >
              <Paper
                elevation={0}
                className="futuristic-card"
                sx={{
                  p: 0,
                  overflow: "hidden",
                  height: "450px",
                  width: "100%",
                  maxWidth: "100%",
                }}
              >
                <Box
                  sx={{ p: 2, bgcolor: dashboardTheme.colors.background.card }}
                >
                  <Typography variant="h6" sx={{ fontWeight: "medium" }}>
                    Risk Distribution
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ height: "calc(100% - 53px)", p: 2 }}>
                  <ExceptionRiskHistogram
                    critical={statistics.critical ?? 0}
                    high={statistics.high ?? 0}
                    medium={statistics.medium ?? 0}
                    low={statistics.low ?? 0}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Fade>

      {/* Bottom Half - Exception Table */}
      <Fade in={!loading} timeout={1000}>
        <Paper
          elevation={0}
          className="futuristic-card"
          sx={{
            p: 0,
            overflow: "hidden",
          }}
        >
          <Box sx={{ p: 2, bgcolor: dashboardTheme.colors.background.card }}>
            <Typography variant="h6" sx={{ fontWeight: "medium" }}>
              Exception Management
            </Typography>
          </Box>
          <Divider />
          <ExceptionTable
            data={exceptionData || []}
            onRefresh={handleRefresh}
            loading={loading}
          />
        </Paper>
      </Fade>

      {/* AddExceptionModel modal */}
      <AddExceptionModel
        open={isAddExceptionModalOpen}
        onClose={() => setIsAddExceptionModalOpen(false)}
        onSubmit={handleAddException}
      />

      <AddExpiryModel
        open={isAddExpiryModalOpen}
        onClose={() => setIsAddExpiryModalOpen(false)}
        onSubmit={handleAddExpiry}
        exceptions={exceptionData}
      />

      <Toast toast={toast} onClose={closeToast} />
    </Box>
  );
};

export default ExceptionTracking;
