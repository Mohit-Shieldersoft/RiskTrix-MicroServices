import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Card, CardContent, Chip, CircularProgress,
  Button, Grid, Divider, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Paper, Tabs, Tab, Tooltip,
  IconButton, LinearProgress, Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import PendingIcon from "@mui/icons-material/Pending";
import ReplayIcon from "@mui/icons-material/Replay";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ShieldIcon from "@mui/icons-material/Shield";
import HistoryIcon from "@mui/icons-material/History";
import deviceApi from "../../utils/deviceApi";
import policyApi from "../../utils/policyApi";
import DeviceHeartbeatCard from "../../components/Security/DeviceHeartbeatCard";

// ── helpers ─────────────────────────────────────────────
const getPlatformColor = (p) => {
  switch (p) {
    case "windows": return "primary";
    case "android": return "success";
    case "ios": return "warning";
    case "macos": return "default";
    default: return "default";
  }
};

const getRiskColor = (r) => {
  switch (r) {
    case "critical": case "high": return "error";
    case "medium": return "warning";
    case "low": return "success";
    default: return "default";
  }
};

const getDeploymentColor = (s) => {
  switch (s) {
    case "success": return "success";
    case "failed": return "error";
    case "retrying": return "warning";
    default: return "warning";
  }
};

const getDeploymentIcon = (s) => {
  switch (s) {
    case "success": return <CheckCircleIcon fontSize="small" />;
    case "failed": return <ErrorIcon fontSize="small" />;
    case "retrying": return <ReplayIcon fontSize="small" />;
    default: return <PendingIcon fontSize="small" />;
  }
};

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

const SeverityChip = ({ severity }) => {
  const color = severity === "critical" ? "error" : severity === "high" ? "error" : severity === "medium" ? "warning" : "default";
  return <Chip label={severity} color={color} size="small" variant="outlined" />;
};

const CATEGORY_LABELS = {
  device_security: "Device Security",
  app_control: "App Control",
  network: "Network",
  os_update: "OS Update",
};

const InfoRow = ({ label, value }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.75 }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={500}>{value || "—"}</Typography>
  </Box>
);

