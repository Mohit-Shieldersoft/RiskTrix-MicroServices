import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  MenuItem,
  IconButton,
  Typography,
  Divider,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dashboardTheme from "../../../theme/dashboardTheme";

const CATEGORIES = [
  "IT Services",
  "Security",
  "Cloud Provider",
  "Data Processing",
  "Infrastructure",
  "Development",
  "Hosting",
  "Internet",
];

const CERTIFICATION_TYPES = [
  "ISO 27001",
  "PCI-DSS v4",
  "SOC 2 Type II",
  "HIPAA",
  "GDPR Compliance",
];

const INITIAL = {
  name: "",
  category: "",
  contactEmail: "",
  contactName: "",
  applicationName: "",
  certificationType: "",
  startDate: null,
  expiryDate: null,
};

const AddVendorModal = ({ open, onClose, onAddVendor }) => {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleDateChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Vendor name is required";
    if (!form.category) e.category = "Category is required";
    if (!form.certificationType)
      e.certificationType = "Certification type is required";
    if (!form.startDate) e.startDate = "Issue date is required";
    if (!form.expiryDate) e.expiryDate = "Expiry date is required";
    if (
      form.startDate &&
      form.expiryDate &&
      new Date(form.expiryDate) <= new Date(form.startDate)
    ) {
      e.expiryDate = "Expiry date must be after issue date";
    }
    if (
      form.contactEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)
    ) {
      e.contactEmail = "Please enter a valid email";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const toDateStr = (d) =>
    d ? (d instanceof Date ? d.toISOString().split("T")[0] : String(d)) : null;

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onAddVendor({
        name: form.name.trim(),
        category: form.category,
        contact_email: form.contactEmail || undefined,
        contact_phone: form.contactName || undefined,
        risk_level: "medium",
        application_name: form.applicationName || undefined,
        certificate_type: form.certificationType,
        certificate_issue_date: toDateStr(form.startDate),
        certificate_expiry_date: toDateStr(form.expiryDate),
      });
      setForm(INITIAL);
      setErrors({});
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to create vendor. Please try again.";
      setErrors({ submit: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setForm(INITIAL);
    setErrors({});
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: dashboardTheme.borderRadius?.lg ?? 2,
          boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          maxHeight: "85vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          bgcolor: dashboardTheme.colors?.background?.card ?? "transparent",
          borderBottom: "1px solid rgba(0,0,0,0.05)",
        }}
      >
        <Typography variant="h6" component="span" fontWeight={700}>
          Add New Vendor
        </Typography>
        <IconButton
          onClick={handleClose}
          disabled={submitting}
          sx={{ position: "absolute", right: 12, top: 12, color: "grey.500" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {errors.submit && (
          <Box sx={{ mb: 2, p: 1.5, bgcolor: "error.light", borderRadius: 1 }}>
            <Typography color="error" variant="body2">
              {errors.submit}
            </Typography>
          </Box>
        )}

        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          Vendor Information
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            mb: 3,
          }}
        >
          <TextField
            size="small"
            label="Vendor Name *"
            name="name"
            value={form.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
          />
          <FormControl size="small" fullWidth error={!!errors.category}>
            <InputLabel>Category *</InputLabel>
            <Select
              name="category"
              value={form.category}
              label="Category *"
              onChange={handleChange}
            >
              {CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </Select>
            {errors.category && (
              <Typography
                variant="caption"
                color="error"
                sx={{ mt: 0.5, ml: 1.5 }}
              >
                {errors.category}
              </Typography>
            )}
          </FormControl>
          <TextField
            size="small"
            label="Contact Name"
            name="contactName"
            value={form.contactName}
            onChange={handleChange}
          />
          <TextField
            size="small"
            label="Contact Email"
            name="contactEmail"
            type="email"
            value={form.contactEmail}
            onChange={handleChange}
            error={!!errors.contactEmail}
            helperText={errors.contactEmail}
          />
        </Box>

        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          Application & Certification Details
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          }}
        >
          <TextField
            size="small"
            label="Application Name"
            name="applicationName"
            value={form.applicationName}
            onChange={handleChange}
          />
          <FormControl
            size="small"
            fullWidth
            error={!!errors.certificationType}
          >
            <InputLabel>Certification Type *</InputLabel>
            <Select
              name="certificationType"
              value={form.certificationType}
              label="Certification Type *"
              onChange={handleChange}
            >
              {CERTIFICATION_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
            {errors.certificationType && (
              <Typography
                variant="caption"
                color="error"
                sx={{ mt: 0.5, ml: 1.5 }}
              >
                {errors.certificationType}
              </Typography>
            )}
          </FormControl>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Issue Date *"
              value={form.startDate}
              onChange={(v) => handleDateChange("startDate", v)}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  error: !!errors.startDate,
                  helperText: errors.startDate,
                },
              }}
            />
          </LocalizationProvider>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Expiry Date *"
              value={form.expiryDate}
              onChange={(v) => handleDateChange("expiryDate", v)}
              minDate={form.startDate || undefined}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  error: !!errors.expiryDate,
                  helperText: errors.expiryDate,
                },
              }}
            />
          </LocalizationProvider>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{ px: 3, py: 2, borderTop: "1px solid rgba(0,0,0,0.05)" }}
      >
        <Button
          onClick={handleClose}
          variant="outlined"
          disabled={submitting}
          sx={{ borderRadius: 2 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
          startIcon={
            submitting ? <CircularProgress size={16} color="inherit" /> : null
          }
          sx={{
            borderRadius: 2,
            background: "linear-gradient(45deg, #f50057 30%, #ff4081 90%)",
            fontWeight: 700,
          }}
        >
          {submitting ? "Saving..." : "Add Vendor"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddVendorModal;
