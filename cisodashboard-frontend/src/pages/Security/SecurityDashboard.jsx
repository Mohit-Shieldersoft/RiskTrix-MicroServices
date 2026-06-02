import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Paper,
  LinearProgress,
  FormControl,
  InputLabel,
  Stack,
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import GppBadIcon from "@mui/icons-material/GppBad";
import ShieldIcon from "@mui/icons-material/Shield";
import BugReportIcon from "@mui/icons-material/BugReport";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import SystemUpdateAltIcon from "@mui/icons-material/SystemUpdateAlt";
import AppsIcon from "@mui/icons-material/Apps";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import LockIcon from "@mui/icons-material/Lock";
import SyncIcon from "@mui/icons-material/Sync";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import securityApi from "../../utils/securityApi";
import commandsApi from "../../utils/commandsApi";
import { hasPermission } from "../../utils/permissions";

const ASSET_BASE = "/api/v1";

// Fetch device metadata from Asset Service for display enrichment
const fetchDevice = async (id) => {
  try {
    const r = await fetch(`${ASSET_BASE}/devices/${id}`);
    if (r.ok) return r.json();
  } catch (_) {}
  return null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const SEVERITY_COLORS = {
  critical: "#d32f2f",
  high: "#f57c00",
  medium: "#fbc02d",
  low: "#388e3c",
};

const RISK_COLORS = {
  critical: "error",
  high: "warning",
  medium: "info",
  low: "success",
};

function RiskChip({ level }) {
  return (
    <Chip
      label={level?.toUpperCase()}
      color={RISK_COLORS[level] || "default"}
      size="small"
      sx={{ fontWeight: "bold", minWidth: 72 }}
    />
  );
}

function SeverityDot({ severity }) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: "50%",
        bgcolor: SEVERITY_COLORS[severity] || "#999",
        mr: 0.8,
        verticalAlign: "middle",
      }}
    />
  );
}

const StatCard = ({ label, value, color = "text.primary", icon, subtitle }) => (
  <Card sx={{ borderRadius: 2, height: "100%" }}>
    <CardContent>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h4" fontWeight="bold" sx={{ color, mt: 0.5 }}>
            {value ?? "—"}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ color, opacity: 0.7, fontSize: 36 }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

// ── Main Component ────────────────────────────────────────────────────────────

export default function SecurityDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [riskyDevices, setRiskyDevices] = useState([]);
  const [trend, setTrend] = useState([]);
  const [issues, setIssues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [alertUpdating, setAlertUpdating] = useState(null);

  // ── Alert filter state ──────────────────────────────────
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDeviceId, setFilterDeviceId] = useState("");

  // ── Quick remote command state ──────────────────────────
  const [quickCmd, setQuickCmd] = useState(null); // { deviceId, cmdKey }

  const loadAlerts = useCallback(async (overrides = {}) => {
    const filters = {
      severity:   overrides.severity   ?? filterSeverity,
      status:     overrides.status     ?? filterStatus,
      alert_type: overrides.alert_type ?? filterType,
      device_id:  overrides.device_id  ?? filterDeviceId,
    };
    // strip empty strings
    Object.keys(filters).forEach((k) => { if (!filters[k]) delete filters[k]; });
    const a = await securityApi.getAlerts(filters);
    setAlerts(a || []);
  }, [filterSeverity, filterStatus, filterType, filterDeviceId]);

  const loadData = async () => {
    try {
      const [s, r, t, i] = await Promise.all([
        securityApi.getSummary(),
        securityApi.getRiskyDevices(),
        securityApi.getTrend(),
        securityApi.getIssues(),
      ]);
      setSummary(s);
      setRiskyDevices(r || []);
      setTrend(t || []);
      setIssues(i);
      await loadAlerts();
    } catch (err) {
      console.error("Security dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    try { await loadAlerts(); } catch (e) { console.error(e); }
  };

  const clearFilters = async () => {
    setFilterSeverity("");
    setFilterStatus("");
    setFilterType("");
    setFilterDeviceId("");
    try {
      const a = await securityApi.getAlerts({});
      setAlerts(a || []);
    } catch (e) { console.error(e); }
  };

  const handleAlertStatus = async (alertId, newStatus) => {
    setAlertUpdating(alertId);
    try {
      await securityApi.updateAlertStatus(alertId, newStatus);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, status: newStatus } : a))
      );
      // refresh summary count
      const s = await securityApi.getSummary();
      setSummary(s);
    } catch (e) {
      console.error(e);
    } finally {
      setAlertUpdating(null);
    }
  };

  const handleQuickCommand = async (deviceId, cmdKey) => {
    setQuickCmd({ deviceId, cmdKey });
    try {
      await commandsApi.issue(deviceId, cmdKey);
    } catch (e) {
      console.error("Quick command failed:", e);
    } finally {
      setQuickCmd(null);
    }
  };

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );

  // Average security score: invert the critical/high ratio
  const securityScore =
    summary && summary.total_devices_evaluated > 0
      ? Math.max(
          0,
          100 - Math.round(((summary.critical_risk * 2 + summary.high_risk) / summary.total_devices_evaluated) * 50)
        )
      : 100;

  // Issues bar data
  const issuesData = issues
    ? [
        { label: "Rooted", count: issues.rooted_count, fill: "#d32f2f" },
        { label: "Unencrypted", count: issues.unencrypted_count, fill: "#f57c00" },
        { label: "No Screen Lock", count: issues.no_screen_lock_count, fill: "#fbc02d" },
        { label: "OS Outdated", count: issues.os_outdated_count, fill: "#1976d2" },
        { label: "Blacklisted App", count: issues.blacklisted_app_count, fill: "#7b1fa2" },
      ]
    : [];

  return (
    <Box sx={{ p: 3 }}>
      {/* ── Header ──────────────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Security Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Device risk overview, threat alerts, and security posture
            </Typography>
          </Box>
          <Box>
          {hasPermission("vulnerabilities", "update") && (
            <Button
              variant="contained"
              color="warning"
              startIcon={<SecurityIcon />}
              disabled={evaluating}
              onClick={async () => {
                try {
                  setEvaluating(true);
                  await securityApi.evaluateAll();
                  await loadData();
                } catch (e) {
                  console.error(e);
                } finally {
                  setEvaluating(false);
                }
              }}
            >
              {evaluating ? "Evaluating…" : "Re-evaluate All"}
            </Button>
          )}
          </Box>
        </Box>
      </Box>

      {/* ── Stat Cards ──────────────────────────────────────── */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <StatCard
              label="Total Evaluated"
              value={summary.total_devices_evaluated}
              icon={<PhoneAndroidIcon fontSize="inherit" />}
              color="text.primary"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <StatCard
              label="Critical Risk"
              value={summary.critical_risk}
              color="#d32f2f"
              icon={<GppBadIcon fontSize="inherit" />}
              subtitle="Immediate action needed"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <StatCard
              label="High Risk"
              value={summary.high_risk}
              color="#f57c00"
              icon={<WarningAmberIcon fontSize="inherit" />}
              subtitle="Requires attention"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <StatCard
              label="Open Alerts"
              value={summary.open_alerts}
              color="#1976d2"
              icon={<BugReportIcon fontSize="inherit" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <StatCard
              label="Security Score"
              value={`${securityScore}%`}
              color={securityScore >= 80 ? "#388e3c" : securityScore >= 50 ? "#f57c00" : "#d32f2f"}
              icon={<ShieldIcon fontSize="inherit" />}
              subtitle={securityScore >= 80 ? "Good" : securityScore >= 50 ? "Fair" : "Poor"}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <StatCard
              label="Risky Devices"
              value={riskyDevices.length}
              color="#7b1fa2"
              icon={<SecurityIcon fontSize="inherit" />}
              subtitle="Risk score ≥ 50"
            />
          </Grid>
        </Grid>
      )}

      {/* ── Trend Chart + Issues Widget ─────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Threat Trend — last 7 days */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ borderRadius: 2, height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Threat Alert Trend — Last 7 Days
              </Typography>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={trend} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="alerts" fill="#1976d2" radius={[4, 4, 0, 0]} name="Alerts" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Security Issues */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ borderRadius: 2, height: "100%" }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Top Security Issues
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
                {issuesData.map((item) => (
                  <Box key={item.label}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.4 }}>
                      <Typography variant="body2">{item.label}</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {item.count}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={
                        summary?.total_devices_evaluated
                          ? Math.min(100, (item.count / summary.total_devices_evaluated) * 100)
                          : 0
                      }
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: "#f0f0f0",
                        "& .MuiLinearProgress-bar": { bgcolor: item.fill, borderRadius: 4 },
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Threat Alerts Table ──────────────────────────────── */}
      <Card sx={{ borderRadius: 2, mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Threat Alerts
            </Typography>
            <Chip
              icon={<FilterListIcon fontSize="small" />}
              label={`${alerts.length} alert${alerts.length !== 1 ? "s" : ""}`}
              size="small"
              variant="outlined"
            />
          </Box>

          {/* Filter bar */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Severity</InputLabel>
              <Select
                label="Severity"
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="suppressed">Suppressed</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel>Alert Type</InputLabel>
              <Select
                label="Alert Type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="rooted_device">Rooted Device</MenuItem>
                <MenuItem value="encryption_disabled">Encryption Disabled</MenuItem>
                <MenuItem value="no_screen_lock">No Screen Lock</MenuItem>
                <MenuItem value="os_outdated">OS Outdated</MenuItem>
                <MenuItem value="blacklisted_app">Blacklisted App</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Device ID"
              value={filterDeviceId}
              onChange={(e) => setFilterDeviceId(e.target.value)}
              type="number"
              sx={{ width: 120 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <Button variant="contained" size="small" onClick={applyFilters} sx={{ alignSelf: "center" }}>
              Apply
            </Button>
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              sx={{ alignSelf: "center" }}
              disabled={!filterSeverity && !filterStatus && !filterType && !filterDeviceId}
            >
              Clear
            </Button>
          </Stack>

          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: "bold" } }}>
                  <TableCell>Device ID</TableCell>
                  <TableCell>Alert Type</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ color: "text.secondary", py: 3 }}>
                      No alerts found
                    </TableCell>
                  </TableRow>
                ) : (
                  alerts.slice(0, 20).map((alert) => (
                    <TableRow key={alert.id} hover>
                      <TableCell>#{alert.device_id}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                          {alert.alert_type}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <SeverityDot severity={alert.severity} />
                          <Typography variant="body2" sx={{ textTransform: "capitalize" }}>
                            {alert.severity}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{alert.message}</TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(alert.created_at).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={alert.status}
                          size="small"
                          color={
                            alert.status === "open"
                              ? "error"
                              : alert.status === "suppressed"
                              ? "default"
                              : "success"
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        {hasPermission("vulnerabilities", "update") && alert.status === "open" && (
                          <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                            <Tooltip title="Mark Resolved">
                              <span>
                                <IconButton
                                  size="small"
                                  color="success"
                                  disabled={alertUpdating === alert.id}
                                  onClick={() => handleAlertStatus(alert.id, "resolved")}
                                >
                                  <CheckCircleOutlineIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Suppress">
                              <span>
                                <IconButton
                                  size="small"
                                  color="default"
                                  disabled={alertUpdating === alert.id}
                                  onClick={() => handleAlertStatus(alert.id, "suppressed")}
                                >
                                  <VisibilityOffIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        )}
                        {hasPermission("vulnerabilities", "update") && alert.status !== "open" && (
                          <Tooltip title="Re-open">
                            <span>
                              <IconButton
                                size="small"
                                color="warning"
                                disabled={alertUpdating === alert.id}
                                onClick={() => handleAlertStatus(alert.id, "open")}
                              >
                                <WarningAmberIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* ── Top Risky Devices Table ──────────────────────────── */}
      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Top Risky Devices
          </Typography>
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: "bold" } }}>
                  <TableCell>Device</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Platform</TableCell>
                  <TableCell>Risk Score</TableCell>
                  <TableCell>Risk Level</TableCell>
                  <TableCell>Main Issue</TableCell>
                  <TableCell align="center">Quick Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {riskyDevices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ color: "text.secondary", py: 3 }}>
                      No risky devices found
                    </TableCell>
                  </TableRow>
                ) : (
                  riskyDevices.map((d) => (
                    <TableRow
                      key={d.device_id}
                      hover
                      onClick={() => navigate(`/security/device/${d.device_id}`)}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {d.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {d.device_uid}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{d.owner}</TableCell>
                      <TableCell sx={{ textTransform: "capitalize" }}>{d.platform}</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(100, d.risk_score)}
                            sx={{
                              width: 60,
                              height: 6,
                              borderRadius: 3,
                              "& .MuiLinearProgress-bar": {
                                bgcolor:
                                  d.risk_score >= 81
                                    ? "#d32f2f"
                                    : d.risk_score >= 51
                                    ? "#f57c00"
                                    : "#fbc02d",
                              },
                            }}
                          />
                          <Typography variant="body2" fontWeight="bold">
                            {d.risk_score}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <RiskChip level={d.risk_level} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {d.main_issue}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                          <Tooltip title="Lock Device">
                            <span>
                              <IconButton
                                size="small"
                                color="warning"
                                disabled={!!quickCmd}
                                onClick={() => handleQuickCommand(d.device_id, "lock")}
                              >
                                {quickCmd?.deviceId === d.device_id && quickCmd?.cmdKey === "lock"
                                  ? <CircularProgress size={14} />
                                  : <LockIcon fontSize="small" />}
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Force Sync">
                            <span>
                              <IconButton
                                size="small"
                                color="primary"
                                disabled={!!quickCmd}
                                onClick={() => handleQuickCommand(d.device_id, "sync")}
                              >
                                {quickCmd?.deviceId === d.device_id && quickCmd?.cmdKey === "sync"
                                  ? <CircularProgress size={14} />
                                  : <SyncIcon fontSize="small" />}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}
