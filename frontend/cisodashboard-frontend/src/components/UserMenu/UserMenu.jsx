import React, { useState } from "react";
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Avatar,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  ExitToApp as LogoutIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as AdminIcon,
  Email as EmailIcon,
  Work as WorkIcon,
  Shield as ShieldIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { clearAuth, getUserProfile } from "../../utils/auth";

// Role badge colours
const ROLE_COLORS = {
  ADMIN: "#d32f2f",
  CISO: "#7b1fa2",
  INFOSEC_MANAGER: "#1565c0",
  SECURITY_ANALYST: "#2e7d32",
  INTERNAL_AUDITOR: "#e65100",
  EXTERNAL_AUDITOR: "#bf360c",
  VIEWER: "#546e7a",
};

function getRoleColor(role) {
  return ROLE_COLORS[role?.toUpperCase()] || "#546e7a";
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const UserMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const profile = getUserProfile();

  const handleMenu = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    try {
      await api.post("/api/v1/auth/logout");
    } catch (err) {
      console.warn(
        "Logout request failed (continuing local logout):",
        err?.message || err,
      );
    } finally {
      try {
        clearAuth();
      } catch (e) {
        /* ignore */
      }
      handleClose();
      try {
        navigate("/login", { replace: true });
        setTimeout(() => {
          if (!window.location.pathname.endsWith("/login")) return;
          window.location.reload();
        }, 150);
      } catch {
        window.location.href = "/login";
      }
    }
  };

  const isAdmin = profile?.role?.toUpperCase() === "ADMIN";

  return (
    <>
      {/* Avatar button in AppBar */}
      <Tooltip title={profile?.full_name || profile?.username || "User"}>
        <IconButton
          onClick={handleMenu}
          aria-label="user account menu"
          aria-controls="user-menu"
          aria-haspopup="true"
          sx={{ p: 0.5 }}
        >
          <Avatar
            sx={{
              width: 34,
              height: 34,
              bgcolor: getRoleColor(profile?.role),
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {getInitials(profile?.full_name || profile?.username)}
          </Avatar>
        </IconButton>
      </Tooltip>

      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          elevation: 4,
          sx: { minWidth: 280, borderRadius: 2, mt: 0.5, overflow: "visible" },
        }}
      >
        {/* ── Profile header card ── */}
        <Box
          sx={{
            px: 2.5,
            py: 2,
            display: "flex",
            gap: 1.5,
            alignItems: "flex-start",
          }}
        >
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: getRoleColor(profile?.role),
              fontSize: 18,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {getInitials(profile?.full_name || profile?.username)}
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {profile?.full_name || profile?.username || "Unknown User"}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              display="block"
            >
              @{profile?.username}
            </Typography>
            <Chip
              label={profile?.role?.replace(/_/g, " ") || "Unknown Role"}
              size="small"
              sx={{
                mt: 0.5,
                height: 20,
                fontSize: 10,
                fontWeight: 700,
                bgcolor: getRoleColor(profile?.role),
                color: "#fff",
              }}
            />
          </Box>
        </Box>

        {/* ── Detail rows ── */}
        <Box
          sx={{
            px: 2.5,
            pb: 1.5,
            display: "flex",
            flexDirection: "column",
            gap: 0.6,
          }}
        >
          {profile?.email && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <EmailIcon sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary" noWrap>
                {profile.email}
              </Typography>
            </Box>
          )}
          {profile?.department && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <WorkIcon sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary" noWrap>
                {profile.department}
              </Typography>
            </Box>
          )}
          {profile?.company && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PersonIcon sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary" noWrap>
                {profile.company}
              </Typography>
            </Box>
          )}
          {(profile?.privilege_level || profile?.clearance_level) && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ShieldIcon sx={{ fontSize: 14, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">
                {[profile.privilege_level, profile.clearance_level]
                  .filter(Boolean)
                  .map((v) => v.charAt(0).toUpperCase() + v.slice(1))
                  .join(" · ")}
              </Typography>
            </Box>
          )}
        </Box>

        <Divider />

        {/* ── Actions ── */}
        <MenuItem
          onClick={() => {
            handleClose();
            navigate("/settings");
          }}
          sx={{ py: 1.2 }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>

        {/* Admin-only: User Management */}
        {isAdmin && (
          <MenuItem
            onClick={() => {
              handleClose();
              navigate("/admin/users");
            }}
            sx={{ py: 1.2 }}
          >
            <ListItemIcon>
              <AdminIcon fontSize="small" sx={{ color: "#d32f2f" }} />
            </ListItemIcon>
            <ListItemText
              primary="User Management"
              primaryTypographyProps={{ color: "#d32f2f", fontWeight: 600 }}
            />
          </MenuItem>
        )}

        <Divider />

        <MenuItem onClick={handleLogout} sx={{ py: 1.2 }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{ color: "error" }}
          />
        </MenuItem>
      </Menu>
    </>
  );
};

export default UserMenu;
