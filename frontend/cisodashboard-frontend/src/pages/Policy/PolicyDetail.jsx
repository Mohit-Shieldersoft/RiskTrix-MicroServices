import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Card, CardContent, Chip, CircularProgress,
  Button, Grid, Divider, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Paper, LinearProgress, Tooltip,
  IconButton, Tabs, Tab,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DevicesIcon from "@mui/icons-material/Devices";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ErrorIcon from "@mui/icons-material/Error";
import PendingIcon from "@mui/icons-material/Pending";
import ReplayIcon from "@mui/icons-material/Replay";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ShieldIcon from "@mui/icons-material/Shield";
import DeleteIcon from "@mui/icons-material/Delete";
import policyApi from "../../utils/policyApi";

// ── helpers ─────────────────────────────────────────────
const ControlRow = ({ label, value }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5 }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    {typeof value === "boolean" ? (
      value
        ? <CheckCircleIcon color="success" fontSize="small" />
        : <CancelIcon color="disabled" fontSize="small" />
    ) : (
      <Typography variant="body2" fontWeight={500}>{value || "—"}</Typography>
    )}
  </Box>
);

const ComplianceChip = ({ status, score }) => {
  if (status === "compliant") return (
    <Chip icon={<CheckCircleIcon />} label={`Compliant${score != null ? ` · ${score}%` : ""}`} color="success" size="small" />
  );
  if (status === "warning") return (
    <Chip icon={<WarningAmberIcon />} label={`Warning${score != null ? ` · ${score}%` : ""}`} color="warning" size="small" />
  );
  if (status === "non_compliant") return (
    <Chip icon={<ErrorIcon />} label={`Non-Compliant${score != null ? ` · ${score}%` : ""}`} color="error" size="small" />
  );
  return <Chip label="Unknown" color="default" size="small" />;
};

const getDeployColor = (s) => {
  switch (s) {
    case "success": return "success";
    case "failed": return "error";
    case "retrying": return "warning";
    default: return "warning";
  }
};

const getDeployIcon = (s) => {
  switch (s) {
    case "success": return <CheckCircleIcon fontSize="small" />;
    case "failed": return <ErrorIcon fontSize="small" />;
    case "retrying": return <ReplayIcon fontSize="small" />;
    default: return <PendingIcon fontSize="small" />;
  }
};

const PLATFORM_MAP = { all: "All Platforms", android: "Android", windows: "Windows", ios: "iOS", macos: "macOS" };
const CATEGORY_MAP = { device_security: "Device Security", app_control: "App Control", network: "Network", os_update: "OS Update" };

