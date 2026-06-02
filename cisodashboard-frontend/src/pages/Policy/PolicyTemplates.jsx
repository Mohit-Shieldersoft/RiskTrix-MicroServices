import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Card, CardContent, CardActions, Grid,
  CircularProgress, Alert, Button, Chip, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Divider, LinearProgress,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import PolicyIcon from "@mui/icons-material/Policy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import LockIcon from "@mui/icons-material/Lock";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import SecurityIcon from "@mui/icons-material/Security";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import LaptopWindowsIcon from "@mui/icons-material/LaptopWindows";
import AppleIcon from "@mui/icons-material/Apple";
import DevicesIcon from "@mui/icons-material/Devices";
import policyApi from "../../utils/policyApi";

const PLATFORM_ICONS = {
  all: <DevicesIcon />,
  android: <SmartphoneIcon />,
  windows: <LaptopWindowsIcon />,
  ios: <AppleIcon />,
  macos: <AppleIcon />,
};

const PLATFORM_COLOR = {
  all: "default",
  android: "success",
  windows: "primary",
  ios: "secondary",
  macos: "secondary",
};

const CATEGORY_COLOR = {
  device_security: "error",
  network: "warning",
  app_control: "info",
  os_update: "default",
};

// Show which settings are enabled in this template
const SettingsBadges = ({ settings }) => {
  const active = [];
  if (settings.encryption_required) active.push({ label: "Encryption", icon: <LockIcon fontSize="inherit" /> });
  if (settings.require_screen_lock) active.push({ label: "Screen Lock", icon: <SecurityIcon fontSize="inherit" /> });
  if (settings.bluetooth_disabled) active.push({ label: "No Bluetooth", icon: <WifiOffIcon fontSize="inherit" /> });
  if (settings.usb_disabled) active.push({ label: "No USB", icon: <WifiOffIcon fontSize="inherit" /> });
  if (settings.wifi_restricted) active.push({ label: "Wi-Fi Restricted", icon: <WifiOffIcon fontSize="inherit" /> });
  if (settings.os_update_required) active.push({ label: "OS Updates", icon: <FlashOnIcon fontSize="inherit" /> });
  if (settings.password_complexity) active.push({ label: "Complex Password" });
  if (settings.min_password_length > 0) active.push({ label: `Min PW: ${settings.min_password_length}` });
  if (settings.password_expiry_days > 0) active.push({ label: `PW Expiry: ${settings.password_expiry_days}d` });
  if (settings.min_os_version) active.push({ label: `Min OS: ${settings.min_os_version}` });

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
      {active.map((s, i) => (
        <Chip key={i} label={s.label} size="small" variant="outlined" />
      ))}
      {active.length === 0 && (
        <Typography variant="caption" color="text.secondary">No enforced settings</Typography>
      )}
    </Box>
  );
};

