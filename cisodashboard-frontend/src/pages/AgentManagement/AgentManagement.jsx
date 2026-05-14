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
  Button,
  Grid,
} from "@mui/material";
import DashboardCard from "../../components/common/DashboardCard";
import ScanResultsDialog from "../../components/common/ScanResultsDialog";
import { useToast } from "../../components/common/useToast";
import Toast from "../../components/common/Toast";
import api from "../../utils/api";

const AgentManagement = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scanningAgents, setScanningAgents] = useState(new Set());
  const [scanResultsDialog, setScanResultsDialog] = useState({
    open: false,
    agent: null,
  });
  const [scanRefreshTrigger, setScanRefreshTrigger] = useState(0);
  const { toast, showToast, closeToast } = useToast();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/v1/agents/");
      setAgents(response.data || []);
    } catch (err) {
      setError("Failed to fetch agents");
      showToast("Failed to fetch agents", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (agentId, status) => {
    try {
      await api.patch(`/api/v1/agents/${agentId}/status`, { status });
      showToast("Agent status updated", "success");
      fetchAgents();
    } catch (err) {
      showToast("Failed to update agent status", "error");
    }
  };

  const triggerScan = async (agentId) => {
    try {
      setScanningAgents((prev) => new Set(prev).add(agentId));
      showToast("Scan in progress...", "info");

      await api.post(`/api/v1/agents/${agentId}/scan`);
      showToast("Scan completed successfully", "success");

      // Refresh data after a short delay to show scan results
      setTimeout(() => {
        fetchAgents();
        setScanRefreshTrigger((prev) => prev + 1); // Trigger scan results refresh
        setScanningAgents((prev) => {
          const newSet = new Set(prev);
          newSet.delete(agentId);
          return newSet;
        });
      }, 2000); // Reduced delay since we're showing immediate feedback
    } catch (err) {
      showToast("Scan failed to start", "error");
      setScanningAgents((prev) => {
        const newSet = new Set(prev);
        newSet.delete(agentId);
        return newSet;
      });
    }
  };

  const openScanResults = (agent) => {
    setScanResultsDialog({
      open: true,
      agent: agent,
    });
  };

  const closeScanResults = () => {
    setScanResultsDialog({
      open: false,
      agent: null,
    });
  };

  if (loading)
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
  if (error)
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: "bold" }}>
        Agent Management
      </Typography>
      <Grid container spacing={3}>
        <Grid size={12}>
          <DashboardCard title="Registered Agents">
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Hostname</TableCell>
                    <TableCell>OS</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Scan</TableCell>
                    <TableCell>Actions</TableCell>
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
                        <TableCell>{agent.hostname}</TableCell>
                        <TableCell>{agent.os}</TableCell>
                        <TableCell>
                          <Chip
                            label={agent.status}
                            color={
                              agent.status === "active" ? "success" : "error"
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {agent.last_scan_at
                            ? new Date(agent.last_scan_at).toLocaleString()
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="contained"
                            color="info"
                            onClick={() => openScanResults(agent)}
                            sx={{ mr: 1, mb: 1 }}
                          >
                            View Scan Results
                          </Button>
                          <br />
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={() => triggerScan(agent.id)}
                            disabled={scanningAgents.has(agent.id)}
                            sx={{ mr: 1 }}
                          >
                            {scanningAgents.has(agent.id)
                              ? "Scanning..."
                              : "Scan Now"}
                          </Button>
                          <Button
                            size="small"
                            onClick={() => updateStatus(agent.id, "quarantine")}
                            sx={{ mr: 1 }}
                          >
                            Quarantine
                          </Button>
                          <Button
                            size="small"
                            onClick={() => updateStatus(agent.id, "active")}
                          >
                            Activate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </DashboardCard>
        </Grid>
      </Grid>

      <ScanResultsDialog
        open={scanResultsDialog.open}
        onClose={closeScanResults}
        agent={scanResultsDialog.agent}
        refreshTrigger={scanRefreshTrigger}
      />

      <Toast toast={toast} onClose={closeToast} />
    </Box>
  );
};

export default AgentManagement;
