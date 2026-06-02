import React, { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Box, Typography, Chip,
} from "@mui/material";
import ticketApi from "../../utils/ticketApi";

const EMPTY_FORM = {
  title: "", description: "",
  caller: "",
  caller_email: "",
  channel: "self-service",
  impact: "low", urgency: "low",
  category: "general",
  subcategory: "",
  asset_id: "",
  assignment_group: "", assigned_to: "", created_by: "admin",
};

// Subcategories per category
const SUBCATEGORIES = {
  general: ["General Inquiry", "Other"],
  security: ["Malware", "Phishing", "Unauthorized Access", "Data Breach"],
  network: ["Connectivity", "VPN", "DNS", "Firewall"],
  hardware: ["Laptop", "Desktop", "Printer", "Monitor"],
  software: ["Installation", "Crash", "Performance", "License"],
};

const PRIORITY_MATRIX = {
  "high-high": "critical", "high-medium": "high", "high-low": "medium",
  "medium-high": "high", "medium-medium": "medium", "medium-low": "low",
  "low-high": "medium", "low-medium": "low", "low-low": "low",
};

const getPriorityColor = (p) => {
  switch (p) {
    case "critical": return "error";
    case "high": return "warning";
    case "medium": return "info";
    default: return "default";
  }
};

const CreateTicketModal = ({ open, handleClose, handleSave, showToast }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (open) setForm(EMPTY_FORM); }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Reset subcategory when category changes
    if (name === "category") {
      setForm({ ...form, category: value, subcategory: "" });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const previewPriority = PRIORITY_MATRIX[`${form.impact}-${form.urgency}`] || "low";
  const subcategoryOptions = SUBCATEGORIES[form.category] || [];

  const onSubmit = async () => {
    if (!form.title.trim()) { showToast("Title is required", "warning"); return; }
    if (!form.created_by.trim()) { showToast("Created by is required", "warning"); return; }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        asset_id: form.asset_id ? parseInt(form.asset_id, 10) : null,
        caller_email: form.caller_email.trim() || null,
      };
      const res = await ticketApi.createTicket(payload);
      handleSave(res);
      handleClose();
      showToast(`Ticket ${res.ticket_number} created successfully!`, "success");
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to create ticket", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>Create New Incident Ticket</DialogTitle>
      <DialogContent>
        {/* PRIORITY PREVIEW */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, mt: 1 }}>
          <Typography variant="body2" color="text.secondary">Calculated Priority:</Typography>
          <Chip label={previewPriority.toUpperCase()} color={getPriorityColor(previewPriority)} size="small" />
          <Typography variant="caption" color="text.secondary">(Impact + Urgency → Priority)</Typography>
        </Box>

        {/* Caller name + email row */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            margin="dense" label="Caller (Name)" name="caller"
            fullWidth value={form.caller} onChange={handleChange}
            placeholder="Name of the person raising this ticket"
          />
          <TextField
            margin="dense" label="Caller Email" name="caller_email"
            fullWidth type="email" value={form.caller_email} onChange={handleChange}
            placeholder="caller@example.com"
          />
        </Box>

        {/* Channel + Asset ID row */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            margin="dense" label="Channel" name="channel"
            select fullWidth value={form.channel} onChange={handleChange}
          >
            <MenuItem value="self-service">Self-Service</MenuItem>
            <MenuItem value="phone">Phone</MenuItem>
            <MenuItem value="email">Email</MenuItem>
            <MenuItem value="chat">Chat</MenuItem>
            <MenuItem value="walk-in">Walk-In</MenuItem>
          </TextField>
          <TextField
            margin="dense" label="Asset ID (optional)" name="asset_id"
            fullWidth type="number" value={form.asset_id} onChange={handleChange}
            placeholder="Link to an asset by ID"
            inputProps={{ min: 1 }}
          />
        </Box>

        <TextField
          margin="dense" label="Short Description (Title)" name="title"
          fullWidth required value={form.title} onChange={handleChange}
        />
        <TextField
          margin="dense" label="Description" name="description"
          fullWidth multiline rows={3} value={form.description} onChange={handleChange}
        />

        {/* Category + Subcategory */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            margin="dense" label="Category" name="category"
            select fullWidth value={form.category} onChange={handleChange}
          >
            <MenuItem value="general">General</MenuItem>
            <MenuItem value="security">Security</MenuItem>
            <MenuItem value="network">Network</MenuItem>
            <MenuItem value="hardware">Hardware</MenuItem>
            <MenuItem value="software">Software</MenuItem>
          </TextField>
          {/* ✅ NEW: Subcategory */}
          <TextField
            margin="dense" label="Subcategory" name="subcategory"
            select fullWidth value={form.subcategory} onChange={handleChange}
          >
            <MenuItem value="">-- None --</MenuItem>
            {subcategoryOptions.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Impact + Urgency */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            margin="dense" label="Impact" name="impact"
            select fullWidth value={form.impact} onChange={handleChange}
          >
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="low">Low</MenuItem>
          </TextField>
          <TextField
            margin="dense" label="Urgency" name="urgency"
            select fullWidth value={form.urgency} onChange={handleChange}
          >
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="low">Low</MenuItem>
          </TextField>
        </Box>

        {/* Assignment */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            margin="dense" label="Assignment Group" name="assignment_group"
            fullWidth value={form.assignment_group} onChange={handleChange}
            placeholder="e.g. IT Support"
          />
          <TextField
            margin="dense" label="Assigned To" name="assigned_to"
            fullWidth value={form.assigned_to} onChange={handleChange}
            placeholder="e.g. John Doe"
          />
        </Box>

        <TextField
          margin="dense" label="Created By" name="created_by"
          fullWidth required value={form.created_by} onChange={handleChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
        <Button variant="contained" onClick={onSubmit} disabled={submitting}>
          {submitting ? "Creating..." : "Create Ticket"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTicketModal;