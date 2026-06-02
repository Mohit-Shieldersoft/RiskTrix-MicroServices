import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Card, CardContent, Grid, CircularProgress,
  Button, Chip, LinearProgress, Table, TableHead, TableRow,
  TableCell, TableBody, TableContainer, Paper, Divider,
  Alert, Tabs, Tab, IconButton, Tooltip,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import PolicyIcon from "@mui/icons-material/Policy";
import DevicesIcon from "@mui/icons-material/Devices";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import PendingIcon from "@mui/icons-material/Pending";
import ShieldIcon from "@mui/icons-material/Shield";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SecurityIcon from "@mui/icons-material/Security";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AssignmentIcon from "@mui/icons-material/Assignment";
import SendIcon from "@mui/icons-material/Send";
import policyApi from "../../utils/policyApi";
import AlertsBanner from "../../components/AlertsBanner";
import { hasPermission } from "../../utils/permissions";

const PLATFORM_LABELS = {
  all: "All Platforms", android: "Android",
  windows: "Windows", ios: "iOS", macos: "macOS",
};

const CATEGORY_LABELS = {
  device_security: "Device Security", app_control: "App Control",
  network: "Network", os_update: "OS Update",
};

const SEVERITY_COLORS = {
  critical: "error", high: "error", medium: "warning", low: "default",
};

