import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Switch,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import QueueIcon from "@mui/icons-material/Queue";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import ScheduleIcon from "@mui/icons-material/Schedule";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";
import api from "../../utils/api";
import PageShell, { PageSection, EmptyState } from "../../components/common/PageShell";
import dashboardTheme from "../../theme/dashboardTheme";

const PRESETS = [
  { id: "quick", label: "Quick", time: "5–15s", desc: "Top 40 TCP ports, aggressive timing, no risk findings." },
  { id: "standard", label: "Standard", time: "15–45s", desc: "Top 100 ports with HTTP/TLS, OS fingerprint, and risk findings." },
  { id: "deep", label: "Deep", time: "1–3m", desc: "Top 1000 ports, advanced OS fingerprint, HTTP/TLS, and exposure findings." },
  { id: "stealth", label: "Stealth", time: "1–3m", desc: "Slow T1 timing with OS fingerprint against the top 100 ports." },
  { id: "udp", label: "UDP", time: "30–90s", desc: "UDP probes for DNS, DHCP, NTP, SNMP, syslog, and mDNS." },
  { id: "full", label: "Full", time: "2–5m", desc: "Enterprise TCP set plus UDP, OS inference, and findings." },
];

const PORT_RANGES = [
  { value: "top40", label: "Top 40 critical ports" },
  { value: "top100", label: "Top 100 service ports" },
  { value: "top1000", label: "Enterprise common ports" },
  { value: "1-1024", label: "Well-known ports (1–1024)" },
  { value: "1-65535", label: "Expanded full set" },
  { value: "custom", label: "Custom ports" },
];

const TIMING = [
  { value: "T1", label: "T1 — Sneaky", use: "Low-rate probes for sensitive networks" },
  { value: "T2", label: "T2 — Polite", use: "Reduced impact on production hosts" },
  { value: "T3", label: "T3 — Normal", use: "Balanced accuracy and speed" },
  { value: "T4", label: "T4 — Aggressive", use: "Fast reconnaissance of well-connected hosts" },
];

const CRON_PRESETS = [
  { value: "0 2 * * *", label: "Daily at 02:00 UTC" },
  { value: "0 0 * * 0", label: "Weekly on Sunday" },
  { value: "0 */6 * * *", label: "Every 6 hours" },
  { value: "*/30 * * * *", label: "Every 30 minutes" },
];

const GRADE_COLOR = { A: "success", B: "info", C: "warning", D: "warning", F: "error" };
const STATUS_COLOR = { COMPLETED: "success", RUNNING: "info", FAILED: "error", CANCELLED: "default", PENDING: "warning" };

const presetDefaults = {
  quick: { timing: "T4", portRange: "top40", enableNse: false, enableOsDetect: false, enableUdp: false, enableHttpTls: true },
  standard: { timing: "T3", portRange: "top100", enableNse: true, enableOsDetect: true, enableUdp: false, enableHttpTls: true },
  deep: { timing: "T3", portRange: "top1000", enableNse: true, enableOsDetect: true, enableUdp: false, enableHttpTls: true },
  stealth: { timing: "T1", portRange: "top100", enableNse: true, enableOsDetect: true, enableUdp: false, enableHttpTls: true },
  udp: { timing: "T3", portRange: "udp", enableNse: false, enableOsDetect: false, enableUdp: true, enableHttpTls: false },
  full: { timing: "T3", portRange: "top1000", enableNse: true, enableOsDetect: true, enableUdp: true, enableHttpTls: true },
};

const emptyOptions = {
  preset: "standard",
  timing: "T3",
  portRange: "top100",
  customPorts: "",
  enableNse: true,
  enableOsDetect: true,
  enableUdp: false,
  enableHttpTls: true,
  enableShodan: false,
  enableVirusTotal: false,
  useHostDiscovery: false,
};

const cardSx = (selected) => ({
  p: 1.5,
  height: "100%",
  borderRadius: 2,
  cursor: "pointer",
  border: selected ? "1.5px solid #3f51b5" : "1px solid rgba(63,81,181,0.12)",
  background: selected ? "rgba(63,81,181,0.06)" : "#fff",
  transition: "all 0.2s ease",
  "&:hover": { borderColor: "#3f51b5", boxShadow: "0 6px 18px rgba(63,81,181,0.08)" },
});

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

