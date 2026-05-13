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

const BinaryInventory = () => {
  const [binaries, setBinaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast, showToast, closeToast } = useToast();

  useEffect(() => {
    fetchBinaries();
  }, []);

  const fetchBinaries = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/v1/binary/inventory");
      setBinaries(response.data.inventory || []);
    } catch (err) {
      setError("Failed to fetch binary inventory");
      showToast("Failed to fetch binary inventory", "error");
    } finally {
      setLoading(false);
    }
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
        Binary Inventory
      </Typography>

      <Grid container spacing={3}>
        <Grid size={12}>
          <DashboardCard title="Scanned Binaries">
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>File Name</TableCell>
                    <TableCell>SHA256</TableCell>
                    <TableCell>File Size</TableCell>
                    <TableCell>Entropy</TableCell>
                    <TableCell>YARA Match</TableCell>
                    <TableCell>Malware Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {binaries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No binaries scanned
                      </TableCell>
                    </TableRow>
                  ) : (
                    binaries.map((binary) => (
                      <TableRow key={binary.id}>
                        <TableCell>{binary.file_name}</TableCell>
                        <TableCell
                          sx={{ fontFamily: "monospace", fontSize: "0.8em" }}
                        >
                          {binary.sha256?.substring(0, 16)}...
                        </TableCell>
                        <TableCell>{binary.file_size} bytes</TableCell>
                        <TableCell>
                          {binary.entropy?.toFixed(2) || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={binary.yara_matched ? "Yes" : "No"}
                            color={binary.yara_matched ? "error" : "success"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={binary.malware_score || 0}
                            color={
                              (binary.malware_score || 0) > 50
                                ? "error"
                                : "success"
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

export default BinaryInventory;
