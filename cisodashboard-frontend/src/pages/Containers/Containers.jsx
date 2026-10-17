import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Tooltip,
  TablePagination,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import StorageIcon from "@mui/icons-material/Storage";
import WarningIcon from "@mui/icons-material/Warning";
import ShieldIcon from "@mui/icons-material/Shield";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import ViewInArIcon from "@mui/icons-material/ViewInAr";
import InventoryIcon from "@mui/icons-material/Inventory";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import api from "../../utils/api";

const DEFAULT_IMAGES = [];

const MOCK_SBOM_TREE = [];

const Containers = () => {
  const [images, setImages] = useState([]);
  const [vulns, setVulns] = useState([]);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState("images");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [registryFilter, setRegistryFilter] = useState("ALL");
  const [severityFilter, setSeverityFilter] = useState("ALL");

  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Selected Image for CycloneDX SBOM Tree Inspection Modal
  const [selectedImage, setSelectedImage] = useState(null);
  const [sbomPackages, setSbomPackages] = useState(MOCK_SBOM_TREE);

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchContainerImages();
  }, []);

  const fetchContainerImages = async () => {
    setLoading(true);
    try {
      const [response, vulnRes, statsRes] = await Promise.all([
        api.get("/api/v1/containers/images"),
        api.get("/api/v1/containers/vulnerabilities").catch(() => ({ data: [] })),
        api.get("/api/v1/containers/stats").catch(() => ({ data: null })),
      ]);
      setVulns(Array.isArray(vulnRes.data) ? vulnRes.data : []);
      setStats(statsRes.data || null);
      if (response.data && Array.isArray(response.data)) {
        const normalized = response.data.map((item, idx) => ({
          ...item,
          image_name: item.image_name || item.name || "container-image",
          tag: item.tag || "latest",
          repository: item.repository || item.image_name || "library",
          registry: item.registry || "docker.io",
          image_id: item.image_id || item.id || `img-${idx}`,
          critical_cve_count: item.critical_cve_count ?? item.critical_vulnerabilities_count ?? 0,
          high_cve_count: item.high_cve_count ?? item.high_vulnerabilities_count ?? 0,
        }));
        setImages(normalized);
      } else {
        setImages([]);
      }
    } catch (err) {
      console.warn("Could not fetch container images:", err);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectSBOM = async (image) => {
    setSelectedImage(image);
    try {
      const imgId = image.image_id || image.id;
      const response = await api.get(`/api/v1/containers/sbom/${imgId}`);
      if (response.data && response.data.packages && Array.isArray(response.data.packages)) {
        setSbomPackages(response.data.packages);
      } else {
        setSbomPackages(MOCK_SBOM_TREE);
      }
    } catch (err) {
      setSbomPackages(MOCK_SBOM_TREE);
    }
    setOpenSbomDialog(true);
  };

  const handleExportSBOMJson = (image) => {
    const imgName = (image.image_name || "image").replace("/", "-");
    const jsonString = JSON.stringify(sbomPackages, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cyclonedx-sbom-${imgName}-${image.tag || "latest"}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setNotification({
      open: true,
      message: `Downloaded CycloneDX 1.4 SBOM JSON artifact for ${image.image_name}:${image.tag}`,
      severity: "success",
    });
  };

  // Filter Logic
  const filteredImages = images.filter((item) => {
    const nameStr = (item.image_name || item.name || "").toLowerCase();
    const tagStr = (item.tag || "").toLowerCase();
    const repoStr = (item.repository || "").toLowerCase();
    const regStr = (item.registry || "").toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch =
      nameStr.includes(query) || tagStr.includes(query) || repoStr.includes(query);

    const matchesRegistry =
      registryFilter === "ALL" || regStr.toUpperCase() === registryFilter.toUpperCase();

    let matchesSeverity = true;
    if (severityFilter === "CRITICAL") matchesSeverity = (item.critical_cve_count || 0) > 0;
    if (severityFilter === "HIGH") matchesSeverity = (item.high_cve_count || 0) > 0;

    return matchesSearch && matchesRegistry && matchesSeverity;
  });

  const getSeverityChip = (count, label, bg, color = "#fff") => {
    if (count === 0) return null;
    return (
      <Chip
        label={`${count} ${label}`}
        size="small"
        sx={{
          bgcolor: bg,
          color: color,
          fontWeight: 800,
          borderRadius: "4px",
          fontSize: "10px",
          mr: 0.5,
        }}
      />
    );
  };

  // Aggregated Counters
  const totalImages = stats?.images ?? images.length;
  const criticalCveImagesCount = stats?.critical ?? images.filter((i) => i.critical_cve_count > 0).length;
  const totalSbomPackages = sbomPackages.length * images.length;
  const activeRegistriesCount = new Set(images.map((i) => i.registry)).size;

  return (
    <Box sx={{ maxWidth: "100%", width: "100%" }}>
      {/* Top Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#1e293b" }}>
            Container Security & SBOM Generator
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5 }}>
            Multi-Registry Container Image Vulnerabilities (ECR/ACR/GCR) & Software Bill of Materials Package Tree
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchContainerImages}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<CloudDownloadIcon />}
            onClick={async () => {
              try {
                await api.post("/api/v1/containers/scan");
                setNotification({ open: true, message: "Container registry scan completed", severity: "success" });
              } catch (err) {
                setNotification({
                  open: true,
                  message: err.response?.data?.detail || "Registry scan failed",
                  severity: "error",
                });
              }
              fetchContainerImages();
            }}
            sx={{ textTransform: "none", fontWeight: 700, bgcolor: "#3f51b5" }}
          >
            Scan Registries
          </Button>
        </Box>
      </Box>

      {/* Summary Stat Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #2563eb" }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Scanned Container Images
                </Typography>
                <ViewInArIcon sx={{ color: "#2563eb" }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#0f172a" }}>
                {totalImages} Images
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #d32f2f" }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Images with Critical CVEs
                </Typography>
                <Badge badgeContent={criticalCveImagesCount} color="error">
                  <WarningIcon sx={{ color: "#d32f2f" }} />
                </Badge>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#d32f2f" }}>
                {criticalCveImagesCount} Images
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #16a34a" }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  Active Scanned Registries
                </Typography>
                <CheckCircleIcon sx={{ color: "#16a34a" }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#0f172a" }}>
                {activeRegistriesCount} {activeRegistriesCount === 1 ? "Registry" : "Registries"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderLeft: "4px solid #7c3aed" }}>
            <CardContent sx={{ py: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 600 }}>
                  CycloneDX 1.4 SBOM Packages
                </Typography>
                <InventoryIcon sx={{ color: "#7c3aed" }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: "#0f172a" }}>
                {totalSbomPackages} Tracked
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
        <Tab value="images" label="Images" />
        <Tab value="vulnerabilities" label={`Vulnerabilities (${vulns.length})`} />
      </Tabs>

      {tab === "vulnerabilities" && (
        <TableContainer component={Paper} sx={{ mb: 3, borderRadius: "8px" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Image</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Count</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vulns.length === 0 ? (
                <TableRow><TableCell colSpan={5}>No container vulnerabilities. Scan registries after connecting a cloud account.</TableCell></TableRow>
              ) : vulns.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.repository}:{item.tag}</TableCell>
                  <TableCell>{item.severity}</TableCell>
                  <TableCell>{item.count}</TableCell>
                  <TableCell>{item.status}</TableCell>
                  <TableCell align="right">
                    {item.status === "OPEN" && (
                      <Button size="small" onClick={async () => {
                        await api.patch(`/api/v1/containers/vulnerabilities/${encodeURIComponent(item.id)}/status?status=SUPPRESSED`);
                        setVulns((prev) => prev.map((row) => row.id === item.id ? { ...row, status: "SUPPRESSED" } : row));
                      }}>Suppress</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tab === "images" && (
      <>
      {/* Filter Toolbar */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search image name, tag, or repository..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: "#94a3b8", mr: 1 }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={3} md={4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Container Registry</InputLabel>
              <Select value={registryFilter} label="Container Registry" onChange={(e) => setRegistryFilter(e.target.value)}>
                <MenuItem value="ALL">All Registries</MenuItem>
                <MenuItem value="ECR">AWS ECR</MenuItem>
                <MenuItem value="GCR">GCP GCR</MenuItem>
                <MenuItem value="ACR">Azure ACR</MenuItem>
                <MenuItem value="DOCKER_HUB">Docker Hub</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3} md={4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Vulnerability Filter</InputLabel>
              <Select value={severityFilter} label="Vulnerability Filter" onChange={(e) => setSeverityFilter(e.target.value)}>
                <MenuItem value="ALL">All Images</MenuItem>
                <MenuItem value="CRITICAL">Contains Critical CVEs (#d32f2f)</MenuItem>
                <MenuItem value="HIGH">Contains High CVEs (#f57c00)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {/* Main Table */}
      <TableContainer component={Paper} sx={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}>
        {loading && <LinearProgress />}
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: "#f8fafc" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Image Name & Tag</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>Registry & Provider</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>OS / Architecture & Size</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>CVE Vulnerability Breakdown</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#334155" }}>CycloneDX SBOM Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: "#334155" }}>Inspect SBOM</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredImages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: "#64748b" }}>
                  No container images found.
                </TableCell>
              </TableRow>
            ) : (
              filteredImages.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                <TableRow key={row.image_id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                      {row.image_name}:{row.tag}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b", fontFamily: "monospace", display: "block" }}>
                      {row.digest}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip label={row.registry} size="small" variant="outlined" sx={{ fontWeight: 700, mr: 1 }} />
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      {row.repository}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" sx={{ color: "#334155" }}>
                      {row.size_mb} MB
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      {row.os_architecture}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      {getSeverityChip(row.critical_cve_count, "CRIT", "#d32f2f")}
                      {getSeverityChip(row.high_cve_count, "HIGH", "#f57c00")}
                      {getSeverityChip(row.medium_cve_count, "MED", "#ed6c02")}
                      {getSeverityChip(row.low_cve_count, "LOW", "#0288d1")}
                      {row.critical_cve_count === 0 && row.high_cve_count === 0 && row.medium_cve_count === 0 && (
                        <Chip label="CLEAN" size="small" sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontWeight: 700 }} />
                      )}
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Chip
                      icon={<InventoryIcon style={{ fontSize: 14 }} />}
                      label="CycloneDX-1.4"
                      size="small"
                      sx={{ bgcolor: "#ede9fe", color: "#6d28d9", fontWeight: 700, fontSize: "11px" }}
                    />
                  </TableCell>

                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AccountTreeIcon />}
                      onClick={() => handleInspectSBOM(row)}
                      sx={{ textTransform: "none", fontWeight: 600 }}
                    >
                      View SBOM Tree
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredImages.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>
      </>
      )}

      {/* CycloneDX SBOM Package Tree Inspection Modal */}
      {selectedImage && (
        <Dialog open={Boolean(selectedImage)} onClose={() => setSelectedImage(null)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 700, color: "#0f172a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AccountTreeIcon sx={{ color: "#6d28d9" }} /> CycloneDX 1.4 SBOM Package Tree: {selectedImage.image_name}:{selectedImage.tag}
            </Box>
            <Button
              size="small"
              variant="contained"
              startIcon={<CloudDownloadIcon />}
              onClick={() => handleDownloadSBOM(selectedImage)}
              sx={{ textTransform: "none", bgcolor: "#6d28d9" }}
            >
              Export SBOM JSON
            </Button>
          </DialogTitle>
          <DialogContent dividers>
            <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0" }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Package Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Version</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>License</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Associated CVE</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Vulnerability Severity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sbomPackages.map((pkg, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontWeight: 600, color: "#0f172a" }}>{pkg.name}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace" }}>{pkg.version}</TableCell>
                      <TableCell>
                        <Chip label={pkg.license} size="small" variant="outlined" sx={{ fontSize: "10px" }} />
                      </TableCell>
                      <TableCell sx={{ fontFamily: "monospace", color: pkg.cve_id ? "#dc2626" : "#64748b" }}>
                        {pkg.cve_id || "None"}
                      </TableCell>
                      <TableCell align="right">
                        {pkg.severity === "CRITICAL" ? (
                          <Chip label="CRITICAL" size="small" sx={{ bgcolor: "#d32f2f", color: "#fff", fontWeight: 700 }} />
                        ) : pkg.severity === "HIGH" ? (
                          <Chip label="HIGH" size="small" sx={{ bgcolor: "#f57c00", color: "#fff", fontWeight: 700 }} />
                        ) : (
                          <Chip label="CLEAN" size="small" sx={{ bgcolor: "#e8f5e9", color: "#2e7d32", fontWeight: 600 }} />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setSelectedImage(null)} variant="outlined" sx={{ textTransform: "none" }}>
              Close SBOM Inspection
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert severity={notification.severity} sx={{ width: "100%" }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Containers;
