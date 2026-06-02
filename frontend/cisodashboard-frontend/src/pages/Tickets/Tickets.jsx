import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  IconButton,
  Tooltip,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ticketApi from "../../utils/ticketApi";
import CreateTicketModal from "../../components/Tickets/CreateTicketModal";
import Toast from "../../components/common/Toast";
import { useToast } from "../../components/common/useToast";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import { hasPermission } from "../../utils/permissions";

const getPriorityColor = (priority) => {
  switch (priority) {
    case "critical":
      return "error";
    case "high":
      return "warning";
    case "medium":
      return "info";
    case "low":
      return "default";
    default:
      return "default";
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "new":
      return "info";
    case "assigned":
      return "warning";
    case "in_progress":
      return "primary";
    case "resolved":
      return "success";
    case "closed":
      return "default";
    default:
      return "default";
  }
};

// ✅ Format relative time
const getRelativeTime = (dateStr) => {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const { toast, showToast, closeToast } = useToast();
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();

  // ── Bulk operations state ─────────────────────────────────
  const [selected, setSelected] = useState(new Set());
  const [bulkDialog, setBulkDialog] = useState(null); // "reassign" | "status"
  const [bulkAssignTo, setBulkAssignTo] = useState("");
  const [bulkAssignGroup, setBulkAssignGroup] = useState("");
  const [bulkStatus, setBulkStatus] = useState("in_progress");
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [ticketsData, statsData] = await Promise.all([
        ticketApi.getTickets(),
        ticketApi.getStats(),
      ]);
      setTickets(ticketsData || []);
      setStats(statsData);
    } catch (err) {
      console.error("Error fetching tickets", err);
      showToast("Failed to load tickets", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = tickets.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
      // ✅ Also search by caller
      (t.caller || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchPriority =
      priorityFilter === "all" || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const handleSave = (newTicket) => {
    setTickets((prev) => [newTicket, ...prev]);
    if (stats) setStats({ ...stats, total: stats.total + 1 });
  };

  // ── Bulk helpers ──────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((t) => t.id)));
    }
  };

  const clearSelection = () => setSelected(new Set());

  const handleBulkClose = async () => {
    setBulkLoading(true);
    try {
      const res = await ticketApi.bulkClose(Array.from(selected));
      showToast(`Closed ${res.success_count} ticket(s). ${res.failed_count ? `${res.failed_count} failed.` : ""}`, res.failed_count ? "warning" : "success");
      clearSelection();
      fetchData();
    } catch {
      showToast("Bulk close failed", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkReassign = async () => {
    if (!bulkAssignTo.trim()) { showToast("Assignee is required", "warning"); return; }
    setBulkLoading(true);
    try {
      const res = await ticketApi.bulkReassign(Array.from(selected), bulkAssignTo, bulkAssignGroup);
      showToast(`Reassigned ${res.success_count} ticket(s). ${res.failed_count ? `${res.failed_count} failed.` : ""}`, res.failed_count ? "warning" : "success");
      setBulkDialog(null);
      setBulkAssignTo("");
      setBulkAssignGroup("");
      clearSelection();
      fetchData();
    } catch {
      showToast("Bulk reassign failed", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkStatus = async () => {
    setBulkLoading(true);
    try {
      const res = await ticketApi.bulkUpdateStatus(Array.from(selected), bulkStatus);
      showToast(`Updated ${res.success_count} ticket(s). ${res.failed_count ? `${res.failed_count} skipped (invalid transition).` : ""}`, res.failed_count ? "warning" : "success");
      setBulkDialog(null);
      clearSelection();
      fetchData();
    } catch {
      showToast("Bulk status update failed", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await ticketApi.exportCSV({
        status: statusFilter !== "all" ? statusFilter : undefined,
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
        search: search || undefined,
      });
      showToast("CSV exported successfully!", "success");
    } catch {
      showToast("Failed to export tickets", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* HEADER */}
     <Box
  sx={{
    mb: 3,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }}
>
  <Box>
    <Typography variant="h4" fontWeight="bold">
      Incident Tickets
    </Typography>

    <Typography variant="body2" color="text.secondary">
      Manage and track all incidents
    </Typography>
  </Box>

  <Box sx={{ display: "flex", gap: 1 }}>
    {hasPermission('tickets', 'export_csv') && (
    <Button
      variant="outlined"
      startIcon={<DownloadIcon />}
      onClick={handleExport}
      disabled={exporting}
    >
      {exporting ? "Exporting..." : `Export CSV (${filtered.length})`}
    </Button>
    )}

    {hasPermission('tickets', 'create') && (
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      onClick={() => setOpen(true)}
    >
      Create Ticket
    </Button>
    )}
  </Box>
</Box>

      {/* STATS CARDS */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: "Total", value: stats.total },
            { label: "Open", value: stats.open, color: "warning.main" },
            { label: "Resolved", value: stats.resolved, color: "success.main" },
            { label: "Closed", value: stats.closed, color: "text.secondary" },
            {
              label: "Critical",
              value: stats.by_priority?.critical || 0,
              color: "error.main",
            },
            {
              label: "SLA Breached",
              value: stats.sla_breached || 0,
              color: "error.main",
            },
          ].map((item, i) => (
            <Grid size={{ xs: 6, md: 2 }} key={i}>
              <Card>
                <CardContent sx={{ py: 1.5 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {item.label}
                  </Typography>
                  <Typography variant="h5" sx={{ color: item.color }}>
                    {item.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* SEARCH + FILTERS */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          gap: 2,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <TextField
          placeholder="Search by title, ticket number or caller..."
          sx={{ flex: 1, minWidth: 200 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {["all", "new", "assigned", "in_progress", "resolved", "closed"].map(
            (s) => (
              <Chip
                key={s}
                label={s === "all" ? "All" : s.replace("_", " ")}
                color={getStatusColor(s)}
                variant={statusFilter === s ? "filled" : "outlined"}
                onClick={() => setStatusFilter(s)}
                clickable
                size="small"
              />
            ),
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          {["all", "critical", "high", "medium", "low"].map((p) => (
            <Chip
              key={p}
              label={p === "all" ? "All Priority" : p}
              color={getPriorityColor(p)}
              variant={priorityFilter === p ? "filled" : "outlined"}
              onClick={() => setPriorityFilter(p)}
              clickable
              size="small"
            />
          ))}
        </Box>
      </Box>

      {/* BULK ACTIONS TOOLBAR */}
      {selected.size > 0 && (
        <Alert
          severity="info"
          icon={false}
          sx={{ mb: 2, display: "flex", alignItems: "center", borderRadius: 2 }}
          action={
            <Button size="small" color="inherit" onClick={clearSelection}>
              Clear
            </Button>
          }
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Typography variant="body2" fontWeight={600}>
              {selected.size} ticket{selected.size > 1 ? "s" : ""} selected
            </Typography>
            <Button
              size="small"
              variant="contained"
              color="error"
              startIcon={<CloseIcon />}
              onClick={handleBulkClose}
              disabled={bulkLoading}
            >
              Bulk Close
            </Button>
            {hasPermission('tickets', 'bulk_reassign') && (
            <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={<PersonIcon />}
              onClick={() => setBulkDialog("reassign")}
              disabled={bulkLoading}
            >
              Bulk Reassign
            </Button>
            )}
            <Button
              size="small"
              variant="outlined"
              startIcon={<SyncAltIcon />}
              onClick={() => setBulkDialog("status")}
              disabled={bulkLoading}
            >
              Update Status
            </Button>
          </Box>
        </Alert>
      )}

      {/* TABLE */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: "center", mt: 5 }}>
          <Typography color="text.secondary">No tickets found</Typography>
          {tickets.length === 0 && (
            <Button
              sx={{ mt: 2 }}
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setOpen(true)}
            >
              Create your first ticket
            </Button>
          )}
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "grey.50" }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.size > 0 && selected.size < filtered.length}
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onChange={toggleSelectAll}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Ticket #</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>
                  Title & Description
                </TableCell>
                {/* ✅ NEW */}
                <TableCell sx={{ fontWeight: "bold" }}>Caller</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Assigned To</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Created</TableCell>
                {/* ✅ NEW */}
                <TableCell sx={{ fontWeight: "bold" }}>Updated</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((ticket) => (
                <TableRow
                  key={ticket.id}
                  hover
                  selected={selected.has(ticket.id)}
                  sx={{
                    "&:last-child td": { border: 0 },
                    backgroundColor:
                      ticket.sla_response_breached ||
                      ticket.sla_resolution_breached
                        ? "rgba(211,47,47,0.04)"
                        : "inherit",
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.has(ticket.id)}
                      onChange={() => toggleSelect(ticket.id)}
                      size="small"
                    />
                  </TableCell>
                  {/* Ticket Number + SLA breach indicator */}
                  <TableCell
                    sx={{
                      fontWeight: 500,
                      color: "primary.main",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      {ticket.ticket_number}
                      {/* ✅ SLA breach warning icon */}
                      {(ticket.sla_response_breached ||
                        ticket.sla_resolution_breached) && (
                        <Tooltip title="SLA Breached">
                          <WarningAmberIcon fontSize="small" color="error" />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>

                  {/* ✅ Title + Description preview */}
                  <TableCell sx={{ maxWidth: 220 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {ticket.title}
                    </Typography>
                    {ticket.description && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: 200,
                        }}
                      >
                        {ticket.description}
                      </Typography>
                    )}
                  </TableCell>

                  {/* ✅ Caller */}
                  <TableCell>
                    <Typography variant="body2">
                      {ticket.caller || "—"}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={ticket.priority}
                      color={getPriorityColor(ticket.priority)}
                      size="small"
                    />
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={ticket.status.replace("_", " ")}
                      color={getStatusColor(ticket.status)}
                      size="small"
                    />
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">{ticket.category}</Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {ticket.assigned_to || "—"}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Typography variant="body2">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>

                  {/* ✅ Updated — relative time */}
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Tooltip
                      title={new Date(ticket.updated_at).toLocaleString()}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {getRelativeTime(ticket.updated_at)}
                      </Typography>
                    </Tooltip>
                  </TableCell>

                  <TableCell>
                    <Tooltip title="View Detail">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <CreateTicketModal
        open={open}
        handleClose={() => setOpen(false)}
        handleSave={handleSave}
        showToast={showToast}
      />
      <Toast toast={toast} onClose={closeToast} />

      {/* BULK REASSIGN DIALOG */}
      <Dialog open={bulkDialog === "reassign"} onClose={() => setBulkDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Bulk Reassign ({selected.size} tickets)</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Assign To *"
            fullWidth
            value={bulkAssignTo}
            onChange={(e) => setBulkAssignTo(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
            placeholder="e.g. john.doe"
          />
          <TextField
            label="Assignment Group"
            fullWidth
            value={bulkAssignGroup}
            onChange={(e) => setBulkAssignGroup(e.target.value)}
            placeholder="e.g. IT Support"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleBulkReassign} disabled={bulkLoading}>
            {bulkLoading ? "Reassigning..." : "Reassign"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* BULK STATUS DIALOG */}
      <Dialog open={bulkDialog === "status"} onClose={() => setBulkDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Update Status ({selected.size} tickets)</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>New Status</InputLabel>
            <Select
              value={bulkStatus}
              label="New Status"
              onChange={(e) => setBulkStatus(e.target.value)}
            >
              {["assigned", "in_progress", "resolved", "closed"].map((s) => (
                <MenuItem key={s} value={s}>{s.replace("_", " ")}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            Tickets that cannot transition to this status will be skipped.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleBulkStatus} disabled={bulkLoading}>
            {bulkLoading ? "Updating..." : "Update"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tickets;
