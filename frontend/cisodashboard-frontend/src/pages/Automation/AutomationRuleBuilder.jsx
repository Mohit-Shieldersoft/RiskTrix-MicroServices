import React, { useEffect, useState } from "react";
import {
  Box, Typography, Button, TextField, MenuItem, Select,
  FormControl, InputLabel, Paper, Grid, Divider, Alert,
  IconButton, Chip, Switch, FormControlLabel, CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import { useNavigate, useParams } from "react-router-dom";
import * as automationApi from "../../utils/automationApi";

// ── Reference data ────────────────────────────────────────────────────────────

const TRIGGERS = [
  { value: "risk_evaluated",  label: "Risk Evaluated",  hint: "Fires after every device risk evaluation." },
  { value: "device_offline",  label: "Device Offline",  hint: "Fires when a device goes offline." },
  { value: "agent_checkin",   label: "Agent Check-in",  hint: "Fires each time a device agent checks in." },
  { value: "manual",          label: "Manual Only",     hint: "Only fires when triggered via the Test button." },
];

const CONDITION_FIELDS_BY_TRIGGER = {
  risk_evaluated: [
    { value: "risk_score",              label: "Risk Score",              type: "number" },
    { value: "risk_level",              label: "Risk Level (critical/high/medium/low)", type: "text" },
    { value: "is_rooted",               label: "Is Rooted",               type: "bool" },
    { value: "encryption_enabled",      label: "Encryption Enabled",      type: "bool" },
    { value: "screen_lock_enabled",     label: "Screen Lock Enabled",     type: "bool" },
    { value: "os_outdated",             label: "OS Outdated",             type: "bool" },
    { value: "blacklisted_app_detected",label: "Blacklisted App Detected",type: "bool" },
  ],
  device_offline: [
    { value: "device_id",      label: "Device ID",        type: "number" },
    { value: "seconds_offline",label: "Seconds Offline",  type: "number" },
  ],
  agent_checkin: [
    { value: "battery_level",  label: "Battery Level (%)", type: "number" },
    { value: "storage_pct",    label: "Storage Used (%)",  type: "number" },
    { value: "network_status", label: "Network Status",    type: "text" },
  ],
  manual: [],
};

const OPS = [
  { value: "eq",       label: "= equals" },
  { value: "neq",      label: "≠ not equals" },
  { value: "gt",       label: "> greater than" },
  { value: "gte",      label: "≥ greater or equal" },
  { value: "lt",       label: "< less than" },
  { value: "lte",      label: "≤ less or equal" },
  { value: "is_true",  label: "is TRUE" },
  { value: "is_false", label: "is FALSE" },
  { value: "contains", label: "contains" },
];

const ACTION_TYPES = [
  { value: "lock_device",    label: "Lock Device",         params: [] },
  { value: "wipe_device",    label: "Wipe Device",         params: [] },
  { value: "restart_device", label: "Restart Device",      params: [] },
  { value: "sync_device",    label: "Sync Device",         params: [] },
  { value: "push_policy",    label: "Push Policy",         params: [] },
  { value: "create_alert",   label: "Create Alert",        params: ["severity", "alert_type", "message"] },
  { value: "log_remediation",label: "Log Remediation",     params: ["action_type", "notes"] },
  { value: "log_activity",   label: "Log Activity",        params: ["message"] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function emptyCondition() {
  return { field: "", op: "eq", value: "" };
}

function emptyAction() {
  return { type: "", severity: "high", alert_type: "automation_trigger", message: "", action_type: "note", notes: "" };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AutomationRuleBuilder() {
  const navigate = useNavigate();
  const { id } = useParams(); // present when editing
  const isEdit = Boolean(id);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState("risk_evaluated");
  const [conditions, setConditions] = useState([emptyCondition()]);
  const [actions, setActions] = useState([emptyAction()]);
  const [enabled, setEnabled] = useState(true);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load existing rule when editing
  useEffect(() => {
    if (!isEdit) return;
    automationApi.getRule(id).then((rule) => {
      setName(rule.name);
      setDescription(rule.description || "");
      setTriggerType(rule.trigger_type);
      setConditions(rule.conditions_json?.length ? rule.conditions_json : [emptyCondition()]);
      setActions(rule.actions_json?.length ? rule.actions_json : [emptyAction()]);
      setEnabled(rule.enabled);
    }).catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  // ── Conditions ──────────────────────────────────────────────────────────────

  const updateCondition = (idx, key, val) => {
    setConditions((prev) => prev.map((c, i) => i === idx ? { ...c, [key]: val } : c));
  };

  const addCondition = () => setConditions((prev) => [...prev, emptyCondition()]);

  const removeCondition = (idx) =>
    setConditions((prev) => prev.filter((_, i) => i !== idx));

  // ── Actions ─────────────────────────────────────────────────────────────────

  const updateAction = (idx, key, val) => {
    setActions((prev) => prev.map((a, i) => i === idx ? { ...a, [key]: val } : a));
  };

  const addAction = () => setActions((prev) => [...prev, emptyAction()]);

  const removeAction = (idx) =>
    setActions((prev) => prev.filter((_, i) => i !== idx));

  // ── Save ─────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!name.trim()) { setError("Rule name is required."); return; }
    if (actions.filter((a) => a.type).length === 0) { setError("At least one action is required."); return; }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      trigger_type: triggerType,
      conditions_json: conditions.filter((c) => c.field && c.op),
      actions_json: actions.filter((a) => a.type),
      enabled,
    };

    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await automationApi.updateRule(id, payload);
      } else {
        await automationApi.createRule(payload);
      }
      setSuccess(`Rule ${isEdit ? "updated" : "created"} successfully!`);
      setTimeout(() => navigate("/automation"), 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress /></Box>;

  const availableFields = CONDITION_FIELDS_BY_TRIGGER[triggerType] || [];
  const triggerHint = TRIGGERS.find((t) => t.value === triggerType)?.hint || "";

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate("/automation")}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight="bold">
          {isEdit ? "Edit Automation Rule" : "Create Automation Rule"}
        </Typography>
      </Box>

      {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Basic info */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Rule Details</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField
              label="Rule Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth size="small"
              placeholder="e.g. Lock critical-risk rooted devices"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={<Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} color="success" />}
              label={enabled ? "Enabled" : "Disabled"}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth size="small" multiline rows={2}
              placeholder="Optional description of what this rule does"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Trigger */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Trigger</Typography>
        <FormControl fullWidth size="small">
          <InputLabel>When to evaluate this rule</InputLabel>
          <Select
            value={triggerType}
            label="When to evaluate this rule"
            onChange={(e) => { setTriggerType(e.target.value); setConditions([emptyCondition()]); }}
          >
            {TRIGGERS.map((t) => (
              <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {triggerHint && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            {triggerHint}
          </Typography>
        )}
      </Paper>

      {/* Conditions */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6">Conditions (ALL must match)</Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={addCondition}>
            Add Condition
          </Button>
        </Box>
        {conditions.map((cond, idx) => (
          <Box key={idx} sx={{ display: "flex", gap: 1, mb: 1.5, alignItems: "center", flexWrap: "wrap" }}>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Field</InputLabel>
              <Select
                value={cond.field}
                label="Field"
                onChange={(e) => updateCondition(idx, "field", e.target.value)}
              >
                {availableFields.map((f) => (
                  <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel>Operator</InputLabel>
              <Select
                value={cond.op}
                label="Operator"
                onChange={(e) => updateCondition(idx, "op", e.target.value)}
              >
                {OPS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {!["is_true", "is_false"].includes(cond.op) && (
              <TextField
                size="small"
                label="Value"
                value={cond.value}
                onChange={(e) => updateCondition(idx, "value", e.target.value)}
                sx={{ minWidth: 140 }}
              />
            )}

            <IconButton size="small" color="error" onClick={() => removeCondition(idx)}
              disabled={conditions.length === 1}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
        {availableFields.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            This trigger has no fields. The rule will fire unconditionally on every trigger event.
          </Typography>
        )}
      </Paper>

      {/* Actions */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6">Actions (all fire in order)</Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={addAction}>
            Add Action
          </Button>
        </Box>
        {actions.map((action, idx) => {
          const meta = ACTION_TYPES.find((a) => a.value === action.type);
          const params = meta?.params || [];
          return (
            <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: params.length ? 2 : 0 }}>
                <Chip label={idx + 1} size="small" color="primary" sx={{ minWidth: 28 }} />
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Action Type</InputLabel>
                  <Select
                    value={action.type}
                    label="Action Type"
                    onChange={(e) => updateAction(idx, "type", e.target.value)}
                  >
                    {ACTION_TYPES.map((a) => (
                      <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Box sx={{ flex: 1 }} />
                <IconButton size="small" color="error" onClick={() => removeAction(idx)}
                  disabled={actions.length === 1}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* Extra params per action type */}
              {params.length > 0 && (
                <Grid container spacing={1} sx={{ mt: 0 }}>
                  {params.includes("severity") && (
                    <Grid item xs={6} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Severity</InputLabel>
                        <Select value={action.severity || "high"} label="Severity"
                          onChange={(e) => updateAction(idx, "severity", e.target.value)}>
                          {["critical", "high", "medium", "low"].map((s) => (
                            <MenuItem key={s} value={s}>{s}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                  {params.includes("alert_type") && (
                    <Grid item xs={6} md={4}>
                      <TextField size="small" fullWidth label="Alert Type"
                        value={action.alert_type || ""}
                        onChange={(e) => updateAction(idx, "alert_type", e.target.value)} />
                    </Grid>
                  )}
                  {params.includes("action_type") && (
                    <Grid item xs={6} md={4}>
                      <TextField size="small" fullWidth label="Remediation Action Type"
                        value={action.action_type || ""}
                        onChange={(e) => updateAction(idx, "action_type", e.target.value)} />
                    </Grid>
                  )}
                  {params.includes("message") && (
                    <Grid item xs={12}>
                      <TextField size="small" fullWidth label="Message"
                        value={action.message || ""}
                        onChange={(e) => updateAction(idx, "message", e.target.value)} />
                    </Grid>
                  )}
                  {params.includes("notes") && (
                    <Grid item xs={12}>
                      <TextField size="small" fullWidth label="Notes" multiline rows={2}
                        value={action.notes || ""}
                        onChange={(e) => updateAction(idx, "notes", e.target.value)} />
                    </Grid>
                  )}
                </Grid>
              )}
            </Paper>
          );
        })}
      </Paper>

      {/* Save */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
        <Button variant="outlined" onClick={() => navigate("/automation")}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {isEdit ? "Save Changes" : "Create Rule"}
        </Button>
      </Box>
    </Box>
  );
}
