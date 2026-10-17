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
  Button,
  TextField,
} from "@mui/material";
import DashboardCard from "../../components/common/DashboardCard";
import { useToast } from "../../components/common/useToast";
import Toast from "../../components/common/Toast";
import api from "../../utils/api";

const CVEFindings = () => {
  const [cves, setCves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [binaryName, setBinaryName] = useState("");
  const [version, setVersion] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const { toast, showToast, closeToast } = useToast();

  useEffect(() => {
    fetchCVEFindings();
  }, []);

  const fetchCVEFindings = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/v1/cve/findings");
      if (response.data && Array.isArray(response.data)) {
        setCves(response.data);
      } else if (response.data && Array.isArray(response.data.cves)) {
        setCves(response.data.cves);
      } else {
        setCves([]);
      }
    } catch (err) {
      console.warn("Could not fetch CVE findings:", err);
      setCves([]);
    } finally {
      setLoading(false);
    }
  };

  const lookupCVEs = async () => {
    if (!binaryName) {
      fetchCVEFindings();
      return;
    }
    try {
      setLoading(true);
      const response = await api.post("/api/v1/cve/lookup", {
        binary_name: binaryName,
        version: version,
      });
      setCves(response.data.cves || []);
    } catch (err) {
      showToast("Failed to lookup CVEs", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: "bold" }}>
        CVE Findings
      </Typography>
      <Grid container spacing={3}>
        <Grid size={12}>
          <DashboardCard title="CVE Lookup">
            <Box sx={{ mb: 2, display: "flex", gap: 2, alignItems: "center" }}>
              <TextField
                label="Binary Name"
                value={binaryName}
                onChange={(e) => setBinaryName(e.target.value)}
                size="small"
              />
              <TextField
                label="Version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                size="small"
              />
              <Button
                variant="contained"
                onClick={lookupCVEs}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : "Lookup"}
              </Button>
            </Box>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>CVE ID</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>CVSS Score</TableCell>
                    <TableCell>Severity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cves.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No CVEs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    cves.map((cve, index) => (
                      <TableRow key={index}>
                        <TableCell>{cve.cve_id}</TableCell>
                        <TableCell>{cve.description || cve.summary || "No description available"}</TableCell>
                        <TableCell>{cve.cvss_score || "N/A"}</TableCell>
                        <TableCell>
                          <Chip
                            label={cve.severity || "unknown"}
                            color={
                              cve.severity === "critical" ? "error" : "warning"
                            }
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

export default CVEFindings;
