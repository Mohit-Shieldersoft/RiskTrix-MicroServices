import React, { useState } from "react";
import {
  AppBar,
  Box,
  CssBaseline,
  IconButton,
  Toolbar,
  Typography,
  Tooltip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import Sidebar from "../Navigation/Sidebar";
import dashboardTheme from "../../theme/dashboardTheme";
import NotificationPanel from "../NotificationPanel/NotificationPanel";
import UserMenu from "../UserMenu/UserMenu";
import { useNavigate } from "react-router-dom";
import CommandPalette from "../common/CommandPalette";

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const onKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        minHeight: "100vh",
        backgroundColor: dashboardTheme.colors.background.main,
      }}
    >
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: dashboardTheme.colors.primary,
          height: 64,
          zIndex: (muiTheme) => muiTheme.zIndex.drawer + 1,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between", minHeight: "64px !important" }}>
          <Box sx={{ display: "flex", alignItems: "center", minWidth: 0 }}>
            <IconButton
              color="inherit"
              aria-label="open navigation"
              edge="start"
              onClick={() => setSidebarOpen((open) => !open)}
              sx={{ mr: 1.5 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              noWrap
              sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}
            >
              RiskTrix
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Tooltip title="Search / Ctrl+K">
              <IconButton color="inherit" onClick={() => setPaletteOpen(true)}>
                <SearchIcon />
              </IconButton>
            </Tooltip>
            <NotificationPanel />
            <UserMenu />
          </Box>
        </Toolbar>
      </AppBar>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: "100%",
          mt: "64px",
          bgcolor: dashboardTheme.colors.background.main,
          minHeight: "calc(100vh - 64px)",
          p: { xs: 1.5, sm: 2, md: 3 },
          overflowX: "hidden",
          overflowY: "auto",
        }}
      >
        {children}
      </Box>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </Box>
  );
};

export default MainLayout;
