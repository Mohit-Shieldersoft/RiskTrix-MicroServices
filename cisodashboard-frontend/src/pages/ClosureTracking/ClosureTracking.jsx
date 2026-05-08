import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import UpdateIcon from "@mui/icons-material/Update";
import UploadIcon from "@mui/icons-material/Upload";
import DashboardCard from "../../components/common/DashboardCard";
import VulnerabilityTable from "./components/VulnerabiltyTable";
import AddAppModal from "./components/AddAppModal";
import AddVulnerabilityModal from "./components/AddVulnerabilityModal";
import dashboardTheme from "../../theme/dashboardTheme";
import {
  fetchVulnerabilities,
  fetchVulnerabilityStatistics,
  createVulnerability,
  updateVulnerabilityStatus,
  updateVulnerabilityRemarks,
  uploadPOCFile,
} from "../../utils/closureTrackingApi";
import applicationApi from "../../utils/applicationApi";
import Toast from "../../components/common/Toast";
import { useToast } from "../../components/common/useToast";
import vulnerabilityApi from "../../utils/vulnerabilityApi";
import { getUserProfile } from "../../utils/auth";
import "./ClosureTracking.css";

const ClosureTracking = () => {
  // State variables
  const [searchQuery, setSearchQuery] = useState("");
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [filteredVulnerabilities, setFilteredVulnerabilities] = useState([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    open: 0,
    closed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddAppModalOpen, setIsAddAppModalOpen] = useState(false);
  const [isAddVulnerabilityModalOpen, setIsAddVulnerabilityModalOpen] =
    useState(false);
  const [applicationsRefreshTrigger, setApplicationsRefreshTrigger] =
    useState(0);
  const [newlyAddedIds, setNewlyAddedIds] = useState(new Set());
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [applications, setApplications] = useState([]);
  const [appPage, setAppPage] = useState(1);
  const [appTotalPages, setAppTotalPages] = useState(1);
  const [appLoading, setAppLoading] = useState(false);
  const [newlyAddedAppIds, setNewlyAddedAppIds] = useState(new Set());
  const { toast, showToast, closeToast } = useToast();
  // alias so existing call sites don't need to change
  const setSnackbar = ({ open, message, severity }) => {
    if (open) showToast(message, severity);
    else closeToast();
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const userProfile = getUserProfile();
  const displayName = userProfile?.full_name || userProfile?.email || "User";

  // Fetch vulnerabilities and statistics on mount
  useEffect(() => {
    loadVulnerabilities(1, "");
    loadApplications(1, "");
    loadStatistics();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load vulnerabilities from API
  // pageNum/search are explicit so call sites never hit stale-closure issues
  // silent=true → skips loading spinner (used after uploads so table stays visible)
  const loadVulnerabilities = async (
    pageNum = 1,
    search = "",
    trackNewIds = false,
    silent = false,
  ) => {
    const prevIds = trackNewIds
      ? new Set(vulnerabilities.map((v) => v.id))
      : null;
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      const response = await fetchVulnerabilities({
        page: pageNum,
        size: 5,
        search: search || undefined,
      });

      setPage(pageNum);
      setTotalPages(response.pages || 1);

      // Format dates for display
      const formattedVulns = response.items.map((vuln) => ({
        ...vuln,
        openDate: vuln.open_date
          ? new Date(vuln.open_date).toISOString().split("T")[0]
          : null,
        closureDate: vuln.closure_date
          ? new Date(vuln.closure_date).toISOString().split("T")[0]
          : null,
      }));

      setVulnerabilities(formattedVulns);
      setFilteredVulnerabilities(formattedVulns);

      // Highlight newly added rows
      if (prevIds) {
        const newIds = new Set(
          formattedVulns.filter((v) => !prevIds.has(v.id)).map((v) => v.id),
        );
        if (newIds.size > 0) {
          setNewlyAddedIds(newIds);
          setTimeout(() => setNewlyAddedIds(new Set()), 4000);
        }
      }
    } catch (err) {
      console.error("Error loading vulnerabilities:", err);
      if (!silent)
        setError("Failed to load vulnerabilities. Please try again.");
      setSnackbar({
        open: true,
        message: "Failed to load vulnerabilities",
        severity: "error",
      });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Load statistics from API
  const loadStatistics = async () => {
    try {
      const stats = await fetchVulnerabilityStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error("Error loading statistics:", err);
    }
  };

  // Load applications from API
  const loadApplications = async (
    pageNum = 1,
    search = "",
    trackNew = false,
    silent = false,
  ) => {
    const prevIds = trackNew ? new Set(applications.map((a) => a.id)) : null;
    try {
      if (!silent) setAppLoading(true);
      const response = await applicationApi.listApplications({
        page: pageNum,
        size: 5,
        search: search || undefined,
      });
      setAppPage(pageNum);
      setAppTotalPages(response.pages || 1);
      setApplications(response.items || []);
      if (prevIds) {
        const newIds = new Set(
          (response.items || [])
            .filter((a) => !prevIds.has(a.id))
            .map((a) => a.id),
        );
        if (newIds.size > 0) {
          setNewlyAddedAppIds(newIds);
          setTimeout(() => setNewlyAddedAppIds(new Set()), 4000);
        }
      }
    } catch (err) {
      console.error("Error loading applications:", err);
      showToast("Failed to load applications", "error");
    } finally {
      if (!silent) setAppLoading(false);
    }
  };

  // Handle add vulnerability
  const handleAddVulnerability = async (newVulnerability) => {
    try {
      // Create API payload
      const payload = {
        title: newVulnerability.name,
        description: newVulnerability.description || "",
        severity: newVulnerability.risk,
        application_id: newVulnerability.application_id || null,
        remarks: newVulnerability.remarks || "",
      };

      await createVulnerability(payload);
      setSnackbar({
        open: true,
        message: "Vulnerability created successfully",
        severity: "success",
      });
      setIsAddVulnerabilityModalOpen(false);

      // Reload data with green highlight on new row
      await loadVulnerabilities(page, searchQuery, true, true);
      await loadStatistics();
    } catch (err) {
      console.error("Error creating vulnerability:", err);
      setSnackbar({
        open: true,
        message: "Failed to create vulnerability",
        severity: "error",
      });
    }
  };

  // Handle add application
  const handleAddApp = async (newApp) => {
    try {
      // Create API payload
      const payload = {
        name: newApp.name,
        type: newApp.type,
        description: newApp.description || "",
        owner: newApp.owner || "",
        vendor: newApp.vendor || "",
      };

      // If there are vulnerabilities, add them to the payload
      if (newApp.vulnerabilities && newApp.vulnerabilities.length > 0) {
        payload.vulnerabilities = newApp.vulnerabilities.map((vuln) => ({
          name: vuln.name,
          category: vuln.category || "medium",
          description: vuln.description || "",
        }));
      }

      await applicationApi.createApplication(payload);
      setSnackbar({
        open: true,
        message: "Application created successfully",
        severity: "success",
      });
      setIsAddAppModalOpen(false);

      // Reload vulnerabilities and applications
      await loadVulnerabilities(1, searchQuery);
      await loadApplications(1, searchQuery, true, true);
      await loadStatistics();

      // Trigger refresh of applications in modals
      setApplicationsRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Error creating application:", err);
      const errorMessage =
        err.detail || err.message || "Failed to create application";
      setSnackbar({ open: true, message: errorMessage, severity: "error" });
    }
  };

  // Handle status update
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateVulnerabilityStatus(id, newStatus);
      setSnackbar({
        open: true,
        message: "Status updated successfully",
        severity: "success",
      });

      // Update local state for both vulnerabilities and filteredVulnerabilities
      const updateVuln = (vuln) => {
        if (vuln.id === id) {
          return {
            ...vuln,
            status: newStatus,
            closureDate:
              newStatus === "closed"
                ? new Date().toISOString().split("T")[0]
                : vuln.closureDate,
          };
        }
        return vuln;
      };

      setVulnerabilities((prevVulnerabilities) =>
        prevVulnerabilities.map(updateVuln),
      );
      setFilteredVulnerabilities((prevFiltered) =>
        prevFiltered.map(updateVuln),
      );

      // Reload statistics
      await loadStatistics();
    } catch (err) {
      console.error("Error updating status:", err);
      setSnackbar({
        open: true,
        message: "Failed to update status",
        severity: "error",
      });
    }
  };

  // Handle remarks update
  const handleRemarksUpdate = async (id, remarks) => {
    try {
      await updateVulnerabilityRemarks(id, remarks);
      setSnackbar({
        open: true,
        message: "Remarks updated successfully",
        severity: "success",
      });

      // Update local state for both vulnerabilities and filteredVulnerabilities
      const updateVuln = (vuln) => {
        if (vuln.id === id) {
          return { ...vuln, remarks };
        }
        return vuln;
      };

      setVulnerabilities((prevVulnerabilities) =>
        prevVulnerabilities.map(updateVuln),
      );
      setFilteredVulnerabilities((prevFiltered) =>
        prevFiltered.map(updateVuln),
      );
    } catch (err) {
      console.error("Error updating remarks:", err);
      setSnackbar({
        open: true,
        message: "Failed to update remarks",
        severity: "error",
      });
    }
  };

  // Handle POC upload
  const handleUploadPOC = async (id) => {
    try {
      // Create file input element
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "*/*";

      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            await uploadPOCFile(id, file);
            setSnackbar({
              open: true,
              message: `POC file uploaded: ${file.name}`,
              severity: "success",
            });

            // Reload vulnerabilities to get updated poc_file_path
            await loadVulnerabilities(page, searchQuery);
          } catch (err) {
            console.error("Error uploading POC:", err);
            setSnackbar({
              open: true,
              message: "Failed to upload POC file",
              severity: "error",
            });
          }
        }
      };

      input.click();
    } catch (err) {
      console.error("Error initiating POC upload:", err);
      setSnackbar({
        open: true,
        message: "Failed to initiate upload",
        severity: "error",
      });
    }
  };

  // Handle Update button click
  const handleUpdate = async () => {
    await loadVulnerabilities(page, searchQuery);
    await loadApplications(appPage, searchQuery);
    await loadStatistics();
    setSnackbar({
      open: true,
      message: "Data refreshed successfully",
      severity: "success",
    });
  };

  // Handle bulk upload application
  const handleUploadApplicationExcel = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        setUploading(true);
        const data = await applicationApi.bulkUploadApplications(file);

        // Check the actual results from the upload
        if (data.success > 0) {
          const successCount = data.success;
          const failedCount = data.failed;
          let message = `Upload successful — ${successCount} applications added`;
          let severity = "success";

          if (failedCount > 0) {
            message += `, ${failedCount} failed`;
            severity = "warning";
          }

          setSnackbar({
            open: true,
            message: message,
            severity: severity,
          });
        } else {
          // No applications were successfully uploaded
          setSnackbar({
            open: true,
            message:
              data.failed > 0
                ? `Upload failed — ${data.failed} rows had errors. Check file format.`
                : "No applications were uploaded. Check file format and data.",
            severity: "error",
          });
          // Don't refresh if nothing was uploaded
          setUploading(false);
          return;
        }

        // Only refresh if applications were actually added
        await loadVulnerabilities(1, searchQuery, false, true);
        await loadApplications(1, searchQuery, true, true);
        await loadStatistics();

        // Trigger refresh of applications in modals
        setApplicationsRefreshTrigger((prev) => prev + 1);
      } catch (err) {
        console.error("Bulk upload error:", err);
        const errorMessage = err.detail || err.message || "Bulk upload failed";
        setSnackbar({ open: true, message: errorMessage, severity: "error" });
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  // Handle bulk upload vulnerabilities
  const handleUploadVulnerabilityExcel = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        setUploading(true);
        const data = await vulnerabilityApi.bulkUploadVulnerabilities(file);

        if (data.failed > 0) {
          const successCount = data.success;
          setSnackbar({
            open: true,
            message: `Uploaded ${successCount} vulnerabilities. ${data.failed} row(s) failed.`,
            severity: successCount > 0 ? "warning" : "error",
          });
        } else {
          setSnackbar({
            open: true,
            message: `Upload successful — ${data.success} vulnerabilities added to "${data.application_name}"`,
            severity: "success",
          });
        }

        // Silently reload — new rows appear automatically with green highlight
        await loadVulnerabilities(1, searchQuery, true, true);
        await loadStatistics();
      } catch (err) {
        console.error("Bulk upload error:", err);
        const errorMessage =
          err.detail || err.message || "Vulnerability bulk upload failed";
        setSnackbar({ open: true, message: errorMessage, severity: "error" });
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  // Handle snackbar close (kept for compatibility)
  // eslint-disable-next-line no-unused-vars
  const handleSnackbarClose = () => closeToast();

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        maxWidth: "100%",
        animation: "fadeIn 0.5s ease-out",
      }}
    >
      {/* Loading State */}
      {loading && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
          }}
        >
          <CircularProgress size={60} />
        </Box>
      )}

      {/* Error State */}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Page Header */}
      {!loading && (
        <>
          <Box className="dashboard-header" sx={{ mb: 3 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{ position: "relative" }}
            >
              Vulnerability Closure Tracking
            </Typography>
            <Typography
              variant="subtitle1"
              component="h5"
              sx={{ position: "relative" }}
            >
              {currentDate} • {displayName}
            </Typography>

            <Box sx={{ display: "flex", gap: 2, mt: 3, position: "relative" }}>
              <Chip
                label={`Total: ${statistics.total}`}
                sx={{
                  bgcolor: "rgba(255,255,255,0.15)",
                  color: "white",
                  fontWeight: "bold",
                }}
              />
              <Chip
                label={`Open: ${statistics.open}`}
                sx={{
                  bgcolor: "rgba(255,255,255,0.15)",
                  color: "white",
                  fontWeight: "bold",
                }}
              />
              <Chip
                label={`Closed: ${statistics.closed}`}
                sx={{
                  bgcolor: "rgba(255,255,255,0.15)",
                  color: "white",
                  fontWeight: "bold",
                }}
              />
            </Box>
          </Box>
        </>
      )}

      {/* Actions Bar */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          gap: 2,
          mb: 3,
          p: 2,
          backgroundColor: "white",
          borderRadius: dashboardTheme.borderRadius.lg,
          boxShadow: dashboardTheme.shadows.card,
        }}
      >
        <TextField
          placeholder="Search vulnerabilities..."
          variant="outlined"
          fullWidth
          size="small"
          sx={{ maxWidth: { sm: "400px" } }}
          value={searchQuery}
          onChange={(e) => {
            const val = e.target.value;
            setSearchQuery(val);
            loadVulnerabilities(1, val);
            loadApplications(1, val);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <Box
          sx={{
            display: "flex",
            gap: 2,
            ml: { xs: 0, sm: "auto" },
            flexWrap: "wrap",
            justifyContent: { xs: "flex-start", sm: "flex-end" },
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setIsAddAppModalOpen(true)}
            sx={{
              fontWeight: "bold",
              backgroundImage:
                "linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)",
              boxShadow: "0 4px 6px rgba(50, 50, 93, 0.11)",
              transition: "all 0.2s",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 7px 14px rgba(50, 50, 93, 0.1)",
              },
            }}
          >
            Add App
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={
              uploading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <UploadIcon />
              )
            }
            disabled={uploading}
            onClick={handleUploadApplicationExcel}
            sx={{
              fontWeight: "bold",
              backgroundImage:
                "linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)",
              boxShadow: "0 4px 6px rgba(50, 50, 93, 0.11)",
              transition: "all 0.2s",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 7px 14px rgba(50, 50, 93, 0.1)",
              },
            }}
          >
            Upload Application
          </Button>

          {/* // Handle Excel upload for bulk application */}
          {/* // Moved handleUploadApplicationExcel to component body above the return statement */}

          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={() => setIsAddVulnerabilityModalOpen(true)}
            sx={{
              fontWeight: "bold",
              backgroundImage:
                "linear-gradient(135deg, #f50057 0%, #ff4081 100%)",
              boxShadow: "0 4px 6px rgba(50, 50, 93, 0.11)",
              transition: "all 0.2s",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 7px 14px rgba(50, 50, 93, 0.1)",
              },
            }}
          >
            Add Vulnerability
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={
              uploading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <UploadIcon />
              )
            }
            disabled={uploading}
            onClick={handleUploadVulnerabilityExcel}
            sx={{
              fontWeight: "bold",
              backgroundImage:
                "linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)",
              boxShadow: "0 4px 6px rgba(50, 50, 93, 0.11)",
              transition: "all 0.2s",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 7px 14px rgba(50, 50, 93, 0.1)",
              },
            }}
          >
            Upload Vulnerability
          </Button>

          <Button
            variant="contained"
            startIcon={<UpdateIcon />}
            onClick={handleUpdate}
            sx={{
              fontWeight: "bold",
              backgroundColor: dashboardTheme.colors.info,
              boxShadow: "0 4px 6px rgba(50, 50, 93, 0.11)",
              transition: "all 0.2s",
              "&:hover": {
                backgroundColor: "#1976d2",
                transform: "translateY(-2px)",
                boxShadow: "0 7px 14px rgba(50, 50, 93, 0.1)",
              },
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Applications Table */}
      {!loading && (
        <Box sx={{ mb: 3 }}>
          <DashboardCard sx={{ p: 0, overflow: "hidden" }}>
            <Box
              sx={{
                p: 2,
                borderBottom: "1px solid rgba(0,0,0,0.08)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Applications
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Applications registered in the system
                </Typography>
              </Box>
            </Box>
            {appLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : applications.length === 0 ? (
              <Box
                sx={{
                  p: 4,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Typography color="text.secondary">
                  No applications found. Use &quot;Upload Application&quot; or
                  &quot;Add App&quot; to register applications.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table stickyHeader sx={{ minWidth: 800 }} size="medium">
                  <TableHead
                    sx={{
                      "& .MuiTableCell-root": {
                        backgroundColor: "#f5f5f5",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        zIndex: 1,
                      },
                    }}
                  >
                    <TableRow>
                      {[
                        "ID",
                        "Application Name",
                        "Type",
                        "Owner",
                        "Vendor",
                        "Risk Level",
                        "URL",
                      ].map((h, i) => (
                        <TableCell key={i}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {applications.map((app) => {
                      const isNew = newlyAddedAppIds.has(app.id);
                      return (
                        <TableRow
                          key={app.id}
                          hover
                          sx={{
                            "&:nth-of-type(odd)": {
                              backgroundColor: isNew
                                ? "rgba(76,175,80,0.12)"
                                : "rgba(0,0,0,0.02)",
                            },
                            backgroundColor: isNew
                              ? "rgba(76,175,80,0.12)"
                              : undefined,
                            outline: isNew
                              ? "2px solid rgba(76,175,80,0.5)"
                              : undefined,
                            transition:
                              "background-color 0.5s ease, outline 0.5s ease",
                            "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
                          }}
                        >
                          <TableCell
                            sx={{
                              fontFamily: "monospace",
                              fontWeight: "bold",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {app.id}
                          </TableCell>
                          <TableCell
                            sx={{ fontWeight: 500, whiteSpace: "nowrap" }}
                          >
                            {app.name}
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {app.type
                              ? app.type
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (c) => c.toUpperCase())
                              : "—"}
                          </TableCell>
                          <TableCell>{app.owner || "—"}</TableCell>
                          <TableCell>{app.vendor || "—"}</TableCell>
                          <TableCell>
                            <Chip
                              label={(app.risk_level || "medium").toUpperCase()}
                              size="small"
                              sx={{
                                backgroundColor:
                                  app.risk_level === "critical"
                                    ? "rgba(244,67,54,0.1)"
                                    : app.risk_level === "high"
                                      ? "rgba(255,152,0,0.1)"
                                      : app.risk_level === "low"
                                        ? "rgba(76,175,80,0.1)"
                                        : "rgba(255,193,7,0.1)",
                                color:
                                  app.risk_level === "critical"
                                    ? "#f44336"
                                    : app.risk_level === "high"
                                      ? "#ff9800"
                                      : app.risk_level === "low"
                                        ? "#4caf50"
                                        : "#f59e0b",
                                fontWeight: "bold",
                                borderRadius: "4px",
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {app.url ? (
                              <a
                                href={app.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "#3f51b5" }}
                              >
                                {app.url}
                              </a>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DashboardCard>
          {/* Pagination lives outside the card so it is never clipped */}
          {appTotalPages > 1 && !appLoading && applications.length > 0 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: 1.5,
                mt: "1px",
                backgroundColor: "white",
                borderTop: "1px solid rgba(0,0,0,0.08)",
                borderRadius: "0 0 12px 12px",
                boxShadow: dashboardTheme.shadows.card,
              }}
            >
              <Pagination
                count={appTotalPages}
                page={appPage}
                onChange={(_, p) => loadApplications(p, searchQuery)}
                color="primary"
                shape="rounded"
                size="medium"
              />
            </Box>
          )}
        </Box>
      )}

      {/* Vulnerabilities Table */}
      {!loading && (
        <DashboardCard
          sx={{
            p: 0,
            overflow: "hidden",
            height: "auto",
          }}
        >
          <Box
            sx={{
              p: 2,
              borderBottom: "1px solid rgba(0,0,0,0.08)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Vulnerabilities
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tracked vulnerabilities across all applications
              </Typography>
            </Box>
          </Box>
          <VulnerabilityTable
            vulnerabilities={filteredVulnerabilities}
            onStatusUpdate={handleStatusUpdate}
            onRemarksUpdate={handleRemarksUpdate}
            onUploadPOC={handleUploadPOC}
            newlyAddedIds={newlyAddedIds}
            page={page}
            totalPages={totalPages}
            onPageChange={(newPage) =>
              loadVulnerabilities(newPage, searchQuery)
            }
          />
        </DashboardCard>
      )}

      {/* Modals */}
      <AddAppModal
        open={isAddAppModalOpen}
        onClose={() => setIsAddAppModalOpen(false)}
        onAddApp={handleAddApp}
      />

      <AddVulnerabilityModal
        open={isAddVulnerabilityModalOpen}
        onClose={() => setIsAddVulnerabilityModalOpen(false)}
        onAddVulnerability={handleAddVulnerability}
        refreshTrigger={applicationsRefreshTrigger}
      />

      {/* Toast for notifications */}
      <Toast toast={toast} onClose={closeToast} />
    </Box>
  );
};

export default ClosureTracking;
