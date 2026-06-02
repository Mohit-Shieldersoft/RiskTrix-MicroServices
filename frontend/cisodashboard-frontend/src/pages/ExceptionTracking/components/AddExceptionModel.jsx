import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  useMediaQuery,
  useTheme,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import exceptionApi from "../../../utils/exceptionApi";

const AddExceptionModel = ({ open, onClose, onSubmit }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [formData, setFormData] = useState({
    exceptionName: "",
    category: "",
    severity: "",
    description: "",
    startDate: "",
    endDate: "",
    comments: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [optionsData, setOptionsData] = useState({
    categories: [],
    severities: [],
  });

  // Load form options from API
  useEffect(() => {
    const loadOptions = async () => {
      try {
        // For now, use static options that match backend enums
        setOptionsData({
          categories: [
            { value: "compliance", label: "Compliance" },
            { value: "technical", label: "Technical" },
            { value: "operational", label: "Operational" },
            { value: "other", label: "Other" },
          ],
          severities: [
            { value: "critical", label: "Critical" },
            { value: "high", label: "High" },
            { value: "medium", label: "Medium" },
            { value: "low", label: "Low" },
          ],
        });
      } catch (error) {
        console.error("Error loading form options:", error);
        setSubmitError("Failed to load form options");
      }
    };

    if (open) {
      loadOptions();
    }
  }, [open]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setFormData({
        exceptionName: "",
        category: "",
        severity: "",
        description: "",
        startDate: "",
        endDate: "",
        comments: "",
      });
      setErrors({});
      setSubmitError("");
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setSubmitError("");
  };

  const validate = () => {
    let newErrors = {};

    if (!formData.exceptionName?.trim()) {
      newErrors.exceptionName = "Exception Name is required";
    }
    if (!formData.category) {
      newErrors.category = "Category is required";
    }
    if (!formData.severity) {
      newErrors.severity = "Severity is required";
    }
    if (!formData.description?.trim()) {
      newErrors.description = "Description is required";
    }
    if (!formData.startDate) {
      newErrors.startDate = "Start Date is required";
    }
    if (!formData.endDate) {
      newErrors.endDate = "End Date is required";
    }

    // Validate date logic
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      if (startDate >= endDate) {
        newErrors.endDate = "End Date must be after Start Date";
      }
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    setSubmitError("");

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setLoading(true);

      try {
        // Transform data for API
        const apiData = {
          exception_name: formData.exceptionName.trim(),
          category: formData.category,
          severity: formData.severity,
          risk_assessment: formData.description.trim(), // Map description to risk_assessment
          start_date: formData.startDate,
          end_date: formData.endDate,
          comments: formData.comments?.trim() || null,
          status: "active", // Default status
        };

        const newException = await exceptionApi.createException(apiData);

        // Call parent component's onSubmit with the new exception
        if (onSubmit) {
          onSubmit(newException);
        }

        onClose();
      } catch (error) {
        console.error("Error creating exception:", error);

        if (error.response?.data?.detail) {
          if (typeof error.response.data.detail === "string") {
            setSubmitError(error.response.data.detail);
          } else if (Array.isArray(error.response.data.detail)) {
            setSubmitError(
              error.response.data.detail.map((err) => err.msg).join(", "),
            );
          } else {
            setSubmitError(
              "Failed to create exception. Please check your input.",
            );
          }
        } else if (error.message) {
          setSubmitError(error.message);
        } else {
          setSubmitError("Failed to create exception. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // Form validation function
  const isFormValid = () => {
    return (
      formData.exceptionName?.trim() &&
      formData.category &&
      formData.severity &&
      formData.description?.trim() &&
      formData.startDate &&
      formData.endDate
    );
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
          Add New Exception
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
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
          {/* Row 1 */}
          <Box sx={{ flexBasis: { xs: "100%", sm: "48%" } }}>
            <TextField
              label="Exception Name"
              name="exceptionName"
              fullWidth
              value={formData.exceptionName}
              onChange={handleChange}
              error={!!errors.exceptionName}
              helperText={errors.exceptionName}
              disabled={loading}
              required
            />
          </Box>

          <Box sx={{ flexBasis: { xs: "100%", sm: "48%" } }}>
            <TextField
              select
              label="Category"
              name="category"
              fullWidth
              value={formData.category}
              onChange={handleChange}
              error={!!errors.category}
              helperText={errors.category}
              disabled={loading}
              required
            >
              {optionsData.categories.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Row 2 */}
          <Box sx={{ flexBasis: { xs: "100%", sm: "48%" } }}>
            <TextField
              select
              label="Severity"
              name="severity"
              fullWidth
              value={formData.severity}
              onChange={handleChange}
              error={!!errors.severity}
              helperText={errors.severity}
              disabled={loading}
              required
            >
              {optionsData.severities.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box sx={{ flexBasis: { xs: "100%", sm: "48%" } }}>
            <TextField
              label="Description"
              name="description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={handleChange}
              error={!!errors.description}
              helperText={errors.description}
              disabled={loading}
              required
            />
          </Box>

          {/* Row 3 */}
          <Box sx={{ flexBasis: { xs: "100%", sm: "48%" } }}>
            <TextField
              label="Start Date"
              name="startDate"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.startDate}
              onChange={handleChange}
              error={!!errors.startDate}
              helperText={errors.startDate}
              disabled={loading}
              required
            />
          </Box>

          <Box sx={{ flexBasis: { xs: "100%", sm: "48%" } }}>
            <TextField
              label="End Date"
              name="endDate"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.endDate}
              onChange={handleChange}
              error={!!errors.endDate}
              helperText={errors.endDate}
              disabled={loading}
              required
            />
          </Box>

          {/* Comments (Full Width) */}
          <Box sx={{ flexBasis: "100%" }}>
            <TextField
              label="Comments"
              name="comments"
              multiline
              rows={3}
              fullWidth
              value={formData.comments}
              onChange={handleChange}
              error={!!errors.comments}
              helperText={errors.comments}
              disabled={loading}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          color="inherit"
          variant="outlined"
          disabled={loading}
          sx={{
            borderRadius: 2,
            textTransform: "none",
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={loading || !isFormValid()}
          startIcon={loading ? <CircularProgress size={20} /> : null}
          sx={{
            borderRadius: 2,
            textTransform: "none",
          }}
        >
          {loading ? "Saving..." : "Save Exception"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddExceptionModel;
