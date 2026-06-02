import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Grid, Paper, Chip, Button, CircularProgress,
  LinearProgress, Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tooltip, IconButton, Stack,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorIcon from "@mui/icons-material/Error";
import SecurityIcon from "@mui/icons-material/Security";
import HealingIcon from "@mui/icons-material/Healing";
import ShieldIcon from "@mui/icons-material/Shield";
import { useNavigate } from "react-router-dom";
import policyApi from "../../utils/policyApi";

// ── Helpers ──────────────────────────────────────────────
const STATUS_COLOR = {
  compliant: "success",
  warning: "warning",
  non_compliant: "error",
  unknown: "default",
};
const STATUS_ICON = {
  compliant: <CheckCircleIcon fontSize="small" color="success" />,
  warning: <WarningIcon fontSize="small" color="warning" />,
  non_compliant: <ErrorIcon fontSize="small" color="error" />,
  unknown: <SecurityIcon fontSize="small" />,
};
const SEV_COLOR = {
  critical: "#d32f2f",
  high: "#f57c00",
  medium: "#1976d2",
  low: "#388e3c",
};

function ScoreGauge({ score }) {
  const color =
    score >= 80 ? "#4caf50" : score >= 60 ? "#ff9800" : "#f44336";
  return (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <CircularProgress
        variant="determinate"
        value={score}
        size={120}
        thickness={6}
        sx={{ color }}
      />
      <CircularProgress
        variant="determinate"
        value={100}
        size={120}
        thickness={6}
        sx={{ color: "grey.200", position: "absolute", left: 0 }}
      />
      <Box
        sx={{
          top: 0, left: 0, bottom: 0, right: 0,
          position: "absolute",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <Typography variant="h5" fontWeight={700} sx={{ color }}>
          {score}%
        </Typography>
      </Box>
    </Box>
  );
}

function KpiCard({ label, value, color, icon }) {
  return (
    <Paper
      elevation={2}
      sx={{ p: 2.5, borderRadius: 2, display: "flex", alignItems: "center", gap: 2 }}
    >
      <Box
        sx={{
          width: 48, height: 48, borderRadius: 2,
          bgcolor: `${color}.main`, display: "flex",
          alignItems: "center", justifyContent: "center",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" fontWeight={700}>{value}</Typography>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
      </Box>
    </Paper>
  );
}

function CheckBreakdown({ checks }) {
  if (!checks || checks.length === 0) return null;
  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Compliance by Check Type
      </Typography>
      <Stack spacing={1.5}>
        {checks.map((c) => (
          <Box key={c.type}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" fontWeight={500}>{c.label}</Typography>
                <Chip
                  label={c.severity}
                  size="small"
                  sx={{
                    bgcolor: SEV_COLOR[c.severity] + "22",
                    color: SEV_COLOR[c.severity],
                    fontWeight: 600,
                    fontSize: "0.6rem",
                    height: 18,
                  }}
                />
              </Stack>
              <Typography variant="body2" fontWeight={600}>
                {c.pass_rate}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={c.pass_rate}
              sx={{
                height: 8, borderRadius: 4,
                bgcolor: "grey.100",
                "& .MuiLinearProgress-bar": {
                  bgcolor:
                    c.pass_rate >= 80 ? "#4caf50" :
                    c.pass_rate >= 60 ? "#ff9800" : "#f44336",
                  borderRadius: 4,
                },
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {c.passed} passed · {c.failed} failed · weight {c.weight}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

function SeverityBreakdown({ bySevertiy }) {
  const items = [
    { label: "Critical", key: "critical", color: SEV_COLOR.critical },
    { label: "High", key: "high", color: SEV_COLOR.high },
    { label: "Medium", key: "medium", color: SEV_COLOR.medium },
    { label: "Low", key: "low", color: SEV_COLOR.low },
  ];
  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Open Violations by Severity
      </Typography>
      <Stack spacing={1}>
        {items.map(({ label, key, color }) => (
          <Box
            key={key}
            sx={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              p: 1.5, borderRadius: 1.5, bgcolor: color + "11",
              border: `1px solid ${color}44`,
            }}
          >
            <Typography variant="body2" fontWeight={600} sx={{ color }}>
              {label}
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ color }}>
              {bySevertiy?.[key] ?? 0}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

function DeviceTable({ devices, title, emptyMsg }) {
  const navigate = useNavigate();
  if (!devices || devices.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>{title}</Typography>
        <Alert severity="success" icon={<CheckCircleIcon />}>{emptyMsg}</Alert>
      </Paper>
    );
  }
  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>{title}</Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Device</TableCell>
              <TableCell>Platform</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell align="center">Score</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {devices.map((d) => (
              <TableRow key={d.device_id} hover sx={{ cursor: "pointer" }}
                onClick={() => navigate(`/devices/${d.device_id}`)}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>{d.device_name}</Typography>
                </TableCell>
                <TableCell>
                  <Chip label={d.platform} size="small" />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">{d.owner}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, justifyContent: "center" }}>
                    <LinearProgress
                      variant="determinate"
                      value={d.compliance_score ?? 0}
                      sx={{
                        width: 60, height: 6, borderRadius: 3,
                        "& .MuiLinearProgress-bar": {
                          bgcolor:
                            d.compliance_score >= 80 ? "#4caf50" :
                            d.compliance_score >= 60 ? "#ff9800" : "#f44336",
                        },
                      }}
                    />
                    <Typography variant="caption" fontWeight={600}>
                      {d.compliance_score ?? "—"}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={d.compliance_status}
                    color={STATUS_COLOR[d.compliance_status] || "default"}
                    size="small"
                    icon={STATUS_ICON[d.compliance_status]}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function ComplianceDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await policyApi.getComplianceDashboard();
      setData(result);
    } catch (e) {
      setError(e.message || "Failed to load compliance data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const result = await policyApi.triggerFullScan();
      setScanResult(result);
      await load();
    } catch (e) {
      setError(e.message || "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const summary = data?.summary || {};

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <ShieldIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>Compliance Dashboard</Typography>
            <Typography variant="body2" color="text.secondary">
              Weighted per-check scanning · auto-refresh every 15 min
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            startIcon={<HealingIcon />}
            variant="contained"
            onClick={handleScan}
            disabled={scanning}
          >
            {scanning ? "Scanning…" : "Run Scan Now"}
          </Button>
          <Tooltip title="Refresh">
            <IconButton onClick={load} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {scanResult && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setScanResult(null)}>
          Scan complete — {scanResult.scanned} assignments evaluated, {scanResult.errors} errors.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Overall Score */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, textAlign: "center" }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Overall Compliance Score
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
                <ScoreGauge score={summary.overall_score ?? 0} />
              </Box>
              <Chip
                label={`${summary.compliance_rate ?? 0}% devices compliant`}
                color={summary.compliance_rate >= 80 ? "success" : summary.compliance_rate >= 60 ? "warning" : "error"}
              />
            </Paper>
          </Grid>

          {/* KPI Cards */}
          <Grid size={{ xs: 12, md: 9 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, md: 3 }}>
                <KpiCard
                  label="Compliant"
                  value={summary.compliant ?? 0}
                  color="success"
                  icon={<CheckCircleIcon sx={{ color: "white" }} />}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <KpiCard
                  label="Warning"
                  value={summary.warning ?? 0}
                  color="warning"
                  icon={<WarningIcon sx={{ color: "white" }} />}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <KpiCard
                  label="Non-Compliant"
                  value={summary.non_compliant ?? 0}
                  color="error"
                  icon={<ErrorIcon sx={{ color: "white" }} />}
                />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <KpiCard
                  label="Open Violations"
                  value={summary.open_violations ?? 0}
                  color="primary"
                  icon={<SecurityIcon sx={{ color: "white" }} />}
                />
              </Grid>
              {/* Evaluated count banner */}
              <Grid size={{ xs: 12 }}>
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  {summary.total_evaluated ?? 0} assignments evaluated
                  {summary.unknown > 0 && ` · ${summary.unknown} not yet scanned — run a scan to populate`}
                </Alert>
              </Grid>
            </Grid>
          </Grid>

          {/* Check breakdown */}
          <Grid size={{ xs: 12, md: 8 }}>
            <CheckBreakdown checks={data?.check_breakdown} />
          </Grid>

          {/* Violations by severity */}
          <Grid size={{ xs: 12, md: 4 }}>
            <SeverityBreakdown bySevertiy={data?.violation_by_severity} />
          </Grid>

          {/* Remediation Queue */}
          <Grid size={{ xs: 12, md: 6 }}>
            <DeviceTable
              title="Remediation Queue (Critical / High)"
              devices={data?.remediation_queue}
              emptyMsg="No devices require urgent remediation."
            />
          </Grid>

          {/* Non-compliant devices */}
          <Grid size={{ xs: 12, md: 6 }}>
            <DeviceTable
              title="Non-Compliant Devices"
              devices={data?.non_compliant_devices}
              emptyMsg="All devices are compliant."
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
