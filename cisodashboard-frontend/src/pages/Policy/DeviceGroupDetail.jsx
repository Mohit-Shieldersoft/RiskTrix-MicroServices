import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Card, CardContent, Grid, Chip, CircularProgress,
  Button, Alert, Tabs, Tab, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Paper, Tooltip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Checkbox, FormControlLabel,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GroupsIcon from "@mui/icons-material/Groups";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DevicesIcon from "@mui/icons-material/Devices";
import PolicyIcon from "@mui/icons-material/Policy";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import policyApi from "../../utils/policyApi";

export default function DeviceGroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [allDevices, setAllDevices] = useState([]);
  const [allPolicies, setAllPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);

  // Add devices dialog
  const [deviceDialog, setDeviceDialog] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [addingDevices, setAddingDevices] = useState(false);

  // Assign policy dialog
  const [policyDialog, setPolicyDialog] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [assigningPolicy, setAssigningPolicy] = useState(false);

  const [removingMember, setRemovingMember] = useState(null);
  const [removingPolicy, setRemovingPolicy] = useState(null);

  const fetchGroup = useCallback(async () => {
    try {
      const [g, devices, policies] = await Promise.all([
        policyApi.getGroupById(id),
        policyApi.getDevices(),
        policyApi.getPolicies(),
      ]);
      setGroup(g);
      setAllDevices(devices || []);
      setAllPolicies(policies || []);
    } catch {
      setError("Group not found");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchGroup(); }, [fetchGroup]);

  const memberIds = new Set((group?.members || []).map((m) => m.id));
  const assignedPolicyIds = new Set((group?.policies || []).map((p) => p.policy_id));
  const availableDevices = allDevices.filter((d) => !memberIds.has(d.id));
  const availablePolicies = allPolicies.filter((p) => !assignedPolicyIds.has(p.id));

  const handleAddDevices = async () => {
    if (!selectedDevices.length) return;
    setAddingDevices(true);
    try {
      await policyApi.addGroupMembers(id, selectedDevices);
      setDeviceDialog(false);
      setSelectedDevices([]);
      await fetchGroup();
    } catch {
      // ignore
    } finally {
      setAddingDevices(false);
    }
  };

  const handleRemoveMember = async (deviceId) => {
    setRemovingMember(deviceId);
    try {
      await policyApi.removeGroupMember(id, deviceId);
      await fetchGroup();
    } finally {
      setRemovingMember(null);
    }
  };

  const handleAssignPolicy = async () => {
    if (!selectedPolicy) return;
    setAssigningPolicy(true);
    try {
      await policyApi.assignPolicyToGroup(id, selectedPolicy);
      setPolicyDialog(false);
      setSelectedPolicy(null);
      await fetchGroup();
    } catch {
      // ignore
    } finally {
      setAssigningPolicy(false);
    }
  };

  const handleRemovePolicy = async (policyId) => {
    setRemovingPolicy(policyId);
    try {
      await policyApi.removePolicyFromGroup(id, policyId);
      await fetchGroup();
    } finally {
      setRemovingPolicy(null);
    }
  };

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>
  );

  if (error || !group) return (
    <Box sx={{ textAlign: "center", mt: 10 }}>
      <Typography color="error">{error}</Typography>
      <Button sx={{ mt: 2 }} variant="outlined" onClick={() => navigate("/groups")}>
        Back to Groups
      </Button>
    </Box>
  );

  const isSmart = group.group_type === "smart";
  let smartRule = null;
  if (isSmart && group.smart_rule) {
    try { smartRule = JSON.parse(group.smart_rule); } catch { /* ignore */ }
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: "auto" }}>
      {/* HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/groups")}>
          Back to Groups
        </Button>
      </Box>

      {/* TITLE */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
        {isSmart ? <AutoAwesomeIcon color="warning" sx={{ fontSize: 32 }} /> : <GroupsIcon color="primary" sx={{ fontSize: 32 }} />}
        <Typography variant="h4" fontWeight="bold">{group.name}</Typography>
        <Chip
          label={isSmart ? "Smart Group" : "Static Group"}
          color={isSmart ? "warning" : "primary"}
          size="small"
        />
      </Box>
      {group.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {group.description}
        </Typography>
      )}

      {/* SMART RULE BANNER */}
      {isSmart && smartRule && (
        <Alert severity="warning" icon={<AutoAwesomeIcon />} sx={{ mb: 3 }}>
          <strong>Smart Rule:</strong> Devices where <strong>{smartRule.field}</strong>{" "}
          <em>{smartRule.op}</em> <strong>{smartRule.value}</strong> — members auto-resolved at query time.
        </Alert>
      )}

      {/* STAT CARDS */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Members", value: group.members?.length ?? 0, icon: <DevicesIcon />, color: "primary.main" },
          { label: "Policies Assigned", value: group.policies?.length ?? 0, icon: <PolicyIcon />, color: "success.main" },
          { label: "Group Type", value: isSmart ? "Smart" : "Static", icon: isSmart ? <AutoAwesomeIcon /> : <GroupsIcon />, color: isSmart ? "warning.main" : "primary.main" },
          { label: "Created By", value: group.created_by || "admin", icon: <GroupsIcon />, color: "text.secondary" },
        ].map((s, i) => (
          <Grid size={{ xs: 6, md: 3 }} key={i}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent sx={{ textAlign: "center", py: 2, "&:last-child": { pb: 2 } }}>
                <Box sx={{ color: s.color }}>{s.icon}</Box>
                <Typography variant="caption" color="text.secondary" display="block">{s.label}</Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ color: s.color }}>{s.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* TABS */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`Members (${group.members?.length ?? 0})`} />
        <Tab label={`Assigned Policies (${group.policies?.length ?? 0})`} />
      </Tabs>

      {/* ── TAB 0: MEMBERS ── */}
      {tab === 0 && (
        <Box>
          {!isSmart && (
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setDeviceDialog(true)}
                disabled={availableDevices.length === 0}
              >
                Add Devices
              </Button>
            </Box>
          )}
          {group.members?.length === 0 ? (
            <Card sx={{ borderRadius: 2 }}>
              <CardContent sx={{ textAlign: "center", py: 4 }}>
                <DevicesIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                <Typography color="text.secondary">
                  {isSmart ? "No devices match this smart rule currently" : "No devices in this group yet"}
                </Typography>
                {!isSmart && (
                  <Button sx={{ mt: 1 }} variant="outlined" startIcon={<AddIcon />}
                    onClick={() => setDeviceDialog(true)}>
                    Add Devices
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <TableContainer component={Paper} elevation={0}
              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.50" }}>
                    <TableCell sx={{ fontWeight: "bold" }}>Device</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Platform</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>OS Version</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Owner</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    {!isSmart && <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {group.members.map((m) => (
                    <TableRow key={m.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell>
                        <Button size="small" variant="text"
                          onClick={() => navigate(`/devices/${m.id}`)}
                          sx={{ textTransform: "none", p: 0, fontWeight: 500 }}>
                          {m.name}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Chip label={m.platform} size="small"
                          color={m.platform === "windows" ? "primary" : m.platform === "android" ? "success" : m.platform === "ios" ? "warning" : "default"} />
                      </TableCell>
                      <TableCell>{m.os_version || "—"}</TableCell>
                      <TableCell>{m.owner || "—"}</TableCell>
                      <TableCell>
                        <Chip label={m.status} size="small"
                          color={m.status === "active" ? "success" : "default"} />
                      </TableCell>
                      {!isSmart && (
                        <TableCell>
                          <Tooltip title="Remove from group">
                            <IconButton size="small" color="error"
                              disabled={removingMember === m.id}
                              onClick={() => handleRemoveMember(m.id)}>
                              {removingMember === m.id
                                ? <CircularProgress size={14} />
                                : <DeleteIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* ── TAB 1: ASSIGNED POLICIES ── */}
      {tab === 1 && (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setPolicyDialog(true)}
              disabled={availablePolicies.length === 0}
            >
              Assign Policy
            </Button>
          </Box>
          {group.policies?.length === 0 ? (
            <Card sx={{ borderRadius: 2 }}>
              <CardContent sx={{ textAlign: "center", py: 4 }}>
                <PolicyIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                <Typography color="text.secondary">No policies assigned to this group yet</Typography>
                <Button sx={{ mt: 1 }} variant="outlined" startIcon={<AddIcon />}
                  onClick={() => setPolicyDialog(true)}>
                  Assign Policy
                </Button>
              </CardContent>
            </Card>
          ) : (
            <TableContainer component={Paper} elevation={0}
              sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.50" }}>
                    <TableCell sx={{ fontWeight: "bold" }}>Policy</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Platform</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Assigned By</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {group.policies.map((p) => (
                    <TableRow key={p.assignment_id} hover sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell>
                        <Button size="small" variant="text"
                          onClick={() => navigate(`/policies/${p.policy_id}`)}
                          sx={{ textTransform: "none", p: 0, fontWeight: 500 }}>
                          {p.name}
                        </Button>
                      </TableCell>
                      <TableCell>{p.category}</TableCell>
                      <TableCell>
                        <Chip label={p.platform} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip label={p.status} size="small"
                          color={p.status === "active" ? "success" : "warning"} />
                      </TableCell>
                      <TableCell>{p.assigned_by}</TableCell>
                      <TableCell>
                        <Tooltip title="Remove policy from group">
                          <IconButton size="small" color="error"
                            disabled={removingPolicy === p.policy_id}
                            onClick={() => handleRemovePolicy(p.policy_id)}>
                            {removingPolicy === p.policy_id
                              ? <CircularProgress size={14} />
                              : <DeleteIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* ADD DEVICES DIALOG */}
      <Dialog open={deviceDialog} onClose={() => setDeviceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Devices to Group</DialogTitle>
        <DialogContent>
          {availableDevices.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              All devices are already in this group.
            </Typography>
          ) : (
            <Box sx={{ maxHeight: 320, overflow: "auto" }}>
              {availableDevices.map((d) => (
                <Box key={d.id}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedDevices.includes(d.id)}
                        onChange={(e) => {
                          setSelectedDevices((prev) =>
                            e.target.checked ? [...prev, d.id] : prev.filter((x) => x !== d.id)
                          );
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={500}>{d.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {d.platform} · {d.owner || "no owner"}
                        </Typography>
                      </Box>
                    }
                    sx={{ width: "100%", py: 0.5 }}
                  />
                  <Divider />
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeviceDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddDevices}
            disabled={addingDevices || selectedDevices.length === 0}
          >
            {addingDevices ? <CircularProgress size={18} /> : `Add ${selectedDevices.length || ""} Devices`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ASSIGN POLICY DIALOG */}
      <Dialog open={policyDialog} onClose={() => setPolicyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Policy to Group</DialogTitle>
        <DialogContent>
          {availablePolicies.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              All policies are already assigned to this group.
            </Typography>
          ) : (
            <Box sx={{ maxHeight: 320, overflow: "auto" }}>
              {availablePolicies.map((p) => (
                <Box key={p.id}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedPolicy === p.id}
                        onChange={(e) => setSelectedPolicy(e.target.checked ? p.id : null)}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight={500}>{p.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {p.category} · {p.platform} · {p.status}
                        </Typography>
                      </Box>
                    }
                    sx={{ width: "100%", py: 0.5 }}
                  />
                  <Divider />
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPolicyDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAssignPolicy}
            disabled={assigningPolicy || !selectedPolicy}
          >
            {assigningPolicy ? <CircularProgress size={18} /> : "Assign & Deploy"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
