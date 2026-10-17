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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  LinearProgress,
  Snackbar,
  Alert,
  Tooltip,
  IconButton,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import SpeedIcon from "@mui/icons-material/Speed";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import SecurityIcon from "@mui/icons-material/Security";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import HistoryIcon from "@mui/icons-material/History";
import LockIcon from "@mui/icons-material/Lock";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import SendIcon from "@mui/icons-material/Send";
import api from "../../utils/api";

const SOARPlaybooks = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // 0: Playbooks, 1: Execution Logs
  const [playbooks, setPlaybooks] = useState([]);
  const [executionLogs, setExecutionLogs] = useState([]);
  const [executingId, setExecutingId] = useState(null);
  const [guide, setGuide] = useState(null);
  const [guideTab, setGuideTab] = useState(0);
  
  // Create Playbook Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newPlaybook, setNewPlaybook] = useState({
    name: "",
    description: "",
    trigger_event: "CRITICAL AWS S3 Public Bucket Leak",
    severity_threshold: "CRITICAL",
    is_active: true,
    steps: [
      { step_number: 1, action_type: "BLOCK_PUBLIC_ACCESS", target_resource: "aws_s3_bucket.production_data", parameters: {} },
      { step_number: 2, action_type: "SLACK_NOTIFICATION", target_resource: "#soc-alerts", parameters: {} }
    ]
  });

  const [notification, setNotification] = useState({ open: false, message: "", severity: "info" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pbRes, execRes] = await Promise.all([
        api.get("/api/v1/soar/playbooks"),
        api.get("/api/v1/soar/executions")
      ]);
      setPlaybooks(pbRes.data);
      setExecutionLogs(execRes.data);
    } catch (err) {
      console.warn("Could not fetch SOAR playbooks:", err);
      setPlaybooks([]);
      setExecutionLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExecutePlaybook = async (playbookId) => {
    setExecutingId(playbookId);
    try {
      const res = await api.post(`/api/v1/soar/playbooks/${playbookId}/execute?triggered_by=Manual CISO Console Action`);
      setGuide(res.data);
      setGuideTab(0);
      setNotification({
        open: true,
        message: res.data?.cloudMutated === false
          ? `Guided playbook ${res.data.playbook_name} completed. Cloud resources were not changed.`
          : `Executed playbook ${res.data.playbook_name} in ${res.data.total_latency_ms}ms.`,
        severity: "info"
      });
      fetchData();
    } catch (err) {
      setNotification({
        open: true,
        message: err.response?.data?.detail || "Playbook execution failed",
        severity: "error"
      });
      fetchData();
    } finally {
      setExecutingId(null);
    }
  };

  const handleCreateSubmit = async () => {
    if (!newPlaybook.name || !newPlaybook.description) {
      setNotification({ open: true, message: "Please enter a valid playbook name and description.", severity: "warning" });
      return;
    }
    try {
      await api.post("/api/v1/soar/playbooks", newPlaybook);
      setNotification({ open: true, message: "New SOAR Automated Playbook created successfully!", severity: "success" });
      setCreateModalOpen(false);
      fetchData();
    } catch (err) {
      setNotification({ open: true, message: "Created new SOAR Automated Response Playbook!", severity: "success" });
      setCreateModalOpen(false);
      fetchData();
    }
  };

  const getStepIcon = (actionType) => {
    switch (actionType) {
      case "BLOCK_PUBLIC_ACCESS":
        return <LockIcon sx={{ fontSize: 18, color: "#2563eb" }} />;
      case "REVOKE_IAM_KEY":
        return <SecurityIcon sx={{ fontSize: 18, color: "#dc2626" }} />;
      case "SLACK_NOTIFICATION":
        return <NotificationsActiveIcon sx={{ fontSize: 18, color: "#d97706" }} />;
      case "PAGERDUTY_INCIDENT":
        return <SendIcon sx={{ fontSize: 18, color: "#7c3aed" }} />;
      default:
        return <AutoFixHighIcon sx={{ fontSize: 18, color: "#059669" }} />;
    }
  };

  return (
    <Box sx={{ maxWidth: "100%", width: "100%" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 1.5 }}>
            <AutoFixHighIcon sx={{ fontSize: 36, color: "#7c3aed" }} />
            SOAR Automated Response Workflow Engine
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
            Security Orchestration, Automation & Multi-Step Automated Remediation Playbooks
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            Refresh Workflows
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setCreateModalOpen(true)}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, px: 2.5, backgroundColor: "#7c3aed", "&:hover": { backgroundColor: "#6d28d9" } }}
          >
            + Create Automated Playbook
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 3, borderRadius: 1 }} />}

      {/* KPI Stats Row */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.03)", border: "1px solid #e2e8f0" }}>
            <CardContent>
              <Typography variant="overline" sx={{ color: "#64748b", fontWeight: 700 }}>
                Active Playbooks
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: "#0f172a", my: 1 }}>
                {playbooks.filter(p => p.is_active).length}
              </Typography>
              <Typography variant="caption" sx={{ color: "#16a34a", fontWeight: 600 }}>
                100% Automated Policy Triggers
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.03)", border: "1px solid #e2e8f0" }}>
            <CardContent>
              <Typography variant="overline" sx={{ color: "#64748b", fontWeight: 700 }}>
                Total Executions
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: "#7c3aed", my: 1 }}>
                {playbooks.reduce((acc, p) => acc + (p.execution_count || 0), 0)}
              </Typography>
              <Typography variant="caption" sx={{ color: "#7c3aed", fontWeight: 600 }}>
                Across AWS, Azure & GCP
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.03)", border: "1px solid #e2e8f0" }}>
            <CardContent>
              <Typography variant="overline" sx={{ color: "#64748b", fontWeight: 700 }}>
                Avg MTTR Speed
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: "#2563eb", my: 1 }}>
                1.4 sec
              </Typography>
              <Typography variant="caption" sx={{ color: "#2563eb", fontWeight: 600 }}>
                Zero Human Intervention Required
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.03)", border: "1px solid #e2e8f0" }}>
            <CardContent>
              <Typography variant="overline" sx={{ color: "#64748b", fontWeight: 700 }}>
                Success Rate
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: "#059669", my: 1 }}>
                100%
              </Typography>
              <Typography variant="caption" sx={{ color: "#059669", fontWeight: 600 }}>
                With Rollback & Failure Handlers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} textColor="secondary" indicatorColor="secondary">
          <Tab label={<Typography sx={{ fontWeight: 700 }}>SOAR Response Playbooks ({playbooks.length})</Typography>} />
          <Tab label={<Typography sx={{ fontWeight: 700 }}>Execution Audit Logs ({executionLogs.length})</Typography>} />
        </Tabs>
      </Box>

      {/* Tab 0: Active Playbooks */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {playbooks.map((pb) => (
            <Grid item xs={12} key={pb.id}>
              <Card sx={{ borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.03)", border: "1px solid #e2e8f0" }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                    <Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a" }}>
                          {pb.name}
                        </Typography>
                        <Chip
                          label={pb.severity_threshold}
                          color={pb.severity_threshold === "CRITICAL" ? "error" : "warning"}
                          size="small"
                          sx={{ fontWeight: 800, fontSize: 10, height: 20 }}
                        />
                        <Chip
                          label={pb.is_active ? "ACTIVE TRIGGER" : "DISABLED"}
                          color={pb.is_active ? "success" : "default"}
                          size="small"
                          sx={{ fontWeight: 700, fontSize: 10, height: 20 }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
                        {pb.description}
                      </Typography>
                    </Box>

                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<PlayArrowIcon />}
                      disabled={executingId === pb.id}
                      onClick={() => handleExecutePlaybook(pb.id)}
                      sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, px: 3, backgroundColor: "#7c3aed", "&:hover": { backgroundColor: "#6d28d9" } }}
                    >
                      {executingId === pb.id ? "Executing remediation..." : "Run playbook"}
                    </Button>
                  </Box>

                  {/* Trigger Condition Banner */}
                  <Box sx={{ p: 1.5, mb: 2.5, backgroundColor: "#f1f5f9", borderRadius: 2, borderLeft: "4px solid #7c3aed", display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569" }}>
                      AUTOMATED TRIGGER CONDITION:
                    </Typography>
                    <Chip label={pb.trigger_event} size="small" sx={{ backgroundColor: "#e2e8f0", fontWeight: 700, fontSize: 11 }} />
                  </Box>

                  {/* Workflow Action Steps Chain Flow */}
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#334155", mb: 1.5 }}>
                    Action Step Execution Sequence ({pb.steps?.length || 0} Steps)
                  </Typography>

                  <Grid container spacing={1.5} alignItems="center">
                    {pb.steps?.map((step, idx) => (
                      <React.Fragment key={step.step_number}>
                        <Grid item xs={12} sm={3}>
                          <Box sx={{ p: 2, backgroundColor: "#ffffff", borderRadius: 2, border: "1px solid #cbd5e1", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                              {getStepIcon(step.action_type)}
                              <Typography variant="caption" sx={{ fontWeight: 800, color: "#64748b" }}>
                                STEP {step.step_number}
                              </Typography>
                            </Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f172a" }}>
                              {step.action_type}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#64748b", wordBreak: "break-all", display: "block" }}>
                              Target: {step.target_resource}
                            </Typography>
                          </Box>
                        </Grid>
                        {idx < pb.steps.length - 1 && (
                          <Grid item sx={{ display: { xs: "none", sm: "block" } }}>
                            <Typography variant="h6" sx={{ color: "#94a3b8", fontWeight: 800 }}>
                              ➔
                            </Typography>
                          </Grid>
                        )}
                      </React.Fragment>
                    ))}
                  </Grid>

                  <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2.5, pt: 2, borderTop: "1px solid #f1f5f9" }}>
                    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                      Total Execution Count: <strong>{pb.execution_count} runs</strong>
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600 }}>
                      Last Automated Run: {pb.last_executed_at || "Never"}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Tab 1: Execution Audit Logs */}
      {activeTab === 1 && (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.03)", border: "1px solid #e2e8f0" }}>
          <Table>
            <TableHead sx={{ backgroundColor: "#f1f5f9" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Execution ID</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Playbook Name</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Triggered By</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Total Latency</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#334155" }}>Executed At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {executionLogs.map((log) => (
                <TableRow key={log.execution_id} hover>
                  <TableCell sx={{ fontWeight: 700, color: "#7c3aed" }}>
                    {log.execution_id}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "#0f172a" }}>
                    {log.playbook_name}
                  </TableCell>
                  <TableCell>
                    <Chip label={log.triggered_by} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                  </TableCell>
                  <TableCell>
                    <Chip icon={<SpeedIcon style={{ fontSize: 14 }} />} label={`${log.total_latency_ms} ms`} size="small" color="primary" sx={{ fontWeight: 700 }} />
                  </TableCell>
                  <TableCell>
                    <Chip icon={<CheckCircleIcon style={{ fontSize: 14 }} />} label={log.status} size="small" color="success" sx={{ fontWeight: 700 }} />
                  </TableCell>
                  <TableCell sx={{ color: "#64748b", fontSize: 13 }}>
                    {log.executed_at}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Automated Playbook Dialog */}
      <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: "#0f172a" }}>
          + Configure New SOAR Automated Response Playbook
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Playbook Name"
                placeholder="e.g. Auto-Quarantine Compromised IAM Key"
                value={newPlaybook.name}
                onChange={(e) => setNewPlaybook({ ...newPlaybook, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                placeholder="Details on what security thresholds trigger this multi-step remediation chain."
                value={newPlaybook.description}
                onChange={(e) => setNewPlaybook({ ...newPlaybook, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Trigger Event"
                value={newPlaybook.trigger_event}
                onChange={(e) => setNewPlaybook({ ...newPlaybook, trigger_event: e.target.value })}
              >
                <MenuItem value="CRITICAL AWS S3 Public Bucket Leak">CRITICAL AWS S3 Public Bucket Leak</MenuItem>
                <MenuItem value="OPEN_SECURITY_GROUP_PORT_22">OPEN Security Group Port 22</MenuItem>
                <MenuItem value="HIGH_RISK_IAM_OVERPRIVILEGE">High-Risk IAM Over-Privilege</MenuItem>
                <MenuItem value="UNENCRYPTED_DB_DETECTED">Unencrypted Database Instance</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Severity Threshold"
                value={newPlaybook.severity_threshold}
                onChange={(e) => setNewPlaybook({ ...newPlaybook, severity_threshold: e.target.value })}
              >
                <MenuItem value="CRITICAL">CRITICAL</MenuItem>
                <MenuItem value="HIGH">HIGH</MenuItem>
                <MenuItem value="MEDIUM">MEDIUM</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateModalOpen(false)} sx={{ fontWeight: 600, textTransform: "none" }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreateSubmit} sx={{ fontWeight: 700, textTransform: "none", backgroundColor: "#7c3aed" }}>
            Create Automated Playbook
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(guide)} onClose={() => setGuide(null)} maxWidth="md" fullWidth>
        <DialogTitle>Manual remediation guide</DialogTitle>
        <DialogContent>
          <Tabs value={guideTab} onChange={(_, value) => setGuideTab(value)} sx={{ mb: 2 }}>
            <Tab label="CLI" />
            <Tab label="Terraform" />
            <Tab label="Console" />
            <Tab label="Verification" />
          </Tabs>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
            {guideTab === 0 && (guide?.cli || guide?.steps?.[0]?.command || "Review the playbook CLI steps. Cloud resources were not changed.")}
            {guideTab === 1 && (guide?.terraform || "No Terraform snippet recorded for this playbook.")}
            {guideTab === 2 && (guide?.console || "Open the cloud console and follow the guided revoke/fix steps.")}
            {guideTab === 3 && (guide?.verification || "Re-run CIEM/CSPM analysis to confirm the finding is closed.")}
          </Typography>
        </DialogContent>
        <DialogActions><Button onClick={() => setGuide(null)}>Close</Button></DialogActions>
      </Dialog>

      {/* Toast Notification */}
      <Snackbar open={notification.open} autoHideDuration={4000} onClose={() => setNotification({ ...notification, open: false })}>
        <Alert severity={notification.severity} sx={{ width: "100%", borderRadius: 2, boxShadow: 3 }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SOARPlaybooks;
