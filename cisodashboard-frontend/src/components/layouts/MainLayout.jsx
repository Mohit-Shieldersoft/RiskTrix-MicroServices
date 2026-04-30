import React, { useState } from "react"; // Removed useEffect as it wasn't used in the base version
import {
  AppBar,
  Box,
  CssBaseline,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  Badge,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Sidebar from "../Navigation/Sidebar";
import dashboardTheme from "../../theme/dashboardTheme";
import NotificationPanel from "../NotificationPanel/NotificationPanel";
import UserMenu from "../UserMenu/UserMenu";
import { useNavigate } from "react-router-dom";

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const theme = useTheme();

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    // Base working layout structure
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
        elevation={2}
        sx={{
          // Using theme color from base version
          bgcolor: dashboardTheme.colors.primary,
          height: "64px", // Fixed height
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          {/* Left side: Menu Icon and Title */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleSidebarToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ fontWeight: 600 }}
            >
              RiskTrix
            </Typography>
          </Box>

          {/* Right side: Action buttons - INTEGRATE NotificationPanel HERE */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {" "}
            {/* Added alignItems */}
            {/* Add the NotificationPanel component */}
            <NotificationPanel />
            <UserMenu />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar (using base version logic) */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area (using base version logic) */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: "100%", // Ensure it tries to take full width
          mt: "64px", // Fixed margin top matching AppBar height
          bgcolor: dashboardTheme.colors.background.main, // Use theme background
          minHeight: "calc(100vh - 64px)", // Viewport height minus AppBar height
          // px: 0 // Keep horizontal padding removed if that was intended
          // Add some padding if needed for content spacing:
          p: theme.spacing(3), // Example padding
          overflowY: "auto", // Ensure content area can scroll if needed
        }}
      >
        {/* Add a test element to confirm visibility */}
        {/* <Typography variant="h3" color="error">CONTENT VISIBLE?</Typography> */}
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;
