import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Button,
  Grid,
  Divider,
  TextField,
  LinearProgress,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Tooltip,
  Paper,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CommentIcon from "@mui/icons-material/Comment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoIcon from "@mui/icons-material/Info";
import SecurityIcon from "@mui/icons-material/Security";
import ticketApi from "../../utils/ticketApi";
import Toast from "../../components/common/Toast";
import { useToast } from "../../components/common/useToast";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import HistoryIcon from "@mui/icons-material/History";
import FileUploadZone from "../../components/Files/FileUploadZone";
import FileList from "../../components/Files/FileList";
import fileApi from "../../utils/fileApi";

const getPriorityColor = (p) => {
  switch (p) {
    case "critical":
      return "error";
    case "high":
      return "warning";
    case "medium":
      return "info";
    default:
      return "default";
  }
};

const getStatusColor = (s) => {
  switch (s) {
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

const getSlaColor = (status) => {
  switch (status) {
    case "met":
      return "success";
    case "breached":
      return "error";
    case "warning":
      return "warning";
    default:
      return "default";
  }
};

const SLA_RESPONSE_MINUTES = {
  critical: 60,
  high: 240,
  medium: 480,
  low: 1440,
};
const SLA_RESOLUTION_MINUTES = {
  critical: 240,
  high: 1440,
  medium: 2880,
  low: 4320,
};
const SLA_LABELS = {
  response: { critical: "1h", high: "4h", medium: "8h", low: "24h" },
  resolution: {
    critical: "4h",
    high: "1 day",
    medium: "2 days",
    low: "3 days",
  },
};

const VALID_TRANSITIONS = {
  new: ["assigned"],
  assigned: ["in_progress"],
  in_progress: ["resolved"],
  resolved: ["closed"],
  closed: [],
};

// ✅ Tab panel helper
const TabPanel = ({ children, value, index }) => (
  <Box hidden={value !== index} sx={{ pt: 3 }}>
    {value === index && children}
  </Box>
);

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, showToast, closeToast } = useToast();

  const [ticket, setTicket] = useState(null);
  const [sla, setSla] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [assignTo, setAssignTo] = useState("");
  const [assignGroup, setAssignGroup] = useState("");
  const [resolutionCode, setResolutionCode] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolvedBy, setResolvedBy] = useState("");
  const [comment, setComment] = useState("");
  const [commentBy, setCommentBy] = useState("admin");
  const [ticketFiles, setTicketFiles] = useState([]);

  const fetchTicket = async () => {
    try {
      const [ticketData, slaData, filesData] = await Promise.all([
        ticketApi.getTicketById(id),
        ticketApi.getSLA(id),
        fileApi.listFiles("ticket", id),
      ]);
      setTicket(ticketData);
      setSla(slaData);
      setTicketFiles(filesData || []);
    } catch {
      setError("Ticket not found");
    } finally {
      setLoading(false);
    }

    const filesData = await fileApi.listFiles("ticket", id);
    setTicketFiles(filesData || []);
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      await ticketApi.updateStatus(id, newStatus);
      showToast(`Status updated to ${newStatus}`, "success");
      fetchTicket();
    } catch (err) {
      showToast(
        err?.response?.data?.detail || "Failed to update status",
        "error",
      );
    }
  };

  const handleAssign = async () => {
    if (!assignTo.trim()) {
      showToast("Assigned To is required", "warning");
      return;
    }
    try {
      await ticketApi.assignTicket(id, {
        assigned_to: assignTo,
        assignment_group: assignGroup,
      });
      showToast("Ticket assigned successfully", "success");
      setAssignTo("");
      setAssignGroup("");
      fetchTicket();
    } catch {
      showToast("Failed to assign ticket", "error");
    }
  };

  const handleResolve = async () => {
    if (
      !resolutionCode.trim() ||
      !resolutionNotes.trim() ||
      !resolvedBy.trim()
    ) {
      showToast("All resolution fields are required", "warning");
      return;
    }
    try {
      await ticketApi.resolveTicket(id, {
        resolution_code: resolutionCode,
        resolution_notes: resolutionNotes,
        resolved_by: resolvedBy,
      });
      showToast("Ticket resolved successfully", "success");
      setResolutionCode("");
      setResolutionNotes("");
      setResolvedBy("");
      fetchTicket();
    } catch {
      showToast("Failed to resolve ticket", "error");
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) {
      showToast("Comment cannot be empty", "warning");
      return;
    }
    try {
      await ticketApi.addComment(id, { comment, created_by: commentBy });
      showToast("Comment added", "success");
      setComment("");
      fetchTicket();
    } catch {
      showToast("Failed to add comment", "error");
    }
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );

  if (error || !ticket)
    return (
      <Box sx={{ textAlign: "center", mt: 10 }}>
        <Typography color="error">{error}</Typography>
        <Button
          sx={{ mt: 2 }}
          variant="outlined"
          onClick={() => navigate("/tickets")}
        >
          Back to Tickets
        </Button>
      </Box>
    );

  const nextStatuses = VALID_TRANSITIONS[ticket.status] || [];
  const priority = ticket.priority;

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        maxWidth: 1200,
        mx: "auto",
        backgroundColor: "#f5f7fb",
        minHeight: "100vh",
      }}
    >
      {/* HEADER */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 4,
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Button
              startIcon={<ArrowBackIcon />}
              variant="outlined"
              onClick={() => navigate("/tickets")}
              sx={{ borderRadius: 3 }}
            >
              Back to Tickets
            </Button>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {nextStatuses.map((s) => (
                <Button
                  key={s}
                  variant="contained"
                  size="small"
                  onClick={() => handleStatusChange(s)}
                  sx={{ borderRadius: 3, textTransform: "capitalize" }}
                >
                  Move to {s.replace("_", " ")}
                </Button>
              ))}
            </Box>
          </Box>
          <Box sx={{ mt: 3 }}>
            <Typography variant="h4" fontWeight={700}>
              {ticket.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {ticket.ticket_number} • Created by {ticket.created_by} •{" "}
              {new Date(ticket.created_at).toLocaleString()}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* STATUS CARDS */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: "Priority",
            value: (
              <Chip
                label={ticket.priority}
                color={getPriorityColor(ticket.priority)}
              />
            ),
          },
          {
            label: "Status",
            value: (
              <Chip
                label={ticket.status.replace("_", " ")}
                color={getStatusColor(ticket.status)}
              />
            ),
          },
          { label: "Category", value: ticket.category },
          { label: "Assigned To", value: ticket.assigned_to || "Unassigned" },
        ].map((item, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
            <Card
              sx={{
                borderRadius: 2,
                height: "100%",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                border: "1px solid #eef1f6",
              }}
            >
              <CardContent sx={{ textAlign: "center", py: 3 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  {item.label}
                </Typography>
                {typeof item.value === "string" ? (
                  <Typography variant="h6" fontWeight={700}>
                    {item.value}
                  </Typography>
                ) : (
                  item.value
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* SLA PANEL */}
      {sla && (
        <Card
          sx={{
            borderRadius: 4,
            mb: 3,
            boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
            border: "1px solid",
            borderColor:
              sla.resolution_status === "breached" ||
              sla.response_status === "breached"
                ? "error.main"
                : sla.resolution_status === "warning" ||
                    sla.response_status === "warning"
                  ? "warning.main"
                  : "#eef1f6",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" fontWeight={700}>
                SLA Status
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Priority: <strong>{priority}</strong> — Response target:{" "}
                {SLA_LABELS.response[priority]} | Resolution target:{" "}
                {SLA_LABELS.resolution[priority]}
              </Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: "#fafbfd",
                    border: "1px solid #edf1f7",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" fontWeight={700}>
                      Response SLA
                    </Typography>
                    <Chip
                      label={sla.response_status.toUpperCase()}
                      color={getSlaColor(sla.response_status)}
                      size="small"
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Due:{" "}
                    {sla.response_due
                      ? new Date(sla.response_due).toLocaleString()
                      : "—"}
                  </Typography>
                  {sla.response_remaining_minutes !== null &&
                    sla.response_status !== "met" && (
                      <Box sx={{ mt: 1.5 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.max(
                            0,
                            Math.min(
                              100,
                              (sla.response_remaining_minutes /
                                SLA_RESPONSE_MINUTES[priority]) *
                                100,
                            ),
                          )}
                          color={
                            sla.response_status === "warning"
                              ? "warning"
                              : "success"
                          }
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 0.5, display: "block" }}
                        >
                          {sla.response_remaining_minutes}m remaining
                        </Typography>
                      </Box>
                    )}
                  {sla.response_status === "met" && (
                    <Typography
                      variant="caption"
                      color="success.main"
                      sx={{ mt: 0.5, display: "block" }}
                    >
                      ✓ Met at{" "}
                      {ticket.sla_response_met_at
                        ? new Date(ticket.sla_response_met_at).toLocaleString()
                        : "—"}
                    </Typography>
                  )}
                  {sla.response_status === "breached" && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 0.5, display: "block" }}
                    >
                      ⚠ SLA Breached
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: "#fafbfd",
                    border: "1px solid #edf1f7",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" fontWeight={700}>
                      Resolution SLA
                    </Typography>
                    <Chip
                      label={sla.resolution_status.toUpperCase()}
                      color={getSlaColor(sla.resolution_status)}
                      size="small"
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Due:{" "}
                    {sla.resolution_due
                      ? new Date(sla.resolution_due).toLocaleString()
                      : "—"}
                  </Typography>
                  {sla.resolution_remaining_minutes !== null &&
                    sla.resolution_status !== "met" && (
                      <Box sx={{ mt: 1.5 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.max(
                            0,
                            Math.min(
                              100,
                              (sla.resolution_remaining_minutes /
                                SLA_RESOLUTION_MINUTES[priority]) *
                                100,
                            ),
                          )}
                          color={
                            sla.resolution_status === "warning"
                              ? "warning"
                              : "primary"
                          }
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 0.5, display: "block" }}
                        >
                          {sla.resolution_remaining_minutes}m remaining
                        </Typography>
                      </Box>
                    )}
                  {sla.resolution_status === "met" && (
                    <Typography
                      variant="caption"
                      color="success.main"
                      sx={{ mt: 0.5, display: "block" }}
                    >
                      ✓ Resolved within SLA
                    </Typography>
                  )}
                  {sla.resolution_status === "breached" && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 0.5, display: "block" }}
                    >
                      ⚠ SLA Breached
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* ✅ TABS SECTION */}
      <Card sx={{ borderRadius: 4, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", px: 3 }}>
          <Tabs
            value={activeTab}
            onChange={async (e, val) => {
              setActiveTab(val);
              if (val === 5 && history.length === 0) {
                setHistoryLoading(true);
                try {
                  const h = await ticketApi.getHistory(id);
                  setHistory(h || []);
                } catch {
                  showToast("Failed to load history", "error");
                } finally {
                  setHistoryLoading(false);
                }
              }
            }}
            sx={{
              "& .MuiTab-root": {
                textTransform: "capitalize",
                fontWeight: 600,
              },
            }}
          >
            <Tab
              icon={<InfoIcon fontSize="small" />}
              iconPosition="start"
              label="Details"
            />
            <Tab
              icon={<CommentIcon fontSize="small" />}
              iconPosition="start"
              label={`Notes (${ticket.comments?.length || 0})`}
            />
            <Tab
              icon={<CheckCircleIcon fontSize="small" />}
              iconPosition="start"
              label="Resolution Information"
            />
            <Tab
              icon={<SecurityIcon fontSize="small" />}
              iconPosition="start"
              label="Related Records"
            />
            <Tab
              icon={<AttachFileIcon fontSize="small" />}
              iconPosition="start"
              label={`Files (${ticketFiles.length})`}
            />
            <Tab
              icon={<HistoryIcon fontSize="small" />}
              iconPosition="start"
              label="Change History"
            />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 4 }}>
          {/* TAB 0 — DETAILS */}
          <TabPanel value={activeTab} index={0}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Description
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mb: 4,
                lineHeight: 1.8,
                backgroundColor: "#fafbfd",
                p: 2,
                borderRadius: 2,
              }}
            >
              {ticket.description || "No description provided"}
            </Typography>
            <Grid container spacing={3}>
              {[
                { label: "Caller", value: ticket.caller || "—" },
                { label: "Caller Email", value: ticket.caller_email || "—" },
                { label: "Channel", value: ticket.channel || "—" },
                { label: "Impact", value: ticket.impact },
                { label: "Urgency", value: ticket.urgency },
                { label: "Subcategory", value: ticket.subcategory || "—" },
                { label: "Asset ID", value: ticket.asset_id ?? "—" },
                {
                  label: "Assignment Group",
                  value: ticket.assignment_group || "—",
                },
                {
                  label: "Created At",
                  value: new Date(ticket.created_at).toLocaleString(),
                },
                {
                  label: "Updated At",
                  value: new Date(ticket.updated_at).toLocaleString(),
                },
              ].map((item, i) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      backgroundColor: "#fafbfd",
                      border: "1px solid #edf1f7",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {item.label}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        mt: 0.5,
                        fontWeight: 600,
                        textTransform:
                          item.label === "Channel" ? "capitalize" : "none",
                      }}
                    >
                      {item.value}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Assign form — only when new */}
            {ticket.status === "new" && (
              <Box sx={{ mt: 4 }}>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                  Assign Ticket
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 5 }}>
                    <TextField
                      label="Assign To"
                      size="small"
                      fullWidth
                      value={assignTo}
                      onChange={(e) => setAssignTo(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 5 }}>
                    <TextField
                      label="Assignment Group"
                      size="small"
                      fullWidth
                      value={assignGroup}
                      onChange={(e) => setAssignGroup(e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 2 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleAssign}
                      sx={{ height: "100%", borderRadius: 3 }}
                    >
                      Assign
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}
          </TabPanel>

          {/* TAB 1 — NOTES / COMMENTS */}
          <TabPanel value={activeTab} index={1}>
            {ticket.comments?.length === 0 ? (
              <Typography color="text.secondary">No notes yet</Typography>
            ) : (
              ticket.comments?.map((c) => (
                <Box
                  key={c.id}
                  sx={{
                    mb: 2,
                    p: 2,
                    borderRadius: 3,
                    backgroundColor: "#fafbfd",
                    border: "1px solid #edf1f7",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography fontWeight={700}>{c.created_by}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(c.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                    {c.comment}
                  </Typography>
                </Box>
              ))
            )}
            {/* Add comment */}
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                Add Note
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <TextField
                    label="Note"
                    size="small"
                    fullWidth
                    multiline
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      height: "100%",
                    }}
                  >
                    <TextField
                      label="Your Name"
                      size="small"
                      value={commentBy}
                      onChange={(e) => setCommentBy(e.target.value)}
                    />
                    <Button
                      variant="contained"
                      onClick={handleComment}
                      sx={{ borderRadius: 3, py: 1.2 }}
                    >
                      Post Note
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>

          {/* TAB 2 — RESOLUTION INFORMATION */}
          <TabPanel value={activeTab} index={2}>
            {ticket.status === "in_progress" ? (
              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Fill in the resolution details to close this ticket.
                </Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Resolution Code"
                      size="small"
                      fullWidth
                      value={resolutionCode}
                      onChange={(e) => setResolutionCode(e.target.value)}
                      placeholder="e.g. Fixed, Workaround, Not Reproducible"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      label="Resolved By"
                      size="small"
                      fullWidth
                      value={resolvedBy}
                      onChange={(e) => setResolvedBy(e.target.value)}
                    />
                  </Grid>
                </Grid>
                <TextField
                  label="Resolution Notes"
                  size="small"
                  fullWidth
                  multiline
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe how the issue was resolved..."
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleResolve}
                  sx={{ borderRadius: 3 }}
                >
                  Mark as Resolved
                </Button>
              </Box>
            ) : ticket.resolution_notes ? (
              <Box>
                <Box
                  sx={{
                    p: 2,
                    mb: 3,
                    borderRadius: 2,
                    background:
                      "linear-gradient(135deg, rgba(76,175,80,0.08), rgba(76,175,80,0.15))",
                    border: "1px solid rgba(76,175,80,0.2)",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    color="success.main"
                    fontWeight={700}
                  >
                    ✓ Ticket{" "}
                    {ticket.status === "closed" ? "Closed" : "Resolved"}
                  </Typography>
                </Box>
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: "#fafbfd",
                        border: "1px solid #edf1f7",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Resolution Code
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {ticket.resolution_code || "—"}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: "#fafbfd",
                        border: "1px solid #edf1f7",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Resolved By
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {ticket.resolved_by || "—"}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: "#fafbfd",
                        border: "1px solid #edf1f7",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Resolved At
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {ticket.resolved_at
                          ? new Date(ticket.resolved_at).toLocaleString()
                          : "—"}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                <Box
                  sx={{
                    p: 3,
                    backgroundColor: "#fafbfd",
                    borderRadius: 2,
                    border: "1px solid #edf1f7",
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Resolution Notes
                  </Typography>
                  <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                    {ticket.resolution_notes}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: "center", py: 5 }}>
                <Typography color="text.secondary">
                  No resolution information yet.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Move ticket to "In Progress" to enable resolution.
                </Typography>
              </Box>
            )}
          </TabPanel>

          {/* TAB 3 — RELATED RECORDS */}
          <TabPanel value={activeTab} index={3}>
            <Grid container spacing={3}>
              {/* Ticket Timeline */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                  Ticket Timeline
                </Typography>
                <Box sx={{ position: "relative", pl: 3 }}>
                  {[
                    {
                      label: "Ticket Created",
                      time: ticket.created_at,
                      color: "info.main",
                      done: true,
                    },
                    {
                      label: "Assigned",
                      time: ticket.sla_response_met_at,
                      color: "warning.main",
                      done: !!ticket.sla_response_met_at,
                    },
                    {
                      label: "In Progress",
                      time: null,
                      color: "primary.main",
                      done: ["in_progress", "resolved", "closed"].includes(
                        ticket.status,
                      ),
                    },
                    {
                      label: "Resolved",
                      time: ticket.resolved_at,
                      color: "success.main",
                      done: !!ticket.resolved_at,
                    },
                    {
                      label: "Closed",
                      time: ticket.closed_at,
                      color: "default",
                      done: !!ticket.closed_at,
                    },
                  ].map((step, i) => (
                    <Box
                      key={i}
                      sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          mt: 0.5,
                          mr: 2,
                          flexShrink: 0,
                          backgroundColor: step.done ? step.color : "grey.300",
                          border: "2px solid",
                          borderColor: step.done ? step.color : "grey.300",
                        }}
                      />
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={step.done ? 700 : 400}
                          color={step.done ? "text.primary" : "text.disabled"}
                        >
                          {step.label}
                        </Typography>
                        {step.time && (
                          <Typography variant="caption" color="text.secondary">
                            {new Date(step.time).toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              {/* Key Dates */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                  Key Dates
                </Typography>
                <Grid container spacing={2}>
                  {[
                    { label: "Created At", value: ticket.created_at },
                    { label: "Last Updated", value: ticket.updated_at },
                    { label: "Resolved At", value: ticket.resolved_at },
                    { label: "Closed At", value: ticket.closed_at },
                  ].map((item, i) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          backgroundColor: "#fafbfd",
                          border: "1px solid #edf1f7",
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {item.label}
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {item.value
                            ? new Date(item.value).toLocaleString()
                            : "—"}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </TabPanel>

          {/* TAB 4 — FILES */}
          <TabPanel value={activeTab} index={4}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Attached Files
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Files attached to ticket <strong>{ticket.ticket_number}</strong>
            </Typography>

            {/* Upload zone — auto-passes ticket context + ref_id */}
            <Box sx={{ mb: 3 }}>
              <FileUploadZone
                context="ticket"
                refId={String(id)}
                onUploadSuccess={(newFile) =>
                  setTicketFiles((prev) => [newFile, ...prev])
                }
                showToast={showToast}
              />
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* File list */}
            <FileList
              files={ticketFiles}
              onDelete={(fileId) =>
                setTicketFiles((prev) =>
                  prev.filter((f) => f.file_id !== fileId),
                )
              }
              showToast={showToast}
            />
          </TabPanel>

          {/* TAB 5 — CHANGE HISTORY */}
          <TabPanel value={activeTab} index={5}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Field-Level Change History
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Every field change on <strong>{ticket.ticket_number}</strong> — who changed what, and when.
            </Typography>
            {historyLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : history.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <HistoryIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
                <Typography color="text.secondary">No changes recorded yet.</Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "grey.50" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Field</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Old Value</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>New Value</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Changed By</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>When</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {history.map((h) => (
                      <TableRow key={h.id} hover>
                        <TableCell>
                          <Chip label={h.field_name} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell sx={{ color: "error.main", fontFamily: "monospace" }}>
                          {h.old_value ?? <em style={{ color: "#999" }}>—</em>}
                        </TableCell>
                        <TableCell sx={{ color: "success.main", fontFamily: "monospace" }}>
                          {h.new_value ?? <em style={{ color: "#999" }}>—</em>}
                        </TableCell>
                        <TableCell>{h.changed_by}</TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <Tooltip title={new Date(h.changed_at).toLocaleString()}>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(h.changed_at).toLocaleString()}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
        </CardContent>
      </Card>

      <Toast toast={toast} onClose={closeToast} />
    </Box>
  );
};

export default TicketDetail;
