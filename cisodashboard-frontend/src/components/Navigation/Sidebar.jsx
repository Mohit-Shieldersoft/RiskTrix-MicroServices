import React, { useState, useEffect } from "react"; // Added useState, useEffect
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Collapse, // Added Collapse
} from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom"; // Added useLocation
import DashboardIcon from "@mui/icons-material/Dashboard";
import SecurityIcon from "@mui/icons-material/Security";
import HistoryIcon from "@mui/icons-material/History";
import BarChartIcon from "@mui/icons-material/BarChart";
import TaskIcon from "@mui/icons-material/Task";
import SettingsIcon from "@mui/icons-material/Settings";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import TimelineIcon from "@mui/icons-material/Timeline";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AppIcon from "@mui/icons-material/Apps";
import AssessmentIcon from "@mui/icons-material/Assessment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import ExpandLess from "@mui/icons-material/ExpandLess"; // Added ExpandLess
import ExpandMore from "@mui/icons-material/ExpandMore"; // Added ExpandMore
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import FolderIcon from "@mui/icons-material/Folder"; // Example icon for parent items
import GavelIcon from "@mui/icons-material/Gavel"; // Example icon for Audit parent
import CloudQueueIcon from "@mui/icons-material/CloudQueue";
import StorageIcon from "@mui/icons-material/Storage";
import HubIcon from "@mui/icons-material/Hub";
import DnsIcon from "@mui/icons-material/Dns";
import InventoryIcon from "@mui/icons-material/Inventory";

import AltRouteIcon from "@mui/icons-material/AltRoute";
import LockIcon from "@mui/icons-material/Lock";
import NetworkCheckIcon from "@mui/icons-material/NetworkCheck";

import dashboardTheme from "../../theme/dashboardTheme";

