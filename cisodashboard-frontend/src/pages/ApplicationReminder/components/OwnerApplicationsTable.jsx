import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Box, Typography, Button, CircularProgress, Tooltip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DoneIcon from '@mui/icons-material/Done';
import dashboardTheme from '../../../theme/dashboardTheme';
import { sendReminder } from '../../../utils/reminderApi';

const OwnerApplicationsTable = ({ data, onSendSuccess }) => {
  const [sendingMap, setSendingMap] = useState({});
  
  // Handle sending reminder for specific application
  const handleSendReminder = async (appId) => {
    // Set sending state
    setSendingMap(prev => ({ ...prev, [appId]: true }));
    
    try {
      // Extract numeric ID from string ID (e.g., "APP-1" -> 1)
      const numericId = parseInt(appId.replace('APP-', ''));
      
      // Call API to send reminder
      await sendReminder(numericId);
      
      // Notify parent
      if (onSendSuccess) {
        onSendSuccess();
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      // Could show error snackbar here
    } finally {
      setSendingMap(prev => ({ ...prev, [appId]: false }));
    }
  };
  
  // Get color based on delay days
  const getDelayColor = (days) => {
    if (days > 30) return dashboardTheme.colors.severity.critical;
    if (days > 15) return dashboardTheme.colors.severity.high;
    if (days > 7) return dashboardTheme.colors.severity.medium;
    return dashboardTheme.colors.severity.low;
  };
  
  return (
    <TableContainer component={Box} sx={{ height: '100%', width: '100%', minWidth: 0 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8f9fb' }}>
              Application Name
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#f8f9fb' }}>
              Vulnerability Count
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#f8f9fb' }}>
              Delay (Days)
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#f8f9fb', width: '120px' }}>
              Action
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((app) => {
            const delayColor = getDelayColor(app.delay.max);
            const isSending = sendingMap[app.id];
            
            return (
              <TableRow 
                key={app.id}
                hover
                sx={{ 
                  '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                  transition: 'all 0.2s',
                  borderLeft: `3px solid ${delayColor}`,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 3px 5px rgba(0, 0, 0, 0.05)'
                  }
                }}
              >
                <TableCell sx={{ fontWeight: 'medium' }}>
                  {app.name}
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                    {app.vulnerabilities.critical > 0 && (
                      <Tooltip title="Critical vulnerabilities">
                        <Box sx={{ 
                          bgcolor: dashboardTheme.colors.severity.critical,
                          color: 'white',
                          borderRadius: '4px',
                          px: 1,
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          C: {app.vulnerabilities.critical}
                        </Box>
                      </Tooltip>
                    )}
                    
                    {app.vulnerabilities.high > 0 && (
                      <Tooltip title="High vulnerabilities">
                        <Box sx={{ 
                          bgcolor: dashboardTheme.colors.severity.high,
                          color: 'white',
                          borderRadius: '4px',
                          px: 1,
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          H: {app.vulnerabilities.high}
                        </Box>
                      </Tooltip>
                    )}
                    
                    {app.vulnerabilities.medium > 0 && (
                      <Tooltip title="Medium vulnerabilities">
                        <Box sx={{ 
                          bgcolor: dashboardTheme.colors.severity.medium,
                          color: 'white',
                          borderRadius: '4px',
                          px: 1,
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          M: {app.vulnerabilities.medium}
                        </Box>
                      </Tooltip>
                    )}
                    
                    {app.vulnerabilities.low > 0 && (
                      <Tooltip title="Low vulnerabilities">
                        <Box sx={{ 
                          bgcolor: dashboardTheme.colors.severity.low,
                          color: 'white',
                          borderRadius: '4px',
                          px: 1,
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          L: {app.vulnerabilities.low}
                        </Box>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="center" sx={{ color: delayColor, fontWeight: 'medium' }}>
                  {app.delay.max} days
                </TableCell>
                <TableCell align="center">
                  <Button
                    variant="contained"
                    size="small"
                    color="primary"
                    disabled={isSending}
                    startIcon={isSending ? null : (app.lastReminded ? <DoneIcon /> : <SendIcon />)}
                    onClick={() => handleSendReminder(app.id)}
                    sx={{
                      minWidth: 100,
                      background: app.lastReminded ? '#E1BEE7' : 'linear-gradient(45deg, #673AB7 30%, #9C27B0 90%)',
                      color: app.lastReminded ? '#4A148C' : 'white',
                      boxShadow: app.lastReminded ? 'none' : '0 2px 5px rgba(103, 58, 183, 0.3)',
                      transition: 'all 0.3s',
                      textTransform: 'none',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 8px rgba(103, 58, 183, 0.4)',
                        background: app.lastReminded ? '#D1C4E9' : 'linear-gradient(45deg, #5E35B1 30%, #8E24AA 90%)',
                      }
                    }}
                  >
                    {isSending ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      app.lastReminded ? `Last: ${app.lastReminded}` : 'Send'
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default OwnerApplicationsTable;