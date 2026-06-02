import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Button,
  Chip,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  LinearProgress,
  Stack,
  Avatar,
  alpha,
} from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LockIcon from "@mui/icons-material/Lock";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import InsightsIcon from "@mui/icons-material/Insights";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  RadialBarChart,
  RadialBar,
} from "recharts";

import ticketApi from "../../utils/ticketApi";

// ================= COLORS =================

const STATUS_COLORS = {
  new: "#29b6f6",
  assigned: "#ffa726",
  in_progress: "#5c6bc0",
  resolved: "#66bb6a",
  closed: "#9e9e9e",
};

const PRIORITY_COLORS = {
  critical: "#ef5350",
  high: "#fb8c00",
  medium: "#42a5f5",
  low: "#90a4ae",
};

const CATEGORY_COLORS = [
  "#5c6bc0",
  "#26a69a",
  "#ef5350",
  "#ffa726",
  "#66bb6a",
  "#ab47bc",
];

const CHANNEL_COLORS = [
  "#29b6f6",
  "#66bb6a",
  "#ffa726",
  "#ef5350",
  "#ab47bc",
];

// ================= HELPERS =================

const getPriorityColor = (p) => {
  switch (p) {
    case "critical":
      return "error";
    case "high":
      return "warning";
    case "medium":
      return "info";
    default:
      return "default";
  }
};

const getStatusColor = (s) => {
  switch (s) {
    case "new":
      return "info";
    case "assigned":
      return "warning";
    case "in_progress":
      return "primary";
    case "resolved":
      return "success";
    case "closed":
      return "default";
    default:
      return "default";
  }
};

// ================= KPI CARD =================