// ── KPI Card ──────────────────────────────────────────────
const KpiCard = ({ label, value, sub, color = "text.primary", icon, onClick }) => (
  <Card
    sx={{ borderRadius: 2, cursor: onClick ? "pointer" : "default",
      "&:hover": onClick ? { boxShadow: 3 } : {} }}
    onClick={onClick}
  >
    <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Box>
        <Typography variant="subtitle2" color="text.secondary">{label}</Typography>
        <Typography variant="h4" sx={{ color, fontWeight: "bold" }}>{value}</Typography>
        {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
      </Box>
      <Box sx={{ color, opacity: 0.25, fontSize: 48 }}>{icon}</Box>
    </CardContent>
  </Card>
);

// ── Section Header ────────────────────────────────────────
const SectionHeader = ({ title, color = "text.primary", icon }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
    <Box sx={{ color }}>{icon}</Box>
    <Typography variant="h6" fontWeight="bold" sx={{ color }}>{title}</Typography>
  </Box>
);

// ── Health Score Ring ─────────────────────────────────────
const HealthRing = ({ score }) => {
  const color = score >= 80 ? "#2e7d32" : score >= 60 ? "#ed6c02" : "#d32f2f";
  return (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <CircularProgress variant="determinate" value={100} size={100} thickness={5} sx={{ color: "grey.200" }} />
      <CircularProgress variant="determinate" value={score} size={100} thickness={5}
        sx={{ color, position: "absolute", left: 0 }} />
      <Box sx={{ position: "absolute", inset: 0, display: "flex",
        alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <Typography variant="h5" fontWeight="bold" sx={{ color }}>{score}</Typography>
        <Typography variant="caption" color="text.secondary">/ 100</Typography>
      </Box>
    </Box>
  );
};

const PolicyDashboard = () => {
  const navigate = useNavigate();
  const [basicData, setBasicData] = useState(null);
  const [widgets, setWidgets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [basic, w] = await Promise.all([
        policyApi.getDashboard(),
        policyApi.getDashboardWidgets(),
      ]);
      setBasicData(basic);
      setWidgets(w);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>
  );

  if (error || !basicData || !widgets) return (
    <Box sx={{ textAlign: "center", mt: 10 }}>
      <Alert severity="error" sx={{ mb: 2, maxWidth: 400, mx: "auto" }}>{error}</Alert>
      <Button variant="outlined" onClick={fetchAll}>Retry</Button>
    </Box>
  );

  const { it_ops, security, compliance, executive } = widgets;

  return (
    <Box sx={{ p: 3 }}>
      {/* HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Policy Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            IT Operations · Security · Compliance · Executive
          </Typography>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">Updated {lastUpdated}</Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          {hasPermission("policies", "bulk_assign") && (
            <Button variant="outlined" size="small" startIcon={<SendIcon />}
              onClick={() => navigate("/policies/bulk-assign")}>Bulk Assign</Button>
          )}
          <Button variant="outlined" size="small" startIcon={<PolicyIcon />}
            onClick={() => navigate("/policies")}>Policies</Button>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchAll}><RefreshIcon /></IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ALERTS BANNER */}
      <AlertsBanner maxVisible={2} />

      {/* TOP KPI ROW */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="Active Policies" value={executive.active_policies}
            sub={`of ${executive.total_policies} total`} color="primary.main"
            icon={<PolicyIcon fontSize="inherit" />} onClick={() => navigate("/policies")} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="Policy Coverage" value={`${executive.policy_coverage_pct}%`}
            sub={`${executive.devices_covered} / ${executive.total_devices} devices`}
            color="success.main" icon={<ShieldIcon fontSize="inherit" />} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="Pending Actions" value={executive.pending_actions}
            sub="failures + pending + critical"
            color={executive.pending_actions > 0 ? "warning.main" : "success.main"}
            icon={<WarningAmberIcon fontSize="inherit" />} />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <KpiCard label="High-Risk Devices" value={executive.high_risk_devices}
            sub="non-compliant assignments"
            color={executive.high_risk_devices > 0 ? "error.main" : "success.main"}
            icon={<ErrorIcon fontSize="inherit" />} onClick={() => navigate("/devices")} />
        </Grid>
      </Grid>

      {/* TABS */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}
        TabIndicatorProps={{ style: { height: 3 } }}>
        <Tab label="IT Operations" icon={<AssignmentIcon fontSize="small" />} iconPosition="start" />
        <Tab label="Security" icon={<SecurityIcon fontSize="small" />} iconPosition="start" />
        <Tab label="Compliance" icon={<ShieldIcon fontSize="small" />} iconPosition="start" />
        <Tab label="Executive" icon={<TrendingUpIcon fontSize="small" />} iconPosition="start" />
      </Tabs>

      {/* ── TAB 0: IT OPERATIONS ── */}
      {tab === 0 && (
        <Box>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: "Total Assignments", value: it_ops.total_assignments, color: "text.primary" },
              { label: "Successful", value: it_ops.deployment_success, color: "success.main" },
              { label: "Failed", value: it_ops.deployment_failed, color: "error.main" },
              { label: "Pending", value: it_ops.deployment_pending, color: "warning.main" },
              { label: "Retrying", value: it_ops.deployment_retrying, color: "info.main" },
              { label: "Success Rate", value: `${it_ops.success_rate}%`,
                color: it_ops.success_rate >= 80 ? "success.main" : "error.main" },
            ].map((s, i) => (
              <Grid size={{ xs: 6, md: 2 }} key={i}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ textAlign: "center", py: 2, "&:last-child": { pb: 2 } }}>
                    <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: s.color }}>{s.value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <SectionHeader title="Deployment Progress" icon={<AssignmentIcon color="primary" />} />
                  {[
                    { label: "Successful", value: it_ops.deployment_success, pct: it_ops.success_rate, color: "success" },
                    { label: "Failed", value: it_ops.deployment_failed,
                      pct: it_ops.total_assignments ? Math.round(it_ops.deployment_failed / it_ops.total_assignments * 100) : 0, color: "error" },
                    { label: "Pending", value: it_ops.deployment_pending,
                      pct: it_ops.total_assignments ? Math.round(it_ops.deployment_pending / it_ops.total_assignments * 100) : 0, color: "warning" },
                  ].map((s) => (
                    <Box key={s.label} sx={{ mb: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="body2">{s.label}</Typography>
                        <Typography variant="body2" fontWeight="bold">{s.value} ({s.pct}%)</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={s.pct} color={s.color} sx={{ height: 8, borderRadius: 4 }} />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <SectionHeader title="Recently Failed Deployments" icon={<ErrorIcon color="error" />} />
                  {it_ops.recently_failed.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 3 }}>
                      <CheckCircleIcon color="success" sx={{ fontSize: 36 }} />
                      <Typography color="text.secondary">No failed deployments</Typography>
                    </Box>
                  ) : (
                    <TableContainer component={Paper} elevation={0}
                      sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: "grey.50" }}>
                            {["Device", "Policy", "Reason"].map((h, i) => (
                              <TableCell key={i} sx={{ fontWeight: "bold" }}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {it_ops.recently_failed.map((f, i) => (
                            <TableRow key={i} hover sx={{ "&:last-child td": { border: 0 } }}>
                              <TableCell>
                                <Button size="small" variant="text" sx={{ textTransform: "none", p: 0 }}
                                  onClick={() => navigate(`/devices/${f.device_id}`)}>{f.device_name}</Button>
                              </TableCell>
                              <TableCell>
                                <Button size="small" variant="text" sx={{ textTransform: "none", p: 0 }}
                                  onClick={() => navigate(`/policies/${f.policy_id}`)}>{f.policy_name}</Button>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" color="error.main">{f.message}</Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <SectionHeader title="Policy Deployment Table" icon={<PolicyIcon color="primary" />} />
                  <TableContainer component={Paper} elevation={0}
                    sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: "grey.50" }}>
                          {["Policy", "Platform", "Status", "Assigned", "Successful", "Pending", "Failed", ""].map((h, i) => (
                            <TableCell key={i} sx={{ fontWeight: "bold" }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {basicData.deployment_table.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} align="center">
                              <Typography color="text.secondary" sx={{ py: 2 }}>No policies found</Typography>
                            </TableCell>
                          </TableRow>
                        ) : basicData.deployment_table.map((row) => (
                          <TableRow key={row.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                            <TableCell sx={{ fontWeight: 500 }}>{row.name}</TableCell>
                            <TableCell>{PLATFORM_LABELS[row.platform] || row.platform}</TableCell>
                            <TableCell>
                              <Chip label={row.status} size="small" color={row.status === "active" ? "success" : "warning"} />
                            </TableCell>
                            <TableCell>{row.assigned_devices}</TableCell>
                            <TableCell><Typography color="success.main" fontWeight="bold">{row.successful}</Typography></TableCell>
                            <TableCell><Typography color="warning.main" fontWeight="bold">{row.pending}</Typography></TableCell>
                            <TableCell><Typography color="error.main" fontWeight="bold">{row.failed}</Typography></TableCell>
                            <TableCell>
                              <Button size="small" variant="outlined" onClick={() => navigate(`/policies/${row.id}`)}>View</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ── TAB 1: SECURITY ── */}
      {tab === 1 && (
        <Box>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: "Total Violations", value: security.total_violations, color: "error.main" },
              { label: "Critical", value: security.violation_breakdown.critical, color: "error.main" },
              { label: "High", value: security.violation_breakdown.high, color: "error.main" },
              { label: "Medium", value: security.violation_breakdown.medium, color: "warning.main" },
              { label: "Low", value: security.violation_breakdown.low, color: "info.main" },
              { label: "High-Risk Devices", value: security.high_risk_devices,
                color: security.high_risk_devices > 0 ? "error.main" : "success.main" },
            ].map((s, i) => (
              <Grid size={{ xs: 6, md: 2 }} key={i}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ textAlign: "center", py: 2, "&:last-child": { pb: 2 } }}>
                    <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: s.color }}>{s.value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <SectionHeader title="Violation Severity" icon={<SecurityIcon color="error" />} />
                  {Object.entries(security.violation_breakdown).map(([sev, count]) => (
                    <Box key={sev} sx={{ mb: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Chip label={sev} size="small" color={SEVERITY_COLORS[sev] || "default"} />
                        <Typography variant="body2" fontWeight="bold">{count}</Typography>
                      </Box>
                      <LinearProgress variant="determinate"
                        value={security.total_violations > 0 ? (count / security.total_violations * 100) : 0}
                        color={SEVERITY_COLORS[sev] || "primary"} sx={{ height: 6, borderRadius: 3 }} />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <SectionHeader title="High-Risk Devices" icon={<WarningAmberIcon color="error" />} />
                  {security.risky_devices.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 3 }}>
                      <CheckCircleIcon color="success" sx={{ fontSize: 36 }} />
                      <Typography color="text.secondary">No high-risk devices</Typography>
                    </Box>
                  ) : (
                    <TableContainer component={Paper} elevation={0}
                      sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: "grey.50" }}>
                            {["Device", "Platform", "Owner", "Violations", "Score", ""].map((h, i) => (
                              <TableCell key={i} sx={{ fontWeight: "bold" }}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {security.risky_devices.map((d) => (
                            <TableRow key={d.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                              <TableCell sx={{ fontWeight: 500 }}>{d.name}</TableCell>
                              <TableCell>
                                <Chip label={d.platform} size="small"
                                  color={d.platform === "windows" ? "primary" : d.platform === "android" ? "success" : "default"} />
                              </TableCell>
                              <TableCell>{d.owner || "—"}</TableCell>
                              <TableCell><Chip label={d.violations} size="small" color="error" /></TableCell>
                              <TableCell>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <LinearProgress variant="determinate" value={d.compliance_score}
                                    color="error" sx={{ height: 6, borderRadius: 3, flex: 1 }} />
                                  <Typography variant="caption">{d.compliance_score}%</Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Button size="small" variant="outlined"
                                  onClick={() => navigate(`/devices/${d.id}`)}>View</Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ── TAB 2: COMPLIANCE ── */}
      {tab === 2 && (
        <Box>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: "Compliant", value: compliance.compliant, color: "success.main" },
              { label: "Warning", value: compliance.warning, color: "warning.main" },
              { label: "Non-Compliant", value: compliance.non_compliant, color: "error.main" },
              { label: "Compliance Rate", value: `${compliance.compliance_rate}%`,
                color: compliance.compliance_rate >= 80 ? "success.main" : compliance.compliance_rate >= 50 ? "warning.main" : "error.main" },
              { label: "Avg Score", value: `${compliance.avg_compliance_score}%`, color: "primary.main" },
              { label: "Total Evaluated", value: compliance.total_evaluated, color: "text.primary" },
            ].map((s, i) => (
              <Grid size={{ xs: 6, md: 2 }} key={i}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ textAlign: "center", py: 2, "&:last-child": { pb: 2 } }}>
                    <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: s.color }}>{s.value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <SectionHeader title="Compliance Breakdown" icon={<ShieldIcon color="success" />} />
                  {[
                    { label: "Compliant", value: compliance.compliant, total: compliance.total_evaluated, color: "success" },
                    { label: "Warning", value: compliance.warning, total: compliance.total_evaluated, color: "warning" },
                    { label: "Non-Compliant", value: compliance.non_compliant, total: compliance.total_evaluated, color: "error" },
                  ].map((s) => (
                    <Box key={s.label} sx={{ mb: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="body2">{s.label}</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {s.value} ({s.total > 0 ? Math.round(s.value / s.total * 100) : 0}%)
                        </Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={s.total > 0 ? s.value / s.total * 100 : 0}
                        color={s.color} sx={{ height: 10, borderRadius: 5 }} />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
              <Card sx={{ borderRadius: 2, height: "100%" }}>
                <CardContent>
                  <SectionHeader title="Overall Compliance Rate" icon={<TrendingUpIcon color="primary" />} />
                  <Box sx={{ display: "flex", alignItems: "center", gap: 4, mt: 2 }}>
                    <Box>
                      <LinearProgress variant="determinate" value={compliance.compliance_rate}
                        color={compliance.compliance_rate >= 80 ? "success" : compliance.compliance_rate >= 50 ? "warning" : "error"}
                        sx={{ height: 16, borderRadius: 8, width: 280, mb: 1 }} />
                      <Typography variant="h3" fontWeight="bold"
                        color={compliance.compliance_rate >= 80 ? "success.main" : compliance.compliance_rate >= 50 ? "warning.main" : "error.main"}>
                        {compliance.compliance_rate}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {compliance.compliant} of {compliance.total_evaluated} assignments fully compliant
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography variant="caption" color="text.secondary">Avg Compliance Score</Typography>
                      <Typography variant="h4" fontWeight="bold" color="primary.main">
                        {compliance.avg_compliance_score}%
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ── TAB 3: EXECUTIVE ── */}
      {tab === 3 && (
        <Box>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent sx={{ textAlign: "center", py: 4 }}>
                  <SectionHeader title="Overall Health Score" icon={<TrendingUpIcon color="primary" />} />
                  <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                    <HealthRing score={Math.round(executive.health_score)} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Weighted: 60% compliance + 40% deployment
                  </Typography>
                  <Chip sx={{ mt: 1 }}
                    label={executive.health_score >= 80 ? "Healthy" : executive.health_score >= 60 ? "Needs Attention" : "Critical"}
                    color={executive.health_score >= 80 ? "success" : executive.health_score >= 60 ? "warning" : "error"} />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <SectionHeader title="Policy Coverage" icon={<ShieldIcon color="primary" />} />
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="body2">Devices Covered</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {executive.devices_covered} / {executive.total_devices}
                      </Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={executive.policy_coverage_pct}
                      color={executive.policy_coverage_pct >= 80 ? "success" : "warning"}
                      sx={{ height: 12, borderRadius: 6 }} />
                    <Typography variant="h3" fontWeight="bold" color="primary.main" sx={{ mt: 1 }}>
                      {executive.policy_coverage_pct}%
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">Active Policies</Typography>
                    <Typography variant="body2" fontWeight="bold">{executive.active_policies}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Total Policies</Typography>
                    <Typography variant="body2" fontWeight="bold">{executive.total_policies}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <SectionHeader title="Actions Required" icon={<WarningAmberIcon color="warning" />} />
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {[
                      { label: "Failed Deployments", value: it_ops.deployment_failed,
                        color: it_ops.deployment_failed > 0 ? "error" : "success",
                        action: () => navigate("/policies/assignments") },
                      { label: "Pending Deployments", value: it_ops.deployment_pending,
                        color: it_ops.deployment_pending > 0 ? "warning" : "success",
                        action: () => navigate("/policies/assignments") },
                      { label: "Critical Violations", value: security.critical_violations,
                        color: security.critical_violations > 0 ? "error" : "success",
                        action: () => navigate("/devices") },
                      { label: "High-Risk Devices", value: executive.high_risk_devices,
                        color: executive.high_risk_devices > 0 ? "error" : "success",
                        action: () => navigate("/devices") },
                    ].map((item) => (
                      <Box key={item.label} sx={{ display: "flex", justifyContent: "space-between",
                        alignItems: "center", p: 1.5, borderRadius: 1, cursor: "pointer",
                        bgcolor: "action.hover", "&:hover": { opacity: 0.8 } }}
                        onClick={item.action}>
                        <Typography variant="body2">{item.label}</Typography>
                        <Chip label={item.value} size="small" color={item.color} />
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <SectionHeader title="Recent Activity" icon={<AssignmentIcon color="primary" />} />
                  {it_ops.recent_audit.length === 0 ? (
                    <Typography color="text.secondary" sx={{ py: 2 }}>No recent activity</Typography>
                  ) : (
                    <TableContainer component={Paper} elevation={0}
                      sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: "grey.50" }}>
                            {["Action", "Performed By", "Details", "Time"].map((h, i) => (
                              <TableCell key={i} sx={{ fontWeight: "bold" }}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {it_ops.recent_audit.map((log) => (
                            <TableRow key={log.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                              <TableCell>
                                <Chip label={log.action} size="small" color="primary" variant="outlined" />
                              </TableCell>
                              <TableCell>{log.admin}</TableCell>
                              <TableCell>
                                <Typography variant="caption" color="text.secondary">{log.details}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" color="text.secondary">
                                  {log.created_at ? new Date(log.created_at).toLocaleString() : "—"}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default PolicyDashboard;
