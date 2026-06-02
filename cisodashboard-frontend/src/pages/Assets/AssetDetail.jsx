import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Card, CardContent, Chip,
  CircularProgress, Button, Grid, Divider, Tabs, Tab,
  Table, TableHead, TableRow, TableCell, TableBody,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, IconButton, Tooltip, Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import InfoIcon from "@mui/icons-material/Info";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import BugReportIcon from "@mui/icons-material/BugReport";
import LaptopIcon from "@mui/icons-material/Laptop";
import HistoryIcon from "@mui/icons-material/History";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import assetApi from "../../utils/assetApi";
import fileApi from "../../utils/fileApi";
import FileUploadZone from "../../components/Files/FileUploadZone";
import FileList from "../../components/Files/FileList";
import Toast from "../../components/common/Toast";
import { useToast } from "../../components/common/useToast";

const getRiskColor = (risk) => {
  switch (risk?.toLowerCase()) {
    case "high": return "error";
    case "medium": return "warning";
    case "low": return "success";
    default: return "default";
  }
};

const getTypeLabel = (type) => {
  switch (type?.toLowerCase()) {
    case "web_application": return "Web Application";
    case "mobile_application": return "Mobile Application";
    case "api": return "API";
    case "server": return "Server";
    case "database": return "Database";
    case "network_device": return "Network Device";
    case "endpoint": return "Endpoint";
    case "cloud_service": return "Cloud Service";
    case "iot_device": return "IoT Device";
    case "container": return "Container";
    case "firewall": return "Firewall";
    case "router": return "Router";
    case "switch": return "Switch";
    case "load_balancer": return "Load Balancer";
    default: return type;
  }
};

const DetailRow = ({ label, value }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", py: 1.5 }}>
    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
      {label}
    </Typography>
    <Typography variant="body2">{value}</Typography>
  </Box>
);

const TabPanel = ({ children, value, index }) => (
  <Box hidden={value !== index} sx={{ pt: 3 }}>
    {value === index && children}
  </Box>
);

const AssetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, showToast, closeToast } = useToast();

  const [asset, setAsset]           = useState(null);
  const [assetFiles, setAssetFiles] = useState([]);
  const [vulns, setVulns]           = useState([]);
  const [software, setSoftware]     = useState([]);
  const [changelog, setChangelog]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [activeTab, setActiveTab]   = useState(0);

  // vuln dialog
  const [vulnOpen, setVulnOpen]   = useState(false);
  const [vulnEdit, setVulnEdit]   = useState(null);
  const [vulnForm, setVulnForm]   = useState({ title: "", cve_id: "", severity: "medium", cvss_score: "", description: "", status: "open", remediation_notes: "" });
  const [vulnSaving, setVulnSaving] = useState(false);

  // software dialog
  const [swOpen, setSwOpen]     = useState(false);
  const [swForm, setSwForm]     = useState({ name: "", vendor: "", version: "", patch_level: "", is_outdated: false, is_licensed: true });
  const [swSaving, setSwSaving] = useState(false);

  const fetchAll = async () => {
    try {
      const [assetRes, filesRes, vulnsRes, swRes, logRes] = await Promise.allSettled([
        assetApi.getAssetById(id),
        fileApi.listFiles("asset", id),
        assetApi.getVulnerabilities(id),
        assetApi.getSoftware(id),
        assetApi.getChangelog(id),
      ]);

      if (assetRes.status !== "fulfilled") {
        console.error("Error fetching asset detail", assetRes.reason);
        setError("Asset not found");
        return;
      }

      setAsset(assetRes.value);

      if (filesRes.status === "fulfilled") {
        setAssetFiles(filesRes.value || []);
      } else {
        setAssetFiles([]);
        showToast("File service is unavailable. Attachments are temporarily hidden.", "warning");
      }

      setVulns(vulnsRes.status === "fulfilled" ? (vulnsRes.value || []) : []);
      setSoftware(swRes.status === "fulfilled" ? (swRes.value || []) : []);
      setChangelog(logRes.status === "fulfilled" ? (logRes.value || []) : []);
    } catch (err) {
      console.error("Error fetching asset detail", err);
      setError("Asset not found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
      <CircularProgress />
    </Box>
  );

  if (error || !asset) return (
    <Box sx={{ textAlign: "center", mt: 10 }}>
      <Typography color="error">{error || "Asset not found"}</Typography>
      <Button sx={{ mt: 2 }} variant="outlined" onClick={() => navigate("/assets")}>
        Back to Inventory
      </Button>
    </Box>
  );

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
      {/* HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/assets")} variant="text">
          Back to Inventory
        </Button>
        <Button startIcon={<EditIcon />} variant="contained" onClick={() => navigate(`/assets/${id}/edit`)}>
          Edit Asset
        </Button>
      </Box>

      {/* TITLE */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">{asset.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          Asset ID: #{asset.id} · Created {new Date(asset.created_at).toLocaleDateString()}
        </Typography>
      </Box>

      {/* STATUS CARDS */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 2, textAlign: "center" }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Risk Level</Typography>
              <Chip
                label={asset.risk_level?.toUpperCase()}
                color={getRiskColor(asset.risk_level)}
                sx={{ mt: 1, fontWeight: "bold", fontSize: 14 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 2, textAlign: "center" }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Asset Type</Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>{getTypeLabel(asset.type)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 2, textAlign: "center" }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Vulnerabilities</Typography>
              <Typography
                variant="h4"
                color={asset.vulnerabilities_count > 0 ? "error" : "success.main"}
                sx={{ mt: 0.5 }}
              >
                {asset.vulnerabilities_count ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* RISK BANNER */}
      {asset.risk_level === "high" && (
        <Card sx={{ borderRadius: 2, mb: 3, backgroundColor: "error.light" }}>
          <CardContent>
            <Typography variant="subtitle2" color="error.dark" fontWeight="bold">
              ⚠ High Risk Asset
            </Typography>
            <Typography variant="body2" color="error.dark">
              This asset has been flagged as high risk. Immediate review and remediation is recommended.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* ✅ TABS */}
      <Card sx={{ borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", px: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            sx={{ "& .MuiTab-root": { textTransform: "capitalize", fontWeight: 600 } }}
          >
            <Tab icon={<InfoIcon fontSize="small" />} iconPosition="start" label="Information" />
            <Tab icon={<BugReportIcon fontSize="small" />} iconPosition="start" label={`Vulnerabilities (${vulns.filter(v => v.status !== "resolved").length})`} />
            <Tab icon={<LaptopIcon fontSize="small" />} iconPosition="start" label={`Software (${software.length})`} />
            <Tab icon={<AttachFileIcon fontSize="small" />} iconPosition="start" label={`Files (${assetFiles.length})`} />
            <Tab icon={<HistoryIcon fontSize="small" />} iconPosition="start" label="Change Log" />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 3 }}>

          {/* ── TAB 0: ASSET INFO ── */}
          <TabPanel value={activeTab} index={0}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Asset Information</Typography>
            <Divider sx={{ mb: 1 }} />
            <DetailRow label="Asset Name" value={asset.name} />
            <Divider /><DetailRow label="Asset ID" value={`#${asset.id}`} />
            <Divider /><DetailRow label="Type" value={getTypeLabel(asset.type)} />
            <Divider /><DetailRow label="Risk Level" value={asset.risk_level?.charAt(0).toUpperCase() + asset.risk_level?.slice(1)} />
            <Divider /><DetailRow label="Business Criticality" value={asset.business_criticality || "—"} />
            <Divider /><DetailRow label="Tags" value={asset.tags || "—"} />
            <Divider /><DetailRow label="Compliance Scope" value={asset.compliance_scope || "—"} />
            <Divider /><DetailRow label="Open Vulnerabilities" value={vulns.filter(v => v.status !== "resolved").length} />

            <Typography variant="h6" fontWeight="bold" sx={{ mt: 3, mb: 1 }}>Lifecycle</Typography>
            <Divider sx={{ mb: 1 }} />
            <DetailRow label="Vendor" value={asset.vendor || "—"} />
            <Divider /><DetailRow label="Owner" value={asset.owner || "—"} />
            <Divider /><DetailRow label="Custodian" value={asset.custodian || "—"} />
            <Divider /><DetailRow label="IP Address" value={asset.ip_address || "—"} />
            <Divider /><DetailRow label="Hostname" value={asset.hostname || "—"} />
            <Divider /><DetailRow label="Purchase Date" value={asset.purchase_date || "—"} />
            <Divider /><DetailRow label="Warranty Expiry" value={asset.warranty_expiry || "—"} />
            <Divider /><DetailRow label="End of Life" value={asset.end_of_life_date || "—"} />

            <Typography variant="h6" fontWeight="bold" sx={{ mt: 3, mb: 1 }}>Inventory</Typography>
            <Divider sx={{ mb: 1 }} />
            <DetailRow label="Serial Number" value={asset.serial_number || "—"} />
            <Divider /><DetailRow label="Device Model" value={asset.device_model || "—"} />
            <Divider /><DetailRow label="Rack Position" value={asset.rack_position || "—"} />
            <Divider /><DetailRow label="Power Source" value={asset.power_source || "—"} />
            <Divider /><DetailRow label="Power (Watts)" value={asset.power_watts || "—"} />
            <Divider /><DetailRow label="Location" value={asset.location || "—"} />
            <Divider /><DetailRow label="Site" value={asset.site || "—"} />
            <Divider /><DetailRow label="Notes" value={asset.notes || "—"} />
            <Divider /><DetailRow label="Created At" value={new Date(asset.created_at).toLocaleString()} />
          </TabPanel>

          {/* ── TAB 1: VULNERABILITIES ── */}
          <TabPanel value={activeTab} index={1}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">Vulnerabilities</Typography>
              <Button size="small" variant="contained" startIcon={<AddIcon />}
                onClick={() => { setVulnEdit(null); setVulnForm({ title: "", cve_id: "", severity: "medium", cvss_score: "", description: "", status: "open", remediation_notes: "" }); setVulnOpen(true); }}>
                Add Vulnerability
              </Button>
            </Box>
            {vulns.length === 0 ? (
              <Alert severity="success">No vulnerabilities recorded for this asset.</Alert>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.50" }}>
                    <TableCell sx={{ fontWeight: "bold" }}>CVE ID</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Severity</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>CVSS</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Discovered</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vulns.map(v => (
                    <TableRow key={v.id} hover>
                      <TableCell><Typography variant="caption" sx={{ fontFamily: "monospace" }}>{v.cve_id || "—"}</Typography></TableCell>
                      <TableCell>{v.title}</TableCell>
                      <TableCell><Chip label={v.severity} size="small" color={v.severity === "critical" ? "error" : v.severity === "high" ? "warning" : v.severity === "medium" ? "info" : "default"} /></TableCell>
                      <TableCell>{v.cvss_score ?? "—"}</TableCell>
                      <TableCell><Chip label={v.status} size="small" color={v.status === "resolved" ? "success" : v.status === "in_progress" ? "warning" : "error"} variant="outlined" /></TableCell>
                      <TableCell>{new Date(v.discovered_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => { setVulnEdit(v); setVulnForm({ title: v.title, cve_id: v.cve_id || "", severity: v.severity, cvss_score: v.cvss_score || "", description: v.description || "", status: v.status, remediation_notes: v.remediation_notes || "" }); setVulnOpen(true); }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {v.status !== "resolved" && (
                          <Tooltip title="Mark Resolved">
                            <IconButton size="small" color="success" onClick={async () => {
                              await assetApi.updateVulnerability(id, v.id, { status: "resolved" });
                              const updated = await assetApi.getVulnerabilities(id);
                              setVulns(updated);
                              const a = await assetApi.getAssetById(id);
                              setAsset(a);
                              showToast("Marked as resolved", "success");
                            }}>
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={async () => {
                            if (!window.confirm("Delete this vulnerability?")) return;
                            await assetApi.deleteVulnerability(id, v.id);
                            setVulns(prev => prev.filter(x => x.id !== v.id));
                            const a = await assetApi.getAssetById(id);
                            setAsset(a);
                          }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabPanel>

          {/* ── TAB 2: SOFTWARE INVENTORY ── */}
          <TabPanel value={activeTab} index={2}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">Installed Software</Typography>
              <Button size="small" variant="contained" startIcon={<AddIcon />}
                onClick={() => { setSwForm({ name: "", vendor: "", version: "", patch_level: "", is_outdated: false, is_licensed: true }); setSwOpen(true); }}>
                Add Software
              </Button>
            </Box>
            {software.length === 0 ? (
              <Alert severity="info">No software recorded for this asset.</Alert>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.50" }}>
                    <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Vendor</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Version</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Patch Level</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Outdated</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Licensed</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>License Expiry</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {software.map(sw => (
                    <TableRow key={sw.id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{sw.name}</TableCell>
                      <TableCell>{sw.vendor || "—"}</TableCell>
                      <TableCell>{sw.version || "—"}</TableCell>
                      <TableCell>{sw.patch_level || "—"}</TableCell>
                      <TableCell><Chip label={sw.is_outdated ? "Outdated" : "Current"} size="small" color={sw.is_outdated ? "error" : "success"} /></TableCell>
                      <TableCell><Chip label={sw.is_licensed ? "Licensed" : "Unlicensed"} size="small" color={sw.is_licensed ? "success" : "warning"} /></TableCell>
                      <TableCell>{sw.license_expiry || "—"}</TableCell>
                      <TableCell>
                        <Tooltip title="Remove">
                          <IconButton size="small" color="error" onClick={async () => {
                            if (!window.confirm(`Remove ${sw.name}?`)) return;
                            await assetApi.deleteSoftware(id, sw.id);
                            setSoftware(prev => prev.filter(x => x.id !== sw.id));
                          }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabPanel>

          {/* ── TAB 3: FILES ── */}
          <TabPanel value={activeTab} index={3}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Attached Files</Typography>
            <Box sx={{ mb: 3 }}>
              <FileUploadZone context="asset" refId={String(id)}
                onUploadSuccess={(newFile) => setAssetFiles((prev) => [newFile, ...prev])}
                showToast={showToast} />
            </Box>
            <Divider sx={{ mb: 3 }} />
            <FileList files={assetFiles}
              onDelete={(fileId) => setAssetFiles((prev) => prev.filter((f) => f.file_id !== fileId))}
              showToast={showToast} />
          </TabPanel>

          {/* ── TAB 4: CHANGE LOG ── */}
          <TabPanel value={activeTab} index={4}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Change History</Typography>
            {changelog.length === 0 ? (
              <Alert severity="info">No changes recorded yet.</Alert>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.50" }}>
                    <TableCell sx={{ fontWeight: "bold" }}>When</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Changed By</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Field</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Old Value</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>New Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {changelog.map(c => (
                    <TableRow key={c.id} hover>
                      <TableCell>{new Date(c.changed_at).toLocaleString()}</TableCell>
                      <TableCell>{c.changed_by}</TableCell>
                      <TableCell><Chip label={c.field_name} size="small" variant="outlined" /></TableCell>
                      <TableCell><Typography variant="caption" color="error.main">{c.old_value || "—"}</Typography></TableCell>
                      <TableCell><Typography variant="caption" color="success.main">{c.new_value || "—"}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabPanel>

        </CardContent>
      </Card>

      {/* ── VULNERABILITY DIALOG ── */}
      <Dialog open={vulnOpen} onClose={() => setVulnOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{vulnEdit ? "Edit Vulnerability" : "Add Vulnerability"}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Title *" fullWidth value={vulnForm.title} onChange={e => setVulnForm(f => ({ ...f, title: e.target.value }))} />
          <TextField margin="dense" label="CVE ID" fullWidth placeholder="CVE-2024-1234" value={vulnForm.cve_id} onChange={e => setVulnForm(f => ({ ...f, cve_id: e.target.value }))} />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField margin="dense" label="Severity" select fullWidth value={vulnForm.severity} onChange={e => setVulnForm(f => ({ ...f, severity: e.target.value }))}>
              {["critical","high","medium","low","info"].map(s => <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</MenuItem>)}
            </TextField>
            <TextField margin="dense" label="CVSS Score" type="number" fullWidth inputProps={{ min: 0, max: 10, step: 0.1 }} value={vulnForm.cvss_score} onChange={e => setVulnForm(f => ({ ...f, cvss_score: e.target.value }))} />
            <TextField margin="dense" label="Status" select fullWidth value={vulnForm.status} onChange={e => setVulnForm(f => ({ ...f, status: e.target.value }))}>
              {["open","in_progress","accepted","resolved"].map(s => <MenuItem key={s} value={s}>{s.replace("_"," ")}</MenuItem>)}
            </TextField>
          </Box>
          <TextField margin="dense" label="Description" fullWidth multiline rows={2} value={vulnForm.description} onChange={e => setVulnForm(f => ({ ...f, description: e.target.value }))} />
          <TextField margin="dense" label="Remediation Notes" fullWidth multiline rows={2} value={vulnForm.remediation_notes} onChange={e => setVulnForm(f => ({ ...f, remediation_notes: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVulnOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!vulnForm.title || vulnSaving} onClick={async () => {
            setVulnSaving(true);
            try {
              const payload = { ...vulnForm, cvss_score: vulnForm.cvss_score ? parseFloat(vulnForm.cvss_score) : null };
              if (vulnEdit) await assetApi.updateVulnerability(id, vulnEdit.id, payload);
              else await assetApi.addVulnerability(id, payload);
              const [updated, updatedAsset] = await Promise.all([assetApi.getVulnerabilities(id), assetApi.getAssetById(id)]);
              setVulns(updated); setAsset(updatedAsset);
              setVulnOpen(false);
              showToast(vulnEdit ? "Vulnerability updated" : "Vulnerability added", "success");
            } catch (e) { showToast("Failed to save vulnerability", "error"); }
            finally { setVulnSaving(false); }
          }}>
            {vulnSaving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── SOFTWARE DIALOG ── */}
      <Dialog open={swOpen} onClose={() => setSwOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Software</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Name *" fullWidth value={swForm.name} onChange={e => setSwForm(f => ({ ...f, name: e.target.value }))} />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField margin="dense" label="Vendor" fullWidth value={swForm.vendor} onChange={e => setSwForm(f => ({ ...f, vendor: e.target.value }))} />
            <TextField margin="dense" label="Version" fullWidth value={swForm.version} onChange={e => setSwForm(f => ({ ...f, version: e.target.value }))} />
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField margin="dense" label="Patch Level" fullWidth value={swForm.patch_level} onChange={e => setSwForm(f => ({ ...f, patch_level: e.target.value }))} />
            <TextField margin="dense" label="Outdated?" select fullWidth value={swForm.is_outdated} onChange={e => setSwForm(f => ({ ...f, is_outdated: e.target.value === "true" }))}>
              <MenuItem value={false}>No</MenuItem><MenuItem value={true}>Yes</MenuItem>
            </TextField>
            <TextField margin="dense" label="Licensed?" select fullWidth value={swForm.is_licensed} onChange={e => setSwForm(f => ({ ...f, is_licensed: e.target.value === "true" }))}>
              <MenuItem value={true}>Yes</MenuItem><MenuItem value={false}>No</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSwOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!swForm.name || swSaving} onClick={async () => {
            setSwSaving(true);
            try {
              const added = await assetApi.addSoftware(id, swForm);
              setSoftware(prev => [...prev, added]);
              setSwOpen(false);
              showToast("Software added", "success");
            } catch (e) { showToast("Failed to add software", "error"); }
            finally { setSwSaving(false); }
          }}>
            {swSaving ? "Saving..." : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      <Toast toast={toast} onClose={closeToast} />
    </Box>
  );
};

export default AssetDetail;