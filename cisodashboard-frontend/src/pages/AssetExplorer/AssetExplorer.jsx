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
  Badge,
  IconButton,
  Tooltip,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import StorageIcon from "@mui/icons-material/Storage";
import SecurityIcon from "@mui/icons-material/Security";
import PublicIcon from "@mui/icons-material/Public";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import WarningIcon from "@mui/icons-material/Warning";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloudIcon from "@mui/icons-material/Cloud";
import DnsIcon from "@mui/icons-material/Dns";
import api from "../../utils/api";
import PageShell, { EmptyState } from "../../components/common/PageShell";
import NoCloudWorkspace from "../../components/common/NoCloudWorkspace";

const DEFAULT_ASSETS = [];

const AssetExplorer = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL"); // ALL, PUBLIC, UNENCRYPTED, CRITICAL

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Selected Asset Dialog State
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetDetail, setAssetDetail] = useState({ relationships: [], history: [] });
  const [accounts, setAccounts] = useState([]);
  const [assetStats, setAssetStats] = useState(null);
  const [discovering, setDiscovering] = useState(false);
  const [accountFilter, setAccountFilter] = useState("ALL");

  useEffect(() => {
    fetchAssets();
  }, []);

  const inspectAsset = async (row) => {
    setSelectedAsset(row);
    try {
      const id = row.id || row.asset_id;
      const [rel, hist] = await Promise.all([
        api.get(`/api/v1/cloud/assets/${id}/relationships`),
        api.get(`/api/v1/cloud/assets/${id}/history`),
      ]);
      setAssetDetail({
        relationships: rel.data?.relationships || [],
        history: Array.isArray(hist.data) ? hist.data : [],
      });
    } catch {
      setAssetDetail({ relationships: [], history: [] });
    }
  };

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const [response, accountRes, statsRes] = await Promise.all([
        api.get("/api/v1/cloud/assets"),
        api.get("/api/v1/cloud/accounts"),
        api.get("/api/v1/cloud/assets/stats").catch(() => ({ data: null })),
      ]);
      setAccounts(Array.isArray(accountRes.data) ? accountRes.data : []);
      setAssetStats(statsRes.data || null);
      if (response.data && Array.isArray(response.data)) {
        const normalized = response.data.map((item) => ({
          ...item,
          asset_name: item.asset_name || item.name || "Cloud Asset",
          asset_id: item.asset_id || item.resource_id || item.id || "N/A",
          asset_type: item.asset_type || "COMPUTE",
          provider: item.provider || "AWS",
          region: item.region || "us-east-1",
          risk_score: item.risk_score ?? 0.0,
          compliance_status: item.compliance_status || "COMPLIANT",
        }));
        setAssets(normalized);
      } else {
        setAssets([]);
      }
    } catch (err) {
      console.warn("Could not fetch cloud assets:", err);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const filteredAssets = assets.filter((asset) => {
    const nameStr = (asset.asset_name || asset.name || "").toLowerCase();
    const idStr = (asset.asset_id || asset.resource_id || asset.id || "").toLowerCase();
    const ipStr = (asset.ip_address || "").toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch =
      nameStr.includes(query) || idStr.includes(query) || ipStr.includes(query);

    const matchesType =
      typeFilter === "ALL" || (asset.asset_type || "").toUpperCase() === typeFilter.toUpperCase();

    const matchesProvider =
      providerFilter === "ALL" || (asset.provider || "").toUpperCase() === providerFilter.toUpperCase();

    let matchesRisk = true;
    if (riskFilter === "PUBLIC") matchesRisk = asset.is_public === true;
    if (riskFilter === "UNENCRYPTED") matchesRisk = asset.is_encrypted === false;
    if (riskFilter === "CRITICAL") matchesRisk = (asset.critical_findings_count || 0) > 0 || (asset.risk_score || 0) >= 8;
    if (riskFilter === "HIGH") matchesRisk = (asset.risk_score || 0) >= 6;

    return matchesSearch && matchesType && matchesProvider && matchesRisk;
  });

  // Aggregated Counters for Badges
  const totalAssets = assetStats?.total ?? assets.length;
  const publicCount = assets.filter((a) => a.is_public).length;
  const unencryptedCount = assets.filter((a) => !a.is_encrypted).length;
  const criticalFindingsAssetsCount = assets.filter((a) => (a.critical_findings_count || 0) > 0).length;

  const getTypeChip = (type) => {
    let label = type;
    let color = "#475569";
    let bg = "#f1f5f9";

    if (type === "COMPUTE") {
      color = "#2563eb";
      bg = "#dbeafe";
    } else if (type === "STORAGE") {
      color = "#d97706";
      bg = "#fef3c7";
    } else if (type === "DATABASE") {
      color = "#059669";
      bg = "#d1fae5";
    } else if (type === "K8S_POD") {
      color = "#7c3aed";
      bg = "#ede9fe";
    }

    return (
      <Chip
        label={label}
        size="small"
        sx={{
          bgcolor: bg,
          color: color,
          fontWeight: 700,
          borderRadius: "4px",
          fontSize: "11px",
        }}
      />
    );
  };

  return (
    <PageShell
      title="Asset Explorer"
      subtitle="Unified multi-cloud inventory across AWS, Azure, GCP, and Kubernetes. Empty until an account is connected and discovered."
      actions={
        <Box sx={{ display: "flex", gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Account</InputLabel>
            <Select value={accountFilter} label="Account" onChange={(e) => setAccountFilter(e.target.value)}>
              <MenuItem value="ALL">All accounts</MenuItem>
              {accounts.map((item) => (
                <MenuItem key={item.account_id || item.id} value={item.account_id || item.id}>{item.name || item.account_id}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            disabled={!accounts.length || discovering}
            onClick={async () => {
              setDiscovering(true);
              try {
                if (accountFilter !== "ALL") {
                  await api.post(`/api/v1/cloud/assets/discover/${accountFilter}`);
                } else {
                  await api.post("/api/v1/cloud/assets/discover");
                }
              } catch (err) {
                console.warn(err);
              } finally {
                setDiscovering(false);
              }
              fetchAssets();
            }}
            sx={{ textTransform: "none", fontWeight: 600, bgcolor: "#3f51b5" }}
          >
            {discovering ? "Discovering..." : "Run Discovery"}
          </Button>
        </Box>
      }
    >
      {accounts.length === 0 && !loading ? <NoCloudWorkspace title="No assets to explore" message="Connect a cloud account, then run discovery to populate this inventory." /> : null}

      {/* Metric Badge Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => setRiskFilter("ALL")}
            sx={{
              cursor: "pointer",
              borderLeft: "4px solid #2563eb",
              bgcolor: riskFilter === "ALL" ? "#f8fafc" : "#ffffff",
              transition: "transform 0.15s ease",
              "&:hover": { transform: "translateY(-2px)" },
            }}
          >
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Total Discovered Assets
                </Typography>
                <StorageIcon sx={{ color: "#2563eb" }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#0f172a" }}>
                {totalAssets}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => setRiskFilter("PUBLIC")}
            sx={{
              cursor: "pointer",
              borderLeft: "4px solid #dc2626",
              bgcolor: riskFilter === "PUBLIC" ? "#fef2f2" : "#ffffff",
              transition: "transform 0.15s ease",
              "&:hover": { transform: "translateY(-2px)" },
            }}
          >
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Publicly Exposed Assets
                </Typography>
                <Badge badgeContent={publicCount} color="error">
                  <PublicIcon sx={{ color: "#dc2626" }} />
                </Badge>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#dc2626" }}>
                {publicCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => setRiskFilter("UNENCRYPTED")}
            sx={{
              cursor: "pointer",
              borderLeft: "4px solid #d97706",
              bgcolor: riskFilter === "UNENCRYPTED" ? "#fffbeb" : "#ffffff",
              transition: "transform 0.15s ease",
              "&:hover": { transform: "translateY(-2px)" },
            }}
          >
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Unencrypted Storage/DB
                </Typography>
                <Badge badgeContent={unencryptedCount} color="warning">
                  <LockOpenIcon sx={{ color: "#d97706" }} />
                </Badge>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#d97706" }}>
                {unencryptedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => setRiskFilter("CRITICAL")}
            sx={{
              cursor: "pointer",
              borderLeft: "4px solid #7c3aed",
              bgcolor: riskFilter === "CRITICAL" ? "#f5f3ff" : "#ffffff",
              transition: "transform 0.15s ease",
              "&:hover": { transform: "translateY(-2px)" },
            }}
          >
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Assets with Critical Risk
                </Typography>
                <Badge badgeContent={criticalFindingsAssetsCount} color="secondary">
                  <WarningIcon sx={{ color: "#7c3aed" }} />
                </Badge>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#7c3aed" }}>
                {criticalFindingsAssetsCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Toolbar */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search asset name, ARN, IP, or endpoint..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: "#94a3b8", mr: 1 }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Asset Category</InputLabel>
              <Select value={typeFilter} label="Asset Category" onChange={(e) => setTypeFilter(e.target.value)}>
                <MenuItem value="ALL">All Asset Categories</MenuItem>
                <MenuItem value="COMPUTE">Compute (EC2, VMs)</MenuItem>
                <MenuItem value="STORAGE">Storage (S3, Blob)</MenuItem>
                <MenuItem value="DATABASE">Databases (RDS, SQL)</MenuItem>
                <MenuItem value="K8S_POD">Kubernetes Pods</MenuItem>
              </Select>
            </FormControl>
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

          <Grid item xs={12} sm={12} md={2}>
            {riskFilter !== "ALL" && (
              <Button
                variant="text"
                size="small"
                onClick={() => setRiskFilter("ALL")}
                sx={{ textTransform: "none", color: "#64748b" }}
              >
                Clear Risk Filter
              </Button>
            )}
          </Grid>
        </Grid>
      </Card>

      {/* Data Table */}
      <TableContainer component={Paper} sx={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}>
        {loading && <LinearProgress />}
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Asset Name & ID</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Category & Provider</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Account / Region</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>IP / Endpoint</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Public Exposure</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Encryption</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Security Risk Findings</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: "#334155" }}>Inspect</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredAssets.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <EmptyState message={accounts.length ? "No assets match the current filters." : "No discovered assets yet."} />
                </TableCell>
              </TableRow>
            )}
            {filteredAssets.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
              <TableRow key={row.asset_id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a" }}>
                    {row.asset_name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b", fontFamily: "monospace", display: "block" }}>
                    {row.asset_id.length > 35 ? `${row.asset_id.substring(0, 35)}...` : row.asset_id}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                    {getTypeChip(row.asset_type)}
                    <Chip label={row.provider} size="small" variant="outlined" sx={{ fontSize: "10px", fontWeight: 700 }} />
                  </Box>
                </TableCell>

                <TableCell>
                  <Typography variant="body2" sx={{ color: "#334155" }}>
                    {row.account_name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    {row.region}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: "monospace", color: "#334155" }}>
                    {row.ip_address || "N/A"}
                  </Typography>
                </TableCell>

                <TableCell>
                  {row.is_public ? (
                    <Chip
                      icon={<PublicIcon style={{ fontSize: 14 }} />}
                      label="PUBLIC"
                      size="small"
                      sx={{ bgcolor: "#fef2f2", color: "#dc2626", fontWeight: 700, fontSize: "11px" }}
                    />
                  ) : (
                    <Chip
                      icon={<LockIcon style={{ fontSize: 14 }} />}
                      label="PRIVATE"
                      size="small"
                      sx={{ bgcolor: "#f0fdf4", color: "#16a34a", fontWeight: 700, fontSize: "11px" }}
                    />
                  )}
                </TableCell>

                <TableCell>
                  {row.is_encrypted === true ? (
                    <Chip label="ENCRYPTED" size="small" sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontWeight: 600 }} />
                  ) : row.is_encrypted === false ? (
                    <Chip label="UNENCRYPTED" size="small" sx={{ bgcolor: "#fff3e0", color: "#d97706", fontWeight: 700 }} />
                  ) : (
                    <Chip label="UNKNOWN" size="small" />
                  )}
                </TableCell>

                <TableCell>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    {row.critical_findings_count > 0 && (
                      <Badge badgeContent={row.critical_findings_count} color="error">
                        <Chip label="CRITICAL" size="small" sx={{ bgcolor: "#fef2f2", color: "#dc2626", fontWeight: 700 }} />
                      </Badge>
                    )}
                    {row.high_findings_count > 0 && (
                      <Badge badgeContent={row.high_findings_count} color="warning">
                        <Chip label="HIGH" size="small" sx={{ bgcolor: "#fffbeba", color: "#d97706", fontWeight: 700 }} />
                      </Badge>
                    )}
                    {row.critical_findings_count === 0 && row.high_findings_count === 0 && (
                      <Chip label="CLEAN" size="small" sx={{ bgcolor: "#f0fdf4", color: "#16a34a", fontWeight: 600 }} />
                    )}
                  </Box>
                </TableCell>

                <TableCell align="right">
                  <Tooltip title="View Asset Security Details">
                    <IconButton size="small" onClick={() => inspectAsset(row)} sx={{ color: "#2563eb" }}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredAssets.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      {/* Asset Detail Inspection Dialog Modal */}
      {selectedAsset && (
        <Dialog open={Boolean(selectedAsset)} onClose={() => setSelectedAsset(null)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, color: "#0f172a" }}>
            Asset Inspection: {selectedAsset.asset_name}
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  Full Asset Identification Identifier (ARN / ID)
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 600, mb: 2 }}>
                  {selectedAsset.asset_id}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  Asset Category & Provider
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mt: 0.5, mb: 2 }}>
                  {getTypeChip(selectedAsset.asset_type)}
                  <Chip label={selectedAsset.provider} size="small" variant="outlined" />
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  Connected Account & Region
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
                  {selectedAsset.account_name} ({selectedAsset.region})
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "#64748b" }}>
                  Network Accessibility
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
                  IP Endpoint: {selectedAsset.ip_address || "N/A"} ({selectedAsset.is_public ? "Public Access Allowed" : "Isolated Private Network"})
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: "#64748b" }}>Related assets</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {(assetDetail.relationships || []).map((item) => item.name).join(", ") || "None in the same account."}
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b" }}>History</Typography>
                <Typography variant="body2">
                  {(assetDetail.history || []).map((item) => `${item.event} · ${item.at || ""}`).join(" | ") || "No discovery history."}
                </Typography>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setSelectedAsset(null)} variant="contained" sx={{ textTransform: "none", bgcolor: "#2563eb" }}>
              Close Inspection
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </PageShell>
  );
};

export default AssetExplorer;
