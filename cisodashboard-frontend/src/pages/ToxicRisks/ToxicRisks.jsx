import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Snackbar,
  Alert,
  Tooltip,
  IconButton,
  TextField,
  MenuItem,
  InputAdornment,
  Divider,
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import WarningIcon from "@mui/icons-material/Warning";
import BugReportIcon from "@mui/icons-material/BugReport";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import PublicIcon from "@mui/icons-material/Public";
import RefreshIcon from "@mui/icons-material/Refresh";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import HubIcon from "@mui/icons-material/Hub";
import api from "../../utils/api";

const ToxicRisks = () => {
  const [loading, setLoading] = useState(true);
  const [toxicItems, setToxicItems] = useState([]);
  const [breakdown, setBreakdown] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [remediatingId, setRemediatingId] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: "", severity: "info" });

  useEffect(() => {
    fetchToxicData();
  }, []);

  const fetchToxicData = async () => {
    setLoading(true);
    try {
      const [listRes, breakdownRes] = await Promise.all([
        api.get("/api/v1/correlation/toxic-combinations"),
        api.get("/api/v1/correlation/score-breakdown")
      ]);
      setToxicItems(listRes.data);
      setBreakdown(breakdownRes.data);
    } catch (err) {
      setToxicItems([]);
      setBreakdown({
        total_toxic_combinations: 0,
        critical_toxic_count: 0,
        high_toxic_count: 0,
        average_toxic_score: 0,
        provider_breakdown: {},
      });
      setNotification({
        open: true,
        message: err?.response?.data?.detail || "Toxic correlation API is unavailable. No sample rows were injected.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemediate = async (toxicId) => {
    setRemediatingId(toxicId);
    try {
      const res = await api.post(`/api/v1/correlation/remediate/${toxicId}`);
      setNotification({
        open: true,
        message: res.data?.message || "Guided remediation recorded. Cloud resources were not changed.",
        severity: "info"
      });
      fetchToxicData();
    } catch (err) {
      setNotification({
        open: true,
        message: err?.response?.data?.detail || "Unable to record guided remediation.",
        severity: "error"
      });
    } finally {
      setRemediatingId(null);
    }
  };

  const filteredItems = toxicItems.filter((item) => {
    const matchesSearch =
      item.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cspm_finding_summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.cve_id && item.cve_id.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesProvider = providerFilter === "ALL" || item.provider.toUpperCase() === providerFilter;
    const matchesRisk = riskFilter === "ALL" || item.risk_level.toUpperCase() === riskFilter;

    return matchesSearch && matchesProvider && matchesRisk;
  });

  return (
    <Box sx={{ p: 3, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 1.5 }}>
            <HubIcon sx={{ fontSize: 36, color: "#dc2626" }} />
            Toxic Risk Correlation & Context Engine
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
            Cross-Pillar Risk Multiplier Correlation: CSPM Misconfig × CVE Severity × CIEM Over-Privilege × Internet Exposure
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchToxicData}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          Recalculate Risk Matrix
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 3, borderRadius: 1 }} />}

      {/* Formula Banner */}
      <Card sx={{ p: 2, mb: 3, borderRadius: 3, backgroundColor: "#0f172a", color: "#ffffff", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <WarningIcon sx={{ color: "#ef4444" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#f8fafc" }}>
              TOXIC COMBINATION FORMULA:
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ fontFamily: "monospace", color: "#38bdf8", fontWeight: 700, backgroundColor: "#1e293b", px: 2, py: 0.5, borderRadius: 2 }}>
            Toxic Score = (CSPM Misconfig) × (CVE Severity) × (CIEM Privilege) × (Internet Reachability)
          </Typography>
        </Box>
      </Card>

      {/* KPI Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.03)", border: "1px solid #e2e8f0" }}>
            <CardContent>
              <Typography variant="overline" sx={{ color: "#64748b", fontWeight: 700 }}>
                Toxic Combinations
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: "#dc2626", my: 1 }}>
                {breakdown?.total_toxic_combinations || toxicItems.length}
              </Typography>
              <Typography variant="caption" sx={{ color: "#dc2626", fontWeight: 600 }}>
                Highest Priority Attack Chains
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.03)", border: "1px solid #e2e8f0" }}>
            <CardContent>
              <Typography variant="overline" sx={{ color: "#64748b", fontWeight: 700 }}>
                Toxic Critical (&gt;90 Score)
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: "#991b1b", my: 1 }}>
                {breakdown?.critical_toxic_count || 0}
              </Typography>
              <Typography variant="caption" sx={{ color: "#991b1b", fontWeight: 600 }}>
                Requires Immediate Remediation
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.03)", border: "1px solid #e2e8f0" }}>
            <CardContent>
              <Typography variant="overline" sx={{ color: "#64748b", fontWeight: 700 }}>
                Average Toxic Rating
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: "#d97706", my: 1 }}>
                {breakdown?.average_toxic_score || 0}
              </Typography>
              <Typography variant="caption" sx={{ color: "#d97706", fontWeight: 600 }}>
                Out of 100 Maximum Risk Score
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.03)", border: "1px solid #e2e8f0" }}>
            <CardContent>
              <Typography variant="overline" sx={{ color: "#64748b", fontWeight: 700 }}>
                Multi-Cloud Tenants
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: "#2563eb", my: 1 }}>
                {Object.keys(breakdown?.provider_breakdown || {}).length || 0}
              </Typography>
              <Typography variant="caption" sx={{ color: "#2563eb", fontWeight: 600 }}>
                Providers in the current correlation set
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Toolbar */}
      <Card sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.03)", border: "1px solid #e2e8f0" }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search asset name, finding, CVE..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#94a3b8" }} />
                  </InputAdornment>
                ),
              }}
              sx={{ backgroundColor: "#ffffff" }}
            />
          </Grid>

          <Grid item xs={6} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Cloud Provider"
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              sx={{ backgroundColor: "#ffffff" }}
            >
              <MenuItem value="ALL">All Cloud Providers</MenuItem>
              <MenuItem value="AWS">AWS</MenuItem>
              <MenuItem value="AZURE">Azure</MenuItem>
              <MenuItem value="GCP">GCP</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={6} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Risk Level"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              sx={{ backgroundColor: "#ffffff" }}
            >
              <MenuItem value="ALL">All Risk Levels</MenuItem>
              <MenuItem value="TOXIC_CRITICAL">Toxic Critical (&gt;90)</MenuItem>
              <MenuItem value="HIGH">High (&gt;75)</MenuItem>
              <MenuItem value="LOW">Remediated / Low</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Card>

      {!loading && filteredItems.length === 0 && (
        <Card sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            No toxic combinations in this workspace.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real accounts stay empty until live cloud findings exist. Sign in with the demo account to load isolated sample telemetry.
          </Typography>
        </Card>
      )}

      {/* Toxic Combination Cards */}
      <Grid container spacing={3}>
        {filteredItems.map((item) => (
          <Grid item xs={12} key={item.id}>
            <Card sx={{ borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.03)", border: item.remediation_status === "REMEDIATED" ? "1px solid #bbf7d0" : "1px solid #fca5a5" }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Chip label={item.provider} color="primary" size="small" sx={{ fontWeight: 800, fontSize: 11 }} />
                      <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a" }}>
                        {item.asset_name}
                      </Typography>
                      <Chip
                        label={`${item.toxic_score} / 100 ${item.risk_level}`}
                        color={item.remediation_status === "REMEDIATED" ? "success" : item.toxic_score > 90 ? "error" : "warning"}
                        size="small"
                        sx={{ fontWeight: 800, fontSize: 11 }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ color: "#64748b", mt: 0.5, display: "block" }}>
                      Account: {item.account_id} | Region: {item.region} | Asset Type: {item.asset_type}
                    </Typography>
                  </Box>

                  {item.remediation_status !== "REMEDIATED" ? (
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<FlashOnIcon />}
                      disabled={remediatingId === item.id}
                      onClick={() => handleRemediate(item.id)}
                      sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, px: 2.5 }}
                    >
                      {remediatingId === item.id ? "Remediating Vector..." : "⚡ Remediate Toxic Combination"}
                    </Button>
                  ) : (
                    <Chip icon={<CheckCircleIcon />} label="REMEDIATED & SAFE" color="success" sx={{ fontWeight: 700 }} />
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* 4-Pillar Multiplier Matrix */}
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#334155", mb: 1.5 }}>
                  Correlated 4-Pillar Risk Multipliers
                </Typography>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={3}>
                    <Box sx={{ p: 1.5, backgroundColor: "#f8fafc", borderRadius: 2, border: "1px solid #cbd5e1" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <SecurityIcon sx={{ fontSize: 16, color: "#dc2626" }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569" }}>
                          CSPM MISCONFIG ({item.pillars?.cspm_misconfig_score})
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                        {item.cspm_finding_summary}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <Box sx={{ p: 1.5, backgroundColor: "#f8fafc", borderRadius: 2, border: "1px solid #cbd5e1" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <BugReportIcon sx={{ fontSize: 16, color: "#d97706" }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569" }}>
                          CVE SEVERITY ({item.pillars?.cve_severity_score})
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                        {item.cve_id || "None"}: {item.cve_summary}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <Box sx={{ p: 1.5, backgroundColor: "#f8fafc", borderRadius: 2, border: "1px solid #cbd5e1" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <VpnKeyIcon sx={{ fontSize: 16, color: "#2563eb" }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569" }}>
                          CIEM OVER-PRIVILEGE ({item.pillars?.ciem_privilege_score})
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a", wordBreak: "break-all" }}>
                        {item.ciem_role_arn}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={3}>
                    <Box sx={{ p: 1.5, backgroundColor: "#f8fafc", borderRadius: 2, border: "1px solid #cbd5e1" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <PublicIcon sx={{ fontSize: 16, color: "#059669" }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569" }}>
                          INTERNET EXPOSURE ({item.pillars?.internet_reachability_score})
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                        {item.internet_exposure}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Toast Notification */}
      <Snackbar open={notification.open} autoHideDuration={4000} onClose={() => setNotification({ ...notification, open: false })}>
        <Alert severity={notification.severity} sx={{ width: "100%", borderRadius: 2, boxShadow: 3 }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ToxicRisks;