const buildPlanPreview = (options, target = "<target>", useNmap = true) => {
  const ports = options.portRange === "custom" ? options.customPorts || "custom" : options.portRange;
  if (!useNmap) {
    return [
      "tcp-probe",
      `--preset ${options.preset}`,
      `--timing ${options.timing}`,
      `--ports ${ports}`,
      options.enableUdp ? "--udp" : "",
      options.enableHttpTls ? "--http-tls" : "",
      options.enableOsDetect ? "--os-fingerprint" : "",
      options.enableNse ? "--risk-findings" : "",
      target,
    ].filter(Boolean).join(" ");
  }
  const scanType = options.preset === "udp" ? "-sU" : "-sS/-sT";
  const parts = ["nmap", `-${options.timing}`, scanType, "-sV"];
  if (options.preset === "quick") parts.push("--version-intensity 3");
  else if (options.preset === "deep") parts.push("--version-intensity 5");
  else parts.push("--version-intensity 5");
  if (ports === "top1000") parts.push("--top-ports 1000");
  else if (ports === "top40" || ports === "top100") parts.push(`-p ${ports}`);
  else if (ports === "1-65535" || options.preset === "full") parts.push("-p 1-65535");
  else parts.push(`-p ${ports}`);
  if (options.enableOsDetect && options.preset !== "quick") parts.push("-O --osscan-guess");
  if (options.enableNse && options.preset === "deep") parts.push("--script=default,vuln");
  else if (options.enableNse && options.preset === "stealth") parts.push("--script=auth");
  else if (options.enableNse && options.preset === "full") parts.push("--script=default,vuln");
  else if (options.enableNse && options.preset !== "quick") parts.push("--script=default");
  if (options.enableUdp && options.preset !== "udp") parts.push("-sU --top-ports 20");
  parts.push("--open", target);
  return parts.join(" ");
};

const StatCard = ({ label, value, accent }) => (
  <Box sx={{ p: 2, borderRadius: 2, border: "1px solid rgba(63,81,181,0.08)", background: "#fff", position: "relative", overflow: "hidden" }}>
    {accent && <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, bgcolor: accent }} />}
    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }}>{label}</Typography>
    <Typography variant="h4" sx={{ fontWeight: 600, mt: 0.5, color: dashboardTheme.colors.text.primary }}>{value ?? 0}</Typography>
  </Box>
);

