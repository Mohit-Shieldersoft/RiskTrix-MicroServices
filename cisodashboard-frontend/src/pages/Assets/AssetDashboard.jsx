import React, { useEffect, useState } from "react";
import {
  Box, Typography, Grid, CircularProgress,
  Card, CardContent, Chip, Button,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import AssetSummaryCards from "../../components/Assets/AssetSummaryCards";
import AssetRiskChart from "../../components/Assets/AssetRiskChart";
import AssetTypeChart from "../../components/Assets/AssetTypeChart";
import assetApi from "../../utils/assetApi";

const AssetDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await assetApi.getDashboard();
      setData(res);
      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      console.error("Dashboard error", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={{ textAlign: "center", mt: 10 }}>
        <Typography color="error">{error || "No data available"}</Typography>
        <Button sx={{ mt: 2 }} variant="outlined" onClick={fetchDashboard}>
          Retry
        </Button>
      </Box>
    );
  }

  const topType = data.byType && Object.keys(data.byType).length > 0
    ? Object.entries(data.byType).sort((a, b) => b[1] - a[1])[0][0]
    : "N/A";

  return (
    <Box sx={{ p: 3 }}>
      {/* HEADER */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Asset Management Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Executive overview of asset risk, distribution and health
          </Typography>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              Last updated: {lastUpdated}
            </Typography>
          )}
        </Box>
        <Button startIcon={<RefreshIcon />} variant="outlined" onClick={fetchDashboard} size="small">
          Refresh
        </Button>
      </Box>

      {/* KPI CARDS */}
      <Box sx={{ mb: 3 }}>
        <AssetSummaryCards stats={data} />
      </Box>

      {/* CHARTS — ✅ FIX: Removed item/xs/md props (MUI Grid v2) */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Risk Distribution</Typography>
              <AssetRiskChart data={data.riskDistribution} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Assets by Type</Typography>
              <AssetTypeChart data={data.byType} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* INSIGHTS */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">High Risk Exposure</Typography>
              <Typography variant="h5" color="error">
                {data.riskDistribution?.high ?? 0} Assets
              </Typography>
              <Typography variant="body2">Immediate attention required</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Most Common Asset Type</Typography>
              <Typography variant="h5">{topType}</Typography>
              <Typography variant="body2">Highest asset concentration</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Overall Risk Status</Typography>
              <Chip
                label={data.riskDistribution?.high > 2 ? "High Risk" : "Moderate Risk"}
                color={data.riskDistribution?.high > 2 ? "error" : "warning"}
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Based on current asset distribution
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AssetDashboard;