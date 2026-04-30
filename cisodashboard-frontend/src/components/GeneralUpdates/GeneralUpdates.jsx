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

// Fetch recent activities aggregated from microservices (vendor + exception events)
const fetchRecentActivity = async () => {
  try {
    const [vendorsRes, exceptionsRes] = await Promise.allSettled([
      api.get("/api/v1/vendors", { params: { skip: 0, limit: 5 } }),
      api.get("/api/v1/exceptions", { params: { skip: 0, limit: 5 } }),
    ]);

    const items = [];

    if (vendorsRes.status === "fulfilled" && vendorsRes.value?.data) {
      const vendors =
        vendorsRes.value.data.items ?? vendorsRes.value.data ?? [];
      vendors.slice(0, 3).forEach((v) => {
        items.push({
          id: `vendor-${v.id}`,
          activity_type: "vendor_update",
          title: v.name,
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
        exceptionsRes.value.data.items ?? exceptionsRes.value.data ?? [];
      exceptions.slice(0, 3).forEach((e) => {
        items.push({
          id: `exception-${e.id}`,
          activity_type: "exception_created",
          title: e.exception_name ?? e.title ?? "Exception",
          description: `Severity: ${e.severity ?? "N/A"} — ${e.category ?? ""}`,
          priority:
            e.severity === "critical" || e.severity === "high"
              ? "high"
              : "medium",
          entity_name: e.exception_name,
          created_at: e.updated_at ?? e.created_at ?? new Date().toISOString(),
          is_read: e.status !== "active",
        });
      });
    }

    return items.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );
  } catch {
    return [];
  }
};

const GeneralUpdates = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    loadActivities();
    const interval = setInterval(loadActivities, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const items = await fetchRecentActivity();
      setActivities(items);
      setLastRefresh(new Date());
    } catch {
      setActivities([]);
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

  return (
    <Paper
      sx={{
        borderRadius: 2,
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        background: "#ffffff",
        flex: 1,
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
              onClick={loadActivities}
              disabled={loading}
            >
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button
            variant="text"
            size="small"
            endIcon={<ArrowForward fontSize="small" />}
            sx={{ fontWeight: "medium" }}
          >
            View All
          </Button>
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
        {activities.length === 0 && !loading ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No recent activities found
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {activities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <ListItem
                  sx={{
                    py: 1.5,
                    px: 2,
                    "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.02)" },
                    opacity: activity.is_read ? 0.7 : 1,
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
                        sx={{ display: "flex", alignItems: "center", mb: 0.5 }}
                      >
                        <FiberManualRecord
                          sx={{
                            fontSize: 12,
                            color: getPriorityColor(activity.priority),
                            mr: 1,
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
                        </Typography>
                      </Box>

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
                          <Typography variant="caption" color="text.secondary">
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
                {index < activities.length - 1 && (
                  <Divider variant="inset" component="li" />
                )}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {/* Footer */}
      {activities.length > 0 && (
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

// const GeneralUpdates = () => {
//   const [activities, setActivities] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [lastRefresh, setLastRefresh] = useState(new Date());

//   useEffect(() => {
//     loadActivities();

//     // Auto-refresh every 30 seconds
//     const interval = setInterval(loadActivities, 30000);

//     return () => clearInterval(interval);
//   }, []);

//   const loadActivities = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const response = await fetchActivities({
//         days: 7,
//         size: 20,
//         page: 1,
//       });

//       if (response.success && response.data) {
//         setActivities(response.data.items || []);
//         setLastRefresh(new Date());
//       } else {
//         setError(response.error || "Failed to load activities");
//       }
//     } catch (err) {
//       console.error("Failed to load activities:", err);
//       setError("An error occurred while loading activities");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getActivityIcon = (activityType) => {
//     const type = activityType?.toLowerCase() || "";

//     if (type.includes("application")) return <Computer fontSize="small" />;
//     if (type.includes("vendor")) return <Store fontSize="small" />;
//     if (type.includes("certificate")) return <Security fontSize="small" />;
//     if (type.includes("vulnerability")) return <BugReport fontSize="small" />;
//     if (type.includes("compliance")) return <Gavel fontSize="small" />;
//     if (type.includes("exception")) return <ErrorOutline fontSize="small" />;
//     if (type.includes("eosl")) return <CalendarToday fontSize="small" />;
//     if (type.includes("user")) return <Person fontSize="small" />;
//     if (type.includes("audit")) return <Assessment fontSize="small" />;
//     if (type.includes("system")) return <Settings fontSize="small" />;

//     return <NotificationsActive fontSize="small" />;
//   };

//   const getPriorityIndicator = (priority) => {
//     const colors = {
//       low: "#4caf50",
//       medium: "#2196f3",
//       high: "#ff9800",
//       critical: "#f44336",
//     };

//     return (
//       <FiberManualRecord
//         sx={{
//           fontSize: 12,
//           color: colors[priority?.toLowerCase()] || colors.medium,
//           mr: 1,
//         }}
//       />
//     );
//   };

//   if (loading && activities.length === 0) {
//     return (
//       <Paper
//         sx={{
//           borderRadius: 2,
//           boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
//           background: "#ffffff",
//           p: 3,
//           height: "350px",
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "center",
//         }}
//       >
//         <CircularProgress />
//       </Paper>
//     );
//   }

//   return (
//     <Paper
//       sx={{
//         borderRadius: 2,
//         boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
//         background: "#ffffff",
//         // height: '500px',
//         flex: 1,
//         display: "flex",
//         flexDirection: "column",
//       }}
//     >
//       {/* Header */}
//       <Box
//         sx={{
//           p: 2,
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//         }}
//       >
//         <Box sx={{ display: "flex", alignItems: "center" }}>
//           <NotificationsActive color="primary" sx={{ mr: 1 }} />
//           <Typography
//             variant="h6"
//             component="h2"
//             fontWeight="bold"
//             color="text.primary"
//           >
//             General Updates
//           </Typography>
//         </Box>
//         <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//           <Tooltip title="Refresh">
//             <IconButton
//               size="small"
//               onClick={loadActivities}
//               disabled={loading}
//             >
//               <Refresh fontSize="small" />
//             </IconButton>
//           </Tooltip>
//           <Button
//             variant="text"
//             size="small"
//             endIcon={<ArrowForward fontSize="small" />}
//             sx={{ fontWeight: "medium" }}
//           >
//             View All
//           </Button>
//         </Box>
//       </Box>

//       <Divider />

//       {/* Quiet offline state - no red warning shown to user */}
//       {error && activities.length === 0 && (
//         <Box sx={{ p: 3, textAlign: "center" }}>
//           <Typography variant="body2" color="text.secondary">
//             Activity log unavailable
//           </Typography>
//         </Box>
//       )}

//       {/* Activities List */}
//       <Box
//         sx={{
//           flexGrow: 1,
//           overflow: "auto",
//           "&::-webkit-scrollbar": {
//             width: "8px",
//           },
//           "&::-webkit-scrollbar-track": {
//             background: "#f1f1f1",
//           },
//           "&::-webkit-scrollbar-thumb": {
//             background: "#888",
//             borderRadius: "4px",
//           },
//           "&::-webkit-scrollbar-thumb:hover": {
//             background: "#555",
//           },
//         }}
//       >
//         {activities.length === 0 && !loading ? (
//           <Box sx={{ p: 3, textAlign: "center" }}>
//             <Typography variant="body2" color="text.secondary">
//               No recent activities found
//             </Typography>
//           </Box>
//         ) : (
//           <List sx={{ p: 0 }}>
//             {activities.map((activity, index) => (
//               <React.Fragment key={activity.id}>
//                 <ListItem
//                   sx={{
//                     py: 1.5,
//                     px: 2,
//                     "&:hover": {
//                       backgroundColor: "rgba(0, 0, 0, 0.02)",
//                     },
//                     opacity: activity.is_read ? 0.7 : 1,
//                   }}
//                 >
//                   <Box
//                     sx={{
//                       display: "flex",
//                       alignItems: "flex-start",
//                       width: "100%",
//                       gap: 1.5,
//                     }}
//                   >
//                     {/* Icon */}
//                     <Box
//                       sx={{
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "center",
//                         backgroundColor: "rgba(25, 118, 210, 0.1)",
//                         borderRadius: "8px",
//                         width: 36,
//                         height: 36,
//                         color: "primary.main",
//                         flexShrink: 0,
//                         mt: 0.5,
//                       }}
//                     >
//                       {getActivityIcon(activity.activity_type)}
//                     </Box>

//                     {/* Content */}
//                     <Box sx={{ flexGrow: 1, minWidth: 0 }}>
//                       <Box
//                         sx={{ display: "flex", alignItems: "center", mb: 0.5 }}
//                       >
//                         {getPriorityIndicator(activity.priority)}
//                         <Typography
//                           variant="subtitle2"
//                           fontWeight="bold"
//                           sx={{
//                             flexGrow: 1,
//                             overflow: "hidden",
//                             textOverflow: "ellipsis",
//                             whiteSpace: "nowrap",
//                           }}
//                         >
//                           {activity.title}
//                         </Typography>
//                       </Box>

//                       <Typography
//                         variant="body2"
//                         color="text.secondary"
//                         sx={{
//                           display: "-webkit-box",
//                           WebkitLineClamp: 2,
//                           WebkitBoxOrient: "vertical",
//                           overflow: "hidden",
//                           fontSize: "0.875rem",
//                           lineHeight: 1.4,
//                         }}
//                       >
//                         {activity.description}
//                       </Typography>

//                       <Box
//                         sx={{
//                           mt: 1,
//                           display: "flex",
//                           alignItems: "center",
//                           gap: 1,
//                           flexWrap: "wrap",
//                         }}
//                       >
//                         <Chip
//                           label={formatActivityType(activity.activity_type)}
//                           size="small"
//                           sx={{
//                             height: 20,
//                             fontSize: "0.7rem",
//                             backgroundColor: "rgba(25, 118, 210, 0.08)",
//                             color: "primary.main",
//                           }}
//                         />

//                         {activity.entity_name && (
//                           <Typography variant="caption" color="text.secondary">
//                             • {activity.entity_name}
//                           </Typography>
//                         )}

//                         {activity.user_name && (
//                           <Typography variant="caption" color="text.secondary">
//                             • by {activity.user_name}
//                           </Typography>
//                         )}

//                         <Typography variant="caption" color="text.secondary">
//                           • {formatRelativeTime(activity.created_at)}
//                         </Typography>
//                       </Box>
//                     </Box>
//                   </Box>
//                 </ListItem>
//                 {index < activities.length - 1 && (
//                   <Divider variant="inset" component="li" />
//                 )}
//               </React.Fragment>
//             ))}
//           </List>
//         )}
//       </Box>

//       {/* Footer with timestamp */}
//       {activities.length > 0 && (
//         <>
//           <Divider />
//           <Box
//             sx={{
//               p: 1,
//               textAlign: "center",
//               backgroundColor: "rgba(0, 0, 0, 0.02)",
//             }}
//           >
//             <Typography variant="caption" color="text.secondary">
//               Last updated: {lastRefresh.toLocaleTimeString()}
//             </Typography>
//           </Box>
//         </>
//       )}
//     </Paper>
//   );
// };

// export default GeneralUpdates;
