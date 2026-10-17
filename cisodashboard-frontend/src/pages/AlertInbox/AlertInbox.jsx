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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Tooltip,
  TablePagination,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FilterListIcon from "@mui/icons-material/FilterList";
import AddIcon from "@mui/icons-material/Add";
import ShieldIcon from "@mui/icons-material/Shield";
import api from "../../utils/api";

const DEFAULT_ALERTS = [];

const AlertInbox = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [slaFilter, setSlaFilter] = useState("ALL");

  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Selected Alert Inspection Modal
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [assigneeText, setAssigneeText] = useState("");
  const [comments, setComments] = useState([]);

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/v1/alerts");
      if (response.data && Array.isArray(response.data)) {
        const normalized = response.data.map((item, idx) => ({
          ...item,
          id: item.id || idx + 1,
          alert_id: item.alert_id || item.id || `ALT-${idx}`,
          title: item.title || item.name || "Security Alert",
          source_service: item.source_service || item.source || "SECURITY",
          severity: item.severity || "HIGH",
          status: item.status || "OPEN",
          assigned_to: item.assigned_to || "Unassigned",
          asset_id: item.asset_id || "N/A",
          description: item.description || "No description provided.",
          remediation_steps: item.remediation_steps || "Investigate alert details.",
          sla_deadline_hours: item.sla_deadline_hours ?? 24,
          sla_status: item.sla_status || "ON_TRACK",
          hours_remaining: item.hours_remaining ?? 24.0,
          created_at: item.created_at || "Just now",
        }));
        setAlerts(normalized);
      } else {
        setAlerts([]);
      }
    } catch (err) {
      console.warn("Could not fetch security alerts:", err);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (alertId, newStatus) => {
    try {
      await api.put(`/api/v1/alerts/${alertId}`, { status: newStatus });
      setAlerts((prev) =>
        prev.map((a) => (a.alert_id === alertId ? { ...a, status: newStatus } : a))
      );
      setNotification({
        open: true,
        message: `Updated alert ${alertId} status to ${newStatus}!`,
        severity: "success",
      });
    } catch (err) {
      setNotification({
        open: true,
        message: err.response?.data?.detail || `Failed to update alert ${alertId}`,
        severity: "error",
      });
    }
  };

  const loadComments = async (alertId) => {
    try {
      const res = await api.get(`/api/v1/alerts/${alertId}/comments`);
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch {
      setComments([]);
    }
  };

  const openAlert = (alert) => {
    setSelectedAlert(alert);
    setAssigneeText(alert.assigned_to === "Unassigned" ? "" : alert.assigned_to || "");
    setCommentText("");
    loadComments(alert.alert_id);
  };

  const handleAddComment = async () => {
    if (!selectedAlert || !commentText.trim()) return;
    try {
      await api.post(
        `/api/v1/alerts/${selectedAlert.alert_id}/comments?body=${encodeURIComponent(commentText)}&author=analyst`
      );
      setCommentText("");
      loadComments(selectedAlert.alert_id);
      setNotification({ open: true, message: "Comment added", severity: "success" });
    } catch (err) {
      setNotification({ open: true, message: err.response?.data?.detail || "Comment failed", severity: "error" });
    }
  };

  const handleAssignSelected = async () => {
    if (!selectedAlert || !assigneeText.trim()) return;
    try {
      await api.patch(`/api/v1/alerts/${selectedAlert.alert_id}/assign?assignee=${encodeURIComponent(assigneeText)}`);
      handleAssigneeChange(selectedAlert.alert_id, assigneeText);
      setSelectedAlert({ ...selectedAlert, assigned_to: assigneeText, status: "IN_PROGRESS" });
      setNotification({ open: true, message: `Assigned to ${assigneeText}`, severity: "success" });
    } catch (err) {
      setNotification({ open: true, message: err.response?.data?.detail || "Assign failed", severity: "error" });
    }
  };

  const handleSuppressSelected = async () => {
    if (!selectedAlert) return;
    try {
      await api.post(`/api/v1/alerts/${selectedAlert.alert_id}/suppress`);
      handleStatusChange(selectedAlert.alert_id, "DISMISSED");
      setSelectedAlert({ ...selectedAlert, status: "DISMISSED" });
      setNotification({ open: true, message: "Alert suppressed", severity: "success" });
    } catch (err) {
      setNotification({ open: true, message: err.response?.data?.detail || "Suppress failed", severity: "error" });
    }
  };

  const handleAssigneeChange = async (alertId, newAssignee) => {
    try {
      await api.put(`/api/v1/alerts/${alertId}`, { assigned_to: newAssignee });
      setAlerts((prev) =>
        prev.map((a) => (a.alert_id === alertId ? { ...a, assigned_to: newAssignee } : a))
      );
    } catch (err) {
      setNotification({
        open: true,
        message: err.response?.data?.detail || "Failed to assign alert",
        severity: "error",
      });
    }
  };

  // Filter Logic
  const filteredAlerts = alerts.filter((item) => {
    const titleStr = (item.title || "").toLowerCase();
    const idStr = (item.alert_id || "").toString().toLowerCase();
    const assignedStr = (item.assigned_to || "").toLowerCase();
    const assetStr = (item.asset_id || "").toLowerCase();
    const searchStr = (searchTerm || "").toLowerCase();

    const matchesSearch =
      titleStr.includes(searchStr) ||
      idStr.includes(searchStr) ||
      assignedStr.includes(searchStr) ||
      assetStr.includes(searchStr);

    const sevStr = (item.severity || "").toUpperCase();
    const matchesSeverity =
      severityFilter === "ALL" || sevStr === severityFilter.toUpperCase();

    const srcStr = (item.source_service || "").toUpperCase();
    const matchesSource =
      sourceFilter === "ALL" || srcStr === sourceFilter.toUpperCase();

    const stStr = (item.status || "").toUpperCase();
    const matchesStatus =
      statusFilter === "ALL" || stStr === statusFilter.toUpperCase();

    let matchesSLA = true;
    if (slaFilter === "BREACHED") matchesSLA = item.sla_status === "BREACHED";
    if (slaFilter === "NEAR_BREACH") matchesSLA = item.sla_status === "NEAR_BREACH";
    if (slaFilter === "ON_TRACK") matchesSLA = item.sla_status === "ON_TRACK";

    return matchesSearch && matchesSeverity && matchesSource && matchesStatus && matchesSLA;
  });

  const getSeverityChip = (severity) => {
    let color = "#fff";
    let bg = "#0288d1";

    if (severity === "CRITICAL") bg = "#d32f2f";
    else if (severity === "HIGH") bg = "#f57c00";
    else if (severity === "MEDIUM") bg = "#ed6c02";

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
        }}
      />
    );
  };

  const getSLAChip = (slaStatus, hoursRemaining) => {
    if (slaStatus === "BREACHED") {
      return (
        <Chip
          icon={<WarningIcon style={{ fontSize: 14 }} />}
          label={`BREACHED (${Math.abs(hoursRemaining || 0)}h ago)`}
          size="small"
          sx={{ bgcolor: "#fef2f2", color: "#dc2626", fontWeight: 700, fontSize: "10px" }}
        />
      );
    } else if (slaStatus === "NEAR_BREACH") {
      return (
        <Chip
          icon={<HourglassTopIcon style={{ fontSize: 14 }} />}
          label={`NEAR BREACH (${hoursRemaining}h left)`}
          size="small"
          sx={{ bgcolor: "#fff3e0", color: "#d97706", fontWeight: 700, fontSize: "10px" }}
        />
      );
    } else {
      return (
        <Chip
          icon={<AccessTimeIcon style={{ fontSize: 14 }} />}
          label={`ON TRACK (${hoursRemaining}h left)`}
          size="small"
          sx={{ bgcolor: "#f0fdf4", color: "#16a34a", fontWeight: 600, fontSize: "10px" }}
        />
      );
    }
  };

  // Aggregated Counter Stats
  const totalCount = alerts.length;
  const openCount = alerts.filter((a) => a.status === "OPEN" || a.status === "IN_PROGRESS").length;
  const criticalCount = alerts.filter((a) => a.severity === "CRITICAL" && a.status === "OPEN").length;
  const breachedCount = alerts.filter((a) => a.sla_status === "BREACHED").length;

  return (
    <Box sx={{ maxWidth: "100%", width: "100%" }}>
      {/* Top Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e293b" }}>
            Security Alert Inbox
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
            Consolidated Security Incident Inbox, SLA Deadline Tracking & Escalation Workflow
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchAlerts}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Refresh Alert Feed
        </Button>
      </Box>

      {/* Summary Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #2563eb" }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Total Ingested Alerts
                </Typography>
                <NotificationsActiveIcon sx={{ color: "#2563eb" }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#0f172a" }}>
                {totalCount} Alerts
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #f57c00" }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Active Open Incident Queue
                </Typography>
                <WarningIcon sx={{ color: "#f57c00" }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#f57c00" }}>
                {openCount} Active
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #dc2626" }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  SLA Breached Incidents
                </Typography>
                <Badge badgeContent={breachedCount} color="error">
                  <HourglassTopIcon sx={{ color: "#dc2626" }} />
                </Badge>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#dc2626" }}>
                {breachedCount} Breached
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #d32f2f" }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Critical Open Alerts
                </Typography>
                <Badge badgeContent={criticalCount} color="error">
                  <ShieldIcon sx={{ color: "#d32f2f" }} />
                </Badge>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#d32f2f" }}>
                {criticalCount} Critical
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Toolbar */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search alert title, ID, asset, or assignee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: "#94a3b8", mr: 1 }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={3} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select value={severityFilter} label="Severity" onChange={(e) => setSeverityFilter(e.target.value)}>
                <MenuItem value="ALL">All Severities</MenuItem>
                <MenuItem value="CRITICAL">Critical (#d32f2f)</MenuItem>
                <MenuItem value="HIGH">High (#f57c00)</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3} md={2.5}>
            <FormControl size="small" fullWidth>
              <InputLabel>Source Module</InputLabel>
              <Select value={sourceFilter} label="Source Module" onChange={(e) => setSourceFilter(e.target.value)}>
                <MenuItem value="ALL">All Sources</MenuItem>
                <MenuItem value="CSPM">CSPM</MenuItem>
                <MenuItem value="CIEM">CIEM</MenuItem>
                <MenuItem value="K8S">Kubernetes</MenuItem>
                <MenuItem value="THREAT">Threat Intel</MenuItem>
                <MenuItem value="INTEGRITY">Integrity FIM</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3} md={2.5}>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="OPEN">Open</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="RESOLVED">Resolved</MenuItem>
                <MenuItem value="DISMISSED">Dismissed</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>SLA State</InputLabel>
              <Select value={slaFilter} label="SLA State" onChange={(e) => setSlaFilter(e.target.value)}>
                <MenuItem value="ALL">All SLA States</MenuItem>
                <MenuItem value="BREACHED">Breached</MenuItem>
                <MenuItem value="NEAR_BREACH">Near Breach</MenuItem>
                <MenuItem value="ON_TRACK">On Track</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {/* Main Table */}
      <TableContainer component={Paper} sx={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}>
        {loading && <LinearProgress />}
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Alert ID & Title</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Source Module</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Severity</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>SLA Deadline Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Assigned Owner</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Status Dropdown (MuiSelect)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: "#334155" }}>Inspect</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredAlerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: "#64748b" }}>
                  No security alerts matching your filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredAlerts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                <TableRow key={row.alert_id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                      {row.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b", fontFamily: "monospace", display: "block" }}>
                      {row.alert_id}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip label={row.source_service} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                  </TableCell>

                  <TableCell>{getSeverityChip(row.severity)}</TableCell>

                  <TableCell>{getSLAChip(row.sla_status, row.hours_remaining)}</TableCell>

                  <TableCell>
                    <TextField
                      variant="standard"
                      size="small"
                      value={row.assigned_to || ""}
                      onChange={(e) => handleAssigneeChange(row.alert_id, e.target.value)}
                      placeholder="Assignee email..."
                      InputProps={{ disableUnderline: true, style: { fontSize: "13px", color: "#334155" } }}
                    />
                  </TableCell>

                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <Select
                        value={row.status}
                        onChange={(e) => handleStatusChange(row.alert_id, e.target.value)}
                        sx={{ fontSize: "12px", height: "30px", fontWeight: 700 }}
                      >
                        <MenuItem value="OPEN">OPEN</MenuItem>
                        <MenuItem value="IN_PROGRESS">IN PROGRESS</MenuItem>
                        <MenuItem value="RESOLVED">RESOLVED</MenuItem>
                        <MenuItem value="DISMISSED">DISMISSED</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>

                  <TableCell align="right">
                    <Tooltip title="View Incident Details & Remediation">
                      <IconButton size="small" onClick={() => openAlert(row)} sx={{ color: "#2563eb" }}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredAlerts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Alert Inspection Dialog */}
      {selectedAlert && (
        <Dialog open={Boolean(selectedAlert)} onClose={() => setSelectedAlert(null)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, color: "#0f172a" }}>
            Security Incident: {selectedAlert.alert_id} - {selectedAlert.title}
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  Source Module & Asset Target
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
                  {selectedAlert.source_service}: {selectedAlert.asset_id}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  SLA Remediation Target Deadline
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
                  {selectedAlert.sla_deadline_hours} Hours Target ({selectedAlert.sla_status})
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#dc2626", mb: 0.5 }}>
                  Incident Description:
                </Typography>
                <Typography variant="body2" sx={{ color: "#334155", mb: 2 }}>
                  {selectedAlert.description}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#16a34a", mb: 0.5 }}>
                  Recommended Remediation Playbook:
                </Typography>
                <Box sx={{ p: 2, bgcolor: "rgba(63, 81, 181, 0.04)", color: "text.primary", borderRadius: "8px", fontFamily: "monospace", fontSize: "12px", whiteSpace: "pre-wrap", border: "1px solid rgba(63, 81, 181, 0.12)" }}>
                  {selectedAlert.remediation_steps}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  size="small"
                  fullWidth
                  label="Assign to"
                  value={assigneeText}
                  onChange={(e) => setAssigneeText(e.target.value)}
                  sx={{ mb: 1 }}
                />
                <TextField
                  size="small"
                  fullWidth
                  multiline
                  minRows={2}
                  label="Add comment"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                {comments.map((comment) => (
                  <Typography key={comment.id || comment.created_at} variant="caption" display="block" sx={{ mt: 1 }}>
                    {comment.author}: {comment.body}
                  </Typography>
                ))}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleSuppressSelected} color="warning" sx={{ textTransform: "none" }}>
              Suppress
            </Button>
            <Button onClick={handleAssignSelected} sx={{ textTransform: "none" }}>
              Assign
            </Button>
            <Button onClick={handleAddComment} sx={{ textTransform: "none" }}>
              Add Comment
            </Button>
            <Button onClick={() => setSelectedAlert(null)} variant="contained" sx={{ textTransform: "none", bgcolor: "#2563eb" }}>
              Close Details
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert severity={notification.severity} sx={{ width: "100%" }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AlertInbox;
