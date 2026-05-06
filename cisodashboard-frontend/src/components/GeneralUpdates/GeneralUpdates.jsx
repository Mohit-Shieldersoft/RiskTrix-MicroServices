import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  Chip,
  Button,
  Divider,
  IconButton,
  Tooltip,
  Pagination,
} from "@mui/material";
import {
  Computer,
  Store,
  Security,
  BugReport,
  Gavel,
  ErrorOutline,
  CalendarToday,
  Person,
  Assessment,
  Settings,
  NotificationsActive,
  Refresh,
  ArrowForward,
  FiberManualRecord,
} from "@mui/icons-material";
import api from "../../utils/api";
import { useActivity } from "../../contexts/ActivityContext";

// Fetch recent activities aggregated from microservices (vendor + exception + application events)
const fetchRecentActivity = async () => {
  try {
    console.log("Fetching recent activities...");
    const [vendorsRes, exceptionsRes, applicationsRes] =
      await Promise.allSettled([
        api.get("/api/v1/vendors", { params: { skip: 0, limit: 50 } }),
        api.get("/api/v1/exceptions", { params: { skip: 0, limit: 50 } }),
        api.get("/api/v1/applications", { params: { skip: 0, limit: 50 } }),
      ]);

    console.log("Vendors response:", vendorsRes);
    console.log("Exceptions response:", exceptionsRes);
    console.log("Applications response:", applicationsRes);

    const items = [];

    if (vendorsRes.status === "fulfilled" && vendorsRes.value?.data) {
      const vendors =
        vendorsRes.value.data.vendors ?? vendorsRes.value.data ?? [];
      console.log("Found vendors:", vendors.length);
      vendors.forEach((v) => {
        items.push({
          id: `vendor-${v.id}`,
          activity_type: "vendor_update",
          title: v.name,
          summary: "Vendor compliance status updated",
          description: `Vendor status: ${v.compliance_status ?? v.status ?? "Active"}`,
          priority:
            v.risk_level === "high" || v.risk_level === "critical"
              ? "high"
              : "medium",
          entity_name: v.name,
          created_at: v.updated_at ?? v.created_at ?? new Date().toISOString(),
          is_read: true,
        });
      });
    }

    if (exceptionsRes.status === "fulfilled" && exceptionsRes.value?.data) {
      const exceptions =
        exceptionsRes.value.data.exceptions ?? exceptionsRes.value.data ?? [];
      console.log("Found exceptions:", exceptions.length);
      exceptions.forEach((e) => {
        const isExpired = e.is_expired === true;
        const statusText = isExpired ? "EXPIRED" : e.status || "Unknown";
        items.push({
          id: `exception-${e.id}`,
          activity_type: isExpired ? "exception_expired" : "exception_created",
          title: e.exception_name ?? e.title ?? "Exception",
          summary: isExpired
            ? "⚠️ Exception has expired - immediate action needed"
            : "Security exception created",
          description: `Status: ${statusText} — Severity: ${e.severity ?? "N/A"} — ${e.category ?? ""}`,
          priority: isExpired
            ? "critical"
            : e.severity === "critical" || e.severity === "high"
              ? "high"
              : "medium",
          entity_name: e.exception_name,
          created_at: e.updated_at ?? e.created_at ?? new Date().toISOString(),
          is_read: e.status !== "active" && !isExpired, // Don't mark expired as read
          is_expired: isExpired,
        });
      });
    }

    if (applicationsRes.status === "fulfilled" && applicationsRes.value?.data) {
      const applications =
        applicationsRes.value.data.items ?? applicationsRes.value.data ?? [];
      console.log("Found applications:", applications.length);
      applications.forEach((app) => {
        items.push({
          id: `application-${app.id}`,
          activity_type: "application_created",
          title: app.name,
          summary: "New application added to portfolio",
          description: `${app.type ?? "Application"} — Risk: ${app.risk_level ?? "N/A"}`,
          priority:
            app.risk_level === "high" || app.risk_level === "critical"
              ? "high"
              : "medium",
          entity_name: app.name,
          created_at:
            app.updated_at ?? app.created_at ?? new Date().toISOString(),
          is_read: false,
        });
      });
    }

    console.log("Total activities found:", items.length);
    return items.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return [];
  }
};

