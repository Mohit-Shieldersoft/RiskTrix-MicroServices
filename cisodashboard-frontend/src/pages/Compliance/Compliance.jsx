import React, { useState, useEffect } from "react";
import { getUserProfile } from "../../utils/auth";
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Fade,
  Divider,
  useTheme,
  TextField,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ComplianceTracker from "./components/ComplianceTracker";
import ControlList from "./components/ControlList";
import AssignmentList from "./components/AssignmentList";
import assignmentApi from "../../utils/assignmentApi";
import ControlDetailsTable from "./components/ControlDetailsTable";
import AddVendorModal from "./components/AddVendorModal";
import AddExpiryModal from "./components/AddExpiryModal";
import { generateMockComplianceData } from "./mockData";
import vendorApi from "../../utils/vendorApi";
import auditApi from "../../utils/auditApi";
import { useToast } from "../../components/common/useToast";
import Toast from "../../components/common/Toast";
import dashboardTheme from "../../theme/dashboardTheme";
import "./Compliance.css";

const Compliance = () => {
  // State variables
  const [loading, setLoading] = useState(true);
  const [complianceData, setComplianceData] = useState(null);
  const [selectedStandard, setSelectedStandard] = useState("");
  const [vendorOptions, setVendorOptions] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorComplianceData, setVendorComplianceData] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [controlDetails, setControlDetails] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
  const [isAddExpiryModalOpen, setIsAddExpiryModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [apiVendors, setApiVendors] = useState([]);
  const [auditStats, setAuditStats] = useState(null);
  const { toast, showToast, closeToast } = useToast();

  // Current date and time
  const currentDateTime = new Date().toISOString().slice(0, 10);
  const currentUser =
    getUserProfile()?.full_name || getUserProfile()?.email || "User";

  // Theme for styling
  const theme = useTheme();

  // Load compliance data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // In a real app, you would fetch this from an API
      const data = generateMockComplianceData();
      setComplianceData(data);
      setLoading(false);
    };

    fetchData();
  }, []);

  // Load vendors from API
  const loadVendors = async () => {
    try {
      const response = await vendorApi.getVendors();
      setApiVendors(response.vendors || []);
      return response.vendors || [];
    } catch (error) {
      console.error("Error loading vendors:", error);
      setErrorMessage("Failed to load vendors from server");
      return [];
    }
  };

  // Load vendors and audit stats on component mount
  useEffect(() => {
    loadVendors();
    auditApi
      .getStatistics()
      .then(setAuditStats)
      .catch(() => {});
  }, []);

  // Update vendor options when standard changes
  useEffect(() => {
    const updateVendorsForStandard = async () => {
      setVendorOptions([]);
      setFilteredVendors([]);
      setSelectedVendor(null);
      setSelectedSection(null);
      setControlDetails([]);

      if (!selectedStandard) return;

      // Fetch vendors filtered by selected standard; fall back to all vendors
      try {
        setLoading(true);
        // Try standard-specific filter first; fall back to all vendors
        let apiResponse = await vendorApi.getVendors({
          standard: selectedStandard,
          page: 1,
          size: 100,
        });
        let apiVendorsList = apiResponse?.vendors || [];
        if (apiVendorsList.length === 0) {
          apiResponse = await vendorApi.getVendors({ page: 1, size: 100 });
          apiVendorsList = apiResponse?.vendors || [];
        }

        const transformedVendors = apiVendorsList.map((vendor) => ({
          ...vendor,
          compliantControls: vendor.compliant_controls || 0,
          nonCompliantControls: vendor.non_compliant_controls || 0,
          complianceRate: vendor.compliance_rate || 0,
          lastComplianceCheck: vendor.last_compliance_check,
        }));

        setVendorOptions(transformedVendors);
        setFilteredVendors(transformedVendors);
        setApiVendors(transformedVendors);
      } catch (err) {
        console.warn("Failed to load vendors:", err);
      } finally {
        setLoading(false);
      }
    };

    updateVendorsForStandard();
  }, [selectedStandard]);

  // Filter vendors based on search query
  useEffect(() => {
    if (!vendorOptions.length) return;

    const filtered = searchQuery
      ? vendorOptions.filter((vendor) =>
          vendor.name.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : vendorOptions;

    setFilteredVendors(filtered);
  }, [searchQuery, vendorOptions]);

  // Handle standard selection
  const handleStandardChange = (event) => {
    setSelectedStandard(event.target.value);
  };

  // Handle vendor selection
  const handleVendorSelect = (vendor) => {
    setSelectedVendor(vendor);
    setVendorComplianceData(vendor);
    setSelectedSection(null);
    setControlDetails([]);
  };

  // Handle section selection
  const handleSectionSelect = (section) => {
    setSelectedSection(section);

    if (selectedVendor && section) {
      // Find the controls for this section
      const sectionControls = selectedVendor.controls.filter(
        (control) => control.section === section.id,
      );

      setControlDetails(sectionControls);
    } else {
      setControlDetails([]);
    }
  };

  // Handle assignment selection - load assessments and set as controlDetails
  const handleAssignmentSelect = async (assignment) => {
    setSelectedAssignment(assignment);
    try {
      const assessments = await assignmentApi.getAssessments(assignment.id);
      // Map assessments to control row shape expected by ControlDetailsTable
      const mapped = assessments.map((a) => ({
        id: a.id,
        statement: a.statement || a.control_identifier || "Assessment",
        section: assignment.standard_id
          ? assignment.standard_id.toString()
          : "",
        compliant: a.compliant,
        remark: a.remark,
        poc: a.poc,
        status: a.status,
      }));
      setControlDetails(mapped);
    } catch (err) {
      console.error("Failed to load assessments for assignment", err);
    }
  };

  // Handle control update - save assessments to backend
  const handleControlUpdate = async (updatedControls) => {
    if (!selectedVendor) return;

    try {
      // Update each modified assessment via API
      const updatePromises = updatedControls.map((control) =>
        assignmentApi.updateAssessment(control.id, {
          compliant: control.compliant,
          remark: control.remark,
          poc: control.poc,
          status: control.status,
        }),
      );

      await Promise.all(updatePromises);
      console.log("✅ Successfully saved assessment updates");

      // Refresh control details to show updated data
      setControlDetails((prev) =>
        prev.map((control) => {
          const updated = updatedControls.find((c) => c.id === control.id);
          return updated || control;
        }),
      );

      // Show success message
      alert("Assessment updates saved successfully!");
    } catch (err) {
      console.error("Failed to save assessment updates:", err);
      alert("Failed to save updates. Please try again.");
    }

    // Legacy code for mock vendor updates (keep for fallback)
    const updatedVendor = {
      ...selectedVendor,
      controls:
        selectedVendor.controls?.map((control) => {
          const updated = updatedControls.find((c) => c.id === control.id);
          return updated || control;
        }) || [],
    };

    setSelectedVendor(updatedVendor);
    setVendorComplianceData(updatedVendor);

    // Update the control details view
    if (selectedSection) {
      const updatedSectionControls = updatedVendor.controls.filter(
        (control) => control.section === selectedSection.id,
      );
      setControlDetails(updatedSectionControls);
    }
  };

  // Handle adding a new vendor
  const handleAddVendor = async (newVendor) => {
    // The modal already called the API; newVendor is the created vendor response
    showToast(`Vendor "${newVendor.name}" added successfully`, "success");
    await loadVendors();
    auditApi
      .getStatistics()
      .then(setAuditStats)
      .catch(() => {});
    setIsAddVendorModalOpen(false);
  };

  // Handle adding expiry — calls POST /api/v1/certificates/
  const handleAddExpiry = async (payload) => {
    await auditApi.createCertificate(payload);
    showToast("Certificate expiry added successfully", "success");
    setIsAddExpiryModalOpen(false);
  };

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        maxWidth: "100%",
        background:
          "linear-gradient(135deg, rgba(240,242,245,1) 0%, rgba(245,247,250,1) 100%)",
        minHeight: "calc(100vh - 64px)",
        height: "100%",
        overflow: "auto",
      }}
    >
      {/* Page Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 2,
          background: "linear-gradient(135deg, #00796B 0%, #009688 100%)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          height: "auto",
        }}
        className="dashboard-header"
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: dashboardTheme.typography.fontWeights.bold,
              color: "#ffffff",
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            }}
          >
            Vendor Compliance
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              color: "rgba(255, 255, 255, 0.9)",
              mt: 0.5,
            }}
          >
            {currentDateTime} • {currentUser}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            mt: { xs: 2, sm: 0 },
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h5"
              sx={{
                color: "#B2DFDB",
                fontWeight: "bold",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
              }}
            >
              {(auditStats?.compliant ?? 0) + (auditStats?.non_compliant ?? 0)}
            </Typography>
            <Typography variant="h5" sx={{ color: "rgba(255, 255, 255, 0.9)" }}>
              Vendors
            </Typography>
          </Box>

          <Divider
            orientation="vertical"
            flexItem
            sx={{ bgcolor: "rgba(255, 255, 255, 0.2)" }}
          />

          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h5"
              sx={{
                color: "#B2DFDB",
                fontWeight: "bold",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
              }}
            >
              {auditStats?.compliant ?? 0}
            </Typography>
            <Typography variant="h5" sx={{ color: "rgba(255, 255, 255, 0.9)" }}>
              Compliant
            </Typography>
          </Box>

          <Divider
            orientation="vertical"
            flexItem
            sx={{ bgcolor: "rgba(255, 255, 255, 0.2)" }}
          />

          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h5"
              sx={{
                color: "#B2DFDB",
                fontWeight: "bold",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
              }}
            >
              {auditStats?.non_compliant ?? 0}
            </Typography>
            <Typography variant="h5" sx={{ color: "rgba(255, 255, 255, 0.9)" }}>
              Non-Compliant
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Combined Standard Selection and Vendor Selection */}
      <Paper
        elevation={0}
        className="futuristic-card"
        sx={{ p: 3, mb: 3, height: "auto" }}
      >
        {/* Standard Selection and Actions */}
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="standard-select-label">
                Compliance Standard
              </InputLabel>
              <Select
                labelId="standard-select-label"
                id="standard-select"
                value={selectedStandard}
                label="Compliance Standard"
                onChange={handleStandardChange}
                disabled={loading}
                size="small"
                sx={{ width: "220px" }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 200, // Limit maximum height
                      marginTop: 6, // Adjust distance from the select field
                    },
                    sx: {
                      "& .MuiMenuItem-root": {
                        py: 0.75, // Reduce padding of menu items
                        minHeight: "auto",
                        Width: "400px", // Prevent minimum height constraints
                        fontSize: "0.875rem", // Match small variant font size
                      },
                    },
                  },
                  anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "left",
                  },
                  transformOrigin: {
                    vertical: "top",
                    horizontal: "left",
                  },
                }}
              >
                <MenuItem value="">
                  <em>Select Standard</em>
                </MenuItem>
                <MenuItem value="ISO27001">
                  ISO 27001 - Information Security Management
                </MenuItem>
                <MenuItem value="PCI_DSS">
                  PCI DSS - Payment Card Industry Data Security Standard
                </MenuItem>
                <MenuItem value="SOC2">
                  SOC 2 - Service Organization Control 2
                </MenuItem>
                <MenuItem value="GDPR">
                  GDPR - General Data Protection Regulation
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: { xs: "flex-start", md: "flex-end" },
                flexWrap: { xs: "wrap", md: "nowrap" },
              }}
            >
              <Button
                variant="outlined"
                color="primary"
                startIcon={<CalendarMonthIcon />}
                onClick={() => setIsAddExpiryModalOpen(true)}
                sx={{
                  borderColor: "#00796B",
                  color: "#00796B",
                  "&:hover": {
                    borderColor: "#00695C",
                    backgroundColor: "rgba(0, 121, 107, 0.08)",
                  },
                }}
              >
                Add Expiry
              </Button>

              <Button
                variant="contained"
                startIcon={<AddCircleOutlineIcon />}
                onClick={() => setIsAddVendorModalOpen(true)}
                sx={{
                  background:
                    "linear-gradient(45deg, #00796B 30%, #009688 90%)",
                  boxShadow: "0 3px 5px rgba(0, 121, 107, 0.3)",
                  transition: "all 0.3s",
                  fontWeight: "medium",
                  "&:hover": {
                    boxShadow: "0 4px 10px rgba(0, 121, 107, 0.4)",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                Add Vendor
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Vendor Selection - Only appears when standard is selected */}
        <Fade in={!!selectedStandard && !loading} timeout={500}>
          <Box
            sx={{
              display: selectedStandard && !loading ? "block" : "none",
              mt: 3,
              pt: 3,
              borderTop: "1px solid rgba(0, 0, 0, 0.08)",
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "medium" }}>
              Select Vendor
            </Typography>

            <Grid container spacing={2}>
              {/* Vendor List */}
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search vendors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon
                          sx={{ color: "text.secondary", fontSize: 18 }}
                        />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 1.5 }}
                />

                <Box
                  sx={{
                    maxHeight: "220px",
                    overflowY: "auto",
                    border: "1px solid rgba(0,0,0,0.12)",
                    borderRadius: 1,
                  }}
                >
                  {filteredVendors.length > 0 ? (
                    filteredVendors.map((vendor) => (
                      <Box
                        key={vendor.id}
                        onClick={() => handleVendorSelect(vendor)}
                        sx={{
                          px: 2,
                          py: 1.2,
                          borderBottom: "1px solid rgba(0,0,0,0.06)",
                          cursor: "pointer",
                          transition: "background 0.15s",
                          bgcolor:
                            selectedVendor?.id === vendor.id
                              ? "rgba(0,121,107,0.10)"
                              : "transparent",
                          "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                          "&:last-child": { borderBottom: "none" },
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight:
                              selectedVendor?.id === vendor.id ? 700 : 400,
                            color:
                              selectedVendor?.id === vendor.id
                                ? "#00796B"
                                : "text.primary",
                          }}
                        >
                          {vendor.name}
                        </Typography>
                        {vendor.category && (
                          <Typography variant="caption" color="text.secondary">
                            {vendor.category}
                          </Typography>
                        )}
                      </Box>
                    ))
                  ) : (
                    <Box sx={{ p: 2.5, textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        {searchQuery
                          ? "No vendors match your search"
                          : "No vendors found. Add one using 'Add Vendor'."}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>

              {/* Vendor Detail Card */}
              <Grid size={{ xs: 12, md: 8 }}>
                {selectedVendor ? (
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 1.5,
                      border: "1px solid rgba(0,121,107,0.2)",
                      bgcolor: "rgba(0,121,107,0.04)",
                      height: "100%",
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 700, color: "#00796B", mb: 1.5 }}
                    >
                      {selectedVendor.name}
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Compliance Rate
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 700,
                            color:
                              selectedVendor.complianceRate >= 80
                                ? "#4CAF50"
                                : selectedVendor.complianceRate >= 50
                                  ? "#FFC107"
                                  : "#F44336",
                          }}
                        >
                          {selectedVendor.complianceRate ?? 0}%
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Risk Level
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 600, textTransform: "capitalize" }}
                        >
                          {selectedVendor.risk_level ?? "—"}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Compliance Status
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 600, textTransform: "capitalize" }}
                        >
                          {selectedVendor.compliance_status ?? "—"}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Last Check
                        </Typography>
                        <Typography variant="body1">
                          {selectedVendor.lastComplianceCheck ?? "—"}
                        </Typography>
                      </Box>
                      {selectedVendor.certificate_expiry_date && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Cert Expiry
                          </Typography>
                          <Typography variant="body1">
                            {selectedVendor.certificate_expiry_date}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      height: "100%",
                      minHeight: 80,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px dashed rgba(0,0,0,0.12)",
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Select a vendor to view compliance details
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Box>
        </Fade>
      </Paper>

      {/* Compliance Details (appears when vendor is selected) */}
      <Fade in={!!selectedVendor} timeout={800}>
        <Box sx={{ display: selectedVendor ? "block" : "none", width: "100%" }}>
          <Grid container spacing={2} sx={{ width: "100%", margin: 0 }}>
            {/* Left Column - Pie Chart and Control List */}
            <Grid
              size={{ xs: 12, md: 5 }}
              sx={{
                maxWidth: { md: "41.666667%" },
                flexBasis: { md: "41.666667%" },
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* Compliance Tracker Pie Chart */}
                <Paper
                  elevation={0}
                  className="futuristic-card"
                  sx={{ p: 0, height: "320px" }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: "#f8f9fb",
                      borderBottom: "1px solid rgba(0,0,0,0.05)",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: "medium", fontSize: "1rem" }}
                    >
                      Compliance Tracker
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, height: "calc(100% - 45px)" }}>
                    <ComplianceTracker
                      compliantCount={selectedVendor?.compliantControls || 0}
                      nonCompliantCount={
                        selectedVendor?.nonCompliantControls || 0
                      }
                    />
                  </Box>
                </Paper>

                {/* Control List (Assignments) */}
                <Paper
                  elevation={0}
                  className="futuristic-card"
                  sx={{ p: 0, height: "340px" }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: "#f8f9fb",
                      borderBottom: "1px solid rgba(0,0,0,0.05)",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: "medium", fontSize: "1rem" }}
                    >
                      Control List
                    </Typography>
                  </Box>
                  <Box sx={{ height: "calc(100% - 45px)", overflow: "auto" }}>
                    <AssignmentList
                      vendorId={selectedVendor?.id}
                      selectedStandard={selectedStandard}
                      onSelectAssignment={handleAssignmentSelect}
                    />
                  </Box>
                </Paper>
              </Box>
            </Grid>

            {/* Right Column - Control Details Table */}
            <Grid
              size={{ xs: 12, md: 7 }}
              sx={{
                maxWidth: { md: "58.333333%" },
                flexBasis: { md: "58.333333%" },
              }}
            >
              <Paper
                elevation={0}
                className="futuristic-card"
                sx={{
                  p: 0,
                  height: "662px",
                  maxHeight: "662px",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: "#f8f9fb",
                    borderBottom: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "medium", fontSize: "1rem" }}
                  >
                    {selectedSection
                      ? `${selectedSection.id} - ${selectedSection.name}`
                      : "Control Details"}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    height: "calc(100% - 45px)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }}
                >
                  <ControlDetailsTable
                    controls={controlDetails}
                    onUpdate={handleControlUpdate}
                    selectedStandard={selectedStandard}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Fade>

      {!selectedStandard && !loading && (
        <Box
          sx={{
            mt: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 5,
            border: "2px dashed rgba(0, 121, 107, 0.2)",
            borderRadius: 2,
            bgcolor: "rgba(0, 121, 107, 0.02)",
          }}
          className="pulse-animation"
        >
          <Typography variant="h6" sx={{ color: "text.secondary", mb: 2 }}>
            Select a Compliance Standard
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", textAlign: "center", maxWidth: 500 }}
          >
            Choose a compliance standard from the dropdown above to view vendor
            compliance details and manage control requirements.
          </Typography>
        </Box>
      )}

      <AddVendorModal
        open={isAddVendorModalOpen}
        onClose={() => setIsAddVendorModalOpen(false)}
        onAddVendor={handleAddVendor}
      />

      <AddExpiryModal
        open={isAddExpiryModalOpen}
        onClose={() => setIsAddExpiryModalOpen(false)}
        onAddExpiry={handleAddExpiry}
        vendors={apiVendors}
      />

      <Toast toast={toast} onClose={closeToast} />
    </Box>
  );
};

export default Compliance;
