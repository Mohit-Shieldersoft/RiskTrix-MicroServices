import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Button, Card, CardContent,
  TextField, MenuItem, FormControlLabel, Switch,
  Divider, CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import policyApi from "../../utils/policyApi";
import Toast from "../../components/common/Toast";
import { useToast } from "../../components/common/useToast";

const PolicyEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, showToast, closeToast } = useToast();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const data = await policyApi.getPolicyById(id);
        setForm(data);
      } catch {
        setError("Policy not found");
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSwitch = (name) => (e) => {
    setForm({ ...form, [name]: e.target.checked });
  };

  const onSubmit = async () => {
    if (!form.name.trim()) {
      showToast("Policy name is required", "warning");
      return;
    }
    setSubmitting(true);
    try {
      await policyApi.updatePolicy(id, form);
      showToast("Policy updated successfully!", "success");
      setTimeout(() => navigate(`/policies/${id}`), 1000);
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to update policy", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !form) {
    return (
      <Box sx={{ textAlign: "center", mt: 10 }}>
        <Typography color="error">{error}</Typography>
        <Button sx={{ mt: 2 }} variant="outlined" onClick={() => navigate("/policies")}>
          Back to Policies
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
      {/* HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/policies/${id}`)}>
          Back to Policy
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={onSubmit}
          disabled={submitting}
        >
          {submitting ? "Saving..." : "Save Changes"}
        </Button>
      </Box>

      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        Edit Policy
      </Typography>

      {/* BASIC INFO */}
      <Card sx={{ borderRadius: 2, mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
            Basic Information
          </Typography>
          <TextField
            margin="dense" label="Policy Name" name="name"
            fullWidth required value={form.name} onChange={handleChange}
          />
          <TextField
            margin="dense" label="Description" name="description"
            fullWidth multiline rows={2} value={form.description} onChange={handleChange}
          />
          <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
            <TextField
              margin="dense" label="Category" name="category"
              select fullWidth value={form.category} onChange={handleChange}
            >
              <MenuItem value="device_security">Device Security</MenuItem>
              <MenuItem value="app_control">App Control</MenuItem>
              <MenuItem value="network">Network</MenuItem>
              <MenuItem value="os_update">OS Update</MenuItem>
            </TextField>
            <TextField
              margin="dense" label="Platform" name="platform"
              select fullWidth value={form.platform} onChange={handleChange}
            >
              <MenuItem value="all">All Platforms</MenuItem>
              <MenuItem value="android">Android</MenuItem>
              <MenuItem value="windows">Windows</MenuItem>
              <MenuItem value="ios">iOS</MenuItem>
              <MenuItem value="macos">macOS</MenuItem>
            </TextField>
            <TextField
              margin="dense" label="Status" name="status"
              select fullWidth value={form.status} onChange={handleChange}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </TextField>
          </Box>
        </CardContent>
      </Card>

      {/* DEVICE SECURITY */}
      <Card sx={{ borderRadius: 2, mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
            Device Security Controls
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <FormControlLabel
              control={<Switch checked={form.require_screen_lock} onChange={handleSwitch("require_screen_lock")} />}
              label="Require Screen Lock"
            />
            <FormControlLabel
              control={<Switch checked={form.password_complexity} onChange={handleSwitch("password_complexity")} />}
              label="Password Complexity"
            />
            <FormControlLabel
              control={<Switch checked={form.encryption_required} onChange={handleSwitch("encryption_required")} />}
              label="Encryption Required"
            />
          </Box>
          <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
            <TextField
              margin="dense" label="Min Password Length" name="min_password_length"
              type="number" fullWidth value={form.min_password_length} onChange={handleChange}
              inputProps={{ min: 0, max: 32 }}
            />
            <TextField
              margin="dense" label="Password Expiry (days)" name="password_expiry_days"
              type="number" fullWidth value={form.password_expiry_days} onChange={handleChange}
              inputProps={{ min: 0 }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* CONNECTIVITY */}
      <Card sx={{ borderRadius: 2, mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
            Connectivity Restrictions
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <FormControlLabel
              control={<Switch checked={form.bluetooth_disabled} onChange={handleSwitch("bluetooth_disabled")} />}
              label="Disable Bluetooth"
            />
            <FormControlLabel
              control={<Switch checked={form.usb_disabled} onChange={handleSwitch("usb_disabled")} />}
              label="Disable USB"
            />
            <FormControlLabel
              control={<Switch checked={form.wifi_restricted} onChange={handleSwitch("wifi_restricted")} />}
              label="Restrict Wi-Fi"
            />
          </Box>
        </CardContent>
      </Card>

      {/* OS UPDATE */}
      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
            OS Update Requirements
          </Typography>
          <FormControlLabel
            control={<Switch checked={form.os_update_required} onChange={handleSwitch("os_update_required")} />}
            label="Require OS Update"
          />
          {form.os_update_required && (
            <TextField
              margin="dense" label="Minimum OS Version" name="min_os_version"
              fullWidth value={form.min_os_version} onChange={handleChange}
              placeholder="e.g. 14.0, 10.0.22000"
            />
          )}
        </CardContent>
      </Card>

      <Toast toast={toast} onClose={closeToast} />
    </Box>
  );
};

export default PolicyEdit;