const GeneralUpdates = () => {
  const { activities: localActivities } = useActivity();
  const [globalActivities, setGlobalActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Pagination state
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Combine local (event-driven) and global (polled) activities
  const allActivities = [...localActivities, ...globalActivities].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  );

  // Calculate pagination
  const totalPages = Math.ceil(allActivities.length / itemsPerPage);
  const paginatedActivities = allActivities.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  console.log(
    "Local activities:",
    localActivities.length,
    "Global activities:",
    globalActivities.length,
    "Total:",
    allActivities.length,
  );

  useEffect(() => {
    loadGlobalActivities();
    const interval = setInterval(loadGlobalActivities, 60000);
    return () => clearInterval(interval);
  }, []);

  // Reset to page 1 when activities change
  useEffect(() => {
    setPage(1);
  }, [allActivities.length]);

  const loadGlobalActivities = async () => {
    try {
      setLoading(true);
      const items = await fetchRecentActivity();
      console.log("Setting global activities:", items);
      setGlobalActivities(items);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error loading global activities:", error);
      setGlobalActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (activityType) => {
    const type = activityType?.toLowerCase() || "";
    if (type.includes("application")) return <Computer fontSize="small" />;
    if (type.includes("vendor")) return <Store fontSize="small" />;
    if (type.includes("certificate")) return <Security fontSize="small" />;
    if (type.includes("vulnerability")) return <BugReport fontSize="small" />;
    if (type.includes("compliance")) return <Gavel fontSize="small" />;
    if (type.includes("exception_expired"))
      return <ErrorOutline color="error" fontSize="small" />;
    if (type.includes("exception")) return <ErrorOutline fontSize="small" />;
    if (type.includes("eosl")) return <CalendarToday fontSize="small" />;
    if (type.includes("user")) return <Person fontSize="small" />;
    if (type.includes("audit")) return <Assessment fontSize="small" />;
    if (type.includes("system")) return <Settings fontSize="small" />;
    return <NotificationsActive fontSize="small" />;
  };

  const formatActivityType = (type) => {
    if (!type) return "Update";
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = Math.floor((now - date) / 1000);
      if (diff < 60) return "just now";
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    } catch {
      return "";
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "#4caf50",
      medium: "#2196f3",
      high: "#ff9800",
      critical: "#f44336",
    };
    return colors[priority?.toLowerCase()] || colors.medium;
  };

  const getPriorityBackgroundColor = (priority) => {
    const colors = {
      low: "rgba(76, 175, 80, 0.08)",
      medium: "rgba(33, 150, 243, 0.08)",
      high: "rgba(255, 152, 0, 0.08)",
      critical: "rgba(244, 67, 54, 0.08)",
    };
    return colors[priority?.toLowerCase()] || colors.medium;
  };

  return (
    <Paper
      sx={{
        borderRadius: 2,
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        background: "#ffffff",
        height: 800, // Fixed height to match DLP Details
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <NotificationsActive color="primary" sx={{ mr: 1 }} />
          <Typography
            variant="h6"
            component="h2"
            fontWeight="bold"
            color="text.primary"
          >
            General Updates
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton
              size="small"
              onClick={loadGlobalActivities}
              disabled={loading}
            >
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
          {/* <Button
            variant="text"
            size="small"
            endIcon={<ArrowForward fontSize="small" />}
            sx={{ fontWeight: "medium" }}
          >
            View All
          </Button> */}
        </Box>
      </Box>

      <Divider />

      {/* Activities List */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: "auto",
          "&::-webkit-scrollbar": { width: "8px" },
          "&::-webkit-scrollbar-track": { background: "#f1f1f1" },
          "&::-webkit-scrollbar-thumb": {
            background: "#888",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb:hover": { background: "#555" },
        }}
      >
        {allActivities.length === 0 && !loading ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No recent activities found
            </Typography>
          </Box>
        ) : (
          <>
            <List sx={{ p: 0 }}>
              {paginatedActivities.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <ListItem
                    sx={{
                      py: 1.5,
                      px: 2,
                      "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.02)" },
                      opacity: activity.is_read ? 0.7 : 1,
                      borderLeft: activity.is_new
                        ? "4px solid #4caf50"
                        : activity.is_expired
                          ? "4px solid #f44336"
                          : `3px solid ${getPriorityColor(activity.priority)}`, // Priority-colored left border
                      backgroundColor: activity.is_expired
                        ? "rgba(244, 67, 54, 0.08)"
                        : getPriorityBackgroundColor(activity.priority), // Priority-based background
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        width: "100%",
                        gap: 1.5,
                      }}
                    >
                      {/* Icon */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "rgba(25, 118, 210, 0.1)",
                          borderRadius: "8px",
                          width: 36,
                          height: 36,
                          color: "primary.main",
                          flexShrink: 0,
                          mt: 0.5,
                        }}
                      >
                        {getActivityIcon(activity.activity_type)}
                      </Box>

                      {/* Content */}
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            mb: 0.5,
                          }}
                        >
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              backgroundColor: getPriorityColor(
                                activity.priority,
                              ),
                              mr: 1,
                              flexShrink: 0,
                            }}
                          />
                          <Typography
                            variant="subtitle2"
                            fontWeight="bold"
                            sx={{
                              flexGrow: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {activity.title}
                            {activity.is_new && (
                              <Chip
                                label="NEW"
                                size="small"
                                sx={{
                                  ml: 1,
                                  backgroundColor: "#4caf50",
                                  color: "white",
                                  fontSize: "0.7rem",
                                  height: 18,
                                }}
                              />
                            )}
                            {activity.is_expired && (
                              <Chip
                                label="EXPIRED"
                                size="small"
                                sx={{
                                  ml: 1,
                                  backgroundColor: "#f44336",
                                  color: "white",
                                  fontSize: "0.7rem",
                                  height: 18,
                                }}
                              />
                            )}
                          </Typography>
                        </Box>

                        {activity.summary && (
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: "medium",
                              color: "primary.main",
                              mb: 0.5,
                              fontSize: "0.85rem",
                            }}
                          >
                            {activity.summary}
                          </Typography>
                        )}

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            fontSize: "0.875rem",
                            lineHeight: 1.4,
                          }}
                        >
                          {activity.description}
                        </Typography>

                        <Box
                          sx={{
                            mt: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            flexWrap: "wrap",
                          }}
                        >
                          <Chip
                            label={formatActivityType(activity.activity_type)}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.7rem",
                              backgroundColor: "rgba(25, 118, 210, 0.08)",
                              color: "primary.main",
                            }}
                          />
                          {activity.entity_name && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              • {activity.entity_name}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            • {formatRelativeTime(activity.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </ListItem>
                  {index < paginatedActivities.length - 1 && (
                    <Divider variant="inset" component="li" />
                  )}
                </React.Fragment>
              ))}
            </List>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(event, value) => setPage(value)}
                  size="small"
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Footer */}
      {allActivities.length > 0 && (
        <>
          <Divider />
          <Box
            sx={{
              p: 1,
              textAlign: "center",
              backgroundColor: "rgba(0, 0, 0, 0.02)",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </Typography>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default GeneralUpdates;
