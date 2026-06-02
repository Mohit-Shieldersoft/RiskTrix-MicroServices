import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Switch,
  TextField,
  Typography,
  CircularProgress,
  LinearProgress,
  Stack,
  Avatar,
  Paper,
  IconButton,
  Tooltip,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SecurityIcon from "@mui/icons-material/Security";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import SecurityUpdateWarningIcon from "@mui/icons-material/SecurityUpdateWarning";
import AppsIcon from "@mui/icons-material/Apps";
import securityApi from "../../utils/securityApi";

const DEFAULT_FLAGS = {
  is_rooted: false,
  encryption_enabled: true,
  screen_lock_enabled: true,
  os_outdated: false,
  blacklisted_app_detected: false,
};

const FLAG_META = [
  {
    key: "is_rooted",
    label: "Device is Rooted / Jailbroken",
    description: "Agent detected root or jailbreak on this device.",
    dangerWhenTrue: true,
    icon: <LockOpenIcon fontSize="small" />,
    weight: 40,
  },
  {
    key: "encryption_enabled",
    label: "Storage Encryption Enabled",
    description: "Full-disk or file-based encryption is active.",
    dangerWhenTrue: false,
    icon: <LockIcon fontSize="small" />,
    weight: 25,
  },
  {
    key: "screen_lock_enabled",
    label: "Screen Lock / PIN Enabled",
    description: "Device requires PIN, pattern, or biometric to unlock.",
    dangerWhenTrue: false,
    icon: <PhoneAndroidIcon fontSize="small" />,
    weight: 20,
  },
  {
    key: "os_outdated",
    label: "OS is Outdated",
    description: "Device is running an OS version below the required minimum.",
    dangerWhenTrue: true,
    icon: <SecurityUpdateWarningIcon fontSize="small" />,
    weight: 15,
  },
  {
    key: "blacklisted_app_detected",
    label: "Blacklisted App Detected",
    description: "A prohibited or malicious application is installed.",
    dangerWhenTrue: true,
    icon: <AppsIcon fontSize="small" />,
    weight: 20,
  },
];

function calcPreviewScore(flags) {
  let score = 0;
  if (flags.is_rooted) score += 40;
  if (!flags.encryption_enabled) score += 25;
  if (!flags.screen_lock_enabled) score += 20;
  if (flags.os_outdated) score += 15;
  if (flags.blacklisted_app_detected) score += 20;
  return score;
}

function scoreToLevel(score) {
  if (score >= 81) return "critical";
  if (score >= 51) return "high";
  if (score >= 21) return "medium";
  return "low";
}

const LEVEL_CONFIG = {
  critical: { color: "error", label: "Critical", barColor: "#d32f2f" },
  high:     { color: "warning", label: "High",     barColor: "#f57c00" },
  medium:   { color: "info",    label: "Medium",   barColor: "#0288d1" },
  low:      { color: "success", label: "Low",      barColor: "#2e7d32" },
};

