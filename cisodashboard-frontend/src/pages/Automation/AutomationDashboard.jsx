import React, { useEffect, useState } from "react";
import {
  Box, Typography, Button, Chip, Switch, IconButton, Tooltip,
  Table, TableHead, TableRow, TableCell, TableBody, Paper,
  Grid, Card, CardContent, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, Alert, CircularProgress,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import HistoryIcon from "@mui/icons-material/History";
import { useNavigate } from "react-router-dom";
import * as automationApi from "../../utils/automationApi";

const TRIGGER_LABELS = {
  risk_evaluated: "Risk Evaluated",
  device_offline: "Device Offline",
  agent_checkin: "Agent Check-in",
  manual: "Manual",
};

const TRIGGER_COLORS = {
  risk_evaluated: "error",
  device_offline: "warning",
  agent_checkin: "info",
  manual: "default",
};

export default function AutomationDashboard() {
  const navigate = useNavigate();
  const [rules, setRules] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, rule: null });
  const [testDialog, setTestDialog] = useState({ open: false, rule: null });
  const [testResult, setTestResult] = useState(null);
  const [tab, setTab] = useState("rules"); // "rules" | "history"

  const load = async () => {
    try {
      setLoading(true);
      const [r, e, s] = await Promise.all([
        automationApi.listRules(),
        automationApi.listExecutions({ limit: 50 }),
        automationApi.getStats(),
      ]);
      setRules(r);
      setExecutions(e);
      setStats(s);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (rule) => {
    try {
      const updated = await automationApi.toggleRule(rule.id);
      setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await automationApi.deleteRule(deleteDialog.rule.id);
      setDeleteDialog({ open: false, rule: null });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTest = async () => {
    try {
      const result = await automationApi.testRule(testDialog.rule.id, {});
      setTestResult(result);
    } catch (err) {
      setTestResult({ error: err.message });
    }
  };

  if (loading) return <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Automation Engine</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/automation/new")}
        >
          New Rule
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: "Total Rules",      value: stats.total_rules,      color: "#1976d2" },
            { label: "Enabled Rules",    value: stats.enabled_rules,    color: "#388e3c" },
            { label: "Total Executions", value: stats.total_executions, color: "#6a1b9a" },
            { label: "Failed Executions",value: stats.failed_executions,color: "#c62828" },
          ].map((s) => (
            <Grid item xs={6} md={3} key={s.label}>
              <Card sx={{ borderTop: `4px solid ${s.color}` }}>
                <CardContent sx={{ textAlign: "center" }}>
                  <Typography variant="h4" fontWeight="bold" color={s.color}>{s.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Tab selector */}
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <Button
          variant={tab === "rules" ? "contained" : "outlined"}
          onClick={() => setTab("rules")}
        >
          Rules
        </Button>
        <Button
          variant={tab === "history" ? "contained" : "outlined"}
          startIcon={<HistoryIcon />}
          onClick={() => setTab("history")}
        >
          Execution History
        </Button>
      </Box>

      {/* ── Rules Table ───────────────────────────────────────────────── */}
      {tab === "rules" && (
        <Paper>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "primary.dark" }}>
                {["Name", "Trigger", "Conditions", "Actions", "Enabled", "Created", ""].map((h) => (
                  <TableCell key={h} sx={{ color: "white", fontWeight: "bold" }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                    No automation rules yet — click "New Rule" to create one.
                  </TableCell>
                </TableRow>
              )}
              {rules.map((rule) => (
                <TableRow key={rule.id} hover>
                  <TableCell>
                    <Typography fontWeight="bold">{rule.name}</Typography>
                    {rule.description && (
                      <Typography variant="caption" color="text.secondary">{rule.description}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={TRIGGER_LABELS[rule.trigger_type] || rule.trigger_type}
                      color={TRIGGER_COLORS[rule.trigger_type] || "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{(rule.conditions_json || []).length} condition(s)</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{(rule.actions_json || []).length} action(s)</Typography>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={rule.enabled}
                      onChange={() => handleToggle(rule)}
                      color="success"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {rule.created_at ? new Date(rule.created_at).toLocaleDateString() : "—"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Test rule">
                      <IconButton size="small" color="info"
                        onClick={() => { setTestDialog({ open: true, rule }); setTestResult(null); }}>
                        <PlayArrowIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => navigate(`/automation/${rule.id}/edit`)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error"
                        onClick={() => setDeleteDialog({ open: true, rule })}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* ── Execution History ─────────────────────────────────────────── */}
      {tab === "history" && (
        <Paper>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.800" }}>
                {["Rule", "Trigger", "Device ID", "Actions Taken", "Status", "Time"].map((h) => (
                  <TableCell key={h} sx={{ color: "white", fontWeight: "bold" }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {executions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                    No executions yet.
                  </TableCell>
                </TableRow>
              )}
              {executions.map((e) => (
                <TableRow key={e.id} hover>
                  <TableCell><Typography fontWeight="bold">{e.rule_name}</Typography></TableCell>
                  <TableCell>
                    <Chip label={TRIGGER_LABELS[e.trigger_type] || e.trigger_type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{e.device_id || "—"}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                      {(e.actions_taken || []).map((a, i) => (
                        <Chip key={i} label={a} size="small" variant="outlined" color="primary" />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={e.status}
                      size="small"
                      color={e.status === "success" ? "success" : "error"}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {e.executed_at ? new Date(e.executed_at).toLocaleString() : "—"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Delete confirm dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, rule: null })}>
        <DialogTitle>Delete Rule</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete rule <strong>{deleteDialog.rule?.name}</strong>? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, rule: null })}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Test dialog */}
      <Dialog open={testDialog.open} onClose={() => setTestDialog({ open: false, rule: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Test Rule: {testDialog.rule?.name}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            This runs the rule immediately with an empty context (no device). Useful for verifying action wiring.
          </DialogContentText>
          <Divider sx={{ mb: 2 }} />
          {testResult ? (
            <Box>
              <Alert severity={testResult.error ? "error" : testResult.conditions_matched ? "success" : "warning"} sx={{ mb: 1 }}>
                {testResult.error
                  ? `Error: ${testResult.error}`
                  : testResult.conditions_matched
                    ? `Conditions matched! Actions fired: ${(testResult.actions_taken || []).join(", ") || "none"}`
                    : "Conditions did NOT match — no actions fired."}
              </Alert>
              {!testResult.error && (
                <Typography variant="caption" color="text.secondary">
                  Context used: {JSON.stringify(testResult.context_used)}
                </Typography>
              )}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">Click "Run Test" to execute.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialog({ open: false, rule: null })}>Close</Button>
          <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={handleTest}>Run Test</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
