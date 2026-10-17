import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  Avatar,
  Alert,
  Collapse,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTheme } from "@mui/material/styles";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Toast from "../../components/common/Toast";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SecurityIcon from "@mui/icons-material/Security";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import DescriptionIcon from "@mui/icons-material/Description";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import dashboardTheme from "../../theme/dashboardTheme";
import api from "../../utils/api";

// Styled components for file upload
const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
      style={{ paddingTop: "24px" }}
    >
      {value === index && children}
    </div>
  );
}

function OrganizationSettingsPanel() {
  const [org, setOrg] = useState({ name: "", description: "", industry: "", website: "", contact_email: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    api
      .get("/api/v1/organizations/me")
      .then((res) => setOrg({ ...org, ...res.data }))
      .catch(() => {});
  }, []);

  const save = async () => {
    try {
      const params = new URLSearchParams();
      if (org.name) params.set("name", org.name);
      if (org.description != null) params.set("description", org.description);
      if (org.industry) params.set("industry", org.industry);
      if (org.website) params.set("website", org.website);
      if (org.contact_email) params.set("contact_email", org.contact_email);
      const res = await api.patch(`/api/v1/organizations/me?${params.toString()}`);
      setOrg({ ...org, ...res.data });
      setMessage("Organization updated");
    } catch (err) {
      setMessage(err.response?.data?.detail || "Unable to update organization");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        Organization
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Name" value={org.name || ""} onChange={(e) => setOrg({ ...org, name: e.target.value })} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Industry" value={org.industry || ""} onChange={(e) => setOrg({ ...org, industry: e.target.value })} />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth multiline minRows={2} label="Description" value={org.description || ""} onChange={(e) => setOrg({ ...org, description: e.target.value })} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Website" value={org.website || ""} onChange={(e) => setOrg({ ...org, website: e.target.value })} />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Contact email" value={org.contact_email || ""} onChange={(e) => setOrg({ ...org, contact_email: e.target.value })} />
        </Grid>
      </Grid>
      <Button sx={{ mt: 2 }} variant="contained" onClick={save}>
        Save organization
      </Button>
      {message && <Alert sx={{ mt: 2 }}>{message}</Alert>}
    </Box>
  );
}

function InvitationsPanel() {
  const [invites, setInvites] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("VIEWER");
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      const res = await api.get("/api/v1/invitations");
      setInvites(Array.isArray(res.data) ? res.data : []);
    } catch {
      setInvites([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const invite = async () => {
    try {
      await api.post(`/api/v1/invitations?email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`);
      setEmail("");
      setMessage(`Invitation sent to ${email}`);
      load();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Invite failed");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        Invitations
      </Typography>
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <TextField size="small" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Role</InputLabel>
          <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
            <MenuItem value="VIEWER">Viewer</MenuItem>
            <MenuItem value="SECURITY_ANALYST">Security Analyst</MenuItem>
            <MenuItem value="CISO">CISO</MenuItem>
            <MenuItem value="ADMIN">Admin</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" onClick={invite} disabled={!email}>
          Send invite
        </Button>
      </Box>
      {message && <Alert sx={{ mb: 2 }}>{message}</Alert>}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Expires</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>No invitations yet.</TableCell>
              </TableRow>
            ) : (
              invites.map((inviteRow) => (
                <TableRow key={inviteRow.id}>
                  <TableCell>{inviteRow.email}</TableCell>
                  <TableCell>{inviteRow.role}</TableCell>
                  <TableCell>{inviteRow.status}</TableCell>
                  <TableCell>{inviteRow.expires_at}</TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => api.post(`/api/v1/invitations/${inviteRow.id}/resend`).then(load)}>
                      Resend
                    </Button>
                    <Button size="small" color="error" onClick={() => api.post(`/api/v1/invitations/${inviteRow.id}/revoke`).then(load)}>
                      Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function PlatformAuditPanel() {
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const load = async () => {
    try {
      const res = await api.get("/api/v1/platform-audit");
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch {
      setLogs([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const exportCsv = async () => {
    try {
      const res = await api.get("/api/v1/platform-audit/export");
      const blob = new Blob([res.data.content || ""], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "platform-audit.csv";
      link.click();
      URL.revokeObjectURL(url);
      setMessage(`Exported ${res.data.count || 0} audit events`);
    } catch (err) {
      setMessage(err.response?.data?.detail || "Export failed");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Platform Audit
        </Typography>
        <Button variant="outlined" onClick={exportCsv}>
          Export CSV
        </Button>
      </Box>
      {message && <Alert sx={{ mb: 2 }}>{message}</Alert>}
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <TextField size="small" placeholder="Search actor or detail" value={search} onChange={(e) => setSearch(e.target.value)} />
        <TextField size="small" placeholder="Filter action" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} />
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Actor</TableCell>
              <TableCell>Detail</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>No platform audit events yet.</TableCell>
              </TableRow>
            ) : (
              logs.filter((row) => {
                const hay = `${row.actor || ""} ${row.detail || ""}`.toLowerCase();
                if (search && !hay.includes(search.toLowerCase())) return false;
                if (actionFilter && !String(row.action || "").toLowerCase().includes(actionFilter.toLowerCase())) return false;
                return true;
              }).map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.created_at}</TableCell>
                  <TableCell>{row.action}</TableCell>
                  <TableCell>{row.actor}</TableCell>
                  <TableCell>{row.detail}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// Main component
const Settings = () => {
  const theme = useTheme();
  const API_BASE_URL = "http://127.0.0.1:8000";
  const API_PREFIX = "/api/v1";
  const [tabValue, setTabValue] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // Profile management state
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "", // RBAC role
    privileges: "", // Privilege level
    clearance: "", // Clearance level
    phone: "",
    company: "",
    status: "active",
  });

  // Standards management state
  const [standardForm, setStandardForm] = useState({
    name: "",
    type: "",
    description: "",
    file: null,
  });

  // SMTP management state
  const [smtpForm, setSmtpForm] = useState({
    email: "",
    host: "",
    username: "",
    password: "",
    port: "",
    description: "",
  });

  // Mock data for demonstration
  const [profiles, setProfiles] = useState([]);
  const [profileSearch, setProfileSearch] = useState("");

  // Load profiles from backend
  const loadProfiles = async () => {
    // use module-level API_BASE_URL/API_PREFIX
    try {
      const res = await api.get(`/api/v1/users/`);
      const items = res.data?.items || [];
      const normalized = items.map((u, idx) => {
        // Accept multiple possible backend keys and normalize to lowercase where appropriate
        const privilege =
          u.privilege_level || u.privilegeLevel || u.privilege || "";
        const clearance =
          u.clearance_level || u.clearanceLevel || u.clearance || "";
        const company = u.company || u.organization || u.org || "";

        return {
          id: u.id ?? idx + 1,
          name: u.full_name || u.username || u.email || "Unknown",
          email: u.email || "",
          username: u.username || "",
          role: u.role || "",
          type: u.profile_type || u.type || "unknown",
          company: company,
          phone: u.phone || "",
          // department intentionally preserved in data model but we won't display it in table
          department: u.department || "",
          createdAt:
            (u.created_at && u.created_at.split("T")[0]) ||
            (u.createdAt && u.createdAt.split("T")[0]) ||
            new Date().toISOString().split("T")[0],
          // updatedAt removed from table display but keep it available on the object if needed
          updatedAt:
            (u.updated_at && u.updated_at.split("T")[0]) ||
            (u.updatedAt && u.updatedAt.split("T")[0]) ||
            "",
          // normalize to lowercase strings for form selects
          privilegeLevel:
            (typeof privilege === "string"
              ? privilege.toLowerCase()
              : String(privilege).toLowerCase()) || "standard",
          clearanceLevel:
            (typeof clearance === "string"
              ? clearance.toLowerCase()
              : String(clearance).toLowerCase()) || "low",
          status:
            typeof u.is_active !== "undefined"
              ? u.is_active
                ? "active"
                : "inactive"
              : u.status || "active",
          is_superuser: !!u.is_superuser,
          last_login: u.last_login || u.lastLogin || "",
        };
      });
      setProfiles(normalized);
    } catch (err) {
      console.error("Failed to load profiles from backend:", err);
      setProfiles([]);
    }
  };

  // fetch profiles on mount
  useEffect(() => {
    loadProfiles();
    api.get("/api/v1/standards").then((res) => setStandards(Array.isArray(res.data) ? res.data : [])).catch(() => setStandards([]));
    api.get("/api/v1/smtp-configs").then((res) => setSmtpConfigs(Array.isArray(res.data) ? res.data : [])).catch(() => setSmtpConfigs([]));
  }, []);

  const [standards, setStandards] = useState([]);

  const [smtpConfigs, setSmtpConfigs] = useState([]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle form value changes for profile
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm({
      ...profileForm,
      [name]: value,
    });
  };

  // API state for creating user
  const [creatingUser, setCreatingUser] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Handle form value changes for standards
  const handleStandardChange = (e) => {
    const { name, value } = e.target;
    setStandardForm({
      ...standardForm,
      [name]: value,
    });
  };

  // put next to other handlers (e.g., handleProfileChange)
  const handleSmtpChange = (eOrObj) => {
    // if called with a real event from TextField / Select
    if (eOrObj && eOrObj.target && typeof eOrObj.target.name === "string") {
      const { name, value, type } = eOrObj.target;
      setSmtpForm((prev) => ({
        ...prev,
        [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
      }));
      return;
    }

    // if called with a plain { name, value } object (convenience for Switch)
    if (eOrObj && typeof eOrObj.name === "string") {
      setSmtpForm((prev) => ({ ...prev, [eOrObj.name]: eOrObj.value }));
    }
  };

  // Handle file upload for standards
  const handleFileChange = (event) => {
    setStandardForm({
      ...standardForm,
      file: event.target.files[0],
    });
  };

  // Function to render icon based on profile type
  const renderProfileIcon = (type) => {
    switch (type) {
      case "client":
        return <BusinessIcon sx={{ color: "#3f51b5" }} />;
      case "auditor":
        return <AdminPanelSettingsIcon sx={{ color: "#ff9800" }} />;
      case "vendor":
        return <BusinessIcon sx={{ color: "#9c27b0" }} />;
      case "security":
        return <SecurityIcon sx={{ color: "#f44336" }} />;
      default:
        return <PersonIcon sx={{ color: "#2196f3" }} />;
    }
  };

  // Form submission handlers
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setCreatingUser(true);

    // Client-side UTF-8 byte-length validation for password to avoid backend bcrypt 72-byte limit
    const encoder = new TextEncoder();
    const pwBytes = encoder.encode(profileForm.password || "");
    if (pwBytes.length > 72) {
      setCreateError(
        "Password is too long. Please limit to 72 bytes (approx 72 ASCII chars).",
      );
      setCreatingUser(false);
      return;
    }

    // Map frontend fields to backend schema
    const username = profileForm.email
      ? profileForm.email.split("@")[0]
      : profileForm.name.replace(/\s+/g, "").toLowerCase();
    const full_name = profileForm.name;

    const payload = {
      email: profileForm.email,
      username,
      full_name,
      password: profileForm.password,
      phone: profileForm.phone,
      company: profileForm.company,
      is_active: profileForm.status === "active",
      is_superuser: false,
      role: profileForm.role || "VIEWER", // Use selected role or default to VIEWER
      privilege_level: profileForm.privileges || "standard", // Add privilege level
      clearance_level: profileForm.clearance || "low", // Add clearance level
    };

    // use module-level API_BASE_URL/API_PREFIX

    try {
      let res;
      if (editingUserId) {
        // update existing user
        // don't send empty password
        if (!payload.password) delete payload.password;
        res = await api.put(`/api/v1/users/${editingUserId}`, payload);
      } else {
        res = await api.post(`/api/v1/users/`, payload);
      }
      const created = res.data;

      // Normalize created user for display (fallbacks)
      const displayUser = {
        id: created.id || profiles.length + 1,
        name: created.full_name || profileForm.name,
        email: created.email || profileForm.email,
        type: created.profile_type || profileForm.type,
        company: created.company || profileForm.company,
        createdAt: created.created_at
          ? created.created_at.split("T")[0]
          : new Date().toISOString().split("T")[0],
        privilegeLevel: created.privilege_level || profileForm.privilegeLevel,
        clearanceLevel: created.clearance_level || profileForm.clearanceLevel,
        status: created.is_active ? "active" : "inactive",
      };

      // Refresh profiles from backend so table reflects server state
      try {
        await loadProfiles();
      } catch (e) {
        // fallback to local update if load fails
        setProfiles((prev) => [displayUser, ...prev]);
      }

      // exit edit mode if we were editing
      if (editingUserId) setEditingUserId(null);

      setProfileForm({
        name: "",
        email: "",
        password: "",
        role: "", // Reset role field
        privileges: "", // Reset privileges
        clearance: "", // Reset clearance
        phone: "",
        company: "",
        status: "active",
      });

      showSuccessMessage();
    } catch (err) {
      console.error("Error creating user:", err);
      setCreateError(
        err.response?.data?.detail || err.message || "Failed to create user",
      );
    } finally {
      setCreatingUser(false);
    }
  };

  const handleEditClick = (user) => {
    // populate profileForm with user's data
    setProfileForm((prev) => ({
      ...prev,
      name: user.full_name || user.name || user.username || "",
      email: user.email || "",
      phone: user.phone || "",
      company: user.company || "",
      role: user.role || "", // Load user's role
      privileges: user.privilegeLevel || user.privilege_level || "standard", // Load privilege level
      clearance: user.clearanceLevel || user.clearance_level || "low", // Load clearance level
      status:
        typeof user.is_active !== "undefined"
          ? user.is_active
            ? "active"
            : "inactive"
          : "active",
      password: "",
    }));
    setEditingUserId(user.id);
    // switch tab to Profiles (if not already)
    setTabValue(0);
    // scroll to top of form a bit — optional
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setProfileForm({
      name: "",
      email: "",
      password: "",
      role: "", // Reset role field
      privileges: "", // Reset privileges
      clearance: "", // Reset clearance
      phone: "",
      company: "",
      status: "active",
    });
  };

  const handleDeleteClick = async (userId) => {
    // open confirm modal instead
    setDeleteTargetId(userId);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    const userId = deleteTargetId;
    setConfirmOpen(false);
    if (!userId) return;
    try {
      const res = await api.delete(`/api/v1/users/${userId}`);
      if (res.status === 200 || res.status === 204) {
        await loadProfiles();
        setToast({
          open: true,
          message: "Profile deleted",
          severity: "success",
        });
      } else {
        setProfiles((prev) => prev.filter((p) => p.id !== userId));
        setToast({
          open: true,
          message: "Delete succeeded locally",
          severity: "warning",
        });
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
      setProfiles((prev) => prev.filter((p) => p.id !== userId));
      setToast({
        open: true,
        message: "Failed to delete profile",
        severity: "error",
      });
    } finally {
      setDeleteTargetId(null);
    }
  };

  const closeToast = () => setToast((prev) => ({ ...prev, open: false }));

  const handleStandardSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/api/v1/standards", {
        name: standardForm.name,
        type: standardForm.type,
        description: standardForm.description,
        file_name: standardForm.file ? standardForm.file.name : "",
        file_type: standardForm.file ? standardForm.file.name.split(".").pop() : "",
        controls: 0,
      });
      setStandards([...standards, res.data]);
      setStandardForm({
        name: "",
        type: "",
        description: "",
        file: null,
      });
      showSuccessMessage();
    } catch (err) {
      setToast({
        open: true,
        message: err?.response?.data?.detail || "Unable to save standard",
        severity: "error",
      });
    }
  };

  const handleSmtpSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/api/v1/smtp-configs", {
        ...smtpForm,
        active: true,
      });
      setSmtpConfigs([...smtpConfigs, res.data]);
      setSmtpForm({
        email: "",
        host: "",
        username: "",
        password: "",
        port: "",
        description: "",
      });
      showSuccessMessage();
    } catch (err) {
      setToast({
        open: true,
        message: err?.response?.data?.detail || "Unable to save SMTP config",
        severity: "error",
      });
    }
  };

  // Show success message temporarily
  const showSuccessMessage = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        maxWidth: "100%",
        background:
          "linear-gradient(135deg, rgba(240,242,245,1) 0%, rgba(245,247,250,1) 100%)",
        // let the content determine height so tabs don't leave large empty space
        // minHeight: 'auto'
        height: "auto",
        minHeight: "calc(100vh - 64px)",
        overflow: "auto",
      }}
    >
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 2,
          background: "linear-gradient(135deg, #00796B 0%, #009688 100%)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          height: "auto",
        }}
        className="dashboard-header"
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: dashboardTheme.typography.fontWeights.bold,
              color: "#ffffff",
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            }}
          >
            System Settings
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              color: "rgba(255, 255, 255, 0.9)",
              mt: 0.5,
            }}
          >
            Configure profiles, standards, and notifications
          </Typography>
        </Box>
      </Paper>

      {/* Success message */}
      <Collapse in={showSuccess}>
        <Alert
          icon={<CheckCircleIcon fontSize="inherit" />}
          severity="success"
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setShowSuccess(false)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{ mb: 2 }}
        >
          Settings updated successfully!
        </Alert>
      </Collapse>

      {/* Tab navigation */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          mb: 3,
          overflow: "hidden",
        }}
        className="settings-card"
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          indicatorColor="secondary"
          textColor="primary"
          sx={{
            borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
            "& .MuiTab-root": {
              py: 2,
              fontWeight: "medium",
            },
          }}
        >
          <Tab icon={<PersonIcon />} iconPosition="start" label="Profiles" />
          <Tab
            icon={<DescriptionIcon />}
            iconPosition="start"
            label="Standards"
          />
          <Tab
            icon={<MailOutlineIcon />}
            iconPosition="start"
            label="Email Settings"
          />
          <Tab icon={<BusinessIcon />} iconPosition="start" label="Organization" />
          <Tab icon={<MailOutlineIcon />} iconPosition="start" label="Invitations" />
          <Tab icon={<DescriptionIcon />} iconPosition="start" label="Platform Audit" />
        </Tabs>

        {/* Profiles Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3} alignItems="stretch">
              {/* Form for creating profiles (40%) */}
              <Grid
                item
                xs={12}
                sx={{
                  flexBasis: { md: "40%" },
                  maxWidth: { md: "40%" },
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 0,
                }}
              >
                <Box
                  component="form"
                  onSubmit={handleProfileSubmit}
                  sx={{
                    p: { xs: 2, md: 3 }, // align padding with SMTP/Standards form
                    border: "1px solid rgba(0, 121, 107, 0.2)",
                    borderRadius: 1,
                    bgcolor: "rgba(0, 121, 107, 0.02)",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ mb: 2, color: "#00796B", fontWeight: "medium" }}
                  >
                    Create New Profile
                  </Typography>

                  {/* Basic Information Section */}
                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: 1,
                      color: "text.secondary",
                      fontWeight: "medium",
                    }}
                  >
                    Basic Information
                  </Typography>

                  {/* === Basic Information Section === - use CSS grid to fill width */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                      gap: 3,
                      mb: 3,
                      width: "100%",
                    }}
                  >
                    <TextField
                      fullWidth
                      required
                      label="Full Name"
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileChange}
                      sx={{ minWidth: 0, width: "100%" }}
                      inputProps={{ style: { minHeight: 30 } }}
                    />

                    <TextField
                      fullWidth
                      required
                      type="email"
                      label="Email Address"
                      name="email"
                      value={profileForm.email}
                      onChange={handleProfileChange}
                      sx={{ minWidth: 0, width: "100%" }}
                      inputProps={{ style: { minHeight: 30 } }}
                    />

                    <TextField
                      fullWidth
                      type="password"
                      label="Password"
                      name="password"
                      value={profileForm.password || ""}
                      onChange={handleProfileChange}
                      sx={{ minWidth: 0, width: "100%" }}
                      inputProps={{ style: { minHeight: 30 }, maxLength: 72 }}
                      helperText={
                        editingUserId
                          ? "Leave blank to keep existing password. Max 72 characters."
                          : "Password max 72 characters (bcrypt limit)."
                      }
                      required={!editingUserId}
                      FormHelperTextProps={{ sx: { fontSize: "0.75rem" } }}
                    />

                    <TextField
                      fullWidth
                      label="Phone Number"
                      name="phone"
                      value={profileForm.phone}
                      onChange={handleProfileChange}
                      sx={{ minWidth: 0, width: "100%" }}
                      inputProps={{ style: { minHeight: 30 } }}
                    />

                    <TextField
                      fullWidth
                      label="Company/Organization"
                      name="company"
                      value={profileForm.company}
                      onChange={handleProfileChange}
                      sx={{ minWidth: 0, width: "100%" }}
                      inputProps={{ style: { minHeight: 30 } }}
                    />
                  </Box>

                  {/* Access Settings Section - RBAC with Privileges and Clearance */}
                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: 1,
                      color: "text.secondary",
                      fontWeight: "medium",
                    }}
                  >
                    Access Settings
                  </Typography>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <FormControl fullWidth required>
                      <InputLabel>Role</InputLabel>
                      <Select
                        name="role"
                        value={profileForm.role}
                        onChange={handleProfileChange}
                        label="Role"
                        MenuProps={{
                          PaperProps: {
                            style: { maxHeight: 300, overflowY: "auto" },
                          },
                        }}
                      >
                        <MenuItem value="ADMIN">Admin</MenuItem>
                        <MenuItem value="CISO">CISO</MenuItem>
                        <MenuItem value="INFOSEC_MANAGER">
                          InfoSec Manager
                        </MenuItem>
                        <MenuItem value="EXTERNAL_AUDITOR">
                          External Auditor
                        </MenuItem>
                        <MenuItem value="INTERNAL_AUDITOR">
                          Internal Auditor
                        </MenuItem>
                        <MenuItem value="SECURITY_ANALYST">
                          Security Analyst
                        </MenuItem>
                        <MenuItem value="VIEWER">Viewer</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>Privileges</InputLabel>
                      <Select
                        name="privileges"
                        value={profileForm.privileges}
                        onChange={handleProfileChange}
                        label="Privileges"
                      >
                        <MenuItem value="standard">Standard</MenuItem>
                        <MenuItem value="elevated">Elevated</MenuItem>
                        <MenuItem value="administrator">Administrator</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>Clearance</InputLabel>
                      <Select
                        name="clearance"
                        value={profileForm.clearance}
                        onChange={handleProfileChange}
                        label="Clearance"
                      >
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="top_secret">Top Secret</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={profileForm.status === "active"}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              status: e.target.checked ? "active" : "inactive",
                            })
                          }
                          color="primary"
                        />
                      }
                      label="Active Profile"
                    />
                  </Box>

                  <Box
                    sx={{
                      mt: 3,
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 1,
                    }}
                  >
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<AddIcon />}
                      sx={{
                        background:
                          "linear-gradient(45deg, #00796B 30%, #009688 90%)",
                        boxShadow: "0 3px 5px rgba(0, 121, 107, 0.3)",
                        transition: "all 0.3s",
                        fontWeight: "medium",
                        "&:hover": {
                          boxShadow: "0 4px 10px rgba(0, 121, 107, 0.4)",
                          transform: "translateY(-1px)",
                        },
                      }}
                    >
                      {editingUserId ? "Update Profile" : "Create Profile"}
                    </Button>
                    {editingUserId && (
                      <Button
                        variant="outlined"
                        color="inherit"
                        onClick={handleCancelEdit}
                        sx={{ ml: 1 }}
                      >
                        Cancel
                      </Button>
                    )}
                  </Box>
                </Box>
              </Grid>

              {/* Table of existing profiles (60%) */}
              <Grid
                item
                xs={12}
                sx={{
                  flexBasis: { md: "60%" },
                  maxWidth: { md: "60%" },
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 0,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ mb: 2, color: "#00796B", fontWeight: "medium" }}
                >
                  Existing Profiles
                </Typography>

                <TextField
                  fullWidth
                  placeholder="Search profiles..."
                  value={profileSearch}
                  onChange={(e) => setProfileSearch(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    border: "1px solid rgba(224, 224, 224, 1)",
                    borderRadius: 1,
                    // allow horizontal scrolling when table is wider than the container
                    overflowX: "auto",
                    overflowY: "visible",
                    width: "100%",
                    minWidth: 0,
                  }}
                >
                  <Table sx={{ minWidth: 1200 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f8f9fb" }}>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Username</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>Company</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell>Privileges</TableCell>
                        <TableCell>Clearance</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {profiles
                        .filter((profile) => {
                          const q = profileSearch.trim().toLowerCase();
                          if (!q) return true;
                          return [profile.name, profile.email, profile.username, profile.role, profile.company]
                            .filter(Boolean)
                            .some((v) => String(v).toLowerCase().includes(q));
                        })
                        .map((profile) => (
                        <TableRow key={profile.id} hover>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Avatar
                                sx={{
                                  bgcolor: "primary.light",
                                  width: 32,
                                  height: 32,
                                }}
                              >
                                {profile.name ? profile.name.charAt(0) : "?"}
                              </Avatar>
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: "medium" }}
                                >
                                  {profile.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {profile.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{profile.email}</TableCell>
                          <TableCell>{profile.username}</TableCell>
                          <TableCell>
                            <Chip
                              icon={renderProfileIcon(profile.type)}
                              label={
                                profile.type
                                  ? profile.type.charAt(0).toUpperCase() +
                                    profile.type.slice(1)
                                  : "Unknown"
                              }
                              size="small"
                              sx={{
                                borderRadius: 1,
                                textTransform: "capitalize",
                              }}
                            />
                          </TableCell>
                          <TableCell>{profile.role}</TableCell>
                          <TableCell>{profile.phone}</TableCell>
                          <TableCell>{profile.company}</TableCell>
                          <TableCell>{profile.createdAt}</TableCell>
                          <TableCell>
                            <Box
                              sx={{ display: "flex", flexDirection: "column" }}
                            >
                              <Typography
                                variant="caption"
                                sx={{ fontWeight: "medium" }}
                              >
                                {profile.privilegeLevel}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={profile.clearanceLevel}
                              size="small"
                              sx={{
                                borderRadius: 1,
                                textTransform: "capitalize",
                              }}
                              color={
                                profile.clearanceLevel === "low"
                                  ? "default"
                                  : profile.clearanceLevel === "medium"
                                    ? "warning"
                                    : profile.clearanceLevel === "high"
                                      ? "primary"
                                      : "error"
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={profile.status}
                              size="small"
                              color={
                                profile.status === "active"
                                  ? "success"
                                  : "default"
                              }
                              sx={{
                                borderRadius: 1,
                                textTransform: "capitalize",
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEditClick(profile)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClick(profile.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Delete confirmation dialog */}
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
          <DialogTitle>Confirm delete</DialogTitle>
          <DialogContent>
            Are you sure you want to delete this profile? This action cannot be
            undone.
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button color="error" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Toast toast={toast} onClose={closeToast} />

        {/* Standards Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Left column: Add New Compliance Standard (updated for 2-column responsive layout) */}
              <Grid
                item
                xs={12}
                sx={{
                  flexBasis: { md: "40%" },
                  maxWidth: { md: "40%" },
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 0,
                }}
              >
                <Box
                  component="form"
                  onSubmit={handleStandardSubmit}
                  sx={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    alignItems: "stretch",
                    p: { xs: 2, md: 3 },
                    border: "1px solid rgba(0, 121, 107, 0.12)",
                    borderRadius: 1,
                    bgcolor: "rgba(0, 121, 107, 0.02)",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ mb: 2, color: "#00796B", fontWeight: "medium" }}
                  >
                    Add New Compliance Standard
                  </Typography>

                  {/* === Row 1: Standard Name + Standard Type === - use CSS grid to fill width */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                      gap: 3,
                      mb: 2,
                      width: "100%",
                    }}
                  >
                    <TextField
                      fullWidth
                      required
                      label="Standard Name"
                      name="name"
                      value={standardForm.name}
                      onChange={handleStandardChange}
                      placeholder="e.g., PCI DSS v4.0"
                      sx={{ minWidth: 0, width: "100%" }}
                      inputProps={{ style: { minHeight: 30 } }}
                    />

                    <TextField
                      fullWidth
                      required
                      label="Standard Type"
                      name="type"
                      value={standardForm.type}
                      onChange={handleStandardChange}
                      placeholder="e.g., Payment Security"
                      sx={{ minWidth: 0, width: "100%" }}
                      inputProps={{ style: { minHeight: 30 } }}
                    />
                  </Box>

                  {/* === Row 2: Description (full width) === */}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Description"
                        name="description"
                        value={standardForm.description}
                        onChange={handleStandardChange}
                        placeholder="Brief description of the standard"
                        sx={{
                          minWidth: 250,
                          width: "100%",
                          boxSizing: "border-box",
                        }}
                        inputProps={{ style: { minHeight: 50 } }}
                      />
                    </Grid>
                  </Grid>

                  {/* === Row 3: File upload (full width) === */}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={12}>
                      <Box
                        sx={{
                          border: "1px dashed rgba(0, 121, 107, 0.18)",
                          borderRadius: 1,
                          p: { xs: 2, md: 3 },
                          textAlign: "center",
                          bgcolor: "rgba(0, 121, 107, 0.015)",
                          width: "100%",
                          maxWidth: "100%",
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          Upload a file with control requirements
                        </Typography>

                        <Button
                          component="label"
                          variant="outlined"
                          startIcon={<CloudUploadIcon />}
                          sx={{
                            borderColor: "#00796B",
                            color: "#00796B",
                            "&:hover": {
                              borderColor: "#00695C",
                              backgroundColor: "rgba(0, 121, 107, 0.06)",
                            },
                          }}
                        >
                          Upload File
                          <input
                            type="file"
                            hidden
                            accept=".xlsx,.xls,.doc,.docx,.pdf"
                            onChange={handleFileChange}
                          />
                        </Button>

                        {standardForm.file && (
                          <Box
                            sx={{
                              mt: 2,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 1,
                            }}
                          >
                            <DescriptionIcon fontSize="small" color="primary" />
                            <Typography variant="body2">
                              {standardForm.file.name}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Submit */}
                  <Box
                    sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}
                  >
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<AddIcon />}
                      sx={{
                        background:
                          "linear-gradient(45deg, #00796B 30%, #009688 90%)",
                        boxShadow: "0 3px 5px rgba(0, 121, 107, 0.25)",
                        "&:hover": { transform: "translateY(-1px)" },
                      }}
                    >
                      Add Standard
                    </Button>
                  </Box>
                </Box>
              </Grid>

              {/* Table of existing standards */}
              <Grid
                item
                xs={12}
                sx={{
                  flexBasis: { md: "55%" },
                  maxWidth: { md: "55%" },
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 0,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ mb: 2, color: "#00796B", fontWeight: "medium" }}
                >
                  Available Standards
                </Typography>

                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    border: "1px solid rgba(224, 224, 224, 1)",
                    borderRadius: 1,
                    width: "100%",
                    minWidth: 0,
                    maxHeight: 420,
                    overflow: "auto",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f8f9fb" }}>
                        <TableCell>Standard</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>File</TableCell>
                        <TableCell>Controls</TableCell>
                        <TableCell>Uploaded</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {standards.map((standard) => (
                        <TableRow key={standard.id} hover>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: "medium" }}
                            >
                              {standard.name}
                            </Typography>
                          </TableCell>
                          <TableCell>{standard.type}</TableCell>
                          <TableCell>
                            <Chip
                              label={standard.fileType.toUpperCase()}
                              size="small"
                              sx={{
                                borderRadius: 1,
                                bgcolor:
                                  standard.fileType === "xlsx"
                                    ? "rgba(46, 125, 50, 0.1)"
                                    : standard.fileType === "pdf"
                                      ? "rgba(211, 47, 47, 0.1)"
                                      : "rgba(25, 118, 210, 0.1)",
                                color:
                                  standard.fileType === "xlsx"
                                    ? "#2e7d32"
                                    : standard.fileType === "pdf"
                                      ? "#d32f2f"
                                      : "#1976d2",
                              }}
                            />
                          </TableCell>
                          <TableCell>{standard.controls}</TableCell>
                          <TableCell>{standard.uploadedOn}</TableCell>
                          <TableCell align="center">
                            <IconButton size="small" color="primary">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box
            sx={{
              p: { xs: 2, md: 3 },
              width: "100%",
              mx: 0, // no horizontal margin
            }}
          >
            <Grid
              container
              spacing={2}
              sx={{
                width: "100%",
                m: 0, // remove container margin
                px: 0, // remove horizontal padding
              }}
            >
              {/* SMTP Configuration Form (left 40%) */}
              <Grid
                item
                xs={12}
                sx={{
                  flexBasis: { md: "40%" },
                  maxWidth: { md: "40%" },
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 0,
                  pr: 0,
                }}
              >
                <Box
                  component="form"
                  onSubmit={handleSmtpSubmit}
                  sx={{
                    p: { xs: 2, md: 3 },
                    border: "1px solid rgba(0, 121, 107, 0.12)",
                    borderRadius: 1,
                    bgcolor: "rgba(0, 121, 107, 0.02)",
                    width: "100%",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ mb: 2, color: "#00796B", fontWeight: "medium" }}
                  >
                    Configure SMTP for Notifications
                  </Typography>

                  {/* Inner Grid (unchanged) */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      gap: 4,
                      alignItems: "start",
                    }}
                  >
                    {/* --- your fields stay exactly the same --- */}
                    <TextField
                      name="email"
                      label="Email Address"
                      type="email"
                      required
                      value={smtpForm.email}
                      onChange={handleSmtpChange}
                      placeholder="noreply@yourdomain.com"
                      fullWidth
                    />
                    <TextField
                      name="host"
                      label="SMTP Host"
                      required
                      value={smtpForm.host}
                      onChange={handleSmtpChange}
                      placeholder="smtp.yourdomain.com"
                      fullWidth
                    />
                    <TextField
                      name="username"
                      label="Username"
                      required
                      value={smtpForm.username}
                      onChange={handleSmtpChange}
                      fullWidth
                    />
                    <TextField
                      name="password"
                      label="Password"
                      type="password"
                      required
                      value={smtpForm.password}
                      onChange={handleSmtpChange}
                      fullWidth
                    />
                    <TextField
                      name="port"
                      label="Port"
                      type="number"
                      required
                      value={smtpForm.port}
                      onChange={handleSmtpChange}
                      placeholder="587"
                      fullWidth
                    />
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={!!smtpForm.useSsl}
                            onChange={(event, checked) =>
                              handleSmtpChange({
                                name: "useSsl",
                                value: checked,
                              })
                            }
                            color="primary"
                          />
                        }
                        label="Use SSL/TLS"
                      />
                    </Box>
                    <TextField
                      name="description"
                      label="Description"
                      value={smtpForm.description}
                      onChange={handleSmtpChange}
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="e.g., For vendor compliance reminders"
                      sx={{ gridColumn: "1 / -1" }}
                    />
                    <Box
                      sx={{
                        gridColumn: "1 / -1",
                        mt: 0.5,
                        p: 1.5,
                        bgcolor: "rgba(0, 121, 107, 0.04)",
                        borderRadius: 1,
                        border: "1px solid rgba(0,121,107,0.08)",
                        width: "100%",
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Save SMTP settings to enable system notification emails.
                        Use TLS port 587 or 465 for SSL.
                      </Typography>
                    </Box>
                  </Box>

                  {/* Actions (unchanged) */}
                  <Box
                    sx={{
                      mt: 3,
                      display: "flex",
                      gap: 2,
                      justifyContent: { xs: "center", sm: "space-between" },
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <Button
                      variant="outlined"
                      sx={{
                        borderColor: "#00796B",
                        color: "#00796B",
                        "&:hover": {
                          borderColor: "#00695C",
                          backgroundColor: "rgba(0,121,107,0.06)",
                        },
                      }}
                    >
                      Test Connection
                    </Button>

                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<AddIcon />}
                      sx={{
                        background:
                          "linear-gradient(45deg, #00796B 30%, #009688 90%)",
                        boxShadow: "0 3px 5px rgba(0, 121, 107, 0.3)",
                        transition: "all 0.2s",
                        fontWeight: "medium",
                        "&:hover": { transform: "translateY(-1px)" },
                      }}
                    >
                      Save Configuration
                    </Button>
                  </Box>
                </Box>
              </Grid>

              {/* SMTP Configurations List (right 60%) */}
              <Grid
                item
                xs={12}
                sx={{
                  flexBasis: { md: "60%" },
                  maxWidth: { md: "60%" },
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 0,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ mb: 2, color: "#00796B", fontWeight: "medium" }}
                >
                  Available SMTP Configurations
                </Typography>

                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    border: "1px solid rgba(224, 224, 224, 1)",
                    borderRadius: 1,
                    width: "100%",
                    minWidth: 0,
                    maxHeight: 420,
                    overflow: "auto",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f8f9fb" }}>
                        <TableCell>Email Address</TableCell>
                        <TableCell>SMTP Host</TableCell>
                        <TableCell>Port</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {smtpConfigs.map((config) => (
                        <TableRow key={config.id} hover>
                          <TableCell>
                            <Typography variant="body2">
                              {config.email}
                            </Typography>
                          </TableCell>
                          <TableCell>{config.host}</TableCell>
                          <TableCell>{config.port}</TableCell>
                          <TableCell>
                            <Chip
                              label={config.active ? "Active" : "Inactive"}
                              size="small"
                              color={config.active ? "success" : "default"}
                              sx={{ borderRadius: 1 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" color="primary">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Paper
                  elevation={0}
                  sx={{
                    mt: 3,
                    p: 2,
                    border: "1px solid rgba(224, 224, 224, 1)",
                    borderRadius: 1,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ mb: 2, fontWeight: "medium" }}
                  >
                    Test Email Delivery
                  </Typography>

                  <Box sx={{ display: "flex", gap: 2 }}>
                    <TextField
                      label="Recipient Email"
                      size="small"
                      sx={{ flexGrow: 1 }}
                      placeholder="Enter test recipient email"
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      sx={{
                        bgcolor: "#00796B",
                        "&:hover": {
                          bgcolor: "#00695C",
                        },
                      }}
                    >
                      Send Test
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <OrganizationSettingsPanel />
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          <InvitationsPanel />
        </TabPanel>
        <TabPanel value={tabValue} index={5}>
          <PlatformAuditPanel />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Settings;
