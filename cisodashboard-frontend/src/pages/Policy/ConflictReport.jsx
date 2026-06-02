import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Card, CardContent, Grid, CircularProgress,
  Alert, Button, Chip, IconButton, Tooltip, Collapse,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Paper, Divider, LinearProgress,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DevicesIcon from "@mui/icons-material/Devices";
import PolicyIcon from "@mui/icons-material/Policy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import policyApi from "../../utils/policyApi";

const SEVERITY_COLOR = { high: "error", medium: "warning", low: "info" };

// ── Expandable Device Conflict Row ────────────────────────
const DeviceConflictCard = ({ device }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const maxSeverity = device.conflicts.some((p) =>
    p.fields.some((f) => f.severity === "high")
  )
    ? "high"
    : "medium";

  return (
    <Card
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: maxSeverity === "high" ? "error.light" : "warning.light",
        mb: 2,
      }}
    >
      <CardContent sx={{ pb: "12px !important" }}>
        {/* Device header row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <DevicesIcon color={maxSeverity === "high" ? "error" : "warning"} />
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                onClick={() => navigate(`/devices/${device.device_id}`)}
              >
                {device.device_name}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 0.25 }}>
                <Chip label={device.device_platform} size="small" color="default" />
                <Chip
                  label={`${device.conflicting_pairs} conflict pair${device.conflicting_pairs !== 1 ? "s" : ""}`}
                  size="small"
                  color={maxSeverity === "high" ? "error" : "warning"}
                />
              </Box>
            </Box>
          </Box>
          <Tooltip title={expanded ? "Collapse" : "Expand"}>
            <IconButton size="small" onClick={() => setExpanded((v) => !v)}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Expanded: conflict pairs */}
        <Collapse in={expanded}>
          <Divider sx={{ my: 1.5 }} />
          {device.conflicts.map((pair, pi) => (
            <Box
              key={pi}
              sx={{
                mb: 2,
                p: 1.5,
                borderRadius: 1,
                bgcolor: "action.hover",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              {/* Policy pair header */}
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1 }}>
                <PolicyIcon fontSize="small" color="primary" />
                <Button
                  size="small"
                  variant="text"
                  sx={{ textTransform: "none", p: 0, fontWeight: "bold" }}
                  onClick={() => navigate(`/policies/${pair.policy_a_id}`)}
                >
                  {pair.policy_a_name}
                </Button>
                <Typography variant="body2" color="text.secondary">vs</Typography>
                <Button
                  size="small"
                  variant="text"
                  sx={{ textTransform: "none", p: 0, fontWeight: "bold" }}
                  onClick={() => navigate(`/policies/${pair.policy_b_id}`)}
                >
                  {pair.policy_b_name}
                </Button>
                <Chip
                  label={`${pair.conflict_count} field${pair.conflict_count !== 1 ? "s" : ""}`}
                  size="small"
                  color="default"
                />
              </Box>

              {/* Individual field conflicts */}
              <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 1 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "grey.100" }}>
                      <TableCell sx={{ fontWeight: "bold" }}>Field</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Severity</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pair.fields.map((f, fi) => (
                      <TableRow key={fi} hover sx={{ "&:last-child td": { border: 0 } }}>
                        <TableCell>
                          <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                            {f.field}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={f.severity}
                            size="small"
                            color={SEVERITY_COLOR[f.severity] || "default"}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {f.description}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))}
        </Collapse>
      </CardContent>
    </Card>
  );
};

// ── Main Page ─────────────────────────────────────────────
const ConflictReport = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await policyApi.getAllConflicts();
      setData(result);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message || "Failed to load conflict data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Box sx={{ textAlign: "center", mt: 10 }}>
        <Alert severity="error" sx={{ mb: 2, maxWidth: 400, mx: "auto" }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={fetchData}>Retry</Button>
      </Box>
    );

  const { devices_with_conflicts, total_conflict_pairs, severity_breakdown, devices } = data;
  const hasConflicts = devices_with_conflicts > 0;

  return (
    <Box sx={{ p: 3 }}>
      {/* HEADER */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Policy Conflict Report
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Detects contradicting settings when multiple policies are assigned to the same device
          </Typography>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              Updated {lastUpdated}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PolicyIcon />}
            onClick={() => navigate("/policies")}
          >
            Policies
          </Button>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchData}><RefreshIcon /></IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* KPI CARDS */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: "center", py: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">Devices Scanned</Typography>
              <Typography variant="h4" fontWeight="bold">{data.total_devices_scanned}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card sx={{ borderRadius: 2, border: "1px solid", borderColor: hasConflicts ? "error.light" : "success.light" }}>
            <CardContent sx={{ textAlign: "center", py: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">Devices with Conflicts</Typography>
              <Typography
                variant="h4"
                fontWeight="bold"
                color={hasConflicts ? "error.main" : "success.main"}
              >
                {devices_with_conflicts}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: "center", py: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">Total Conflict Pairs</Typography>
              <Typography variant="h4" fontWeight="bold" color={total_conflict_pairs > 0 ? "warning.main" : "success.main"}>
                {total_conflict_pairs}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: "center", py: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">High Severity</Typography>
              <Typography variant="h4" fontWeight="bold" color={severity_breakdown.high > 0 ? "error.main" : "success.main"}>
                {severity_breakdown.high}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Medium: {severity_breakdown.medium}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Severity breakdown bar */}
      {hasConflicts && (
        <Card sx={{ borderRadius: 2, mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Conflict Severity Breakdown
            </Typography>
            <Grid container spacing={2}>
              {[
                { label: "High", value: severity_breakdown.high, color: "error" },
                { label: "Medium", value: severity_breakdown.medium, color: "warning" },
              ].map((s) => {
                const total = severity_breakdown.high + severity_breakdown.medium;
                const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
                return (
                  <Grid size={{ xs: 12, md: 6 }} key={s.label}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        {s.label === "High" ? (
                          <ErrorIcon fontSize="small" color="error" />
                        ) : (
                          <WarningAmberIcon fontSize="small" color="warning" />
                        )}
                        <Typography variant="body2">{s.label}</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="bold">
                        {s.value} ({pct}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      color={s.color}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* NO CONFLICTS STATE */}
      {!hasConflicts && (
        <Card sx={{ borderRadius: 2, border: "1px solid", borderColor: "success.light" }}>
          <CardContent sx={{ textAlign: "center", py: 5 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 56, mb: 1 }} />
            <Typography variant="h6" fontWeight="bold" color="success.main">
              No Policy Conflicts Detected
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              All devices with multiple assigned policies have compatible settings.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* DEVICE CONFLICT LIST */}
      {hasConflicts && (
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <WarningAmberIcon color="warning" />
            <Typography variant="h6" fontWeight="bold">
              Conflicting Devices ({devices_with_conflicts})
            </Typography>
            <Typography variant="caption" color="text.secondary">
              — click a row to expand details
            </Typography>
          </Box>
          {devices.map((d) => (
            <DeviceConflictCard key={d.device_id} device={d} />
          ))}
        </Box>
      )}

      {/* INFO FOOTER */}
      <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 3, borderRadius: 2 }}>
        <Typography variant="body2">
          <strong>How conflicts are detected:</strong> Boolean fields (e.g. bluetooth_disabled) conflict
          when two policies set opposite values. Numeric fields (e.g. min_password_length) conflict when
          both set a non-zero value that differs. OS version fields conflict when both specify a version
          that differs. Only policies on the same device and compatible platform are compared.
        </Typography>
      </Alert>
    </Box>
  );
};

export default ConflictReport;
