// import React from 'react'

// const AddExpiryModel = () => {
//   return (
//     <div>AddExpiryModel</div>
//   )
// }

// export default AddExpiryModel

// components/AddExpiryModel.jsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Button,
  MenuItem,
  useMediaQuery,
  useTheme,
  Box,
  Typography,
  Divider,
  Input,
  Alert,
  CircularProgress,
} from "@mui/material";
import exceptionApi from "../../../utils/exceptionApi";

const AddExpiryModel = ({
  open,
  onClose,
  onSubmit,
  exceptions: exceptionsProp,
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // Load exceptions from prop only (NO mock data)
  const [exceptions, setExceptions] = useState([]);
  useEffect(() => {
    if (exceptionsProp && Array.isArray(exceptionsProp)) {
      setExceptions(exceptionsProp);
    } else {
      setExceptions([]);
    }
  }, [exceptionsProp]);

  const [formData, setFormData] = useState({
    exceptionId: "",
    expiryDate: "",
    reason: "",
    pocDocumentName: "",
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    if (!open) {
      // reset when closed
      setFormData({
        exceptionId: "",
        expiryDate: "",
        reason: "",
        pocDocumentName: "",
        notes: "",
      });
      setErrors({});
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "pocFile") {
      // store filename (you can extend to upload)
      const filename = files && files.length ? files[0].name : "";
      setFormData((prev) => ({ ...prev, pocDocumentName: filename }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.exceptionId)
      newErrors.exceptionId = "Please select an exception";
    if (!formData.expiryDate) newErrors.expiryDate = "Expiry date is required";

    // If selected exception has a startDate, ensure expiryDate > startDate
    const selected = exceptions.find((e) => e.id === formData.exceptionId);
    if (selected && selected.startDate && formData.expiryDate) {
      const start = new Date(selected.startDate);
      const expiry = new Date(formData.expiryDate);
      if (expiry <= start) {
        newErrors.expiryDate = "Expiry date must be after start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setApiError("");

    try {
      const payload = {
        expiryDate: formData.expiryDate,
        reason: formData.reason,
        notes: formData.notes,
      };

      console.log("🔄 Updating expiry for exception:", formData.exceptionId);
      await exceptionApi.updateExpiry(formData.exceptionId, payload);
      console.log("✅ Expiry updated successfully");

      if (onSubmit) onSubmit(payload);
      onClose();
    } catch (error) {
      console.error("❌ Error updating expiry:", error);
      setApiError(
        error.response?.data?.detail ||
          "Failed to update expiry. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: { xs: 1, sm: 2 },
          boxShadow: "0px 8px 32px rgba(0,0,0,0.15)",
        },
      }}
    >
      <DialogTitle>
        <Typography
          component="span"
          variant="h6"
          fontWeight="bold"
          color="primary"
        >
          Add / Update Expiry
        </Typography>
      </DialogTitle>

      <Divider />

      <DialogContent dividers>
        {apiError && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => setApiError("")}
          >
            {apiError}
          </Alert>
        )}

        <Box
          sx={{
            mt: 1,
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            justifyContent: "space-between",
          }}
        >
          {/* Row 1: Exception select + Expiry date */}
          <Box sx={{ flexBasis: { xs: "100%", sm: "48%" } }}>
            <TextField
              select
              label="Exception"
              name="exceptionId"
              fullWidth
              value={formData.exceptionId}
              onChange={handleChange}
              error={!!errors.exceptionId}
              helperText={
                errors.exceptionId || "Select the exception to update"
              }
            >
              {exceptions.map((ex) => (
                <MenuItem key={ex.id} value={ex.id}>
                  {ex.id} — {ex.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box sx={{ flexBasis: { xs: "100%", sm: "48%" } }}>
            <TextField
              label="Expiry Date"
              name="expiryDate"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.expiryDate}
              onChange={handleChange}
              error={!!errors.expiryDate}
              helperText={errors.expiryDate || ""}
            />
          </Box>

          {/* Row 2: Reason + POC file */}
          <Box sx={{ flexBasis: { xs: "100%", sm: "48%" } }}>
            <TextField
              label="Reason"
              name="reason"
              fullWidth
              value={formData.reason}
              onChange={handleChange}
              placeholder="E.g. contract extension, remediation delay"
            />
          </Box>

          <Box sx={{ flexBasis: { xs: "100%", sm: "48%" } }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Button
                variant="outlined"
                component="label"
                sx={{ textTransform: "none", width: "100%" }}
              >
                Upload POC Document
                <input
                  hidden
                  type="file"
                  name="pocFile"
                  onChange={handleChange}
                />
              </Button>
            </Box>
            <Typography
              variant="caption"
              sx={{ display: "block", mt: 0.5, color: "text.secondary" }}
            >
              {formData.pocDocumentName || "No file selected"}
            </Typography>
          </Box>

          {/* Row 3: Notes (full width) */}
          <Box sx={{ flexBasis: "100%" }}>
            <TextField
              label="Notes"
              name="notes"
              fullWidth
              multiline
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional context / owner / follow-up"
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          color="inherit"
          variant="outlined"
          sx={{ textTransform: "none" }}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          sx={{ textTransform: "none" }}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? "Saving..." : "Save Expiry"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddExpiryModel;
