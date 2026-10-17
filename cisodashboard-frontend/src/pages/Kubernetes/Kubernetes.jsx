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
  Tabs,
  Tab,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import StorageIcon from "@mui/icons-material/Storage";
import WarningIcon from "@mui/icons-material/Warning";
import ShieldIcon from "@mui/icons-material/Shield";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DnsIcon from "@mui/icons-material/Dns";
import ViewInArIcon from "@mui/icons-material/ViewInAr";
import SecurityIcon from "@mui/icons-material/Security";
import VisibilityIcon from "@mui/icons-material/Visibility";
import api from "../../utils/api";

const DEFAULT_CLUSTERS = [];

const DEFAULT_AUDITS = [];

const Kubernetes = () => {
  const [clusters, setClusters] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");

  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Selected Audit Detail Dialog
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [tab, setTab] = useState("clusters");
  const [k8sStats, setK8sStats] = useState(null);

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchK8sData();
  }, []);

  const fetchK8sData = async () => {
    setLoading(true);
    try {
      const [clustersRes, auditsRes, statsRes] = await Promise.all([
        api.get("/api/v1/kubernetes/clusters"),
        api.get("/api/v1/kubernetes/audits"),
        api.get("/api/v1/kubernetes/stats").catch(() => ({ data: null })),
      ]);
      setK8sStats(statsRes.data || null);

      if (clustersRes.data && Array.isArray(clustersRes.data)) {
        const normalizedClusters = clustersRes.data.map((c, idx) => ({
          ...c,
          cluster_id: c.cluster_id || c.id || `cls-${idx}`,
          name: c.name || c.cluster_name || "Kubernetes Cluster",
          provider: c.provider || "AWS",
          version: c.version || "v1.28.0",
          region: c.region || "us-east-1",
          nodes_count: c.nodes_count ?? 0,
          pods_count: c.pods_count ?? 0,
          privileged_pods_count: c.privileged_pods_count ?? 0,
          posture_score: c.posture_score ?? 85.0,
          status: c.status || "ACTIVE",
          last_audited: c.last_audited || "Just now",
        }));
        setClusters(normalizedClusters);
      } else {
        setClusters([]);
      }

      if (auditsRes.data && Array.isArray(auditsRes.data)) {
        const normalizedAudits = auditsRes.data.map((a, idx) => ({
          ...a,
          audit_id: a.audit_id || a.id || `aud-${idx}`,
          cluster_id: a.cluster_id || "cls-eks-prod",
          cluster_name: a.cluster_name || "Production Cluster",
          namespace: a.namespace || "default",
          pod_name: a.pod_name || "pod-unknown",
          check_name: a.check_name || "SECURITY_CHECK",
          severity: a.severity || "MEDIUM",
          status: a.status || "VIOLATION",
          description: a.description || "Security posture item flagged.",
          remediation: a.remediation || "Review security context configuration.",
        }));
        setAudits(normalizedAudits);
      } else {
        setAudits([]);
      }
    } catch (err) {
      console.warn("Could not fetch Kubernetes data:", err);
      setClusters([]);
      setAudits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerAudit = async (clusterId) => {
    try {
      await api.post("/api/v1/kubernetes/scan");
      setNotification({
        open: true,
        message: `Triggered Kubernetes posture scan${clusterId ? ` for ${clusterId}` : ""}.`,
        severity: "success",
      });
      fetchK8sData();
    } catch (err) {
      setNotification({
        open: true,
        message: err.response?.data?.detail || "Kubernetes scan failed",
        severity: "error",
      });
    }
  };

  // Filter Logic
  const filteredAudits = audits.filter((item) => {
    const podStr = (item.pod_name || "").toLowerCase();
    const nsStr = (item.namespace || "").toLowerCase();
    const checkStr = (item.check_name || "").toLowerCase();
    const clsStr = (item.cluster_id || "").toString().toLowerCase();
    const searchStr = (searchTerm || "").toLowerCase();

    const matchesSearch =
      podStr.includes(searchStr) ||
      nsStr.includes(searchStr) ||
      checkStr.includes(searchStr) ||
      clsStr.includes(searchStr);

    const sevStr = (item.severity || "").toUpperCase();
    const matchesSeverity =
      severityFilter === "ALL" || sevStr === severityFilter.toUpperCase();

    return matchesSearch && matchesSeverity;
  });

  const filteredClusters = clusters.filter((c) => {
    const provStr = (c.provider || "").toUpperCase();
    return providerFilter === "ALL" || provStr === providerFilter.toUpperCase();
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

  // Aggregated Counters
  const totalClusters = k8sStats?.clusters ?? clusters.length;
  const totalNodes = clusters.reduce((acc, c) => acc + (c.nodes_count || 0), 0);
  const totalPods = clusters.reduce((acc, c) => acc + (c.pods_count || 0), 0);
  const totalPrivilegedPods = k8sStats?.privileged_pods ?? clusters.reduce((acc, c) => acc + (c.privileged_pods_count || 0), 0);
  const avgScore = k8sStats?.avg_posture ?? (
    clusters.reduce((acc, c) => acc + (c.posture_score || 0), 0) / (clusters.length || 1)
  ).toFixed(1);

  return (
    <Box sx={{ maxWidth: "100%", width: "100%" }}>
      {/* Top Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e293b" }}>
            Kubernetes Posture & Privileged Pods
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
            EKS, GKE, AKS & On-Prem K8s Cluster Posture Scores, Pod Security Standards & Namespace Risk Inspection
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchK8sData}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<SecurityIcon />}
            onClick={() => handleTriggerAudit()}
            sx={{ textTransform: "none", fontWeight: 700, bgcolor: "#3f51b5" }}
          >
            Audit All Clusters
          </Button>
        </Box>
      </Box>

      {/* Summary Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #2563eb" }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Active K8s Clusters
                </Typography>
                <DnsIcon sx={{ color: "#2563eb" }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#0f172a" }}>
                {totalClusters} Clusters
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #0288d1" }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Nodes & Pods Monitored
                </Typography>
                <ViewInArIcon sx={{ color: "#0288d1" }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#0f172a" }}>
                {totalNodes} Nodes / {totalPods} Pods
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #dc2626" }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Privileged Pod Violations
                </Typography>
                <Badge badgeContent={totalPrivilegedPods} color="error">
                  <WarningIcon sx={{ color: "#dc2626" }} />
                </Badge>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#dc2626" }}>
                {totalPrivilegedPods} Pods
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #16a34a" }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Average K8s Security Score
                </Typography>
                <ShieldIcon sx={{ color: "#16a34a" }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#0f172a" }}>
                {avgScore}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
        <Tab value="clusters" label="Clusters" />
        <Tab value="findings" label={`Findings (${audits.length})`} />
      </Tabs>

      {tab === "clusters" && (
      <>
      <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", mb: 2 }}>
        Registered Kubernetes Clusters Security Posture
      </Typography>

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {filteredClusters.map((cls) => (
          <Grid item xs={12} sm={6} md={3} key={cls.cluster_id}>
            <Card sx={{ border: "1px solid #e2e8f0" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Chip label={cls.provider} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: "10px" }} />
                  <Chip label={cls.version} size="small" sx={{ bgcolor: "#f1f5f9", fontWeight: 600, fontSize: "10px" }} />
                </Box>

                <Typography variant="body1" sx={{ fontWeight: 700, color: "#0f172a", mb: 0.5 }}>
                  {cls.name}
                </Typography>

                <Typography variant="caption" sx={{ color: "#64748b", fontFamily: "monospace", display: "block", mb: 2 }}>
                  {cls.cluster_id} ({cls.region})
                </Typography>

                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: "#475569" }}>
                    Posture Score:
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: cls.posture_score >= 85 ? "#16a34a" : "#d97706" }}>
                    {cls.posture_score}%
                  </Typography>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={cls.posture_score}
                  color={cls.posture_score >= 85 ? "success" : cls.posture_score >= 70 ? "warning" : "error"}
                  sx={{ height: 6, borderRadius: 3, mb: 2 }}
                />

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="caption" sx={{ color: "#dc2626", fontWeight: 700 }}>
                    {cls.privileged_pods_count} Privileged Pods
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button size="small" onClick={async () => {
                      try {
                        const res = await api.get(`/api/v1/kubernetes/clusters/${cls.cluster_id}`);
                        setSelectedCluster(res.data || cls);
                      } catch {
                        setSelectedCluster(cls);
                      }
                    }}>Details</Button>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => handleTriggerAudit(cls.cluster_id)}
                      sx={{ textTransform: "none", fontSize: "11px", fontWeight: 600 }}
                    >
                      Audit
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      </>
      )}

      {tab === "findings" && (
      <>
      {/* Pod Security Standards Audit Violations Table */}
      <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", mb: 2 }}>
        Pod Security Standards Audit Risk Table
      </Typography>

      {/* Filter Toolbar */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search pod name, namespace, or check name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: "#94a3b8", mr: 1 }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={3} md={4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Cluster Provider</InputLabel>
              <Select value={providerFilter} label="Cluster Provider" onChange={(e) => setProviderFilter(e.target.value)}>
                <MenuItem value="ALL">All Providers</MenuItem>
                <MenuItem value="AWS">AWS EKS</MenuItem>
                <MenuItem value="GCP">GCP GKE</MenuItem>
                <MenuItem value="AZURE">Azure AKS</MenuItem>
                <MenuItem value="ON_PREM">On-Prem OpenShift</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3} md={4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Audit Severity</InputLabel>
              <Select value={severityFilter} label="Audit Severity" onChange={(e) => setSeverityFilter(e.target.value)}>
                <MenuItem value="ALL">All Severities</MenuItem>
                <MenuItem value="CRITICAL">Critical (#d32f2f)</MenuItem>
                <MenuItem value="HIGH">High (#f57c00)</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
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
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Pod & Namespace</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Cluster ID</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Pod Security Standard Check</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Severity</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Audit Violation Description</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: "#334155" }}>Inspect</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredAudits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: "#64748b" }}>
                  No Pod Security audit violations found.
                </TableCell>
              </TableRow>
            ) : (
              filteredAudits.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                <TableRow key={row.audit_id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                      {row.pod_name}
                    </Typography>
                    <Chip label={`ns: ${row.namespace}`} size="small" sx={{ bgcolor: "#ede9fe", color: "#6d28d9", fontWeight: 700, fontSize: "10px" }} />
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", color: "#334155" }}>
                      {row.cluster_id}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip label={row.check_name} size="small" sx={{ bgcolor: "#fef2f2", color: "#dc2626", fontWeight: 700, fontSize: "11px" }} />
                  </TableCell>

                  <TableCell>{getSeverityChip(row.severity)}</TableCell>

                  <TableCell>
                    <Typography variant="body2" sx={{ color: "#475569" }}>
                      {row.description}
                    </Typography>
                  </TableCell>

                  <TableCell align="right">
                    <Tooltip title="View Remediation YAML Spec">
                      <IconButton size="small" onClick={() => setSelectedAudit(row)} sx={{ color: "#2563eb" }}>
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
          count={filteredAudits.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      </>
      )}

      <Dialog open={Boolean(selectedCluster)} onClose={() => setSelectedCluster(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedCluster?.name || "Cluster"}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Provider: {selectedCluster?.provider}</Typography>
          <Typography variant="body2">Version: {selectedCluster?.version}</Typography>
          <Typography variant="body2">Region: {selectedCluster?.region}</Typography>
          <Typography variant="body2">Nodes: {selectedCluster?.nodes_count} · Pods: {selectedCluster?.pods_count}</Typography>
          <Typography variant="body2">Privileged pods: {selectedCluster?.privileged_pods_count}</Typography>
          <Typography variant="body2">Posture: {selectedCluster?.posture_score}%</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedCluster(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Audit Inspection Dialog */}
      {selectedAudit && (
        <Dialog open={Boolean(selectedAudit)} onClose={() => setSelectedAudit(null)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, color: "#0f172a" }}>
            Pod Security Standard Violation: {selectedAudit.pod_name}
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#dc2626", mb: 0.5 }}>
              Security Violation Check: {selectedAudit.check_name}
            </Typography>
            <Typography variant="body2" sx={{ color: "#334155", mb: 2 }}>
              {selectedAudit.description}
            </Typography>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#16a34a", mb: 0.5 }}>
              Recommended Pod Security Spec Remediation:
            </Typography>
            <Box sx={{ p: 2, bgcolor: "rgba(63, 81, 181, 0.04)", color: "text.primary", borderRadius: "8px", fontFamily: "monospace", fontSize: "12px", whiteSpace: "pre-wrap", border: "1px solid rgba(63, 81, 181, 0.12)" }}>
              {selectedAudit.remediation}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button
              onClick={async () => {
                const findingId = selectedAudit.audit_id || selectedAudit.id;
                try {
                  await api.patch(`/api/v1/kubernetes/findings/${findingId}/status?status=SUPPRESSED`);
                  setNotification({ open: true, message: "Finding suppressed", severity: "info" });
                  setSelectedAudit(null);
                  fetchK8sData();
                } catch (err) {
                  setNotification({ open: true, message: err.response?.data?.detail || "Update failed", severity: "error" });
                }
              }}
              sx={{ textTransform: "none" }}
            >
              Suppress
            </Button>
            <Button
              onClick={async () => {
                const findingId = selectedAudit.audit_id || selectedAudit.id;
                try {
                  await api.patch(`/api/v1/kubernetes/findings/${findingId}/status?status=REMEDIATED`);
                  setNotification({ open: true, message: "Finding marked remediated", severity: "success" });
                  setSelectedAudit(null);
                  fetchK8sData();
                } catch (err) {
                  setNotification({ open: true, message: err.response?.data?.detail || "Update failed", severity: "error" });
                }
              }}
              variant="outlined"
              sx={{ textTransform: "none" }}
            >
              Mark remediated
            </Button>
            <Button onClick={() => setSelectedAudit(null)} variant="contained" sx={{ textTransform: "none", bgcolor: "#3f51b5" }}>
              Close
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

export default Kubernetes;
