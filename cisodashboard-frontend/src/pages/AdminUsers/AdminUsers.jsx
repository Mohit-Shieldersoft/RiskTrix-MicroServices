import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Chip,
  Avatar,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  InputAdornment,
  CircularProgress,
  Stack,
  Alert,
} from "@mui/material";
import Toast from "../../components/common/Toast";
import { useToast } from "../../components/common/useToast";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  Shield as ShieldIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  AdminPanelSettings as AdminIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import api from "../../utils/api";

// ── Constants ──────────────────────────────────────────────────────────────
const ROLES = [
  "ADMIN",
  "CISO",
  "INFOSEC_MANAGER",
  "SECURITY_ANALYST",
  "INTERNAL_AUDITOR",
  "EXTERNAL_AUDITOR",
  "VIEWER",
];

const ROLE_COLORS = {
  ADMIN: "#d32f2f",
  CISO: "#7b1fa2",
  INFOSEC_MANAGER: "#1565c0",
  SECURITY_ANALYST: "#2e7d32",
  INTERNAL_AUDITOR: "#e65100",
  EXTERNAL_AUDITOR: "#bf360c",
  VIEWER: "#546e7a",
};

const PRIVILEGE_LEVELS = ["standard", "elevated", "admin"];
const CLEARANCE_LEVELS = ["low", "medium", "high", "top_secret"];

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const EMPTY_FORM = {
  full_name: "",
  email: "",
  username: "",
  password: "",
  role: "VIEWER",
  privilege_level: "standard",
  clearance_level: "low",
  department: "",
  company: "",
  phone: "",
  is_active: true,
  is_superuser: false,
};