export default function AgentReportForm() {
  const navigate = useNavigate();
  const [deviceId, setDeviceId] = useState("");
  const [flags, setFlags] = useState(DEFAULT_FLAGS);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const previewScore = useMemo(() => calcPreviewScore(flags), [flags]);
  const previewLevel = scoreToLevel(previewScore);
  const levelCfg = LEVEL_CONFIG[previewLevel];

  const handleToggle = (key) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!deviceId || isNaN(Number(deviceId))) {
      setError("Please enter a valid numeric Device ID.");
      return;
    }
    setError("");
    setSubmitting(true);
    setResult(null);
    try {
      const res = await securityApi.submitAgentReport(Number(deviceId), flags);
      setResult(res);
    } catch (e) {
      setError(e.message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  const issueCount = FLAG_META.filter(({ key, dangerWhenTrue }) =>
    dangerWhenTrue ? flags[key] : !flags[key]
  ).length;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "grey.50" }}>
      {/* Page Header */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #1a237e 0%, #283593 60%, #3949ab 100%)",
          color: "white",
          px: 4,
          py: 3,
        }}
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/security")}
          size="small"
          sx={{ color: "rgba(255,255,255,0.8)", mb: 1.5, "&:hover": { color: "white" } }}
        >
          Security Dashboard
        </Button>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar sx={{ bgcolor: "rgba(255,255,255,0.15)", width: 48, height: 48 }}>
            <SecurityIcon sx={{ fontSize: 26 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Submit Agent Security Report
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.3 }}>
              Manually push a device security scan. Risk engine will re-evaluate and generate alerts.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100, mx: "auto" }}>
        <Grid container spacing={3}>

          {/* LEFT — Device + Preview + Actions */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3}>

              {/* Device ID Card */}
              <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
                    Target Device
                  </Typography>
                  <TextField
                    label="Device ID"
                    value={deviceId}
                    onChange={(e) => { setDeviceId(e.target.value); setError(""); setResult(null); }}
                    size="small"
                    type="number"
                    fullWidth
                    error={!!error}
                    helperText={error || "Numeric ID from the devices table"}
                    inputProps={{ min: 1 }}
                  />
                </CardContent>
              </Card>

              {/* Live Risk Preview */}
              <Card
                sx={{
                  borderRadius: 2,
                  boxShadow: 2,
                  border: "1px solid",
                  borderColor: `${levelCfg.color}.main`,
                  background: `linear-gradient(135deg, ${
                    previewLevel === "critical" ? "#fff5f5" :
                    previewLevel === "high"     ? "#fff8f0" :
                    previewLevel === "medium"   ? "#f0f7ff" : "#f0fff4"
                  } 0%, white 100%)`,
                }}
              >
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Live Risk Preview
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 1 }}>
                    <Typography variant="h3" fontWeight="bold" color={`${levelCfg.color}.main`}>
                      {previewScore}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">/ 120</Typography>
                    <Chip
                      label={levelCfg.label.toUpperCase()}
                      color={levelCfg.color}
                      size="small"
                      sx={{ fontWeight: "bold", ml: "auto" }}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(previewScore / 120) * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: "grey.200",
                      "& .MuiLinearProgress-bar": { bgcolor: levelCfg.barColor, borderRadius: 4 },
                    }}
                  />
                  <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">0 — Low</Typography>
                    <Typography variant="caption" color="text.secondary">120 — Critical</Typography>
                  </Box>
                  <Divider sx={{ my: 1.5 }} />
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Chip
                      icon={issueCount > 0 ? <WarningAmberIcon /> : <CheckCircleIcon />}
                      label={`${issueCount} issue${issueCount !== 1 ? "s" : ""} detected`}
                      color={issueCount > 0 ? "warning" : "success"}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Stack spacing={1.5}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={
                    submitting
                      ? <CircularProgress size={18} color="inherit" />
                      : <SendIcon />
                  }
                  disabled={submitting || !deviceId}
                  onClick={handleSubmit}
                  sx={{
                    py: 1.4,
                    fontWeight: "bold",
                    background: "linear-gradient(135deg, #1a237e, #3949ab)",
                    "&:hover": { background: "linear-gradient(135deg, #283593, #3f51b5)" },
                  }}
                >
                  {submitting ? "Submitting…" : "Submit Report"}
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<RestartAltIcon />}
                  onClick={() => { setFlags(DEFAULT_FLAGS); setResult(null); setError(""); }}
                >
                  Reset Flags
                </Button>
              </Stack>

              {/* Result Card */}
              {result && (
                <Card
                  sx={{
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "success.light",
                    bgcolor: "#f0fff4",
                    boxShadow: 1,
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                      <CheckCircleIcon color="success" />
                      <Typography variant="subtitle2" fontWeight="bold" color="success.dark">
                        Report Submitted
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 1.5 }} />
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Risk Score</Typography>
                        <Typography variant="h5" fontWeight="bold" color={`${LEVEL_CONFIG[result.risk_level]?.color || "primary"}.main`}>
                          {result.risk_score}
                        </Typography>
                      </Box>
                      <Chip
                        label={result.risk_level?.toUpperCase()}
                        color={LEVEL_CONFIG[result.risk_level]?.color || "default"}
                        sx={{ fontWeight: "bold" }}
                      />
                    </Box>
                    <Button
                      size="small"
                      endIcon={<OpenInNewIcon fontSize="small" />}
                      sx={{ mt: 1.5 }}
                      onClick={() => navigate(`/security/device/${deviceId}`)}
                    >
                      View Device Profile
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Error */}
              {error && (
                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "#fff5f5",
                    border: "1px solid",
                    borderColor: "error.light",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1,
                  }}
                >
                  <ErrorIcon color="error" fontSize="small" sx={{ mt: 0.2 }} />
                  <Typography variant="body2" color="error.dark">{error}</Typography>
                </Paper>
              )}
            </Stack>
          </Grid>

          {/* RIGHT — Security Flags */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
              <CardContent sx={{ pb: "16px !important" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">Security Flags</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Toggle each flag based on what the device agent reported.
                    </Typography>
                  </Box>
                  <Tooltip title="Reset all flags to default">
                    <IconButton size="small" onClick={() => { setFlags(DEFAULT_FLAGS); setResult(null); }}>
                      <RestartAltIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Stack spacing={1.5}>
                  {FLAG_META.map(({ key, label, description, dangerWhenTrue, icon, weight }) => {
                    const isDanger = dangerWhenTrue ? flags[key] : !flags[key];
                    const isOn = !!flags[key];
                    return (
                      <Paper
                        key={key}
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: isDanger ? "error.light" : "success.light",
                          bgcolor: isDanger ? "rgba(211,47,47,0.04)" : "rgba(46,125,50,0.04)",
                          transition: "all 0.2s ease",
                          cursor: "pointer",
                          "&:hover": {
                            borderColor: isDanger ? "error.main" : "success.main",
                            boxShadow: 1,
                          },
                        }}
                        onClick={() => handleToggle(key)}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          {/* Status Icon */}
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: isDanger ? "error.light" : "success.light",
                              color: isDanger ? "error.dark" : "success.dark",
                              flexShrink: 0,
                            }}
                          >
                            {isDanger
                              ? <ErrorIcon fontSize="small" />
                              : <CheckCircleIcon fontSize="small" />}
                          </Avatar>

                          {/* Label + description */}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Box sx={{ color: "text.secondary", display: "flex" }}>{icon}</Box>
                              <Typography variant="body2" fontWeight="bold">
                                {label}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.3 }}>
                              {description}
                            </Typography>
                          </Box>

                          {/* Risk weight badge */}
                          {isDanger && (
                            <Chip
                              label={`+${weight} pts`}
                              size="small"
                              color="error"
                              variant="outlined"
                              sx={{ fontSize: "0.7rem", fontWeight: "bold", flexShrink: 0 }}
                            />
                          )}

                          {/* Switch */}
                          <Box
                            sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Switch
                              checked={isOn}
                              onChange={() => handleToggle(key)}
                              color={isDanger ? "error" : "success"}
                              size="medium"
                            />
                            <Chip
                              label={isOn ? "ON" : "OFF"}
                              size="small"
                              color={isDanger ? "error" : "success"}
                              sx={{ minWidth: 46, fontWeight: "bold", fontSize: "0.72rem" }}
                            />
                          </Box>
                        </Box>
                      </Paper>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

        </Grid>
      </Box>
    </Box>
  );
}
