import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Card, CardContent, Grid, CircularProgress,
  Chip, Button, Alert, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Paper, Avatar, LinearProgress,
  Divider, Tabs, Tab, Tooltip, Stack,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonIcon from "@mui/icons-material/Person";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import ticketApi from "../../utils/ticketApi";

// ── helpers ──────────────────────────────────────────────
const getPriorityColor = (p) => {
  switch (p) {
    case "critical": return "error";
    case "high": return "warning";
    case "medium": return "info";
    default: return "default";
  }
};

const getStatusColor = (s) => {
  switch (s) {
    case "new": return "info";
    case "assigned": return "warning";
    case "in_progress": return "primary";
    case "resolved": return "success";
    case "closed": return "default";
    default: return "default";
  }
};

const avatarColor = (name) => {
  const colors = ["#5c6bc0", "#26a69a", "#ef5350", "#ffa726", "#66bb6a", "#ab47bc", "#29b6f6"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + h;
  return colors[h % colors.length];
};

const initials = (name) =>
  name.split(/[\s@.]/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

const WorkloadBar = ({ open, resolved, closed, total }) => {
  if (!total) return <Typography variant="caption" color="text.secondary">—</Typography>;
  return (
    <Box sx={{ minWidth: 140 }}>
      <Box sx={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", gap: "1px" }}>
        {open > 0 && (
          <Tooltip title={`Open: ${open}`}>
            <Box sx={{ flex: open, bgcolor: "#5c6bc0", borderRadius: "4px 0 0 4px" }} />
          </Tooltip>
        )}
        {resolved > 0 && (
          <Tooltip title={`Resolved: ${resolved}`}>
            <Box sx={{ flex: resolved, bgcolor: "#66bb6a" }} />
          </Tooltip>
        )}
        {closed > 0 && (
          <Tooltip title={`Closed: ${closed}`}>
            <Box sx={{ flex: closed, bgcolor: "#9e9e9e", borderRadius: "0 4px 4px 0" }} />
          </Tooltip>
        )}
      </Box>
      <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary">{open} open</Typography>
        <Typography variant="caption" color="text.secondary">·</Typography>
        <Typography variant="caption" color="text.secondary">{resolved} resolved</Typography>
      </Box>
    </Box>
  );
};

// ── main component ────────────────────────────────────────
export default function TicketAssignmentDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(0);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await ticketApi.getAssignmentStats();
      setData(res);
    } catch (err) {
  console.error(err);

  if (err.status === 403) {
    setError("Access denied");
    return;
  }

  setError("Failed to load assignment data");

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
      <CircularProgress />
    </Box>
  );

  if (error) return (
  <Box sx={{ p: 3 }}>
    <Alert
      severity={error === "Access denied" ? "warning" : "error"}
      action={
        error !== "Access denied" ? (
          <Button
            color="inherit"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={load}
          >
            Retry
          </Button>
        ) : null
      }
    >
      {error === "Access denied"
        ? "You do not have permission to view Assignment Analytics."
        : error}
    </Alert>
  </Box>
);

  const { total, unassigned_open, by_team, by_person, unassigned_tickets } = data;

  // sort teams + persons by open desc
  const teams = [...by_team].sort((a, b) => b.open - a.open);
  const persons = [...by_person].sort((a, b) => b.open - a.open);

  return (
    <Box sx={{ p: 3 }}>
      {/* HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Assignment Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            Ticket workload by team and assignee
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load} size="small">
            Refresh
          </Button>
          <Button variant="outlined" onClick={() => navigate("/tickets")} size="small">
            All Tickets
          </Button>
        </Box>
      </Box>

      {/* SUMMARY CARDS */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: "Total Tickets",
            value: total,
            icon: <ConfirmationNumberIcon />,
            color: "#5c6bc0",
          },
          {
            label: "Teams Active",
            value: teams.filter((t) => t.name !== "Unassigned").length,
            icon: <GroupsIcon />,
            color: "#26a69a",
          },
          {
            label: "Assignees Active",
            value: persons.length,
            icon: <PersonIcon />,
            color: "#42a5f5",
          },
          {
            label: "Unassigned Open",
            value: unassigned_open,
            icon: <WarningAmberIcon />,
            color: unassigned_open > 0 ? "#ef5350" : "#66bb6a",
            alert: unassigned_open > 0,
          },
        ].map((card, i) => (
          <Grid size={{ xs: 6, md: 3 }} key={i}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid",
                borderColor: card.alert ? "error.light" : "grey.200",
                bgcolor: card.alert ? "error.50" : "background.paper",
                transition: "all 0.2s",
                "&:hover": { transform: "translateY(-2px)", boxShadow: 3 },
              }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                      {card.label}
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ color: card.color }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: card.color, opacity: 0.85, width: 44, height: 44 }}>
                    {card.icon}
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* TABS */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`By Team (${teams.length})`} />
        <Tab label={`By Person (${persons.length})`} />
        <Tab
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              Unassigned
              {unassigned_open > 0 && (
                <Chip label={unassigned_open} color="error" size="small" sx={{ height: 18, fontSize: "0.7rem" }} />
              )}
            </Box>
          }
        />
      </Tabs>

      {/* ── TAB 0: BY TEAM ── */}
      {tab === 0 && (
        <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "grey.200", borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.50" }}>
                <TableCell sx={{ fontWeight: "bold" }}>Team / Group</TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="center">Total</TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="center">Open</TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="center">Resolved</TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="center">Closed</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Priority Breakdown</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Workload</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary" sx={{ py: 3 }}>No team data</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                teams.map((team) => (
                  <TableRow key={team.name} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Avatar
                          sx={{
                            bgcolor: team.name === "Unassigned" ? "#bdbdbd" : avatarColor(team.name),
                            width: 34,
                            height: 34,
                            fontSize: "0.75rem",
                          }}
                        >
                          <GroupsIcon fontSize="small" />
                        </Avatar>
                        <Typography fontWeight={600}>{team.name}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <Typography fontWeight={700}>{team.total}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={team.open} color={team.open > 0 ? "primary" : "default"} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={team.resolved} color={team.resolved > 0 ? "success" : "default"} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Typography color="text.secondary">{team.closed}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {Object.entries(team.by_priority).map(([p, count]) => (
                          <Chip key={p} label={`${p}: ${count}`} color={getPriorityColor(p)} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <WorkloadBar
                        open={team.open}
                        resolved={team.resolved}
                        closed={team.closed}
                        total={team.total}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── TAB 1: BY PERSON ── */}
      {tab === 1 && (
        persons.length === 0 ? (
          <Paper elevation={0} sx={{ p: 4, textAlign: "center", border: "1px solid", borderColor: "grey.200", borderRadius: 2 }}>
            <Typography color="text.secondary">No tickets are assigned to any person yet.</Typography>
            <Button sx={{ mt: 2 }} variant="outlined" onClick={() => navigate("/tickets")}>Go to Tickets</Button>
          </Paper>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "grey.200", borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.50" }}>
                  <TableCell sx={{ fontWeight: "bold" }}>Assignee</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Team</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} align="center">Total</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} align="center">Open</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} align="center">Resolved</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} align="center">Closed</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Priority Breakdown</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Workload</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {persons.map((p) => (
                  <TableRow key={p.name} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Avatar
                          sx={{
                            bgcolor: avatarColor(p.name),
                            width: 34,
                            height: 34,
                            fontSize: "0.75rem",
                          }}
                        >
                          {initials(p.name)}
                        </Avatar>
                        <Typography fontWeight={600}>{p.name}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {p.team || "—"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography fontWeight={700}>{p.total}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={p.open} color={p.open > 0 ? "primary" : "default"} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={p.resolved} color={p.resolved > 0 ? "success" : "default"} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Typography color="text.secondary">{p.closed}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {Object.entries(p.by_priority).map(([pr, count]) => (
                          <Chip key={pr} label={`${pr}: ${count}`} color={getPriorityColor(pr)} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <WorkloadBar
                        open={p.open}
                        resolved={p.resolved}
                        closed={p.closed}
                        total={p.total}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}

      {/* ── TAB 2: UNASSIGNED ── */}
      {tab === 2 && (
        unassigned_tickets.length === 0 ? (
          <Paper elevation={0} sx={{ p: 4, textAlign: "center", border: "1px solid", borderColor: "grey.200", borderRadius: 2 }}>
            <Typography color="success.main" fontWeight={600}>All open tickets are assigned!</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "error.light", borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "error.50" }}>
                  <TableCell sx={{ fontWeight: "bold" }}>Ticket #</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Created</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {unassigned_tickets.map((t) => (
                  <TableRow key={t.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
                        {t.ticket_number}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, maxWidth: 280 }}>
                      <Typography noWrap>{t.title}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={t.category} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip label={t.priority} color={getPriorityColor(t.priority)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip label={t.status} color={getStatusColor(t.status)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(t.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => navigate(`/tickets/${t.id}`)}
                      >
                        Assign
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}
    </Box>
  );
}