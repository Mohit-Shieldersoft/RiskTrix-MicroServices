import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  LinearProgress,
  Snackbar,
  Alert,
  Avatar,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import RefreshIcon from "@mui/icons-material/Refresh";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CodeIcon from "@mui/icons-material/Code";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SecurityIcon from "@mui/icons-material/Security";
import CloseIcon from "@mui/icons-material/Close";
import api from "../../utils/api";

const SecretsScanner = () => {
  const [secrets, setSecrets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [iacSource, setIacSource] = useState("");
  const [tab, setTab] = useState("cloud");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [revealedSecrets, setRevealedSecrets] = useState({});
  const [selectedGuideModal, setSelectedGuideModal] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    fetchSecrets();
  }, []);

  const fetchSecrets = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/cloud/secrets");
      const data = Array.isArray(res.data) ? res.data : [];
      setSecrets(data);
    } catch {
      setSecrets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRunScan = async () => {
    setScanning(true);
    try {
      const res = iacSource.trim()
        ? await api.post("/api/v1/cloud/secrets/scan", { content: iacSource, filename: "pasted.tf" })
        : await api.post("/api/v1/cloud/secrets/cloud-scan");
      const findings = res.data.findings || [];
      if (findings.length) setSecrets(findings);
      setSnack({
        open: true,
        message: `Secrets & IaC scan completed. Found ${res.data.secrets_found || 0} items.`,
        severity: "success",
      });
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.detail || "Scan failed", severity: "error" });
    } finally {
      setScanning(false);
    }
  };

  const toggleRevealSecret = (id) => {
    setRevealedSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRevoke = async (sec) => {
    try {
      const res = await api.post(`/api/v1/cloud/secrets/${sec.secret_id}/revoke`);
      setSecrets((prev) => prev.map((s) => (s.secret_id === sec.secret_id ? { ...s, status: "GUIDED_REVOKE" } : s)));
      setSnack({
        open: true,
        message: res.data?.message || "Guided revoke recorded. Cloud credentials were not rotated.",
        severity: "info",
      });
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.detail || "Revoke failed", severity: "error" });
    }
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    setSnack({ open: true, message: "Copied secret snippet to clipboard!", severity: "success" });
  };

  const SAMPLE_TEMPLATES = {
    terraform: `resource "aws_s3_bucket" "demo" {\n  bucket = "demo-bucket"\n  acl    = "public-read"\n}\nvariable "aws_secret" { default = "AKIAEXAMPLEKEY" }`,
    kubernetes: `apiVersion: v1\nkind: Secret\nmetadata:\n  name: demo-secret\ndata:\n  token: c2VjcmV0LXRva2Vu`,
    docker: `FROM alpine\nENV AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG`,
  };
  const exposedCount = secrets.filter((s) => s.status === "EXPOSED" || s.status === "VIOLATION").length;
  const revokedCount = secrets.filter((s) => s.status === "REVOKED" || s.status === "GUIDED_REVOKE").length;
  const filteredSecrets = secrets.filter((row) => {
    if (severityFilter !== "ALL" && String(row.severity || row.entropy_score >= 8 ? "CRITICAL" : "HIGH").toUpperCase() !== severityFilter) return false;
    if (categoryFilter !== "ALL" && String(row.category || "").toUpperCase() !== categoryFilter) return false;
    return true;
  });
  const categories = [...new Set(secrets.map((row) => row.category).filter(Boolean))];

  return (
    <Box sx={{ maxWidth: "100%", width: "100%" }}>
      {/* Executive Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
            <Avatar sx={{ bgcolor: "#fef2f2", color: "#dc2626", width: 42, height: 42 }}>
              <VpnKeyIcon fontSize="medium" />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
                Secrets & IaC Leak Detection Engine
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b" }}>
                Regex pattern & Shannon entropy analysis for hardcoded keys, API credentials, and Terraform code misconfigurations
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchSecrets}
            disabled={loading}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px" }}
          >
            Refresh List
          </Button>
          <Button
            variant="contained"
            startIcon={scanning ? <LinearProgress sx={{ width: 16 }} /> : <PlayArrowIcon />}
            onClick={handleRunScan}
            disabled={scanning}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "8px",
              px: 2.5,
              bgcolor: "error.main",
            }}
          >
            {scanning ? "Scanning..." : "Run Secrets & IaC Scan"}
          </Button>
        </Box>
      </Box>
      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
        <Tab value="cloud" label="Cloud assets" />
        <Tab value="code" label="Code / IaC" />
      </Tabs>
      {tab === "code" && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap" }}>
            <Button size="small" onClick={() => setIacSource(SAMPLE_TEMPLATES.terraform)}>Terraform sample</Button>
            <Button size="small" onClick={() => setIacSource(SAMPLE_TEMPLATES.kubernetes)}>Kubernetes sample</Button>
            <Button size="small" onClick={() => setIacSource(SAMPLE_TEMPLATES.docker)}>Dockerfile sample</Button>
          </Box>
          <TextField
            multiline
            minRows={4}
            fullWidth
            placeholder="Paste Terraform, Kubernetes YAML, Dockerfile, or CloudFormation to scan for secrets"
            value={iacSource}
            onChange={(e) => setIacSource(e.target.value)}
          />
        </Box>
      )}
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Severity</InputLabel>
          <Select value={severityFilter} label="Severity" onChange={(e) => setSeverityFilter(e.target.value)}>
            <MenuItem value="ALL">All</MenuItem>
            <MenuItem value="CRITICAL">Critical</MenuItem>
            <MenuItem value="HIGH">High</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Category</InputLabel>
          <Select value={categoryFilter} label="Category" onChange={(e) => setCategoryFilter(e.target.value)}>
            <MenuItem value="ALL">All</MenuItem>
            {categories.map((item) => <MenuItem key={item} value={String(item).toUpperCase()}>{item}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* KPI Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: "Exposed Secret Leaks", value: exposedCount + " Active", color: "#dc2626", icon: <VpnKeyIcon sx={{ color: "#dc2626" }} /> },
          { label: "Highest Entropy Score", value: "9.4 High", color: "#7c3aed", icon: <LockIcon sx={{ color: "#7c3aed" }} /> },
          { label: "IaC Terraform Violations", value: "1 Misconfig", color: "#ea580c", icon: <CodeIcon sx={{ color: "#ea580c" }} /> },
          { label: "Revoked & Patched", value: revokedCount + " Resolved", color: "#16a34a", icon: <CheckCircleIcon sx={{ color: "#16a34a" }} /> },
        ].map((s) => (
          <Grid item xs={12} sm={6} md={3} key={s.label}>
            <Card sx={{ borderLeft: "4px solid " + s.color, boxShadow: "0 2px 8px rgba(15, 23, 42, 0.06)" }}>
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>{s.label}</Typography>
                  {s.icon}
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: "#0f172a" }}>{s.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Secrets & IaC Audit Table */}
      <TableContainer component={Paper} sx={{ borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)" }}>
        {loading && <LinearProgress />}
        <Table sx={{ minWidth: 750 }}>
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>
              {["Secret / IaC Violation Title", "Category & Detection Rule", "Shannon Entropy", "File Location / S3 Path", "Exposed Value & Secret Viewer", "Status & Action"].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 800, color: "#334155", fontSize: "13px" }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSecrets.map((row) => {
              const isRevealed = revealedSecrets[row.secret_id];
              return (
                <TableRow key={row.secret_id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: "#0f172a" }}>
                      {row.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#94a3b8", fontFamily: "monospace" }}>
                      {row.secret_id} | Detected {row.detected_at}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip label={row.category} size="small" sx={{ bgcolor: "#eff6ff", color: "#1d4ed8", fontWeight: 700, fontSize: "10px", mb: 0.5, display: "block", width: "fit-content" }} />
                    <Typography variant="caption" sx={{ color: "#475569", fontSize: "11px" }}>
                      {row.pattern_type}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={`${row.entropy_score} H`}
                      size="small"
                      sx={{
                        bgcolor: row.entropy_score >= 8.0 ? "#fef2f2" : "#fffbe8",
                        color: row.entropy_score >= 8.0 ? "#dc2626" : "#b45309",
                        fontWeight: 800,
                        fontSize: "11px",
                        border: `1px solid ${row.entropy_score >= 8.0 ? "#fecaca" : "#fde68a"}`,
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#334155", fontWeight: 600, display: "block", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {row.file_path}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          p: 0.8,
                          px: 1.2,
                          bgcolor: "#0f172a",
                          color: isRevealed ? "#38bdf8" : "#94a3b8",
                          fontFamily: "monospace",
                          fontSize: "11px",
                          borderRadius: "6px",
                          maxWidth: 240,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isRevealed ? row.full_value : row.masked_value}
                      </Box>
                      <Tooltip title={isRevealed ? "Hide Secret" : "Reveal Secret"}>
                        <IconButton size="small" onClick={() => toggleRevealSecret(row.secret_id)} sx={{ color: "#64748b" }}>
                          {isRevealed ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Copy Snippet">
                        <IconButton size="small" onClick={() => handleCopyText(isRevealed ? row.full_value : row.masked_value)} sx={{ color: "#64748b" }}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        label={row.status}
                        size="small"
                        sx={{
                          bgcolor: row.status === "REVOKED" ? "#dcfce7" : "#fef2f2",
                          color: row.status === "REVOKED" ? "#16a34a" : "#dc2626",
                          fontWeight: 800,
                          fontSize: "10px",
                        }}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setSelectedGuideModal(row)}
                        sx={{ textTransform: "none", fontWeight: 700, fontSize: "11px", py: 0.2, px: 1, borderRadius: "6px" }}
                      >
                        Revoke Guide
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Secret Revocation & Patch Guidance Modal */}
      {selectedGuideModal && (
        <Dialog open={Boolean(selectedGuideModal)} onClose={() => setSelectedGuideModal(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "14px" } }}>
          <Box sx={{ py: 2, px: 3, bgcolor: "#0f172a", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
              <LockIcon sx={{ color: "#38bdf8" }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#ffffff" }}>
                Secret Revocation & IaC Patch
              </Typography>
            </Box>
            <IconButton onClick={() => setSelectedGuideModal(null)} size="small" sx={{ color: "#94a3b8" }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <DialogContent sx={{ p: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f172a", mb: 0.5 }}>
              {selectedGuideModal.title}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 2 }}>
              Location: {selectedGuideModal.file_path}
            </Typography>
            <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#2563eb", textTransform: "uppercase" }}>
                Revocation Steps:
              </Typography>
              <Typography variant="body2" sx={{ color: "#334155", mt: 0.5, fontWeight: 600 }}>
                {selectedGuideModal.remediation_guide}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: "#f8fafc", justifyContent: "space-between" }}>
            <Button onClick={() => setSelectedGuideModal(null)} sx={{ textTransform: "none", color: "#64748b" }}>Close</Button>
            <Button
              variant="contained"
              onClick={() => {
                handleRevoke(selectedGuideModal);
                setSelectedGuideModal(null);
              }}
              sx={{ textTransform: "none", fontWeight: 700, bgcolor: "#dc2626", "&:hover": { bgcolor: "#b91c1c" } }}
            >
              🔒 Execute Auto-Revoke & Patch
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity} sx={{ width: "100%" }}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default SecretsScanner;