// ── main component ───────────────────────────────────────
export default function PolicyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [policy, setPolicy] = useState(null);
  const [settings, setSettings] = useState(null);
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [retrying, setRetrying] = useState({});
  const [removing, setRemoving] = useState({});

  const fetchAll = useCallback(async () => {
    try {
      const details = await policyApi.getPolicyDetails(id);
      setPolicy(details);
      setSettings(details.settings || {});
      setDevices(details.assigned_devices || []);
      setStats(details.stats || null);
    } catch {
      setError("Policy not found");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRetry = async (assignmentId) => {
    setRetrying((prev) => ({ ...prev, [assignmentId]: true }));
    try {
      await policyApi.retryAssignment(assignmentId);
      await fetchAll();
    } catch (err) {
      console.error("Retry failed", err);
    } finally {
      setRetrying((prev) => ({ ...prev, [assignmentId]: false }));
    }
  };

  const handleRemove = async (assignmentId, deviceName) => {
    if (!window.confirm(`Remove policy from "${deviceName}"?`)) return;
    setRemoving((prev) => ({ ...prev, [assignmentId]: true }));
    try {
      await policyApi.deleteAssignment(assignmentId);
      await fetchAll();
    } catch (err) {
      console.error("Remove failed", err);
    } finally {
      setRemoving((prev) => ({ ...prev, [assignmentId]: false }));
    }
  };

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>
  );

  if (error || !policy) return (
    <Box sx={{ textAlign: "center", mt: 10 }}>
      <Typography color="error">{error}</Typography>
      <Button sx={{ mt: 2 }} variant="outlined" onClick={() => navigate("/policies")}>Back to Policies</Button>
    </Box>
  );

  const assignedDevices = devices;
  const successPct = stats?.deployment_rate ?? 0;
  const compliantPct = stats?.compliance_rate ?? 0;

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: "auto" }}>
      {/* HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/policies")}>
          Back to Policies
        </Button>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button startIcon={<DevicesIcon />} variant="outlined" onClick={() => navigate(`/policies/${id}/apply`)}>
            Apply to Devices
          </Button>
          <Button startIcon={<EditIcon />} variant="contained" onClick={() => navigate(`/policies/${id}/edit`)}>
            Edit Policy
          </Button>
        </Box>
      </Box>

      {/* TITLE */}
      <Typography variant="h4" fontWeight="bold">{policy.name}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Policy #{policy.id} · {CATEGORY_MAP[policy.category] || policy.category} · Created {new Date(policy.created_at).toLocaleDateString()}
      </Typography>

      {/* TOP CARDS */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Status", node: <Chip label={policy.status} color={policy.status === "active" ? "success" : "warning"} /> },
          { label: "Platform", node: <Typography variant="h6">{PLATFORM_MAP[policy.platform] || policy.platform}</Typography> },
          { label: "Category", node: <Typography variant="h6">{CATEGORY_MAP[policy.category] || policy.category}</Typography> },
      { label: "Devices Assigned", node: <Typography variant="h4" fontWeight="bold">{stats?.total_assignments ?? 0}</Typography> },
          { label: "Avg Compliance", node: <Typography variant="h4" fontWeight="bold" color="primary.main">{stats?.avg_compliance_score ?? 0}%</Typography> },
        ].map((item, i) => (
          <Grid size={{ xs: 6, md: 3 }} key={i}>
            <Card sx={{ borderRadius: 2, textAlign: "center" }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                <Box sx={{ mt: 0.5 }}>{item.node}</Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* DEPLOYMENT STATS */}
      {stats && stats.total_assignments > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: "Successful", value: stats.deployment_success, color: "success.main" },
            { label: "Failed", value: stats.deployment_failed, color: "error.main" },
            { label: "Pending", value: stats.deployment_pending, color: "warning.main" },
            { label: "Compliant", value: stats.compliant || 0, color: "success.main" },
            { label: "Non-Compliant", value: stats.non_compliant || 0, color: "error.main" },
            { label: "Deploy Rate", value: `${stats.deployment_rate}%`, color: stats.deployment_rate >= 80 ? "success.main" : "error.main" },
          ].map((s, i) => (
            <Grid size={{ xs: 6, md: 2 }} key={i}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent sx={{ textAlign: "center", py: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: s.color }}>{s.value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* DEPLOYMENT + COMPLIANCE BARS */}
      {stats && stats.total_assignments > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">Deployment Success Rate</Typography>
                  <Typography variant="subtitle2" fontWeight="bold" color="success.main">{successPct}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={successPct} color="success" sx={{ height: 8, borderRadius: 4 }} />
                <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">{stats.deployment_success} success</Typography>
                  <Typography variant="caption" color="text.secondary">{stats.deployment_failed} failed</Typography>
                  <Typography variant="caption" color="text.secondary">{stats.deployment_pending} pending</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    <ShieldIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: "middle" }} />
                    Compliance Rate
                  </Typography>
                  <Typography variant="subtitle2" fontWeight="bold"
                    color={compliantPct >= 80 ? "success.main" : compliantPct >= 50 ? "warning.main" : "error.main"}>
                    {compliantPct}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={compliantPct}
                  color={compliantPct >= 80 ? "success" : compliantPct >= 50 ? "warning" : "error"}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">{stats.compliant || 0} compliant</Typography>
                  <Typography variant="caption" color="text.secondary">{stats.non_compliant || 0} non-compliant</Typography>
                  <Typography variant="caption" color="text.secondary">avg {stats.avg_compliance_score}%</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* TABS */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`Assigned Devices (${assignedDevices.length})`} />
        <Tab label="Policy Rules" />
      </Tabs>

      {/* ── TAB 0: ASSIGNED DEVICES ── */}
      {tab === 0 && (
        assignedDevices.length === 0 ? (
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: "center", py: 4 }}>
              <Typography color="text.secondary">No devices assigned yet</Typography>
              <Button sx={{ mt: 2 }} variant="outlined" onClick={() => navigate(`/policies/${id}/apply`)}>
                Apply to Devices
              </Button>
            </CardContent>
          </Card>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.50" }}>
                  <TableCell sx={{ fontWeight: "bold" }}>Device</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Platform</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Owner</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Deployment</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Compliance</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Message</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignedDevices.map((d) => (
                  <TableRow key={d.device_id ?? d.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 500 }}>
                      <Button size="small" variant="text" sx={{ textTransform: "none", p: 0, fontWeight: 500 }}
                        onClick={() => navigate(`/devices/${d.device_id ?? d.id}`)}
                      >{d.device_name ?? d.name}</Button>
                    </TableCell>
                    <TableCell>
                      <Chip label={d.platform} size="small" color={
                        d.platform === "windows" ? "primary" :
                        d.platform === "android" ? "success" :
                        d.platform === "ios" ? "warning" : "default"
                      } />
                    </TableCell>
                    <TableCell>{d.owner || "—"}</TableCell>
                    <TableCell>
                      <Chip
                        icon={getDeployIcon(d.deployment_status)}
                        label={d.deployment_status}
                        color={getDeployColor(d.deployment_status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <ComplianceChip status={d.compliance_status} score={d.compliance_score} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {d.deployment_message || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        {(d.deployment_status === "failed" || d.deployment_status === "pending") && d.assignment_id && (
                          <Tooltip title="Retry Deployment">
                            <IconButton
                              size="small"
                              color="primary"
                              disabled={!!retrying[d.assignment_id]}
                              onClick={() => handleRetry(d.assignment_id)}
                            >
                              {retrying[d.assignment_id]
                                ? <CircularProgress size={14} />
                                : <ReplayIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="View Device">
                          <IconButton size="small" onClick={() => navigate(`/devices/${d.device_id ?? d.id}`)}>
                            <DevicesIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {d.assignment_id && (
                          <Tooltip title="Remove from policy">
                            <IconButton
                              size="small"
                              color="error"
                              disabled={!!removing[d.assignment_id]}
                              onClick={() => handleRemove(d.assignment_id, d.device_name ?? d.name)}
                            >
                              {removing[d.assignment_id]
                                ? <CircularProgress size={14} />
                                : <DeleteIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}

      {/* ── TAB 1: POLICY RULES ── */}
      {tab === 1 && (
        <Grid container spacing={2}>
          {policy.description && (
            <Grid size={{ xs: 12 }}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>{policy.description}</Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: 2, height: "100%" }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Device Security</Typography>
                <Divider sx={{ mb: 1 }} />
                <ControlRow label="Require Screen Lock" value={settings?.require_screen_lock ?? policy.require_screen_lock} />
                <Divider />
                <ControlRow label="Password Complexity" value={settings?.password_complexity ?? policy.password_complexity} />
                <Divider />
                <ControlRow label="Encryption Required" value={settings?.encryption_required ?? policy.encryption_required} />
                <Divider />
                <ControlRow label="Min Password Length" value={(settings?.min_password_length ?? policy.min_password_length) > 0 ? String(settings?.min_password_length ?? policy.min_password_length) : "Not set"} />
                <Divider />
                <ControlRow label="Password Expiry" value={(settings?.password_expiry_days ?? policy.password_expiry_days) > 0 ? `${settings?.password_expiry_days ?? policy.password_expiry_days} days` : "Not set"} />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: 2, height: "100%" }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Connectivity</Typography>
                <Divider sx={{ mb: 1 }} />
                <ControlRow label="Bluetooth Disabled" value={settings?.bluetooth_disabled ?? policy.bluetooth_disabled} />
                <Divider />
                <ControlRow label="USB Disabled" value={settings?.usb_disabled ?? policy.usb_disabled} />
                <Divider />
                <ControlRow label="Wi-Fi Restricted" value={settings?.wifi_restricted ?? policy.wifi_restricted} />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: 2, height: "100%" }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>OS Update</Typography>
                <Divider sx={{ mb: 1 }} />
                <ControlRow label="OS Update Required" value={settings?.os_update_required ?? policy.os_update_required} />
                <Divider />
                <ControlRow label="Min OS Version" value={(settings?.min_os_version ?? policy.min_os_version) || "Not set"} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}