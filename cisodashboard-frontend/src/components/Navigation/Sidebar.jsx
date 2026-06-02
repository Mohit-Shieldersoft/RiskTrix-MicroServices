import React, { useState, useEffect } from "react";
import {
  Drawer,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Collapse,
} from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
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
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import FolderIcon from "@mui/icons-material/Folder";
import GavelIcon from "@mui/icons-material/Gavel";
import PolicyIcon from "@mui/icons-material/Policy";
import DevicesIcon from "@mui/icons-material/Devices";
import InventoryIcon from "@mui/icons-material/Inventory";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";

import dashboardTheme from "../../theme/dashboardTheme";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import AssignmentIcon from "@mui/icons-material/Assignment";
import SendIcon from "@mui/icons-material/Send";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ShieldIcon from "@mui/icons-material/Shield";
import GroupsIcon from "@mui/icons-material/Groups";
import GppBadIcon from "@mui/icons-material/GppBad";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import FolderIcon2 from "@mui/icons-material/Folder";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import QueuePlayNextIcon from "@mui/icons-material/QueuePlayNext";
import { hasPermission } from "../../utils/permissions";
import { hasRole } from "../../utils/permissions";

const Sidebar = ({ open, onClose }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [openSubmenus, setOpenSubmenus] = useState({});

 const menuItems = [
  {
    text: "Dashboard",
    icon: <DashboardIcon />,
    path: "/",
    visible: true,
  },

  {
    text: "Application",
    icon: <FolderIcon />,
    visible: hasPermission("application", "view"),
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
    icon: <GavelIcon />,
    visible: hasPermission("audit", "view"),
    children: [
      {
        text: "Regulatory Compliance",
        icon: <VerifiedUserIcon />,
        path: "/audit",
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
    text: "Asset Management",
    icon: <InventoryIcon />,
    visible: hasPermission("assets", "view"),
    children: [
      {
        text: "Asset Inventory",
        icon: <InventoryIcon />,
        path: "/assets",
      },
      {
        text: "Asset Dashboard",
        icon: <AssessmentIcon />,
        path: "/assets/dashboard",
      },
    ],
  },

  {
    text: "Policies",
    icon: <PolicyIcon />,
    visible: hasPermission("policies", "view"),
    children: [
      {
        text: "Policy Dashboard",
        icon: <AssessmentIcon />,
        path: "/policies/dashboard",
      },
      {
        text: "Policy Management",
        icon: <PolicyIcon />,
        path: "/policies",
      },
      {
        text: "Policy Assignments",
        icon: <AssignmentIcon />,
        path: "/policies/assignments",
      },
      {
        text: "Bulk Assign",
        icon: <SendIcon />,
        path: "/policies/bulk-assign",
        visible: hasPermission("policies", "bulk_assign"),
      },
      {
        text: "Conflict Report",
        icon: <ReportProblemIcon />,
        path: "/policies/conflicts",
      },
      {
        text: "Policy Templates",
        icon: <FlashOnIcon />,
        path: "/policies/templates",
      },
      {
        text: "Compliance Dashboard",
        icon: <ShieldIcon />,
        path: "/compliance",
      },
      {
        text: "Device Groups",
        icon: <GroupsIcon />,
        path: "/groups",
      },
      {
        text: "Devices",
        icon: <DevicesIcon />,
        path: "/devices",
      },
      {
        text: "Enrollment Dashboard",
        icon: <AssessmentIcon />,
        path: "/enrollment",
      },
      {
        text: "Enroll Device",
        icon: <AddCircleOutlineIcon />,
        path: "/enrollment/enroll",
      },
    ],
  },

  {
    text: "Tickets",
    icon: <ConfirmationNumberIcon />,
    visible: hasPermission("tickets", "view"),
    children: [
      {
        text: "All Tickets",
        icon: <ConfirmationNumberIcon />,
        path: "/tickets",
      },
      {
        text: "Ticket Dashboard",
        icon: <AssessmentIcon />,
        path: "/tickets/dashboard",
      },
      {
        text: "Ticket Assignments",
        icon: <AssessmentIcon />,
        path: "/tickets/assignments",
      },
      {
        text: "Assignments",
        icon: <GroupsIcon />,
        path: "/tickets/assignments",
      },
    ],
  },

  {
    text: "Security",
    icon: <GppBadIcon />,
    visible: hasPermission("vulnerabilities", "view"),
    children: [
      {
        text: "Security Dashboard",
        icon: <GppBadIcon />,
        path: "/security",
      },
      {
        text: "Submit Agent Report",
        icon: <SendIcon />,
        path: "/security/report",
      },
    ],
  },

  {
    text: "Automation",
    icon: <AutoFixHighIcon />,
    visible: hasPermission("automation", "view"),
    children: [
      {
        text: "Automation Rules",
        icon: <AutoFixHighIcon />,
        path: "/automation",
      },
      {
        text: "New Rule",
        icon: <AddCircleOutlineIcon />,
        path: "/automation/new",
      },
    ],
  },

  {
    text: "File Manager",
    icon: <FolderIcon2 />,
    path: "/files",
    visible: hasPermission("files", "view"),
  },

  {
    text: "Agent Directory",
    icon: <PeopleAltIcon />,
    path: "/directory",
    visible: hasPermission("users", "view"),
  },

  {
    text: "Search",
    icon: <ManageSearchIcon />,
    path: "/search",
    visible: true,
  },

  {
    text: "Queue Monitor",
    icon: <QueuePlayNextIcon />,
    path: "/queue",
    visible: hasPermission("queue", "view"),
  },

  {
    text: "EOSL",
    icon: <EventBusyIcon />,
    path: "/eosl",
    visible: hasPermission("eosl", "view"),
  },

  {
    text: "Reports",
    icon: <BarChartIcon />,
    path: "/reports",
    visible: hasPermission("reports", "view"),
  },

  {
    text: "Settings",
    icon: <SettingsIcon />,
    path: "/settings",
    visible: hasPermission("settings", "view"),
  },
];

  const handleSubmenuClick = (text) => {
    setOpenSubmenus((prev) => ({ ...prev, [text]: !prev[text] }));
  };

  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.children) {
        const isChildSelected = item.children.some(
          (child) => child.path === currentPath,
        );
        if (isChildSelected && !openSubmenus[item.text]) {
          handleSubmenuClick(item.text);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath]);

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
          width: 250,
          background: dashboardTheme.colors.background.main,
          borderRight: "none",
        },
      }}
    >
      <Box sx={{ p: 2, display: "flex", alignItems: "center", height: "64px" }}>
        <Typography
          variant="h6"
          component="div"
          sx={{ fontWeight: "bold", color: dashboardTheme.colors.primary }}
        >
          Vulnerability Monitor
        </Typography>
      </Box>
      <Divider />
      <List sx={{ pt: 1 }}>
        {menuItems
  .filter((item) => item.visible !== false)
  .map((item) => {
          const isSelected = currentPath === item.path;
          const isParentCurrentlySelected = isParentSelected(item);
          const isSubmenuOpen = openSubmenus[item.text] || false;

          if (item.children) {
            return (
              <React.Fragment key={item.text}>
                <ListItemButton
                  onClick={() => handleSubmenuClick(item.text)}
                  sx={{
                    mb: 0.5,
                    borderRadius: "0 24px 24px 0",
                    backgroundColor: isParentCurrentlySelected
                      ? `${dashboardTheme.colors.primary}10`
                      : "transparent",
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
                    {item.children.filter((child) => child.visible !== false).map((child) => {
                      const isChildSelected = currentPath === child.path;
                      return (
                        <ListItemButton
                          key={child.text}
                          component={RouterLink}
                          to={child.path}
                          selected={isChildSelected}
                          onClick={onClose}
                          sx={{
                            pl: 4,
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
                              minWidth: "35px",
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
                              fontSize: "0.9rem",
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
