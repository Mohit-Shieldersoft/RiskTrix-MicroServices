import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Button, Card, CardContent, Grid, Chip,
  CircularProgress, Alert, Checkbox, Divider, LinearProgress,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Paper, Stepper, Step, StepLabel, TextField, InputAdornment,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SendIcon from "@mui/icons-material/Send";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import SearchIcon from "@mui/icons-material/Search";
import PolicyIcon from "@mui/icons-material/Policy";
import DevicesIcon from "@mui/icons-material/Devices";
import policyApi from "../../utils/policyApi";

const STEPS = ["Select Policies", "Select Devices", "Review & Deploy"];

const getPlatformColor = (p) => {
  switch (p) {
    case "windows": return "primary";
    case "android": return "success";
    case "ios": return "warning";
    case "macos": return "default";
    default: return "default";
  }
};

export default function BulkAssign() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const [policies, setPolicies] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [selectedPolicies, setSelectedPolicies] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);

  const [policySearch, setPolicySearch] = useState("");
  const [deviceSearch, setDeviceSearch] = useState("");

  const [deploying, setDeploying] = useState(false);
  const [result, setResult] = useState(null);
  const [deployError, setDeployError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    setFetchError(null);
    try {
      const [pol, dev] = await Promise.all([
        policyApi.getPolicies(),
        policyApi.getDevices(),
      ]);
      setPolicies(pol || []);
      setDevices(dev || []);
    } catch {
      setFetchError("Failed to load policies or devices");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const togglePolicy = (id) =>
    setSelectedPolicies((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleDevice = (id) =>
    setSelectedDevices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleAllPolicies = (filtered) => {
    const allSelected = filtered.every((p) => selectedPolicies.includes(p.id));
    if (allSelected) {
      setSelectedPolicies((prev) => prev.filter((id) => !filtered.map((p) => p.id).includes(id)));
    } else {
      setSelectedPolicies((prev) => [...new Set([...prev, ...filtered.map((p) => p.id)])]);
    }
  };

  const toggleAllDevices = (filtered) => {
    const allSelected = filtered.every((d) => selectedDevices.includes(d.id));
    if (allSelected) {
      setSelectedDevices((prev) => prev.filter((id) => !filtered.map((d) => d.id).includes(id)));
    } else {
      setSelectedDevices((prev) => [...new Set([...prev, ...filtered.map((d) => d.id)])]);
    }
  };

  const handleDeploy = async () => {
    setDeploying(true);
    setDeployError(null);
    try {
      const res = await policyApi.bulkAssign(selectedPolicies, selectedDevices);
      setResult(res);
      setStep(3); // success screen
    } catch {
      setDeployError("Deployment failed. Please try again.");
    } finally {
      setDeploying(false);
    }
  };

  const filteredPolicies = policies.filter((p) =>
    p.name?.toLowerCase().includes(policySearch.toLowerCase()) ||
    p.category?.toLowerCase().includes(policySearch.toLowerCase())
  );

  const filteredDevices = devices.filter((d) =>
    d.name?.toLowerCase().includes(deviceSearch.toLowerCase()) ||
    d.platform?.toLowerCase().includes(deviceSearch.toLowerCase()) ||
    d.owner?.toLowerCase().includes(deviceSearch.toLowerCase())
  );

  if (loadingData) return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>
  );

  if (fetchError) return (
    <Box sx={{ textAlign: "center", mt: 10 }}>
      <Alert severity="error" sx={{ mb: 2 }}>{fetchError}</Alert>
      <Button variant="outlined" onClick={fetchData}>Retry</Button>
    </Box>
  );

  // ── SUCCESS SCREEN ──────────────────────────────────────────────
  if (step === 3 && result) {
    const successPct = result.total_assignments
      ? Math.round((result.deployment_success / result.total_assignments) * 100) : 0;
    return (
      <Box sx={{ p: 3, maxWidth: 700, mx: "auto", textAlign: "center" }}>
        <CheckCircleIcon sx={{ fontSize: 72, color: "success.main", mb: 2 }} />
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
          Bulk Deployment Complete
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          {selectedPolicies.length} polic{selectedPolicies.length !== 1 ? "ies" : "y"} assigned to{" "}
          {selectedDevices.length} device{selectedDevices.length !== 1 ? "s" : ""}
        </Typography>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[
            { label: "Total Assignments", value: result.total_assignments, color: "primary.main" },
            { label: "Successful", value: result.deployment_success, color: "success.main" },
            { label: "Failed", value: result.deployment_failed, color: "error.main" },
            { label: "Skipped (existing)", value: result.skipped, color: "text.secondary" },
          ].map((s, i) => (
            <Grid size={{ xs: 6, md: 3 }} key={i}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent sx={{ textAlign: "center", py: 2, "&:last-child": { pb: 2 } }}>
                  <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: s.color }}>{s.value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography variant="body2">Deployment Success Rate</Typography>
            <Typography variant="body2" fontWeight="bold" color="success.main">{successPct}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={successPct}
            color={successPct >= 80 ? "success" : successPct >= 50 ? "warning" : "error"}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>

        {result.assignments && result.assignments.length > 0 && (
          <TableContainer component={Paper} elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 3, maxHeight: 280, overflow: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.50" }}>
                  <TableCell sx={{ fontWeight: "bold" }}>Policy ID</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Device ID</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Deployment</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Compliance</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.assignments.map((a, i) => (
                  <TableRow key={i} sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell>#{a.policy_id}</TableCell>
                    <TableCell>#{a.device_id}</TableCell>
                    <TableCell>
                      <Chip
                        label={a.deployment_status}
                        color={a.deployment_status === "success" ? "success" : "error"}
                        size="small"
                        icon={a.deployment_status === "success" ? <CheckCircleIcon /> : <ErrorIcon />}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={a.compliance_status}
                        color={a.compliance_status === "compliant" ? "success" : a.compliance_status === "warning" ? "warning" : "error"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{a.compliance_score ?? "—"}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
          <Button variant="outlined" onClick={() => { setStep(0); setResult(null); setSelectedPolicies([]); setSelectedDevices([]); }}>
            New Bulk Assignment
          </Button>
          <Button variant="contained" onClick={() => navigate("/policies/assignments")}>
            View Assignments
          </Button>
        </Box>
      </Box>
    );
  }

  // ── WIZARD ─────────────────────────────────────────────────────
  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
      {/* HEADER */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/policies")}>Back</Button>
        <Box>
          <Typography variant="h4" fontWeight="bold">Bulk Policy Assignment</Typography>
          <Typography variant="body2" color="text.secondary">
            Assign multiple policies to multiple devices in one operation
          </Typography>
        </Box>
      </Box>

      {/* STEPPER */}
      <Stepper activeStep={step} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>

      {/* ── STEP 0: SELECT POLICIES ── */}
      {step === 0 && (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              <PolicyIcon sx={{ mr: 0.5, verticalAlign: "middle" }} />
              Select Policies ({selectedPolicies.length} selected)
            </Typography>
            <TextField
              size="small"
              placeholder="Search policies..."
              value={policySearch}
              onChange={(e) => setPolicySearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            />
          </Box>

          <Card sx={{ borderRadius: 2, mb: 3 }}>
            <Box sx={{ px: 2, py: 1, bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider" }}>
              <Checkbox
                indeterminate={
                  selectedPolicies.length > 0 &&
                  filteredPolicies.some((p) => !selectedPolicies.includes(p.id))
                }
                checked={filteredPolicies.length > 0 && filteredPolicies.every((p) => selectedPolicies.includes(p.id))}
                onChange={() => toggleAllPolicies(filteredPolicies)}
              />
              <Typography variant="caption" color="text.secondary">Select All ({filteredPolicies.length})</Typography>
            </Box>
            <Box sx={{ maxHeight: 340, overflow: "auto" }}>
              {filteredPolicies.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography color="text.secondary">No policies found</Typography>
                </Box>
              ) : filteredPolicies.map((p, i) => (
                <Box key={p.id}>
                  <Box
                    sx={{ display: "flex", alignItems: "center", px: 2, py: 1.5, cursor: "pointer",
                      "&:hover": { bgcolor: "action.hover" },
                      bgcolor: selectedPolicies.includes(p.id) ? "primary.50" : "transparent",
                    }}
                    onClick={() => togglePolicy(p.id)}
                  >
                    <Checkbox checked={selectedPolicies.includes(p.id)} sx={{ mr: 1 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={500}>{p.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {p.category} · {p.platform}
                      </Typography>
                    </Box>
                    <Chip label={p.status} size="small"
                      color={p.status === "active" ? "success" : "warning"} />
                  </Box>
                  {i < filteredPolicies.length - 1 && <Divider />}
                </Box>
              ))}
            </Box>
          </Card>

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              disabled={selectedPolicies.length === 0}
              onClick={() => setStep(1)}
            >
              Next: Select Devices ({selectedPolicies.length} selected)
            </Button>
          </Box>
        </Box>
      )}

      {/* ── STEP 1: SELECT DEVICES ── */}
      {step === 1 && (
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              <DevicesIcon sx={{ mr: 0.5, verticalAlign: "middle" }} />
              Select Devices ({selectedDevices.length} selected)
            </Typography>
            <TextField
              size="small"
              placeholder="Search devices..."
              value={deviceSearch}
              onChange={(e) => setDeviceSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            />
          </Box>

          <Card sx={{ borderRadius: 2, mb: 3 }}>
            <Box sx={{ px: 2, py: 1, bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider" }}>
              <Checkbox
                indeterminate={
                  selectedDevices.length > 0 &&
                  filteredDevices.some((d) => !selectedDevices.includes(d.id))
                }
                checked={filteredDevices.length > 0 && filteredDevices.every((d) => selectedDevices.includes(d.id))}
                onChange={() => toggleAllDevices(filteredDevices)}
              />
              <Typography variant="caption" color="text.secondary">Select All ({filteredDevices.length})</Typography>
            </Box>
            <Box sx={{ maxHeight: 340, overflow: "auto" }}>
              {filteredDevices.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography color="text.secondary">No devices found</Typography>
                </Box>
              ) : filteredDevices.map((d, i) => (
                <Box key={d.id}>
                  <Box
                    sx={{ display: "flex", alignItems: "center", px: 2, py: 1.5, cursor: "pointer",
                      "&:hover": { bgcolor: "action.hover" },
                      bgcolor: selectedDevices.includes(d.id) ? "primary.50" : "transparent",
                    }}
                    onClick={() => toggleDevice(d.id)}
                  >
                    <Checkbox checked={selectedDevices.includes(d.id)} sx={{ mr: 1 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={500}>{d.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {d.owner || "no owner"} · {d.os_version || "—"}
                      </Typography>
                    </Box>
                    <Chip label={d.platform} size="small" color={getPlatformColor(d.platform)} />
                  </Box>
                  {i < filteredDevices.length - 1 && <Divider />}
                </Box>
              ))}
            </Box>
          </Card>

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => setStep(0)}>Back</Button>
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              disabled={selectedDevices.length === 0}
              onClick={() => setStep(2)}
            >
              Next: Review ({selectedDevices.length} devices)
            </Button>
          </Box>
        </Box>
      )}

      {/* ── STEP 2: REVIEW ── */}
      {step === 2 && (
        <Box>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>Review & Deploy</Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            You are about to create <strong>{selectedPolicies.length * selectedDevices.length}</strong> assignments
            ({selectedPolicies.length} polic{selectedPolicies.length !== 1 ? "ies" : "y"}{" x "}
            {selectedDevices.length} device{selectedDevices.length !== 1 ? "s" : ""}).
            Deployment runs immediately.
          </Alert>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ borderRadius: 2, height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
                    <PolicyIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: "middle" }} />
                    Selected Policies ({selectedPolicies.length})
                  </Typography>
                  <Box sx={{ maxHeight: 200, overflow: "auto" }}>
                    {policies
                      .filter((p) => selectedPolicies.includes(p.id))
                      .map((p) => (
                        <Box key={p.id} sx={{ display: "flex", justifyContent: "space-between", py: 0.75 }}>
                          <Typography variant="body2">{p.name}</Typography>
                          <Chip label={p.category} size="small" />
                        </Box>
                      ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ borderRadius: 2, height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
                    <DevicesIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: "middle" }} />
                    Selected Devices ({selectedDevices.length})
                  </Typography>
                  <Box sx={{ maxHeight: 200, overflow: "auto" }}>
                    {devices
                      .filter((d) => selectedDevices.includes(d.id))
                      .map((d) => (
                        <Box key={d.id} sx={{ display: "flex", justifyContent: "space-between", py: 0.75 }}>
                          <Typography variant="body2">{d.name}</Typography>
                          <Chip label={d.platform} size="small" color={getPlatformColor(d.platform)} />
                        </Box>
                      ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {deployError && <Alert severity="error" sx={{ mb: 2 }}>{deployError}</Alert>}

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => setStep(1)} disabled={deploying}>
              Back
            </Button>
            <Button
              variant="contained"
              color="primary"
              endIcon={deploying ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
              disabled={deploying}
              onClick={handleDeploy}
            >
              {deploying ? "Deploying..." : `Deploy ${selectedPolicies.length * selectedDevices.length} Assignments`}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
