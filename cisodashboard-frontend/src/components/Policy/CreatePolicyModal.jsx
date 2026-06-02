import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, FormControlLabel,
  Switch, Typography, Divider, Box,
} from "@mui/material";
import policyApi from "../../utils/policyApi";

const EMPTY_FORM = {
  name: "", description: "", category: "device_security",
  platform: "all", status: "active",
  require_screen_lock: false, min_password_length: 0,
  password_complexity: false, password_expiry_days: 0,
  bluetooth_disabled: false, usb_disabled: false, wifi_restricted: false,
  os_update_required: false, min_os_version: "",
  encryption_required: false,
};

const CreatePolicyModal = ({ open, handleClose, handleSave, showToast }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (open) setForm(EMPTY_FORM); }, [open]);

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
      const res = await policyApi.createPolicy(form);
      handleSave(res);
      handleClose();
      showToast("Policy created successfully!", "success");
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to create policy", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>Create New Policy</DialogTitle>
      <DialogContent>
        {/* BASIC INFO */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
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
        <Box sx={{ display: "flex", gap: 2 }}>
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
          </TextField>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* DEVICE SECURITY */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
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

        <Divider sx={{ my: 2 }} />

        {/* CONNECTIVITY */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
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

        <Divider sx={{ my: 2 }} />

        {/* OS UPDATE */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
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
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
        <Button variant="contained" onClick={onSubmit} disabled={submitting}>
          {submitting ? "Saving..." : "Save Policy"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePolicyModal;