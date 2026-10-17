import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Switch, FormControlLabel, TextField, FormControl, InputLabel, Select,
  MenuItem, Snackbar, Alert, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, LinearProgress, Tabs, Tab, List, ListItem,
  ListItemText, ListItemIcon, Avatar, Badge, Accordion, AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import SendIcon from "@mui/icons-material/Send";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import WebhookIcon from "@mui/icons-material/Webhook";
import NotificationsIcon from "@mui/icons-material/Notifications";
import TuneIcon from "@mui/icons-material/Tune";
import HistoryIcon from "@mui/icons-material/History";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import LinkIcon from "@mui/icons-material/Link";
import CloseIcon from "@mui/icons-material/Close";
import api from "../../utils/api";

const DEFAULT_CHANNELS = [];
const DEFAULT_DELIVERY_LOG = [];

const TYPE_CFG = {
  SLACK: {
    color: "#4A154B",
    bg: "#f3e5f5",
    icon: "💬",
    label: "Slack",
    nameLabel: "Slack Channel / Room Name",
    namePlaceholder: "e.g. SOC Critical Alerts (#soc-alerts)",
    urlLabel: "Slack Incoming Webhook URL",
    urlPlaceholder: "https://hooks.slack.com/services/T0000/B0000/XXXXX",
    authLabel: "Bot Token / Signing Secret (Optional)",
    authPlaceholder: "e.g. xoxb-your-slack-bot-token",
    infoText: "Posts rich JSON block alerts directly into your team's Slack channel.",
  },
  TEAMS: {
    color: "#464EB8",
    bg: "#e8eaf6",
    icon: "🟦",
    label: "MS Teams",
    nameLabel: "MS Teams Channel Name",
    namePlaceholder: "e.g. Incident Response Operations Room",
    urlLabel: "MS Teams Webhook Connector Target URL",
    urlPlaceholder: "https://outlook.office.com/webhook/xxxx/IncomingWebhook/xxxx",
    authLabel: "Custom Webhook Secret Key (Optional)",
    authPlaceholder: "e.g. Secret HMAC key",
    infoText: "Sends formatted Adaptive Cards directly into Microsoft Teams channels.",
  },
  SPLUNK: {
    color: "#65A637",
    bg: "#e8f5e9",
    icon: "🔍",
    label: "Splunk HEC",
    nameLabel: "Splunk Collector Cluster Name",
    namePlaceholder: "e.g. Production Splunk HEC SIEM",
    urlLabel: "Splunk HTTP Event Collector (HEC) Target URL",
    urlPlaceholder: "https://splunk-hec.company.com:8088/services/collector/raw",
    authLabel: "Splunk HEC Token (Required)",
    authPlaceholder: "Bearer 12345678-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    infoText: "Streams raw security telemetry JSON directly into Splunk SIEM index.",
  },
  EMAIL: {
    color: "#d32f2f",
    bg: "#fce4ec",
    icon: "✉️",
    label: "Email SMTP",
    nameLabel: "Email Distribution List Name",
    namePlaceholder: "e.g. Executive CISO Security Alert Group",
    urlLabel: "Target Recipient Email Address(es)",
    urlPlaceholder: "ciso-alerts@company.com, soc-lead@company.com",
    authLabel: "SMTP Password / API Key",
    authPlaceholder: "e.g. SG.xxxxxxxxx SendGrid API Key",
    infoText: "Dispatches automated HTML email digests to configured email distribution lists.",
  },
  PAGERDUTY: {
    color: "#06AC38",
    bg: "#e8f5e9",
    icon: "🚨",
    label: "PagerDuty",
    nameLabel: "PagerDuty Service / Escalation Name",
    namePlaceholder: "e.g. Tier-1 On-Call Security Escalation",
    urlLabel: "PagerDuty Events API v2 Target URL",
    urlPlaceholder: "https://events.pagerduty.com/v2/enqueue",
    authLabel: "PagerDuty Integration Key (Required)",
    authPlaceholder: "e.g. 32-character hexadecimal integration key",
    infoText: "Triggers high-priority PagerDuty incident alerts to initiate on-call escalation.",
  },
  GENERIC: {
    color: "#546e7a",
    bg: "#eceff1",
    icon: "🔗",
    label: "Generic HTTP",
    nameLabel: "Custom Webhook Name",
    namePlaceholder: "e.g. Internal SOAR / Custom HTTP Listener",
    urlLabel: "HTTP Webhook Endpoint Target URL",
    urlPlaceholder: "https://api.yourcompany.com/v1/security-webhooks",
    authLabel: "Authorization Header / Secret Token (Optional)",
    authPlaceholder: "Bearer token string or X-API-Key: 12345",
    infoText: "Posts standard JSON payload HTTP requests to any custom API endpoint.",
  },
};

