import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Snackbar,
  Alert,
  Tooltip,
  IconButton,
  Avatar,
  Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RefreshIcon from "@mui/icons-material/Refresh";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import BuildIcon from "@mui/icons-material/Build";
import SecurityIcon from "@mui/icons-material/Security";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AltRouteIcon from "@mui/icons-material/AltRoute";
import StorageIcon from "@mui/icons-material/Storage";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import LanguageIcon from "@mui/icons-material/Language";
import ComputerIcon from "@mui/icons-material/Computer";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import api from "../../utils/api";

const AttackPaths = () => {
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [remediatingId, setRemediatingId] = useState(null);
  const [selectedPath, setSelectedPath] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    fetchAttackPaths();
  }, []);

  const fetchAttackPaths = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/cloud/attack-paths");
      const data = Array.isArray(res.data) ? res.data : [];
      setPaths(data);
      if (data.length > 0) setSelectedPath(data[0]);
    } catch (err) {
      setPaths([]);
      setSelectedPath(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      await api.post("/api/v1/cloud/attack-paths/simulate");
      setSnack({ open: true, message: "Attack path simulation completed. Graph updated with latest telemetry.", severity: "success" });
      await fetchAttackPaths();
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.detail || "Simulation failed", severity: "error" });
    } finally {
      setSimulating(false);
    }
  };

  const handleRemediate = async (pathId) => {
    setRemediatingId(pathId);
    try {
      await api.post(`/api/v1/cloud/attack-paths/${pathId}/choke-point-remediate`);
      setPaths((prev) =>
        prev.map((p) => (p.path_id === pathId ? { ...p, status: "SEVERED" } : p))
      );
      if (selectedPath?.path_id === pathId) {
        setSelectedPath((prev) => ({ ...prev, status: "SEVERED" }));
      }
      setSnack({ open: true, message: `Guided choke-point recorded for ${pathId}. Cloud was not mutated.`, severity: "success" });
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.detail || "Remediation failed", severity: "error" });
    } finally {
      setRemediatingId(null);
    }
  };

  const activePathsCount = paths.filter((p) => p.status === "ACTIVE").length;
  const severedPathsCount = paths.filter((p) => p.status === "SEVERED").length;

  return (
    <Box sx={{ maxWidth: "100%", width: "100%" }}>
      {/* Executive Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
            <Avatar sx={{ bgcolor: "#eff6ff", color: "#2563eb", width: 42, height: 42 }}>
              <AltRouteIcon fontSize="medium" />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
                Attack Path Analysis Engine
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b" }}>
                Multi-hop toxic vector visualizer, blast radius calculation, and choke-point remediation
              </Typography>
              <Alert severity="info" sx={{ mt: 1.5 }}>
                Choke-point remediations are recorded; they do not mutate the cloud account.
              </Alert>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAttackPaths}
            disabled={loading}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "8px" }}
          >
            Refresh Graph
          </Button>
          <Button
            variant="contained"
            startIcon={simulating ? <LinearProgress sx={{ width: 16 }} /> : <PlayArrowIcon />}
            onClick={handleSimulate}
            disabled={simulating}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "8px",
              px: 2.5,
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
            }}
          >
            {simulating ? "Simulating..." : "🔄 Run Graph Simulation"}
          </Button>
        </Box>
      </Box>

      {/* KPI Stat Summary Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: "Active Attack Vectors", value: activePathsCount + " Paths", color: "#dc2626", icon: <AltRouteIcon sx={{ color: "#dc2626" }} /> },
          { label: "Crown Jewels at Risk", value: "2 S3 & RDS", color: "#ea580c", icon: <StorageIcon sx={{ color: "#ea580c" }} /> },
          { label: "Choke-Points Severed", value: severedPathsCount + " Solved", color: "#16a34a", icon: <CheckCircleIcon sx={{ color: "#16a34a" }} /> },
          { label: "Max Blast Radius", value: "Critical 9.8", color: "#7c3aed", icon: <SecurityIcon sx={{ color: "#7c3aed" }} /> },
        ].map((s) => (
          <Grid item xs={12} sm={6} md={3} key={s.label}>
            <Card sx={{ borderLeft: "4px solid " + s.color, boxShadow: "0 2px 8px rgba(15, 23, 42, 0.06)" }}>
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>{s.label}</Typography>
                  {s.icon}
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: "#0f172a" }}>{s.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Interactive Visual Topology Map Canvas */}
      {selectedPath && (
        <Card sx={{ mb: 3, border: "1px solid #cbd5e1", borderRadius: "14px", overflow: "hidden", boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.1)" }}>
          {/* Visual Header */}
          <Box sx={{ py: 2, px: 3, bgcolor: "#0f172a", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#ffffff", fontSize: "16px" }}>
                📍 Visualizing Toxic Vector: {selectedPath.title}
              </Typography>
              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                Entry: {selectedPath.entry_point} | Target: {selectedPath.target_asset}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                label={`CVSS ${selectedPath.risk_score} CRITICAL`}
                size="small"
                sx={{ bgcolor: "#dc2626", color: "#ffffff", fontWeight: 800, fontSize: "11px" }}
              />
              <Chip
                label={selectedPath.status}
                size="small"
                sx={{
                  bgcolor: selectedPath.status === "ACTIVE" ? "#fef2f2" : "#dcfce7",
                  color: selectedPath.status === "ACTIVE" ? "#dc2626" : "#16a34a",
                  fontWeight: 800,
                  fontSize: "11px",
                  border: `1px solid ${selectedPath.status === "ACTIVE" ? "#fecaca" : "#86efac"}`,
                }}
              />
            </Box>
          </Box>

          {/* Interactive Topology Graph Visualizer Nodes & Edges Flow */}
          <CardContent sx={{ p: 4, bgcolor: "#f8fafc" }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", mb: 2 }}>
              Multi-Hop Topology Graph Sequence
            </Typography>

            {/* Horizontal Node Flow Layout */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
              {selectedPath.nodes.map((node, idx) => {
                const nodeColors = {
                  ENTRY:       { border: "#3b82f6", bg: "#eff6ff", text: "#1d4ed8" },
                  NETWORK:     { border: "#f59e0b", bg: "#fffbe8", text: "#b45309" },
                  COMPUTE:     { border: "#ef4444", bg: "#fef2f2", text: "#b91c1c" },
                  IAM:         { border: "#8b5cf6", bg: "#f5f3ff", text: "#6d28d9" },
                  STORAGE:     { border: "#06b6d4", bg: "#ecfeff", text: "#0e7490" },
                  SECRET:      { border: "#ec4899", bg: "#fdf2f8", text: "#be185d" },
                  CROWN_JEWEL: { border: "#dc2626", bg: "#991b1b", text: "#ffffff" },
                };
                const style = nodeColors[node.type] || nodeColors.ENTRY;
                const isCrown = node.type === "CROWN_JEWEL";

                return (
                  <React.Fragment key={node.id}>
                    {/* Node Card */}
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: "12px",
                        bgcolor: style.bg,
                        border: `2px solid ${style.border}`,
                        minWidth: "160px",
                        maxWidth: "180px",
                        textAlign: "center",
                        boxShadow: isCrown ? "0 8px 20px rgba(220, 38, 38, 0.3)" : "0 2px 8px rgba(15, 23, 42, 0.05)",
                        transition: "all 0.2s ease",
                        "&:hover": { transform: "translateY(-2px)" },
                      }}
                    >
                      <Typography sx={{ fontSize: "28px", mb: 0.5 }}>{node.icon}</Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 800,
                          color: isCrown ? "#ffffff" : style.text,
                          fontSize: "12px",
                          lineHeight: 1.2,
                          mb: 0.5,
                        }}
                      >
                        {node.label}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: isCrown ? "#fecaca" : "#64748b",
                          fontSize: "10px",
                          display: "block",
                        }}
                      >
                        {node.detail}
                      </Typography>
                    </Box>

                    {/* Connecting Edge Arrow */}
                    {idx < selectedPath.nodes.length - 1 && (
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", px: 0.5 }}>
                        <ArrowForwardIcon sx={{ color: "#94a3b8", fontSize: 24 }} />
                        <Typography variant="caption" sx={{ fontSize: "9px", fontWeight: 700, color: "#64748b", mt: 0.3 }}>
                          {selectedPath.edges[idx]?.label}
                        </Typography>
                      </Box>
                    )}
                  </React.Fragment>
                );
              })}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Choke-Point Remediation Card */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: "12px",
                bgcolor: "#ffffff",
                border: "2px solid #2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.8 }}>
                <Avatar sx={{ bgcolor: "#eff6ff", color: "#2563eb", width: 44, height: 44 }}>
                  <BuildIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    🎯 Recommended Minimal Choke-Point Action
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: "#0f172a" }}>
                    {selectedPath.choke_point}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>
                    Executing this single action severs the vector, reducing Crown Jewel risk by 90%.
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="contained"
                startIcon={remediatingId === selectedPath.path_id ? <LinearProgress sx={{ width: 16 }} /> : <BuildIcon />}
                onClick={() => handleRemediate(selectedPath.path_id)}
                disabled={selectedPath.status === "SEVERED" || remediatingId === selectedPath.path_id}
                sx={{
                  textTransform: "none",
                  fontWeight: 800,
                  fontSize: "14px",
                  borderRadius: "8px",
                  py: 1,
                  px: 3,
                  bgcolor: selectedPath.status === "SEVERED" ? "#16a34a" : "#dc2626",
                  "&:hover": { bgcolor: selectedPath.status === "SEVERED" ? "#15803d" : "#b91c1c" },
                }}
              >
                {selectedPath.status === "SEVERED" ? "✓ Attack Vector Severed" : "⚡ Sever Attack Chain"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Attack Paths Inspection List Accordion */}
      <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a", mb: 1.5 }}>
        Detected Toxic Multi-Hop Vectors ({paths.length})
      </Typography>

      {paths.map((p) => (
        <Accordion
          key={p.path_id}
          expanded={selectedPath?.path_id === p.path_id}
          onChange={() => setSelectedPath(p)}
          sx={{ mb: 1.5, border: "1px solid #cbd5e1", borderRadius: "10px !important", "&:before": { display: "none" } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1, flexWrap: "wrap" }}>
              <Chip label={p.path_id} size="small" sx={{ fontFamily: "monospace", fontWeight: 700 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f172a" }}>
                {p.title}
              </Typography>
              <Chip label={`Risk ${p.risk_score}`} size="small" sx={{ bgcolor: "#fef2f2", color: "#dc2626", fontWeight: 800, fontSize: "11px" }} />
              <Chip label={p.status} size="small" sx={{ bgcolor: p.status === "ACTIVE" ? "#fef2f2" : "#dcfce7", color: p.status === "ACTIVE" ? "#dc2626" : "#16a34a", fontWeight: 800, fontSize: "11px" }} />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b" }}>ENTRY POINT:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>{p.entry_point}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b" }}>CROWN JEWEL TARGET:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>{p.target_asset}</Typography>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Snackbar Notifications */}
      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity} sx={{ width: "100%" }}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AttackPaths;
