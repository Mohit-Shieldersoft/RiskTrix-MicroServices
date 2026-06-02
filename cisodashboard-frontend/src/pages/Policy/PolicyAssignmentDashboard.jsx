import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Card, CardContent, Grid, Chip, CircularProgress,
  Button, LinearProgress, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Paper, Divider, Alert, IconButton, Tooltip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import PendingIcon from "@mui/icons-material/Pending";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ShieldIcon from "@mui/icons-material/Shield";
import AssignmentIcon from "@mui/icons-material/Assignment";
import RefreshIcon from "@mui/icons-material/Refresh";
import DevicesIcon from "@mui/icons-material/Devices";
import PolicyIcon from "@mui/icons-material/Policy";
import policyApi from "../../utils/policyApi";

const ACTION_COLORS = {
  assign_policy: "primary",
  unassign_policy: "default",
  retry_deployment: "warning",
  update_policy: "info",
  create_policy: "success",
  delete_policy: "error",
};

const ACTION_LABELS = {
  assign_policy: "Assigned",
  unassign_policy: "Unassigned",
  retry_deployment: "Retry",
  update_policy: "Updated",
  create_policy: "Created",
  delete_policy: "Deleted",
};

export default function PolicyAssignmentDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [st, logs] = await Promise.all([
        policyApi.getDeploymentStats(),
        policyApi.getAuditLogs(),
      ]);
      setStats(st);
      setAuditLogs(Array.isArray(logs) ? logs : []);
    } catch (err) {
      setError("Failed to load assignment data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const total = stats?.total_assignments ?? 0;
  const successPct = total ? Math.round(((stats.successful ?? 0) / total) * 100) : 0;
  const compliantPct = total ? Math.round(((stats.compliant ?? 0) / total) * 100) : 0;

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: "auto" }}>
      {/* HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Policy Assignments</Typography>
          <Typography variant="body2" color="text.secondary">
            Global deployment status and audit log
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchAll} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<PolicyIcon />} onClick={() => navigate("/policies")}>
            Manage Policies
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} action={
          <Button size="small" onClick={fetchAll}>Retry</Button>
        }>{error}</Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* STAT CARDS */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: "Total Assignments", value: total, icon: <AssignmentIcon />, color: "primary.main" },
              { label: "Successful", value: stats?.successful ?? 0, icon: <CheckCircleIcon />, color: "success.main" },
              { label: "Failed", value: stats?.failed ?? 0, icon: <ErrorIcon />, color: "error.main" },
              { label: "Pending", value: stats?.pending ?? 0, icon: <PendingIcon />, color: "warning.main" },
              { label: "Compliant", value: stats?.compliant ?? 0, icon: <ShieldIcon />, color: "success.main" },
              { label: "Non-Compliant", value: stats?.non_compliant ?? 0, icon: <WarningAmberIcon />, color: "error.main" },
            ].map((s, i) => (
              <Grid size={{ xs: 6, md: 2 }} key={i}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ textAlign: "center", py: 2, "&:last-child": { pb: 2 } }}>
                    <Box sx={{ color: s.color, mb: 0.5 }}>{s.icon}</Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {s.label}
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: s.color }}>
                      {s.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* PROGRESS BARS */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      <CheckCircleIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: "middle", color: "success.main" }} />
                      Deployment Success Rate
                    </Typography>
                    <Typography variant="subtitle2" fontWeight="bold" color="success.main">
                      {successPct}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={successPct}
                    color="success"
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                  <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">{stats?.successful ?? 0} successful</Typography>
                    <Typography variant="caption" color="text.secondary">{stats?.failed ?? 0} failed</Typography>
                    <Typography variant="caption" color="text.secondary">{stats?.pending ?? 0} pending</Typography>
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
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      color={compliantPct >= 80 ? "success.main" : compliantPct >= 50 ? "warning.main" : "error.main"}
                    >
                      {compliantPct}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={compliantPct}
                    color={compliantPct >= 80 ? "success" : compliantPct >= 50 ? "warning" : "error"}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                  <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">{stats?.compliant ?? 0} compliant</Typography>
                    <Typography variant="caption" color="text.secondary">{stats?.non_compliant ?? 0} non-compliant</Typography>
                    <Typography variant="caption" color="text.secondary">{stats?.warning ?? 0} warning</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* AUDIT LOG TABLE */}
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ pb: "8px !important" }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                Audit Log
              </Typography>
              {auditLogs.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography color="text.secondary">No audit events recorded yet</Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "grey.50" }}>
                        <TableCell sx={{ fontWeight: "bold" }}>Action</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Policy</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Device</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Performed By</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Details</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow key={log.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                          <TableCell>
                            <Chip
                              label={ACTION_LABELS[log.action] ?? log.action}
                              color={ACTION_COLORS[log.action] ?? "default"}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {log.policy_id ? (
                              <Button
                                size="small"
                                variant="text"
                                startIcon={<PolicyIcon fontSize="small" />}
                                onClick={() => navigate(`/policies/${log.policy_id}`)}
                                sx={{ textTransform: "none", p: 0, minWidth: 0 }}
                              >
                                Policy #{log.policy_id}
                              </Button>
                            ) : "—"}
                          </TableCell>
                          <TableCell>
                            {log.device_id ? (
                              <Button
                                size="small"
                                variant="text"
                                startIcon={<DevicesIcon fontSize="small" />}
                                onClick={() => navigate(`/devices/${log.device_id}`)}
                                sx={{ textTransform: "none", p: 0, minWidth: 0 }}
                              >
                                Device #{log.device_id}
                              </Button>
                            ) : "—"}
                          </TableCell>
                          <TableCell>{log.performed_by || "system"}</TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {log.details || "—"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {log.created_at
                                ? new Date(log.created_at).toLocaleString()
                                : "—"}
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
        </>
      )}
    </Box>
  );
}