const StatCard = ({
  label,
  value,
  color = "#1976d2",
  icon,
  subtitle,
}) => (
  <Card
    elevation={0}
    sx={{
      borderRadius: 4,
      height: "100%",
      border: "1px solid",
      borderColor: "grey.200",
      background:
        "linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)",
      transition: "all 0.25s ease",
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
      },
    }}
  >
    <CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              fontWeight: 600,
              mb: 1,
            }}
          >
            {label}
          </Typography>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color,
              lineHeight: 1.1,
            }}
          >
            {value}
          </Typography>

          {subtitle && (
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", mt: 0.5, display: "block" }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        <Avatar
          sx={{
            width: 58,
            height: 58,
            bgcolor: alpha(color, 0.12),
            color,
          }}
        >
          {icon}
        </Avatar>
      </Stack>
    </CardContent>
  </Card>
);

// ================= CHART CARD =================

const ChartCard = ({ title, children, action }) => (
  <Card
    elevation={0}
    sx={{
      borderRadius: 4,
      border: "1px solid",
      borderColor: "grey.200",
      height: "100%",
      backgroundColor: "#fff",
    }}
  >
    <CardContent>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6" fontWeight={700}>
          {title}
        </Typography>

        {action}
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {children}
    </CardContent>
  </Card>
);

// ================= PIE LABEL =================

const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}) => {
  if (percent < 0.05) return null;

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;

  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ================= COMPONENT =================

const TicketDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const navigate = useNavigate();

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await ticketApi.getDashboard();
      setData(res);
      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      console.error("Dashboard error", err);
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // ================= LOADING =================

  if (loading)
    return (
      <Box
        sx={{
          height: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={42} />
      </Box>
    );

  // ================= ERROR =================

  if (error || !data)
    return (
      <Box sx={{ textAlign: "center", mt: 10 }}>
        <Typography color="error">{error || "No data"}</Typography>

        <Button sx={{ mt: 2 }} variant="outlined" onClick={fetchDashboard}>
          Retry
        </Button>
      </Box>
    );

  // ================= CHART DATA =================

  const statusChartData = Object.entries(data.by_status).map(
    ([key, value]) => ({
      name: key.replace("_", " "),
      value,
      color: STATUS_COLORS[key] || "#9e9e9e",
    })
  );

  const priorityChartData = Object.entries(data.by_priority).map(
    ([key, value]) => ({
      name: key,
      value,
      color: PRIORITY_COLORS[key] || "#9e9e9e",
    })
  );

  const categoryChartData = Object.entries(data.by_category).map(
    ([key, value], i) => ({
      name: key,
      value,
      fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    })
  );

  const channelChartData = Object.entries(data.by_channel).map(
    ([key, value], i) => ({
      name: key.replace("-", " "),
      value,
      fill: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
    })
  );

  const resolutionRate =
    data.total > 0
      ? Math.round(((data.resolved + data.closed) / data.total) * 100)
      : 0;

  const slaRadialData = [
    {
      name: "SLA",
      value: data.sla_compliance_pct,
      fill:
        data.sla_compliance_pct >= 90
          ? "#66bb6a"
          : data.sla_compliance_pct >= 70
          ? "#ffa726"
          : "#ef5350",
    },
  ];

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        backgroundColor: "#f5f7fb",
        minHeight: "100vh",
      }}
    >
      {/* ================= HEADER ================= */}

      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 5,
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #346bc4 0%, #4077c5 50%, #5685c6 100%)",
          color: "white",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            spacing={2}
          >
            <Box>
              <Typography variant="h4" fontWeight={800}>
                Ticket Dashboard
              </Typography>

              <Typography
                variant="body1"
                sx={{ mt: 1, opacity: 0.85 }}
              >
                Real-time monitoring of incidents, SLA metrics and ticket
                performance
              </Typography>

              {lastUpdated && (
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.7, mt: 1, display: "block" }}
                >
                  Last updated: {lastUpdated}
                </Typography>
              )}
            </Box>

            <Stack direction="row" spacing={1} alignItems="flex-start">
              <Button
                variant="contained"
                sx={{
                  bgcolor: "white",
                  color: "#1e293b",
                  fontWeight: 700,
                  "&:hover": {
                    bgcolor: "#f1f5f9",
                  },
                }}
                onClick={() => navigate("/tickets")}
              >
                View Tickets
              </Button>

              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchDashboard}
                sx={{
                  borderColor: "rgba(255,255,255,0.4)",
                  color: "white",
                  "&:hover": {
                    borderColor: "white",
                    backgroundColor: "rgba(255,255,255,0.08)",
                  },
                }}
              >
                Refresh
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* ================= KPI CARDS ================= */}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <StatCard
            label="Total Tickets"
            value={data.total}
            color="#1976d2"
            icon={<ConfirmationNumberIcon />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <StatCard
            label="Open Tickets"
            value={data.open}
            color="#fb8c00"
            icon={<WarningAmberIcon />}
            subtitle="Needs attention"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <StatCard
            label="Resolved"
            value={data.resolved}
            color="#43a047"
            icon={<CheckCircleIcon />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <StatCard
            label="Closed"
            value={data.closed}
            color="#607d8b"
            icon={<LockIcon />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <StatCard
            label="SLA Breached"
            value={data.sla_breached}
            color={data.sla_breached > 0 ? "#e53935" : "#43a047"}
            icon={<TrendingUpIcon />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <StatCard
            label="SLA Compliance"
            value={`${data.sla_compliance_pct}%`}
            color={
              data.sla_compliance_pct >= 90
                ? "#43a047"
                : data.sla_compliance_pct >= 70
                ? "#fb8c00"
                : "#e53935"
            }
            icon={<InsightsIcon />}
            subtitle="Within SLA"
          />
        </Grid>
      </Grid>

      {/* ================= CHARTS ROW 1 ================= */}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* STATUS */}

        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard title="Tickets by Status">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  dataKey="value"
                  cx="50%"
                  cy="45%"
                  outerRadius={85}
                  label={renderCustomLabel}
                  labelLine={false}
                >
                  {statusChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>

                <ReTooltip />
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        {/* PRIORITY */}

        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard title="Tickets by Priority">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityChartData}
                  dataKey="value"
                  innerRadius={45}
                  outerRadius={90}
                  cx="50%"
                  cy="45%"
                  label={renderCustomLabel}
                  labelLine={false}
                >
                  {priorityChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>

                <ReTooltip />
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        {/* CATEGORY */}

        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard title="Tickets by Category">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={categoryChartData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />

                <XAxis type="number" allowDecimals={false} />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 11 }}
                />

                <ReTooltip />

                <Bar
                  dataKey="value"
                  radius={[0, 6, 6, 0]}
                  maxBarSize={28}
                >
                  {categoryChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      {/* ================= CHARTS ROW 2 ================= */}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* OPEN VS CLOSED */}

        <Grid size={{ xs: 12, md: 5 }}>
          <ChartCard title="Ticket Overview">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={[
                  {
                    name: "Open",
                    value: data.open,
                    fill: "#fb8c00",
                  },
                  {
                    name: "Resolved",
                    value: data.resolved,
                    fill: "#43a047",
                  },
                  {
                    name: "Closed",
                    value: data.closed,
                    fill: "#607d8b",
                  },
                  {
                    name: "Critical",
                    value: data.by_priority?.critical || 0,
                    fill: "#e53935",
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <XAxis dataKey="name" />
                <YAxis />

                <ReTooltip />

                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {[
                    "#fb8c00",
                    "#43a047",
                    "#607d8b",
                    "#e53935",
                  ].map((c, i) => (
                    <Cell key={i} fill={c} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <Box sx={{ mt: 3 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ mb: 1 }}
              >
                <Typography variant="body2" fontWeight={600}>
                  Resolution Rate
                </Typography>

                <Typography variant="body2" fontWeight={700}>
                  {resolutionRate}%
                </Typography>
              </Stack>

              <LinearProgress
                variant="determinate"
                value={resolutionRate}
                color="success"
                sx={{
                  height: 10,
                  borderRadius: 10,
                }}
              />
            </Box>
          </ChartCard>
        </Grid>

        {/* CHANNEL */}

        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard title="Tickets by Channel">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={channelChartData}
                  dataKey="value"
                  cx="50%"
                  cy="45%"
                  outerRadius={90}
                  label={renderCustomLabel}
                  labelLine={false}
                >
                  {channelChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>

                <ReTooltip />
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        {/* SLA */}

        <Grid size={{ xs: 12, md: 3 }}>
          <ChartCard title="SLA Compliance">
            <Box sx={{ position: "relative", height: 260 }}>
              <ResponsiveContainer width="100%" height={240}>
                <RadialBarChart
                  innerRadius="60%"
                  outerRadius="90%"
                  data={slaRadialData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={10}
                    background={{ fill: "#edf2f7" }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>

              <Box
                sx={{
                  position: "absolute",
                  top: "48%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{
                    color:
                      data.sla_compliance_pct >= 90
                        ? "#43a047"
                        : data.sla_compliance_pct >= 70
                        ? "#fb8c00"
                        : "#e53935",
                  }}
                >
                  {data.sla_compliance_pct}%
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  SLA Success
                </Typography>
              </Box>
            </Box>
          </ChartCard>
        </Grid>
      </Grid>

      {/* ================= RECENT TICKETS ================= */}

      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          border: "1px solid",
          borderColor: "grey.200",
        }}
      >
        <CardContent>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Typography variant="h6" fontWeight={700}>
              Recent Tickets
            </Typography>

            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate("/tickets")}
            >
              View All
            </Button>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: "#f8fafc",
                  }}
                >
                  <TableCell sx={{ fontWeight: 700 }}>
                    Ticket #
                  </TableCell>

                  <TableCell sx={{ fontWeight: 700 }}>
                    Title
                  </TableCell>

                  <TableCell sx={{ fontWeight: 700 }}>
                    Priority
                  </TableCell>

                  <TableCell sx={{ fontWeight: 700 }}>
                    Status
                  </TableCell>

                  <TableCell sx={{ fontWeight: 700 }}>
                    Created
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {data.recent_tickets.map((t) => (
                  <TableRow
                    key={t.ticket_number}
                    hover
                    onClick={() => navigate("/tickets")}
                    sx={{
                      cursor: "pointer",
                      transition: "0.2s",
                      "&:hover": {
                        backgroundColor: "#f8fafc",
                      },
                    }}
                  >
                    <TableCell
                      sx={{
                        fontWeight: 700,
                        color: "primary.main",
                      }}
                    >
                      {t.ticket_number}
                    </TableCell>

                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 260,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {t.title}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={t.priority}
                        color={getPriorityColor(t.priority)}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={t.status.replace("_", " ")}
                        color={getStatusColor(t.status)}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      {new Date(t.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TicketDashboard;