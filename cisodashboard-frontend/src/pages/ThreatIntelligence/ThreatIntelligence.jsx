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

const ThreatIntelligence = () => {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast, showToast, closeToast } = useToast();

  useEffect(() => {
    fetchFindings();
  }, []);

  const fetchFindings = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/v1/threats/findings");
      setFindings(response.data.findings || []);
    } catch (err) {
      setError("Failed to fetch threat findings");
      showToast("Failed to fetch threat findings", "error");
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
        Threat Intelligence
      </Typography>
      <Grid container spacing={3}>
        <Grid size={12}>
          <DashboardCard title="Threat Findings">
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>IOC Type</TableCell>
                    <TableCell>IOC Value</TableCell>
                    <TableCell>Threat Name</TableCell>
                    <TableCell>Confidence</TableCell>
                    <TableCell>Detected At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {findings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No threat findings
                      </TableCell>
                    </TableRow>
                  ) : (
                    findings.map((finding) => (
                      <TableRow key={finding.id}>
                        <TableCell>{finding.ioc_type}</TableCell>
                        <TableCell>{finding.ioc_value}</TableCell>
                        <TableCell>
                          {finding.threat_name || "Unknown"}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${finding.confidence}%`}
                            color={
                              finding.confidence > 80 ? "error" : "warning"
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(finding.matched_at).toLocaleString()}
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

export default ThreatIntelligence;