// ── Component ──────────────────────────────────────────────────────────────
const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = create mode
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("VIEWER");
  const [inviting, setInviting] = useState(false);

  // Toast
  const { toast, showToast, closeToast } = useToast();

  // ── Fetch ──────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/users/");
      const items = res.data?.items || res.data || [];
      setUsers(
        items.map((u) => ({
          id: u.id,
          full_name: u.full_name || u.username || "",
          email: u.email || "",
          username: u.username || "",
          role: u.role || "VIEWER",
          privilege_level: u.privilege_level || "standard",
          clearance_level: u.clearance_level || "low",
          department: u.department || "",
          company: u.company || "",
          phone: u.phone || "",
          is_active: u.is_active !== false,
          is_superuser: !!u.is_superuser,
          created_at: u.created_at?.split("T")[0] || "",
          last_login: u.last_login?.split("T")[0] || "—",
        })),
      );
    } catch (err) {
      showToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // ── Filtered list ─────────────────────────────────────────────────────
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q);
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // ── Dialog helpers ────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (user) => {
    setEditingId(user.id);
    setForm({
      full_name: user.full_name,
      email: user.email,
      username: user.username,
      password: "", // blank = don't change
      role: user.role,
      privilege_level: user.privilege_level,
      clearance_level: user.clearance_level,
      department: user.department,
      company: user.company,
      phone: user.phone,
      is_active: user.is_active,
      is_superuser: user.is_superuser,
    });
    setFormError("");
    setDialogOpen(true);
  };

  const handleFormChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.full_name || !form.email || !form.role) {
      setFormError("Full name, email, and role are required.");
      return;
    }
    if (!editingId && !form.password) {
      setFormError("Password is required when creating a user.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password; // omit if blank (update)

      if (editingId) {
        await api.put(`/api/v1/users/${editingId}`, payload);
        showToast("User updated successfully");
      } else {
        await api.post("/api/v1/users/", payload);
        showToast("User created successfully");
      }
      setDialogOpen(false);
      loadUsers();
    } catch (err) {
      const detail =
        err?.response?.data?.detail || err.message || "Save failed";
      setFormError(
        typeof detail === "string" ? detail : JSON.stringify(detail),
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────
  const confirmDelete = (user) => {
    setDeleteTarget(user);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/api/v1/users/${deleteTarget.id}`);
      showToast(`User "${deleteTarget.full_name}" deleted`);
      setDeleteOpen(false);
      loadUsers();
    } catch (err) {
      showToast(
        "Delete failed: " + (err?.response?.data?.detail || err.message),
        "error",
      );
    }
  };

  // ── Toggle active ──────────────────────────────────────────────────────
  const toggleActive = async (user) => {
    try {
      await api.patch(`/api/v1/users/${user.id}`, {
        is_active: !user.is_active,
      });
      showToast(`User ${!user.is_active ? "activated" : "deactivated"}`);
      loadUsers();
    } catch (err) {
      showToast("Update failed", "error");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: "100%" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <AdminIcon sx={{ fontSize: 32, color: "#d32f2f" }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              User Management
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {users.length} users · Admin only
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={loadUsers} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button variant="outlined" onClick={() => setInviteOpen(true)}>
            Invite User
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={openCreate}
            sx={{ bgcolor: "#1565c0" }}
          >
            Add User
          </Button>
        </Stack>
      </Box>

      {/* Filters */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          border: "1px solid #e0e0e0",
          borderRadius: 2,
        }}
      >
        <TextField
          size="small"
          placeholder="Search name, email, username…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Role</InputLabel>
          <Select
            label="Role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <MenuItem value="ALL">All Roles</MenuItem>
            {ROLES.map((r) => (
              <MenuItem key={r} value={r}>
                {r.replace(/_/g, " ")}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Table */}
      <Paper elevation={1} sx={{ borderRadius: 2, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    Department / Company
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Clearance</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Last Login</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      align="center"
                      sx={{ py: 4, color: "text.secondary" }}
                    >
                      No users found
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((user) => (
                  <TableRow key={user.id} hover>
                    {/* User column */}
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: ROLE_COLORS[user.role] || "#546e7a",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {getInitials(user.full_name)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {user.full_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Role */}
                    <TableCell>
                      <Chip
                        label={user.role.replace(/_/g, " ")}
                        size="small"
                        sx={{
                          bgcolor: ROLE_COLORS[user.role] || "#546e7a",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 10,
                        }}
                      />
                    </TableCell>

                    {/* Dept / Company */}
                    <TableCell>
                      <Typography variant="body2">
                        {user.department || "—"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.company}
                      </Typography>
                    </TableCell>

                    {/* Clearance */}
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <ShieldIcon
                          sx={{ fontSize: 14, color: "text.secondary" }}
                        />
                        <Typography variant="caption">
                          {user.privilege_level} · {user.clearance_level}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Tooltip
                        title={
                          user.is_active
                            ? "Click to deactivate"
                            : "Click to activate"
                        }
                      >
                        <Chip
                          icon={
                            user.is_active ? (
                              <ActiveIcon
                                sx={{ fontSize: "14px !important" }}
                              />
                            ) : (
                              <InactiveIcon
                                sx={{ fontSize: "14px !important" }}
                              />
                            )
                          }
                          label={user.is_active ? "Active" : "Inactive"}
                          size="small"
                          onClick={() => toggleActive(user)}
                          sx={{
                            cursor: "pointer",
                            bgcolor: user.is_active ? "#e8f5e9" : "#fce4ec",
                            color: user.is_active ? "#2e7d32" : "#c62828",
                            fontWeight: 600,
                          }}
                        />
                      </Tooltip>
                    </TableCell>

                    {/* Last login */}
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {user.last_login}
                      </Typography>
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        justifyContent="center"
                      >
                        <Tooltip title="Edit user">
                          <IconButton
                            size="small"
                            onClick={() => openEdit(user)}
                          >
                            <EditIcon
                              fontSize="small"
                              sx={{ color: "#1565c0" }}
                            />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete user">
                          <IconButton
                            size="small"
                            onClick={() => confirmDelete(user)}
                          >
                            <DeleteIcon
                              fontSize="small"
                              sx={{ color: "#c62828" }}
                            />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ── Create / Edit Dialog ── */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {editingId ? "Edit User" : "Create New User"}
        </DialogTitle>
        <DialogContent dividers>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Full Name *"
                size="small"
                fullWidth
                value={form.full_name}
                onChange={(e) => handleFormChange("full_name", e.target.value)}
              />
              <TextField
                label="Username"
                size="small"
                fullWidth
                value={form.username}
                onChange={(e) => handleFormChange("username", e.target.value)}
              />
            </Stack>
            <TextField
              label="Email *"
              size="small"
              fullWidth
              type="email"
              value={form.email}
              onChange={(e) => handleFormChange("email", e.target.value)}
            />
            <TextField
              label={
                editingId ? "New Password (leave blank to keep)" : "Password *"
              }
              size="small"
              fullWidth
              type="password"
              value={form.password}
              onChange={(e) => handleFormChange("password", e.target.value)}
            />
            <Stack direction="row" spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Role *</InputLabel>
                <Select
                  label="Role *"
                  value={form.role}
                  onChange={(e) => handleFormChange("role", e.target.value)}
                >
                  {ROLES.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r.replace(/_/g, " ")}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Privilege Level</InputLabel>
                <Select
                  label="Privilege Level"
                  value={form.privilege_level}
                  onChange={(e) =>
                    handleFormChange("privilege_level", e.target.value)
                  }
                >
                  {PRIVILEGE_LEVELS.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <Stack direction="row" spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Clearance Level</InputLabel>
                <Select
                  label="Clearance Level"
                  value={form.clearance_level}
                  onChange={(e) =>
                    handleFormChange("clearance_level", e.target.value)
                  }
                >
                  {CLEARANCE_LEVELS.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c.replace("_", " ")}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Phone"
                size="small"
                fullWidth
                value={form.phone}
                onChange={(e) => handleFormChange("phone", e.target.value)}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Department"
                size="small"
                fullWidth
                value={form.department}
                onChange={(e) => handleFormChange("department", e.target.value)}
              />
              <TextField
                label="Company"
                size="small"
                fullWidth
                value={form.company}
                onChange={(e) => handleFormChange("company", e.target.value)}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={form.is_active ? "active" : "inactive"}
                  onChange={(e) =>
                    handleFormChange("is_active", e.target.value === "active")
                  }
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Superuser</InputLabel>
                <Select
                  label="Superuser"
                  value={form.is_superuser ? "yes" : "no"}
                  onChange={(e) =>
                    handleFormChange("is_superuser", e.target.value === "yes")
                  }
                >
                  <MenuItem value="no">No</MenuItem>
                  <MenuItem value="yes">Yes</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            {saving ? "Saving…" : editingId ? "Save Changes" : "Create User"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Invite User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              size="small"
              fullWidth
              label="Email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Role</InputLabel>
              <Select label="Role" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                {ROLES.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role.replace(/_/g, " ")}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setInviteOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={inviting || !inviteEmail}
            onClick={async () => {
              setInviting(true);
              try {
                await api.post(
                  `/api/v1/invitations?email=${encodeURIComponent(inviteEmail)}&role=${encodeURIComponent(inviteRole)}`
                );
                showToast(`Invitation sent to ${inviteEmail}`);
                setInviteOpen(false);
                setInviteEmail("");
              } catch (err) {
                showToast(err?.response?.data?.detail || "Invite failed", "error");
              } finally {
                setInviting(false);
              }
            }}
          >
            {inviting ? "Sending…" : "Send Invite"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle fontWeight={700}>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete{" "}
            <strong>{deleteTarget?.full_name}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Toast ── */}
      <Toast toast={toast} onClose={closeToast} />
    </Box>
  );
};

export default AdminUsers;
