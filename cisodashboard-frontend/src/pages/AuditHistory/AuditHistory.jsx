import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  Fade,
  useTheme,
  Divider,
} from "@mui/material";
import ExpiredVendorsTable from "./components/ExpiredVendorsTable";
import ExceptionTrendsChart from "./components/ExceptionTrendsChart";
import StandardComplianceChart from "./components/StandardComplianceChart";
import { generateMockAuditHistoryData } from "./mockData";
import auditApi from "../../utils/auditApi";
import { getUserProfile } from "../../utils/auth";
import dashboardTheme from "../../theme/dashboardTheme";
import "./AuditHistory.css";

const AuditHistory = () => {
  // State
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedStandard, setSelectedStandard] = useState("ISO 27001");

  // Current date and user
  const currentDateTime = new Date().toISOString().slice(0, 10);
  const currentUser =
    getUserProfile()?.full_name || getUserProfile()?.email || "User";

  // Theme
  const theme = useTheme();

  // Fetch audit history data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const apiData = await auditApi.getAuditHistory();
        setData(apiData);
      } catch (err) {
        console.error("Failed to load audit history:", err);
        // fallback to mock data if API fails
        const mockData = generateMockAuditHistoryData();
        setData(mockData);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle standard change for the pie chart
  const handleStandardChange = (event) => {
    setSelectedStandard(event.target.value);
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
          background: "linear-gradient(135deg, #00796B 0%, #009688 100%)",
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
            Audit History
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              color: "rgba(255, 255, 255, 0.9)",
              mt: 0.5,
            }}
          >
            {currentDateTime} • {currentUser}
          </Typography>
        </Box>
      </Box>

      {/* Top Half: Compliance History, TPRM Compliance, Expired Vendors */}
      <Grid container spacing={3} sx={{ mb: 3 }} alignItems="stretch">
        {/* Compliance History Chart (35%) */}
        <Grid
          size={{ xs: 12 }}
          sx={{
            display: "flex",
            flexBasis: { md: "35%" },
            maxWidth: { md: "35%" },
          }}
        >
          <Fade in={!loading} timeout={800}>
            <Paper
              elevation={0}
              className="futuristic-card"
              sx={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
                p: 0,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{ p: 2, bgcolor: dashboardTheme.colors.background.card }}
              >
                <Typography variant="h6" sx={{ fontWeight: "medium" }}>
                  Compliance History
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ flex: 1, minHeight: 0, p: 1 }}>
                <ComplianceHistoryChart data={data?.complianceHistory} />
              </Box>
            </Paper>
          </Fade>
        </Grid>

        {/* TPRM Compliance Chart (35%) */}
        <Grid
          size={{ xs: 12 }}
          sx={{
            display: "flex",
            flexBasis: { md: "35%" },
            maxWidth: { md: "35%" },
          }}
        >
          <Fade in={!loading} timeout={1000}>
            <Paper
              elevation={0}
              className="futuristic-card"
              sx={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
                p: 0,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{ p: 2, bgcolor: dashboardTheme.colors.background.card }}
              >
                <Typography variant="h6" sx={{ fontWeight: "medium" }}>
                  TPRM Compliance
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ flex: 1, minHeight: 0, p: 1 }}>
                <TPRMComplianceChart data={data?.tprmCompliance} />
              </Box>
            </Paper>
          </Fade>
        </Grid>

        {/* Expired Vendors Table (30%) */}
        <Grid
          size={{ xs: 12 }}
          sx={{
            display: "flex",
            flexBasis: { md: "30%" },
            maxWidth: { md: "30%" },
          }}
        >
          <Fade in={!loading} timeout={1200}>
            <Paper
              elevation={0}
              className="futuristic-card"
              sx={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
                p: 0,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{ p: 2, bgcolor: dashboardTheme.colors.background.card }}
              >
                <Typography variant="h6" sx={{ fontWeight: "medium" }}>
                  Expired Vendors
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ flex: 1, minHeight: 0, p: 1, overflow: "auto" }}>
                <ExpiredVendorsTable data={data?.expiredVendors} />
              </Box>
            </Paper>
          </Fade>
        </Grid>
      </Grid>

      {/* Bottom Half: Exception Trends and Standard Compliance */}
      <Grid container spacing={2}>
        {/* Exception Trends Chart (60%) */}
        <Grid
          size={{ xs: 12 }}
          sx={{
            display: "flex",
            flexBasis: { md: "52%" },
            maxWidth: { md: "52%" },
          }}
        >
          <Fade in={!loading} timeout={1400}>
            <Paper
              elevation={0}
              className="futuristic-card"
              sx={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
                p: 0,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{ p: 2, bgcolor: dashboardTheme.colors.background.card }}
              >
                <Typography variant="h6" sx={{ fontWeight: "medium" }}>
                  Exception Trends by Risk Level
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ flex: 1, minHeight: 0, p: 2 }}>
                <ExceptionTrendsChart data={data?.exceptionTrends} />
              </Box>
            </Paper>
          </Fade>
        </Grid>

        {/* Standard Compliance Chart (40%) */}
        <Grid
          size={{ xs: 12 }}
          sx={{
            display: "flex",
            flexBasis: { md: "48%" },
            maxWidth: { md: "48%" },
          }}
        >
          <Fade in={!loading} timeout={1600}>
            <Paper
              elevation={0}
              className="futuristic-card"
              sx={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
                p: 0,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  p: 2,
                  bgcolor: dashboardTheme.colors.background.card,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: "medium" }}>
                  Standard Compliance
                </Typography>
                <FormControl sx={{ minWidth: 150 }} size="small">
                  <InputLabel id="standard-select-label">Standard</InputLabel>
                  <Select
                    labelId="standard-select-label"
                    value={selectedStandard}
                    label="Standard"
                    onChange={handleStandardChange}
                  >
                    <MenuItem value="ISO 27001">ISO 27001</MenuItem>
                    <MenuItem value="PCI-DSS v4">PCI-DSS v4</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Divider />
              <Box sx={{ flex: 1, minHeight: 0, p: 2 }}>
                <StandardComplianceChart
                  data={
                    selectedStandard === "ISO 27001"
                      ? data?.standardCompliance.iso27001
                      : data?.standardCompliance.pcidss
                  }
                  standard={selectedStandard}
                />
              </Box>
            </Paper>
          </Fade>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AuditHistory;
