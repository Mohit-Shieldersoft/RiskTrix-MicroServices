import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
  Avatar,
} from "@mui/material";
import BatteryFullIcon from "@mui/icons-material/BatteryFull";
import BatteryAlertIcon from "@mui/icons-material/BatteryAlert";
import Battery50Icon from "@mui/icons-material/Battery50";
import WifiIcon from "@mui/icons-material/Wifi";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import LanIcon from "@mui/icons-material/Lan";
import SignalWifiOffIcon from "@mui/icons-material/SignalWifiOff";
import StorageIcon from "@mui/icons-material/Storage";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RefreshIcon from "@mui/icons-material/Refresh";
import CircleIcon from "@mui/icons-material/Circle";
import heartbeatApi from "../../utils/heartbeatApi";

function BatteryIcon({ level }) {
  if (level == null) return null;
  if (level <= 20) return <BatteryAlertIcon color="error" fontSize="small" />;
  if (level <= 50) return <Battery50Icon color="warning" fontSize="small" />;
  return <BatteryFullIcon color="success" fontSize="small" />;
}

function NetworkIcon({ status }) {
  switch (status) {
    case "wifi":     return <WifiIcon color="primary" fontSize="small" />;
    case "cellular": return <SignalCellularAltIcon color="success" fontSize="small" />;
    case "ethernet": return <LanIcon color="info" fontSize="small" />;
    default:         return <SignalWifiOffIcon color="disabled" fontSize="small" />;
  }
}

function formatLastSeen(seconds) {
  if (seconds == null) return "Never";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function DeviceHeartbeatCard({ deviceId }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await heartbeatApi.getStatus(deviceId);
      setStatus(data);
    } catch (e) {
      console.error("Heartbeat load failed:", e);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    load();
    // Auto-refresh every 30 seconds
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) {
    return (
      <Card sx={{ borderRadius: 2 }}>
        <CardContent sx={{ display: "flex", justifyContent: "center", py: 3 }}>
          <CircularProgress size={24} />
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  const storagePct = status.storage_pct;
  const storageColor = storagePct >= 90 ? "error" : storagePct >= 75 ? "warning" : "success";
  const batteryColor = status.battery_level <= 20 ? "#d32f2f" : status.battery_level <= 50 ? "#f57c00" : "#2e7d32";

  return (
    <Card
      sx={{
        borderRadius: 2,
        boxShadow: 2,
        border: "1px solid",
        borderColor: status.online ? "success.light" : "grey.300",
      }}
    >
      <CardContent>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircleIcon
              sx={{
                fontSize: 12,
                color: status.online ? "success.main" : "grey.400",
                animation: status.online ? "pulse 2s infinite" : "none",
                "@keyframes pulse": {
                  "0%, 100%": { opacity: 1 },
                  "50%": { opacity: 0.4 },
                },
              }}
            />
            <Typography variant="subtitle1" fontWeight="bold">
              Device Health
            </Typography>
            <Chip
              label={status.online ? "ONLINE" : "OFFLINE"}
              color={status.online ? "success" : "default"}
              size="small"
              sx={{ fontWeight: "bold", fontSize: "0.7rem" }}
            />
          </Box>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={load}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Grid container spacing={2}>
          {/* Last Seen */}
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.5 }}>
              <AccessTimeIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">Last Seen</Typography>
            </Box>
            <Typography variant="body2" fontWeight="bold">
              {formatLastSeen(status.seconds_since_seen)}
            </Typography>
          </Grid>

          {/* Network */}
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.5 }}>
              <NetworkIcon status={status.network_status} />
              <Typography variant="caption" color="text.secondary">Network</Typography>
            </Box>
            <Typography variant="body2" fontWeight="bold" sx={{ textTransform: "capitalize" }}>
              {status.network_status || "Unknown"}
            </Typography>
            {status.ip_address && (
              <Typography variant="caption" color="text.secondary">
                {status.ip_address}
              </Typography>
            )}
          </Grid>

          {/* Agent Version */}
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.5 }}>
              <Avatar sx={{ width: 16, height: 16, fontSize: "0.55rem", bgcolor: "primary.light" }}>A</Avatar>
              <Typography variant="caption" color="text.secondary">Agent</Typography>
            </Box>
            <Typography variant="body2" fontWeight="bold">
              {status.agent_version || "Unknown"}
            </Typography>
          </Grid>

          {/* OS Version */}
          <Grid size={{ xs: 6, sm: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">OS Version</Typography>
            </Box>
            <Typography variant="body2" fontWeight="bold">
              {status.os_version || "Unknown"}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Battery */}
        {status.battery_level != null && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <BatteryIcon level={status.battery_level} />
                <Typography variant="caption" color="text.secondary">Battery</Typography>
              </Box>
              <Typography variant="body2" fontWeight="bold" sx={{ color: batteryColor }}>
                {status.battery_level}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={status.battery_level}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: "grey.200",
                "& .MuiLinearProgress-bar": { bgcolor: batteryColor, borderRadius: 3 },
              }}
            />
          </Box>
        )}

        {/* Storage */}
        {status.storage_used != null && status.storage_total != null && (
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <StorageIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">Storage</Typography>
              </Box>
              <Typography variant="body2" fontWeight="bold">
                {status.storage_used.toFixed(1)} / {status.storage_total.toFixed(1)} GB
                {storagePct != null && (
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                    ({storagePct}%)
                  </Typography>
                )}
              </Typography>
            </Box>
            {storagePct != null && (
              <LinearProgress
                variant="determinate"
                value={Math.min(storagePct, 100)}
                color={storageColor}
                sx={{ height: 6, borderRadius: 3, bgcolor: "grey.200",
                  "& .MuiLinearProgress-bar": { borderRadius: 3 } }}
              />
            )}
          </Box>
        )}

        {/* No data state */}
        {status.battery_level == null && status.storage_used == null && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 1 }}>
            No health metrics reported yet. Waiting for first agent check-in.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
