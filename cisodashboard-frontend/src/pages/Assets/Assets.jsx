import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  TextField,
  Grid,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import AssetTable from "../../components/Assets/AssetTable";
import assetApi from "../../utils/assetApi";
import Toast from "../../components/common/Toast";
import { useToast } from "../../components/common/useToast";
import { useNavigate } from "react-router-dom";
import usePermissions from "../../hooks/usePermissions";
import { hasPermission } from "../../utils/permissions";

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [riskFilter, setRiskFilter] = useState("all");
  const { toast, showToast, closeToast } = useToast();
  const [editAsset, setEditAsset] = useState(null);
const navigate = useNavigate();
const { can } = usePermissions();
  // ── Import dialog state ──
  const [importOpen, setImportOpen]     = useState(false);
  const [importFile, setImportFile]     = useState(null);
  const [importing, setImporting]       = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError]   = useState(null);

  const fetchAssets = async () => {
    try {
      const data = await assetApi.getAssets();
      if (data?.length) {
        setAssets(data);
      } else if (data?.items?.length) {
        setAssets(data.items);
      } else {
        setAssets([]);
      }
    } catch (err) {
      console.error("Error fetching assets", err);
      showToast("Failed to load assets. Check API connection.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.name
      .toLowerCase()
      .includes(search.toLowerCase());
    // ✅ FIX: case-insensitive filter match
    const matchesRisk =
      riskFilter === "all" || asset.risk_level?.toLowerCase() === riskFilter;
    return matchesSearch && matchesRisk;
  });

  // ✅ FIX: toLowerCase() so HIGH/High/high all count correctly
  const total = assets.length;
  const highRisk = assets.filter(
    (a) => a.risk_level?.toLowerCase() === "high",
  ).length;
  const mediumRisk = assets.filter(
    (a) => a.risk_level?.toLowerCase() === "medium",
  ).length;
  const lowRisk = assets.filter(
    (a) => a.risk_level?.toLowerCase() === "low",
  ).length;

  const handleSave = (newAsset) => {
    setAssets((prev) => [...prev, newAsset]);
  };

  const handleUpdate = (updatedAsset) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === updatedAsset.id ? updatedAsset : a)),
    );
  };
   const handleDelete = (deletedId) => {
  setAssets((prev) => prev.filter((a) => a.id !== deletedId));
};


  return (
    <Box sx={{ p: 3 }}>
      {/* HEADER */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Asset Inventory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and monitor all registered assets
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          {hasPermission("assets", "create") && (
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              onClick={() => { setImportFile(null); setImportResult(null); setImportError(null); setImportOpen(true); }}
            >
              Import Excel
            </Button>
          )}
          {hasPermission("assets", "create") && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpen(true)}
            >
              Create Asset
            </Button>
          )}
        </Box>
      </Box>

      {/* SUMMARY */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Total Assets", value: total },
          { label: "High Risk", value: highRisk, color: "error.main" },
          { label: "Medium Risk", value: mediumRisk, color: "warning.main" },
          { label: "Low Risk", value: lowRisk, color: "success.main" },
        ].map((item, i) => (
          // ✅ FIX: MUI Grid v2 syntax
          <Grid size={{ xs: 12, md: 3 }} key={i}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2">{item.label}</Typography>
                <Typography variant="h5" sx={{ color: item.color }}>
                  {item.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* SEARCH + FILTER */}
      <Box sx={{ mb: 2, display: "flex", gap: 2, alignItems: "center" }}>
        <TextField
          placeholder="Search assets..."
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        {["all", "high", "medium", "low"].map((level) => (
          <Chip
            key={level}
            label={level.charAt(0).toUpperCase() + level.slice(1)}
            color={
              level === "high"
                ? "error"
                : level === "medium"
                  ? "warning"
                  : level === "low"
                    ? "success"
                    : "default"
            }
            variant={riskFilter === level ? "filled" : "outlined"}
            onClick={() => setRiskFilter(level)}
            clickable
          />
        ))}
      </Box>

      {/* TABLE */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : filteredAssets.length === 0 ? (
        <Box sx={{ textAlign: "center", mt: 5 }}>
          <Typography color="text.secondary">No assets found</Typography>
          {assets.length === 0 && (
            <Button
              sx={{ mt: 2 }}
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setOpen(true)}
            >
              Create your first asset
            </Button>
          )}
        </Box>
      ) : (
        <AssetTable
          assets={filteredAssets}
          onEdit={(asset) => setEditAsset(asset)}
          onView={(asset) => navigate(`/assets/${asset.id}`)}
          onDelete={handleDelete}
          showToast={showToast}
        />
      )}

      <CreateAssetModal
        open={open}
        handleClose={() => setOpen(false)}
        handleSave={handleSave}
        showToast={showToast}
      />

      <EditAssetModal
        asset={editAsset}
        open={!!editAsset}
        handleClose={() => setEditAsset(null)}
        handleUpdate={handleUpdate}
        showToast={showToast}
      />
      <Toast toast={toast} onClose={closeToast} />

      {/* ── BULK IMPORT DIALOG ── */}
      <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Assets from Excel / CSV</DialogTitle>
        <DialogContent>
          {!importResult ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload a <strong>.xlsx</strong> or <strong>.csv</strong> file. Every row becomes one asset.
                All sheets in an Excel workbook are processed automatically.<br /><br />
                <strong>Recognised columns (flexible naming):</strong><br />
                <code>Device make &amp; Model</code>, <code>Serial Number</code>, <code>U Space</code>,{" "}
                <code>Power Source</code>, <code>Power watts</code>, <code>Type</code>,{" "}
                <code>Risk Level</code>, <code>Location</code>, <code>Site</code>, <code>Notes</code>
              </Typography>

              {/* Drop zone */}
              <Box
                sx={{
                  border: "2px dashed",
                  borderColor: importFile ? "primary.main" : "grey.400",
                  borderRadius: 2,
                  p: 4,
                  textAlign: "center",
                  cursor: "pointer",
                  bgcolor: importFile ? "primary.50" : "grey.50",
                  transition: "all 0.2s",
                  "&:hover": { borderColor: "primary.main", bgcolor: "primary.50" },
                }}
                onClick={() => document.getElementById("asset-import-input").click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files[0];
                  if (f) { setImportFile(f); setImportError(null); }
                }}
              >
                <UploadFileIcon sx={{ fontSize: 48, color: importFile ? "primary.main" : "grey.400", mb: 1 }} />
                <Typography variant="body1" fontWeight={500} color={importFile ? "primary.main" : "text.secondary"}>
                  {importFile ? importFile.name : "Click or drag & drop your file here"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Supported formats: .xlsx, .xls, .csv
                </Typography>
                <input
                  id="asset-import-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  hidden
                  onChange={(e) => { setImportFile(e.target.files[0] || null); setImportError(null); }}
                />
              </Box>

              {importError && (
                <Box sx={{ mt: 2, p: 2, bgcolor: "error.50", borderRadius: 1, border: "1px solid", borderColor: "error.light" }}>
                  <Typography color="error.main" variant="body2">{importError}</Typography>
                </Box>
              )}
            </>
          ) : (
            /* ── Results view ── */
            <Box>
              <Box sx={{ display: "flex", gap: 3, mb: 3, justifyContent: "center" }}>
                <Box sx={{ textAlign: "center" }}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 40, color: "success.main" }} />
                  <Typography variant="h4" color="success.main" fontWeight="bold">{importResult.success}</Typography>
                  <Typography variant="caption" color="text.secondary">Assets Added</Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <ErrorOutlineIcon sx={{ fontSize: 40, color: importResult.failed > 0 ? "error.main" : "grey.400" }} />
                  <Typography variant="h4" color={importResult.failed > 0 ? "error.main" : "text.secondary"} fontWeight="bold">{importResult.failed}</Typography>
                  <Typography variant="caption" color="text.secondary">Skipped / Failed</Typography>
                </Box>
              </Box>

              <Box sx={{ p: 2, bgcolor: importResult.failed === 0 ? "success.50" : "warning.50", borderRadius: 1, mb: 2 }}>
                <Typography variant="body2">{importResult.message}</Typography>
              </Box>

              {importResult.errors?.length > 0 && (
                <Box sx={{ maxHeight: 200, overflow: "auto" }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Row-level errors:</Typography>
                  {importResult.errors.map((e, i) => (
                    <Box key={i} sx={{ display: "flex", gap: 1, mb: 0.5, p: 1, bgcolor: "error.50", borderRadius: 1 }}>
                      <ErrorOutlineIcon sx={{ fontSize: 16, color: "error.main", mt: 0.2, flexShrink: 0 }} />
                      <Typography variant="caption" color="error.dark">{e.error}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => { setImportOpen(false); setImportResult(null); setImportFile(null); setImportError(null); }}
          >
            {importResult ? "Close" : "Cancel"}
          </Button>
          {!importResult && (
            <Button
              variant="contained"
              startIcon={importing ? null : <UploadFileIcon />}
              disabled={!importFile || importing}
              onClick={async () => {
                setImporting(true);
                setImportError(null);
                try {
                  const result = await assetApi.importAssets(importFile);
                  setImportResult(result);
                  if (result.success > 0) fetchAssets();
                } catch (err) {
                  setImportError(err.message || "Import failed. Please check your file.");
                } finally {
                  setImporting(false);
                }
              }}
            >
              {importing ? "Importing..." : "Import"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Assets;

/* ================= MODAL ================= */

const EMPTY_FORM = {
  name: "", type: "web_application", risk_level: "low",
  vendor: "", owner: "", custodian: "", ip_address: "", hostname: "",
  purchase_date: "", warranty_expiry: "", end_of_life_date: "",
  business_criticality: "", tags: "", compliance_scope: "",
};

const CreateAssetModal = ({ open, handleClose, handleSave, showToast }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setForm(EMPTY_FORM);
  }, [open]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async () => {
    if (!form.name.trim()) {
      showToast("Asset name is required", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const res = await assetApi.createAsset(form);
      if (!res) throw new Error("No response from server");

      handleSave(res);
      handleClose();
      showToast("Asset created successfully!", "success");
    } catch (err) {
      console.error("CREATE ASSET ERROR:", err);
      showToast(
        err?.response?.data?.detail || "Failed to create asset",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Create New Asset</DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          label="Asset Name"
          name="name"
          fullWidth
          required
          value={form.name}
          onChange={handleChange}
          error={form.name !== "" && !form.name.trim()}
          helperText={
            form.name !== "" && !form.name.trim()
              ? "Asset name cannot be empty"
              : ""
          }
        />
        <TextField
          margin="dense"
          label="Type"
          name="type"
          select
          fullWidth
          value={form.type}
          onChange={handleChange}
        >
          <MenuItem value="web_application">Web Application</MenuItem>
          <MenuItem value="mobile_application">Mobile Application</MenuItem>
          <MenuItem value="api">API</MenuItem>
          <MenuItem value="server">Server</MenuItem>
          <MenuItem value="database">Database</MenuItem>
          <MenuItem value="network_device">Network Device</MenuItem>
          <MenuItem value="endpoint">Endpoint</MenuItem>
          <MenuItem value="cloud_service">Cloud Service</MenuItem>
          <MenuItem value="iot_device">IoT Device</MenuItem>
          <MenuItem value="container">Container</MenuItem>
          <MenuItem value="firewall">Firewall</MenuItem>
          <MenuItem value="router">Router</MenuItem>
          <MenuItem value="switch">Switch</MenuItem>
          <MenuItem value="load_balancer">Load Balancer</MenuItem>
        </TextField>
        <TextField
          margin="dense"
          label="Risk Level"
          name="risk_level"
          select
          fullWidth
          value={form.risk_level}
          onChange={handleChange}
        >
          <MenuItem value="low">Low</MenuItem>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="high">High</MenuItem>
        </TextField>

        {/* ── Lifecycle & Classification ── */}
        <TextField margin="dense" label="Business Criticality" name="business_criticality" select fullWidth value={form.business_criticality} onChange={handleChange}>
          <MenuItem value="">— Not set —</MenuItem>
          <MenuItem value="critical">Critical</MenuItem>
          <MenuItem value="high">High</MenuItem>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="low">Low</MenuItem>
        </TextField>
        <TextField margin="dense" label="Tags (comma-separated)" name="tags" fullWidth placeholder="PCI-DSS,HIPAA,SOC2" value={form.tags} onChange={handleChange} />
        <TextField margin="dense" label="Compliance Scope" name="compliance_scope" fullWidth placeholder="PCI-DSS,ISO27001" value={form.compliance_scope} onChange={handleChange} />
        <TextField margin="dense" label="Vendor / Manufacturer" name="vendor" fullWidth value={form.vendor} onChange={handleChange} />
        <TextField margin="dense" label="Owner" name="owner" fullWidth value={form.owner} onChange={handleChange} />
        <TextField margin="dense" label="Custodian" name="custodian" fullWidth value={form.custodian} onChange={handleChange} />
        <TextField margin="dense" label="IP Address" name="ip_address" fullWidth value={form.ip_address} onChange={handleChange} />
        <TextField margin="dense" label="Hostname" name="hostname" fullWidth value={form.hostname} onChange={handleChange} />
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField margin="dense" label="Purchase Date" name="purchase_date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.purchase_date} onChange={handleChange} />
          <TextField margin="dense" label="Warranty Expiry" name="warranty_expiry" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.warranty_expiry} onChange={handleChange} />
          <TextField margin="dense" label="End of Life" name="end_of_life_date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.end_of_life_date} onChange={handleChange} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSubmit} disabled={submitting}>
          {submitting ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const EditAssetModal = ({
  open,
  asset,
  handleClose,
  handleUpdate,
  showToast,
}) => {
  const [form, setForm] = useState({
    name: "", type: "web_application", risk_level: "low",
    vendor: "", owner: "", custodian: "", ip_address: "", hostname: "",
    purchase_date: "", warranty_expiry: "", end_of_life_date: "",
    business_criticality: "", tags: "", compliance_scope: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill form when asset changes
  useEffect(() => {
    if (asset) {
      setForm({
        name: asset.name || "",
        type: asset.type || "web_application",
        risk_level: asset.risk_level || "low",
        vendor: asset.vendor || "",
        owner: asset.owner || "",
        custodian: asset.custodian || "",
        ip_address: asset.ip_address || "",
        hostname: asset.hostname || "",
        purchase_date: asset.purchase_date || "",
        warranty_expiry: asset.warranty_expiry || "",
        end_of_life_date: asset.end_of_life_date || "",
        business_criticality: asset.business_criticality || "",
        tags: asset.tags || "",
        compliance_scope: asset.compliance_scope || "",
      });
    }
  }, [asset]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async () => {
    if (!form.name.trim()) {
      showToast("Asset name is required", "warning");
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form, changed_by: "admin" };
      const res = await assetApi.updateAsset(asset.id, payload);
      if (!res) throw new Error("No response from server");
      handleUpdate(res);
      handleClose();
      showToast("Asset updated successfully!", "success");
    } catch (err) {
      console.error("UPDATE ASSET ERROR:", err);
      showToast(err?.response?.data?.detail || "Failed to update asset", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Asset</DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          label="Asset Name"
          name="name"
          fullWidth
          required
          value={form.name}
          onChange={handleChange}
          error={form.name !== "" && !form.name.trim()}
          helperText={
            form.name !== "" && !form.name.trim()
              ? "Asset name cannot be empty"
              : ""
          }
        />
        <TextField
          margin="dense"
          label="Type"
          name="type"
          select
          fullWidth
          value={form.type}
          onChange={handleChange}
        >
          <MenuItem value="web_application">Web Application</MenuItem>
          <MenuItem value="mobile_application">Mobile Application</MenuItem>
          <MenuItem value="api">API</MenuItem>
          <MenuItem value="server">Server</MenuItem>
          <MenuItem value="database">Database</MenuItem>
          <MenuItem value="network_device">Network Device</MenuItem>
          <MenuItem value="endpoint">Endpoint</MenuItem>
          <MenuItem value="cloud_service">Cloud Service</MenuItem>
          <MenuItem value="iot_device">IoT Device</MenuItem>
          <MenuItem value="container">Container</MenuItem>
          <MenuItem value="firewall">Firewall</MenuItem>
          <MenuItem value="router">Router</MenuItem>
          <MenuItem value="switch">Switch</MenuItem>
          <MenuItem value="load_balancer">Load Balancer</MenuItem>
        </TextField>
        <TextField
          margin="dense"
          label="Risk Level"
          name="risk_level"
          select
          fullWidth
          value={form.risk_level}
          onChange={handleChange}
        >
          <MenuItem value="low">Low</MenuItem>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="high">High</MenuItem>
        </TextField>

        {/* ── Lifecycle & Classification ── */}
        <TextField margin="dense" label="Business Criticality" name="business_criticality" select fullWidth value={form.business_criticality} onChange={handleChange}>
          <MenuItem value="">— Not set —</MenuItem>
          <MenuItem value="critical">Critical</MenuItem>
          <MenuItem value="high">High</MenuItem>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="low">Low</MenuItem>
        </TextField>
        <TextField margin="dense" label="Tags (comma-separated)" name="tags" fullWidth placeholder="PCI-DSS,HIPAA,SOC2" value={form.tags} onChange={handleChange} />
        <TextField margin="dense" label="Compliance Scope" name="compliance_scope" fullWidth placeholder="PCI-DSS,ISO27001" value={form.compliance_scope} onChange={handleChange} />
        <TextField margin="dense" label="Vendor / Manufacturer" name="vendor" fullWidth value={form.vendor} onChange={handleChange} />
        <TextField margin="dense" label="Owner" name="owner" fullWidth value={form.owner} onChange={handleChange} />
        <TextField margin="dense" label="Custodian" name="custodian" fullWidth value={form.custodian} onChange={handleChange} />
        <TextField margin="dense" label="IP Address" name="ip_address" fullWidth value={form.ip_address} onChange={handleChange} />
        <TextField margin="dense" label="Hostname" name="hostname" fullWidth value={form.hostname} onChange={handleChange} />
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField margin="dense" label="Purchase Date" name="purchase_date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.purchase_date} onChange={handleChange} />
          <TextField margin="dense" label="Warranty Expiry" name="warranty_expiry" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.warranty_expiry} onChange={handleChange} />
          <TextField margin="dense" label="End of Life" name="end_of_life_date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.end_of_life_date} onChange={handleChange} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSubmit} disabled={submitting}>
          {submitting ? "Saving..." : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
