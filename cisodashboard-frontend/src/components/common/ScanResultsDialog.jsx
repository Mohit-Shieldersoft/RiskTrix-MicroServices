import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";
import DashboardCard from "../../components/common/DashboardCard";
import { useToast } from "../../components/common/useToast";
import Toast from "../../components/common/Toast";
import api from "../../utils/api";

const ScanResultsDialog = ({ open, onClose, agent, refreshTrigger }) => {
  const [scanResults, setScanResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDetails, setFileDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Filters
  const [dateFilter, setDateFilter] = useState("");
  const [resultFilter, setResultFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { toast, showToast, closeToast } = useToast();

  useEffect(() => {
    if (open && agent) {
      fetchScanResults();
    }
  }, [open, agent, dateFilter, resultFilter, typeFilter, refreshTrigger]);

  const fetchScanResults = async () => {
    if (!agent) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("agent_id", agent.id);

      if (dateFilter) {
        params.append("date", dateFilter);
      }

      const response = await api.get(`/api/v1/binary/inventory?${params}`);
      let results = response.data.inventory || [];

      // Apply client-side filters
      if (resultFilter !== "all") {
        results = results.filter((item) => {
          const score = item.malware_score || 0;
          switch (resultFilter) {
            case "clean":
              return score === 0;
            case "suspicious":
              return score > 0 && score <= 50;
            case "malicious":
              return score > 50;
            default:
              return true;
          }
        });
      }

      if (typeFilter !== "all") {
        results = results.filter((item) => {
          const ext = item.file_name.split(".").pop().toLowerCase();
          switch (typeFilter) {
            case "exe":
              return ext === "exe";
            case "dll":
              return ext === "dll";
            case "script":
              return ["ps1", "bat", "cmd", "vbs", "js"].includes(ext);
            default:
              return true;
          }
        });
      }

      setScanResults(results);
    } catch (err) {
      console.error("Failed to fetch scan results:", err);
      setError("Failed to fetch scan results");
      showToast("Failed to fetch scan results", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchFileDetails = async (sha256) => {
    try {
      setDetailsLoading(true);
      const response = await api.get(`/api/v1/binary/${sha256}`);
      setFileDetails(response.data);
    } catch (err) {
      console.error("Failed to fetch file details:", err);
      showToast("Failed to fetch file details", "error");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleFileClick = (file) => {
    setSelectedFile(file);
    fetchFileDetails(file.sha256);
  };

  const getRiskColor = (score) => {
    if (score > 50) return "error";
    if (score > 0) return "warning";
    return "success";
  };

  const getRiskLabel = (score) => {
    if (score > 50) return "Malicious";
    if (score > 0) return "Suspicious";
    return "Clean";
  };

  const clearFilters = () => {
    setDateFilter("");
    setResultFilter("all");
    setTypeFilter("all");
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { minHeight: "80vh" },
      }}
    >
      <DialogTitle>
        <Typography variant="h5" component="div">
          Scan Results for {agent?.hostname || "Agent"}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {/* Filters */}
        <Box sx={{ mb: 3, p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                label="Scan Date (YYYY-MM-DD)"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                size="small"
                fullWidth
                placeholder="2026-05-13"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Result Type</InputLabel>
                <Select
                  value={resultFilter}
                  label="Result Type"
                  onChange={(e) => setResultFilter(e.target.value)}
                >
                  <MenuItem value="all">All Results</MenuItem>
                  <MenuItem value="clean">Clean Only</MenuItem>
                  <MenuItem value="suspicious">Suspicious Only</MenuItem>
                  <MenuItem value="malicious">Malicious Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>File Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="File Type"
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="exe">Executables</MenuItem>
                  <MenuItem value="dll">DLLs</MenuItem>
                  <MenuItem value="script">Scripts</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Button variant="outlined" onClick={clearFilters} fullWidth>
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Grid container spacing={3}>
          {/* Scan Results Table */}
          <Grid size={{ xs: 12, md: selectedFile ? 6 : 12 }}>
            <DashboardCard title={`Scan Results (${scanResults.length} files)`}>
              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ m: 2 }}>
                  {error}
                </Alert>
              ) : (
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>File Name</TableCell>
                        <TableCell>Risk Level</TableCell>
                        <TableCell>Score</TableCell>
                        <TableCell>Scan Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {scanResults.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            No scan results found
                          </TableCell>
                        </TableRow>
                      ) : (
                        scanResults.map((result) => (
                          <TableRow
                            key={result.id}
                            onClick={() => handleFileClick(result)}
                            sx={{
                              cursor: "pointer",
                              "&:hover": { backgroundColor: "#f5f5f5" },
                              backgroundColor:
                                selectedFile?.id === result.id
                                  ? "#e3f2fd"
                                  : "inherit",
                            }}
                          >
                            <TableCell>{result.file_name}</TableCell>
                            <TableCell>
                              <Chip
                                label={getRiskLabel(result.malware_score || 0)}
                                color={getRiskColor(result.malware_score || 0)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{result.malware_score || 0}</TableCell>
                            <TableCell>
                              {new Date(result.scanned_at).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </DashboardCard>
          </Grid>

          {/* File Details Panel */}
          {selectedFile && (
            <Grid size={{ xs: 12, md: 6 }}>
              <DashboardCard title={`File Analysis: ${selectedFile.file_name}`}>
                {detailsLoading ? (
                  <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                  </Box>
                ) : fileDetails ? (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      📁 Full Path
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ mb: 2, fontFamily: "monospace" }}
                    >
                      {fileDetails.file_path || selectedFile.file_path}
                    </Typography>

                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      📏 File Details
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        Size: {fileDetails.file_size || selectedFile.file_size}{" "}
                        bytes
                      </Typography>
                      <Typography variant="body2">
                        Type: {fileDetails.file_type || "Unknown"}
                      </Typography>
                      <Typography variant="body2">
                        Signed: {fileDetails.is_signed ? "Yes" : "No"}
                      </Typography>
                      <Typography variant="body2">
                        Entropy:{" "}
                        {fileDetails.entropy?.toFixed(2) ||
                          selectedFile.entropy?.toFixed(2) ||
                          "N/A"}
                      </Typography>
                    </Box>

                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      🔐 Cryptographic Hashes
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: "monospace", fontSize: "0.8em" }}
                      >
                        SHA256: {fileDetails.sha256 || selectedFile.sha256}
                      </Typography>
                      {fileDetails.md5 && (
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "monospace", fontSize: "0.8em" }}
                        >
                          MD5: {fileDetails.md5}
                        </Typography>
                      )}
                    </Box>

                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      🚨 Security Analysis
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        Risk Score:{" "}
                        {fileDetails.malware_score ||
                          selectedFile.malware_score ||
                          0}
                        /100
                      </Typography>
                      <Typography variant="body2">
                        YARA Matches: {fileDetails.yara_matches?.length || 0}
                      </Typography>
                      {fileDetails.yara_matches &&
                        fileDetails.yara_matches.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            {fileDetails.yara_matches.map((match, index) => (
                              <Chip
                                key={index}
                                label={match.rule_name}
                                size="small"
                                color="error"
                                sx={{ mr: 1, mb: 1 }}
                              />
                            ))}
                          </Box>
                        )}
                    </Box>

                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      🕒 Scan Information
                    </Typography>
                    <Typography variant="body2">
                      Scanned:{" "}
                      {new Date(
                        fileDetails.scanned_at || selectedFile.scanned_at,
                      ).toLocaleString()}
                    </Typography>
                  </Box>
                ) : (
                  <Alert severity="info">
                    Click on a file in the table to view detailed analysis
                  </Alert>
                )}
              </DashboardCard>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      <Toast toast={toast} onClose={closeToast} />
    </Dialog>
  );
};

export default ScanResultsDialog;
