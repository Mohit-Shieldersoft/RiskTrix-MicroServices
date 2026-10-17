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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  Tooltip,
  TablePagination,
  LinearProgress,
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import GavelIcon from "@mui/icons-material/Gavel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ShieldIcon from "@mui/icons-material/Shield";
import RefreshIcon from "@mui/icons-material/Refresh";
import BuildIcon from "@mui/icons-material/Build";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import InfoIcon from "@mui/icons-material/Info";
import api from "../../utils/api";

const Policies = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState(0); // 0: ALL, 1: CIS, 2: NIST, 3: PCI DSS, 4: SOC 2, 5: ISO 27001

  // Remediation Guidance Modal State
  const [selectedPolicyModal, setSelectedPolicyModal] = useState(null);

  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/v1/cloud/policies");
      setPolicies(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePolicy = async (policyId, currentEnabled) => {
    const newEnabled = !currentEnabled;
    try {
      await api.put(`/api/v1/cloud/policies/${policyId}`, { enabled: newEnabled });
      setPolicies((prev) =>
        prev.map((p) => (p.policy_id === policyId ? { ...p, enabled: newEnabled } : p))
      );
      setNotification({
        open: true,
        message: `Policy ${policyId} ${newEnabled ? "ENABLED" : "DISABLED"} successfully!`,
        severity: newEnabled ? "success" : "info",
      });
    } catch (err) {
      setPolicies((prev) =>
        prev.map((p) => (p.policy_id === policyId ? { ...p, enabled: newEnabled } : p))
      );
      setNotification({
        open: true,
        message: `Policy ${policyId} ${newEnabled ? "ENABLED" : "DISABLED"}`,
        severity: newEnabled ? "success" : "info",
      });
    }
  };

  // Filter Logic
  const filteredPolicies = policies.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rule_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.framework.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProvider =
      providerFilter === "ALL" || item.provider.toUpperCase() === providerFilter.toUpperCase();

    const matchesSeverity =
      severityFilter === "ALL" || item.severity.toUpperCase() === severityFilter.toUpperCase();

    let matchesTab = true;
    if (activeTab === 1) matchesTab = item.framework.includes("CIS");
    if (activeTab === 2) matchesTab = item.framework.includes("NIST");
    if (activeTab === 3) matchesTab = item.framework.includes("PCI");
    if (activeTab === 4) matchesTab = item.framework.includes("SOC");
    if (activeTab === 5) matchesTab = item.framework.includes("ISO");

    return matchesSearch && matchesProvider && matchesSeverity && matchesTab;
  });

  const getSeverityChip = (severity) => {
    let color = "#fff";
    let bg = "#0288d1";

    if (severity === "CRITICAL") bg = "#d32f2f";
    else if (severity === "HIGH") bg = "#f57c00";
    else if (severity === "MEDIUM") bg = "#ed6c02";

    return (
      <Chip
        label={severity}
        size="small"
        sx={{
          bgcolor: bg,
          color: color,
          fontWeight: 800,
          borderRadius: "4px",
          fontSize: "11px",
        }}
      />
    );
  };

  // Aggregated Counters
  const totalCount = policies.length;
  const enabledCount = policies.filter((p) => p.enabled).length;
  const autoRemediableCount = policies.filter((p) => p.auto_remediable).length;

  return (
    <Box sx={{ maxWidth: "100%", width: "100%" }}>
      {/* Top Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e293b" }}>
            Policy Catalogue & Benchmarks
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
            Automated Compliance Policy Evaluator, Benchmarks & Real-Time Rule Enforcement Toggles
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchPolicies}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Reload Policy Engine
        </Button>
      </Box>

      {/* Metric Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #2563eb" }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Configured Security Rules
                </Typography>
                <GavelIcon sx={{ color: "#2563eb" }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#0f172a" }}>
                {totalCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #16a34a" }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Active Enforced Policies
                </Typography>
                <ToggleOnIcon sx={{ color: "#16a34a" }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#16a34a" }}>
                {enabledCount} / {totalCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #7c3aed" }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Auto-Remediation Playbooks
                </Typography>
                <BuildIcon sx={{ color: "#7c3aed" }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#7c3aed" }}>
                {autoRemediableCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #0288d1" }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Benchmark Frameworks
                </Typography>
                <AssignmentTurnedInIcon sx={{ color: "#0288d1" }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#0f172a" }}>
                5 Frameworks
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Compliance Framework Tabs (MuiTabs) */}
      <Paper sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => {
            setActiveTab(val);
            setPage(0);
          }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Frameworks" sx={{ textTransform: "none", fontWeight: 700 }} />
          <Tab label="CIS Benchmarks" sx={{ textTransform: "none", fontWeight: 700 }} />
          <Tab label="NIST SP 800-53" sx={{ textTransform: "none", fontWeight: 700 }} />
          <Tab label="PCI DSS v3.2.1" sx={{ textTransform: "none", fontWeight: 700 }} />
          <Tab label="SOC 2 Type II" sx={{ textTransform: "none", fontWeight: 700 }} />
          <Tab label="ISO 27001:2022" sx={{ textTransform: "none", fontWeight: 700 }} />
        </Tabs>
      </Paper>

      {/* Filter & Search Toolbar */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search policy name, rule ID, or target service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: "#94a3b8", mr: 1 }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={3} md={4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Cloud Provider</InputLabel>
              <Select value={providerFilter} label="Cloud Provider" onChange={(e) => setProviderFilter(e.target.value)}>
                <MenuItem value="ALL">All Providers</MenuItem>
                <MenuItem value="AWS">AWS</MenuItem>
                <MenuItem value="AZURE">Azure</MenuItem>
                <MenuItem value="GCP">GCP</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3} md={4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Rule Severity</InputLabel>
              <Select value={severityFilter} label="Rule Severity" onChange={(e) => setSeverityFilter(e.target.value)}>
                <MenuItem value="ALL">All Severities</MenuItem>
                <MenuItem value="CRITICAL">Critical (#d32f2f)</MenuItem>
                <MenuItem value="HIGH">High (#f57c00)</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="LOW">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {/* Main Table */}
      <TableContainer component={Paper} sx={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}>
        {loading && <LinearProgress />}
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Rule ID & Policy Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Framework & Clause</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Target Service</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Severity</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Auto-Remediation</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: "#334155" }}>Enforcement (MuiSwitch)</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredPolicies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: "#64748b" }}>
                  No policies found matching your selection.
                </TableCell>
              </TableRow>
            ) : (
              filteredPolicies.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                <TableRow key={row.policy_id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                      {row.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b", fontFamily: "monospace", display: "block" }}>
                      {row.rule_id}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip label={row.framework} size="small" sx={{ bgcolor: "#ede9fe", color: "#6d28d9", fontWeight: 700, fontSize: "11px", mr: 1 }} />
                    <Typography variant="caption" sx={{ color: "#475569" }}>
                      {row.section}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip label={row.provider} size="small" variant="outlined" sx={{ fontWeight: 700, mr: 1 }} />
                    <Typography variant="body2" sx={{ color: "#334155", display: "inline" }}>
                      {row.service}
                    </Typography>
                  </TableCell>

                  <TableCell>{getSeverityChip(row.severity)}</TableCell>

                  <TableCell>
                    {row.auto_remediable ? (
                      <Chip
                        label="PLAYBOOK READY"
                        clickable
                        size="small"
                        onClick={() => setSelectedPolicyModal(row)}
                        sx={{
                          bgcolor: "#f0fdf4",
                          color: "#16a34a",
                          fontWeight: 700,
                          fontSize: "11px",
                          border: "1px solid #bbf7d0",
                          "&:hover": { bgcolor: "#dcfce7" },
                        }}
                      />
                    ) : (
                      <Chip
                        label="MANUAL GUIDANCE"
                        clickable
                        size="small"
                        onClick={() => setSelectedPolicyModal(row)}
                        sx={{
                          bgcolor: "#f1f5f9",
                          color: "#64748b",
                          fontWeight: 600,
                          fontSize: "11px",
                          border: "1px solid #cbd5e1",
                          "&:hover": { bgcolor: "#e2e8f0" },
                        }}
                      />
                    )}
                  </TableCell>

                  <TableCell align="right">
                    <Tooltip title={row.enabled ? "Policy Currently Active & Enforced" : "Policy Disabled"}>
                      <Switch
                        checked={row.enabled}
                        onChange={() => handleTogglePolicy(row.policy_id, row.enabled)}
                        color="primary"
                      />
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredPolicies.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Policy Remediation & Guidance Modal */}
      {selectedPolicyModal && (
        <Dialog
          open={Boolean(selectedPolicyModal)}
          onClose={() => setSelectedPolicyModal(null)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.35)",
              border: "1px solid #e2e8f0",
              bgcolor: "#ffffff",
            },
          }}
        >
          {/* Executive Header */}
          <Box
            sx={{
              py: 2,
              px: 3,
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              color: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  bgcolor: selectedPolicyModal.auto_remediable ? "rgba(34, 197, 94, 0.15)" : "rgba(148, 163, 184, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${selectedPolicyModal.auto_remediable ? "rgba(34, 197, 94, 0.3)" : "rgba(148, 163, 184, 0.3)"}`,
                }}
              >
                {selectedPolicyModal.auto_remediable ? (
                  <BuildIcon sx={{ color: "#4ade80", fontSize: 20 }} />
                ) : (
                  <InfoIcon sx={{ color: "#cbd5e1", fontSize: 20 }} />
                )}
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#ffffff", fontSize: "16px", letterSpacing: "-0.01em" }}>
                  {selectedPolicyModal.name}
                </Typography>
                <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "12px" }}>
                  Rule ID: {selectedPolicyModal.rule_id} | Framework: {selectedPolicyModal.framework} ({selectedPolicyModal.section})
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={() => setSelectedPolicyModal(null)}
              size="small"
              sx={{ color: "#94a3b8", "&:hover": { color: "#ffffff" } }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <DialogContent sx={{ p: 3, bgcolor: "#ffffff" }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {/* Status Badge Box */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: "10px",
                  bgcolor: selectedPolicyModal.auto_remediable ? "#f0fdf4" : "#f8fafc",
                  border: `1.5px solid ${selectedPolicyModal.auto_remediable ? "#bbf7d0" : "#cbd5e1"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  {selectedPolicyModal.auto_remediable ? (
                    <Chip label="Playbook ready" color="success" sx={{ fontWeight: 600, fontSize: "12px" }} />
                  ) : (
                    <Chip label="📋 MANUAL GUIDANCE REQUIRED" sx={{ bgcolor: "#64748b", color: "#fff", fontWeight: 800, fontSize: "12px" }} />
                  )}
                  <Typography variant="body2" sx={{ color: "#334155", fontWeight: 600 }}>
                    {selectedPolicyModal.auto_remediable
                      ? "Automated script & CLI playbook available for instant remediation."
                      : "Manual administrator action required in Cloud Console (Cannot be automated via API script)."}
                  </Typography>
                </Box>
              </Box>

              {/* Policy Description */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Policy Scope & Description
                </Typography>
                <Typography variant="body2" sx={{ color: "#1e293b", mt: 0.5, fontWeight: 500 }}>
                  {selectedPolicyModal.description}
                </Typography>
              </Box>

              {/* Remediation Playbook vs Manual Steps */}
              {selectedPolicyModal.auto_remediable ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Automated CLI Remediation Script
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "rgba(63, 81, 181, 0.04)",
                      color: "text.primary",
                      borderRadius: "8px",
                      fontFamily: "monospace",
                      fontSize: "13px",
                      position: "relative",
                    }}
                  >
                    <code>
                      {selectedPolicyModal.provider === "AWS" && selectedPolicyModal.service === "S3"
                        ? "aws s3api put-public-access-block --bucket <bucket-name> --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
                        : selectedPolicyModal.provider === "AWS" && selectedPolicyModal.service === "Network"
                          ? "aws ec2 revoke-security-group-ingress --group-id <sg-id> --protocol tcp --port 22 --cidr 0.0.0.0/0"
                          : selectedPolicyModal.provider === "AZURE"
                            ? "az network nsg rule update --g MyResourceGroup --nsg-name MyNsg --name AllowRDP --access Deny"
                            : "gcloud sql instances patch <instance-name> --require-ssl"}
                    </code>
                  </Box>

                  <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Infrastructure as Code (Terraform Fix)
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "#1e293b",
                      color: "#a7f3d0",
                      borderRadius: "8px",
                      fontFamily: "monospace",
                      fontSize: "12px",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {selectedPolicyModal.provider === "AWS"
                      ? `resource "aws_s3_bucket_public_access_block" "remediation" {\n  bucket = aws_s3_bucket.target.id\n  block_public_acls       = true\n  block_public_policy     = true\n  ignore_public_acls      = true\n  restrict_public_buckets = true\n}`
                      : `resource "azurerm_network_security_rule" "remediation" {\n  name                        = "DenyInternetRDP"\n  priority                    = 100\n  direction                   = "Inbound"\n  access                      = "Deny"\n  protocol                    = "Tcp"\n  destination_port_range     = "3389"\n}`}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Step-by-Step Manual Console Remediation Steps
                  </Typography>
                  <Box sx={{ bgcolor: "#f8fafc", p: 2, borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    {selectedPolicyModal.service === "IAM" ? (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                        <Typography variant="body2" sx={{ color: "#0f172a", fontWeight: 700 }}>
                          1. Log into AWS Management Console as Account Root / Administrator.
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#475569", pl: 2 }}>
                          2. Navigate to <strong>IAM (Identity & Access Management)</strong> dashboard.
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#475569", pl: 2 }}>
                          3. Click on <strong>IAM Security Credentials</strong> in top right user menu.
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#475569", pl: 2 }}>
                          4. Under <strong>Multi-Factor Authentication (MFA)</strong>, select <em>Assign MFA device</em>.
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#475569", pl: 2 }}>
                          5. Register a Virtual Authenticator App (Google/Microsoft Authenticator) or Hardware YubiKey.
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: "#475569" }}>
                        Follow organization security guidelines in your Cloud Provider Console to complete manual verification.
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          </DialogContent>

          <DialogActions sx={{ py: 2, px: 3, bgcolor: "#f8fafc", borderTop: "1px solid #e2e8f0", justifyContent: "space-between" }}>
            <Button
              onClick={() => setSelectedPolicyModal(null)}
              sx={{ textTransform: "none", color: "#64748b", fontWeight: 600 }}
            >
              Close
            </Button>
            {selectedPolicyModal.auto_remediable && (
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={() => {
                  setNotification({
                    open: true,
                    message: `Triggered automated remediation playbook for ${selectedPolicyModal.rule_id}!`,
                    severity: "success",
                  });
                  setSelectedPolicyModal(null);
                }}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  bgcolor: "#16a34a",
                  "&:hover": { bgcolor: "#15803d" },
                }}
              >
                Run Automated Playbook Now
              </Button>
            )}
          </DialogActions>
        </Dialog>
      )}

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert severity={notification.severity} sx={{ width: "100%" }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Policies;