// ── main component ───────────────────────────────────────
export default function DeviceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [violations, setViolations] = useState([]);
  const [activities, setActivities] = useState([]);
  const [conflicts, setConflicts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [retrying, setRetrying] = useState({});

  const fetchAll = useCallback(async () => {
    try {
      const dev = await deviceApi.getDeviceById(id);
      setDevice(dev);
      try {
        const pol = await policyApi.getDeviceById(id);
        setPolicies(pol?.assigned_policies || []);
      } catch { setPolicies([]); }
      try {
        const v = await policyApi.getDeviceViolations(id);
        setViolations(v || []);
      } catch { setViolations([]); }
      try {
        const a = await policyApi.getDeviceActivities(id);
        setActivities(a || []);
      } catch { setActivities([]); }
      try {
        const c = await policyApi.getDeviceConflicts(id);
        setConflicts(c);
      } catch { setConflicts(null); }
    } catch {
      setError("Device not found");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRetry = async (assignmentId, policyName) => {
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

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>
  );

  if (error || !device) return (
    <Box sx={{ textAlign: "center", mt: 10 }}>
      <Typography color="error">{error}</Typography>
      <Button sx={{ mt: 2 }} variant="outlined" onClick={() => navigate("/devices")}>Back to Devices</Button>
    </Box>
  );

  const successCount = policies.filter((p) => p.deployment_status === "success").length;
  const pendingCount = policies.filter((p) => p.deployment_status === "pending").length;
  const failedCount = policies.filter((p) => p.deployment_status === "failed").length;
  const compliantCount = policies.filter((p) => p.compliance_status === "compliant").length;
  const nonCompliantCount = policies.filter((p) => p.compliance_status === "non_compliant").length;
  const avgScore = policies.length
    ? Math.round(policies.reduce((sum, p) => sum + (p.compliance_score || 0), 0) / policies.length)
    : 0;

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: "auto" }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/devices")} sx={{ mb: 2 }}>
        Back to Devices
      </Button>

      {/* TITLE */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" fontWeight="bold">{device.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          {device.device_uid} · ID #{device.id} · Enrolled {new Date(device.created_at).toLocaleDateString()}
        </Typography>
      </Box>

      {/* STATUS CHIPS */}
      <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
        <Chip label={device.platform} color={getPlatformColor(device.platform)} />
        <Chip label={`Enrollment: ${device.enrollment_status}`} color={device.enrollment_status === "enrolled" ? "success" : "default"} />
        <Chip label={`Risk: ${device.risk_level}`} color={getRiskColor(device.risk_level)} />
        <Chip label={`Status: ${device.status}`} color={device.status === "active" ? "success" : "default"} />
        {violations.length > 0 && (
          <Chip icon={<WarningAmberIcon />} label={`${violations.length} Violations`} color="error" />
        )}
      </Box>

      {/* DEVICE HEALTH / HEARTBEAT */}
      <Box sx={{ mb: 3 }}>
        <DeviceHeartbeatCard deviceId={Number(id)} />
      </Box>

      {/* CONFLICT WARNING BANNER */}
      {conflicts && conflicts.conflicting_pairs > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate("/policies/conflicts")}
            >
              View Report
            </Button>
          }
        >
          <strong>Policy Conflict Detected:</strong> {conflicts.conflicting_pairs} conflicting policy
          pair{conflicts.conflicting_pairs !== 1 ? "s" : ""} found on this device.{" "}
          {conflicts.conflicts.slice(0, 2).map((p, i) => (
            <span key={i}>
              <em>{p.policy_a_name}</em> vs <em>{p.policy_b_name}</em>
              {i < Math.min(conflicts.conflicts.length, 2) - 1 ? "; " : ""}
            </span>
          ))}
          {conflicts.conflicts.length > 2 && ` and ${conflicts.conflicts.length - 2} more.`}
        </Alert>
      )}

      {/* IDENTITY + OWNERSHIP CARDS */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 2, height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Identity</Typography>
              <Divider sx={{ mb: 1.5 }} />
              <InfoRow label="Device UID" value={device.device_uid} />
              <InfoRow label="Serial Number" value={device.serial_number} />
              <InfoRow label="Model" value={device.device_model} />
              <InfoRow label="Manufacturer" value={device.manufacturer} />
              <InfoRow label="MAC Address" value={device.mac_address} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 2, height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Ownership</Typography>
              <Divider sx={{ mb: 1.5 }} />
              <InfoRow label="Owner" value={device.owner} />
              <InfoRow label="Department" value={device.department} />
              <InfoRow label="OS Version" value={device.os_version} />
              <InfoRow label="Last Seen" value={device.last_seen ? new Date(device.last_seen).toLocaleString() : null} />
              <InfoRow label="Created At" value={new Date(device.created_at).toLocaleString()} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* POLICY SUMMARY STATS */}
      {policies.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: "Policies Assigned", value: policies.length, color: "text.primary" },
            { label: "Successful", value: successCount, color: "success.main" },
            { label: "Failed", value: failedCount, color: "error.main" },
            { label: "Pending", value: pendingCount, color: "warning.main" },
            { label: "Compliant", value: compliantCount, color: "success.main" },
            { label: "Non-Compliant", value: nonCompliantCount, color: "error.main" },
          ].map((item, i) => (
            <Grid size={{ xs: 6, md: 2 }} key={i}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent sx={{ textAlign: "center", py: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: item.color }}>{item.value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* COMPLIANCE SCORE BAR */}
      {policies.length > 0 && (
        <Card sx={{ borderRadius: 2, mb: 3 }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                <ShieldIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: "middle" }} />
                Average Compliance Score
              </Typography>
              <Typography variant="subtitle2" fontWeight="bold" color={avgScore >= 80 ? "success.main" : avgScore >= 50 ? "warning.main" : "error.main"}>
                {avgScore}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={avgScore}
              color={avgScore >= 80 ? "success" : avgScore >= 50 ? "warning" : "error"}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </CardContent>
        </Card>
      )}

      {/* TABS */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`Assigned Policies (${policies.length})`} />
        <Tab
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              Violations
              {violations.length > 0 && (
                <Chip label={violations.length} color="error" size="small" sx={{ height: 18, fontSize: "0.7rem" }} />
              )}
            </Box>
          }
        />
        <Tab label={`Activity (${activities.length})`} />
      </Tabs>

      {/* ── TAB 0: ASSIGNED POLICIES ── */}
      {tab === 0 && (
        policies.length === 0 ? (
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: "center", py: 4 }}>
              <Typography color="text.secondary">No policies assigned to this device</Typography>
              <Button sx={{ mt: 2 }} variant="outlined" onClick={() => navigate("/policies")}>
                Go to Policy Management
              </Button>
            </CardContent>
          </Card>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.50" }}>
                  <TableCell sx={{ fontWeight: "bold" }}>Policy Name</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Deployment</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Compliance</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Message</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Assigned</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {policies.map((pol) => (
                  <TableRow key={pol.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 500 }}>{pol.name}</TableCell>
                    <TableCell>{CATEGORY_LABELS[pol.category] || pol.category}</TableCell>
                    <TableCell>
                      <Chip
                        icon={getDeploymentIcon(pol.deployment_status)}
                        label={pol.deployment_status}
                        color={getDeploymentColor(pol.deployment_status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <ComplianceChip status={pol.compliance_status} score={pol.compliance_score} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 200, display: "block" }}>
                        {pol.deployment_message || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(pol.assigned_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {(pol.deployment_status === "failed" || pol.deployment_status === "pending") && (
                        <Tooltip title="Retry Deployment">
                          <IconButton
                            size="small"
                            color="primary"
                            disabled={!!retrying[pol.assignment_id]}
                            onClick={() => handleRetry(pol.assignment_id, pol.name)}
                          >
                            {retrying[pol.assignment_id]
                              ? <CircularProgress size={14} />
                              : <ReplayIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}

      {/* ── TAB 1: VIOLATIONS ── */}
      {tab === 1 && (
        violations.length === 0 ? (
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: "center", py: 4 }}>
              <CheckCircleIcon sx={{ fontSize: 48, color: "success.main", mb: 1 }} />
              <Typography color="success.main" fontWeight={600}>No active violations</Typography>
            </CardContent>
          </Card>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "error.light", borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "error.50" }}>
                  <TableCell sx={{ fontWeight: "bold" }}>Violation Type</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Severity</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Detected At</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {violations.map((v) => (
                  <TableRow key={v.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500} sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                        {v.violation_type}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{v.description}</Typography>
                    </TableCell>
                    <TableCell><SeverityChip severity={v.severity} /></TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(v.detected_at).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={v.resolved ? "Resolved" : "Active"}
                        color={v.resolved ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}

      {/* ── TAB 2: ACTIVITY ── */}
      {tab === 2 && (
        activities.length === 0 ? (
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: "center", py: 4 }}>
              <Typography color="text.secondary">No activity recorded yet</Typography>
            </CardContent>
          </Card>
        ) : (
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 0 }}>
              {activities.map((a, i) => (
                <Box
                  key={a.id}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 2,
                    px: 2,
                    py: 1.5,
                    borderBottom: i < activities.length - 1 ? "1px solid" : "none",
                    borderColor: "divider",
                  }}
                >
                  <Box sx={{ minWidth: 8, height: 8, borderRadius: "50%", bgcolor: "primary.main", mt: 0.7 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2">{a.message}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {a.event_type} · {new Date(a.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        )
      )}
    </Box>
  );
}