const SEVERITY_OPTS = ["CRITICAL","HIGH","MEDIUM","LOW","INFO"];

const ROUTING_RULES = [
  { title: "CRITICAL Severity", color: "#d32f2f", bg: "#fef2f2", channels: ["SOC Slack","PagerDuty — On-Call Escalation","Splunk HEC — Security SIEM","CISO Executive Email Report"], sources: ["CSPM","CIEM","K8S","INTEGRITY","THREAT"], policy: "Immediate — SLA 4h" },
  { title: "HIGH Severity", color: "#f57c00", bg: "#fff3e0", channels: ["SOC Slack","Security Team Microsoft Teams","Splunk HEC — Security SIEM"], sources: ["CSPM","CIEM","K8S","THREAT"], policy: "Standard — SLA 12h" },
  { title: "MEDIUM Severity", color: "#0288d1", bg: "#e0f2fe", channels: ["Security Team Microsoft Teams","Splunk HEC — Security SIEM"], sources: ["CSPM","INTEGRITY"], policy: "Scheduled — SLA 24h" },
  { title: "LOW and INFO", color: "#546e7a", bg: "#eceff1", channels: ["Splunk HEC — Security SIEM"], sources: ["ALL"], policy: "Batch — Daily Digest" },
];

const EMPTY = { name: "", type: "SLACK", url: "", description: "", auth_header: "", event_filters: ["CRITICAL","HIGH"], enabled: true };