const Sidebar = ({ open, onClose }) => {
  const location = useLocation(); // Use location hook
  const currentPath = location.pathname;

  // State to manage open submenus { 'Application': false, 'Audit': false }
  const [openSubmenus, setOpenSubmenus] = useState({});

  // Define menu structure with children for submenus
  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/",
    },
    {
      text: "Application",
      icon: <FolderIcon />, // Parent icon
      children: [
        {
          text: "Ageing",
          icon: <TaskIcon />,
          path: "/ageing",
        },
        {
          text: "Closure Tracking",
          icon: <TaskIcon />,
          path: "/closure-tracking",
        },
        {
          text: "App Reminders",
          icon: <AppIcon />,
          path: "/application-reminder",
        },
        {
          text: "App History",
          icon: <HistoryIcon />,
          path: "/app-history",
        },
      ],
    },
    {
      text: "Audit",
      icon: <GavelIcon />, // Parent icon
      children: [
        {
          text: "Regulatory Compliance",
          icon: <VerifiedUserIcon />,
          path: "/audit", // Assuming this is the correct path
        },
        {
          text: "Vendor Compliance",
          icon: <CheckCircleIcon />,
          path: "/compliance",
        },
        {
          text: "TPRM",
          icon: <SecurityIcon />,
          path: "/tprm",
        },
        {
          text: "Exceptions",
          icon: <ReportProblemIcon />,
          path: "/exceptions",
        },
        {
          text: "Audit History",
          icon: <TimelineIcon />,
          path: "/audit-history",
        },
        {
          text: "Reminders",
          icon: <NotificationsIcon />,
          path: "/reminder",
        },
      ],
    },
    {
      text: "Endpoint Security",
      icon: <SecurityIcon />, // Parent icon
      children: [
        {
          text: "Endpoint Overview",
          icon: <DashboardIcon />,
          path: "/endpoint-security/overview",
        },
        {
          text: "Binary Inventory",
          icon: <FolderIcon />,
          path: "/binary-inventory",
        },
        {
          text: "Malware Detections",
          icon: <ReportProblemIcon />,
          path: "/malware-detections",
        },
        {
          text: "Integrity Monitoring",
          icon: <VerifiedUserIcon />,
          path: "/integrity-monitoring",
        },
        {
          text: "Threat Intelligence",
          icon: <SecurityIcon />,
          path: "/threat-intelligence",
        },
        {
          text: "CVE Findings",
          icon: <AssessmentIcon />,
          path: "/cve-findings",
        },
        {
          text: "Agent Management",
          icon: <SettingsIcon />,
          path: "/endpoint-security/agents",
        },
      ],
    },
    {
      text: "Cloud Posture",
      icon: <CloudQueueIcon />,
      children: [
        { text: "Cloud Accounts", icon: <CloudQueueIcon />, path: "/cloud" },
        { text: "Asset Explorer", icon: <StorageIcon />, path: "/assets" },
        { text: "CSPM Findings", icon: <ReportProblemIcon />, path: "/findings" },
        { text: "Policies", icon: <GavelIcon />, path: "/policies" },
        { text: "Cloud Compliance", icon: <VerifiedUserIcon />, path: "/cloud/compliance" },
        { text: "Security Score", icon: <AssessmentIcon />, path: "/security-score" },
        { text: "Network", icon: <DnsIcon />, path: "/network" },
        { text: "Databases", icon: <StorageIcon />, path: "/databases" },
        { text: "Compute", icon: <InventoryIcon />, path: "/compute" },
      ],
    },
    {
      text: "Workloads",
      icon: <DnsIcon />,
      children: [
        { text: "CIEM", icon: <HubIcon />, path: "/ciem" },
        { text: "Kubernetes", icon: <DnsIcon />, path: "/kubernetes" },
        { text: "Containers", icon: <InventoryIcon />, path: "/containers" },
        { text: "SBOM", icon: <InventoryIcon />, path: "/containers/sbom" },
        { text: "Runtime", icon: <SecurityIcon />, path: "/runtime" },
        { text: "Secrets & IaC", icon: <LockIcon />, path: "/cloud/secrets" },
      ],
    },
    {
      text: "Detection",
      icon: <NotificationsIcon />,
      children: [
        { text: "Alert Inbox", icon: <NotificationsIcon />, path: "/alerts" },
        { text: "Vulnerabilities", icon: <AssessmentIcon />, path: "/cloud/vulnerabilities" },
        { text: "Attack Paths", icon: <AltRouteIcon />, path: "/cloud/attack-paths" },
        { text: "Toxic Risks", icon: <HubIcon />, path: "/cloud/toxic-risks" },
        { text: "SOAR Playbooks", icon: <AutoFixHighIcon />, path: "/soar/playbooks" },
        { text: "Webhooks", icon: <HubIcon />, path: "/notifications" },
        { text: "IP Scanner", icon: <NetworkCheckIcon />, path: "/ip-scanner" },
        { text: "Search", icon: <AssessmentIcon />, path: "/search" },
      ],
    },
    {
      text: "EOSL",
      icon: <EventBusyIcon />,
      path: "/eosl",
    },
    {
      text: "Reports",
      icon: <BarChartIcon />,
      path: "/reports",
    },
    {
      text: "Help",
      icon: <AssessmentIcon />,
      path: "/help",
    },
    {
      text: "Platform Audit",
      icon: <HistoryIcon />,
      path: "/platform-audit",
    },
    {
      text: "Settings",
      icon: <SettingsIcon />,
      path: "/settings",
    },
    {
      text: "Roles",
      icon: <VerifiedUserIcon />,
      path: "/admin/roles",
    },
    {
      text: "Users",
      icon: <SettingsIcon />,
      path: "/admin/users",
    },
  ];

  // Function to handle submenu toggle
  const handleSubmenuClick = (text) => {
    setOpenSubmenus((prev) => ({ ...prev, [text]: !prev[text] }));
  };

  // Effect to open parent menu if a child is selected on initial load or navigation
  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.children) {
        const isChildSelected = item.children.some(
          (child) => child.path === currentPath,
        );
        if (isChildSelected && !openSubmenus[item.text]) {
          // Open the parent submenu if a child is selected and the parent is closed
          handleSubmenuClick(item.text);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath]); // Rerun when path changes

  // Helper function to check if a parent menu item should appear selected
  const isParentSelected = (item) => {
    return item.children?.some((child) => child.path === currentPath);
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          width: 280,
          background: dashboardTheme.colors.background.paper,
          borderRight: "1px solid rgba(63, 81, 181, 0.08)",
        },
      }}
    >
      <Box sx={{ p: 2, display: "flex", alignItems: "center", height: 64 }}>
        <Typography
          variant="h6"
          component="div"
          sx={{ fontWeight: 700, color: dashboardTheme.colors.primary }}
        >
          RiskTrix
        </Typography>
      </Box>
      <Divider />
      <List sx={{ pt: 1, pb: 3, overflowY: "auto" }}>
        {" "}
        {/* Add padding top */}
        {menuItems.map((item) => {
          const isSelected = currentPath === item.path;
          const isParentCurrentlySelected = isParentSelected(item);
          const isSubmenuOpen = openSubmenus[item.text] || false;

          if (item.children) {
            // Render item with submenu
            return (
              <React.Fragment key={item.text}>
                <ListItemButton
                  onClick={() => handleSubmenuClick(item.text)}
                  sx={{
                    mb: 0.5,
                    borderRadius: "0 24px 24px 0",
                    backgroundColor: isParentCurrentlySelected
                      ? `${dashboardTheme.colors.primary}10`
                      : "transparent", // Highlight parent if child selected
                    "&:hover": {
                      backgroundColor: `${dashboardTheme.colors.primary}10`,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: "40px",
                      color: isParentCurrentlySelected
                        ? dashboardTheme.colors.primary
                        : "inherit",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isParentCurrentlySelected
                        ? dashboardTheme.typography.fontWeights.semibold
                        : dashboardTheme.typography.fontWeights.medium,
                    }}
                  />
                  {isSubmenuOpen ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={isSubmenuOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child) => {
                      const isChildSelected = currentPath === child.path;
                      return (
                        <ListItemButton
                          key={child.text}
                          component={RouterLink}
                          to={child.path}
                          selected={isChildSelected}
                          onClick={onClose} // Close sidebar on child click
                          sx={{
                            pl: 4, // Indent submenu items
                            mb: 0.5,
                            borderRadius: "0 24px 24px 0",
                            "&.Mui-selected": {
                              backgroundColor: `${dashboardTheme.colors.primary}15`,
                              color: dashboardTheme.colors.primary,
                              "& .MuiListItemIcon-root": {
                                color: dashboardTheme.colors.primary,
                              },
                            },
                            "&:hover": {
                              backgroundColor: `${dashboardTheme.colors.primary}10`,
                            },
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: "35px", // Slightly smaller icon spacing
                              color: isChildSelected
                                ? dashboardTheme.colors.primary
                                : "inherit",
                            }}
                          >
                            {child.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={child.text}
                            primaryTypographyProps={{
                              fontSize: "0.9rem", // Slightly smaller font for children
                              fontWeight: isChildSelected
                                ? dashboardTheme.typography.fontWeights.semibold
                                : dashboardTheme.typography.fontWeights.medium,
                            }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          } else {
            // Render regular item
            return (
              <ListItemButton
                key={item.text}
                component={RouterLink}
                to={item.path}
                selected={isSelected}
                onClick={onClose}
                sx={{
                  mb: 0.5,
                  borderRadius: "0 24px 24px 0",
                  "&.Mui-selected": {
                    backgroundColor: `${dashboardTheme.colors.primary}15`,
                    color: dashboardTheme.colors.primary,
                    "& .MuiListItemIcon-root": {
                      color: dashboardTheme.colors.primary,
                    },
                  },
                  "&:hover": {
                    backgroundColor: `${dashboardTheme.colors.primary}10`,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: "40px",
                    color: isSelected
                      ? dashboardTheme.colors.primary
                      : "inherit",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isSelected
                      ? dashboardTheme.typography.fontWeights.semibold
                      : dashboardTheme.typography.fontWeights.medium,
                  }}
                />
              </ListItemButton>
            );
          }
        })}
      </List>
    </Drawer>
  );
};

export default Sidebar;
