import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Typography, Button, Card, CardContent,
  CircularProgress, Chip, Checkbox, FormControlLabel,
  Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, Paper, Alert, Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import PendingIcon from "@mui/icons-material/Pending";
import policyApi from "../../utils/policyApi";
import Toast from "../../components/common/Toast";
import { useToast } from "../../components/common/useToast";

const getPlatformColor = (platform) => {
  switch (platform) {
    case "windows": return "primary";
    case "android": return "success";
    case "ios": return "warning";
    case "macos": return "default";
    default: return "default";
  }
};

const getDeploymentColor = (status) => {
  switch (status) {
    case "success": return "success";
    case "failed": return "error";
    case "pending": return "warning";
    default: return "default";
  }
};

const PolicyApply = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, showToast, closeToast } = useToast();

  const [policy, setPolicy] = useState(null);
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [selected, setSelected] = useState([]);
  const [platformFilter, setPlatformFilter] = useState("all");
  // ✅ NEW: track which device is being simulated
  const [simulating, setSimulating] = useState(null);

  const fetchData = async () => {
    try {
      const [policyData, devicesData, statsData] = await Promise.all([
        policyApi.getPolicyById(id),
        policyApi.getPolicyDevices(id),
        policyApi.getAssignmentStats(id),
      ]);
      setPolicy(policyData);
      setDevices(devicesData);
      setStats(statsData);
      const alreadyAssigned = devicesData.filter((d) => d.assigned).map((d) => d.id);
      setSelected(alreadyAssigned);
    } catch (err) {
      console.error("Error loading data", err);
      showToast("Failed to load policy data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const filteredDevices = devices.filter((d) =>
    platformFilter === "all" || d.platform === platformFilter
  );

  const handleToggle = (deviceId) => {
    setSelected((prev) =>
      prev.includes(deviceId) ? prev.filter((i) => i !== deviceId) : [...prev, deviceId]
    );
  };

  const handleSelectAll = () => {
    if (selected.length === filteredDevices.length) {
      setSelected([]);
    } else {
      setSelected(filteredDevices.map((d) => d.id));
    }
  };

  const handleApply = async () => {
    if (selected.length === 0) {
      showToast("Please select at least one device", "warning");
      return;
    }
    setApplying(true);
    try {
      await policyApi.assignDevices(id, selected);
      showToast(`Policy applied to ${selected.length} device(s) successfully!`, "success");
      await fetchData();
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to apply policy", "error");
    } finally {
      setApplying(false);
    }
  };

  const handleUnassign = async (deviceId, deviceName) => {
    if (!window.confirm(`Remove policy from "${deviceName}"?`)) return;
    try {
      await policyApi.unassignDevice(id, deviceId);
      showToast("Device unassigned", "success");
      await fetchData();
    } catch {
      showToast("Failed to unassign device", "error");
    }
  };

  // ✅ NEW: Simulate status handler
  const handleSimulate = async (deviceId, status) => {
    setSimulating(`${deviceId}-${status}`);
    try {
      await policyApi.simulateStatus(id, deviceId, status);
      showToast(`Simulated: ${status} for device`, status === "success" ? "success" : "error");
      await fetchData();
    } catch {
      showToast("Failed to simulate status", "error");
    } finally {
      setSimulating(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      {/* HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/policies/${id}`)}>
          Back to Policy
        </Button>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={handleApply}
          disabled={applying || selected.length === 0}
        >
          {applying ? "Applying..." : `Apply to ${selected.length} Device(s)`}
        </Button>
      </Box>

      <Typography variant="h4" fontWeight="bold">{policy?.name}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select devices to apply this policy to
      </Typography>

      {/* STATS */}
      {stats && (
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          {[
            { label: "Total Assigned", value: stats.total_assigned, color: "text.primary" },
            { label: "Success", value: stats.success, color: "success.main" },
            { label: "Pending", value: stats.pending, color: "warning.main" },
            { label: "Failed", value: stats.failed, color: "error.main" },
          ].map((item, i) => (
            <Card key={i} sx={{ flex: 1, minWidth: 120, borderRadius: 2 }}>
              <CardContent sx={{ textAlign: "center", py: 1.5 }}>
                <Typography variant="subtitle2" color="text.secondary">{item.label}</Typography>
                <Typography variant="h5" sx={{ color: item.color }}>{item.value}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* PLATFORM FILTER */}
      <Box sx={{ mb: 2, display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>Filter:</Typography>
        {["all", "windows", "android", "ios", "macos"].map((p) => (
          <Chip
            key={p}
            label={p.charAt(0).toUpperCase() + p.slice(1)}
            color={getPlatformColor(p)}
            variant={platformFilter === p ? "filled" : "outlined"}
            onClick={() => setPlatformFilter(p)}
            clickable
            size="small"
          />
        ))}
      </Box>

      {/* SELECT ALL */}
      <Box sx={{ mb: 1, display: "flex", alignItems: "center", gap: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={selected.length === filteredDevices.length && filteredDevices.length > 0}
              indeterminate={selected.length > 0 && selected.length < filteredDevices.length}
              onChange={handleSelectAll}
            />
          }
          label={`Select All (${filteredDevices.length} devices)`}
        />
        {selected.length > 0 && (
          <Typography variant="body2" color="primary">{selected.length} selected</Typography>
        )}
      </Box>

      {/* DEVICES TABLE */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "grey.50" }}>
              <TableCell padding="checkbox" />
              <TableCell sx={{ fontWeight: "bold" }}>Device</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Platform</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>OS Version</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Owner</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
              {/* ✅ NEW column */}
              <TableCell sx={{ fontWeight: "bold" }}>Simulate</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDevices.map((device) => (
              <TableRow
                key={device.id}
                hover
                selected={selected.includes(device.id)}
                sx={{ "&:last-child td": { border: 0 } }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.includes(device.id)}
                    onChange={() => handleToggle(device.id)}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 500 }}>{device.name}</TableCell>
                <TableCell>
                  <Chip label={device.platform} color={getPlatformColor(device.platform)} size="small" />
                </TableCell>
                <TableCell>{device.os_version || "—"}</TableCell>
                <TableCell>{device.owner || "—"}</TableCell>
                <TableCell>
                  {device.assigned ? (
                    <Chip
                      label={device.deployment_status || "pending"}
                      color={getDeploymentColor(device.deployment_status)}
                      size="small"
                      icon={
                        device.deployment_status === "success" ? <CheckCircleIcon /> :
                        device.deployment_status === "failed" ? <ErrorIcon /> :
                        <PendingIcon />
                      }
                    />
                  ) : (
                    <Typography variant="body2" color="text.disabled">Not assigned</Typography>
                  )}
                </TableCell>

                {/* ✅ NEW: Simulate buttons — only show for assigned devices */}
                <TableCell>
                  {device.assigned ? (
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Tooltip title="Simulate Success">
                        <span>
                          <Button
                            size="small"
                            color="success"
                            variant={device.deployment_status === "success" ? "contained" : "outlined"}
                            onClick={() => handleSimulate(device.id, "success")}
                            disabled={simulating === `${device.id}-success`}
                            sx={{ minWidth: 0, px: 1 }}
                          >
                            ✓
                          </Button>
                        </span>
                      </Tooltip>
                      <Tooltip title="Simulate Failed">
                        <span>
                          <Button
                            size="small"
                            color="error"
                            variant={device.deployment_status === "failed" ? "contained" : "outlined"}
                            onClick={() => handleSimulate(device.id, "failed")}
                            disabled={simulating === `${device.id}-failed`}
                            sx={{ minWidth: 0, px: 1 }}
                          >
                            ✗
                          </Button>
                        </span>
                      </Tooltip>
                      <Tooltip title="Reset to Pending">
                        <span>
                          <Button
                            size="small"
                            color="warning"
                            variant={device.deployment_status === "pending" ? "contained" : "outlined"}
                            onClick={() => handleSimulate(device.id, "pending")}
                            disabled={simulating === `${device.id}-pending`}
                            sx={{ minWidth: 0, px: 1 }}
                          >
                            ↺
                          </Button>
                        </span>
                      </Tooltip>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.disabled">—</Typography>
                  )}
                </TableCell>

                <TableCell>
                  {device.assigned && (
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      onClick={() => handleUnassign(device.id, device.name)}
                    >
                      Remove
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Alert severity="info">
        Use <strong>✓</strong> to simulate success, <strong>✗</strong> to simulate failure, and <strong>↺</strong> to reset to pending. Stats update instantly.
      </Alert>

      <Toast toast={toast} onClose={closeToast} />
    </Box>
  );
};

export default PolicyApply;