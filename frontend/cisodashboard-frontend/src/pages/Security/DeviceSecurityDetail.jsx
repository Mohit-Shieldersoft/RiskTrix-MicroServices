import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import RefreshIcon from "@mui/icons-material/Refresh";
import ShieldIcon from "@mui/icons-material/Shield";
import GppBadIcon from "@mui/icons-material/GppBad";
import BuildIcon from "@mui/icons-material/Build";
import RemoteActionsPanel from "../../components/Security/RemoteActionsPanel";
import securityApi from "../../utils/securityApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

const SEVERITY_COLORS = {
  critical: "#d32f2f",
  high: "#f57c00",
  medium: "#fbc02d",
  low: "#388e3c",
};

const RISK_COLOR = {
  critical: "#d32f2f",
  high: "#f57c00",
  medium: "#fbc02d",
  low: "#388e3c",
  unknown: "#9e9e9e",
};

const RISK_MUI = {
  critical: "error",
  high: "warning",
  medium: "info",
  low: "success",
};

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

function FlagRow({ label, value, good, bad }) {
  const isGood = value === good;
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        py: 1,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography variant="body2">{label}</Typography>
      <Chip
        label={isGood ? "OK" : "FAIL"}
        size="small"
        color={isGood ? "success" : "error"}
        sx={{ fontWeight: "bold", minWidth: 56 }}
      />
    </Box>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DeviceSecurityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [alertUpdating, setAlertUpdating] = useState(null);
  const [remediation, setRemediation] = useState([]);
  const [newAction, setNewAction] = useState({ action_type: "manual_fix", notes: "", performed_by: "admin" });
  const [submittingAction, setSubmittingAction] = useState(false);

  const load = async () => {
    try {
      const [d, r] = await Promise.all([
        securityApi.getDeviceSecurity(id),
        securityApi.getRemediation(id),
      ]);
      setData(d);
      setRemediation(r || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      await securityApi.evaluateDevice(id);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setEvaluating(false);
    }
  };

  const handleAlertStatus = async (alertId, newStatus) => {
    setAlertUpdating(alertId);
    try {
      await securityApi.updateAlertStatus(alertId, newStatus);
      setData((prev) => ({
        ...prev,
        alerts: prev.alerts.map((a) =>
          a.id === alertId ? { ...a, status: newStatus } : a
        ),
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setAlertUpdating(null);
    }
  };

  const handleCreateRemediation = async () => {
    setSubmittingAction(true);
    try {
      const created = await securityApi.createRemediation(id, newAction);
      setRemediation((prev) => [created, ...prev]);
      setNewAction({ action_type: "manual_fix", notes: "", performed_by: "admin" });
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRemediationStatus = async (actionId, status) => {
    try {
      const updated = await securityApi.updateRemediationStatus(actionId, status);
      setRemediation((prev) =>
        prev.map((a) => (a.id === actionId ? { ...a, ...updated } : a))
      );
    } catch (e) {
      console.error(e);
    }
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );

  if (!data)
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Device security data not found.</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/security")} sx={{ mt: 1 }}>
          Back to Security Dashboard
        </Button>
      </Box>
    );

  const { profile, alerts } = data;
  const riskColor = RISK_COLOR[profile?.risk_level] || "#9e9e9e";

  return (
    <Box sx={{ p: 3 }}>
      {/* ── Header ──────────────────────────────────────────── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate("/security")}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight="bold">
            {data.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data.device_uid} · {data.platform} · {data.owner}
            {data.department ? ` · ${data.department}` : ""}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={evaluating ? <CircularProgress size={16} /> : <RefreshIcon />}
          disabled={evaluating}
          onClick={handleEvaluate}
        >
          {evaluating ? "Evaluating…" : "Re-evaluate"}
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* ── Risk Score Card ─────────────────────────────── */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 2, height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <GppBadIcon sx={{ color: riskColor }} />
                <Typography variant="h6" fontWeight="bold">Risk Score</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 1 }}>
                <Typography variant="h2" fontWeight="bold" sx={{ color: riskColor }}>
                  {profile?.risk_score ?? 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">/ 120</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, ((profile?.risk_score ?? 0) / 120) * 100)}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  mb: 1.5,
                  bgcolor: "#f0f0f0",
                  "& .MuiLinearProgress-bar": { bgcolor: riskColor, borderRadius: 5 },
                }}
              />
              <Chip
                label={(profile?.risk_level ?? "unknown").toUpperCase()}
                color={RISK_MUI[profile?.risk_level] || "default"}
                sx={{ fontWeight: "bold" }}
              />
              {profile?.last_evaluated_at && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  Last evaluated: {new Date(profile.last_evaluated_at).toLocaleString()}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Security Flags ──────────────────────────────── */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 2, height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <ShieldIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">Security Flags</Typography>
              </Box>
              <FlagRow label="Root / Jailbreak" value={profile?.is_rooted} good={false} bad={true} />
              <FlagRow label="Encryption" value={profile?.encryption_enabled} good={true} bad={false} />
              <FlagRow label="Screen Lock" value={profile?.screen_lock_enabled} good={true} bad={false} />
              <FlagRow label="OS Up-to-date" value={!profile?.os_outdated} good={true} bad={false} />
              <FlagRow label="No Blacklisted Apps" value={!profile?.blacklisted_app_detected} good={true} bad={false} />
            </CardContent>
          </Card>
        </Grid>

        {/* ── Open Alerts Summary ─────────────────────────── */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 2, height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <WarningAmberIcon color="warning" />
                <Typography variant="h6" fontWeight="bold">Alert Summary</Typography>
              </Box>
              {["critical", "high", "medium", "low"].map((sev) => {
                const count = alerts.filter((a) => a.severity === sev && a.status === "open").length;
                return (
                  <Box key={sev} sx={{ display: "flex", justifyContent: "space-between", mb: 0.8 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <SeverityDot severity={sev} />
                      <Typography variant="body2" sx={{ textTransform: "capitalize" }}>{sev}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="bold">{count}</Typography>
                  </Box>
                );
              })}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">Total open</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {alerts.filter((a) => a.status === "open").length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Alerts Table ────────────────────────────────────── */}
      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Security Alerts for this Device
          </Typography>
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: "bold" } }}>
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
                    <TableCell colSpan={6} align="center" sx={{ color: "text.secondary", py: 3 }}>
                      No alerts for this device
                    </TableCell>
                  </TableRow>
                ) : (
                  alerts.map((alert) => (
                    <TableRow key={alert.id} hover>
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
                        {alert.status === "open" && (
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
                                  disabled={alertUpdating === alert.id}
                                  onClick={() => handleAlertStatus(alert.id, "suppressed")}
                                >
                                  <VisibilityOffIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        )}
                        {alert.status !== "open" && (
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

      {/* ── Remediation Tracking ─────────────────────────────── */}
      <Card sx={{ borderRadius: 2, mt: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <BuildIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">Remediation Actions</Typography>
          </Box>

          {/* New action form */}
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "flex-end" }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Action Type</InputLabel>
              <Select
                value={newAction.action_type}
                label="Action Type"
                onChange={(e) => setNewAction((p) => ({ ...p, action_type: e.target.value }))}
              >
                <MenuItem value="manual_fix">Manual Fix</MenuItem>
                <MenuItem value="policy_push">Policy Push</MenuItem>
                <MenuItem value="lock">Remote Lock</MenuItem>
                <MenuItem value="wipe">Remote Wipe</MenuItem>
                <MenuItem value="note">Note Only</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Notes"
              value={newAction.notes}
              onChange={(e) => setNewAction((p) => ({ ...p, notes: e.target.value }))}
              sx={{ flex: 1, minWidth: 200 }}
            />
            <TextField
              size="small"
              label="Performed By"
              value={newAction.performed_by}
              onChange={(e) => setNewAction((p) => ({ ...p, performed_by: e.target.value }))}
              sx={{ width: 140 }}
            />
            <Button
              variant="contained"
              size="small"
              disabled={submittingAction}
              startIcon={submittingAction ? <CircularProgress size={14} color="inherit" /> : <BuildIcon />}
              onClick={handleCreateRemediation}
            >
              Log Action
            </Button>
          </Box>

          {/* Actions table */}
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: "bold" } }}>
                  <TableCell>Action Type</TableCell>
                  <TableCell>Performed By</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Completed</TableCell>
                  <TableCell align="center">Update</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {remediation.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ color: "text.secondary", py: 3 }}>
                      No remediation actions logged
                    </TableCell>
                  </TableRow>
                ) : (
                  remediation.map((a) => (
                    <TableRow key={a.id} hover>
                      <TableCell>
                        <Chip label={a.action_type} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{a.performed_by}</TableCell>
                      <TableCell>
                        <Typography variant="caption">{a.notes || "—"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={a.status}
                          size="small"
                          color={
                            a.status === "completed" ? "success" :
                            a.status === "in_progress" ? "info" :
                            a.status === "failed" ? "error" : "default"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(a.created_at).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {a.completed_at ? new Date(a.completed_at).toLocaleString() : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {a.status !== "completed" && a.status !== "failed" && (
                          <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                            {a.status === "pending" && (
                              <Tooltip title="Mark In Progress">
                                <IconButton size="small" color="info" onClick={() => handleRemediationStatus(a.id, "in_progress")}>
                                  <RefreshIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Mark Completed">
                              <IconButton size="small" color="success" onClick={() => handleRemediationStatus(a.id, "completed")}>
                                <CheckCircleOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Mark Failed">
                              <IconButton size="small" color="error" onClick={() => handleRemediationStatus(a.id, "failed")}>
                                <WarningAmberIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
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

      {/* ── Remote Actions Panel ─────────────────────────── */}
      <RemoteActionsPanel deviceId={id} />

    </Box>
  );
}
