import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  useTheme,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  Alert,
  CircularProgress,
} from "@mui/material";
// import UploadFileIcon from "@mui/icons-material/UploadFile"; // TODO: re-enable when CSV upload is ready
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EOSLTable from "./components/EOSLTable";
import CountCard from "./components/CountCard";
import NonComplianceBarChart from "./components/NonComplianceBarChart";
import ComplianceLineChart from "./components/ComplianceLineChart";
// import AssetUploadModal from "./components/AssetUploadModal"; // TODO: re-enable when CSV upload is ready
import AddAssetModal from "./components/AddAssetModal";
import Toast from "../../components/common/Toast";
import { useToast } from "../../components/common/useToast";
import { getEOSLDashboardData } from "../../utils/eoslApi";
import dashboardTheme from "../../theme/dashboardTheme";
import "./EOSL.css";

const EOSL = () => {
  const [loading, setLoading] = useState(true);
  const [eoslData, setEOSLData] = useState(null);
  const [selectedYear, setSelectedYear] = useState("2025");
  // const [isUploadModalOpen, setIsUploadModalOpen] = useState(false); // TODO: re-enable when CSV upload is ready
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const { toast, showToast, closeToast } = useToast();

  const currentDateTime = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const currentUser = "Admin User";
  const theme = useTheme();
  const availableYears = ["2023", "2024", "2025", "2026"];

  // Fetch EOSL data from backend
  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEOSLDashboardData(selectedYear);
      setEOSLData(data);
    } catch (err) {
      console.error("Error fetching EOSL data:", err);
      setError("Failed to load EOSL data. Please try again.");
      setEOSLData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };

  // TODO: re-enable when CSV upload is ready
  // const handleAssetUpload = (result) => {
  //   setIsUploadModalOpen(false);
  //   if (result?.created > 0) {
  //     showToast(`${result.created} asset${result.created !== 1 ? "s" : ""} uploaded successfully`, "success");
  //     fetchData();
  //   }
  // };

  const handleAddAsset = (_createdAsset) => {
    setIsAddAssetModalOpen(false);
    showToast("Asset added successfully", "success");
    fetchData();
  };

  const getYearlyComplianceData = () => {
    if (!eoslData || !eoslData.complianceByYear) return [];
    return eoslData.complianceByYear[selectedYear] || [];
  };

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        maxWidth: "100%",
        background:
          "linear-gradient(135deg, rgba(240,242,245,1) 0%, rgba(245,247,250,1) 100%)",
        minHeight: "calc(100vh - 64px)",
        height: "100%",
        overflow: "auto",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            background: "linear-gradient(135deg, #1E88E5 0%, #42A5F5 100%)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
            flexGrow: 1,
          }}
          className="dashboard-header"
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: dashboardTheme.typography.fontWeights.bold,
              color: "#ffffff",
              textShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
          >
            End of Service Life Management
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ color: "rgba(255,255,255,0.9)", mt: 0.5 }}
          >
            {currentDateTime} • {currentUser}
          </Typography>
        </Paper>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && !eoslData && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
          }}
        >
          <CircularProgress size={60} />
        </Box>
      )}

      <Grid container spacing={3} sx={{ alignItems: "stretch" }}>
        {/* Left Column (40%) */}
        <Grid
          size={{ xs: 12 }}
          sx={{
            flexBasis: { md: "40%" },
            maxWidth: { md: "40%" },
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          {/* Top Section - 2 equal cards */}
          {/* <Grid container spacing={2} sx={{ mb: 3, alignItems: 'stretch' }}>
           
            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'stretch' }}>
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'stretch',
                  // Force immediate child (CountCard) to fill the box
                  '& > *': {
                    width: '100% !important',
                    height: '100% !important',
                    boxSizing: 'border-box'
                  }
                }}
              >
                <CountCard
                  title="End of Support"
                  count={eoslData?.summary?.eosCount || 0}
                  icon="eos"
                  color="#E57373"
                  subtext="Assets requiring attention"
                  loading={loading}
                />
              </Box>
            </Grid>

            
            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'stretch' }}>
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'stretch',
                  '& > *': {
                    width: '100% !important',
                    height: '100% !important',
                    boxSizing: 'border-box'
                  }
                }}
              >
                <CountCard
                  title="End of Life"
                  count={eoslData?.summary?.eolCount || 0}
                  icon="eol"
                  color="#F44336"
                  subtext="Critical assets"
                  loading={loading}
                />
              </Box>
            </Grid>
          </Grid> */}

          <Grid
            container
            spacing={2}
            sx={{
              mb: 3,
              display: "flex",
              alignItems: "stretch",
              justifyContent: "space-between",
            }}
          >
            <Grid
              size={{ xs: 12, sm: 6 }}
              sx={{
                display: "flex",
                alignItems: "stretch",
                flex: 1,
                maxWidth: { sm: "50%", md: "50%" },
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "stretch",
                  "& > *": {
                    width: "100%",
                    height: "100%",
                    minHeight: "140px",
                    boxSizing: "border-box",
                  },
                  /* make the card square on small+ screens by using aspect-ratio */
                  aspectRatio: { xs: "auto", sm: "1 / 1" },
                }}
              >
                <CountCard
                  title="End of Support"
                  count={eoslData?.summary?.eosCount || 0}
                  icon="eos"
                  color="#E57373"
                  subtext="Assets requiring attention"
                  loading={loading}
                />
              </Box>
            </Grid>

            <Grid
              size={{ xs: 12, sm: 6 }}
              sx={{
                display: "flex",
                alignItems: "stretch",
                flex: 1,
                maxWidth: { sm: "50%", md: "50%" },
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "stretch",
                  "& > *": {
                    width: "100%",
                    height: "100%",
                    minHeight: "140px",
                    boxSizing: "border-box",
                  },
                  /* make the card square on small+ screens by using aspect-ratio */
                  aspectRatio: { xs: "auto", sm: "1 / 1" },
                }}
              >
                <CountCard
                  title="End of Life"
                  count={eoslData?.summary?.eolCount || 0}
                  icon="eol"
                  color="#F44336"
                  subtext="Critical assets"
                  loading={loading}
                />
              </Box>
            </Grid>
          </Grid>

          {/* Non-compliance chart (responsive) */}
          <Paper
            elevation={0}
            className="futuristic-card"
            sx={{
              p: 0,
              height: { xs: "360px", md: "440px" },
              width: "100%",
              mb: 3,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                p: 2,
                bgcolor: "#f8f9fb",
                borderBottom: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: "medium" }}>
                Top Non-Compliant Assets
              </Typography>
            </Box>
            <Box sx={{ p: 2, height: "calc(100% - 56px)" }}>
              <NonComplianceBarChart
                data={eoslData?.topNonCompliantAssets || []}
                loading={loading}
              />
            </Box>
          </Paper>

          {/* Compliance trends */}
          <Paper
            elevation={0}
            className="futuristic-card"
            sx={{
              p: 0,
              height: { xs: "360px", md: "400px" },
              width: "100%",
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                p: 2,
                bgcolor: "#f8f9fb",
                borderBottom: "1px solid rgba(0,0,0,0.05)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: "medium" }}>
                Compliance Trends
              </Typography>

              <FormControl sx={{ minWidth: 120 }} size="small">
                <InputLabel id="year-select-label">Financial Year</InputLabel>
                <Select
                  labelId="year-select-label"
                  id="year-select"
                  value={selectedYear}
                  label="Financial Year"
                  onChange={handleYearChange}
                >
                  {availableYears.map((year) => (
                    <MenuItem key={year} value={year}>
                      FY {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ p: 2, height: "calc(100% - 56px)" }}>
              <ComplianceLineChart
                data={getYearlyComplianceData()}
                loading={loading}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Right Column (60%) */}
        <Grid
          size={{ xs: 12 }}
          sx={{
            flexBasis: { md: "60%" },
            maxWidth: { md: "60%" },
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mb: 2 }}
          >
            {/* TODO: re-enable when CSV upload is ready
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              onClick={() => setIsUploadModalOpen(true)}
              sx={{
                color: "#1976D2",
                borderColor: "#1976D2",
                fontWeight: "medium",
                "&:hover": { bgcolor: "rgba(25,118,210,0.06)" },
              }}
            >
              Upload CSV
            </Button>
            */}
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => setIsAddAssetModalOpen(true)}
              sx={{
                bgcolor: "#1976D2",
                color: "white",
                fontWeight: "medium",
                "&:hover": {
                  bgcolor: "#1565C0",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                },
              }}
            >
              Add Asset
            </Button>
          </Box>

          <Paper
            elevation={0}
            className="futuristic-card"
            sx={{
              p: 0,
              height: "890px",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                p: 2,
                bgcolor: "#f8f9fb",
                borderBottom: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: "medium" }}>
                Assets Requiring Attention
              </Typography>
            </Box>
            <Box sx={{ height: "calc(100% - 56px)" }}>
              <EOSLTable data={eoslData?.assets || []} loading={loading} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Modals */}
      {/* TODO: re-enable when CSV upload is ready
      <AssetUploadModal
        open={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleAssetUpload}
      />
      */}

      <AddAssetModal
        open={isAddAssetModalOpen}
        onClose={() => setIsAddAssetModalOpen(false)}
        onAddAsset={handleAddAsset}
      />

      <Toast toast={toast} onClose={closeToast} />
    </Box>
  );
};

export default EOSL;
