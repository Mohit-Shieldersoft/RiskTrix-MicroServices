import React, { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, Button, Card, CardContent, Grid,
  TextField, InputAdornment, Chip, CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, Paper, IconButton, Tooltip, Avatar,
  MenuItem, Select, FormControl, InputLabel, Switch,
  FormControlLabel, Alert, Divider, Dialog, DialogTitle,
  DialogContent, DialogActions, Tab, Tabs,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";
import GroupsIcon from "@mui/icons-material/Groups";
import WorkIcon from "@mui/icons-material/Work";
import StarIcon from "@mui/icons-material/Star";
import RefreshIcon from "@mui/icons-material/Refresh";
import PhoneIcon from "@mui/icons-material/Phone";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import ScheduleIcon from "@mui/icons-material/Schedule";

import directoryApi from "../../utils/directoryApi";
import AddAgentModal from "./AddAgentModal";
import EditAgentModal from "./EditAgentModal";

// ── Workload badge colour ─────────────────────────────────────────────────
const workloadColor = (count) => {
  if (count >= 10) return "error";
  if (count >= 5) return "warning";
  return "success";
};

// ── Team / tier colours ───────────────────────────────────────────────────
const TEAM_COLORS = {
  security: "#1976d2",
  network: "#388e3c",
  compliance: "#f57c00",
  infrastructure: "#7b1fa2",
  general: "#0288d1",
};

const TIER_COLORS = { senior: "#c62828", standard: "#1565c0" };

const teamColor = (t) => TEAM_COLORS[t?.toLowerCase()] || "#546e7a";
const tierColor = (t) => TIER_COLORS[t?.toLowerCase()] || "#546e7a";

// ── Summary card ─────────────────────────────────────────────────────────
const SummaryCard = ({ label, value, icon, color }) => (
  <Card sx={{ flex: 1, minWidth: 140 }}>
    <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, py: 2 }}>
      <Box sx={{ bgcolor: color + "20", borderRadius: "50%", p: 1.2, color }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" fontWeight={700}>{value}</Typography>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
      </Box>
    </CardContent>
  </Card>
);

