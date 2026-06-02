import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Card, CardContent, Grid, TextField,
  Button, Alert, CircularProgress, Divider, Chip,
  Stepper, Step, StepLabel, StepContent, Paper, Avatar,
  InputAdornment, Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import KeyIcon from "@mui/icons-material/Key";
import DevicesIcon from "@mui/icons-material/Devices";
import PersonIcon from "@mui/icons-material/Person";
import LaptopWindowsIcon from "@mui/icons-material/LaptopWindows";
import AndroidIcon from "@mui/icons-material/Android";
import AppleIcon from "@mui/icons-material/Apple";
import DesktopMacIcon from "@mui/icons-material/DesktopMac";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import MemoryIcon from "@mui/icons-material/Memory";
import RouterIcon from "@mui/icons-material/Router";
import BadgeIcon from "@mui/icons-material/Badge";
import ApartmentIcon from "@mui/icons-material/Apartment";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import deviceApi from "../../utils/deviceApi";

const PLATFORM_OPTIONS = [
  { value: "windows", label: "Windows", icon: <LaptopWindowsIcon />, color: "#0078d4" },
  { value: "android", label: "Android", icon: <AndroidIcon />, color: "#3ddc84" },
  { value: "ios", label: "iOS", icon: <AppleIcon />, color: "#555" },
  { value: "macos", label: "macOS", icon: <DesktopMacIcon />, color: "#666" },
];

const STEPS = ["Enrollment Token", "Device Details", "Ownership"];

const initialForm = {
  token: "",
  name: "",
  platform: "windows",
  os_version: "",
  owner: "",
  department: "",
  device_model: "",
  manufacturer: "",
  serial_number: "",
  mac_address: "",
};

// ── Section header component ──────────────────────────────
const SectionHeader = ({ icon, title, subtitle }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
    <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
      {icon}
    </Avatar>
    <Box>
      <Typography variant="subtitle1" fontWeight="bold" lineHeight={1.2}>{title}</Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
      )}
    </Box>
  </Box>
);

// ── Platform picker card ──────────────────────────────────
const PlatformCard = ({ option, selected, onClick }) => (
  <Card
    onClick={onClick}
    sx={{
      cursor: "pointer",
      border: selected ? `2px solid` : "2px solid transparent",
      borderColor: selected ? "primary.main" : "transparent",
      boxShadow: selected ? 4 : 1,
      borderRadius: 2,
      transition: "all 0.18s ease",
      bgcolor: selected ? "primary.50" : "background.paper",
      "&:hover": { boxShadow: 3, borderColor: "primary.light" },
    }}
  >
    <CardContent
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        py: 1.5,
        px: 1,
        "&:last-child": { pb: 1.5 },
      }}
    >
      <Box sx={{ color: selected ? "primary.main" : option.color, fontSize: 28, mb: 0.5 }}>
        {option.icon}
      </Box>
      <Typography
        variant="caption"
        fontWeight={selected ? "bold" : "normal"}
        color={selected ? "primary.main" : "text.primary"}
      >
        {option.label}
      </Typography>
    </CardContent>
  </Card>
);

