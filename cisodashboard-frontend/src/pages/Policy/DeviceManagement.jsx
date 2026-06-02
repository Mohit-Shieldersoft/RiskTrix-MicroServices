import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Card, CardContent, Grid, CircularProgress,
  Chip, TextField, InputAdornment, Table, TableHead, TableRow,
  TableCell, TableBody, TableContainer, Paper, IconButton,
  Tooltip, Button, Tabs, Tab, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, Select, FormControl,
  InputLabel, Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import KeyIcon from "@mui/icons-material/Key";
import CheckIcon from "@mui/icons-material/Check";
import CircleIcon from "@mui/icons-material/Circle";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import deviceApi from "../../utils/deviceApi";
import heartbeatApi from "../../utils/heartbeatApi";

const getPlatformColor = (p) => {
  switch (p) {
    case "windows": return "primary";
    case "android": return "success";
    case "ios": return "warning";
    case "macos": return "default";
    default: return "default";
  }
};

const getRiskColor = (r) => {
  switch (r) {
    case "critical": return "error";
    case "high": return "error";
    case "medium": return "warning";
    case "low": return "success";
    default: return "default";
  }
};

const getEnrollColor = (s) =>
  s === "enrolled" ? "success" : "default";

export default function DeviceManagement() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  // ── Devices tab ──
  const [devices, setDevices] = useState([]);
  const [devLoading, setDevLoading] = useState(true);
  const [devError, setDevError] = useState(false);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [enrollFilter, setEnrollFilter] = useState("all");
  const [heartbeatMap, setHeartbeatMap] = useState({}); // deviceId -> {online, seconds_since_seen}

  // ── Tokens tab ──
  const [tokens, setTokens] = useState([]);
  const [tokLoading, setTokLoading] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const [genForm, setGenForm] = useState({ platform: "all", created_by: "admin", expires_hours: 24 });
  const [genLoading, setGenLoading] = useState(false);
  const [newToken, setNewToken] = useState(null);

  // ── Enrollment History tab ──
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(false);

  // ── Bulk Upload ──
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkError, setBulkError] = useState(null);

  // ── View Token dialog ──
  const [viewToken, setViewToken] = useState(null);
  const [copied, setCopied] = useState(false);

  // ── Stats ──
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(false);

  // fetch devices + stats on mount
  useEffect(() => {
    fetchDevices();
    fetchStats();
    fetchHeartbeats();
  }, []);

  const fetchHeartbeats = async () => {
    try {
      const statuses = await heartbeatApi.getAllStatus();
      const map = {};
      statuses.forEach((s) => { map[s.device_id] = s; });
      setHeartbeatMap(map);
    } catch (e) {
      // heartbeat service optional — ignore errors
    }
  };

  const fetchDevices = async () => {
    setDevLoading(true);
    setDevError(false);
    try {
      const data = await deviceApi.getDevices();
      setDevices(data || []);
    } catch (err) {
      console.error(err);
      setDevError(true);
    } finally {
      setDevLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsError(false);
    try {
      const data = await deviceApi.getEnrollmentStats();
      setStats(data);
    } catch (err) {
      console.error(err);
      setStatsError(true);
    }
  };

  const fetchTokens = async () => {
    setTokLoading(true);
    try {
      const data = await deviceApi.getTokens();
      setTokens(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setTokLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistLoading(true);
    try {
      const data = await deviceApi.getEnrollmentHistory();
      setHistory(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setHistLoading(false);
    }
  };

  const handleTabChange = (_, v) => {
    setTab(v);
    if (v === 1 && tokens.length === 0) fetchTokens();
    if (v === 2 && history.length === 0) fetchHistory();
  };

  const handleGenerateToken = async () => {
    setGenLoading(true);
    try {
      const token = await deviceApi.generateToken(genForm);
      setNewToken(token);
      fetchTokens();
    } catch (err) {
      console.error(err);
    } finally {
      setGenLoading(false);
    }
  };

  const handleRevokeToken = async (tokenId) => {
    try {
      await deviceApi.revokeToken(tokenId);
      fetchTokens();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = devices.filter((d) => {
    const s = search.toLowerCase();
    const matchSearch =
      (d.name || "").toLowerCase().includes(s) ||
      (d.owner || "").toLowerCase().includes(s) ||
      (d.device_uid || "").toLowerCase().includes(s) ||
      (d.department || "").toLowerCase().includes(s);
    const matchPlatform = platformFilter === "all" || d.platform === platformFilter;
    const matchRisk = riskFilter === "all" || d.risk_level === riskFilter;
    const matchEnroll = enrollFilter === "all" || d.enrollment_status === enrollFilter;
    return matchSearch && matchPlatform && matchRisk && matchEnroll;
  });

  const activeFilterCount = [
    platformFilter !== "all",
    riskFilter !== "all",
    enrollFilter !== "all",
    search.trim() !== "",
  ].filter(Boolean).length;

  return (
    <Box sx={{ p: 3 }}>
      {/* HEADER */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Device Management</Typography>
        <Typography variant="body2" color="text.secondary">
          MDM — enrolled devices, enrollment tokens, and history
        </Typography>
      </Box>

      {/* STATS CARDS */}
      {statsError ? (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchStats}>
              Retry
            </Button>
          }
        >
          Failed to load enrollment stats. Check that asset-service is running on port 8003.
        </Alert>
      ) : stats ? (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: "Total Devices", value: stats.total_devices },
            { label: "Enrolled", value: stats.enrolled_devices, color: "success.main" },
            { label: "Unenrolled", value: stats.unenrolled_devices, color: "text.secondary" },
            { label: "Active Tokens", value: stats.active_tokens, color: "primary.main" },
            { label: "Expired Tokens", value: stats.expired_tokens, color: "warning.main" },
            { label: "Used Tokens", value: stats.used_tokens, color: "text.secondary" },
          ].map((s, i) => (
            <Grid size={{ xs: 6, md: 2 }} key={i}>
              <Card>
                <CardContent sx={{ py: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                  <Typography variant="h5" sx={{ color: s.color || "text.primary" }}>{s.value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[...Array(6)].map((_, i) => (
            <Grid size={{ xs: 6, md: 2 }} key={i}>
              <Card>
                <CardContent sx={{ py: 1.5 }}>
                  <Box sx={{ height: 36, bgcolor: "grey.100", borderRadius: 1, animation: "pulse 1.5s ease-in-out infinite" }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* TABS */}
      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Devices" />
        <Tab label="Enrollment Tokens" />
        <Tab label="Enrollment History" />
      </Tabs>

      {/* ── TAB 0: DEVICES ── */}
      {tab === 0 && (
        <>
          {/* Toolbar: search + bulk upload button */}
          <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
            <TextField
              placeholder="Search by name, owner, UID, department..."
              size="small"
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><SearchIcon /></InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              onClick={() => { setBulkFile(null); setBulkResult(null); setBulkError(null); setBulkOpen(true); }}
              sx={{ whiteSpace: "nowrap" }}
            >
              Bulk Upload
            </Button>
          </Box>

          {/* FILTER ROWS */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
            {/* Platform */}
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>Platform:</Typography>
              {["all", "windows", "android", "ios", "macos"].map((p) => (
                <Chip
                  key={p}
                  label={p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
                  color={getPlatformColor(p)}
                  variant={platformFilter === p ? "filled" : "outlined"}
                  onClick={() => setPlatformFilter(p)}
                  clickable
                  size="small"
                />
              ))}
            </Box>

            {/* Risk Level */}
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>Risk:</Typography>
              {["all", "low", "medium", "high", "critical"].map((r) => (
                <Chip
                  key={r}
                  label={r === "all" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)}
                  color={getRiskColor(r)}
                  variant={riskFilter === r ? "filled" : "outlined"}
                  onClick={() => setRiskFilter(r)}
                  clickable
                  size="small"
                />
              ))}
            </Box>

            {/* Enrollment Status */}
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80 }}>Enrollment:</Typography>
              {["all", "enrolled", "unenrolled"].map((e) => (
                <Chip
                  key={e}
                  label={e === "all" ? "All" : e.charAt(0).toUpperCase() + e.slice(1)}
                  color={e === "enrolled" ? "success" : e === "unenrolled" ? "default" : "default"}
                  variant={enrollFilter === e ? "filled" : "outlined"}
                  onClick={() => setEnrollFilter(e)}
                  clickable
                  size="small"
                />
              ))}
              {activeFilterCount > 0 && (
                <Button
                  size="small"
                  color="inherit"
                  sx={{ ml: 1, fontSize: "0.72rem" }}
                  onClick={() => {
                    setPlatformFilter("all");
                    setRiskFilter("all");
                    setEnrollFilter("all");
                    setSearch("");
                  }}
                >
                  Clear filters ({activeFilterCount})
                </Button>
              )}
            </Box>
          </Box>

          {devLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
              <CircularProgress />
            </Box>
          ) : devError ? (
            <Alert
              severity="error"
              sx={{ borderRadius: 2 }}
              action={
                <Button color="inherit" size="small" onClick={fetchDevices}>
                  Retry
                </Button>
              }
            >
              Failed to load devices. Check that asset-service is running on port 8003.
            </Alert>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "grey.50" }}>
                    <TableCell sx={{ fontWeight: "bold" }}>UID</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Platform</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>OS</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Owner</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Enrollment</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Risk</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Last Seen</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        <Box sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            No devices match your filters.
                          </Typography>
                          {activeFilterCount > 0 && (
                            <Button
                              size="small"
                              sx={{ mt: 1 }}
                              onClick={() => {
                                setPlatformFilter("all");
                                setRiskFilter("all");
                                setEnrollFilter("all");
                                setSearch("");
                              }}
                            >
                              Clear all filters
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((d) => (
                      <TableRow key={d.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                        <TableCell>
                          <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                            {d.device_uid || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{d.name}</TableCell>
                        <TableCell>
                          {(() => {
                            const hb = heartbeatMap[d.id];
                            const isOnline = hb?.online;
                            return (
                              <Tooltip title={hb ? (isOnline ? "Online" : "Offline") : "No heartbeat data"}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                  <CircleIcon sx={{ fontSize: 10, color: isOnline ? "success.main" : "grey.400" }} />
                                  <Typography variant="caption" color={isOnline ? "success.main" : "text.secondary"}>
                                    {hb ? (isOnline ? "Online" : "Offline") : "Unknown"}
                                  </Typography>
                                </Box>
                              </Tooltip>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <Chip label={d.platform} color={getPlatformColor(d.platform)} size="small" />
                        </TableCell>
                        <TableCell>{d.os_version || "—"}</TableCell>
                        <TableCell>{d.owner || "—"}</TableCell>
                        <TableCell>{d.department || "—"}</TableCell>
                        <TableCell>
                          <Chip label={d.enrollment_status} color={getEnrollColor(d.enrollment_status)} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip label={d.risk_level} color={getRiskColor(d.risk_level)} size="small" />
                        </TableCell>
                        <TableCell>
                          {d.last_seen
                            ? new Date(d.last_seen).toLocaleString()
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Detail">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/devices/${d.id}`)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* ── TAB 1: ENROLLMENT TOKENS ── */}
      {tab === 1 && (
        <>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => { setNewToken(null); setGenOpen(true); }}
            >
              Generate Token
            </Button>
          </Box>

          {tokLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "grey.50" }}>
                    <TableCell sx={{ fontWeight: "bold" }}>Token (preview)</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Platform</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Created By</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Expires At</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Used By Device</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tokens.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="text.secondary" sx={{ py: 3 }}>No tokens found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tokens.map((t) => {
                      const expired = new Date(t.expires_at) < new Date();
                      const statusLabel = t.used ? "used" : expired ? "expired" : "active";
                      const statusColor = t.used ? "default" : expired ? "warning" : "success";
                      return (
                        <TableRow key={t.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                                {t.token.slice(0, 12)}...
                              </Typography>
                              <Tooltip title="View full token">
                                <IconButton
                                  size="small"
                                  onClick={() => { setViewToken(t); setCopied(false); }}
                                >
                                  <KeyIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={t.platform} color={getPlatformColor(t.platform)} size="small" />
                          </TableCell>
                          <TableCell>{t.created_by}</TableCell>
                          <TableCell>{new Date(t.expires_at).toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip label={statusLabel} color={statusColor} size="small" />
                          </TableCell>
                          <TableCell>{t.used_by_device_id || "—"}</TableCell>
                          <TableCell>
                            {!t.used && !expired && (
                              <Tooltip title="Revoke Token">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRevokeToken(t.id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* View Full Token Dialog */}
          <Dialog open={!!viewToken} onClose={() => setViewToken(null)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <KeyIcon color="primary" fontSize="small" />
              Full Enrollment Token
            </DialogTitle>
            <DialogContent>
              {viewToken && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                  <Box
                    sx={{
                      bgcolor: "grey.50",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                      p: 2,
                      wordBreak: "break-all",
                      fontFamily: "monospace",
                      fontSize: "0.8rem",
                      lineHeight: 1.7,
                      position: "relative",
                    }}
                  >
                    {viewToken.token}
                    <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          navigator.clipboard.writeText(viewToken.token);
                          setCopied(true);
                        }}
                        sx={{ position: "absolute", top: 8, right: 8 }}
                        color={copied ? "success" : "default"}
                      >
                        {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    <Chip label={`Platform: ${viewToken.platform}`} size="small" color={getPlatformColor(viewToken.platform)} />
                    <Chip label={`Created by: ${viewToken.created_by}`} size="small" variant="outlined" />
                    <Chip
                      label={`Expires: ${new Date(viewToken.expires_at).toLocaleString()}`}
                      size="small"
                      color={new Date(viewToken.expires_at) < new Date() ? "warning" : "success"}
                      variant="outlined"
                    />
                    {viewToken.used && (
                      <Chip label="Used" size="small" color="default" />
                    )}
                  </Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewToken(null)}>Close</Button>
              <Button
                variant="contained"
                startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
                color={copied ? "success" : "primary"}
                onClick={() => {
                  navigator.clipboard.writeText(viewToken.token);
                  setCopied(true);
                }}
              >
                {copied ? "Copied!" : "Copy Token"}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Generate Token Dialog */}
          <Dialog open={genOpen} onClose={() => setGenOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle>Generate Enrollment Token</DialogTitle>
            <DialogContent sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
              {newToken ? (
                <Alert
                  severity="success"
                  action={
                    <IconButton
                      size="small"
                      onClick={() => navigator.clipboard.writeText(newToken.token)}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <Typography variant="caption" sx={{ wordBreak: "break-all", fontFamily: "monospace" }}>
                    {newToken.token}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    Expires: {new Date(newToken.expires_at).toLocaleString()}
                  </Typography>
                </Alert>
              ) : (
                <>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Platform</InputLabel>
                    <Select
                      value={genForm.platform}
                      label="Platform"
                      onChange={(e) => setGenForm({ ...genForm, platform: e.target.value })}
                    >
                      {["all", "windows", "android", "ios", "macos"].map((p) => (
                        <MenuItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Created By"
                    size="small"
                    value={genForm.created_by}
                    onChange={(e) => setGenForm({ ...genForm, created_by: e.target.value })}
                    fullWidth
                  />
                  <TextField
                    label="Expires in (hours)"
                    size="small"
                    type="number"
                    value={genForm.expires_hours}
                    onChange={(e) => setGenForm({ ...genForm, expires_hours: parseInt(e.target.value) || 24 })}
                    fullWidth
                  />
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setGenOpen(false)}>Close</Button>
              {!newToken && (
                <Button
                  variant="contained"
                  onClick={handleGenerateToken}
                  disabled={genLoading}
                >
                  {genLoading ? "Generating..." : "Generate"}
                </Button>
              )}
            </DialogActions>
          </Dialog>
        </>
      )}

      {/* ── TAB 2: ENROLLMENT HISTORY ── */}
      {tab === 2 && (
        histLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "grey.50" }}>
                  <TableCell sx={{ fontWeight: "bold" }}>Device</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>UID</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Platform</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Enrolled At</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Enrolled By</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Method</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Token</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary" sx={{ py: 3 }}>No enrollment history</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((e) => (
                    <TableRow key={e.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 500 }}>{e.device_name}</TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                          {e.device_uid}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={e.platform} color={getPlatformColor(e.platform)} size="small" />
                      </TableCell>
                      <TableCell>{new Date(e.enrolled_at).toLocaleString()}</TableCell>
                      <TableCell>{e.enrolled_by || "—"}</TableCell>
                      <TableCell>{e.enrollment_method}</TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                          {e.token_preview}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={e.status} color={e.status === "active" ? "success" : "default"} size="small" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}

      {/* ── BULK UPLOAD DIALOG ── */}
      <Dialog open={bulkOpen} onClose={() => setBulkOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Upload Devices</DialogTitle>
        <DialogContent>
          {!bulkResult ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload a <strong>.csv</strong> or <strong>.xlsx</strong> file to add multiple devices at once.
                Required columns: <code>name</code>, <code>platform</code>. Optional: <code>serial_number</code>, <code>device_uid</code>, <code>os_version</code>, <code>owner</code>, <code>department</code>, <code>mac_address</code>, <code>ip_address</code>, <code>risk_level</code>, <code>status</code>, <code>notes</code>.
              </Typography>
              <Button
                size="small"
                variant="text"
                startIcon={<DownloadIcon />}
                href={deviceApi.getTemplateUrl()}
                target="_blank"
                sx={{ mb: 2 }}
              >
                Download CSV Template
              </Button>
              <Box
                sx={{
                  border: "2px dashed",
                  borderColor: bulkFile ? "primary.main" : "grey.400",
                  borderRadius: 2,
                  p: 3,
                  textAlign: "center",
                  cursor: "pointer",
                  bgcolor: bulkFile ? "primary.50" : "grey.50",
                }}
                onClick={() => document.getElementById("bulk-upload-input").click()}
              >
                <UploadFileIcon sx={{ fontSize: 40, color: bulkFile ? "primary.main" : "grey.400", mb: 1 }} />
                <Typography variant="body2" color={bulkFile ? "primary.main" : "text.secondary"}>
                  {bulkFile ? bulkFile.name : "Click to select a .csv or .xlsx file"}
                </Typography>
                <input
                  id="bulk-upload-input"
                  type="file"
                  accept=".csv,.xlsx"
                  hidden
                  onChange={(e) => { setBulkFile(e.target.files[0] || null); setBulkError(null); }}
                />
              </Box>
              {bulkError && (
                <Alert severity="error" sx={{ mt: 2 }}>{bulkError}</Alert>
              )}
            </>
          ) : (
            <Box>
              <Alert severity={bulkResult.errors?.length > 0 ? "warning" : "success"} sx={{ mb: 2 }}>
                {bulkResult.message}
              </Alert>
              <Box sx={{ display: "flex", gap: 3, mb: 2 }}>
                <Box><Typography variant="h4" color="success.main">{bulkResult.created}</Typography><Typography variant="caption">Created</Typography></Box>
                <Box><Typography variant="h4" color="warning.main">{bulkResult.skipped}</Typography><Typography variant="caption">Skipped (duplicates)</Typography></Box>
                <Box><Typography variant="h4" color="error.main">{bulkResult.errors?.length || 0}</Typography><Typography variant="caption">Errors</Typography></Box>
              </Box>
              {bulkResult.errors?.length > 0 && (
                <Box sx={{ maxHeight: 200, overflow: "auto" }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Row errors:</Typography>
                  {bulkResult.errors.map((e, i) => (
                    <Alert severity="error" key={i} sx={{ mb: 0.5, py: 0 }}>
                      Row {e.row}: {e.error}
                    </Alert>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setBulkOpen(false); setBulkResult(null); setBulkFile(null); setBulkError(null); }}>
            {bulkResult ? "Close" : "Cancel"}
          </Button>
          {!bulkResult && (
            <Button
              variant="contained"
              disabled={!bulkFile || bulkLoading}
              onClick={async () => {
                setBulkLoading(true);
                setBulkError(null);
                try {
                  const result = await deviceApi.bulkUploadDevices(bulkFile);
                  setBulkResult(result);
                  fetchDevices();
                } catch (err) {
                  setBulkError(err?.response?.data?.detail || "Upload failed. Please check your file and try again.");
                } finally {
                  setBulkLoading(false);
                }
              }}
            >
              {bulkLoading ? "Uploading..." : "Upload"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}