const Notifications = () => {
  const [channels, setChannels] = useState([]);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [newCh, setNewCh] = useState({...EMPTY});
  const [testingId, setTestingId] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  // In-Modal Live Connection Test States
  const [modalTesting, setModalTesting] = useState(false);
  const [modalTestResult, setModalTestResult] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([api.get("/api/v1/notifications"), api.get("/api/v1/webhooks/delivery-log")]);
      setChannels(r1.data && Array.isArray(r1.data) ? r1.data : []);
      setLog(r2.data && Array.isArray(r2.data) ? r2.data : []);
    } catch {
      setChannels([]);
      setLog([]);
    } finally { setLoading(false); }
  };

  const toast = (message, severity = "success") => setSnack({ open: true, message, severity });

  const handleToggle = async (id, val) => {
    try {
      await api.put("/api/v1/notifications/" + id, { enabled: val });
      setChannels(p => p.map(c => c.id === id ? { ...c, enabled: val } : c));
      toast("Channel " + (val ? "enabled" : "disabled"));
    } catch (err) {
      toast(err?.response?.data?.detail || "Could not update channel", "error");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete("/api/v1/notifications/" + id);
      setChannels(p => p.filter(c => c.id !== id));
      toast("Channel removed", "info");
    } catch (err) {
      toast(err?.response?.data?.detail || "Could not delete channel", "error");
    }
  };

  const handleTest = async (ch) => {
    setTestingId(ch.id);
    try {
      const res = await api.post("/api/v1/webhooks/test", { channel_id: ch.id });
      const ok = res.data?.status === "SUCCESS";
      toast(ok ? "Test payload sent to " + ch.name : (res.data?.response_message || "Test failed"), ok ? "success" : "error");
      setLog(p => [{ id: "dl-" + Date.now(), channel: ch.name, event: "TEST — Manual Trigger", status: ok ? "DELIVERED" : "FAILED", latency_ms: 0, timestamp: "Just now" }, ...p]);
    } catch (err) {
      toast(err?.response?.data?.detail || "Test failed", "error");
      setLog(p => [{ id: "dl-" + Date.now(), channel: ch.name, event: "TEST — Manual Trigger", status: "FAILED", latency_ms: 0, timestamp: "Just now" }, ...p]);
    } finally {
      setTestingId(null);
    }
  };

  const handleModalTestConnection = async () => {
    if (!newCh.url || !newCh.url.trim()) {
      toast("Please enter a Webhook Target URL first", "warning");
      return;
    }
    setModalTesting(true);
    setModalTestResult(null);
    try {
      const res = await api.post("/api/v1/webhooks/test", {
        target_url: newCh.url,
        channel_type: newCh.type,
      });
      setModalTestResult({
        status: res.data.status === "SUCCESS" ? "SUCCESS" : "FAILED",
        code: res.data.status_code || 200,
        message: res.data.response_message || "Test payload delivered successfully",
      });
    } catch (err) {
      setModalTestResult({
        status: "FAILED",
        code: err.response?.status || 500,
        message: err.message || "Connection failed. Check target URL syntax and network route.",
      });
    } finally {
      setModalTesting(false);
    }
  };

  const handleAdd = async () => {
    const c = { ...newCh, id: "wh-" + Date.now(), status: "ACTIVE", success_count: 0, failure_count: 0, last_triggered: "Never" };
    try {
      const res = await api.post("/api/v1/notifications", c);
      setChannels(p => [...p, res.data || c]);
      setAddOpen(false);
      setNewCh({...EMPTY});
      setModalTestResult(null);
      toast("Channel registered: " + c.name);
    } catch (err) {
      toast(err?.response?.data?.detail || "Could not register channel", "error");
    }
  };

  const active = channels.filter(c => c.enabled && c.status === "ACTIVE").length;
  const degraded = channels.filter(c => c.status === "DEGRADED").length;
  const totalSent = channels.reduce((s,c) => s + c.success_count, 0);
  const totalFail = channels.reduce((s,c) => s + c.failure_count, 0);

  const statusChip = (s) => {
    if (s === "ACTIVE") return <Chip label="ACTIVE" size="small" sx={{ bgcolor: "#dcfce7", color: "#16a34a", fontWeight: 700, fontSize: "11px" }} />;
    if (s === "DEGRADED") return <Chip label="DEGRADED" size="small" sx={{ bgcolor: "#fff3e0", color: "#d97706", fontWeight: 700, fontSize: "11px" }} />;
    return <Chip label="INACTIVE" size="small" sx={{ bgcolor: "#f1f5f9", color: "#64748b", fontWeight: 700, fontSize: "11px" }} />;
  };

  const delivChip = (s) =>
    s === "DELIVERED"
      ? <Chip icon={<CheckCircleIcon sx={{ fontSize: "13px !important" }} />} label="DELIVERED" size="small" sx={{ bgcolor: "#dcfce7", color: "#16a34a", fontWeight: 700, fontSize: "10px" }} />
      : <Chip icon={<ErrorIcon sx={{ fontSize: "13px !important" }} />} label="FAILED" size="small" sx={{ bgcolor: "#fef2f2", color: "#dc2626", fontWeight: 700, fontSize: "10px" }} />;

  return (
    <Box sx={{ p: 3, maxWidth: "100%", width: "100%" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e293b" }}>Webhook Pipeline Manager</Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
            Configure notification channels, event routing filters and delivery pipelines for Slack, Teams, Email, Splunk HEC, PagerDuty
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData} sx={{ textTransform: "none", fontWeight: 600 }}>Refresh</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)} sx={{ textTransform: "none", fontWeight: 600, bgcolor: "#2563eb" }}>Add Channel</Button>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: "Active Channels", value: active + " Active", color: "#16a34a", icon: <WebhookIcon sx={{ color: "#16a34a" }} /> },
          { label: "Degraded Channels", value: degraded + " Degraded", color: "#d97706", icon: <ErrorIcon sx={{ color: "#d97706" }} /> },
          { label: "Total Deliveries", value: totalSent.toLocaleString(), color: "#2563eb", icon: <CheckCircleIcon sx={{ color: "#2563eb" }} /> },
          { label: "Failed Deliveries", value: totalFail + " Failures", color: "#dc2626", icon: <NotificationsIcon sx={{ color: "#dc2626" }} /> },
        ].map((s) => (
          <Grid item xs={12} sm={6} md={3} key={s.label}>
            <Card sx={{ borderLeft: "4px solid " + s.color }}>
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>{s.label}</Typography>
                  {s.icon}
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: s.color === "#2563eb" ? "#0f172a" : s.color }}>{s.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e,v) => setTab(v)} sx={{ px: 2, borderBottom: "1px solid #e2e8f0" }} textColor="primary" indicatorColor="primary">
          <Tab icon={<WebhookIcon fontSize="small" />} iconPosition="start" label="Webhook Channels" sx={{ textTransform: "none", fontWeight: 600 }} />
          <Tab icon={<HistoryIcon fontSize="small" />} iconPosition="start" label="Delivery Log" sx={{ textTransform: "none", fontWeight: 600 }} />
          <Tab icon={<TuneIcon fontSize="small" />} iconPosition="start" label="Event Routing Rules" sx={{ textTransform: "none", fontWeight: 600 }} />
        </Tabs>

        {tab === 0 && (
          <Box>
            {loading && <LinearProgress />}
            <TableContainer>
              <Table sx={{ minWidth: 700 }}>
                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                  <TableRow>
                    {["Channel and Type","Endpoint URL","Event Filters","Status","Deliveries","Enabled","Actions"].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, color: "#334155" }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {channels.map(ch => {
                    const cfg = TYPE_CFG[ch.type] || TYPE_CFG.GENERIC;
                    return (
                      <TableRow key={ch.id} hover>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar sx={{ width: 36, height: 36, bgcolor: cfg.bg, fontSize: "18px" }}>{cfg.icon}</Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>{ch.name}</Typography>
                              <Chip label={cfg.label} size="small" sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: "10px", mt: 0.3 }} />
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#475569", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                            {ch.url}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                            {ch.event_filters.map(f => (
                              <Chip key={f} label={f} size="small" sx={{ bgcolor: f==="CRITICAL"?"#fef2f2":f==="HIGH"?"#fff3e0":"#f0f9ff", color: f==="CRITICAL"?"#dc2626":f==="HIGH"?"#d97706":"#0369a1", fontWeight: 700, fontSize: "10px" }} />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>{statusChip(ch.status)}</TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ color: "#16a34a", fontWeight: 700, display: "block" }}>success {ch.success_count.toLocaleString()}</Typography>
                          {ch.failure_count > 0 && <Typography variant="caption" sx={{ color: "#dc2626", fontWeight: 700, display: "block" }}>fail {ch.failure_count}</Typography>}
                          <Typography variant="caption" sx={{ color: "#94a3b8", display: "block" }}>Last: {ch.last_triggered}</Typography>
                        </TableCell>
                        <TableCell><Switch checked={ch.enabled} onChange={e => handleToggle(ch.id, e.target.checked)} size="small" color="success" /></TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            <Tooltip title="Send Test Payload">
                              <span>
                                <IconButton size="small" onClick={() => handleTest(ch)} disabled={testingId === ch.id || !ch.enabled} sx={{ color: "#2563eb" }}>
                                  {testingId === ch.id ? <FlashOnIcon fontSize="small" /> : <SendIcon fontSize="small" />}
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip title="Remove Channel">
                              <IconButton size="small" onClick={() => handleDelete(ch.id)} sx={{ color: "#ef4444" }}><DeleteIcon fontSize="small" /></IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {tab === 1 && (
          <Box>
            {loading && <LinearProgress />}
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                  <TableRow>
                    {["ID","Channel","Event Payload","Result","Latency","Time"].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, color: "#334155" }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {log.map(l => (
                    <TableRow key={l.id} hover>
                      <TableCell><Typography variant="caption" sx={{ fontFamily: "monospace", color: "#64748b" }}>{l.id}</Typography></TableCell>
                      <TableCell><Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a" }}>{l.channel}</Typography></TableCell>
                      <TableCell><Typography variant="body2" sx={{ color: "#334155", fontSize: "13px" }}>{l.event}</Typography></TableCell>
                      <TableCell>{delivChip(l.status)}</TableCell>
                      <TableCell>
                        <Chip label={l.latency_ms + "ms"} size="small" sx={{ bgcolor: l.latency_ms > 1000 ? "#fef2f2" : "#f0fdf4", color: l.latency_ms > 1000 ? "#dc2626" : "#16a34a", fontWeight: 700, fontSize: "11px" }} />
                      </TableCell>
                      <TableCell><Typography variant="caption" sx={{ color: "#64748b" }}>{l.timestamp}</Typography></TableCell>
                      <TableCell>
                        <Button size="small" onClick={async () => {
                          try {
                            await api.post(`/api/v1/webhooks/delivery-log/${l.id}/retry`);
                            toast("Delivery retried");
                            fetchData();
                          } catch {
                            toast("Retry failed", "error");
                          }
                        }}>Retry</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {tab === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", mb: 0.5 }}>Event Routing Matrix</Typography>
            <Typography variant="body2" sx={{ color: "#64748b", mb: 3 }}>Define severity-based routing to notification channels.</Typography>
            {ROUTING_RULES.map(r => (
              <Accordion key={r.title} sx={{ mb: 1.5, border: "1px solid " + r.color + "30", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: r.bg }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
                    <Chip label={r.title} size="small" sx={{ bgcolor: r.color, color: "#fff", fontWeight: 700, fontSize: "11px" }} />
                    <Typography variant="body2" sx={{ color: "#475569" }}>
                      Routes to {r.channels.length} channel(s) | Policy: <strong>{r.policy}</strong>
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#334155", mb: 1 }}>Target Channels</Typography>
                      <List dense>
                        {r.channels.map(ch => (
                          <ListItem key={ch} sx={{ py: 0.3, px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 28 }}><CheckCircleIcon sx={{ fontSize: 14, color: "#16a34a" }} /></ListItemIcon>
                            <ListItemText primary={ch} primaryTypographyProps={{ fontSize: "13px", color: "#0f172a" }} />
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#334155", mb: 1 }}>Source Modules</Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.7 }}>
                        {r.sources.map(s => (
                          <Chip key={s} label={s} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: "11px", color: r.color, borderColor: r.color }} />
                        ))}
                      </Box>
                      <Typography variant="body2" sx={{ color: "#64748b", mt: 2 }}><strong>Policy:</strong> {r.policy}</Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </Card>

      {/* Sleek Enterprise Register Webhook Integration Modal */}
      <Dialog
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setModalTestResult(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.35)",
            border: "1px solid #e2e8f0",
            bgcolor: "#ffffff",
          },
        }}
      >
        {/* Modern Enterprise Header */}
        <Box
          sx={{
            py: 2,
            px: 3,
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                bgcolor: "rgba(56, 189, 248, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(56, 189, 248, 0.25)",
              }}
            >
              <WebhookIcon sx={{ color: "#38bdf8", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#ffffff", fontSize: "16px", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
                Register Webhook Integration
              </Typography>
              <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "12px" }}>
                Select integration service target and configure real-time alert routing
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => {
              setAddOpen(false);
              setModalTestResult(null);
            }}
            size="small"
            sx={{
              color: "#94a3b8",
              p: 0.75,
              "&:hover": { color: "#ffffff", bgcolor: "rgba(255,255,255,0.1)" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3, bgcolor: "#ffffff" }}>
          {(() => {
            const currentCfg = TYPE_CFG[newCh.type] || TYPE_CFG.GENERIC;
            return (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {/* 1. Visual Integration Service Selector (Explicit 3-Column Grid) */}
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      color: "#475569",
                      textTransform: "uppercase",
                      fontSize: "11px",
                      letterSpacing: "0.05em",
                      display: "block",
                      mb: 1.2,
                    }}
                  >
                    1. Select Integration Target Service
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 1.2,
                      width: "100%",
                    }}
                  >
                    {Object.entries(TYPE_CFG).map(([k, v]) => {
                      const isSel = newCh.type === k;
                      return (
                        <Box
                          key={k}
                          onClick={() => {
                            setNewCh({ ...newCh, type: k });
                            setModalTestResult(null);
                          }}
                          sx={{
                            p: 1.2,
                            borderRadius: "10px",
                            cursor: "pointer",
                            border: `2px solid ${isSel ? "#2563eb" : "#e2e8f0"}`,
                            bgcolor: isSel ? "#eff6ff" : "#f8fafc",
                            transition: "all 0.2s ease-in-out",
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            minWidth: 0,
                            "&:hover": {
                              borderColor: isSel ? "#2563eb" : "#cbd5e1",
                              bgcolor: isSel ? "#eff6ff" : "#f1f5f9",
                              transform: "translateY(-1px)",
                            },
                          }}
                        >
                          <Typography sx={{ fontSize: "18px", lineHeight: 1 }}>{v.icon}</Typography>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: isSel ? 800 : 600,
                                color: isSel ? "#1e40af" : "#334155",
                                fontSize: "12px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {v.label}
                            </Typography>
                          </Box>
                          {isSel && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                bgcolor: "#2563eb",
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>

                {/* Target Requirement Info Banner */}
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: "8px",
                    bgcolor: currentCfg.bg,
                    borderLeft: `4px solid ${currentCfg.color}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.2,
                  }}
                >
                  <Typography sx={{ fontSize: "20px" }}>{currentCfg.icon}</Typography>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a", fontSize: "13px" }}>
                      {currentCfg.label} Integration Mode
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#475569", display: "block", fontSize: "11px" }}>
                      {currentCfg.infoText}
                    </Typography>
                  </Box>
                </Box>

                {/* 2. Dynamic Channel Configuration Section */}
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 800,
                    color: "#475569",
                    textTransform: "uppercase",
                    fontSize: "11px",
                    letterSpacing: "0.05em",
                    display: "block",
                    mb: -1,
                    mt: 0.5,
                  }}
                >
                  2. Dynamic Channel Configuration
                </Typography>

                {/* Channel Display Name (Dynamic per Target) */}
                <TextField
                  fullWidth
                  size="small"
                  label={currentCfg.nameLabel}
                  required
                  value={newCh.name}
                  onChange={(e) => setNewCh({ ...newCh, name: e.target.value })}
                  placeholder={currentCfg.namePlaceholder}
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                  }}
                />

                {/* Webhook Endpoint URL with Integrated Test Connection Button */}
                <Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label={currentCfg.urlLabel}
                      required
                      value={newCh.url}
                      onChange={(e) => {
                        setNewCh({ ...newCh, url: e.target.value });
                        setModalTestResult(null);
                      }}
                      placeholder={currentCfg.urlPlaceholder}
                      InputProps={{
                        startAdornment: <LinkIcon sx={{ color: "#94a3b8", mr: 1, fontSize: 18 }} />,
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                      }}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleModalTestConnection}
                      disabled={modalTesting || !newCh.url.trim()}
                      sx={{
                        whiteSpace: "nowrap",
                        borderRadius: "8px",
                        textTransform: "none",
                        fontWeight: 700,
                        px: 2,
                        minWidth: "130px",
                        borderColor: "#2563eb",
                        color: "#2563eb",
                        "&:hover": { bgcolor: "#eff6ff", borderColor: "#1d4ed8" },
                      }}
                    >
                      {modalTesting ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                          <LinearProgress sx={{ width: 16, height: 16, borderRadius: "50%" }} />
                          Testing...
                        </Box>
                      ) : (
                        "🧪 Test Route"
                      )}
                    </Button>
                  </Box>

                  {/* Real-Time Connection Test Result Feedback Alert */}
                  {modalTestResult && (
                    <Box
                      sx={{
                        mt: 1.2,
                        p: 1.2,
                        borderRadius: "8px",
                        bgcolor: modalTestResult.status === "SUCCESS" ? "#f0fdf4" : "#fef2f2",
                        border: `1px solid ${modalTestResult.status === "SUCCESS" ? "#bbf7d0" : "#fecaca"}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.2,
                      }}
                    >
                      {modalTestResult.status === "SUCCESS" ? (
                        <CheckCircleIcon sx={{ color: "#16a34a", fontSize: 18 }} />
                      ) : (
                        <ErrorIcon sx={{ color: "#dc2626", fontSize: 18 }} />
                      )}
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: modalTestResult.status === "SUCCESS" ? "#15803d" : "#991b1b",
                            fontSize: "12px",
                          }}
                        >
                          {modalTestResult.status === "SUCCESS"
                            ? `Connection Verified (Status ${modalTestResult.code} OK)`
                            : `Connection Failed (Status ${modalTestResult.code})`}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: modalTestResult.status === "SUCCESS" ? "#166534" : "#b91c1c",
                            display: "block",
                            fontSize: "11px",
                          }}
                        >
                          {modalTestResult.message}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* Event Severity Subscriptions */}
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#334155", mb: 0.8, fontSize: "13px" }}>
                    Subscribed Alert Severity Levels:
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {SEVERITY_OPTS.map((sev) => {
                      const isSel = newCh.event_filters.includes(sev);
                      const colorMap = {
                        CRITICAL: { bg: "#dc2626", border: "#dc2626" },
                        HIGH:     { bg: "#ea580c", border: "#ea580c" },
                        MEDIUM:   { bg: "#0284c7", border: "#0284c7" },
                        LOW:      { bg: "#64748b", border: "#64748b" },
                        INFO:     { bg: "#059669", border: "#059669" },
                      };
                      const col = colorMap[sev] || { bg: "#2563eb", border: "#2563eb" };
                      return (
                        <Chip
                          key={sev}
                          label={sev}
                          clickable
                          size="small"
                          onClick={() => {
                            const updated = isSel
                              ? newCh.event_filters.filter((f) => f !== sev)
                              : [...newCh.event_filters, sev];
                            setNewCh({ ...newCh, event_filters: updated });
                          }}
                          sx={{
                            fontWeight: 700,
                            fontSize: "11px",
                            height: "28px",
                            px: 1,
                            bgcolor: isSel ? col.bg : "#f8fafc",
                            color: isSel ? "#ffffff" : "#475569",
                            border: `1.5px solid ${isSel ? col.border : "#cbd5e1"}`,
                            transition: "all 0.15s ease",
                            "&:hover": {
                              bgcolor: isSel ? col.bg : "#f1f5f9",
                            },
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>

                {/* Authorization Header / Secret Token (Dynamic per Target) */}
                <TextField
                  fullWidth
                  size="small"
                  label={currentCfg.authLabel}
                  value={newCh.auth_header}
                  onChange={(e) => setNewCh({ ...newCh, auth_header: e.target.value })}
                  placeholder={currentCfg.authPlaceholder}
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                  }}
                />

                {/* Description */}
                <TextField
                  fullWidth
                  size="small"
                  label="Description / Routing Notes (Optional)"
                  multiline
                  rows={2}
                  value={newCh.description}
                  onChange={(e) => setNewCh({ ...newCh, description: e.target.value })}
                  placeholder="Specify team owner, on-call shift rotation, or custom payload notes..."
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                  }}
                />

                {/* Enable Immediately Switch Block */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 1.8,
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    bgcolor: "#f8fafc",
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                      Enable Channel Immediately
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>
                      Start routing live matching alerts right after channel registration
                    </Typography>
                  </Box>
                  <Switch
                    checked={newCh.enabled}
                    onChange={(e) => setNewCh({ ...newCh, enabled: e.target.checked })}
                    color="primary"
                  />
                </Box>
              </Box>
            );
          })()}
        </DialogContent>

        {/* Footer Actions */}
        <DialogActions
          sx={{
            py: 2,
            px: 3,
            bgcolor: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            justifyContent: "space-between",
          }}
        >
          <Button
            onClick={() => {
              setAddOpen(false);
              setModalTestResult(null);
            }}
            size="medium"
            sx={{
              textTransform: "none",
              color: "#64748b",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            size="medium"
            onClick={handleAdd}
            disabled={!newCh.name.trim() || !newCh.url.trim()}
            startIcon={<AddIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "8px",
              fontSize: "14px",
              py: 0.9,
              px: 2.5,
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
              "&:hover": {
                background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
              },
            }}
          >
            Register Webhook Channel
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack({...snack, open: false})}>
        <Alert severity={snack.severity} sx={{ width: "100%" }}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Notifications;
