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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  CircularProgress,
  LinearProgress,
  Snackbar,
  Alert,
  InputAdornment,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SyncIcon from "@mui/icons-material/Sync";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import RefreshIcon from "@mui/icons-material/Refresh";
import StorageIcon from "@mui/icons-material/Storage";
import SecurityIcon from "@mui/icons-material/Security";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import DeleteIcon from "@mui/icons-material/Delete";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import NetworkCheckIcon from "@mui/icons-material/NetworkCheck";
import LockIcon from "@mui/icons-material/Lock";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import api from "../../utils/api";

const DEFAULT_ACCOUNTS = [];

const CloudAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [openConnectModal, setOpenConnectModal] = useState(false);

  // Form State
  const [newAccount, setNewAccount] = useState({
    account_name: "",
    account_id: "",
    provider: "AWS",
    environment: "Production",
    region: "us-east-1",
    access_key: "",
    secret_key: "",
    tenant_id: "",
    client_id: "",
    client_secret: "",
    service_account_json: "",
  });

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditAccount, setAuditAccount] = useState(null);
  const [auditResult, setAuditResult] = useState(null);

  useEffect(() => {
    fetchCloudAccounts();
  }, []);

  const fetchCloudAccounts = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/v1/cloud/accounts");
      if (response.data && Array.isArray(response.data)) {
        const normalized = response.data.map((item) => ({
          ...item,
          account_name: item.account_name || item.name || "Cloud Account",
          account_id: item.account_id || item.id || "N/A",
          environment: item.environment || item.region || "Production",
          provider: item.provider || "AWS",
          status: item.status || "ACTIVE",
          total_assets: item.total_assets ?? item.assets_count ?? 0,
          posture_score: item.posture_score ?? null,
          last_synced: item.last_synced ? String(item.last_synced) : "Never",
        }));
        setAccounts(normalized);
      } else {
        setAccounts([]);
      }
    } catch (err) {
      console.warn("Could not fetch cloud accounts:", err);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (accountId) => {
    try {
      await api.delete(`/api/v1/cloud/accounts/${accountId}`);
      setAccounts((prev) => prev.filter((a) => a.account_id !== accountId && a.id !== accountId));
      setNotification({
        open: true,
        message: `Disconnected cloud account ${accountId}`,
        severity: "info",
      });
    } catch (err) {
      setNotification({
        open: true,
        message: err.response?.data?.detail || `Failed to disconnect ${accountId}`,
        severity: "error",
      });
    }
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      await api.post("/api/v1/cloud/accounts/sync");
      await api.post("/api/v1/cloud/scan");
      setNotification({
        open: true,
        message: "Triggered discovery sync and CSPM posture scan for all accounts.",
        severity: "success",
      });
      fetchCloudAccounts();
    } catch (err) {
      setNotification({
        open: true,
        message: err.response?.data?.detail || "Sync failed. Confirm the CSPM service is running.",
        severity: "error",
      });
    } finally {
      setTimeout(() => setSyncingAll(false), 1200);
    }
  };

  const handleSyncAccount = async (accountId) => {
    try {
      await api.post(`/api/v1/cloud/accounts/${accountId}/sync`);
      setNotification({
        open: true,
        message: `Syncing account ${accountId}...`,
        severity: "success",
      });
      fetchCloudAccounts();
    } catch (err) {
      setNotification({
        open: true,
        message: err.response?.data?.detail || `Sync failed for ${accountId}`,
        severity: "error",
      });
    }
  };

  const handleEditAccount = async (account) => {
    const name = window.prompt("Account display name", account.account_name || account.name || "");
    if (!name) return;
    const region = window.prompt("Region", account.region || "us-east-1");
    try {
      await api.patch(`/api/v1/cloud/accounts/${account.account_id || account.id}`, { name, region });
      setNotification({ open: true, message: "Account updated", severity: "success" });
      fetchCloudAccounts();
    } catch (err) {
      setNotification({ open: true, message: err.response?.data?.detail || "Update failed", severity: "error" });
    }
  };

  const handleAuditPermissions = async (account) => {
    const accountId = account.account_id || account.id;
    setAuditAccount(account);
    setAuditOpen(true);
    setAuditLoading(true);
    setAuditResult(null);
    try {
      const res = await api.get(`/api/v1/cloud/accounts/${accountId}/audit-permissions`);
      setAuditResult({
        type: "success",
        message: res.data?.message || `IAM audit completed for ${accountId}`,
        permissions: res.data?.permissions_summary,
        policy: res.data?.recommended_iam_policy,
      });
    } catch (err) {
      setAuditResult({
        type: "error",
        message: err.response?.data?.detail || `IAM audit failed for ${accountId}`,
      });
    } finally {
      setAuditLoading(false);
    }
  };

  // Modal & Validation State
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null); // { type: "success" | "error", message: "" }
  const [formErrors, setFormErrors] = useState({});

  const handleCopyPolicy = (policyObj) => {
    if (!policyObj) return;
    const jsonStr = typeof policyObj === "string" ? policyObj : JSON.stringify(policyObj, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setNotification({
      open: true,
      message: "Copied Recommended IAM Policy JSON to clipboard!",
      severity: "success",
    });
  };

  const handleTestConnection = async () => {
    setTestResult(null);
    const errors = {};

    if (!newAccount.account_name.trim()) errors.account_name = "Account Name is required";
    if (!newAccount.account_id.trim()) errors.account_id = "Account ID is required";
    if (!newAccount.region.trim()) errors.region = "Cloud Region is required";

    if (newAccount.provider === "AWS") {
      if (!newAccount.access_key.trim()) errors.access_key = "AWS Access Key ID is required";
      if (!newAccount.secret_key.trim()) errors.secret_key = "AWS Secret Access Key is required";
    } else if (newAccount.provider === "AZURE") {
      if (!newAccount.tenant_id.trim()) errors.tenant_id = "Azure Tenant ID is required";
      if (!newAccount.client_id.trim()) errors.client_id = "Azure Client ID is required";
      if (!newAccount.client_secret.trim()) errors.client_secret = "Azure Client Secret is required";
    } else if (newAccount.provider === "GCP") {
      if (!newAccount.service_account_json.trim()) errors.service_account_json = "GCP Service Account Key JSON is required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setTestResult({
        type: "error",
        message: "Please fill in all required credential fields before testing connection.",
      });
      return;
    }

    setFormErrors({});
    setTestingConnection(true);

    try {
      const payload = {
        provider: newAccount.provider,
        account_id: newAccount.account_id,
        region: newAccount.region || "us-east-1",
        credentials: {
          access_key: newAccount.access_key,
          secret_key: newAccount.secret_key,
          tenant_id: newAccount.tenant_id,
          client_id: newAccount.client_id,
          client_secret: newAccount.client_secret,
          service_account_json: newAccount.service_account_json,
        },
      };

      const res = await api.post("/api/v1/cloud/accounts/test-connection", payload);
      setTestResult({
        type: "success",
        message: res.data?.message || `Successfully verified ${newAccount.provider} connection!`,
        permissions: res.data?.permissions_summary,
        policy: res.data?.recommended_iam_policy,
      });
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || "Connection verification failed. Please check your credentials.";
      setTestResult({
        type: "error",
        message: detail,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleCreateAccount = async () => {
    setTestResult(null);
    const errors = {};

    if (!newAccount.account_name.trim()) errors.account_name = "Account Name is required";
    if (!newAccount.account_id.trim()) errors.account_id = "Account ID is required";
    if (!newAccount.region.trim()) errors.region = "Primary Cloud Region is required";

    if (newAccount.provider === "AWS") {
      if (!newAccount.access_key.trim()) errors.access_key = "AWS Access Key ID is required";
      if (!newAccount.secret_key.trim()) errors.secret_key = "AWS Secret Access Key is required";
    } else if (newAccount.provider === "AZURE") {
      if (!newAccount.tenant_id.trim()) errors.tenant_id = "Azure Tenant ID is required";
      if (!newAccount.client_id.trim()) errors.client_id = "Azure Client ID is required";
      if (!newAccount.client_secret.trim()) errors.client_secret = "Azure Client Secret is required";
    } else if (newAccount.provider === "GCP") {
      if (!newAccount.service_account_json.trim()) errors.service_account_json = "GCP Service Account Key JSON is required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setTestResult({
        type: "error",
        message: "All credential fields are required. Please fill in all mandatory inputs.",
      });
      return;
    }

    setFormErrors({});

    let credentials = {};
    if (newAccount.provider === "AWS") {
      credentials = { access_key: newAccount.access_key, secret_key: newAccount.secret_key };
    } else if (newAccount.provider === "AZURE") {
      credentials = { tenant_id: newAccount.tenant_id, client_id: newAccount.client_id, client_secret: newAccount.client_secret };
    } else if (newAccount.provider === "GCP") {
      credentials = { credentials_file: newAccount.service_account_json };
    }

    try {
      const payload = {
        name: newAccount.account_name,
        account_id: newAccount.account_id,
        provider: newAccount.provider,
        region: newAccount.region || "us-east-1",
        credentials: credentials,
      };

      const res = await api.post("/api/v1/cloud/accounts", payload);
      const createdAcc = {
        ...(res.data || payload),
        account_name: newAccount.account_name,
        account_id: newAccount.account_id,
        environment: newAccount.environment || newAccount.region,
        status: "ACTIVE",
        is_live: true,
        is_live_configured: true,
        data_origin: "LIVE_CLOUD_SDK",
        total_assets: 0,
        posture_score: null,
        last_synced: "Pending sync",
      };

      setAccounts((prev) => [createdAcc, ...prev]);

      // Trigger immediate scan
      try {
        await api.post(`/api/v1/cloud/accounts/${newAccount.account_id}/sync`);
      } catch (e) { }

      setNotification({
        open: true,
        message: `Connected ${newAccount.provider} account ${newAccount.account_id} with Live SDK Ingestion!`,
        severity: "success",
      });

      setOpenConnectModal(false);
      setTestResult(null);
      setNewAccount({
        account_name: "",
        account_id: "",
        provider: "AWS",
        environment: "Production",
        region: "us-east-1",
        access_key: "",
        secret_key: "",
        tenant_id: "",
        client_id: "",
        client_secret: "",
        service_account_json: "",
      });
    } catch (err) {
      setNotification({
        open: true,
        message: err.response?.data?.detail || "Could not connect the cloud account. Credentials were not saved.",
        severity: "error",
      });
    }
  };

  const filteredAccounts = accounts.filter((acc) => {
    const nameStr = (acc.account_name || acc.name || "").toLowerCase();
    const idStr = (acc.account_id || acc.id || "").toLowerCase();
    const envStr = (acc.environment || acc.region || "").toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch =
      nameStr.includes(query) || idStr.includes(query) || envStr.includes(query);

    const matchesProvider =
      providerFilter === "ALL" || (acc.provider || "").toUpperCase() === providerFilter.toUpperCase();

    return matchesSearch && matchesProvider;
  });

  const getStatusChip = (status) => {
    if (status === "ACTIVE") {
      return (
        <Chip
          icon={<CheckCircleIcon style={{ fontSize: 16 }} />}
          label="ACTIVE"
          size="small"
          sx={{
            bgcolor: "#e8f5e9",
            color: "#2e7d32",
            fontWeight: 600,
            borderRadius: "6px",
          }}
        />
      );
    } else if (status === "SYNCING") {
      return (
        <Chip
          icon={<CircularProgress size={12} color="inherit" />}
          label="SYNCING"
          size="small"
          sx={{
            bgcolor: "#e3f2fd",
            color: "#0288d1",
            fontWeight: 600,
            borderRadius: "6px",
          }}
        />
      );
    } else {
      return (
        <Chip
          icon={<WarningIcon style={{ fontSize: 16 }} />}
          label="WARNING"
          size="small"
          sx={{
            bgcolor: "#fff3e0",
            color: "#ed6c02",
            fontWeight: 600,
            borderRadius: "6px",
          }}
        />
      );
    }
  };

  const getProviderChip = (provider) => {
    let color = "#1976d2";
    let bg = "#e3f2fd";
    const pStr = (provider || "AWS").toUpperCase();
    if (pStr === "AWS") {
      color = "#ff9900";
      bg = "#fff8e1";
    } else if (pStr === "AZURE") {
      color = "#0089d6";
      bg = "#e1f5fe";
    } else if (pStr === "GCP") {
      color = "#4285f4";
      bg = "#e8eaf6";
    }

    return (
      <Chip
        label={pStr}
        size="small"
        sx={{
          bgcolor: bg,
          color: color,
          fontWeight: 700,
          borderRadius: "4px",
        }}
      />
    );
  };

  const formatHumanTime = (isoString) => {
    if (!isoString || isoString === "Just now") return { relative: "Just now", full: "Just now" };
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return { relative: String(isoString), full: String(isoString) };

      const full = date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      let relative = "Just now";
      if (diffSecs >= 30 && diffSecs < 60) relative = `${diffSecs}s ago`;
      else if (diffMins >= 1 && diffMins < 60) relative = `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
      else if (diffHours >= 1 && diffHours < 24) relative = `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;
      else if (diffDays >= 1) relative = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

      return { relative, full };
    } catch (e) {
      return { relative: String(isoString), full: String(isoString) };
    }
  };

  const getConnectionChip = (isLive, dataOrigin, isConfigured) => {
    const live = Boolean(isLive || (dataOrigin && dataOrigin.includes("LIVE")) || isConfigured);
    return (
      <Tooltip
        title={
          live
            ? "Connected to Live Cloud Provider SDK API (Real Ingestion Active)"
            : "Operating in Seeded Telemetry Mode (No AWS/Azure/GCP credentials configured in environment)"
        }
      >
        <Chip
          label={live ? "🟢 Live Cloud SDK" : "🟡 Seeded Telemetry"}
          size="small"
          variant="outlined"
          sx={{
            fontSize: "11px",
            fontWeight: 700,
            borderColor: live ? "#16a34a" : "#d97706",
            color: live ? "#15803d" : "#b45309",
            bgcolor: live ? "#f0fdf4" : "#fffbeb",
            borderRadius: "6px",
          }}
        />
      </Tooltip>
    );
  };

  // Aggregated Stats
  const totalCount = accounts.length;
  const activeCount = accounts.filter((a) => a.status === "ACTIVE").length;
  const totalAssets = accounts.reduce((acc, curr) => acc + (curr.total_assets || 0), 0);
  const scored = accounts.filter((item) => item.posture_score != null);
  const avgScore =
    scored.length > 0
      ? (scored.reduce((acc, curr) => acc + Number(curr.posture_score || 0), 0) / scored.length).toFixed(1)
      : "—";

  return (
    <Box sx={{ maxWidth: "100%", width: "100%" }}>
      {/* Top Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e293b" }}>
            Cloud Accounts
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
            AWS Accounts, Azure Subscriptions & GCP Projects Integration & Posture Sync
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={syncingAll ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
            onClick={handleSyncAll}
            disabled={syncingAll}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            {syncingAll ? "Syncing Platform..." : "Sync All Accounts"}
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenConnectModal(true)}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              bgcolor: "#2563eb",
              "&:hover": { bgcolor: "#1d4ed8" },
            }}
          >
            Connect Cloud Account
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
                  Total Connected Accounts
                </Typography>
                <CloudQueueIcon sx={{ color: "#2563eb" }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#0f172a" }}>
                {totalCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #16a34a" }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Active Posture Sync
                </Typography>
                <CheckCircleIcon sx={{ color: "#16a34a" }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#0f172a" }}>
                {activeCount} / {totalCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #0288d1" }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Monitored Cloud Assets
                </Typography>
                <StorageIcon sx={{ color: "#0288d1" }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#0f172a" }}>
                {totalAssets.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #7c3aed" }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Average CSPM Score
                </Typography>
                <SecurityIcon sx={{ color: "#7c3aed" }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#0f172a" }}>
                {avgScore === "—" ? "—" : `${avgScore}%`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter & Search Bar */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by account name, ID, or environment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: "#94a3b8", mr: 1 }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Filter by Provider</InputLabel>
              <Select
                value={providerFilter}
                label="Filter by Provider"
                onChange={(e) => setProviderFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Cloud Providers</MenuItem>
                <MenuItem value="AWS">Amazon Web Services (AWS)</MenuItem>
                <MenuItem value="AZURE">Microsoft Azure</MenuItem>
                <MenuItem value="GCP">Google Cloud Platform (GCP)</MenuItem>
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
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Provider</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Account Name & ID</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Environment / Region</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Ingestion Mode</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Sync Status</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>CSPM Posture Score</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Total Assets</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Last Synced</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: "#334155" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6, bgcolor: "#ffffff" }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyItems: "center", py: 2 }}>
                    <CloudQueueIcon sx={{ fontSize: 56, color: "#94a3b8", mb: 1.5 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", mb: 0.5 }}>
                      No Cloud Accounts Connected
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#64748b", maxWidth: 520, mb: 2.5, textAlign: "center" }}>
                      RiskTrix is operating in pure production mode. No dummy or fallback telemetry is displayed. Connect your AWS, Azure, or GCP cloud account using actual credentials to begin live resource ingestion.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setOpenConnectModal(true)}
                      sx={{ textTransform: "none", fontWeight: 700, px: 3, py: 1, bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}
                    >
                      Connect Cloud Account
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredAccounts.map((row) => {
                const accName = row.account_name || row.name || "Cloud Account";
                const accId = row.account_id || row.id || "N/A";
                const accEnv = row.environment || row.region || "Production";
                const accAssets = row.total_assets ?? row.assets_count ?? 0;
                const accScore = row.posture_score;
                const accSyncedRaw = row.last_synced ? String(row.last_synced) : "Never";
                const timeInfo = formatHumanTime(accSyncedRaw);

                return (
                  <TableRow key={accId} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                    <TableCell>{getProviderChip(row.provider || "AWS")}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a" }}>
                        {accName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748b", fontFamily: "monospace" }}>
                        {accId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={accEnv} size="small" variant="outlined" sx={{ mr: 1, fontSize: "11px" }} />
                      <Typography variant="caption" sx={{ color: "#64748b" }}>
                        {row.region || accEnv}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {getConnectionChip(row.is_live, row.data_origin, row.is_live_configured)}
                    </TableCell>
                    <TableCell>{getStatusChip(row.status)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {accScore == null ? (
                          <Typography variant="body2" color="text.secondary">Pending scan</Typography>
                        ) : (
                          <>
                            <Box sx={{ width: "60px" }}>
                              <LinearProgress
                                variant="determinate"
                                value={accScore}
                                color={accScore >= 85 ? "success" : accScore >= 70 ? "warning" : "error"}
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "#1e293b" }}>
                              {accScore}%
                            </Typography>
                          </>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155" }}>
                        {accAssets} resources
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={`Full Timestamp: ${timeInfo.full}`}>
                        <Typography variant="caption" sx={{ color: "#475569", fontWeight: 600, cursor: "help" }}>
                          {timeInfo.relative}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                        <Tooltip title="Edit account">
                          <IconButton size="small" onClick={() => handleEditAccount(row)} sx={{ color: "#455a64" }}>
                            <AssignmentTurnedInIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Audit IAM permissions">
                          <IconButton size="small" onClick={() => handleAuditPermissions(row)} sx={{ color: "#3f51b5" }}>
                            <SecurityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Trigger On-Demand Posture Sync">
                          <IconButton size="small" onClick={() => handleSyncAccount(row.account_id || row.id)} sx={{ color: "#2563eb" }}>
                            <RefreshIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Disconnect Cloud Account">
                          <IconButton size="small" onClick={() => handleDeleteAccount(row.account_id || row.id)} sx={{ color: "#ef4444" }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={auditOpen} onClose={() => setAuditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          IAM Permission Audit
          {auditAccount ? ` · ${auditAccount.account_name || auditAccount.name || auditAccount.account_id}` : ""}
        </DialogTitle>
        <DialogContent>
          {auditLoading && <LinearProgress sx={{ mb: 2 }} />}
          {auditResult && (
            <Box>
              <Alert severity={auditResult.type} sx={{ mb: 2 }}>
                {auditResult.message}
              </Alert>
              {auditResult.permissions && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#16a34a", display: "block", mb: 0.5 }}>
                    Verified permissions ({auditResult.permissions.granted_count || 0})
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1.5 }}>
                    {(auditResult.permissions.granted || []).map((item, idx) => (
                      <Chip key={`granted-${idx}`} label={item.action} size="small" sx={{ bgcolor: "#dcfce7", color: "#15803d" }} />
                    ))}
                  </Box>
                  {(auditResult.permissions.missing_count || 0) > 0 && (
                    <>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "#c2410c", display: "block", mb: 0.5 }}>
                        Missing permissions ({auditResult.permissions.missing_count})
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1.5 }}>
                        {(auditResult.permissions.missing || []).map((item, idx) => (
                          <Chip key={`missing-${idx}`} label={item.action} size="small" sx={{ bgcolor: "#fff7ed", color: "#c2410c" }} />
                        ))}
                      </Box>
                    </>
                  )}
                  {auditResult.policy && (
                    <Button size="small" startIcon={<ContentCopyIcon />} onClick={() => handleCopyPolicy(auditResult.policy)}>
                      Copy recommended IAM policy
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAuditOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Connect Account Dialog Modal - Ultra-Sleek Enterprise Redesign */}
      <Dialog
        open={openConnectModal}
        onClose={() => {
          setOpenConnectModal(false);
          setTestResult(null);
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
              <SecurityIcon sx={{ color: "#38bdf8", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#ffffff", fontSize: "16px", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
                Connect Enterprise Cloud Account
              </Typography>
              <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "12px" }}>
                Onboard AWS, Azure, or GCP cloud environments for live posture scanning
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => {
              setOpenConnectModal(false);
              setTestResult(null);
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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {/* 1. Visual Cloud Provider Card Selection Grid (3 Columns) */}
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
                1. Select Cloud Service Provider
              </Typography>
              <Grid container spacing={1.5}>
                {[
                  { id: "AWS", name: "AWS Cloud", icon: "☁️", color: "#ff9900", bg: "#fff8e1", desc: "Amazon Web Services" },
                  { id: "AZURE", name: "MS Azure", icon: "🔷", color: "#0089d6", bg: "#e1f5fe", desc: "Microsoft Azure" },
                  { id: "GCP", name: "Google Cloud", icon: "🌐", color: "#4285f4", bg: "#e8eaf6", desc: "Google Cloud Platform" },
                ].map((p) => {
                  const isSel = newAccount.provider === p.id;
                  return (
                    <Grid item xs={4} key={p.id}>
                      <Box
                        onClick={() => {
                          setNewAccount({ ...newAccount, provider: p.id, region: p.id === "AWS" ? "us-east-1" : p.id === "AZURE" ? "eastus" : "us-central1" });
                          setTestResult(null);
                          setFormErrors({});
                        }}
                        sx={{
                          p: 1.5,
                          borderRadius: "10px",
                          cursor: "pointer",
                          border: `2px solid ${isSel ? p.color : "#e2e8f0"}`,
                          bgcolor: isSel ? p.bg : "#f8fafc",
                          transition: "all 0.2s ease-in-out",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          textAlign: "center",
                          gap: 0.5,
                          "&:hover": {
                            borderColor: isSel ? p.color : "#cbd5e1",
                            bgcolor: isSel ? p.bg : "#f1f5f9",
                            transform: "translateY(-1px)",
                          },
                        }}
                      >
                        <Typography sx={{ fontSize: "24px", lineHeight: 1 }}>{p.icon}</Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: isSel ? 800 : 600,
                            color: isSel ? "#0f172a" : "#334155",
                            fontSize: "13px",
                          }}
                        >
                          {p.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748b", fontSize: "10px" }}>
                          {p.desc}
                        </Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>

            {/* 2. Account Metadata Section */}
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
              2. Account Details & Region
            </Typography>

            {/* Account / Subscription Display Name */}
            <TextField
              required
              label="Account / Subscription Name"
              size="small"
              fullWidth
              placeholder={
                newAccount.provider === "AWS"
                  ? "e.g. AWS Production Infrastructure"
                  : newAccount.provider === "AZURE"
                    ? "e.g. Azure Enterprise Production Subscription"
                    : "e.g. GCP Analytics Production Project"
              }
              value={newAccount.account_name}
              onChange={(e) => {
                setNewAccount({ ...newAccount, account_name: e.target.value });
                if (formErrors.account_name) setFormErrors({ ...formErrors, account_name: null });
              }}
              error={Boolean(formErrors.account_name)}
              helperText={formErrors.account_name}
              InputProps={{
                startAdornment: <CloudQueueIcon sx={{ color: "#94a3b8", mr: 1, fontSize: 18 }} />,
              }}
              sx={{
                "& .MuiOutlinedInput-root": { borderRadius: "8px" },
              }}
            />

            {/* Account ID / Subscription GUID */}
            <TextField
              required
              label={
                newAccount.provider === "AWS"
                  ? "AWS Account ID (12 digits)"
                  : newAccount.provider === "AZURE"
                    ? "Azure Subscription GUID"
                    : "GCP Project ID"
              }
              size="small"
              fullWidth
              placeholder={
                newAccount.provider === "AWS"
                  ? "123456789012"
                  : newAccount.provider === "AZURE"
                    ? "00000000-0000-0000-0000-000000000000"
                    : "risktrix-prod-gcp-01"
              }
              value={newAccount.account_id}
              onChange={(e) => {
                setNewAccount({ ...newAccount, account_id: e.target.value });
                if (formErrors.account_id) setFormErrors({ ...formErrors, account_id: null });
              }}
              error={Boolean(formErrors.account_id)}
              helperText={formErrors.account_id}
              InputProps={{
                startAdornment: <LockIcon sx={{ color: "#94a3b8", mr: 1, fontSize: 18 }} />,
              }}
              sx={{
                "& .MuiOutlinedInput-root": { borderRadius: "8px" },
              }}
            />

            {/* Environment & Primary Region Row */}
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <FormControl fullWidth size="small" required sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}>
                  <InputLabel>Environment</InputLabel>
                  <Select
                    value={newAccount.environment}
                    label="Environment"
                    onChange={(e) => setNewAccount({ ...newAccount, environment: e.target.value })}
                  >
                    <MenuItem value="Production">Production</MenuItem>
                    <MenuItem value="Staging">Staging</MenuItem>
                    <MenuItem value="Development">Development</MenuItem>
                    <MenuItem value="QA">QA / Sandbox</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6}>
                <FormControl fullWidth size="small" required sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}>
                  <InputLabel>Primary Cloud Region</InputLabel>
                  <Select
                    value={newAccount.region}
                    label="Primary Cloud Region"
                    onChange={(e) => {
                      setNewAccount({ ...newAccount, region: e.target.value });
                      if (formErrors.region) setFormErrors({ ...formErrors, region: null });
                    }}
                  >
                    {newAccount.provider === "AWS" && [
                      <MenuItem key="us-east-1" value="us-east-1">us-east-1 (N. Virginia)</MenuItem>,
                      <MenuItem key="us-west-2" value="us-west-2">us-west-2 (Oregon)</MenuItem>,
                      <MenuItem key="eu-west-1" value="eu-west-1">eu-west-1 (Ireland)</MenuItem>,
                      <MenuItem key="ap-southeast-1" value="ap-southeast-1">ap-southeast-1 (Singapore)</MenuItem>,
                      <MenuItem key="sa-east-1" value="sa-east-1">sa-east-1 (São Paulo)</MenuItem>,
                    ]}
                    {newAccount.provider === "AZURE" && [
                      <MenuItem key="eastus" value="eastus">eastus (East US)</MenuItem>,
                      <MenuItem key="westeurope" value="westeurope">westeurope (West Europe)</MenuItem>,
                      <MenuItem key="southeastasia" value="southeastasia">southeastasia (Southeast Asia)</MenuItem>,
                      <MenuItem key="centralus" value="centralus">centralus (Central US)</MenuItem>,
                    ]}
                    {newAccount.provider === "GCP" && [
                      <MenuItem key="us-central1" value="us-central1">us-central1 (Iowa)</MenuItem>,
                      <MenuItem key="europe-west1" value="europe-west1">europe-west1 (Belgium)</MenuItem>,
                      <MenuItem key="asia-east1" value="asia-east1">asia-east1 (Taiwan)</MenuItem>,
                    ]}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* 3. Authentication & API Credentials */}
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
              3. Security & Read-Only API Credentials
            </Typography>

            {newAccount.provider === "AWS" && (
              <>
                <TextField
                  required
                  label="AWS Access Key ID"
                  size="small"
                  fullWidth
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  value={newAccount.access_key}
                  onChange={(e) => {
                    setNewAccount({ ...newAccount, access_key: e.target.value });
                    if (formErrors.access_key) setFormErrors({ ...formErrors, access_key: null });
                  }}
                  error={Boolean(formErrors.access_key)}
                  helperText={formErrors.access_key || "Starts with AKIA... or ASIA..."}
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                  }}
                />
                <TextField
                  required
                  label="AWS Secret Access Key"
                  size="small"
                  type={showSecretKey ? "text" : "password"}
                  fullWidth
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  value={newAccount.secret_key}
                  onChange={(e) => {
                    setNewAccount({ ...newAccount, secret_key: e.target.value });
                    if (formErrors.secret_key) setFormErrors({ ...formErrors, secret_key: null });
                  }}
                  error={Boolean(formErrors.secret_key)}
                  helperText={formErrors.secret_key}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowSecretKey(!showSecretKey)}
                          edge="end"
                        >
                          {showSecretKey ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                  }}
                />
              </>
            )}

            {newAccount.provider === "AZURE" && (
              <>
                <TextField
                  required
                  label="Azure Tenant ID"
                  size="small"
                  fullWidth
                  placeholder="00000000-0000-0000-0000-000000000000"
                  value={newAccount.tenant_id}
                  onChange={(e) => {
                    setNewAccount({ ...newAccount, tenant_id: e.target.value });
                    if (formErrors.tenant_id) setFormErrors({ ...formErrors, tenant_id: null });
                  }}
                  error={Boolean(formErrors.tenant_id)}
                  helperText={formErrors.tenant_id}
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                  }}
                />
                <TextField
                  required
                  label="Azure Client ID (App Registration)"
                  size="small"
                  fullWidth
                  placeholder="00000000-0000-0000-0000-000000000000"
                  value={newAccount.client_id}
                  onChange={(e) => {
                    setNewAccount({ ...newAccount, client_id: e.target.value });
                    if (formErrors.client_id) setFormErrors({ ...formErrors, client_id: null });
                  }}
                  error={Boolean(formErrors.client_id)}
                  helperText={formErrors.client_id}
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                  }}
                />
                <TextField
                  required
                  label="Azure Client Secret"
                  size="small"
                  type={showSecretKey ? "text" : "password"}
                  fullWidth
                  placeholder="Client Secret Value"
                  value={newAccount.client_secret}
                  onChange={(e) => {
                    setNewAccount({ ...newAccount, client_secret: e.target.value });
                    if (formErrors.client_secret) setFormErrors({ ...formErrors, client_secret: null });
                  }}
                  error={Boolean(formErrors.client_secret)}
                  helperText={formErrors.client_secret}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setShowSecretKey(!showSecretKey)}
                          edge="end"
                        >
                          {showSecretKey ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                  }}
                />
              </>
            )}

            {newAccount.provider === "GCP" && (
              <TextField
                required
                label="Service Account Key JSON"
                size="small"
                fullWidth
                multiline
                rows={3}
                placeholder='{"type": "service_account", "project_id": "risktrix-prod", "private_key": "..."}'
                value={newAccount.service_account_json}
                onChange={(e) => {
                  setNewAccount({ ...newAccount, service_account_json: e.target.value });
                  if (formErrors.service_account_json) setFormErrors({ ...formErrors, service_account_json: null });
                }}
                error={Boolean(formErrors.service_account_json)}
                helperText={formErrors.service_account_json || "Paste Service Account JSON key object"}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                }}
              />
            )}

            {/* Quick Setup Guidance Alert Banner */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: "8px",
                bgcolor: "#f0f9ff",
                border: "1px solid #bae6fd",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#0369a1", fontSize: "12px" }}>
                  💡 Security Read-Only Principle
                </Typography>
                <Typography variant="caption" sx={{ color: "#0c4a6e", fontSize: "11px", display: "block" }}>
                  RiskTrix requires Security Audit permissions only (S3, EC2, IAM, RDS, EKS). No write permissions required.
                </Typography>
              </Box>
            </Box>

            {/* Inline Test Result Alert Banner & Granular IAM Permission Audit Card */}
            {testResult && (
              <Box sx={{ mt: 0.5 }}>
                <Alert
                  severity={testResult.type}
                  onClose={() => setTestResult(null)}
                  sx={{
                    py: 0.5,
                    px: 1.5,
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "12px",
                    bgcolor: testResult.type === "success" ? "#f0fdf4" : "#fef2f2",
                    color: testResult.type === "success" ? "#15803d" : "#dc2626",
                    border: `1px solid ${testResult.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                  }}
                >
                  {testResult.type === "success" ? "🟢 " : "🔴 "}
                  {testResult.message}
                </Alert>

                {/* Granular IAM Permission Audit Breakdown */}
                {testResult.type === "success" && testResult.permissions && (
                  <Card variant="outlined" sx={{ mt: 1.5, p: 1.8, bgcolor: "#f8fafc", borderRadius: "10px", borderColor: "#cbd5e1" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: "#0f172a", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.03em" }}>
                        🛡️ IAM Permission Audit & Feature Coverage
                      </Typography>
                      {testResult.policy && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ContentCopyIcon fontSize="small" />}
                          onClick={() => handleCopyPolicy(testResult.policy)}
                          sx={{ textTransform: "none", fontSize: "11px", py: 0.3, px: 1.2, fontWeight: 700, borderRadius: "6px" }}
                        >
                          Copy Recommended Policy
                        </Button>
                      )}
                    </Box>

                    {/* Verified & Utilized Permissions */}
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "#16a34a", fontSize: "11px", display: "block", mb: 0.5 }}>
                        ✓ Verified & Utilized Permissions ({testResult.permissions.granted_count || 0}):
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {(testResult.permissions.granted || []).map((p, idx) => (
                          <Chip
                            key={idx}
                            label={p.action}
                            size="small"
                            sx={{ height: "22px", fontSize: "10px", fontWeight: 700, bgcolor: "#dcfce7", color: "#15803d", border: "1px solid #86efac" }}
                          />
                        ))}
                      </Box>
                    </Box>

                    {/* Missing Permissions & Feature Impact */}
                    {testResult.permissions.missing_count > 0 && (
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "#ea580c", fontSize: "11px", display: "block", mb: 0.5 }}>
                          ⚠️ Missing Permissions for Full CNAPP Coverage ({testResult.permissions.missing_count}):
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {(testResult.permissions.missing || []).map((p, idx) => (
                            <Tooltip key={idx} title={`Impact: ${p.impact || p.purpose}`}>
                              <Chip
                                label={`${p.action} (Missing)`}
                                size="small"
                                sx={{ height: "22px", fontSize: "10px", fontWeight: 700, bgcolor: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}
                              />
                            </Tooltip>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Card>
                )}
              </Box>
            )}
          </Box>
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
              setOpenConnectModal(false);
              setTestResult(null);
            }}
            size="medium"
            sx={{ textTransform: "none", color: "#64748b", fontWeight: 600, fontSize: "14px" }}
          >
            Cancel
          </Button>

          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              variant="outlined"
              color="primary"
              size="medium"
              onClick={handleTestConnection}
              disabled={testingConnection}
              startIcon={testingConnection ? <CircularProgress size={16} color="inherit" /> : <NetworkCheckIcon fontSize="small" />}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px", fontSize: "13px", py: 0.8, px: 2, borderColor: "#2563eb", color: "#2563eb" }}
            >
              {testingConnection ? "Auditing IAM..." : "🧪 Test Connection"}
            </Button>

            <Button
              variant="contained"
              size="medium"
              onClick={handleCreateAccount}
              startIcon={<CheckCircleIcon fontSize="small" />}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: "8px",
                fontSize: "14px",
                py: 0.8,
                px: 2.5,
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                "&:hover": {
                  background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)",
                },
              }}
            >
              Save & Connect Account
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert severity={notification.severity} sx={{ width: "100%" }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CloudAccounts;
