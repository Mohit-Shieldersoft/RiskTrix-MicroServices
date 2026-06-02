import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Card, CardContent, Grid, CircularProgress,
  Button, Divider, LinearProgress, Chip,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DevicesIcon from "@mui/icons-material/Devices";
import TokenIcon from "@mui/icons-material/Token";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import HistoryIcon from "@mui/icons-material/History";
import deviceApi from "../../utils/deviceApi";

const StatCard = ({ label, value, color = "text.primary", icon, subtitle }) => (
  <Card sx={{ borderRadius: 2, height: "100%" }}>
    <CardContent>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
          <Typography variant="h4" fontWeight="bold" sx={{ color, mt: 0.5 }}>{value ?? "—"}</Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
          )}
        </Box>
        <Box sx={{ color, opacity: 0.7 }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

export default function EnrollmentDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, h] = await Promise.all([
          deviceApi.getEnrollmentStats(),
          deviceApi.getEnrollmentHistory(),
        ]);
        setStats(s);
        setHistory(h || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
      <CircularProgress />
    </Box>
  );

  const enrollRate = stats
    ? Math.round((stats.enrolled_devices / (stats.total_devices || 1)) * 100)
    : 0;

  const recentHistory = history.slice(0, 5);

  return (
    <Box sx={{ p: 3 }}>
      {/* HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Enrollment Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            MDM enrollment overview — devices, tokens, and history
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DevicesIcon />}
            onClick={() => navigate("/devices")}
          >
            View Devices
          </Button>
          <Button
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => navigate("/enrollment/enroll")}
          >
            Enroll Device
          </Button>
        </Box>
      </Box>

      {/* STAT CARDS */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <StatCard
              label="Total Devices"
              value={stats.total_devices}
              icon={<DevicesIcon fontSize="large" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <StatCard
              label="Enrolled"
              value={stats.enrolled_devices}
              color="success.main"
              icon={<CheckCircleIcon fontSize="large" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <StatCard
              label="Unenrolled"
              value={stats.unenrolled_devices}
              color="text.secondary"
              icon={<DevicesIcon fontSize="large" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <StatCard
              label="Active Tokens"
              value={stats.active_tokens}
              color="primary.main"
              icon={<TokenIcon fontSize="large" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <StatCard
              label="Expired Tokens"
              value={stats.expired_tokens}
              color="warning.main"
              icon={<WarningAmberIcon fontSize="large" />}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <StatCard
              label="Used Tokens"
              value={stats.used_tokens}
              color="text.secondary"
              icon={<TokenIcon fontSize="large" />}
            />
          </Grid>
        </Grid>
      )}

      {/* ENROLLMENT RATE */}
      {stats && (
        <Card sx={{ borderRadius: 2, mb: 3 }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">Enrollment Rate</Typography>
              <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                {enrollRate}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={enrollRate}
              color="success"
              sx={{ height: 10, borderRadius: 5 }}
            />
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {stats.enrolled_devices} enrolled
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats.unenrolled_devices} unenrolled
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* QUICK ACTIONS */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            title: "Enroll a Device",
            desc: "Use an enrollment token to register a new device into MDM.",
            icon: <AddCircleOutlineIcon fontSize="large" color="primary" />,
            action: () => navigate("/enrollment/enroll"),
            label: "Start Enrollment",
            variant: "contained",
          },
          {
            title: "Manage Tokens",
            desc: "Generate, view, and revoke enrollment tokens for any platform.",
            icon: <TokenIcon fontSize="large" color="warning" />,
            action: () => navigate("/devices"),
            label: "Manage Tokens",
            variant: "outlined",
          },
          {
            title: "Enrollment History",
            desc: "Audit all past device enrollments with token and method details.",
            icon: <HistoryIcon fontSize="large" color="action" />,
            action: () => navigate("/devices"),
            label: "View History",
            variant: "outlined",
          },
        ].map((card, i) => (
          <Grid size={{ xs: 12, md: 4 }} key={i}>
            <Card sx={{ borderRadius: 2, height: "100%" }}>
              <CardContent sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <Box sx={{ mb: 1 }}>{card.icon}</Box>
                <Typography variant="subtitle1" fontWeight="bold">{card.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ flex: 1, mt: 0.5, mb: 2 }}>
                  {card.desc}
                </Typography>
                <Button variant={card.variant} onClick={card.action} fullWidth>
                  {card.label}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* RECENT ENROLLMENTS */}
      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">Recent Enrollments</Typography>
            <Button size="small" onClick={() => navigate("/devices")}>View All</Button>
          </Box>
          <Divider sx={{ mb: 2 }} />
          {recentHistory.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
              No enrollments yet
            </Typography>
          ) : (
            recentHistory.map((e) => (
              <Box
                key={e.id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  py: 1.5,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  "&:last-child": { borderBottom: 0 },
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight={500}>{e.device_name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {e.device_uid} · by {e.enrolled_by || "—"} · {new Date(e.enrolled_at).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <Chip
                    label={e.platform}
                    size="small"
                    color={
                      e.platform === "windows" ? "primary" :
                      e.platform === "android" ? "success" :
                      e.platform === "ios" ? "warning" : "default"
                    }
                  />
                  <Chip
                    label={e.status}
                    size="small"
                    color={e.status === "active" ? "success" : "default"}
                  />
                </Box>
              </Box>
            ))
          )}
        </CardContent>
      </Card>
    </Box>
  );
}