export default function EnrollmentForm() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError(null);
  };

  const handleNext = () => {
    if (activeStep === 0 && !form.token.trim()) {
      setError("Enrollment token is required before proceeding.");
      return;
    }
    if (activeStep === 1 && !form.name.trim()) {
      setError("Device name is required before proceeding.");
      return;
    }
    setError(null);
    setActiveStep((s) => s + 1);
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await deviceApi.enrollDevice(form);
      setSuccess(result);
      setForm(initialForm);
      setActiveStep(0);
    } catch (err) {
      const detail = err?.response?.data?.detail || err.message || "Enrollment failed.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  // ── SUCCESS SCREEN ────────────────────────────────────────
  if (success) {
    const platform = PLATFORM_OPTIONS.find((p) => p.value === success.platform);
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
        {/* Success banner */}
        <Paper
          elevation={0}
          sx={{
            background: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)",
            borderRadius: 3,
            p: 4,
            textAlign: "center",
            color: "white",
            mb: 3,
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 64, mb: 1.5, opacity: 0.95 }} />
          <Typography variant="h5" fontWeight="bold">Device Enrolled!</Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
            {success.message}
          </Typography>
        </Paper>

        {/* Details card */}
        <Card sx={{ borderRadius: 2, mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Enrollment Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={1.5}>
              {[
                { label: "Device Name", value: success.device_name, icon: <DevicesIcon fontSize="small" /> },
                { label: "Device UID", value: success.device_uid, icon: <FingerprintIcon fontSize="small" />, mono: true },
                { label: "Platform", value: success.platform, icon: platform?.icon },
                { label: "Device ID", value: `#${success.device_id}`, icon: <BadgeIcon fontSize="small" /> },
                { label: "Enrolled At", value: new Date(success.enrolled_at).toLocaleString(), icon: <CheckCircleIcon fontSize="small" /> },
              ].map((row) => (
                <Grid size={{ xs: 12 }} key={row.label}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      py: 1,
                      px: 1.5,
                      bgcolor: "grey.50",
                      borderRadius: 1.5,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
                      {row.icon}
                      <Typography variant="body2" color="text.secondary">{row.label}</Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={row.mono ? { fontFamily: "monospace", fontSize: "0.8rem" } : {}}
                    >
                      {row.value}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Actions */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => navigate(`/devices/${success.device_id}`)}
          >
            View Device
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => { setSuccess(null); }}
          >
            Enroll Another
          </Button>
          <Button
            fullWidth
            onClick={() => navigate("/enrollment")}
          >
            Dashboard
          </Button>
        </Box>
      </Box>
    );
  }

  // ── MAIN FORM ─────────────────────────────────────────────
  return (
    <Box sx={{ p: 3, maxWidth: 720, mx: "auto" }}>
      {/* BACK */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/enrollment")}
        sx={{ mb: 2 }}
      >
        Back to Enrollment Dashboard
      </Button>

      {/* PAGE HEADER */}
      <Box
        sx={{
          background: "linear-gradient(120deg, #3f51b5 0%, #5c6bc0 100%)",
          borderRadius: 3,
          p: 3,
          mb: 3,
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 52, height: 52 }}>
          <DevicesIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight="bold">Enroll a Device</Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            Register a device into MDM using a valid enrollment token
          </Typography>
        </Box>
      </Box>

      {/* ERROR */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* STEPPER */}
      <Stepper activeStep={activeStep} orientation="vertical">

        {/* ── STEP 0: TOKEN ── */}
        <Step>
          <StepLabel
            StepIconProps={{ sx: { fontSize: 28 } }}
            optional={activeStep > 0 && (
              <Typography variant="caption" color="success.main">
                Token provided
              </Typography>
            )}
          >
            <Typography fontWeight={activeStep === 0 ? "bold" : "normal"}>
              Enrollment Token
            </Typography>
          </StepLabel>
          <StepContent>
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2, mb: 2 }}>
              <SectionHeader
                icon={<KeyIcon fontSize="small" />}
                title="Paste your enrollment token"
                subtitle="Tokens are generated by your administrator in the Devices → Enrollment Tokens tab"
              />
              <TextField
                label="Enrollment Token *"
                fullWidth
                value={form.token}
                onChange={handleChange("token")}
                placeholder="e.g. eyJhbGciOiJSUzI1NiJ9..."
                multiline
                minRows={2}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyIcon color="action" />
                    </InputAdornment>
                  ),
                  sx: { fontFamily: "monospace", fontSize: "0.85rem" },
                }}
                helperText="The token determines which platform this device is allowed to enroll as."
              />
            </Card>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={handleNext}
                disabled={!form.token.trim()}
              >
                Continue
              </Button>
            </Box>
          </StepContent>
        </Step>

        {/* ── STEP 1: DEVICE DETAILS ── */}
        <Step>
          <StepLabel
            StepIconProps={{ sx: { fontSize: 28 } }}
            optional={activeStep > 1 && (
              <Typography variant="caption" color="success.main">
                {form.name} · {form.platform}
              </Typography>
            )}
          >
            <Typography fontWeight={activeStep === 1 ? "bold" : "normal"}>
              Device Details
            </Typography>
          </StepLabel>
          <StepContent>
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2.5, mb: 2 }}>

              {/* Platform picker */}
              <SectionHeader
                icon={<DevicesIcon fontSize="small" />}
                title="Select Platform"
                subtitle="Choose the operating system of the device"
              />
              <Grid container spacing={1.5} sx={{ mb: 3 }}>
                {PLATFORM_OPTIONS.map((opt) => (
                  <Grid size={{ xs: 6, sm: 3 }} key={opt.value}>
                    <PlatformCard
                      option={opt}
                      selected={form.platform === opt.value}
                      onClick={() => { setForm((p) => ({ ...p, platform: opt.value })); setError(null); }}
                    />
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ my: 2.5 }} />

              {/* Device identity fields */}
              <SectionHeader
                icon={<FingerprintIcon fontSize="small" />}
                title="Device Identity"
                subtitle="Hardware identifiers for the device"
              />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Device Name *"
                    fullWidth
                    size="small"
                    value={form.name}
                    onChange={handleChange("name")}
                    placeholder="e.g. John's Laptop"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start"><DevicesIcon fontSize="small" color="action" /></InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="OS Version"
                    fullWidth
                    size="small"
                    value={form.os_version}
                    onChange={handleChange("os_version")}
                    placeholder="e.g. Windows 11 23H2"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Serial Number"
                    fullWidth
                    size="small"
                    value={form.serial_number}
                    onChange={handleChange("serial_number")}
                    placeholder="e.g. SN123456789"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start"><MemoryIcon fontSize="small" color="action" /></InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Device Model"
                    fullWidth
                    size="small"
                    value={form.device_model}
                    onChange={handleChange("device_model")}
                    placeholder="e.g. ThinkPad X1 Carbon"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Manufacturer"
                    fullWidth
                    size="small"
                    value={form.manufacturer}
                    onChange={handleChange("manufacturer")}
                    placeholder="e.g. Lenovo"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="MAC Address"
                    fullWidth
                    size="small"
                    value={form.mac_address}
                    onChange={handleChange("mac_address")}
                    placeholder="e.g. AA:BB:CC:DD:EE:FF"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start"><RouterIcon fontSize="small" color="action" /></InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Card>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button onClick={handleBack} variant="outlined">Back</Button>
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={handleNext}
                disabled={!form.name.trim()}
              >
                Continue
              </Button>
            </Box>
          </StepContent>
        </Step>

        {/* ── STEP 2: OWNERSHIP ── */}
        <Step>
          <StepLabel>
            <Typography fontWeight={activeStep === 2 ? "bold" : "normal"}>
              Ownership
            </Typography>
          </StepLabel>
          <StepContent>
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2.5, mb: 2 }}>
              <SectionHeader
                icon={<PersonIcon fontSize="small" />}
                title="Assign Ownership"
                subtitle="Who owns this device and which team does it belong to?"
              />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Owner"
                    fullWidth
                    size="small"
                    value={form.owner}
                    onChange={handleChange("owner")}
                    placeholder="e.g. john.doe@company.com"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start"><PersonIcon fontSize="small" color="action" /></InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Department"
                    fullWidth
                    size="small"
                    value={form.department}
                    onChange={handleChange("department")}
                    placeholder="e.g. Engineering"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start"><ApartmentIcon fontSize="small" color="action" /></InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>

              {/* Review summary */}
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  bgcolor: "primary.50",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "primary.100",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <InfoOutlinedIcon fontSize="small" color="primary" />
                  <Typography variant="subtitle2" color="primary.main" fontWeight="bold">
                    Enrollment Summary
                  </Typography>
                </Box>
                <Grid container spacing={1}>
                  {[
                    { label: "Device Name", value: form.name || "—" },
                    { label: "Platform", value: form.platform },
                    { label: "OS Version", value: form.os_version || "—" },
                    { label: "Owner", value: form.owner || "—" },
                    { label: "Department", value: form.department || "—" },
                    { label: "Token", value: form.token ? form.token.slice(0, 10) + "..." : "—" },
                  ].map((row) => (
                    <Grid size={{ xs: 6 }} key={row.label}>
                      <Typography variant="caption" color="text.secondary" display="block">{row.label}</Typography>
                      <Typography variant="body2" fontWeight={500}>{row.value}</Typography>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Card>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button onClick={handleBack} variant="outlined">Back</Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <CheckCircleIcon />}
              >
                {loading ? "Enrolling..." : "Confirm & Enroll"}
              </Button>
            </Box>
          </StepContent>
        </Step>
      </Stepper>
    </Box>
  );
}