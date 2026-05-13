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
import DashboardCard from "../../components/common/DashboardCard";
import { useToast } from "../../components/common/useToast";
import Toast from "../../components/common/Toast";
import api from "../../utils/api";

const IntegrityMonitoring = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast, showToast, closeToast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/v1/integrity/events");
      setEvents(response.data.events || []);
    } catch (err) {
      setError("Failed to fetch integrity events");
      showToast("Failed to fetch integrity events", "error");
    } finally {
      setLoading(false);
    }
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
        File Integrity Monitoring
      </Typography>
      <Grid container spacing={3}>
        <Grid size={12}>
          <DashboardCard title="Integrity Violation Events">
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>File Path</TableCell>
                    <TableCell>Event Type</TableCell>
                    <TableCell>Expected Hash</TableCell>
                    <TableCell>Actual Hash</TableCell>
                    <TableCell>Detected At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {events.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No integrity violations
                      </TableCell>
                    </TableRow>
                  ) : (
                    events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>{event.file_path}</TableCell>
                        <TableCell>
                          <Chip
                            label={event.event_type}
                            color="warning"
                            size="small"
                          />
                        </TableCell>
                        <TableCell
                          sx={{ fontFamily: "monospace", fontSize: "0.8em" }}
                        >
                          {event.sha256_expected?.substring(0, 16)}...
                        </TableCell>
                        <TableCell
                          sx={{ fontFamily: "monospace", fontSize: "0.8em" }}
                        >
                          {event.sha256_actual?.substring(0, 16)}...
                        </TableCell>
                        <TableCell>
                          {new Date(event.detected_at).toLocaleString()}
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

export default IntegrityMonitoring;