export default function DirectoryPage() {
  const [agents, setAgents] = useState([]);
  const [workload, setWorkload] = useState({});   // email → open ticket count
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [filterTier, setFilterTier] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  // ── New: availability / on-call / metrics state ───────────────
  const [onCallNow, setOnCallNow] = useState([]);        // [{agent_id, agent_name, ...}]
  const [availabilityMap, setAvailabilityMap] = useState({}); // agent_id → {is_available_now, is_on_call_now}
  const [leaderboard, setLeaderboard] = useState([]);
  const [activePanel, setActivePanel] = useState(0);    // 0=agents 1=on-call 2=leaderboard
  const [onCallDialog, setOnCallDialog] = useState(false);
  const [ocAgentId, setOcAgentId] = useState("");
  const [ocStart, setOcStart] = useState("");
  const [ocEnd, setOcEnd] = useState("");
  const [ocType, setOcType] = useState("primary");
  const [ocNotes, setOcNotes] = useState("");
  const [ocSaving, setOcSaving] = useState(false);
  const [ocError, setOcError] = useState("");         // inline error in dialog
  const [allOnCall, setAllOnCall] = useState([]);       // all scheduled entries

  // ── Fetch workload from ticket-service ────────────────────────────────
  const fetchWorkload = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/tickets/workload");
      if (res.ok) {
        const data = await res.json();
        const map = {};
        (Array.isArray(data) ? data : []).forEach((w) => { map[w.agent] = w.open_tickets; });
        setWorkload(map);
      }
    } catch {
      // Ticket-service offline — not a blocker
    }
  }, []);

  // ── Fetch on-call + availability + leaderboard ──────────────────
  const fetchAvailability = useCallback(async (agentList) => {
    if (!agentList || agentList.length === 0) return;
    const map = {};
    await Promise.allSettled(
      agentList.map(async (a) => {
        try {
          const av = await directoryApi.getAvailability(a.id);
          map[a.id] = { is_available_now: av.is_available_now, is_on_call_now: av.is_on_call_now };
        } catch { /* ignore */ }
      })
    );
    setAvailabilityMap(map);
  }, []);

  const fetchOnCallNow = useCallback(async () => {
    try {
      const data = await directoryApi.getCurrentOnCall();
      setOnCallNow(data || []);
    } catch { /* directory-service might be offline */ }
  }, []);

  const fetchAllOnCall = useCallback(async () => {
    try {
      const data = await directoryApi.getAllOnCall();
      setAllOnCall(data || []);
    } catch { /* ignore */ }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const data = await directoryApi.getLeaderboard();
      setLeaderboard(data || []);
    } catch { /* no metrics yet */ }
  }, []);

  const loadAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {};
      if (filterTeam) filters.team = filterTeam;
      if (filterTier) filters.tier = filterTier;
      if (showInactive) filters.active_only = false;
      const data = await directoryApi.getAgents(filters);
      setAgents(data);
    } catch (e) {
      setError("Could not load agents — is directory-service running on port 8008?");
    } finally {
      setLoading(false);
    }
  }, [filterTeam, filterTier, showInactive]);

  useEffect(() => {
    loadAgents();
    fetchWorkload();
    fetchOnCallNow();
    fetchAllOnCall();
    fetchLeaderboard();
  }, [loadAgents, fetchWorkload, fetchOnCallNow, fetchAllOnCall, fetchLeaderboard]);

  // Fetch per-agent availability whenever agent list changes
  useEffect(() => { fetchAvailability(agents); }, [agents, fetchAvailability]);

  const handleDelete = async (agent) => {
    if (!window.confirm(`Remove agent ${agent.name}?`)) return;
    try {
      await directoryApi.deleteAgent(agent.id);
      loadAgents();
    } catch {
      alert("Delete failed");
    }
  };

  const handleToggleActive = async (agent) => {
    try {
      await directoryApi.updateAgent(agent.id, { is_active: !agent.is_active });
      loadAgents();
    } catch {
      alert("Update failed");
    }
  };

  const handleScheduleOnCall = async () => {
    setOcError("");
    if (!ocAgentId) { setOcError("Please select an agent."); return; }
    if (!ocStart)   { setOcError("Start time is required."); return; }
    if (!ocEnd)     { setOcError("End time is required."); return; }
    if (new Date(ocEnd) <= new Date(ocStart)) { setOcError("End time must be after start time."); return; }
    setOcSaving(true);
    try {
      await directoryApi.scheduleOnCall({
        agent_id: parseInt(ocAgentId),
        start_time: new Date(ocStart).toISOString(),
        end_time: new Date(ocEnd).toISOString(),
        schedule_type: ocType,
        notes: ocNotes || null,
      });
      setOnCallDialog(false);
      setOcAgentId(""); setOcStart(""); setOcEnd(""); setOcNotes(""); setOcError("");
      fetchOnCallNow();
      fetchAllOnCall();
    } catch (e) {
      const detail = e?.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map((d) => d.msg || JSON.stringify(d)).join("; ")
        : (typeof detail === "string" ? detail : "Failed to schedule on-call. Check that directory-service is running.");
      setOcError(msg);
    } finally {
      setOcSaving(false);
    }
  };

  const handleDeleteOnCall = async (id) => {
    if (!window.confirm("Remove this on-call entry?")) return;
    try {
      await directoryApi.deleteOnCall(id);
      fetchOnCallNow();
      fetchAllOnCall();
    } catch {
      alert("Delete failed");
    }
  };

  // ── Derived data ─────────────────────────────────────────────────────
  const filtered = agents.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.team.toLowerCase().includes(q) ||
      (a.categories || "").toLowerCase().includes(q)
    );
  });

  const teams = [...new Set(agents.map((a) => a.team))].sort();
  const activeCount = agents.filter((a) => a.is_active).length;
  const seniorCount = agents.filter((a) => a.tier === "senior").length;
  const totalWorkload = Object.values(workload).reduce((s, v) => s + v, 0);

  return (
    <Box sx={{ p: 3 }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Agent Directory</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage agents, teams and AutoAssign roster
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={() => { loadAgents(); fetchWorkload(); fetchOnCallNow(); fetchAllOnCall(); fetchLeaderboard(); }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button variant="outlined" startIcon={<PhoneIcon />} onClick={() => { setActivePanel(1); setOnCallDialog(true); }}>
            Schedule On-Call
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
            Add Agent
          </Button>
        </Box>
      </Box>

      {/* ── Summary cards ──────────────────────────────────────── */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <SummaryCard label="Total Agents" value={agents.length} icon={<PersonIcon />} color="#1976d2" />
        <SummaryCard label="Active" value={activeCount} icon={<GroupsIcon />} color="#2e7d32" />
        <SummaryCard label="Senior Tier" value={seniorCount} icon={<StarIcon />} color="#e65100" />
        <SummaryCard label="Open Tickets" value={totalWorkload} icon={<WorkIcon />} color="#7b1fa2" />
        <SummaryCard label="On Call Now" value={onCallNow.length} icon={<PhoneIcon />} color="#0288d1" />
      </Box>

      {/* ── Tabs: Agents | On-Call | Leaderboard ─────────────── */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={activePanel} onChange={(_, v) => setActivePanel(v)}>
          <Tab icon={<PersonIcon fontSize="small" />} iconPosition="start" label="Agents" />
          <Tab icon={<PhoneIcon fontSize="small" />} iconPosition="start" label={`On-Call Now (${onCallNow.length})`} />
          <Tab icon={<LeaderboardIcon fontSize="small" />} iconPosition="start" label="Performance Leaderboard" />
        </Tabs>
      </Box>

      {/* ── Filters ────────────────────────────────────────────── */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
            <TextField
              size="small"
              placeholder="Search name, email, team, skill…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              sx={{ width: 300 }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Team</InputLabel>
              <Select value={filterTeam} label="Team" onChange={(e) => setFilterTeam(e.target.value)}>
                <MenuItem value="">All teams</MenuItem>
                {teams.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Tier</InputLabel>
              <Select value={filterTier} label="Tier" onChange={(e) => setFilterTier(e.target.value)}>
                <MenuItem value="">All tiers</MenuItem>
                <MenuItem value="senior">Senior</MenuItem>
                <MenuItem value="standard">Standard</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Switch checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} size="small" />}
              label="Show inactive"
            />
            {(filterTeam || filterTier || search) && (
              <Button size="small" onClick={() => { setFilterTeam(""); setFilterTier(""); setSearch(""); }}>
                Clear filters
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* ── Error / loading ─────────────────────────────────────── */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <Box sx={{ textAlign: "center", py: 6 }}><CircularProgress /></Box>}

      {/* ── TAB 0: Agent table ─────────────────────────────── */}
      {activePanel === 0 && !loading && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell><strong>Agent</strong></TableCell>
                <TableCell><strong>Team</strong></TableCell>
                <TableCell><strong>Tier</strong></TableCell>
                <TableCell><strong>Skills / Categories</strong></TableCell>
                <TableCell align="center"><strong>Open Tickets</strong></TableCell>
                <TableCell align="center"><strong>Availability</strong></TableCell>
                <TableCell align="center"><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    No agents found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((agent) => {
                  const openTickets = workload[agent.email] ?? 0;
                  const categories = (agent.categories || "")
                    .split(",").map((s) => s.trim()).filter(Boolean);
                  return (
                    <TableRow key={agent.id} hover sx={{ opacity: agent.is_active ? 1 : 0.55 }}>
                      {/* Agent name + email */}
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar sx={{ width: 34, height: 34, bgcolor: teamColor(agent.team), fontSize: 14 }}>
                            {agent.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{agent.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{agent.email}</Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Team */}
                      <TableCell>
                        <Chip
                          label={agent.team}
                          size="small"
                          sx={{ bgcolor: teamColor(agent.team) + "20", color: teamColor(agent.team), fontWeight: 600 }}
                        />
                      </TableCell>

                      {/* Tier */}
                      <TableCell>
                        <Chip
                          label={agent.tier}
                          size="small"
                          icon={agent.tier === "senior" ? <StarIcon style={{ fontSize: 13 }} /> : undefined}
                          sx={{ bgcolor: tierColor(agent.tier) + "20", color: tierColor(agent.tier), fontWeight: 600 }}
                        />
                      </TableCell>

                      {/* Skills */}
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                          {categories.length === 0
                            ? <Typography variant="caption" color="text.secondary">—</Typography>
                            : categories.map((c) => (
                                <Chip key={c} label={c} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                              ))
                          }
                        </Box>
                      </TableCell>

                      {/* Workload */}
                      <TableCell align="center">
                        <Chip
                          label={openTickets}
                          size="small"
                          color={workloadColor(openTickets)}
                          variant={openTickets === 0 ? "outlined" : "filled"}
                        />
                      </TableCell>

                      {/* Availability */}
                      <TableCell align="center">
                        {(() => {
                          const av = availabilityMap[agent.id];
                          if (!av) return <Chip label="—" size="small" variant="outlined" />;
                          if (av.is_on_call_now) return <Chip label="On Call" size="small" color="warning" icon={<PhoneIcon style={{ fontSize: 13 }} />} />;
                          if (av.is_available_now) return <Chip label="Available" size="small" color="success" />;
                          return <Chip label="Off Hours" size="small" color="default" />;
                        })()}
                      </TableCell>

                      {/* Active toggle */}
                      <TableCell align="center">
                        <Tooltip title={agent.is_active ? "Click to deactivate" : "Click to activate"}>
                          <Chip
                            label={agent.is_active ? "Active" : "Inactive"}
                            size="small"
                            color={agent.is_active ? "success" : "default"}
                            onClick={() => handleToggleActive(agent)}
                            sx={{ cursor: "pointer" }}
                          />
                        </Tooltip>
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => setEditTarget(agent)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => handleDelete(agent)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── TAB 1: On-Call Schedule ───────────────────────────── */}
      {activePanel === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>On-Call Schedule</Typography>
                <Typography variant="caption" color="text.secondary">
                  Active now: {onCallNow.length} agent(s) &nbsp;·&nbsp; Total entries: {allOnCall.length}
                </Typography>
              </Box>
              <Button size="small" variant="contained" startIcon={<PhoneIcon />} onClick={() => setOnCallDialog(true)}>
                + Schedule On-Call
              </Button>
            </Box>
            {allOnCall.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <PhoneIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                <Typography color="text.secondary">No on-call entries yet</Typography>
                <Typography variant="caption" color="text.secondary">Click "+ Schedule On-Call" to create one</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "action.hover" }}>
                      <TableCell><strong>Agent</strong></TableCell>
                      <TableCell><strong>Team</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Start</strong></TableCell>
                      <TableCell><strong>End</strong></TableCell>
                      <TableCell><strong>Notes</strong></TableCell>
                      <TableCell align="right"></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allOnCall.map((oc) => (
                      <TableRow key={oc.id} hover sx={{ opacity: oc.status === "past" ? 0.55 : 1 }}>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Avatar sx={{ width: 28, height: 28, bgcolor: teamColor(oc.agent_team), fontSize: 12 }}>
                              {oc.agent_name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>{oc.agent_name}</Typography>
                              <Typography variant="caption" color="text.secondary">{oc.agent_email}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={oc.agent_team} size="small" sx={{ bgcolor: teamColor(oc.agent_team) + "20", color: teamColor(oc.agent_team) }} />
                        </TableCell>
                        <TableCell>
                          <Chip label={oc.schedule_type} size="small" color={oc.schedule_type === "primary" ? "warning" : "default"} />
                        </TableCell>
                        <TableCell>
                          {oc.status === "active"   && <Chip label="Active Now" size="small" color="success" />}
                          {oc.status === "upcoming" && <Chip label="Upcoming"   size="small" color="info"    />}
                          {oc.status === "past"     && <Chip label="Past"       size="small" variant="outlined" />}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{new Date(oc.start_time).toLocaleString()}</TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{new Date(oc.end_time).toLocaleString()}</TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">{oc.notes || "—"}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Delete schedule">
                            <IconButton size="small" color="error" onClick={() => handleDeleteOnCall(oc.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── TAB 2: Performance Leaderboard ───────────────────── */}
      {activePanel === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Performance Leaderboard</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Ranked by quality score (desc) then avg resolution time (asc). Only agents with recorded metrics appear.
            </Typography>
            {leaderboard.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <LeaderboardIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                <Typography color="text.secondary">No metrics recorded yet.</Typography>
                <Typography variant="caption" color="text.secondary">
                  Use POST /api/v1/directory/metrics to record performance data.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "action.hover" }}>
                      <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Agent</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Team</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Tickets</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Avg Resolution</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Quality Score</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>SLA Compliance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leaderboard.map((row) => (
                      <TableRow key={row.agent_id} hover>
                        <TableCell>
                          <Typography fontWeight={700} color={row.rank <= 3 ? "warning.main" : "text.primary"}>
                            {row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : row.rank === 3 ? "🥉" : `#${row.rank}`}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Avatar sx={{ width: 28, height: 28, bgcolor: teamColor(row.agent_team), fontSize: 12 }}>
                              {row.agent_name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>{row.agent_name}</Typography>
                              <Typography variant="caption" color="text.secondary">{row.agent_email}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell><Chip label={row.agent_team} size="small" sx={{ bgcolor: teamColor(row.agent_team) + "20", color: teamColor(row.agent_team) }} /></TableCell>
                        <TableCell align="center">{row.total_tickets}</TableCell>
                        <TableCell align="center">
                          {row.avg_resolution_time_minutes != null
                            ? `${Math.round(row.avg_resolution_time_minutes)} min`
                            : "—"}
                        </TableCell>
                        <TableCell align="center">
                          {row.avg_quality_score != null ? (
                            <Chip
                              label={`${row.avg_quality_score.toFixed(1)} / 10`}
                              size="small"
                              color={row.avg_quality_score >= 8 ? "success" : row.avg_quality_score >= 5 ? "warning" : "error"}
                            />
                          ) : "—"}
                        </TableCell>
                        <TableCell align="center">
                          {row.sla_compliance_pct != null
                            ? <Chip label={`${row.sla_compliance_pct.toFixed(0)}%`} size="small" color={row.sla_compliance_pct >= 90 ? "success" : row.sla_compliance_pct >= 70 ? "warning" : "error"} />
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Modals ──────────────────────────────────────────────── */}
      <AddAgentModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={() => { setAddOpen(false); loadAgents(); }}
      />
      {editTarget && (
        <EditAgentModal
          open={!!editTarget}
          agent={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); loadAgents(); }}
        />
      )}

      {/* ── Schedule On-Call dialog ───────────────────────── */}
      <Dialog open={onCallDialog} onClose={(_, reason) => { if (reason !== 'backdropClick') { setOnCallDialog(false); setOcError(""); } }} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule On-Call Window</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          {ocError && (
            <Alert severity="error" onClose={() => setOcError("")}>{ocError}</Alert>
          )}
          <FormControl fullWidth>
            <InputLabel>Agent *</InputLabel>
            <Select value={ocAgentId} label="Agent *" onChange={(e) => setOcAgentId(e.target.value)}>
              {agents.filter((a) => a.is_active).map((a) => (
                <MenuItem key={a.id} value={a.id}>{a.name} ({a.team})</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Start Time *"
            type="datetime-local"
            fullWidth
            value={ocStart}
            onChange={(e) => setOcStart(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Time *"
            type="datetime-local"
            fullWidth
            value={ocEnd}
            onChange={(e) => setOcEnd(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select value={ocType} label="Type" onChange={(e) => setOcType(e.target.value)}>
              <MenuItem value="primary">Primary</MenuItem>
              <MenuItem value="backup">Backup</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Notes"
            fullWidth
            value={ocNotes}
            onChange={(e) => setOcNotes(e.target.value)}
            placeholder="Optional notes"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOnCallDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleScheduleOnCall} disabled={ocSaving}>
            {ocSaving ? "Saving..." : "Schedule"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
