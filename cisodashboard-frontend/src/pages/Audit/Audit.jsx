import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  Grow,
  Fade,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
} from "@mui/material";
import AddAlertIcon from "@mui/icons-material/AddAlert";
import BusinessIcon from "@mui/icons-material/Business";
import UpdateIcon from "@mui/icons-material/Update";
import AddExpiryModal from "./components/AddExpiryModal";
import AddVendorModal from "./components/AddVendorModal";
import ComplianceCard from "./components/ComplianceCard";
import ISO27001Chart from "./components/ISO27001Chart";
import PCIDSSChart from "./components/PCIDSSChart";
import TopVendorsChart from "./components/TopVendorsChart";
import auditApi from "../../utils/auditApi";
import { getUserProfile } from "../../utils/auth";
import dashboardTheme from "../../theme/dashboardTheme";
import Toast from "../../components/common/Toast";
import { useToast } from "../../components/common/useToast";
import "./Audit.css";

const Audit = () => {
  // State variables
  const [statistics, setStatistics] = useState(null);
  const [iso27001Data, setIso27001Data] = useState(null);
  const [pcidssData, setPcidssData] = useState(null);
  const [topVendorsData, setTopVendorsData] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [isAddExpiryModalOpen, setIsAddExpiryModalOpen] = useState(false);
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast, showToast, closeToast } = useToast();

  // Get current time and user
  const currentDateTime = new Date().toISOString().slice(0, 10);
  const currentUser =
    getUserProfile()?.full_name || getUserProfile()?.email || "User";

  // Theme breakpoints for responsive design
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  // Load data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch all audit data in parallel
        const [
          statsResponse,
          isoResponse,
          pciResponse,
          vendorsResponse,
          vendorListResponse,
        ] = await Promise.all([
          auditApi.getStatistics(),
          auditApi.getISO27001Compliance(),
          auditApi.getPCIDSSCompliance(),
          auditApi.getTopVendors(),
          auditApi.getVendors({ page: 1, size: 100 }),
        ]);

        setStatistics(statsResponse);
        setIso27001Data(isoResponse);
        setPcidssData(pciResponse);
        setTopVendorsData(vendorsResponse);
        // vendorListResponse shape: { vendors: [...], total, page, size, pages }
        const vendorItems = Array.isArray(vendorListResponse)
          ? vendorListResponse
          : (vendorListResponse?.vendors ?? vendorListResponse?.items ?? []);
        setVendors(vendorItems);
      } catch (err) {
        console.error("Error fetching audit data:", err);
        setError("Failed to load audit data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshKey]);

  // Get compliance statistics
  const stats = statistics || { compliant: 0, non_compliant: 0, exceptions: 0 };

  // Handle modal actions
  const handleAddExpiry = async (payload) => {
    await auditApi.createCertificate(payload);
    showToast("Certificate added successfully", "success");
    setIsAddExpiryModalOpen(false);
    setRefreshKey((prev) => prev + 1);
  };

  const handleAddVendor = async (vendorData) => {
    await auditApi.createVendor(vendorData);
    showToast("Vendor added successfully", "success");
    setIsAddVendorModalOpen(false);
    setRefreshKey((prev) => prev + 1);
  };

  // Show loading spinner
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Show error message
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={() => setRefreshKey((prev) => prev + 1)}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        maxWidth: "100%",
        background:
          "linear-gradient(135deg, rgba(240,242,245,1) 0%, rgba(245,247,250,1) 100%)",
        minHeight: "calc(100vh - 64px)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        // allow scrolling instead of clipping so cards/tooltips can overflow cleanly
        overflow: "auto",
      }}
    >
      {/* Page Header */}
      <Fade in={!loading} timeout={800}>
        <Box className="dashboard-header" sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ position: "relative" }}>
            Regulatory Compliance Audit
          </Typography>
          <Typography
            variant="subtitle1"
            component="h5"
            sx={{ position: "relative" }}
          >
            {currentDateTime} • {currentUser}
          </Typography>
        </Box>
      </Fade>

      {/* Action Buttons */}
      <Grid
        container
        spacing={2}
        sx={{
          mb: 4,
          justifyContent: "flex-end",
          mt: 2,
        }}
      >
        <Grid>
          <Grow in={!loading} timeout={600}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddAlertIcon />}
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
          </Grow>
        </Grid>

        <Grid>
          <Grow in={!loading} timeout={800}>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<BusinessIcon />}
              onClick={() => setIsAddVendorModalOpen(true)}
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
              Add Vendor
            </Button>
          </Grow>
        </Grid>

        <Grid>
          <Grow in={!loading} timeout={1000}>
            <Button
              variant="contained"
              startIcon={<UpdateIcon />}
              onClick={() => setRefreshKey((prev) => prev + 1)}
              disabled={loading}
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
              {loading ? "Updating..." : "Update Compliance"}
            </Button>
          </Grow>
        </Grid>
      </Grid>

      {/* Main Content: Two-column layout */}
      <Grid
        container
        spacing={4}
        sx={{ mb: 4, flexGrow: 1, alignItems: "stretch" }}
      >
        {/* Left Column - Compliance Cards and Top Vendors Chart */}
        <Grid
          size={{ xs: 12, md: 12, lg: 7 }}
          sx={{ display: "flex", flexDirection: "column", flex: 1 }}
        >
          {/* Compliance Cards Row */}
          {/* <Grid container spacing={3} sx={{ mb: 4 }}>
          
            <Grid item xs={12} sm={4} md={12} lg={4}>
              <Grow in={!loading} timeout={1100}>
                <Box>
                  <ComplianceCard
                    title="Non-Compliant Vendors"
                    count={stats.nonCompliant}
                    trend={1.2}
                    trendDirection="up"
                    icon="warning"
                    color="#FF5252"
                  />
                </Box>
              </Grow>
            </Grid>
            
            
            <Grid item xs={12} sm={4} md={12} lg={4}>
              <Grow in={!loading} timeout={1300}>
                <Box>
                  <ComplianceCard
                    title="Compliant Vendors"
                    count={stats.compliant}
                    trend={2.4}
                    trendDirection="up"
                    icon="check"
                    color="#4CAF50"
                  />
                </Box>
              </Grow>
            </Grid>
            
            
            <Grid item xs={12} sm={4} md={12} lg={4}>
              <Grow in={!loading} timeout={1500}>
                <Box>
                  <ComplianceCard
                    title="Exceptions"
                    count={stats.exceptions}
                    trend={0.8}
                    trendDirection="down"
                    icon="flag"
                    color="#FF9800"
                  />
                </Box>
              </Grow>
            </Grid>
          </Grid> */}

          <Grid
            container
            spacing={3}
            sx={{
              mb: 4,
              justifyContent: "center", // centers the cards evenly
            }}
          >
            {/* Non-Compliant Vendors Card */}
            <Grid
              sx={{
                flex: "0 0 31%", // three cards per row on large screens
                maxWidth: "31%",
                "@media (max-width:1200px)": {
                  flex: "0 0 48%", // two per row on tablet
                  maxWidth: "48%",
                },
                "@media (max-width:700px)": {
                  flex: "0 0 100%", // full width on mobile
                  maxWidth: "100%",
                },
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Grow in={!loading} timeout={1100}>
                <Box sx={{ width: "100%" }}>
                  <ComplianceCard
                    title="Non-Compliant Vendors"
                    count={stats.non_compliant}
                    trend={stats.non_compliant_trend || 0}
                    trendDirection="up"
                    icon="warning"
                    color="#FF5252"
                  />
                </Box>
              </Grow>
            </Grid>

            {/* Compliant Vendors Card */}
            <Grid
              sx={{
                flex: "0 0 31%",
                maxWidth: "31%",
                "@media (max-width:1200px)": {
                  flex: "0 0 48%",
                  maxWidth: "48%",
                },
                "@media (max-width:700px)": {
                  flex: "0 0 100%",
                  maxWidth: "100%",
                },
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Grow in={!loading} timeout={1300}>
                <Box sx={{ width: "100%" }}>
                  <ComplianceCard
                    title="Compliant Vendors"
                    count={stats.compliant}
                    trend={stats.compliant_trend || 0}
                    trendDirection="up"
                    icon="check"
                    color="#4CAF50"
                  />
                </Box>
              </Grow>
            </Grid>

            {/* Exceptions Card */}
            <Grid
              sx={{
                flex: "0 0 31%",
                maxWidth: "31%",
                "@media (max-width:1200px)": {
                  flex: "0 0 48%",
                  maxWidth: "48%",
                },
                "@media (max-width:700px)": {
                  flex: "0 0 100%",
                  maxWidth: "100%",
                },
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Grow in={!loading} timeout={1500}>
                <Box sx={{ width: "100%" }}>
                  <ComplianceCard
                    title="Exceptions"
                    count={stats.exceptions}
                    trend={stats.exceptions_trend || 0}
                    trendDirection="down"
                    icon="flag"
                    color="#FF9800"
                  />
                </Box>
              </Grow>
            </Grid>
          </Grid>

          {/* Top Vendors Chart */}
          <Grow in={!loading} timeout={1700}>
            <Box
              sx={{
                mt: 2,
                height: { xs: "360px", md: "520px" },
                width: "100%",
                maxWidth: "100%",
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <TopVendorsChart vendorData={topVendorsData?.vendors || []} />
            </Box>
          </Grow>
        </Grid>

        {/* Right Column - ISO 27001 Chart and PCI-DSS Chart */}
        <Grid
          size={{ xs: 12, md: 12, lg: 5 }}
          sx={{ display: "flex", flexDirection: "column", flex: 1, gap: 4 }}
        >
          {/* ISO 27001 Chart */}
          <Grow in={!loading} timeout={1900}>
            <Box
              sx={{ mb: 4, height: { xs: "320px", sm: "360px", md: "400px" } }}
            >
              {/* <Box sx={{ mb: 4, flex: 1, minHeight: '0' }}> */}

              <ISO27001Chart complianceData={iso27001Data} />
            </Box>
          </Grow>

          {/* PCI-DSS Chart */}
          <Grow in={!loading} timeout={2100}>
            <Box sx={{ height: { xs: "320px", sm: "360px", md: "400px" } }}>
              <PCIDSSChart complianceData={pcidssData} />
            </Box>
          </Grow>
        </Grid>
      </Grid>

      {/* Modals */}
      <AddExpiryModal
        open={isAddExpiryModalOpen}
        onClose={() => setIsAddExpiryModalOpen(false)}
        onAddExpiry={handleAddExpiry}
        vendors={vendors}
      />
      <Toast toast={toast} onClose={closeToast} />

      <AddVendorModal
        open={isAddVendorModalOpen}
        onClose={() => setIsAddVendorModalOpen(false)}
        onAddVendor={handleAddVendor}
      />
    </Box>
  );
};

export default Audit;
