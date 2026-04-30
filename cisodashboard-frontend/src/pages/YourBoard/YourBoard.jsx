import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  LinearProgress,
  useTheme,
  Button,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  Security,
  RssFeed,
  BugReport,
  Shield,
  Gavel,
  Computer,
  Warning,
  NewReleases,
  ErrorOutline,
  CheckCircle,
  AccessTime,
  Storage,
  Laptop,
  Error,
  NotificationsActive,
  ArrowForward,
  CalendarToday,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { generateYourBoardData } from "./mockData";
import { fetchYourBoardMetrics } from "../../utils/yourboardApi";
import { getEOSLDashboardData } from "../../utils/eoslApi";
import {
  fetchWeeklyIntelligence,
  getSeverityColor,
  formatPublishedDate,
} from "../../utils/intelligenceApi";
import GeneralUpdates from "../../components/GeneralUpdates/GeneralUpdates";

const MotionCard = motion.create(Card);
const MotionPaper = motion.create(Paper);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const YourBoard = () => {
  const theme = useTheme();
  const [securityTabValue, setSecurityTabValue] = useState(0);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState("");
  const [intelligenceItems, setIntelligenceItems] = useState([]);
  const [intelligenceLoading, setIntelligenceLoading] = useState(true);
  // Assets panel state (for EOSL assets shown when Asset Management card is clicked)
  const [assetsOpen, setAssetsOpen] = useState(false); // eslint-disable-line no-unused-vars
  const [assetsData, setAssetsData] = useState([]);

  const data = generateYourBoardData();
  const securityTech = data.securityTech;

  // Fetch real-time metrics from backend
  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchYourBoardMetrics();

        if (response.success && response.data) {
          setMetrics(response.data.metrics || []);
          setLastUpdated(response.data.lastUpdated || new Date().toISOString());
        } else {
          setMetrics([]);
          setError("Using offline data - backend unavailable");
        }
      } catch (err) {
        console.error("Failed to load metrics:", err);
        setMetrics([]);
        setError("Failed to connect to backend");
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();

    // Optional: Set up auto-refresh every 5 minutes
    const refreshInterval = setInterval(loadMetrics, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, []);

  // Fetch intelligence data from backend
  useEffect(() => {
    const loadIntelligence = async () => {
      setIntelligenceLoading(true);

      try {
        const response = await fetchWeeklyIntelligence();

        if (response.success && response.data) {
          // Transform API data to component format
          const transformedData = response.data.map((item) => ({
            text: item.title,
            severity: item.severity.toLowerCase(),
            category: item.category,
            source: item.source,
            publishedAt: item.publishedAt,
            cveId: item.cveId,
            cvssScore: item.cvssScore,
          }));

          setIntelligenceItems(transformedData);
        } else {
          setIntelligenceItems([]);
        }
      } catch (err) {
        console.error("Failed to load intelligence:", err);
        setIntelligenceItems([]);
      } finally {
        setIntelligenceLoading(false);
      }
    };

    loadIntelligence();

    // Optional: Refresh intelligence data every 30 minutes
    const refreshInterval = setInterval(loadIntelligence, 30 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, []);

  const getScoreColor = (score) => {
    if (score >= 90) return theme.palette.success.main;
    if (score >= 70) return theme.palette.success.light;
    if (score >= 50) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getTrendColor = (trend, direction) => {
    if (direction === "up") {
      return trend > 0 ? theme.palette.error.main : theme.palette.success.main;
    } else {
      return trend > 0 ? theme.palette.success.main : theme.palette.error.main;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return (
          <CheckCircle
            fontSize="small"
            sx={{ color: theme.palette.success.main }}
          />
        );
      case "pending":
        return (
          <AccessTime
            fontSize="small"
            sx={{ color: theme.palette.warning.main }}
          />
        );
      case "expired":
        return (
          <Error fontSize="small" sx={{ color: theme.palette.error.main }} />
        );
      default:
        return null;
    }
  };

  // When Asset Management is selected, prefer assets fetched from the EOSL dashboard
  const detailsAssets =
    securityTech[securityTabValue]?.name === "Asset Management" &&
    assetsData &&
    assetsData.length > 0
      ? assetsData
      : securityTech[securityTabValue]?.assets || [];

  return (
    <Box
      component="main"
      sx={{ p: 0, backgroundColor: "#f5f5f7", minHeight: "calc(100vh - 64px)" }}
    >
      <Box
        sx={{
          mb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Security
            fontSize="large"
            sx={{ mr: 2, color: theme.palette.primary.main }}
          />
          <Typography
            variant="h4"
            component="h1"
            fontWeight="bold"
            color="text.primary"
          >
            Dashboard
          </Typography>
        </Box>
        {lastUpdated && (
          <Typography variant="caption" color="text.secondary">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </Typography>
        )}
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 200,
          }}
        >
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Loading dashboard metrics...
          </Typography>
        </Box>
      )}

      {/* Main Content - Only show when not loading */}
      {!loading && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Main Content Grid */}
          <Grid container spacing={2}>
            {/* Left Side Content - ~58% width */}
            <Grid size={{ xs: 12, lg: 7 }}>
              {/* Top Row: Metrics Cards */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {metrics.map((metric, index) => (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                    <MotionCard
                      variants={itemVariants}
                      sx={{
                        borderRadius: 2,
                        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                        position: "relative",
                        overflow: "hidden",
                        height: "100%",
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "4px",
                          backgroundColor: theme.palette.primary.main,
                        },
                      }}
                    >
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                          }}
                        >
                          {/* <Box>
                          <Typography variant="body2" color="text.secondary" fontWeight="medium">
                            {metric.title}
                          </Typography>
                          <Typography variant="h3" component="div" fontWeight="bold" sx={{ my: 1 }}>
                            {metric.count}
                            <Typography component="span" variant="body2" sx={{ ml: 1 }}>
                              {metric.unit}
                            </Typography>
                          </Typography>
                        </Box> */}
                          <Box
                            sx={{
                              width: 140, // ✅ fixed width for all metric boxes
                              textAlign: "center", // ✅ centers all text
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              mx: "auto", // ✅ horizontally centers the box inside the card
                            }}
                          >
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              fontWeight="medium"
                              sx={{
                                whiteSpace: "normal",
                                wordBreak: "break-word",
                                lineHeight: 1.2,
                                height: 30, // ✅ fixed title area height
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {metric.title}
                            </Typography>

                            <Typography
                              variant="h3"
                              component="div"
                              fontWeight="bold"
                              sx={{
                                my: 1,
                                display: "flex",
                                alignItems: "baseline",
                                justifyContent: "center",
                                height: 40, // ✅ keeps all counts aligned in height
                              }}
                            >
                              {metric.count}
                              <Typography
                                component="span"
                                variant="body2"
                                sx={{
                                  ml: 1,
                                  fontWeight: "medium",
                                }}
                              >
                                {metric.unit}
                              </Typography>
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "rgba(25, 118, 210, 0.1)",
                              borderRadius: "50%",
                              width: 64,
                              height: 48,
                              color: theme.palette.primary.main,
                            }}
                          >
                            {metric.title === "App Track" ? (
                              <BugReport />
                            ) : metric.title === "Infra Track" ? (
                              <Computer />
                            ) : metric.title === "Exceptions" ? (
                              <ErrorOutline />
                            ) : (
                              <Gavel />
                            )}
                          </Box>
                        </Box>

                        <Box
                          sx={{ display: "flex", alignItems: "center", mt: 2 }}
                        >
                          {metric.trendDirection === "up" ? (
                            <TrendingUp
                              sx={{
                                fontSize: 18,
                                color: getTrendColor(metric.trend, "up"),
                                mr: 0.5,
                              }}
                            />
                          ) : (
                            <TrendingDown
                              sx={{
                                fontSize: 18,
                                color: getTrendColor(metric.trend, "down"),
                                mr: 0.5,
                              }}
                            />
                          )}
                          <Typography
                            variant="body2"
                            sx={{
                              color: getTrendColor(
                                metric.trend,
                                metric.trendDirection,
                              ),
                              fontWeight: "bold",
                            }}
                          >
                            {metric.trend}%
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ ml: 1 }}
                          >
                            {metric.trendPeriod}
                          </Typography>
                        </Box>
                      </CardContent>
                    </MotionCard>
                  </Grid>
                ))}
              </Grid>

              {/* Intelligence This Week */}
              <MotionPaper
                variants={itemVariants}
                sx={{
                  borderRadius: 2,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                  background: "#ffffff",
                  mb: 2,
                  height: "auto",
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <RssFeed color="primary" sx={{ mr: 1 }} />
                    <Typography
                      variant="h6"
                      component="h2"
                      fontWeight="bold"
                      color="text.primary"
                    >
                      Intelligence This Week
                    </Typography>
                    {intelligenceLoading && (
                      <CircularProgress size={20} sx={{ ml: 2 }} />
                    )}
                  </Box>
                  <Button
                    variant="text"
                    size="small"
                    endIcon={<ArrowForward fontSize="small" />}
                    sx={{ fontWeight: "medium" }}
                  >
                    View All
                  </Button>
                </Box>
                <Divider />

                {intelligenceLoading ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      p: 4,
                    }}
                  >
                    <CircularProgress size={30} />
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      Loading latest security intelligence...
                    </Typography>
                  </Box>
                ) : intelligenceItems.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      No intelligence data available
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ p: 0 }}>
                    {intelligenceItems.map((item, index) => (
                      <ListItem
                        key={item.cveId || index}
                        sx={{
                          py: 1.5,
                          px: 2,
                          borderBottom:
                            index < intelligenceItems.length - 1
                              ? "1px solid rgba(0, 0, 0, 0.06)"
                              : "none",
                          "&:hover": {
                            backgroundColor: "rgba(0, 0, 0, 0.02)",
                            cursor: "pointer",
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {item.severity === "high" ? (
                            <ErrorOutline color="error" />
                          ) : item.severity === "medium" ? (
                            <Warning color="warning" />
                          ) : item.severity === "low" ? (
                            <NewReleases color="info" />
                          ) : (
                            <NewReleases color="disabled" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          secondary={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mt: 0.5,
                              }}
                            >
                              <Chip
                                size="small"
                                label={item.source || "NVD"}
                                sx={{
                                  height: 18,
                                  fontSize: "0.7rem",
                                  backgroundColor: "rgba(25, 118, 210, 0.1)",
                                  color: "primary.main",
                                }}
                              />
                              {item.cvssScore && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  CVSS: {item.cvssScore}
                                </Typography>
                              )}
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                • {formatPublishedDate(item.publishedAt)}
                              </Typography>
                            </Box>
                          }
                          primaryTypographyProps={{
                            fontWeight:
                              item.severity === "high" ? "bold" : "medium",
                            fontSize: "0.9rem",
                            sx: {
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            },
                          }}
                          secondaryTypographyProps={{ component: "div" }}
                        />
                        <Chip
                          size="small"
                          label={item.severity.toUpperCase()}
                          color={getSeverityColor(item.severity)}
                          sx={{
                            color: "white",
                            fontWeight: "bold",
                            minWidth: 70,
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </MotionPaper>

              {/* Security Technologies */}
              <MotionPaper
                variants={itemVariants}
                sx={{
                  borderRadius: 2,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                  background: "#ffffff",
                  mb: 2,
                  height: "auto",
                }}
              >
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Shield color="primary" sx={{ mr: 1 }} />
                    <Typography
                      variant="h6"
                      component="h2"
                      fontWeight="bold"
                      color="text.primary"
                    >
                      Security Technology Status
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />

                  {/* Security Tech Boxes */}
                  <Box
                    sx={{
                      display: "grid",
                      gap: 1,
                      // Allow only 1,2,3 or 5 columns to avoid a partial 5th card or a 4-column row.
                      gridTemplateColumns: {
                        xs: "repeat(1, 1fr)",
                        sm: "repeat(2, 1fr)",
                        md: "repeat(3, 1fr)",
                      },
                      // Only switch to 5 columns on very wide screens (>=1600px) to ensure
                      // intermediate widths (like 1400px) show 3 + 2 layout rather than a 4-column row.
                      "@media (min-width:1600px)": {
                        gridTemplateColumns: "repeat(5, 1fr)",
                      },
                      alignItems: "stretch",
                    }}
                  >
                    {securityTech.map((tech, index) => (
                      <Box
                        key={index}
                        sx={{ boxSizing: "border-box", px: 0.5 }}
                      >
                        <Card
                          variant="outlined"
                          sx={{
                            cursor: "pointer",
                            borderColor:
                              securityTabValue === index
                                ? theme.palette.primary.main
                                : "rgba(0, 0, 0, 0.12)",
                            borderWidth: securityTabValue === index ? 2 : 1,
                            borderRadius: 1,
                            height: 180,
                            width: "100%",
                            backgroundColor:
                              securityTabValue === index
                                ? "rgba(25, 118, 210, 0.04)"
                                : "transparent",
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                              borderColor: theme.palette.primary.main,
                              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                            },
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                          }}
                          onClick={() => {
                            setSecurityTabValue(index);
                            // Only load EOSL dashboard when Asset Management card is clicked
                            if (tech.name === "Asset Management") {
                              (async () => {
                                try {
                                  const payload =
                                    await getEOSLDashboardData(2025);
                                  if (payload && payload.assets)
                                    setAssetsData(payload.assets);
                                  else setAssetsData([]);
                                  setAssetsOpen(true);
                                } catch (err) {
                                  console.error(
                                    "Failed to load EOSL dashboard data:",
                                    err,
                                  );
                                  setAssetsData([]);
                                  setAssetsOpen(true);
                                }
                              })();
                            }
                          }}
                        >
                          <CardContent
                            sx={{ p: "auto", "&:last-child": { pb: 2 } }}
                          >
                            {/* <Typography variant="h5" component="div" fontWeight="bold" gutterBottom>
                            {tech.name}
                          </Typography> */}

                            <Typography
                              variant="h5"
                              component="div"
                              fontWeight="bold"
                              gutterBottom
                              sx={{
                                width: 120, // ✅ Fixed width for all titles
                                height: 70, // ✅ Fixed height for uniform spacing
                                display: "flex", // ✅ Centers text both directions
                                alignItems: "center",
                                justifyContent: "center",
                                textAlign: "center",
                                whiteSpace: "normal", // ✅ Allows wrapping if text too long
                                // wordBreak: "break-word",  // ✅ Breaks long words cleanly
                                mx: "auto",

                                //   whiteSpace: "normal",
                                // overflowWrap: "break-word",             // ✅ Centers horizontally inside card
                              }}
                            >
                              {tech.name}
                            </Typography>

                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                mb: 1,
                              }}
                            >
                              {/* <Typography variant="body2" color="text.secondary">
                              Health Score
                            </Typography> */}
                              <Chip
                                size="small"
                                label={`${tech.score}%`}
                                sx={{
                                  backgroundColor: getScoreColor(tech.score),
                                  color: "white",
                                  fontWeight: "bold",
                                }}
                              />
                            </Box>

                            <LinearProgress
                              variant="determinate"
                              value={tech.score}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: "rgba(0,0,0,0.05)",
                                "& .MuiLinearProgress-bar": {
                                  backgroundColor: getScoreColor(tech.score),
                                },
                              }}
                            />

                            <Typography
                              variant="caption"
                              sx={{
                                display: "block",
                                mt: 1,
                                color:
                                  tech.score < 70
                                    ? "error.main"
                                    : "text.secondary",
                                fontWeight:
                                  tech.score < 70 ? "medium" : "normal",
                              }}
                            >
                              {tech.status}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </MotionPaper>

              {/* Selected Security Technology Details Table */}
              <MotionPaper
                variants={itemVariants}
                sx={{
                  borderRadius: 2,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                  background: "#ffffff",
                  height: "auto",
                }}
              >
                <Box sx={{ p: 2, pb: 0 }}>
                  <Typography variant="h6" fontWeight="medium">
                    {securityTech[securityTabValue]?.name} Details
                  </Typography>
                </Box>

                <TableContainer sx={{ mt: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow
                        sx={{ backgroundColor: "rgba(25, 118, 210, 0.04)" }}
                      >
                        <TableCell sx={{ fontWeight: "bold" }}>
                          Asset Name
                        </TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          Status
                        </TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          Last Updated
                        </TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          Health
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detailsAssets.map((asset, assetIndex) => (
                        <TableRow
                          key={assetIndex}
                          sx={{
                            "&:last-child td, &:last-child th": { border: 0 },
                            "&:hover": {
                              backgroundColor: "rgba(0, 0, 0, 0.02)",
                            },
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              {/* Icon selection: try to infer from asset_type / type */}
                              {(asset.asset_type ||
                                asset.assetType ||
                                asset.type) === "server" ? (
                                <Storage
                                  fontSize="small"
                                  sx={{
                                    mr: 1,
                                    color: theme.palette.primary.main,
                                  }}
                                />
                              ) : (asset.asset_type ||
                                  asset.assetType ||
                                  asset.type) === "endpoint" ? (
                                <Laptop
                                  fontSize="small"
                                  sx={{
                                    mr: 1,
                                    color: theme.palette.success.main,
                                  }}
                                />
                              ) : (
                                <Computer
                                  fontSize="small"
                                  sx={{
                                    mr: 1,
                                    color: theme.palette.warning.main,
                                  }}
                                />
                              )}
                              <Typography fontWeight="medium">
                                {asset.asset_name ||
                                  asset.assetName ||
                                  asset.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                (
                                  asset.asset_type ||
                                  asset.assetType ||
                                  asset.type ||
                                  "Unknown"
                                )
                                  .toString()
                                  .charAt(0)
                                  .toUpperCase() +
                                (
                                  asset.asset_type ||
                                  asset.assetType ||
                                  asset.type ||
                                  "Unknown"
                                )
                                  .toString()
                                  .slice(1)
                              }
                              size="small"
                              sx={{
                                backgroundColor: "rgba(0, 0, 0, 0.05)",
                                fontSize: "0.7rem",
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              {getStatusIcon(
                                (
                                  asset.status ||
                                  asset.state ||
                                  "active"
                                ).toLowerCase(),
                              )}
                              <Typography variant="body2" sx={{ ml: 0.5 }}>
                                {(asset.status || asset.state || "Active")
                                  .toString()
                                  .charAt(0)
                                  .toUpperCase() +
                                  (asset.status || asset.state || "Active")
                                    .toString()
                                    .slice(1)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {asset.eosl_date ||
                              asset.eoslDate ||
                              asset.lastUpdated ||
                              asset.updated_at ||
                              ""}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <LinearProgress
                                variant="determinate"
                                value={asset.health ?? asset.score ?? 0}
                                sx={{
                                  height: 6,
                                  width: 60,
                                  borderRadius: 3,
                                  backgroundColor: "rgba(0,0,0,0.05)",
                                  "& .MuiLinearProgress-bar": {
                                    backgroundColor: getScoreColor(
                                      asset.health ?? asset.score ?? 0,
                                    ),
                                  },
                                }}
                              />
                              <Typography
                                variant="body2"
                                fontWeight="medium"
                                sx={{ ml: 1 }}
                              >
                                {asset.health ?? asset.score ?? 0}%
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    size="small"
                    variant="text"
                    endIcon={<ArrowForward fontSize="small" />}
                  >
                    View Full Report
                  </Button>
                </Box>
              </MotionPaper>
            </Grid>

            {/* Right Side - General Updates - ~42% width (wider) */}
            {/*
            <Grid
              size={{ xs: 12, lg: 5 }}
              sx={{ display: "flex", flexDirection: "column" }}
            >
              <GeneralUpdates />
            </Grid>
              */}
          </Grid>
        </motion.div>
      )}
    </Box>
  );
};

export default YourBoard;
