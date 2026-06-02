import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Grid, CircularProgress,
  InputAdornment, Fade, Divider, Autocomplete, Chip, Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import BugReportIcon from '@mui/icons-material/BugReport';
import AddApplicationModal from './components/AddApplicationModal';
import AddVulnerabilityModal from './components/AddVulnerabilityModal';
import VulnerabilityPieChart from './components/VulnerabilityPieChart';
import VulnerabilityTable from './components/VulnerabilityTable';
import { generateMockReportsData } from './mockData';
import applicationApi from '../../utils/applicationApi';
import vulnerabilityApi from '../../utils/vulnerabilityApi';
import dashboardTheme from '../../theme/dashboardTheme';
import './Reports.css';

const Reports = () => {
  // State variables
  const [loading, setLoading] = useState(true);
  const [loadingVulnerabilities, setLoadingVulnerabilities] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [appOptions, setAppOptions] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [reportsData, setReportsData] = useState(null);
  const [vulnerabilityData, setVulnerabilityData] = useState([]);
  const [isAddAppModalOpen, setIsAddAppModalOpen] = useState(false);
  const [isAddVulnModalOpen, setIsAddVulnModalOpen] = useState(false);

  // Current date and time
  const currentDateTime = new Date().toLocaleString();
  const currentUser = "Admin User";

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch applications from backend
        const response = await applicationApi.listApplications();
        const applications = response.items || [];

        // Fetch vulnerability statistics from backend
        let stats = {
          totalApplications: applications.length,
          totalVulnerabilities: 0,
          openVulnerabilities: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0
        };

        try {
          const statsResponse = await vulnerabilityApi.getStatistics();
          stats = {
            totalApplications: applications.length,
            totalVulnerabilities: statsResponse.total || 0,
            openVulnerabilities: statsResponse.open || 0,
            criticalCount: statsResponse.by_severity?.critical || 0,
            highCount: statsResponse.by_severity?.high || 0,
            mediumCount: statsResponse.by_severity?.medium || 0,
            lowCount: statsResponse.by_severity?.low || 0
          };
        } catch (error) {
          console.error('Error fetching vulnerability statistics:', error);
        }

        setReportsData({
          applications: applications,
          stats: stats
        });

        // Set application options for the search dropdown
        const options = applications.map(app => ({
          id: app.id, // This is now the integer ID from database
          label: app.name,
          appData: app
        }));
        setAppOptions(options);
      } catch (error) {
        console.error('Error fetching applications:', error);
        // Fallback to mock data if API fails
        const data = generateMockReportsData();
        setReportsData(data);
        const options = data.applications.map(app => ({
          id: app.id,
          label: app.name,
          appData: app
        }));
        setAppOptions(options);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle search selection
  const handleSearchChange = async (event, newValue) => {
    if (newValue) {
      setSelectedApp(newValue.appData);
      setLoadingVulnerabilities(true);
      setVulnerabilityData([]); // Initialize with empty array to prevent undefined errors
      setShowResults(true);

      // Fetch real vulnerabilities from backend
      try {
        const response = await vulnerabilityApi.getVulnerabilitiesByApplication(newValue.id);

        // Transform backend data to match UI expectations
        const transformedVulnerabilities = (response.items || []).map(vuln => ({
          id: vuln.id,
          name: vuln.name,
          category: vuln.source || 'Security Assessment', // Use source as category
          risk: capitalizeFirstLetter(vuln.risk), // Convert "critical" to "Critical"
          status: formatStatus(vuln.status), // Convert "in_progress" to "In Progress"
          description: vuln.description || '',
          remark: vuln.remarks || '',
          poc: vuln.poc_file_path || null,
          cveId: vuln.cve_id,
          cvssScore: vuln.cvss_score,
          openDate: vuln.open_date,
          closureDate: vuln.closure_date
        }));

        setVulnerabilityData(transformedVulnerabilities);
      } catch (error) {
        console.error('Error fetching vulnerabilities:', error);
        // Fallback to empty array if error
        setVulnerabilityData([]);
      } finally {
        setLoadingVulnerabilities(false);
      }
    } else {
      setSelectedApp(null);
      setVulnerabilityData([]);
      setShowResults(false);
    }
  };

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Helper function to format status
  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    // Convert "in_progress" to "In Progress", "open" to "Open", etc.
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Modal handlers
  const handleAddApplication = (newApp) => {
    // newApp is expected to be the created resource from the backend
    console.log("Adding new application:", newApp);
    setReportsData(prev => {
      if (!prev) return prev;
      const updatedApps = [
        ...(prev.applications || []),
        // adapt shape if API returns application inside 'data' or directly
        newApp?.id ? newApp : { ...newApp }
      ];
      return {
        ...prev,
        applications: updatedApps,
        stats: {
          ...prev.stats,
          totalApplications: (prev.stats?.totalApplications || 0) + 1
        }
      };
    });

    setAppOptions(prev => {
      const option = { id: newApp.id, label: newApp.name, appData: newApp };
      return [...(prev || []), option];
    });

    setIsAddAppModalOpen(false);
  };

  const handleAddVulnerability = (newVuln) => {
    console.log("Adding new vulnerability:", newVuln);

    // Update stats
    setReportsData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        stats: {
          ...prev.stats,
          totalVulnerabilities: (prev.stats?.totalVulnerabilities || 0) + 1,
          openVulnerabilities: newVuln.status === 'open' ? (prev.stats?.openVulnerabilities || 0) + 1 : prev.stats?.openVulnerabilities
        }
      };
    });

    // If selected app matches, add to its vulnerabilities
    if (selectedApp && selectedApp.id === newVuln.application_id) {
      setVulnerabilityData(prev => [...(prev || []), newVuln]);
    }

    setIsAddVulnModalOpen(false);
  };

  // Handle download report
  const handleDownloadReport = () => {
    if (!selectedApp) return;

    // In a real app, you would generate and download a report
    console.log("Downloading report for:", selectedApp.name);

    // Simulate download
    setTimeout(() => {
      alert(`Report for ${selectedApp.name} downloaded successfully!`);
    }, 1000);
  };

  return (
    <Box sx={{
      p: { xs: 2, md: 3 },
      maxWidth: '100%',
      background: 'linear-gradient(135deg, rgba(240,242,245,1) 0%, rgba(245,247,250,1) 100%)',
      minHeight: 'calc(100vh - 64px)',
      height: '100%',
      overflow: 'auto'
    }}>
      {/* Page Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 2, // Reduced from 3
          p: { xs: 1.5, md: 2 }, // Reduced padding
          borderRadius: 2,
          background: 'linear-gradient(135deg, #00796B 0%, #009688 100%)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          height: 'auto',
          maxHeight: { xs: 'auto', sm: '120px' }, // Reduced from 140px
          alignItems: { xs: 'flex-start', sm: 'center' },
        }}
        className="dashboard-header"
      >
        <Box>
          <Typography
            variant="h5"
            component="h1"
            sx={{
              fontWeight: dashboardTheme.typography.fontWeights.bold,
              color: '#ffffff',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              lineHeight: 1.2 // Added to reduce height
            }}
          >
            Reports & Vulnerabilities
          </Typography>
          <Typography
            variant="body2" // Changed from subtitle1 to body2
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              mt: 0.5
            }}
          >
            {currentDateTime} • {currentUser}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2, // Reduced from 3
            marginRight: 4,
            mt: { xs: 1, sm: 0 } // Reduced from 2 to 1
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h5"
              sx={{
                color: '#FFFFFF',
                fontWeight: 'bold',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
              }}
            >
              {reportsData?.stats.totalApplications || 0}
            </Typography>
            <Typography variant="h5" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              Applications
            </Typography>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }} />

          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h5"
              sx={{
                color: '#FFFFFF', // Changed from '#B2DFDB' for better visibility
                fontWeight: 'bold',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
              }}
            >
              {reportsData?.stats.totalVulnerabilities || 0}
            </Typography>
            <Typography variant="h5" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              Vulnerabilities
            </Typography>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }} />

          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h5"
              sx={{
                color: '#FFFFFF', // Changed from '#B2DFDB' for better visibility 
                fontWeight: 'bold',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
              }}
            >
              {reportsData?.stats.openVulnerabilities || 0}
            </Typography>
            <Typography variant="h5" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              Open Issues
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Search and Actions */}
      <Paper
        elevation={0}
        className="futuristic-card search-panel"
        sx={{
          p: { xs: 1.5, md: 2 },
          mb: 3,
          height: 'auto'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          {/* Search Application */}
          <Grid item xs={12} md={8}>
            <Autocomplete
              id="app-search"
              options={appOptions}
              loading={loading}
              loadingText="Loading applications..."
              value={selectedApp ? appOptions.find(o => o.id === selectedApp.id) : null}
              onChange={handleSearchChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search for an application"
                  placeholder="Enter application name or ID"
                  variant="outlined"
                  fullWidth
                  sx={{
                    width: '100%', // Make sure it takes full width
                    minWidth: { xs: '100%', md: '420px' } // reduced to avoid forcing wide layout
                  }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    )
                  }}
                />
              )}
              renderOption={(props, option) => {
                // Extract key from props to fix React warning
                const { key, ...otherProps } = props;

                return (
                  <li key={key} {...otherProps}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Typography sx={{ flexGrow: 1 }}>{option.label}</Typography>
                      <Chip
                        label={option.appData.category}
                        size="small"
                        sx={{
                          bgcolor: '#E0F2F1',
                          color: '#00796B',
                          fontSize: '0.7rem'
                        }}
                      />
                    </Box>
                  </li>
                );
              }}
            />
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12} md={4}> {/* Changed from md={6} to md={4} */}
            <Box sx={{
              display: 'flex',
              gap: 2,
              justifyContent: { xs: 'flex-start', md: 'flex-end' },
              flexWrap: 'wrap' // Always wrap if needed
            }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<FileDownloadIcon />}
                disabled={!selectedApp}
                onClick={handleDownloadReport}
                sx={{
                  borderColor: '#00796B',
                  color: '#00796B',
                  '&:hover': {
                    borderColor: '#00695C',
                    backgroundColor: 'rgba(0, 121, 107, 0.08)',
                  },
                  '&.Mui-disabled': {
                    borderColor: 'rgba(0, 121, 107, 0.3)',
                    color: 'rgba(0, 121, 107, 0.3)'
                  }
                }}
              >
                Download Report
              </Button>

              <Button
                variant="contained"
                startIcon={<AddCircleOutlineIcon />}
                onClick={() => setIsAddAppModalOpen(true)}
                sx={{
                  background: 'linear-gradient(45deg, #00796B 30%, #009688 90%)',
                  boxShadow: '0 3px 5px rgba(0, 121, 107, 0.3)',
                  transition: 'all 0.3s',
                  fontWeight: 'medium',
                  '&:hover': {
                    boxShadow: '0 4px 10px rgba(0, 121, 107, 0.4)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                Add Application
              </Button>

              <Button
                variant="contained"
                startIcon={<BugReportIcon />}
                onClick={() => setIsAddVulnModalOpen(true)}
                sx={{
                  background: 'linear-gradient(45deg, #E53935 30%, #F44336 90%)',
                  boxShadow: '0 3px 5px rgba(229, 57, 53, 0.3)',
                  transition: 'all 0.3s',
                  fontWeight: 'medium',
                  '&:hover': {
                    boxShadow: '0 4px 10px rgba(229, 57, 53, 0.4)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                Add Vulnerability
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Results Section - Simplified structure */}
      {showResults && selectedApp && (
        <Fade in={true} timeout={800}>
          <Box>
            {/* Application Info Summary */}
            {/* <Paper 
              elevation={0}
              className="futuristic-card app-summary"
              sx={{ p: 2.5, mb: 2 }} // Reduced padding from 3 to 2.5, margin from 3 to 2
            >
              <Grid container spacing={2}>
                <Grid item xs={12} md={9}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#00796B', mb: 1 }}>
                    {selectedApp?.name || ''}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
                    <Chip 
                      label={`ID: ${selectedApp?.id || ''}`} 
                      size="small" 
                      sx={{ bgcolor: '#E0F2F1', color: '#00796B' }} 
                    />
                    <Chip 
                      label={`Category: ${selectedApp?.category || ''}`} 
                      size="small" 
                      sx={{ bgcolor: '#E0F2F1', color: '#00796B' }} 
                    />
                    <Chip 
                      label={`Owner: ${selectedApp?.owner || ''}`} 
                      size="small" 
                      sx={{ bgcolor: '#E0F2F1', color: '#00796B' }} 
                    />
                    <Chip 
                      label={`Vendor: ${selectedApp?.vendor || ''}`} 
                      size="small" 
                      sx={{ bgcolor: '#E0F2F1', color: '#00796B' }} 
                    />
                  </Box>
                  
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {selectedApp?.description || ''}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    height: '100%',
                    alignItems: 'center'
                  }}>
                    <Tooltip title="Vulnerability Status" placement="top">
                      <Box sx={{ 
                        display: 'inline-flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        p: 2,
                        borderRadius: 2,
                        bgcolor: '#E0F2F1',
                      }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#00796B' }}>
                          {vulnerabilityData?.length || 0}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#00796B' }}>
                          Vulnerabilities
                        </Typography>
                        
                        <Box sx={{ display: 'flex', mt: 1, gap: 1 }}>
                          <Chip 
                            label={`Open: ${vulnerabilityData?.filter(v => v.status === 'Open').length || 0}`} 
                            size="small" 
                            sx={{ bgcolor: '#FFEBEE', color: '#D32F2F', fontWeight: 'medium' }} 
                          />
                          <Chip 
                            label={`Closed: ${vulnerabilityData?.filter(v => v.status === 'Closed').length || 0}`} 
                            size="small" 
                            sx={{ bgcolor: '#E8F5E9', color: '#388E3C', fontWeight: 'medium' }} 
                          />
                        </Box>
                      </Box>
                    </Tooltip>
                  </Box>
                </Grid>
              </Grid>
            </Paper> */}

            <Paper
              elevation={0}
              className="futuristic-card app-summary"
              sx={{
                p: 3,
                mb: 3,
                display: 'flex',
                justifyContent: 'center', // centers all content horizontally
                alignItems: 'center', // centers vertically
                textAlign: 'center',
                // gap: 10
              }}
            >
              <Grid
                container
                spacing={20}
                sx={{
                  maxWidth: 900, // centers content in a readable width
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {/* Left Section - Application Info */}
                <Grid
                  item
                  xs={12}
                  md={8}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: { xs: 'center', md: 'flex-start' },
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 'bold',
                      color: '#00796B',
                      mb: 1,
                      textAlign: { xs: 'center', md: 'left' },
                    }}
                  >
                    {selectedApp?.name || ''}
                  </Typography>

                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: { xs: 'center', md: 'flex-start' },
                      gap: 1.5,
                      mb: 2,
                    }}
                  >
                    <Chip label={`ID: ${selectedApp?.id || ''}`} size="small" sx={{ bgcolor: '#E0F2F1', color: '#00796B' }} />
                    <Chip label={`Category: ${selectedApp?.category || selectedApp?.type || ""}`} size="small" sx={{ bgcolor: '#E0F2F1', color: '#00796B' }} />
                    <Chip label={`Owner: ${selectedApp?.owner || ''}`} size="small" sx={{ bgcolor: '#E0F2F1', color: '#00796B' }} />
                    <Chip label={`Vendor: ${selectedApp?.vendor || ''}`} size="small" sx={{ bgcolor: '#E0F2F1', color: '#00796B' }} />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        fontWeight: 'bold',
                        color: 'text.secondary',
                        textTransform: 'uppercase',
                        mb: 0.5,
                        textAlign: { xs: 'center', md: 'left' }
                      }}
                    >
                      Description
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.primary',
                        textAlign: { xs: 'center', md: 'left' },
                        maxWidth: 600,
                        mx: { xs: 'auto', md: 0 },
                        lineHeight: 1.6
                      }}
                    >
                      {selectedApp?.description || 'No description provided.'}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        fontWeight: 'bold',
                        color: 'text.secondary',
                        textTransform: 'uppercase',
                        mb: 0.5,
                        textAlign: { xs: 'center', md: 'left' }
                      }}
                    >
                      URL / Endpoint
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#1976d2',
                        textAlign: { xs: 'center', md: 'left' },
                        maxWidth: 600,
                        mx: { xs: 'auto', md: 0 },
                        wordBreak: 'break-all',
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                      component="a"
                      href={selectedApp?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {selectedApp?.url || 'No URL specified'}
                    </Typography>
                  </Box>
                </Grid>

                {/* Right Section - Vulnerability Summary */}
                <Grid
                  item
                  xs={12}
                  md={4}
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Tooltip title="Vulnerability Status" placement="top">
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        p: 2,
                        // pt: 4,
                        borderRadius: 2,
                        bgcolor: '#E0F2F1',
                        minWidth: 180,
                      }}
                    >
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#00796B' }}>
                        {vulnerabilityData?.length || 0}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#00796B', mb: 1 }}>
                        Vulnerabilities
                      </Typography>

                      <Box sx={{ display: 'flex', mt: 0.5, gap: 1 }}>
                        <Chip
                          label={`Open: ${vulnerabilityData?.filter(v => v.status === 'Open').length || 0}`}
                          size="small"
                          sx={{
                            bgcolor: '#FFEBEE',
                            color: '#D32F2F',
                            fontWeight: 'medium',
                          }}
                        />
                        <Chip
                          label={`Closed: ${vulnerabilityData?.filter(v => v.status === 'Closed').length || 0}`}
                          size="small"
                          sx={{
                            bgcolor: '#E8F5E9',
                            color: '#388E3C',
                            fontWeight: 'medium',
                          }}
                        />
                      </Box>
                    </Box>
                  </Tooltip>
                </Grid>
              </Grid>
            </Paper>


            {/* Vulnerability Charts and Table */}
            <Grid container spacing={3} alignItems="stretch"> {/* tightened spacing */}
              {/* Vulnerability Pie Chart (35%) */}
              <Grid
                item
                xs={12}
                sx={{
                  flexBasis: { md: '35%' },
                  maxWidth: { md: '35%' },
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0
                }}
              >
                <Paper
                  elevation={0}
                  className="futuristic-card"
                  sx={{ height: '100%', p: 0, display: 'flex', flexDirection: 'column', minWidth: 0 }}
                >
                  <Box sx={{ p: 2, bgcolor: '#f8f9fb', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                      Vulnerability Tracker
                    </Typography>
                  </Box>
                  <Box sx={{ height: 350, p: 2, minWidth: 0 }}>
                    {loadingVulnerabilities ? (
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%'
                      }}>
                        <CircularProgress />
                      </Box>
                    ) : vulnerabilityData && vulnerabilityData.length > 0 ? (
                      <VulnerabilityPieChart data={vulnerabilityData} />
                    ) : (
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%'
                      }}>
                        <Typography variant="body2" color="text.secondary">
                          No vulnerability data available
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>

              {/* Vulnerability Table (65%) */}
              <Grid
                item
                xs={12}
                sx={{
                  flexBasis: { md: '65%' },
                  maxWidth: { md: '65%' },
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0
                }}
              >
                <Paper
                  elevation={0}
                  className="futuristic-card"
                  sx={{ height: '100%', p: 0, display: 'flex', flexDirection: 'column', minWidth: 0 }}
                >
                  <Box sx={{ p: 2, bgcolor: '#f8f9fb', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                      Vulnerability Details
                    </Typography>
                  </Box>
                  <Box sx={{ height: 350, overflow: 'auto', minWidth: 0 }}>
                    {loadingVulnerabilities ? (
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%'
                      }}>
                        <CircularProgress />
                      </Box>
                    ) : (
                      <VulnerabilityTable data={vulnerabilityData} />
                    )}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Fade>
      )}

      {/* Empty State (No Search Results) - Fixed height and relative positioning */}
      {!showResults && !loading && (
        <Box
          sx={{
            mt: 2,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 5,
            border: '2px dashed rgba(0, 121, 107, 0.2)',
            borderRadius: 2,
            bgcolor: 'rgba(0, 121, 107, 0.02)',
            height: '250px' // Fixed height instead of filling the screen
          }}
          className="pulse-animation"
        >
          <SearchIcon sx={{ fontSize: 48, color: 'rgba(0, 121, 107, 0.3)', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
            Search for an Application
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 400 }}>
            Enter an application name or ID to view vulnerability details and generate reports
          </Typography>
        </Box>
      )}

      {/* Modals */}
      <AddApplicationModal
        open={isAddAppModalOpen}
        onClose={() => setIsAddAppModalOpen(false)}
        onAddApplication={handleAddApplication}
      />

      <AddVulnerabilityModal
        open={isAddVulnModalOpen}
        onClose={() => setIsAddVulnModalOpen(false)}
        onAddVulnerability={handleAddVulnerability}
        applications={appOptions}
      />
    </Box>
  );
};

export default Reports;