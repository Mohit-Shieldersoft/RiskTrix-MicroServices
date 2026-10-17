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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import KeyIcon from "@mui/icons-material/Key";
import WarningIcon from "@mui/icons-material/Warning";
import ShieldIcon from "@mui/icons-material/Shield";
import RefreshIcon from "@mui/icons-material/Refresh";
import BuildIcon from "@mui/icons-material/Build";
import HubIcon from "@mui/icons-material/Hub";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import TimerOffIcon from "@mui/icons-material/TimerOff";
import LockResetIcon from "@mui/icons-material/LockReset";
import api from "../../utils/api";

const DEFAULT_IDENTITIES = [];

const CIEM = () => {
  const [identities, setIdentities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL"); // ALL, OVERPRIVILEGED, DORMANT

  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Selected Identity for Least Privilege Dialog
  const [selectedIdentity, setSelectedIdentity] = useState(null);
  const [graph, setGraph] = useState({ nodes: [], links: [], privilege_escalation_paths_count: 0 });
  const [stats, setStats] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchCIEMData();
  }, []);

  const fetchCIEMData = async () => {
    setLoading(true);
    try {
      const [response, graphRes, statsRes, accountRes] = await Promise.all([
        api.get("/api/v1/ciem/identities"),
        api.get("/api/v1/ciem/graph").catch(() => ({ data: { nodes: [], links: [] } })),
        api.get("/api/v1/ciem/stats").catch(() => ({ data: null })),
        api.get("/api/v1/cloud/accounts").catch(() => ({ data: [] })),
      ]);
      setGraph(graphRes.data || { nodes: [], links: [] });
      setStats(statsRes.data || null);
      setAccounts(Array.isArray(accountRes.data) ? accountRes.data : []);
      if (response.data && Array.isArray(response.data)) {
        const normalized = response.data.map((item, idx) => ({
          ...item,
          identity_id: item.identity_id || item.arn || item.id || `id-${idx}`,
          name: item.name || item.identity_name || item.username || "Unnamed Identity",
          type: item.type || item.identity_type || "USER",
          provider: item.provider || "AWS",
          account_name: item.account_name || item.cloud_account || "Cloud Account",
          granted_permissions_count: item.granted_permissions_count ?? item.granted_count ?? 0,
          used_permissions_count: item.used_permissions_count ?? item.used_count ?? 0,
          dormant_days: item.dormant_days ?? 0,
          is_overprivileged: Boolean(item.is_overprivileged),
          is_dormant: Boolean(item.is_dormant),
          risk_score: item.risk_score ?? 50,
          policies: Array.isArray(item.policies) ? item.policies : (item.policies ? [item.policies] : []),
          unused_services: Array.isArray(item.unused_services) ? item.unused_services : [],
          recommended_policy: item.recommended_policy || "No policy recommendation available.",
        }));
        setIdentities(normalized);
      } else {
        setIdentities([]);
      }
    } catch (err) {
      console.warn("Could not fetch CIEM identities:", err);
      setIdentities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeastPrivilege = async (identityId) => {
    try {
      await api.post(`/api/v1/ciem/remediate/${identityId}`);
      setIdentities((prev) =>
        prev.map((i) =>
          i.identity_id === identityId
            ? { ...i, is_overprivileged: false, is_dormant: false, risk_score: 20 }
            : i
        )
      );
      setNotification({
        open: true,
        message: `Guided least-privilege action recorded for ${identityId}. Cloud was not mutated.`,
        severity: "success",
      });
    } catch (err) {
      setNotification({
        open: true,
        message: err.response?.data?.detail || `Failed to remediate ${identityId}`,
        severity: "error",
      });
    } finally {
      setSelectedIdentity(null);
    }
  };

  // Filter Logic
  const filteredIdentities = identities.filter((item) => {
    const nameStr = (item.name || "").toLowerCase();
    const idStr = (item.identity_id || "").toString().toLowerCase();
    const accountStr = (item.account_name || "").toLowerCase();
    const searchStr = (searchTerm || "").toLowerCase();

    const matchesSearch =
      nameStr.includes(searchStr) ||
      idStr.includes(searchStr) ||
      accountStr.includes(searchStr);

    const providerStr = (item.provider || "").toUpperCase();
    const matchesProvider =
      providerFilter === "ALL" || providerStr === providerFilter.toUpperCase();

    const typeStr = (item.type || "").toUpperCase();
    const matchesType =
      typeFilter === "ALL" || typeStr === typeFilter.toUpperCase();

    let matchesRisk = true;
    if (riskFilter === "OVERPRIVILEGED") matchesRisk = item.is_overprivileged === true;
    if (riskFilter === "DORMANT") matchesRisk = item.is_dormant === true;
    if (riskFilter === "CRITICAL") matchesRisk = (item.privilege_risk_score || item.risk_score || 0) >= 8;

    return matchesSearch && matchesProvider && matchesType && matchesRisk;
  });

  // Aggregated Counters
  const totalIdentities = stats?.total ?? identities.length;
  const overprivilegedCount = stats?.overprivileged ?? stats?.riskFlags?.overPrivileged ?? identities.filter((i) => i.is_overprivileged).length;
  const dormantCount = stats?.dormant ?? stats?.riskFlags?.inactive ?? identities.filter((i) => i.is_dormant).length;
  const criticalCount = stats?.riskCounts?.critical ?? identities.filter((i) => (i.privilege_risk_score || i.risk_score || 0) >= 8).length;
  const avgUnusedPercent = (
    identities.reduce((acc, curr) => {
      const unused = curr.granted_permissions_count - curr.used_permissions_count;
      const pct = curr.granted_permissions_count > 0 ? (unused / curr.granted_permissions_count) * 100 : 0;
      return acc + pct;
    }, 0) / (identities.length || 1)
  ).toFixed(1);

  return (
    <Box sx={{ maxWidth: "100%", width: "100%" }}>
      {/* Top Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e293b" }}>
            CIEM Entitlements & Identity Graph
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
            IAM Identity Graph, Effective Permissions vs CloudTrail Audit Logs & Dormant Privilege Detector
          </Typography>
          <Alert severity="info" sx={{ mt: 1.5 }}>
            Least-privilege actions are recorded; they do not mutate the cloud account.
          </Alert>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            disabled={!accounts.length}
            onClick={async () => {
              try {
                await api.post("/api/v1/ciem/sync");
                setNotification({ open: true, message: "CIEM identity sync completed", severity: "success" });
              } catch (err) {
                setNotification({ open: true, message: err.response?.data?.detail || "CIEM sync failed", severity: "error" });
              }
              fetchCIEMData();
            }}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Recalculate IAM Graph
          </Button>
          <Button
            variant="contained"
            startIcon={<LockResetIcon />}
            disabled={analyzing || !accounts.length}
            onClick={async () => {
              setAnalyzing(true);
              try {
                await api.post("/api/v1/ciem/analyze");
                setNotification({ open: true, message: "CIEM entitlement analysis completed", severity: "success" });
                await fetchCIEMData();
              } catch (err) {
                setNotification({ open: true, message: err.response?.data?.detail || "CIEM analysis failed", severity: "error" });
              } finally {
                setAnalyzing(false);
              }
            }}
            sx={{ textTransform: "none", fontWeight: 700, bgcolor: "#3f51b5" }}
          >
            {analyzing ? "Analyzing entitlements..." : "Run CIEM Analysis"}
          </Button>
        </Box>
      </Box>

      {accounts.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Connect an AWS, Azure, or GCP account, then run CIEM analysis to evaluate identities, unused permissions, and escalation paths.
        </Alert>
      )}
      {accounts.length > 0 && identities.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No IAM identities yet. Run CIEM Analysis after a successful cloud sync.
        </Alert>
      )}
      {graph?.nodes?.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Identity graph · {graph.nodes.length} nodes · {graph.privilege_escalation_paths_count || 0} escalation paths
          </Typography>
          {(graph.links || []).slice(0, 12).map((link, idx) => (
            <Typography key={`${link.source}-${link.target}-${idx}`} variant="body2">
              {link.source} —{link.relationship}→ {link.target}
              {link.is_escalation_path ? " (escalation)" : ""}
            </Typography>
          ))}
        </Paper>
      )}
      {/* Metric Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #2563eb" }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Total Tracked IAM Identities
                </Typography>
                <HubIcon sx={{ color: "#2563eb" }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#0f172a" }}>
                {totalIdentities}
              </Typography>
              <Typography variant="caption" sx={{ color: "#dc2626", fontWeight: 600 }}>
                {criticalCount} critical IAM risk
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => setRiskFilter("OVERPRIVILEGED")}
            sx={{
              cursor: "pointer",
              borderLeft: "4px solid #dc2626",
              bgcolor: riskFilter === "OVERPRIVILEGED" ? "#fef2f2" : "#ffffff",
            }}
          >
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Over-Privileged Identities
                </Typography>
                <Badge badgeContent={overprivilegedCount} color="error">
                  <WarningIcon sx={{ color: "#dc2626" }} />
                </Badge>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#dc2626" }}>
                {overprivilegedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => setRiskFilter("DORMANT")}
            sx={{
              cursor: "pointer",
              borderLeft: "4px solid #d97706",
              bgcolor: riskFilter === "DORMANT" ? "#fffbeb" : "#ffffff",
            }}
          >
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Dormant Accounts ({">"}60 Days)
                </Typography>
                <Badge badgeContent={dormantCount} color="warning">
                  <TimerOffIcon sx={{ color: "#d97706" }} />
                </Badge>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#d97706" }}>
                {dormantCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #7c3aed" }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Privilege Gap (Unused Actions)
                </Typography>
                <LockResetIcon sx={{ color: "#7c3aed" }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#7c3aed" }}>
                {avgUnusedPercent}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* IAM Entitlement Graph Node Cards Inspector Preview */}
      <Paper sx={{ mb: 3, p: 2.5, borderRadius: "8px", border: "1px solid #e2e8f0" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#0f172a", mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <AccountTreeIcon sx={{ color: "#2563eb" }} /> NetworkX Effective Permission Graph Topology
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748b", mb: 2 }}>
          Visualizing identity-to-role relationships and cross-account privilege escalation paths.
        </Typography>

        <Grid container spacing={2}>
          {identities.slice(0, 4).map((ident) => {
            const usedPct = ident.granted_permissions_count > 0 ? (ident.used_permissions_count / ident.granted_permissions_count) * 100 : 100;
            return (
              <Grid item xs={12} sm={6} md={3} key={ident.identity_id}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    bgcolor: "#f8fafc",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Chip label={ident.provider} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: "10px" }} />
                    <Chip label={ident.type} size="small" sx={{ bgcolor: "#dbeafe", color: "#1d4ed8", fontWeight: 700, fontSize: "10px" }} />
                  </Box>

                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                    {ident.name}
                  </Typography>

                  <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 1.5 }}>
                    {ident.account_name}
                  </Typography>

                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                    <Typography variant="caption" sx={{ color: "#475569" }}>
                      Permission Usage Meter:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: usedPct < 30 ? "#dc2626" : "#16a34a" }}>
                      {usedPct.toFixed(0)}% Used
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={usedPct}
                    color={usedPct < 25 ? "error" : usedPct < 60 ? "warning" : "success"}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Filter & Search Toolbar */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search identity name or account..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: "#94a3b8", mr: 1 }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Cloud Provider</InputLabel>
              <Select value={providerFilter} label="Cloud Provider" onChange={(e) => setProviderFilter(e.target.value)}>
                <MenuItem value="ALL">All Providers</MenuItem>
                <MenuItem value="AWS">AWS</MenuItem>
                <MenuItem value="AZURE">Azure</MenuItem>
                <MenuItem value="GCP">GCP</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Identity Type</InputLabel>
              <Select value={typeFilter} label="Identity Type" onChange={(e) => setTypeFilter(e.target.value)}>
                <MenuItem value="ALL">All Types</MenuItem>
                <MenuItem value="SERVICE_ACCOUNT">Service Accounts</MenuItem>
                <MenuItem value="ROLE">IAM Roles</MenuItem>
                <MenuItem value="USER">IAM Users</MenuItem>
                <MenuItem value="SERVICE_PRINCIPAL">Azure SPNs</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4} md={3}>
            {riskFilter !== "ALL" && (
              <Button variant="text" size="small" onClick={() => setRiskFilter("ALL")} sx={{ textTransform: "none" }}>
                Clear Risk Filter
              </Button>
            )}
          </Grid>
        </Grid>
      </Card>

      {/* Main Table */}
      <TableContainer component={Paper} sx={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}>
        {loading && <LinearProgress />}
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Identity Name & Type</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Provider & Account</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Granted Policies</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Excessive Permission Usage Meter</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Dormant Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: "#334155" }}>Remediation</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredIdentities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: "#64748b" }}>
                  No IAM identities matching your filter selection.
                </TableCell>
              </TableRow>
            ) : (
              filteredIdentities.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                const usedPct = row.granted_permissions_count > 0 ? (row.used_permissions_count / row.granted_permissions_count) * 100 : 100;

                return (
                  <TableRow key={row.identity_id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                        {row.name}
                      </Typography>
                      <Chip label={row.type} size="small" sx={{ bgcolor: "#f1f5f9", color: "#475569", fontWeight: 700, fontSize: "10px" }} />
                    </TableCell>

                    <TableCell>
                      <Chip label={row.provider} size="small" variant="outlined" sx={{ fontWeight: 700, mr: 1 }} />
                      <Typography variant="caption" sx={{ color: "#64748b" }}>
                        {row.account_name}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {row.policies.map((p) => (
                          <Chip key={p} label={p} size="small" sx={{ bgcolor: "#fff3e0", color: "#d97706", fontWeight: 600, fontSize: "10px" }} />
                        ))}
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ width: "160px" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography variant="caption" sx={{ color: "#64748b" }}>
                            {row.used_permissions_count} / {row.granted_permissions_count} Actions
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: usedPct < 30 ? "#dc2626" : "#16a34a" }}>
                            {usedPct.toFixed(0)}% Used
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={usedPct}
                          color={usedPct < 25 ? "error" : usedPct < 60 ? "warning" : "success"}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    </TableCell>

                    <TableCell>
                      {row.is_dormant ? (
                        <Chip
                          icon={<TimerOffIcon style={{ fontSize: 14 }} />}
                          label={`DORMANT (${row.dormant_days}d)`}
                          size="small"
                          sx={{ bgcolor: "#fef2f2", color: "#dc2626", fontWeight: 700, fontSize: "10px" }}
                        />
                      ) : (
                        <Chip label={`Active (${row.dormant_days}d)`} size="small" sx={{ bgcolor: "#f0fdf4", color: "#16a34a", fontWeight: 600, fontSize: "10px" }} />
                      )}
                    </TableCell>

                    <TableCell align="right">
                      {row.is_overprivileged ? (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<BuildIcon />}
                          onClick={() => setSelectedIdentity(row)}
                          sx={{ textTransform: "none", fontWeight: 700, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}
                        >
                          Right-Size Privileges
                        </Button>
                      ) : (
                        <Chip label="OPTIMIZED" size="small" sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontWeight: 700 }} />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredIdentities.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Right-Size Least Privilege Policy Modal */}
      {selectedIdentity && (
        <Dialog open={Boolean(selectedIdentity)} onClose={() => setSelectedIdentity(null)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, color: "#0f172a" }}>
            Apply Least Privilege Remediation Policy: {selectedIdentity.name}
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" sx={{ color: "#475569", mb: 2 }}>
              CloudTrail audit log analysis indicates <strong>{selectedIdentity.name}</strong> only uses <strong>{selectedIdentity.used_permissions_count}</strong> out of <strong>{selectedIdentity.granted_permissions_count}</strong> granted permissions.
            </Typography>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#dc2626", mb: 0.5 }}>
              Unused Granted Services to Revoke:
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
              {selectedIdentity.unused_services.map((svc) => (
                <Chip key={svc} label={svc} size="small" color="error" variant="outlined" />
              ))}
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#0f172a", mb: 0.5 }}>
              Generated Least Privilege Policy Document (Scoped to Audit Log Trail):
            </Typography>
            <Box sx={{ p: 2, bgcolor: "rgba(63, 81, 181, 0.04)", color: "text.primary", borderRadius: "8px", fontFamily: "monospace", fontSize: "12px", whiteSpace: "pre-wrap", border: "1px solid rgba(63, 81, 181, 0.12)" }}>
              {selectedIdentity.recommended_policy}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setSelectedIdentity(null)} sx={{ textTransform: "none" }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => handleApplyLeastPrivilege(selectedIdentity.identity_id)}
              sx={{ textTransform: "none", fontWeight: 700, bgcolor: "#16a34a" }}
            >
              Apply Least Privilege Policy Now
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

export default CIEM;
