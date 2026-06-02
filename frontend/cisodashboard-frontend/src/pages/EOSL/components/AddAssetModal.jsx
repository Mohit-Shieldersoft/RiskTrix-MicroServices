import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  IconButton,
  Typography,
  Box,
  Divider,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { createEOSLAsset } from "../../../utils/eoslApi";

const initialFormData = {
  name: "",
  owner: "",
  type: "",
  eoslType: "",
  date: "",
  remark: "",
};

const assetTypes = [
  "Server",
  "Network Switch",
  "Database",
  "Firewall",
  "Router",
  "Storage Array",
  "Load Balancer",
  "Workstation",
  "Virtual Machine",
  "Container Host",
  "VPN Gateway",
  "Backup System",
];

const eoslTypes = ["EOS", "EOL"];

const AddAssetModal = ({ open, onClose, onAddAsset }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Asset name is required";
    if (!formData.owner.trim()) newErrors.owner = "Owner is required";
    if (!formData.type) newErrors.type = "Asset type is required";
    if (!formData.eoslType) newErrors.eoslType = "EOSL type is required";
    if (!formData.date) newErrors.date = "Date is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setApiError(null);
    try {
      const created = await createEOSLAsset({
        name: formData.name,
        owner: formData.owner,
        type: formData.type,
        eoslType: formData.eoslType,
        date: formData.date,
        remark: formData.remark,
      });
      onAddAsset(created);
      handleClose();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (Array.isArray(detail)) {
        setApiError(detail.map((d) => d.msg || JSON.stringify(d)).join("; "));
      } else {
        setApiError(
          typeof detail === "string"
            ? detail
            : "Failed to create asset. Please try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setFormData(initialFormData);
    setErrors({});
    setApiError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, boxShadow: "0 10px 40px rgba(0,0,0,0.1)" },
      }}
    >
      <DialogTitle
        sx={{
          p: 2,
          bgcolor: "#f8f9fb",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <AddCircleOutlineIcon sx={{ color: "#1976D2" }} />
        <Typography
          variant="h6"
          component="span"
          sx={{ fontWeight: "bold", flexGrow: 1 }}
        >
          Add New Asset
        </Typography>
        <IconButton
          edge="end"
          color="inherit"
          onClick={handleClose}
          aria-label="close"
          disabled={submitting}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 3 }}>
        {apiError && (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              bgcolor: "#FFEBEE",
              borderRadius: 1,
              border: "1px solid #FFCDD2",
            }}
          >
            <Typography variant="body2" color="error">
              {typeof apiError === "string"
                ? apiError
                : "Failed to create asset. Please try again."}
            </Typography>
          </Box>
        )}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="name"
              label="Asset Name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.name}
              helperText={errors.name}
              placeholder="e.g. Web Server 01"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="owner"
              label="Owner"
              value={formData.owner}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.owner}
              helperText={errors.owner}
              placeholder="e.g. John Smith"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth required error={!!errors.type}>
              <InputLabel id="asset-type-label">Asset Type</InputLabel>
              <Select
                labelId="asset-type-label"
                name="type"
                value={formData.type}
                label="Asset Type"
                onChange={handleChange}
              >
                {assetTypes.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
              {errors.type && (
                <Typography variant="caption" color="error">
                  {errors.type}
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth required error={!!errors.eoslType}>
              <InputLabel id="eosl-type-label">EOSL Type</InputLabel>
              <Select
                labelId="eosl-type-label"
                name="eoslType"
                value={formData.eoslType}
                label="EOSL Type"
                onChange={handleChange}
              >
                {eoslTypes.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t} &mdash; {t === "EOS" ? "End of Support" : "End of Life"}
                  </MenuItem>
                ))}
              </Select>
              {errors.eoslType && (
                <Typography variant="caption" color="error">
                  {errors.eoslType}
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="date"
              label="EOSL Date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.date}
              helperText={errors.date}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="remark"
              label="Remark"
              value={formData.remark}
              onChange={handleChange}
              fullWidth
              multiline
              rows={2}
              placeholder="Optional notes about this asset..."
            />
          </Grid>
        </Grid>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={submitting}
          variant="outlined"
          color="inherit"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          variant="contained"
          startIcon={
            submitting ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <AddCircleOutlineIcon />
            )
          }
          sx={{ bgcolor: "#1976D2", "&:hover": { bgcolor: "#1565C0" } }}
        >
          {submitting ? "Adding..." : "Add Asset"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddAssetModal;
