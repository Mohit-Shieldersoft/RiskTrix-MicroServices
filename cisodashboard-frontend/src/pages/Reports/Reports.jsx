import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  InputAdornment,
  Autocomplete,
  Chip,
  Tabs,
  Tab,
  Card,
  CardContent,
  Link,
  Snackbar,
  Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import BugReportIcon from "@mui/icons-material/BugReport";
import AddApplicationModal from "./components/AddApplicationModal";
import AddVulnerabilityModal from "./components/AddVulnerabilityModal";
import VulnerabilityPieChart from "./components/VulnerabilityPieChart";
import VulnerabilityTable from "./components/VulnerabilityTable";
import SecurityReportsPanel, { downloadSecurityReport } from "./components/SecurityReportsPanel";
import api from "../../utils/api";
import applicationApi from "../../utils/applicationApi";
import vulnerabilityApi from "../../utils/vulnerabilityApi";
import PageShell, { PageSection, EmptyState } from "../../components/common/PageShell";
import dashboardTheme from "../../theme/dashboardTheme";
import "./Reports.css";

const indigoChip = {
  bgcolor: "rgba(63,81,181,0.08)",
  color: dashboardTheme.colors.primary,
  fontWeight: 600,
};

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [loadingVulnerabilities, setLoadingVulnerabilities] = useState(false);
  const [appOptions, setAppOptions] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [reportsData, setReportsData] = useState(null);
  const [vulnerabilityData, setVulnerabilityData] = useState([]);
  const [isAddAppModalOpen, setIsAddAppModalOpen] = useState(false);
  const [isAddVulnModalOpen, setIsAddVulnModalOpen] = useState(false);
  const [moduleTab, setModuleTab] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await applicationApi.listApplications();
        const applications = response.items || [];
        let stats = {
          totalApplications: applications.length,
          totalVulnerabilities: 0,
          openVulnerabilities: 0,
          criticalCount: 0,
          highCount: 0,
        };
        try {
          const statsResponse = await vulnerabilityApi.getStatistics();
          stats = {
            totalApplications: applications.length,
            totalVulnerabilities: statsResponse.total || 0,
            openVulnerabilities: statsResponse.open || 0,
            criticalCount: statsResponse.by_severity?.critical || 0,
            highCount: statsResponse.by_severity?.high || 0,
          };
        } catch {
          /* keep defaults */
        }
        setReportsData({ applications, stats });
        setAppOptions(applications.map((app) => ({ id: app.id, label: app.name, appData: app })));
      } catch {
        setReportsData({ applications: [], stats: {} });
        setAppOptions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const capitalizeFirstLetter = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : "");
  const formatStatus = (status) => {
    if (!status) return "Unknown";
    return status.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const handleSearchChange = async (_event, newValue) => {
    if (!newValue) {
      setSelectedApp(null);
      setVulnerabilityData([]);
      setShowResults(false);
      return;
    }
    setSelectedApp(newValue.appData);
    setLoadingVulnerabilities(true);
    setVulnerabilityData([]);
    setShowResults(true);
    try {
      const response = await vulnerabilityApi.getVulnerabilitiesByApplication(newValue.id);
      setVulnerabilityData(mapVulnerabilities(response.items));
    } catch {
      setVulnerabilityData([]);
    } finally {
      setLoadingVulnerabilities(false);
    }
  };

  const handleAddApplication = (newApp) => {
    setReportsData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        applications: [...(prev.applications || []), newApp?.id ? newApp : { ...newApp }],
        stats: { ...prev.stats, totalApplications: (prev.stats?.totalApplications || 0) + 1 },
      };
    });
    setAppOptions((prev) => [...(prev || []), { id: newApp.id, label: newApp.name, appData: newApp }]);
    setIsAddAppModalOpen(false);
  };

  const handleAddVulnerability = (newVuln) => {
    setReportsData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        stats: {
          ...prev.stats,
          totalVulnerabilities: (prev.stats?.totalVulnerabilities || 0) + 1,
          openVulnerabilities: newVuln.status === "open"
            ? (prev.stats?.openVulnerabilities || 0) + 1
            : prev.stats?.openVulnerabilities,
        },
      };
    });
    if (selectedApp && selectedApp.id === newVuln.application_id) {
      setVulnerabilityData((prev) => [...(prev || []), newVuln]);
    }
    setIsAddVulnModalOpen(false);
  };

  const handleDownloadReport = async () => {
    if (!selectedApp) return;
    setDownloading(true);
    try {
      const res = await api.post("/api/v1/cloud/reports/generate", {
        report_type: "APPLICATION",
        format: "PDF",
        title: `${selectedApp.name} Vulnerability Report`,
        filters: { application_id: selectedApp.id },
      });
      await downloadSecurityReport(res.data.id, res.data.title, "PDF");
      setToast({ open: true, message: "Application report downloaded.", severity: "success" });
    } catch (err) {
      setToast({ open: true, message: err.response?.data?.detail || "Download failed.", severity: "error" });
    } finally {
      setDownloading(false);
    }
  };

  const stats = reportsData?.stats || {};
  const openCount = vulnerabilityData.filter((item) => item.status === "Open").length;
  const closedCount = vulnerabilityData.filter((item) => item.status === "Closed").length;

  const mapVulnerabilities = (items) => (items || []).map((vuln) => ({
    id: vuln.id,
    name: vuln.name,
    category: vuln.source || "Security Assessment",
    risk: capitalizeFirstLetter(vuln.risk),
    status: formatStatus(vuln.status),
    description: vuln.description || "",
    remark: vuln.remarks || "",
    poc: vuln.poc_file_path || null,
    cveId: vuln.cve_id,
    cvssScore: vuln.cvss_score,
    openDate: vuln.open_date,
    closureDate: vuln.closure_date,
  }));

  const refreshSelectedAppVulns = async () => {
    if (!selectedApp) return;
    const response = await vulnerabilityApi.getVulnerabilitiesByApplication(selectedApp.id);
    setVulnerabilityData(mapVulnerabilities(response.items));
  };

  return (
    <Box className="reports-page">
    <PageShell
      title="Reports"
      subtitle="Generate RiskTrix by Shieldersoft security exports, or inspect an application portfolio."
    >
      <Grid container spacing={1.5} sx={{ mb: 1 }}>
        {[
          { label: "Applications", value: stats.totalApplications || 0, color: dashboardTheme.colors.primary },
          { label: "Vulnerabilities", value: stats.totalVulnerabilities || 0, color: "#283593" },
          { label: "Open issues", value: stats.openVulnerabilities || 0, color: dashboardTheme.colors.error },
          { label: "Critical", value: stats.criticalCount || 0, color: dashboardTheme.colors.severity.critical },
        ].map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
            <Card sx={{ borderLeft: `3px solid ${card.color}`, boxShadow: "none", border: "1px solid rgba(63,81,181,0.08)" }}>
              <CardContent sx={{ py: 1.25, px: 2, "&:last-child": { pb: 1.25 } }}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                  {card.label}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: card.color, mt: 0.25 }}>{card.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <PageSection sx={{ py: 0, px: { xs: 1, md: 2 } }}>
        <Tabs
          value={moduleTab}
          onChange={(_, value) => setModuleTab(value)}
          sx={{
            minHeight: 52,
            "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 52 },
            "& .Mui-selected": { color: dashboardTheme.colors.primary },
            "& .MuiTabs-indicator": { backgroundColor: dashboardTheme.colors.primary, height: 3 },
          }}
        >
          <Tab label="Security reports" />
          <Tab label="Application portfolio" />
        </Tabs>
      </PageSection>

      {moduleTab === 0 && <SecurityReportsPanel />}

      {moduleTab === 1 && (
        <>
          <PageSection>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={7}>
                <Autocomplete
                  options={appOptions}
                  loading={loading}
                  loadingText="Loading applications..."
                  value={selectedApp ? appOptions.find((option) => option.id === selectedApp.id) || null : null}
                  onChange={handleSearchChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search application"
                      placeholder="Name or ID"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start"><SearchIcon sx={{ color: "text.secondary" }} /></InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, option) => {
                    const { key, ...rest } = props;
                    return (
                      <li key={key} {...rest}>
                        <Box sx={{ display: "flex", alignItems: "center", width: "100%", gap: 1 }}>
                          <Typography sx={{ flexGrow: 1 }}>{option.label}</Typography>
                          <Chip size="small" label={option.appData.category || option.appData.type || "App"} sx={indigoChip} />
                        </Box>
                      </li>
                    );
                  }}
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
                  <Button
                    variant="outlined"
                    startIcon={<FileDownloadIcon />}
                    disabled={!selectedApp || downloading}
                    onClick={handleDownloadReport}
                  >
                    {downloading ? "Exporting..." : "Download report"}
                  </Button>
                  <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => setIsAddAppModalOpen(true)} sx={{ bgcolor: dashboardTheme.colors.primary }}>
                    Add application
                  </Button>
                  <Button variant="contained" color="error" startIcon={<BugReportIcon />} onClick={() => setIsAddVulnModalOpen(true)}>
                    Add vulnerability
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </PageSection>

          {showResults && selectedApp ? (
            <>
              <PageSection>
                <Grid container spacing={3} alignItems="flex-start">
                  <Grid item xs={12} md={8}>
                    <Typography variant="overline" sx={{ color: dashboardTheme.colors.primary, fontWeight: 700 }}>
                      Application
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: dashboardTheme.colors.text.primary, mb: 1.5 }}>
                      {selectedApp.name}
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                      <Chip size="small" label={`ID ${selectedApp.id}`} sx={indigoChip} />
                      <Chip size="small" label={selectedApp.category || selectedApp.type || "Uncategorized"} sx={indigoChip} />
                      <Chip size="small" label={selectedApp.owner || "Unassigned owner"} sx={indigoChip} />
                      <Chip size="small" label={selectedApp.vendor || "No vendor"} sx={indigoChip} />
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>Description</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, mb: 1.5, maxWidth: 680, lineHeight: 1.6 }}>
                      {selectedApp.description || "No description provided."}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>URL / endpoint</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {selectedApp.url ? (
                        <Link href={selectedApp.url} target="_blank" rel="noopener noreferrer">{selectedApp.url}</Link>
                      ) : "No URL specified"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: "rgba(63,81,181,0.04)", border: "1px solid rgba(63,81,181,0.12)" }}>
                      <CardContent sx={{ textAlign: "center" }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: dashboardTheme.colors.primary }}>
                          {vulnerabilityData.length}
                        </Typography>
                        <Typography variant="caption" sx={{ color: dashboardTheme.colors.primary, fontWeight: 600 }}>
                          Vulnerabilities in scope
                        </Typography>
                        <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mt: 1.5 }}>
                          <Chip size="small" label={`Open ${openCount}`} sx={{ bgcolor: "#FFEBEE", color: "#C62828", fontWeight: 600 }} />
                          <Chip size="small" label={`Closed ${closedCount}`} sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", fontWeight: 600 }} />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </PageSection>

              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <PageSection sx={{ mb: 0, height: "100%" }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Severity mix</Typography>
                    <Box sx={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {loadingVulnerabilities ? (
                        <CircularProgress />
                      ) : vulnerabilityData.length ? (
                        <VulnerabilityPieChart data={vulnerabilityData} />
                      ) : (
                        <Typography variant="body2" color="text.secondary">No vulnerability data available.</Typography>
                      )}
                    </Box>
                  </PageSection>
                </Grid>
                <Grid item xs={12} md={8}>
                  <PageSection sx={{ mb: 0, height: "100%", p: 0 }}>
                    <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Vulnerability details</Typography>
                    </Box>
                    <Box sx={{ height: 340, overflow: "auto" }}>
                      {loadingVulnerabilities ? (
                        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                          <CircularProgress />
                        </Box>
                      ) : (
                        <VulnerabilityTable data={vulnerabilityData} onChanged={refreshSelectedAppVulns} />
                      )}
                    </Box>
                  </PageSection>
                </Grid>
              </Grid>
            </>
          ) : (
            !loading && (
              <PageSection>
                <EmptyState
                  title="Select an application"
                  message="Search by name or ID to inspect findings and export a branded RiskTrix report."
                />
              </PageSection>
            )
          )}
        </>
      )}

      <AddApplicationModal open={isAddAppModalOpen} onClose={() => setIsAddAppModalOpen(false)} onAddApplication={handleAddApplication} />
      <AddVulnerabilityModal open={isAddVulnModalOpen} onClose={() => setIsAddVulnModalOpen(false)} onAddVulnerability={handleAddVulnerability} applications={appOptions} />
      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })}>{toast.message}</Alert>
      </Snackbar>
    </PageShell>
    </Box>
  );
};

export default Reports;