// ── Apply Dialog ──────────────────────────────────────────
const ApplyDialog = ({ template, open, onClose, onApplied }) => {
  const [nameOverride, setNameOverride] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open && template) setNameOverride(template.name);
  }, [open, template]);

  const handleApply = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await policyApi.applyTemplate(
        template.id,
        nameOverride.trim() !== template.name ? nameOverride.trim() : null
      );
      onClose();
      onApplied(result);
    } catch (err) {
      setError(err.message || "Failed to create policy from template");
    } finally {
      setLoading(false);
    }
  };

  if (!template) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          Apply Template: <strong>{template.name}</strong>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {template.description}
        </Typography>
        <TextField
          fullWidth
          label="Policy Name"
          value={nameOverride}
          onChange={(e) => setNameOverride(e.target.value)}
          helperText="Customize the name or keep the default"
          sx={{ mb: 2 }}
        />
        <Divider sx={{ mb: 2 }} />
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Settings that will be applied:</Typography>
        <SettingsBadges settings={template.settings} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleApply}
          disabled={loading || !nameOverride.trim()}
          startIcon={loading ? <CircularProgress size={16} /> : <FlashOnIcon />}
        >
          {loading ? "Creating…" : "Create Policy"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Success Snackbar-style banner ─────────────────────────
const SuccessBanner = ({ result, onDismiss, onView }) => (
  <Alert
    severity="success"
    sx={{ mb: 3, borderRadius: 2 }}
    action={
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button color="inherit" size="small" onClick={onView}>View Policy</Button>
        <Button color="inherit" size="small" onClick={onDismiss}>Dismiss</Button>
      </Box>
    }
  >
    <strong>Policy created:</strong> "{result.name}" has been added and is now active.
  </Alert>
);

// ── Main Page ─────────────────────────────────────────────
const PolicyTemplates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [successResult, setSuccessResult] = useState(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await policyApi.getTemplates();
      setTemplates(data);
    } catch (err) {
      setError(err.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleApply = (template) => {
    setSelected(template);
    setDialogOpen(true);
  };

  const handleApplied = (result) => {
    setSuccessResult(result);
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Box sx={{ textAlign: "center", mt: 10 }}>
        <Alert severity="error" sx={{ mb: 2, maxWidth: 400, mx: "auto" }}>{error}</Alert>
        <Button variant="outlined" onClick={fetchTemplates}>Retry</Button>
      </Box>
    );

  return (
    <Box sx={{ p: 3 }}>
      {/* HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Policy Templates</Typography>
          <Typography variant="body2" color="text.secondary">
            Pre-built security configurations — apply in one click to create a ready-to-use policy
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PolicyIcon />}
            onClick={() => navigate("/policies")}
          >
            All Policies
          </Button>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchTemplates}><RefreshIcon /></IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* SUCCESS BANNER */}
      {successResult && (
        <SuccessBanner
          result={successResult}
          onDismiss={() => setSuccessResult(null)}
          onView={() => navigate(`/policies/${successResult.id}`)}
        />
      )}

      {/* TEMPLATE CARDS */}
      <Grid container spacing={3}>
        {templates.map((t) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={t.id}>
            <Card
              sx={{
                borderRadius: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                border: "1px solid",
                borderColor: "divider",
                transition: "box-shadow 0.2s, transform 0.15s",
                "&:hover": { boxShadow: 6, transform: "translateY(-2px)" },
              }}
            >
              {/* Coloured top bar */}
              <Box
                sx={{
                  height: 6,
                  borderRadius: "12px 12px 0 0",
                  bgcolor:
                    t.platform === "android" ? "success.main" :
                    t.platform === "windows" ? "primary.main" :
                    t.platform === "ios" || t.platform === "macos" ? "secondary.main" :
                    "grey.400",
                }}
              />

              <CardContent sx={{ flex: 1, pt: 2 }}>
                {/* Icon + platform + category row */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Box
                    sx={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 36, height: 36, borderRadius: "50%",
                      bgcolor: "action.selected", color: "primary.main", flexShrink: 0,
                    }}
                  >
                    {PLATFORM_ICONS[t.platform] || <DevicesIcon />}
                  </Box>
                  <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                    <Chip
                      label={t.platform === "all" ? "All Platforms" : t.platform.charAt(0).toUpperCase() + t.platform.slice(1)}
                      size="small"
                      color={PLATFORM_COLOR[t.platform] || "default"}
                    />
                    <Chip
                      label={t.category.replace(/_/g, " ")}
                      size="small"
                      color={CATEGORY_COLOR[t.category] || "default"}
                      variant="outlined"
                      sx={{ textTransform: "capitalize" }}
                    />
                  </Box>
                </Box>

                {/* Title + description */}
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.75 }}>
                  {t.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2, minHeight: 56, lineHeight: 1.5 }}
                >
                  {t.description}
                </Typography>

                <Divider sx={{ mb: 1.5 }} />

                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
                  Enforced Settings
                </Typography>
                <SettingsBadges settings={t.settings} />

                {/* Tags */}
                <Box sx={{ display: "flex", gap: 0.5, mt: 2, flexWrap: "wrap" }}>
                  {t.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={`#${tag}`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: "0.65rem", height: 20, color: "text.disabled", borderColor: "divider" }}
                    />
                  ))}
                </Box>
              </CardContent>

              <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<FlashOnIcon />}
                  onClick={() => handleApply(t)}
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: "bold" }}
                >
                  Apply Template
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* APPLY DIALOG */}
      <ApplyDialog
        template={selected}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onApplied={handleApplied}
      />
    </Box>
  );
};

export default PolicyTemplates;
