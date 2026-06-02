import React, { useState, useEffect } from "react";
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
  Autocomplete,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dashboardTheme from "../../../theme/dashboardTheme";

const CERTIFICATION_TYPES = [
  "ISO 27001",
  "PCI-DSS v4",
  "SOC 2 Type II",
  "HIPAA",
  "GDPR Compliance",
  "ISO 9001",
  "ISO 14001",
  "NIST SP 800-53",
];

const INITIAL = {
  certificate_type: "",
  issue_date: null,
  expiry_date: null,
  issuing_authority: "",
  certificate_number: "",
  notes: "",
};

/**
 * AddExpiryModal — adds a new compliance certificate for an existing vendor.
 * Calls onAddExpiry({ vendor_id, ...certFields }) on submit.
 *
 * Props:
 *   open        – boolean
 *   onClose     – () => void
 *   onAddExpiry – async (payload) => void   (called on successful form submit)
 *   vendors     – array of vendor objects from GET /api/v1/vendors/
 */
const AddExpiryModal = ({ open, onClose, onAddExpiry, vendors = [] }) => {
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedVendor(null);
      setForm(INITIAL);
      setErrors({});
    }
  }, [open]);

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
    if (!selectedVendor) e.vendor = "Please select a vendor";
    if (!form.certificate_type)
      e.certificate_type = "Certification type is required";
    if (!form.issue_date) e.issue_date = "Issue date is required";
    if (!form.expiry_date) e.expiry_date = "Expiry date is required";
    if (
      form.issue_date &&
      form.expiry_date &&
      new Date(form.expiry_date) <= new Date(form.issue_date)
    ) {
      e.expiry_date = "Expiry date must be after issue date";
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
      await onAddExpiry({
        vendor_id: selectedVendor.id,
        certificate_type: form.certificate_type,
        issue_date: toDateStr(form.issue_date),
        expiry_date: toDateStr(form.expiry_date),
        issuing_authority: form.issuing_authority || undefined,
        certificate_number: form.certificate_number || undefined,
        notes: form.notes || undefined,
      });
      setSelectedVendor(null);
      setForm(INITIAL);
      setErrors({});
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to add certificate. Please try again.";
      setErrors({ submit: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
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
          Add Certification Expiry
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

        {/* Vendor Selection */}
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          Select Vendor
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Autocomplete
          options={vendors}
          getOptionLabel={(option) => option.name || ""}
          value={selectedVendor}
          onChange={(_, newValue) => {
            setSelectedVendor(newValue);
            if (errors.vendor) setErrors((prev) => ({ ...prev, vendor: null }));
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              label="Vendor Name *"
              error={!!errors.vendor}
              helperText={errors.vendor}
              sx={{ mb: 3 }}
            />
          )}
          renderOption={({ key, ...props }, option) => (
            <Box key={key} component="li" {...props}>
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Typography variant="body2">{option.name}</Typography>
                {option.category && (
                  <Typography variant="caption" color="text.secondary">
                    {option.category}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
          noOptionsText={
            vendors.length === 0 ? "Loading vendors..." : "No vendors found"
          }
        />

        {/* Certificate Details */}
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          Certificate Details
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: "grid", gap: 2 }}>
          <FormControl size="small" fullWidth error={!!errors.certificate_type}>
            <InputLabel>Certification Type *</InputLabel>
            <Select
              name="certificate_type"
              value={form.certificate_type}
              label="Certification Type *"
              onChange={handleChange}
            >
              {CERTIFICATION_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </Select>
            {errors.certificate_type && (
              <Typography
                variant="caption"
                color="error"
                sx={{ mt: 0.5, ml: 1.5 }}
              >
                {errors.certificate_type}
              </Typography>
            )}
          </FormControl>

          <TextField
            size="small"
            label="Certificate Number"
            name="certificate_number"
            value={form.certificate_number}
            onChange={handleChange}
          />

          <TextField
            size="small"
            label="Issuing Authority"
            name="issuing_authority"
            value={form.issuing_authority}
            onChange={handleChange}
          />

          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "1fr 1fr" }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Issue Date *"
                value={form.issue_date}
                onChange={(v) => handleDateChange("issue_date", v)}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    error: !!errors.issue_date,
                    helperText: errors.issue_date,
                  },
                }}
              />
            </LocalizationProvider>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Expiry Date *"
                value={form.expiry_date}
                onChange={(v) => handleDateChange("expiry_date", v)}
                minDate={form.issue_date || undefined}
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                    error: !!errors.expiry_date,
                    helperText: errors.expiry_date,
                  },
                }}
              />
            </LocalizationProvider>
          </Box>

          <TextField
            size="small"
            label="Notes"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            multiline
            rows={2}
          />
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
            background: "linear-gradient(45deg, #3f51b5 30%, #536dfe 90%)",
            fontWeight: 700,
          }}
        >
          {submitting ? "Saving..." : "Add Certificate"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddExpiryModal;
