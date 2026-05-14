import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import DashboardCard from "../../components/common/DashboardCard";
import { useToast } from "../../components/common/useToast";
import Toast from "../../components/common/Toast";
import api from "../../utils/api";

const EndpointSecurity = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast, showToast, closeToast } = useToast();
  const theme = useTheme();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/v1/agents/");
      // Ensure we have an array
      const agentsData = Array.isArray(response.data) ? response.data : [];
      setAgents(agentsData);
    } catch (err) {
      console.error("Failed to fetch agents:", err);
      setError("Failed to fetch agents");
      showToast("Failed to fetch agents", "error");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalAgents = agents.length;
  const onlineAgents = agents.filter(
    (agent) => agent.status === "active",
  ).length;
  const offlineAgents = totalAgents - onlineAgents;
  const windowsSystems = agents.filter(
    (agent) => agent.os && agent.os.toLowerCase().includes("windows"),
  ).length;
  const linuxSystems = agents.filter(
    (agent) => agent.os && agent.os.toLowerCase().includes("linux"),
  ).length;
  const macSystems = agents.filter(
    (agent) =>
      agent.os &&
      (agent.os.toLowerCase().includes("darwin") ||
        agent.os.toLowerCase().includes("mac")),
  ).length;

  const statsCards = [
    {
      title: "Total Endpoints",
      value: totalAgents,
      color: theme?.palette?.primary?.main || "#1976d2",
    },
    {
      title: "Online Agents",
      value: onlineAgents,
      color: theme?.palette?.success?.main || "#2e7d32",
    },
    {
      title: "Offline Agents",
      value: offlineAgents,
      color: theme?.palette?.error?.main || "#d32f2f",
    },
    {
      title: "Windows Systems",
      value: windowsSystems,
      color: theme?.palette?.info?.main || "#0288d1",
    },
    {
      title: "Linux Systems",
      value: linuxSystems,
      color: theme?.palette?.warning?.main || "#ed6c02",
    },
    {
      title: "macOS Systems",
      value: macSystems,
      color: theme?.palette?.secondary?.main || "#7b1fa2",
    },
  ];

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: "bold" }}>
        Endpoint Security Overview
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statsCards.map((card, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
            <DashboardCard title={card.title}>
              <Typography
                variant="h3"
                sx={{ color: card.color, fontWeight: "bold" }}
              >
                {card.value}
              </Typography>
            </DashboardCard>
          </Grid>
        ))}
      </Grid>

      {/* Agents Table */}
      <DashboardCard title="Registered Agents">
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Hostname</TableCell>
                <TableCell>OS</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Heartbeat</TableCell>
                <TableCell>Agent Version</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {agents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No agents registered
                  </TableCell>
                </TableRow>
              ) : (
                agents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>{agent.hostname || "Unknown"}</TableCell>
                    <TableCell>{agent.os || "Unknown"}</TableCell>
                    <TableCell>
                      <Chip
                        label={agent.status || "unknown"}
                        color={agent.status === "active" ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {agent.last_heartbeat
                        ? (() => {
                            try {
                              return new Date(
                                agent.last_heartbeat,
                              ).toLocaleString();
                            } catch (e) {
                              return "Invalid Date";
                            }
                          })()
                        : "Never"}
                    </TableCell>
                    <TableCell>{agent.agent_version || "Unknown"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DashboardCard>

      <Toast toast={toast} onClose={closeToast} />
    </Box>
  );
};

export default EndpointSecurity;
