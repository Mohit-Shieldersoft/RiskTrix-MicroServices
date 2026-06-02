import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Button, Card, CardContent, Grid, Chip,
  CircularProgress, Alert, IconButton, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  ToggleButton, ToggleButtonGroup, MenuItem, Select,
  FormControl, InputLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import GroupsIcon from "@mui/icons-material/Groups";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DevicesIcon from "@mui/icons-material/Devices";
import PolicyIcon from "@mui/icons-material/Policy";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import RefreshIcon from "@mui/icons-material/Refresh";
import policyApi from "../../utils/policyApi";

const SMART_RULE_FIELDS = [
  { value: "platform", label: "Platform" },
  { value: "status", label: "Device Status" },
  { value: "owner", label: "Owner" },
  { value: "os_version", label: "OS Version" },
];

const SMART_RULE_OPS = [
  { value: "eq", label: "equals" },
  { value: "neq", label: "not equals" },
  { value: "contains", label: "contains" },
];

const PLATFORM_VALUES = ["windows", "android", "ios", "macos"];

export default function DeviceGroups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // create form state
  const [groupType, setGroupType] = useState("static");
  const [form, setForm] = useState({ name: "", description: "" });
  const [smartField, setSmartField] = useState("platform");
  const [smartOp, setSmartOp] = useState("eq");
  const [smartValue, setSmartValue] = useState("android");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await policyApi.getGroups();
      setGroups(data);
    } catch {
      setError("Failed to load device groups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const handleCreate = async () => {
    if (!form.name.trim()) { setCreateError("Name is required"); return; }
    setCreating(true);
    setCreateError(null);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        group_type: groupType,
        smart_rule: groupType === "smart"
          ? JSON.stringify({ field: smartField, op: smartOp, value: smartValue })
          : null,
      };
      await policyApi.createGroup(payload);
      setOpen(false);
      setForm({ name: "", description: "" });
      setGroupType("static");
      fetchGroups();
    } catch {
      setCreateError("Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await policyApi.deleteGroup(id);
      fetchGroups();
    } catch {
      // silently fail — user can retry
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: "auto" }}>
      {/* HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Device Groups</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage static groups and smart groups for bulk policy assignment
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchGroups} disabled={loading}><RefreshIcon /></IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
            New Group
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} action={
          <Button size="small" onClick={fetchGroups}>Retry</Button>
        }>{error}</Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
          <CircularProgress />
        </Box>
      ) : groups.length === 0 ? (
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <GroupsIcon sx={{ fontSize: 56, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">No groups yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Create a static group to manually add devices, or a smart group that auto-matches by rules.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
              Create First Group
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {groups.map((g) => (
            <Grid size={{ xs: 12, md: 6 }} key={g.id}>
              <Card
                sx={{
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  cursor: "pointer",
                  "&:hover": { boxShadow: 3 },
                  transition: "box-shadow 0.2s",
                }}
                onClick={() => navigate(`/groups/${g.id}`)}
              >
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {g.group_type === "smart"
                        ? <AutoAwesomeIcon color="warning" />
                        : <GroupsIcon color="primary" />}
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">{g.name}</Typography>
                        <Chip
                          label={g.group_type === "smart" ? "Smart Group" : "Static Group"}
                          color={g.group_type === "smart" ? "warning" : "primary"}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Tooltip title="Delete group">
                        <IconButton
                          size="small"
                          color="error"
                          disabled={deleting === g.id}
                          onClick={(e) => { e.stopPropagation(); handleDelete(g.id); }}
                        >
                          {deleting === g.id ? <CircularProgress size={16} /> : <DeleteIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <ArrowForwardIosIcon fontSize="small" color="disabled" />
                    </Box>
                  </Box>

                  {g.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {g.description}
                    </Typography>
                  )}

                  {g.group_type === "smart" && g.smart_rule && (() => {
                    try {
                      const r = JSON.parse(g.smart_rule);
                      return (
                        <Box sx={{ mt: 1, p: 1, bgcolor: "warning.50", borderRadius: 1, border: "1px solid", borderColor: "warning.200" }}>
                          <Typography variant="caption" color="warning.dark">
                            Rule: <strong>{r.field}</strong> {r.op} <strong>{r.value}</strong>
                          </Typography>
                        </Box>
                      );
                    } catch { return null; }
                  })()}

                  <Box sx={{ display: "flex", gap: 3, mt: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <DevicesIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {g.member_count} device{g.member_count !== 1 ? "s" : ""}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <PolicyIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {g.policy_count} polic{g.policy_count !== 1 ? "ies" : "y"}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* CREATE DIALOG */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Device Group</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <ToggleButtonGroup
            value={groupType}
            exclusive
            onChange={(_, v) => v && setGroupType(v)}
            size="small"
            sx={{ mb: 2 }}
          >
            <ToggleButton value="static">
              <GroupsIcon fontSize="small" sx={{ mr: 0.5 }} /> Static
            </ToggleButton>
            <ToggleButton value="smart">
              <AutoAwesomeIcon fontSize="small" sx={{ mr: 0.5 }} /> Smart
            </ToggleButton>
          </ToggleButtonGroup>

          <TextField
            label="Group Name"
            fullWidth
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            sx={{ mb: 2 }}
            size="small"
          />
          <TextField
            label="Description (optional)"
            fullWidth
            multiline
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            sx={{ mb: 2 }}
            size="small"
          />

          {groupType === "smart" && (
            <Box sx={{ p: 2, border: "1px dashed", borderColor: "warning.main", borderRadius: 2 }}>
              <Typography variant="subtitle2" color="warning.dark" sx={{ mb: 1.5 }}>
                <AutoAwesomeIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: "middle" }} />
                Smart Rule — devices matching this rule auto-join the group
              </Typography>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <InputLabel>Field</InputLabel>
                  <Select value={smartField} label="Field" onChange={(e) => setSmartField(e.target.value)}>
                    {SMART_RULE_FIELDS.map((f) => (
                      <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 110 }}>
                  <InputLabel>Operator</InputLabel>
                  <Select value={smartOp} label="Operator" onChange={(e) => setSmartOp(e.target.value)}>
                    {SMART_RULE_OPS.map((o) => (
                      <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {smartField === "platform" ? (
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Value</InputLabel>
                    <Select value={smartValue} label="Value" onChange={(e) => setSmartValue(e.target.value)}>
                      {PLATFORM_VALUES.map((v) => (
                        <MenuItem key={v} value={v}>{v}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <TextField
                    label="Value"
                    size="small"
                    value={smartValue}
                    onChange={(e) => setSmartValue(e.target.value)}
                    sx={{ minWidth: 120 }}
                  />
                )}
              </Box>
            </Box>
          )}

          {createError && (
            <Alert severity="error" sx={{ mt: 2 }}>{createError}</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={creating}>
            {creating ? <CircularProgress size={18} /> : "Create Group"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
