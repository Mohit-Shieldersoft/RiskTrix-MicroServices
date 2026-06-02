import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Paper,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReplayIcon from "@mui/icons-material/Replay";
import VisibilityIcon from "@mui/icons-material/Visibility";
import QueueIcon from "@mui/icons-material/Queue";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";

import queueApi from "../../utils/queueApi";

// ── Helpers ───────────────────────────────────────────────────────────────

const STATUS_META = {
  done:       { bg: "#e8f5e9", text: "#2e7d32" },
  failed:     { bg: "#ffebee", text: "#c62828" },
  processing: { bg: "#fff8e1", text: "#e65100" },
  pending:    { bg: "#f5f5f5", text: "#546e7a" },
};

const statusMeta = (s) => STATUS_META[s] || STATUS_META.pending;

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
};

// ── Summary card ──────────────────────────────────────────────────────────

const SummaryCard = ({ label, value, icon, borderColor, bg }) => (
  <Card
    elevation={0}
    sx={{
      flex: 1,
      minWidth: 140,
      border: "1px solid",
      borderColor: "divider",
      borderLeft: `4px solid ${borderColor}`,
      bgcolor: bg,
      borderRadius: 2,
    }}
  >
    <CardContent sx={{ py: "14px !important", px: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
      <Box sx={{ color: borderColor, display: "flex" }}>{icon}</Box>
      <Box>
        <Typography variant="h5" fontWeight={800} lineHeight={1.1}>{value}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>{label}</Typography>
      </Box>
    </CardContent>
  </Card>
);

// ── Detail row ────────────────────────────────────────────────────────────

const DetailRow = ({ label, children }) => (
  <Box sx={{ display: "flex", gap: 1, py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 110, flexShrink: 0, fontWeight: 600 }}>
      {label}
    </Typography>
    <Box sx={{ flex: 1, wordBreak: "break-word" }}>{children}</Box>
  </Box>
);

// ── Main page ─────────────────────────────────────────────────────────────

export default function QueueMonitorPage() {
  const [stats, setStats] = useState({});
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [limit, setLimit] = useState(50);
  const [selected, setSelected] = useState(null);
  const [replayingId, setReplayingId] = useState(null);

  const total = useMemo(
    () => Object.values(stats || {}).reduce((s, n) => s + Number(n || 0), 0),
    [stats]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, e] = await Promise.all([
        queueApi.getStats(),
        queueApi.getEvents({ status: statusFilter, limit }),
      ]);
      setStats(s || {});
      setEvents(e || []);
    } catch {
      setError("Queue service unavailable on port 8010. Start queue-service and retry.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, limit]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleReplay = async (eventId) => {
    setReplayingId(eventId);
    try {
      await queueApi.replayEvent(eventId);
      await loadData();
    } catch {
      setError(`Replay failed for event #${eventId}`);
    } finally {
      setReplayingId(null);
    }
  };

  const openDetail = async (eventId) => {
    try {
      setSelected(await queueApi.getEvent(eventId));
    } catch {
      setError(`Could not load event #${eventId}`);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Queue Monitor</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Real-time view of outbox events — processing status, retries and failures
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadData} sx={{ flexShrink: 0 }}>
          Refresh
        </Button>
      </Box>

      {/* Summary cards */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
        <SummaryCard label="Total Events"  value={total}                  icon={<QueueIcon />}          borderColor="#1565c0" bg="#e3f2fd" />
        <SummaryCard label="Pending"       value={stats.pending || 0}     icon={<HourglassEmptyIcon />} borderColor="#ef6c00" bg="#fff3e0" />
        <SummaryCard label="Done"          value={stats.done || 0}        icon={<DoneAllIcon />}        borderColor="#2e7d32" bg="#e8f5e9" />
        <SummaryCard label="Failed"        value={stats.failed || 0}      icon={<ErrorOutlineIcon />}   borderColor="#c62828" bg="#ffebee" />
        <SummaryCard label="Processing"    value={stats.processing || 0}  icon={<PendingActionsIcon />} borderColor="#7b1fa2" bg="#f3e5f5" />
      </Box>

      {/* Filters */}
      <Card elevation={0} sx={{ mb: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <CardContent sx={{ py: "12px !important" }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <Typography variant="body2" fontWeight={600} color="text.secondary">Filter:</Typography>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="">All statuses</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="done">Done</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small" type="number" label="Row limit" value={limit}
              onChange={(e) => setLimit(Math.max(1, Math.min(200, Number(e.target.value || 50))))}
              sx={{ width: 110 }}
              inputProps={{ min: 1, max: 200 }}
            />
            <Button variant="contained" size="small" onClick={loadData}>Apply</Button>
            {statusFilter && <Button size="small" onClick={() => setStatusFilter("")}>Clear</Button>}
          </Box>
        </CardContent>
      </Card>

      {/* Error */}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Table */}
      {loading ? (
        <Box sx={{ textAlign: "center", py: 10 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Loading events…</Typography>
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflowX: "auto" }}
        >
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8f9fa" }}>
                <TableCell sx={{ width: 60,  fontWeight: 700, py: 1.5 }}>ID</TableCell>
                <TableCell sx={{ width: 180, fontWeight: 700, py: 1.5 }}>Event Type</TableCell>
                <TableCell sx={{ width: 110, fontWeight: 700, py: 1.5 }}>Status</TableCell>
                <TableCell sx={{ width: 70,  fontWeight: 700, py: 1.5, textAlign: "center" }}>Retries</TableCell>
                <TableCell sx={{ width: 160, fontWeight: 700, py: 1.5 }}>Created At</TableCell>
                <TableCell sx={{ width: 160, fontWeight: 700, py: 1.5 }}>Processed At</TableCell>
                <TableCell sx={{             fontWeight: 700, py: 1.5 }}>Error</TableCell>
                <TableCell sx={{ width: 100, fontWeight: 700, py: 1.5, textAlign: "center" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No events found</Typography>
                  </TableCell>
                </TableRow>
              ) : events.map((ev) => {
                const meta = statusMeta(ev.status);
                return (
                  <TableRow key={ev.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                    <TableCell sx={{ py: 1.2 }}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary">#{ev.id}</Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "monospace",
                          bgcolor: "#f0f4ff", color: "#1565c0",
                          px: 1, py: 0.3, borderRadius: 1,
                          display: "inline-block", fontSize: 12, whiteSpace: "nowrap",
                        }}
                      >
                        {ev.event_type}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.2 }}>
                      <Chip
                        size="small"
                        label={ev.status}
                        sx={{
                          bgcolor: meta.bg, color: meta.text,
                          fontWeight: 600, fontSize: 11, height: 22,
                          border: `1px solid ${meta.text}40`,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.2, textAlign: "center" }}>
                      <Typography variant="body2" fontWeight={700}
                        color={ev.retry_count > 0 ? "warning.dark" : "text.secondary"}>
                        {ev.retry_count}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                        {fmtDate(ev.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                        {fmtDate(ev.processed_at)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.2, maxWidth: 0 }}>
                      {ev.error ? (
                        <Tooltip title={ev.error} placement="top-start">
                          <Typography variant="caption" color="error"
                            sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", cursor: "help" }}>
                            {ev.error}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 1.2, textAlign: "center", whiteSpace: "nowrap" }}>
                      <Tooltip title="View details">
                        <IconButton size="small" color="primary" onClick={() => openDetail(ev.id)}>
                          <VisibilityIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Replay">
                        <span>
                          <IconButton
                            size="small" color="warning"
                            disabled={replayingId === ev.id}
                            onClick={() => handleReplay(ev.id)}
                          >
                            {replayingId === ev.id ? <CircularProgress size={14} /> : <ReplayIcon sx={{ fontSize: 17 }} />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <QueueIcon color="primary" />
            <Typography variant="h6" fontWeight={700}>Event Detail — #{selected?.id}</Typography>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          {selected && (
            <Box>
              <DetailRow label="Event Type">
                <Typography variant="body2" sx={{ fontFamily: "monospace", bgcolor: "#f0f4ff", color: "#1565c0", px: 1, borderRadius: 1, display: "inline-block", fontSize: 12 }}>
                  {selected.event_type}
                </Typography>
              </DetailRow>
              <DetailRow label="Status">
                <Chip size="small" label={selected.status}
                  sx={{ bgcolor: statusMeta(selected.status).bg, color: statusMeta(selected.status).text, fontWeight: 600, fontSize: 11, height: 22 }} />
              </DetailRow>
              <DetailRow label="Retries">
                <Typography variant="body2" fontWeight={700} color={selected.retry_count > 0 ? "warning.dark" : "text.primary"}>
                  {selected.retry_count}
                </Typography>
              </DetailRow>
              <DetailRow label="Created At">
                <Typography variant="body2">{fmtDate(selected.created_at)}</Typography>
              </DetailRow>
              <DetailRow label="Processed At">
                <Typography variant="body2">{fmtDate(selected.processed_at)}</Typography>
              </DetailRow>
              <DetailRow label="Error">
                {selected.error
                  ? <Typography variant="body2" color="error" sx={{ wordBreak: "break-word" }}>{selected.error}</Typography>
                  : <Typography variant="body2" color="text.disabled">None</Typography>
                }
              </DetailRow>
              <DetailRow label="Payload">
                {selected.payload
                  ? (
                    <Box
                      component="pre"
                      sx={{
                        m: 0, p: 1, bgcolor: "#f8f9fa", borderRadius: 1,
                        fontSize: 11, fontFamily: "monospace",
                        overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word",
                        maxHeight: 180, overflowY: "auto",
                      }}
                    >
                      {JSON.stringify(selected.payload, null, 2)}
                    </Box>
                  )
                  : <Typography variant="body2" color="text.disabled">—</Typography>
                }
              </DetailRow>
            </Box>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setSelected(null)}>Close</Button>
          {selected && (
            <Button color="warning" variant="contained" startIcon={<ReplayIcon />}
              disabled={replayingId === selected?.id}
              onClick={async () => { await handleReplay(selected.id); setSelected(null); }}>
              Replay Event
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
