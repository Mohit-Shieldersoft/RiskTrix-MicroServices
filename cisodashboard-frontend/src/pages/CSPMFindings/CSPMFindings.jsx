import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  Snackbar,
  Alert,
  Tooltip,
  LinearProgress,
  IconButton,
  Paper,
  Checkbox,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";
import BuildIcon from "@mui/icons-material/Build";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefreshIcon from "@mui/icons-material/Refresh";
import SecurityIcon from "@mui/icons-material/Security";
import ShieldIcon from "@mui/icons-material/Shield";
import TerminalIcon from "@mui/icons-material/Terminal";
import CodeIcon from "@mui/icons-material/Code";
import ListAltIcon from "@mui/icons-material/ListAlt";
import api from "../../utils/api";
import PageShell, { EmptyState } from "../../components/common/PageShell";
import NoCloudWorkspace from "../../components/common/NoCloudWorkspace";

const DEFAULT_FINDINGS = [];

const CSPMFindings = () => {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Tab State for Active Playbook View per Finding: { [finding_id]: 0 } (0: CLI, 1: Terraform, 2: Console)
  const [playbookTabs, setPlaybookTabs] = useState({});

  const [scanJobs, setScanJobs] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [apiStats, setApiStats] = useState(null);
  const [slaStats, setSlaStats] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [assigneeDraft, setAssigneeDraft] = useState({});
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchScanJobs = async () => {
    try {
      const res = await api.get("/api/v1/cloud/scan-jobs");
      setScanJobs(Array.isArray(res.data) ? res.data : []);
    } catch {
      setScanJobs([]);
    }
  };

  useEffect(() => {
    fetchFindings();
    fetchScanJobs();
  }, []);

  const exportFindings = async () => {
    try {
      const res = await api.get("/api/v1/cloud/findings/export");
      const blob = new Blob([res.data.content || ""], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "cspm-findings.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setNotification({
        open: true,
        message: err.response?.data?.detail || "Export failed",
        severity: "error",
      });
    }
  };

  const fetchFindings = async () => {
    setLoading(true);
    try {
      const [response, accountRes, statsRes, slaRes] = await Promise.all([
        api.get("/api/v1/cloud/findings", { params: { search: searchTerm || undefined, provider: providerFilter !== "ALL" ? providerFilter : undefined } }),
        api.get("/api/v1/cloud/accounts"),
        api.get("/api/v1/cloud/findings/stats").catch(() => ({ data: null })),
        api.get("/api/v1/cloud/findings/sla/stats").catch(() => ({ data: null })),
      ]);
      setApiStats(statsRes.data || null);
      setSlaStats(slaRes.data || null);
      setAccounts(Array.isArray(accountRes.data) ? accountRes.data : []);
      if (response.data && Array.isArray(response.data)) {
        const normalized = response.data.map((f, idx) => {
            const findingId = f.finding_id || f.id || f.policy_id || `finding-${idx}`;
            return {
              ...f,
              finding_id: findingId,
              title: f.title || f.name || "Security Misconfiguration Finding",
              provider: f.provider || "AWS",
              severity: f.severity || "HIGH",
              status: f.status || "OPEN",
              account_name: f.account_name || f.account_id || "Cloud Account",
              asset_id: f.asset_id || f.resource_id || "N/A",
              asset_name: f.asset_name || f.resource_name || f.resource_id || "Cloud Asset",
              framework: f.framework || "CIS Benchmark",
              description: f.description || "Policy compliance violation flagged.",
              risk_impact: f.risk_impact || "Potential risk of unauthorized access or data exposure.",
              cli_playbook: f.cli_playbook || f.remediation_playbook || "",
              terraform_playbook: f.terraform_playbook || "",
              console_playbook: f.console_playbook || "",
              first_detected: f.first_detected || f.created_at || "",
              assigned_to: f.assigned_to || "",
            };
          });
        setFindings(normalized);
      } else {
        setFindings([]);
      }
    } catch (err) {
      console.warn("Could not fetch CSPM findings:", err);
      setFindings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemediate = async (findingId) => {
    try {
      await api.post(`/api/v1/cloud/findings/${findingId}/remediate`);
      setFindings((prev) =>
        prev.map((f) => (f.finding_id === findingId ? { ...f, status: "RESOLVED" } : f))
      );
      setNotification({
        open: true,
        message: `Successfully executed auto-remediation playbook for ${findingId}!`,
        severity: "success",
      });
    } catch (err) {
      setNotification({
        open: true,
        message: err.response?.data?.detail || `Failed to remediate ${findingId}`,
        severity: "error",
      });
    }
  };

  const handleSuppress = async (findingId) => {
    try {
      await api.post(`/api/v1/cloud/findings/${findingId}/suppress`);
      setFindings((prev) =>
        prev.map((f) => (f.finding_id === findingId ? { ...f, status: "SUPPRESSED" } : f))
      );
      setNotification({
        open: true,
        message: `Suppressed finding ${findingId}`,
        severity: "info",
      });
    } catch (err) {
      setNotification({
        open: true,
        message: err.response?.data?.detail || `Failed to suppress ${findingId}`,
        severity: "error",
      });
    }
  };

  const handleAssign = async (findingId) => {
    const assignee = (assigneeDraft[findingId] || "").trim();
    if (!assignee) return;
    try {
      await api.patch(`/api/v1/cloud/findings/${findingId}/assign?assignee=${encodeURIComponent(assignee)}`);
      setFindings((prev) =>
        prev.map((f) => (f.finding_id === findingId ? { ...f, assigned_to: assignee, status: "ASSIGNED" } : f))
      );
      setNotification({ open: true, message: `Assigned ${findingId} to ${assignee}`, severity: "success" });
    } catch (err) {
      setNotification({
        open: true,
        message: err.response?.data?.detail || `Failed to assign ${findingId}`,
        severity: "error",
      });
    }
  };

  const handleBulkStatus = async (status) => {
    if (!selectedIds.length) return;
    try {
      await api.patch("/api/v1/cloud/findings/bulk-status", { finding_ids: selectedIds, status });
      setFindings((prev) =>
        prev.map((f) => (selectedIds.includes(f.finding_id) ? { ...f, status } : f))
      );
      setSelectedIds([]);
      setNotification({ open: true, message: `Updated ${selectedIds.length} findings to ${status}`, severity: "success" });
    } catch (err) {
      setNotification({
        open: true,
        message: err.response?.data?.detail || "Bulk update failed",
        severity: "error",
      });
    }
  };

  const toggleSelected = (findingId, checked) => {
    setSelectedIds((prev) => (checked ? [...prev, findingId] : prev.filter((id) => id !== findingId)));
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    setNotification({
      open: true,
      message: "Copied playbook snippet to clipboard!",
      severity: "success",
    });
  };

  const handleTabChange = (findingId, newTab) => {
    setPlaybookTabs((prev) => ({ ...prev, [findingId]: newTab }));
  };

  const filteredFindings = findings.filter((item) => {
    const matchesSearch =
      String(item.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.rule_id || item.policy_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.asset_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.asset_id || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity =
      severityFilter === "ALL" || item.severity.toUpperCase() === severityFilter.toUpperCase();

    const matchesProvider =
      providerFilter === "ALL" || item.provider.toUpperCase() === providerFilter.toUpperCase();

    const matchesStatus =
      statusFilter === "ALL" || item.status.toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesSeverity && matchesProvider && matchesStatus;
  });

  // Severity Chips (#d32f2f for Critical, #f57c00 for High)
  const getSeverityChip = (severity) => {
    let color = "#fff";
    let bg = "#0288d1"; // Low default

    if (severity === "CRITICAL") {
      bg = "#d32f2f"; // Exact required color
    } else if (severity === "HIGH") {
      bg = "#f57c00"; // Exact required color
    } else if (severity === "MEDIUM") {
      bg = "#ed6c02";
    }

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
          letterSpacing: "0.5px",
        }}
      />
    );
  };

  // Aggregated Counter Stats
  const totalOpen = apiStats?.open ?? findings.filter((f) => f.status === "OPEN").length;
  const criticalCount = apiStats?.critical ?? findings.filter((f) => f.severity === "CRITICAL" && f.status === "OPEN").length;
  const highCount = findings.filter((f) => f.severity === "HIGH" && f.status === "OPEN").length;
  const resolvedCount = findings.filter((f) => f.status === "RESOLVED" || f.status === "SUPPRESSED").length;

  return (
    <PageShell
      title="CSPM Findings & Remediation"
      subtitle="Policy violations from connected cloud accounts. Remediation is guided and recorded; it does not mutate the cloud account."
      actions={
        <>
          <Button variant="outlined" onClick={exportFindings} disabled={!accounts.length}>Export CSV</Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            disabled={!accounts.length}
            onClick={async () => {
              try {
                const res = await api.post("/api/v1/cloud/scan");
                setNotification({
                  open: true,
                  message: `Scan completed. Findings created: ${res.data.findings_created ?? 0}`,
                  severity: "success",
                });
              } catch (err) {
                setNotification({
                  open: true,
                  message: err.response?.data?.detail || "Scan failed",
                  severity: "error",
                });
              }
              fetchFindings();
              fetchScanJobs();
            }}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Rescan Policies
          </Button>
        </>
      }
    >
      {accounts.length === 0 && !loading ? (
        <NoCloudWorkspace title="No CSPM findings" message="Connect a cloud account and run a posture scan. This page stays empty until live evidence exists." />
      ) : null}

      {scanJobs.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Recent scan jobs
          </Typography>
          {scanJobs.slice(0, 5).map((job) => (
            <Typography key={job.id} variant="body2">
              {job.provider || "ALL"} · {job.status} · assets {job.total_assets ?? 0} · findings {job.findings_created ?? 0} · {job.started_at}
            </Typography>
          ))}
        </Paper>
      )}

      {/* Metric Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #2563eb" }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Total Open Misconfigurations
                </Typography>
                <WarningIcon sx={{ color: "#2563eb" }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#0f172a" }}>
                {totalOpen}
              </Typography>
              <Typography variant="caption" color="error">SLA breached: {slaStats?.sla_breached ?? 0}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #d32f2f" }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Critical Findings (#d32f2f)
                </Typography>
                <ShieldIcon sx={{ color: "#d32f2f" }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#d32f2f" }}>
                {criticalCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #f57c00" }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  High Severity Findings (#f57c00)
                </Typography>
                <SecurityIcon sx={{ color: "#f57c00" }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#f57c00" }}>
                {highCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #16a34a" }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Remediated / Suppressed
                </Typography>
                <CheckCircleIcon sx={{ color: "#16a34a" }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#16a34a" }}>
                {resolvedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Toolbar */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search finding, rule ID, or asset..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: "#94a3b8", mr: 1 }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Severity Level</InputLabel>
              <Select value={severityFilter} label="Severity Level" onChange={(e) => setSeverityFilter(e.target.value)}>
                <MenuItem value="ALL">All Severities</MenuItem>
                <MenuItem value="CRITICAL">Critical (#d32f2f)</MenuItem>
                <MenuItem value="HIGH">High (#f57c00)</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="LOW">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4} md={3}>
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

          <Grid item xs={12} sm={4} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="OPEN">Open</MenuItem>
                <MenuItem value="ASSIGNED">Assigned</MenuItem>
                <MenuItem value="RESOLVED">Resolved</MenuItem>
                <MenuItem value="SUPPRESSED">Suppressed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {selectedIds.length > 0 && (
        <Paper sx={{ p: 1.5, mb: 2, display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <Typography variant="body2" sx={{ fontWeight: 700, mr: 1 }}>
            {selectedIds.length} selected
          </Typography>
          <Button size="small" variant="outlined" onClick={() => handleBulkStatus("SUPPRESSED")}>Bulk suppress</Button>
          <Button size="small" variant="outlined" onClick={() => handleBulkStatus("REMEDIATED")}>Bulk resolve</Button>
          <Button size="small" onClick={() => setSelectedIds([])}>Clear</Button>
        </Paper>
      )}

      {/* Accordion Findings List */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {filteredFindings.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center", border: "1px dashed #cbd5e1" }}>
          <Typography variant="body1" sx={{ color: "#64748b" }}>
            No security findings matching your criteria.
          </Typography>
        </Paper>
      ) : (
        filteredFindings.map((item, idx) => {
          const findingKey = item.finding_id || item.id || item.policy_id || `finding-${idx}`;
          const currentPlaybookTab = playbookTabs[findingKey] || 0;

          return (
            <Accordion
              key={findingKey}
              sx={{
                mb: 1.5,
                borderRadius: "8px !important",
                border: "1px solid #e2e8f0",
                "&:before": { display: "none" },
                overflow: "hidden",
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    width: "100%",
                    flexWrap: "wrap",
                    pr: 2,
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={selectedIds.includes(item.finding_id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => toggleSelected(item.finding_id, e.target.checked)}
                  />
                  {getSeverityChip(item.severity)}

                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0f172a", flexGrow: 1 }}>
                    {item.title}
                  </Typography>

                  <Chip label={item.rule_id} size="small" variant="outlined" sx={{ fontFamily: "monospace", fontSize: "11px" }} />

                  <Chip label={item.provider} size="small" sx={{ bgcolor: "#f1f5f9", fontWeight: 700 }} />

                  <Chip
                    label={item.framework}
                    size="small"
                    sx={{ bgcolor: "#ede9fe", color: "#6d28d9", fontWeight: 600, fontSize: "11px" }}
                  />

                  {item.status === "RESOLVED" || item.status === "REMEDIATED" ? (
                    <Chip label={item.status} size="small" sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontWeight: 700 }} />
                  ) : null}
                  {item.status === "ASSIGNED" && (
                    <Chip label={`ASSIGNED${item.assigned_to ? ` · ${item.assigned_to}` : ""}`} size="small" sx={{ bgcolor: "#e3f2fd", color: "#1565c0", fontWeight: 700 }} />
                  )}
                  {item.status === "SUPPRESSED" && (
                    <Chip label="SUPPRESSED" size="small" sx={{ bgcolor: "#f1f5f9", color: "#64748b", fontWeight: 700 }} />
                  )}
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ bgcolor: "#fafafa", borderTop: "1px solid #f1f5f9", p: 3 }}>
                <Grid container spacing={3}>
                  {/* Left Column: Description & Impact */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#334155", mb: 0.5 }}>
                      Vulnerability Description
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#475569", mb: 2 }}>
                      {item.description}
                    </Typography>

                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#b91c1c", mb: 0.5 }}>
                      Risk Impact & Benchmark Clause
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#7f1d1d", bgcolor: "#fef2f2", p: 1.5, borderRadius: "6px", mb: 2, borderLeft: "3px solid #dc2626" }}>
                      <strong>{item.section}</strong>: {item.risk_impact}
                    </Typography>

                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#334155", mb: 0.5 }}>
                      Target Resource Identifier
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#0f172a", bgcolor: "#e2e8f0", p: 1, borderRadius: "4px", display: "block" }}>
                      {item.asset_id}
                    </Typography>
                  </Grid>

                  {/* Right Column: Interactive Remediation Playbook */}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ border: "1px solid #cbd5e1", borderRadius: "8px", overflow: "hidden", bgcolor: "#ffffff" }}>
                      <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "#f8fafc" }}>
                        <Tabs
                          value={currentPlaybookTab}
                          onChange={(e, val) => handleTabChange(item.finding_id, val)}
                          size="small"
                        >
                          <Tab icon={<TerminalIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="CLI Command" sx={{ textTransform: "none", fontWeight: 600, minHeight: 40 }} />
                          <Tab icon={<CodeIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Terraform Code" sx={{ textTransform: "none", fontWeight: 600, minHeight: 40 }} />
                          <Tab icon={<ListAltIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Console Steps" sx={{ textTransform: "none", fontWeight: 600, minHeight: 40 }} />
                          <Tab icon={<CodeIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Evidence" sx={{ textTransform: "none", fontWeight: 600, minHeight: 40 }} />
                        </Tabs>
                      </Box>

                      {/* Tab 0: CLI Command */}
                      {currentPlaybookTab === 0 && (
                        <Box sx={{ p: 2, position: "relative", bgcolor: "rgba(63, 81, 181, 0.04)", color: "text.primary" }}>
                          <Tooltip title="Copy CLI Command">
                            <IconButton size="small" onClick={() => handleCopyText(item.cli_playbook)} sx={{ position: "absolute", top: 8, right: 8, color: "#94a3b8" }}>
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Typography variant="caption" sx={{ fontFamily: "monospace", fontSize: "12px", display: "block", pr: 4, whiteSpace: "pre-wrap" }}>
                            {item.cli_playbook}
                          </Typography>
                        </Box>
                      )}

                      {/* Tab 1: Terraform Code */}
                      {currentPlaybookTab === 1 && (
                        <Box sx={{ p: 2, position: "relative", bgcolor: "rgba(63, 81, 181, 0.04)", color: "text.primary" }}>
                          <Tooltip title="Copy Terraform Code">
                            <IconButton size="small" onClick={() => handleCopyText(item.terraform_playbook)} sx={{ position: "absolute", top: 8, right: 8, color: "#94a3b8" }}>
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Typography variant="caption" sx={{ fontFamily: "monospace", fontSize: "12px", display: "block", pr: 4, whiteSpace: "pre-wrap" }}>
                            {item.terraform_playbook}
                          </Typography>
                        </Box>
                      )}

                      {/* Tab 2: Console Steps */}
                      {currentPlaybookTab === 2 && (
                        <Box sx={{ p: 2 }}>
                          <Typography variant="body2" sx={{ color: "#334155", whiteSpace: "pre-wrap" }}>
                            {item.console_playbook}
                          </Typography>
                        </Box>
                      )}
                      {currentPlaybookTab === 3 && (
                        <Box sx={{ p: 2 }}>
                          <Typography variant="caption" sx={{ fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                            {JSON.stringify(item.evidence || item, null, 2)}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Action Execution Controls */}
                    <Box sx={{ display: "flex", gap: 1.5, mt: 2, justifyContent: "flex-end", flexWrap: "wrap", alignItems: "center" }}>
                      {(item.status === "OPEN" || item.status === "ASSIGNED") && (
                        <>
                          <TextField
                            size="small"
                            placeholder="Assignee"
                            value={assigneeDraft[item.finding_id] ?? item.assigned_to ?? ""}
                            onChange={(e) => setAssigneeDraft((prev) => ({ ...prev, [item.finding_id]: e.target.value }))}
                            sx={{ width: 160 }}
                          />
                          <Button size="small" variant="outlined" onClick={() => handleAssign(item.finding_id)} sx={{ textTransform: "none" }}>
                            Assign
                          </Button>
                          <Button
                            variant="outlined"
                            color="inherit"
                            size="small"
                            startIcon={<BlockIcon />}
                            onClick={() => handleSuppress(item.finding_id)}
                            sx={{ textTransform: "none" }}
                          >
                            Suppress Finding
                          </Button>

                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<BuildIcon />}
                            onClick={() => handleRemediate(item.finding_id)}
                            sx={{ textTransform: "none", fontWeight: 700, bgcolor: "#16a34a", "&:hover": { bgcolor: "#15803d" } }}
                          >
                            Auto-Remediate Finding
                          </Button>
                        </>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          );
        })
      )}

      {/* Snackbar Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert severity={notification.severity} sx={{ width: "100%" }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </PageShell>
  );
};

export default CSPMFindings;