const IpScanner = () => {
  const [tab, setTab] = useState(0);
  const [target, setTarget] = useState("");
  const [label, setLabel] = useState("");
  const [cidr, setCidr] = useState("");
  const [cidrLabel, setCidrLabel] = useState("");
  const [options, setOptions] = useState(emptyOptions);
  const [scans, setScans] = useState([]);
  const [total, setTotal] = useState(0);
  const [schedules, setSchedules] = useState([]);
  const [stats, setStats] = useState(null);
  const [capabilities, setCapabilities] = useState(null);
  const [ready, setReady] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("info");
  const [activeScans, setActiveScans] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [report, setReport] = useState(null);
  const [reportTab, setReportTab] = useState(0);
  const [cidrOpen, setCidrOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ name: "", target: "", cron: "0 2 * * *" });
  const [diffIds, setDiffIds] = useState({ current: "", previous: "" });
  const [diff, setDiff] = useState(null);
  const [deleteIds, setDeleteIds] = useState([]);

  const notify = (text, level = "info") => {
    setMessage(text);
    setSeverity(level);
  };

  const scanPayload = (overrideTarget) => ({
    target: (overrideTarget ?? target).trim(),
    label: label.trim() || undefined,
    preset: options.preset,
    portRange: options.portRange === "custom" ? options.customPorts : options.portRange,
    timing: options.timing,
    enableUdp: options.enableUdp || options.preset === "udp",
    enableOsDetect: options.enableOsDetect,
    enableNse: options.enableNse,
    enableShodan: options.enableShodan,
    enableVirusTotal: options.enableVirusTotal,
    useHostDiscovery: options.useHostDiscovery,
    enableHttpTls: options.enableHttpTls,
  });

  const load = useCallback(async () => {
    try {
      const [scanRes, scheduleRes, capRes, readyRes, statsRes] = await Promise.all([
        api.get("/api/v1/ip-scanner/scans", { params: { search, page: page + 1, limit: rowsPerPage } }),
        api.get("/api/v1/ip-scanner/schedules"),
        api.get("/api/v1/ip-scanner/capabilities"),
        api.get("/api/v1/ip-scanner/readiness"),
        api.get("/api/v1/ip-scanner/stats"),
      ]);
      const payload = scanRes.data;
      const rows = Array.isArray(payload) ? payload : payload?.scans || [];
      setScans(rows);
      setTotal(Array.isArray(payload) ? payload.length : payload?.total || rows.length);
      setSchedules(Array.isArray(scheduleRes.data) ? scheduleRes.data : []);
      setCapabilities(capRes.data);
      setReady(readyRes.data);
      setStats(statsRes.data);
      setActiveScans((prev) => {
        const running = rows.filter((row) => row.status === "RUNNING" || row.status === "PENDING");
        const merged = [...prev];
        running.forEach((row) => {
          if (!merged.some((item) => item.id === row.id)) {
            merged.push({ id: row.id, target: row.target, preset: row.scanOptions?.preset || options.preset, status: row.status, startedAt: Date.now() });
          }
        });
        return merged.map((item) => {
          const latest = rows.find((row) => row.id === item.id);
          return latest && latest.status !== item.status ? { ...item, status: latest.status } : item;
        });
      });
    } catch {
      setScans([]);
      setSchedules([]);
    }
  }, [search, page, rowsPerPage, options.preset]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!activeScans.some((item) => item.status === "RUNNING" || item.status === "PENDING")) return undefined;
    const timer = setInterval(load, 2500);
    return () => clearInterval(timer);
  }, [activeScans, load]);

  const applyPreset = (preset) => {
    setOptions((prev) => ({ ...prev, preset, ...presetDefaults[preset] }));
  };

  const runScan = async (asyncMode = true) => {
    if (!target.trim()) return notify("Enter a hostname or public IP.", "warning");
    if (options.portRange === "custom" && !options.customPorts.trim()) return notify("Enter a custom port list.", "warning");
    setBusy(true);
    try {
      const path = asyncMode ? "/api/v1/ip-scanner/scan/async" : "/api/v1/ip-scanner/scan";
      const res = await api.post(path, scanPayload());
      const scanId = res.data.id || res.data.scanId;
      notify(asyncMode ? `Queued ${options.preset} scan for ${target}` : `Completed scan of ${target}`, "success");
      if (scanId) {
        setActiveScans((prev) => [{ id: scanId, target: target.trim(), preset: options.preset, status: res.data.status || "RUNNING", startedAt: Date.now() }, ...prev.filter((item) => item.id !== scanId)]);
      }
      setTarget("");
      setLabel("");
      await load();
    } catch (err) {
      notify(err.response?.data?.detail || "Scan failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const runCidr = async () => {
    if (!cidr.trim()) return notify("Enter a CIDR range.", "warning");
    setBusy(true);
    try {
      const res = await api.post("/api/v1/ip-scanner/scan/range", { ...scanPayload(cidr.trim()), cidr: cidr.trim(), label: cidrLabel.trim() || undefined });
      notify(`Scanned ${res.data.hosts_scanned || 0} hosts in ${cidr}`, "success");
      setCidrOpen(false);
      setCidr("");
      setCidrLabel("");
      await load();
    } catch (err) {
      notify(err.response?.data?.detail || "CIDR scan failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const createSchedule = async () => {
    if (!scheduleForm.target.trim() || !scheduleForm.name.trim()) return notify("Schedule name and target are required.", "warning");
    try {
      await api.post("/api/v1/ip-scanner/schedules", {
        name: scheduleForm.name.trim(),
        target: scheduleForm.target.trim(),
        cron: scheduleForm.cron,
        cronExpression: scheduleForm.cron,
        scanOptions: scanPayload(scheduleForm.target.trim()),
      });
      notify(`Scheduled ${scheduleForm.target}`, "success");
      setScheduleForm({ name: "", target: "", cron: "0 2 * * *" });
      load();
    } catch (err) {
      notify(err.response?.data?.detail || "Schedule failed", "error");
    }
  };

  const toggleSchedule = async (row) => {
    await api.patch(`/api/v1/ip-scanner/schedules/${row.id}`, { isActive: !(row.enabled ?? row.isActive) });
    load();
  };

  const compare = async () => {
    if (!diffIds.current || !diffIds.previous) return notify("Select two scans to compare.", "warning");
    try {
      const res = await api.get(`/api/v1/ip-scanner/${diffIds.current}/diff/${diffIds.previous}`);
      setDiff(res.data);
    } catch (err) {
      notify(err.response?.data?.detail || "Diff failed", "error");
    }
  };

  const openReport = async (scanId, fmt = "json") => {
    try {
      const res = await api.get(`/api/v1/ip-scanner/${scanId}/report`, { params: { fmt } });
      if (fmt === "csv") {
        const blob = new Blob([res.data.content || ""], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `ip-scan-${scanId}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        return;
      }
      setReportTab(0);
      setReport(res.data);
    } catch (err) {
      notify(err.response?.data?.detail || "Report download failed", "error");
    }
  };

  const cancelScan = async (scanId) => {
    try {
      await api.post(`/api/v1/ip-scanner/scans/${scanId}/cancel`);
      setActiveScans((prev) => prev.map((item) => (item.id === scanId ? { ...item, status: "CANCELLED" } : item)));
      load();
    } catch (err) {
      notify(err.response?.data?.detail || "Cancel failed", "error");
    }
  };

  const confirmDelete = async () => {
    try {
      if (deleteIds.length === 1) {
        await api.delete(`/api/v1/ip-scanner/scans/${deleteIds[0]}`);
      } else {
        await api.post("/api/v1/ip-scanner/scans/bulk-delete", { ids: deleteIds });
      }
      setSelectedIds((prev) => prev.filter((id) => !deleteIds.includes(id)));
      setDeleteIds([]);
      notify("Scan records removed.", "success");
      load();
    } catch (err) {
      notify(err.response?.data?.detail || "Delete failed", "error");
    }
  };

  const visibleIds = scans.map((row) => row.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const planPreview = useMemo(() => buildPlanPreview(options, target.trim() || "<target>", capabilities?.nmap !== false), [options, target, capabilities]);
  const selectedPreset = PRESETS.find((item) => item.id === options.preset);

  return (
    <PageShell
      title="IP Scanner"
      subtitle="TCP connect, HTTP/TLS, and UDP probes for authorized public hosts. RFC1918 stays blocked unless ALLOW_INTERNAL_SCAN is enabled. Nmap is not used."
      actions={(
        <>
          <Button variant="outlined" startIcon={<TravelExploreIcon />} onClick={() => setCidrOpen(true)}>CIDR sweep</Button>
          <Button variant={tab === 1 ? "contained" : "outlined"} startIcon={<ScheduleIcon />} onClick={() => setTab(1)}>Schedules</Button>
          <Button variant={tab === 2 ? "contained" : "outlined"} startIcon={<CompareArrowsIcon />} onClick={() => setTab(2)}>Port diff</Button>
          <IconButton onClick={load}><RefreshIcon /></IconButton>
        </>
      )}
    >
      <PageSection>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          <Chip size="small" color={ready?.ready ? "success" : "default"} label={ready?.ready ? "Service ready" : "Checking readiness"} />
          <Chip size="small" color={capabilities?.nmap ? "success" : "default"} label={`Engine: ${capabilities?.engine || "nmap"}`} />
          <Chip size="small" label={`nmap: ${capabilities?.nmap ? (capabilities?.nmap_privileged ? "privileged SYN/OS" : "connect scan") : "fallback probe"}`} />
          <Chip size="small" label={`HTTP/TLS: ${capabilities?.http_tls ? "on" : "off"}`} />
          <Chip size="small" label={`UDP: ${capabilities?.udp_probe ? "on" : "off"}`} />
          <Chip size="small" label={`Shodan: ${capabilities?.shodan ? "key configured" : "not configured"}`} />
          <Chip size="small" label={`VirusTotal: ${capabilities?.virustotal ? "key configured" : "not configured"}`} />
          <Chip size="small" color={capabilities?.allow_internal_scan ? "warning" : "default"} label={capabilities?.allow_internal_scan ? "Internal scans allowed" : "RFC1918 blocked"} />
        </Stack>

        <Alert severity={capabilities?.allow_internal_scan ? "warning" : "info"} icon={<ShieldOutlinedIcon />} sx={{ mb: 2.5 }}>
          Scans run through nmap when the binary is installed: service version (-sV), OS detect (-O), and NSE scripts matching the selected preset. If nmap is unavailable the service falls back to TCP/HTTP probes. RFC1918 targets stay blocked unless ALLOW_INTERNAL_SCAN is enabled. Scan only hosts you are authorized to assess.
        </Alert>

        {message && <Alert severity={severity} sx={{ mb: 2 }} onClose={() => setMessage("")}>{message}</Alert>}

        <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase", color: "text.secondary", mb: 1.5 }}>Scan presets</Typography>
        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          {PRESETS.map((preset) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={preset.id}>
              <Box sx={cardSx(options.preset === preset.id)} onClick={() => applyPreset(preset.id)}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: options.preset === preset.id ? "#3f51b5" : "text.primary" }}>{preset.label}</Typography>
                  <Chip size="small" label={preset.time} sx={{ height: 20, fontSize: 10, bgcolor: options.preset === preset.id ? "rgba(63,81,181,0.1)" : "rgba(0,0,0,0.04)" }} />
                </Stack>
                <Typography variant="caption" color="text.secondary">{preset.desc}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Timing</InputLabel>
              <Select label="Timing" value={options.timing} onChange={(e) => setOptions((prev) => ({ ...prev, timing: e.target.value }))}>
                {TIMING.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary">{TIMING.find((item) => item.value === options.timing)?.use}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Port range</InputLabel>
              <Select label="Port range" value={options.portRange === "udp" ? "top100" : PORT_RANGES.some((item) => item.value === options.portRange) ? options.portRange : "custom"} onChange={(e) => setOptions((prev) => ({ ...prev, portRange: e.target.value }))}>
                {PORT_RANGES.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
              </Select>
            </FormControl>
            {options.portRange === "custom" && (
              <TextField size="small" fullWidth sx={{ mt: 1 }} placeholder="22,80,443,8000-8090" value={options.customPorts} onChange={(e) => setOptions((prev) => ({ ...prev, customPorts: e.target.value }))} />
            )}
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>Active preset</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedPreset?.label} · {selectedPreset?.time}</Typography>
            <Typography variant="caption" color="text.secondary">{selectedPreset?.desc}</Typography>
          </Grid>
        </Grid>

        <Grid container spacing={1} sx={{ mb: 2 }}>
          {[
            ["enableHttpTls", "HTTP / TLS inspection"],
            ["enableOsDetect", "Advanced OS fingerprint"],
            ["enableNse", "Exposure findings"],
            ["enableUdp", "UDP service probes"],
            ["useHostDiscovery", "Host discovery first"],
            ["enableShodan", "Shodan intel"],
            ["enableVirusTotal", "VirusTotal reputation"],
          ].map(([key, caption]) => (
            <Grid item xs={12} sm={6} md={3} key={key}>
              <FormControlLabel
                control={<Switch size="small" checked={Boolean(options[key])} onChange={(e) => setOptions((prev) => ({ ...prev, [key]: e.target.checked }))} />}
                label={<Typography variant="body2" sx={{ fontWeight: 600 }}>{caption}</Typography>}
              />
            </Grid>
          ))}
        </Grid>

        <Box sx={{ p: 1.5, mb: 2, borderRadius: 2, bgcolor: "rgba(63,81,181,0.04)", border: "1px solid rgba(63,81,181,0.08)" }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", display: "block", mb: 0.5 }}>Effective nmap command</Typography>
          <Typography variant="body2" sx={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", color: "#3f51b5", wordBreak: "break-all" }}>{planPreview}</Typography>
        </Box>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <TextField
            fullWidth
            size="small"
            label="Hostname or public IP"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="scanme.nmap.org"
          />
          <TextField size="small" label="Label (optional)" value={label} onChange={(e) => setLabel(e.target.value)} sx={{ minWidth: 200 }} />
          <Button variant="contained" startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <QueueIcon />} disabled={busy} onClick={() => runScan(true)}>Queue scan</Button>
          <Button variant="outlined" startIcon={<PlayArrowIcon />} disabled={busy} onClick={() => runScan(false)}>Run now</Button>
        </Stack>
      </PageSection>

      {activeScans.filter((item) => item.status === "RUNNING" || item.status === "PENDING").length > 0 && (
        <PageSection>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Active scans</Typography>
          <Grid container spacing={1.5}>
            {activeScans.filter((item) => item.status === "RUNNING" || item.status === "PENDING").map((item) => (
              <Grid item xs={12} md={6} key={item.id}>
                <Box sx={{ p: 2, borderRadius: 2, border: "1px solid rgba(63,81,181,0.12)" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontFamily: "monospace" }}>{item.target}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.preset} · {item.id.slice(0, 8)}</Typography>
                    </Box>
                    <Button size="small" color="error" startIcon={<StopCircleOutlinedIcon />} onClick={() => cancelScan(item.id)}>Cancel</Button>
                  </Stack>
                  <LinearProgress />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>Resolving host, probing selected ports, then inspecting banners.</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </PageSection>
      )}

      <Grid container spacing={2} sx={{ mb: 0.5 }}>
        <Grid item xs={6} md={3}><StatCard label="Scans executed" value={stats?.totalScans} /></Grid>
        <Grid item xs={6} md={3}><StatCard label="Completed targets" value={stats?.completedScans} /></Grid>
        <Grid item xs={6} md={3}><StatCard label="Open ports" value={stats?.totalOpenPorts} /></Grid>
        <Grid item xs={6} md={3}><StatCard label="High-risk hosts" value={stats?.highRiskScans} accent="#d32f2f" /></Grid>
      </Grid>

      <PageSection>
        <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
          <Tab label="Scan history" />
          <Tab label="Schedules" />
          <Tab label="Port diff" />
        </Tabs>

        {tab === 0 && (
          <>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between" sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>History</Typography>
                {selectedIds.length > 0 && (
                  <Button size="small" color="error" startIcon={<DeleteOutlineIcon />} onClick={() => setDeleteIds(selectedIds)}>
                    Delete selected ({selectedIds.length})
                  </Button>
                )}
              </Stack>
              <TextField
                size="small"
                placeholder="Search by host or label"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                sx={{ minWidth: 280 }}
              />
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox checked={allSelected} onChange={() => setSelectedIds(allSelected ? selectedIds.filter((id) => !visibleIds.includes(id)) : [...new Set([...selectedIds, ...visibleIds])])} />
                    </TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell>Profile</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Ports</TableCell>
                    <TableCell>Posture</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <EmptyState title="No scans yet" message="Queue a public host, CIDR sweep, or schedule. Internal RFC1918 targets stay blocked by default." />
                      </TableCell>
                    </TableRow>
                  ) : scans.map((scan) => (
                    <TableRow key={scan.id} hover selected={selectedIds.includes(scan.id)}>
                      <TableCell padding="checkbox">
                        <Checkbox checked={selectedIds.includes(scan.id)} onChange={() => setSelectedIds((prev) => prev.includes(scan.id) ? prev.filter((id) => id !== scan.id) : [...prev, scan.id])} />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontFamily: "monospace", fontWeight: 700 }}>{scan.target}</Typography>
                        {scan.label && <Typography variant="caption" color="text.secondary">{scan.label}</Typography>}
                      </TableCell>
                      <TableCell sx={{ textTransform: "capitalize" }}>{scan.scanOptions?.preset || scan.scan_options?.preset || "standard"}</TableCell>
                      <TableCell><Chip size="small" color={STATUS_COLOR[scan.status] || "default"} label={scan.status} /></TableCell>
                      <TableCell sx={{ fontFamily: "monospace" }}>{scan.openPortCount ?? (scan.open_ports || []).length}</TableCell>
                      <TableCell>
                        <Chip size="small" color={GRADE_COLOR[scan.riskGrade || scan.risk_grade] || "default"} label={scan.riskGrade || scan.risk_grade || "—"} />
                      </TableCell>
                      <TableCell>{formatDate(scan.createdAt || scan.created_at)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="View report"><IconButton size="small" onClick={() => openReport(scan.id, "json")}><VisibilityOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Export CSV"><IconButton size="small" onClick={() => openReport(scan.id, "csv")}><DownloadOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Use in diff">
                          <IconButton size="small" onClick={() => setDiffIds((prev) => ({ current: scan.id, previous: prev.current || prev.previous || scan.id }))}>
                            <CompareArrowsIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setDeleteIds([scan.id])}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, next) => setPage(next)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[10, 20, 50]}
            />
          </>
        )}

        {tab === 1 && (
          <>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid item xs={12} md={4}><TextField size="small" fullWidth label="Schedule name" value={scheduleForm.name} onChange={(e) => setScheduleForm((prev) => ({ ...prev, name: e.target.value }))} /></Grid>
              <Grid item xs={12} md={3}><TextField size="small" fullWidth label="Target or CIDR" value={scheduleForm.target} onChange={(e) => setScheduleForm((prev) => ({ ...prev, target: e.target.value }))} /></Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Interval</InputLabel>
                  <Select label="Interval" value={scheduleForm.cron} onChange={(e) => setScheduleForm((prev) => ({ ...prev, cron: e.target.value }))}>
                    {CRON_PRESETS.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}><Button fullWidth variant="contained" onClick={createSchedule}>Create</Button></Grid>
            </Grid>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell>Cron</TableCell>
                    <TableCell>Active</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schedules.length === 0 ? (
                    <TableRow><TableCell colSpan={5}><EmptyState message="No recurring scans configured." /></TableCell></TableRow>
                  ) : schedules.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.name || "Untitled"}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace" }}>{row.target}</TableCell>
                      <TableCell>{row.cron || row.cronExpression}</TableCell>
                      <TableCell><Switch checked={Boolean(row.enabled ?? row.isActive)} onChange={() => toggleSchedule(row)} /></TableCell>
                      <TableCell align="right">
                        <Button size="small" color="error" onClick={async () => { await api.delete(`/api/v1/ip-scanner/schedules/${row.id}`); load(); }}>Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {tab === 2 && (
          <>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Current scan</InputLabel>
                <Select label="Current scan" value={diffIds.current} onChange={(e) => setDiffIds((prev) => ({ ...prev, current: e.target.value }))}>
                  {scans.map((scan) => <MenuItem key={scan.id} value={scan.id}>{scan.target} · {scan.id.slice(0, 8)}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Previous scan</InputLabel>
                <Select label="Previous scan" value={diffIds.previous} onChange={(e) => setDiffIds((prev) => ({ ...prev, previous: e.target.value }))}>
                  {scans.map((scan) => <MenuItem key={`prev-${scan.id}`} value={scan.id}>{scan.target} · {scan.id.slice(0, 8)}</MenuItem>)}
                </Select>
              </FormControl>
              <Button variant="contained" onClick={compare}>Compare</Button>
            </Stack>
            {diff && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(76,175,80,0.08)", border: "1px solid rgba(76,175,80,0.2)" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Opened ({(diff.opened || diff.added || []).length})</Typography>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      {(diff.opened || diff.added || []).length === 0 ? <Typography variant="body2" color="text.secondary">None</Typography> : (diff.opened || diff.added).map((port) => <Chip key={`o-${port}`} size="small" color="success" label={port} />)}
                    </Stack>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(244,67,54,0.06)", border: "1px solid rgba(244,67,54,0.18)" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Closed ({(diff.closed || diff.removed || []).length})</Typography>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      {(diff.closed || diff.removed || []).length === 0 ? <Typography variant="body2" color="text.secondary">None</Typography> : (diff.closed || diff.removed).map((port) => <Chip key={`c-${port}`} size="small" color="error" label={port} />)}
                    </Stack>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, borderRadius: 2, border: "1px solid rgba(63,81,181,0.12)" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Unchanged ({(diff.unchanged || []).length})</Typography>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      {(diff.unchanged || []).length === 0 ? <Typography variant="body2" color="text.secondary">None</Typography> : (diff.unchanged || []).map((port) => <Chip key={`u-${port}`} size="small" label={port} />)}
                    </Stack>
                  </Box>
                </Grid>
              </Grid>
            )}
          </>
        )}
      </PageSection>

      <Dialog open={cidrOpen} onClose={() => setCidrOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>CIDR subnet sweep</DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Sweeps up to {capabilities?.max_cidr_hosts || 16} hosts from the CIDR. Private ranges stay blocked unless internal scanning is enabled. The current preset and options are applied to each host.
          </Alert>
          <TextField fullWidth sx={{ mb: 2 }} label="CIDR" placeholder="203.0.113.0/28" value={cidr} onChange={(e) => setCidr(e.target.value)} />
          <TextField fullWidth label="Label (optional)" value={cidrLabel} onChange={(e) => setCidrLabel(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCidrOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={busy} onClick={runCidr}>{busy ? <CircularProgress size={18} /> : "Start sweep"}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteIds.length > 0} onClose={() => setDeleteIds([])} maxWidth="xs" fullWidth>
        <DialogTitle>Delete scan records</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Remove {deleteIds.length} scan record{deleteIds.length === 1 ? "" : "s"} from history? This does not change the remote host.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteIds([])}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(report)} onClose={() => setReport(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>{report?.target}</Typography>
              <Typography variant="caption" color="text.secondary">{report?.id} · {report?.summary}</Typography>
            </Box>
            <Chip size="small" color={GRADE_COLOR[report?.riskGrade || report?.risk_grade] || "default"} label={`Posture ${report?.riskGrade || report?.risk_grade || "—"}`} />
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Tabs value={reportTab} onChange={(_, value) => setReportTab(value)} sx={{ mb: 2 }}>
            <Tab label="Overview" />
            <Tab label="Ports" />
            <Tab label="HTTP / TLS" />
            <Tab label="Findings" />
            <Tab label="Intel" />
            <Tab label="DNS" />
            <Tab label="Evidence" />
          </Tabs>
          {reportTab === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}><Typography variant="body2"><strong>Resolved IP:</strong> {report?.result?.resolved_ip || "—"}</Typography></Grid>
              <Grid item xs={12} md={6}><Typography variant="body2"><strong>Duration:</strong> {report?.duration_ms ? `${report.duration_ms} ms` : "—"}</Typography></Grid>
              <Grid item xs={12} md={6}><Typography variant="body2"><strong>Preset:</strong> {report?.scanOptions?.preset || report?.scan_options?.preset || "standard"}</Typography></Grid>
              <Grid item xs={12}>
                <Box sx={{ p: 1.5, borderRadius: 2, border: "1px solid rgba(63,81,181,0.12)", bgcolor: "rgba(63,81,181,0.04)" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>OS fingerprint</Typography>
                  {report?.os ? (
                    <>
                      <Typography variant="body2"><strong>{report.os.family}</strong>{report.os.product ? ` · ${report.os.product}` : ""} · {report.os.confidence} confidence{report.os.accuracy ? ` (${report.os.accuracy}%)` : ""} · {report.os.method || report.result?.engine || "nmap"}</Typography>
                      {report.os.ttl != null && <Typography variant="caption" color="text.secondary" display="block">TTL {report.os.ttl}</Typography>}
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>{report.os.basis}</Typography>
                      {(report.os.matches || []).length > 0 && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                          nmap matches: {(report.os.matches || []).map((item) => `${item.name} ${item.accuracy}%`).join(" · ")}
                        </Typography>
                      )}
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                        {(report.os.signals || []).map((signal, index) => (
                          <Chip key={`${signal.source}-${index}`} size="small" label={`${signal.source}: ${signal.value}`} />
                        ))}
                      </Stack>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">Not requested. Turn on Advanced OS fingerprint and run Deep, Full, or Standard.</Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12}><Divider sx={{ my: 1 }} /><Typography variant="caption" sx={{ fontFamily: "monospace" }}>{report?.scanOptions?.command || report?.scan_options?.command}</Typography></Grid>
            </Grid>
          )}
          {reportTab === 1 && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Port</TableCell>
                  <TableCell>Proto</TableCell>
                  <TableCell>State</TableCell>
                    <TableCell>Service</TableCell>
                  <TableCell>Product / version</TableCell>
                  <TableCell>Banner</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...(report?.open_ports || []), ...(report?.udp_ports || [])].length === 0 ? (
                  <TableRow><TableCell colSpan={6}>No open ports recorded.</TableCell></TableRow>
                ) : [...(report?.open_ports || []), ...(report?.udp_ports || [])].map((port) => (
                  <TableRow key={`${port.protocol}-${port.port}`}>
                    <TableCell>{port.port}</TableCell>
                    <TableCell>{(port.protocol || "tcp").toUpperCase()}</TableCell>
                    <TableCell>{port.state}</TableCell>
                    <TableCell>{port.service || "—"}</TableCell>
                    <TableCell>{[port.product, port.version].filter(Boolean).join(" ") || "—"}</TableCell>
                    <TableCell sx={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis" }}>{port.banner || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {reportTab === 2 && (
            <Stack spacing={2}>
              {(report?.http || []).length === 0 && (report?.tls || []).length === 0 && <Typography variant="body2" color="text.secondary">No HTTP or TLS evidence collected.</Typography>}
              {(report?.http || []).map((row) => (
                <Box key={row.url} sx={{ p: 1.5, border: "1px solid rgba(0,0,0,0.08)", borderRadius: 2 }}>
                  <Typography variant="subtitle2">{row.url}</Typography>
                  <Typography variant="body2">Status {row.status || "—"} · Server {row.server || "—"} · HSTS {row.hsts ? "yes" : "no"}</Typography>
                </Box>
              ))}
              {(report?.tls || []).map((row) => (
                <Box key={`${row.port}-${row.subject}`} sx={{ p: 1.5, border: "1px solid rgba(0,0,0,0.08)", borderRadius: 2 }}>
                  <Typography variant="subtitle2">TLS {row.port}</Typography>
                  <Typography variant="body2">Subject {row.subject || "—"} · Issuer {row.issuer || "—"} · {row.version || ""}</Typography>
                  <Typography variant="caption" color="text.secondary">{row.not_before} — {row.not_after}</Typography>
                </Box>
              ))}
            </Stack>
          )}
          {reportTab === 3 && (
            <Stack spacing={1.25}>
              {(report?.findings || []).length === 0 ? <Typography variant="body2" color="text.secondary">No NSE or exposure findings on this host.</Typography> : (report.findings || []).map((item) => (
                <Alert key={`${item.port}-${item.title}-${item.cveId || ""}`} severity={item.severity === "critical" || item.severity === "high" ? "error" : "warning"}>
                  <strong>{item.title}</strong>{item.cveId ? ` (${item.cveId})` : ""} — {item.detail}
                </Alert>
              ))}
            </Stack>
          )}
          {reportTab === 5 && (
            <Stack spacing={1}>
              <Typography variant="subtitle2">DNS / resolved addresses</Typography>
              {(report?.dns || report?.enrichment?.dns || []).length === 0 ? (
                <Typography variant="body2" color="text.secondary">No DNS records resolved for this target.</Typography>
              ) : (report.dns || report.enrichment.dns).map((item) => (
                <Typography key={item} variant="body2">{item}</Typography>
              ))}
            </Stack>
          )}
          {reportTab === 6 && (
            <Box sx={{ p: 1.5, bgcolor: "rgba(63,81,181,0.04)", borderRadius: 1 }}>
              <Typography variant="caption" sx={{ fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                {JSON.stringify(report?.evidence || { command: report?.scanOptions?.command, engine: report?.engine }, null, 2)}
              </Typography>
            </Box>
          )}
          {reportTab === 4 && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2">Shodan</Typography>
                <Typography variant="body2" color="text.secondary">
                  {report?.shodan?.enabled === false ? report.shodan.reason : report?.shodan ? JSON.stringify(report.shodan) : "Not requested for this scan."}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">VirusTotal</Typography>
                <Typography variant="body2" color="text.secondary">
                  {report?.virustotal?.enabled === false ? report.virustotal.reason : report?.virustotal ? JSON.stringify(report.virustotal) : "Not requested for this scan."}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => openReport(report.id, "csv")}>Export CSV</Button>
          <Button onClick={() => window.open(`/api/v1/ip-scanner/scans/${report.id}/report?fmt=pdf`, "_blank")}>Export PDF</Button>
          <Button onClick={async () => {
            await api.post(`/api/v1/ip-scanner/scans/${report.id}/rescan`);
            openReport(report.id);
          }}>Rescan</Button>
          <Button onClick={() => setReport(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  );
};

export default IpScanner;
