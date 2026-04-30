import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Divider, Paper, Alert, CircularProgress
} from '@mui/material';
import OwnerSection from './components/OwnerSection';
import ApplicationSection from './components/ApplicationSection';
import { getReminderData } from '../../utils/reminderApi';
import dashboardTheme from '../../theme/dashboardTheme';
import './ApplicationReminder.css';

const ApplicationReminder = () => {
  // State
  const [loading, setLoading] = useState(true);
  const [reminderData, setReminderData] = useState(null);
  const [error, setError] = useState(null);
  
  // Current date and user
  const currentDateTime = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const currentUser = localStorage.getItem('userName') || "User";
  
  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getReminderData();
        setReminderData(data);
      } catch (err) {
        console.error('Error fetching reminder data:', err);
        setError(err.detail || err.message || 'Failed to load reminder data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
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
          mb: 4,
          p: 3,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #673AB7 0%, #9C27B0 100%)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          height:'200px',
        }}
        className="dashboard-header"
      >
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: dashboardTheme.typography.fontWeights.bold,
              color: '#ffffff',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }}
          >
            Application Reminder
          </Typography>
          <Typography 
            variant="subtitle4" 
            sx={{
              color: '#FFFFFF',
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
            gap: 3,
            mt: { xs: 2, sm: 0 }
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="h5" 
              sx={{ 
                color: '#FFFFFF', 
                fontWeight: 'bold',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' 
              }}
            >
              {reminderData?.stats.owners || 0}
            </Typography>
            <Typography variant="h5" sx={{ color: '#FFFFFF' }}>
              Owners
            </Typography>
          </Box>
          
          <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }} />
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="h5" 
              sx={{ 
                color: '#FFFFFF', 
                fontWeight: 'bold',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' 
              }}
            >
              {reminderData?.stats.applications || 0}
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
                color: '#FFFFFF', 
                fontWeight: 'bold',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' 
              }}
            >
              {reminderData?.stats.totalVulnerabilities || 0}
            </Typography>
            <Typography variant="h5" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              Vulnerabilities
            </Typography>
          </Box>
        </Box>
      </Paper>
      
      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      {/* Loading Display */}
      {loading && !error && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress size={60} sx={{ color: '#673AB7' }} />
        </Box>
      )}
      
      {/* Content - Only show when not loading and no error */}
      {!loading && !error && reminderData && (
        <>
          {/* Owner Section */}
          <Box sx={{ mb: 4 }}>
            <OwnerSection 
              data={reminderData?.ownerData}
              loading={false}
            />
          </Box>
          
          <Divider sx={{ mb: 4, borderColor: 'rgba(0, 0, 0, 0.08)' }} />
          
          {/* Application Section */}
          <Box>
            <ApplicationSection 
              data={reminderData?.applicationData}
              loading={false}
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default ApplicationReminder;