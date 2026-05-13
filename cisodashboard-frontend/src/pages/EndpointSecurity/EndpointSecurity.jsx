import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import DashboardCard from "../../components/common/DashboardCard";
import { useToast } from "../../components/common/useToast";
import Toast from "../../components/common/Toast";
import api from "../../utils/api";

const EndpointSecurity = () => {
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast, showToast, closeToast } = useToast();
  const theme = useTheme();

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const fetchEndpoints = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/v1/endpoints/");
      setEndpoints(response.data.endpoints || []);
    } catch (err) {
      setError("Failed to fetch endpoints");
      showToast("Failed to fetch endpoints", "error");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (score >= 76) return "error";
    if (score >= 51) return "warning";
    if (score >= 26) return "info";
    return "success";
  };

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

      <Grid container spacing={3}>
        <Grid size={12}>
          <DashboardCard title="Registered Endpoints">
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Hostname</TableCell>
                    <TableCell>OS</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Heartbeat</TableCell>
                    <TableCell>Risk Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {endpoints.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No endpoints registered
                      </TableCell>
                    </TableRow>
                  ) : (
                    endpoints.map((endpoint) => (
                      <TableRow key={endpoint.id}>
                        <TableCell>{endpoint.hostname}</TableCell>
                        <TableCell>{endpoint.os}</TableCell>
                        <TableCell>
                          <Chip
                            label={endpoint.status}
                            color={
                              endpoint.status === "active" ? "success" : "error"
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {endpoint.last_heartbeat
                            ? new Date(endpoint.last_heartbeat).toLocaleString()
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${endpoint.risk_score || 0}`}
                            color={getRiskColor(endpoint.risk_score || 0)}
                            size="small"
                          />
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

      <Toast toast={toast} onClose={closeToast} />
    </Box>
  );
};

export default EndpointSecurity;
