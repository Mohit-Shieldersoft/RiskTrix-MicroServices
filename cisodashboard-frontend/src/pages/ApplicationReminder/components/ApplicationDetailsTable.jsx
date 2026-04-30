import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Box, Typography, Button, CircularProgress, Tooltip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DoneIcon from '@mui/icons-material/Done';
import dashboardTheme from '../../../theme/dashboardTheme';
import { sendReminder } from '../../../utils/reminderApi';

const ApplicationDetailsTable = ({ data, onSendSuccess }) => {
  const [sendingMap, setSendingMap] = useState({});
  
  // Handle sending reminder for specific application instance
  const handleSendReminder = async (instanceId) => {
    // Set sending state
    setSendingMap(prev => ({ ...prev, [instanceId]: true }));
    
    try {
      // Extract application and owner IDs from instance ID (e.g., "APP-1-OWN-2" -> appId=1, ownerId=2)
      const parts = instanceId.split('-');
      const appId = parseInt(parts[1]);
      const ownerId = parts.length > 3 ? parseInt(parts[3]) : null;
      
      // Call API to send reminder
      await sendReminder(appId, ownerId);
      
      // Notify parent
      if (onSendSuccess) {
        onSendSuccess();
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      // Could show error snackbar here
    } finally {
      setSendingMap(prev => ({ ...prev, [instanceId]: false }));
    }
  };
  
  // Get color based on severity
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return dashboardTheme.colors.severity.critical;
      case 'high': return dashboardTheme.colors.severity.high;
      case 'medium': return dashboardTheme.colors.severity.medium;
      case 'low': return dashboardTheme.colors.severity.low;
      default: return '#9E9E9E';
    }
  };
  
  return (
    <TableContainer component={Box} sx={{ height: '100%', width: '100%', minWidth: 0 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8f9fb' }}>
              Owner
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#f8f9fb' }} colSpan={4}>
              Vulnerabilities
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#f8f9fb' }} colSpan={4}>
              Delay (Days)
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#f8f9fb' }}>
              Last Reminded
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#f8f9fb', width: '120px' }}>
              Action
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ bgcolor: '#f8f9fb' }}></TableCell>
            
            {/* Vulnerability columns */}
            <TableCell align="center" sx={{ 
              bgcolor: '#f8f9fb', 
              color: dashboardTheme.colors.severity.critical,
              fontWeight: 'bold',
              fontSize: '0.75rem',
              width: '40px'
            }}>
              C
            </TableCell>
            <TableCell align="center" sx={{ 
              bgcolor: '#f8f9fb', 
              color: dashboardTheme.colors.severity.high,
              fontWeight: 'bold',
              fontSize: '0.75rem',
              width: '40px'
            }}>
              H
            </TableCell>
            <TableCell align="center" sx={{ 
              bgcolor: '#f8f9fb', 
              color: dashboardTheme.colors.severity.medium,
              fontWeight: 'bold',
              fontSize: '0.75rem',
              width: '40px'
            }}>
              M
            </TableCell>
            <TableCell align="center" sx={{ 
              bgcolor: '#f8f9fb', 
              color: dashboardTheme.colors.severity.low,
              fontWeight: 'bold',
              fontSize: '0.75rem',
              width: '40px'
            }}>
              L
            </TableCell>
            
            {/* Delay columns */}
            <TableCell align="center" sx={{ 
              bgcolor: '#f8f9fb', 
              color: dashboardTheme.colors.severity.critical,
              fontWeight: 'bold',
              fontSize: '0.75rem',
              width: '40px'
            }}>
              C
            </TableCell>
            <TableCell align="center" sx={{ 
              bgcolor: '#f8f9fb', 
              color: dashboardTheme.colors.severity.high,
              fontWeight: 'bold',
              fontSize: '0.75rem',
              width: '40px'
            }}>
              H
            </TableCell>
            <TableCell align="center" sx={{ 
              bgcolor: '#f8f9fb', 
              color: dashboardTheme.colors.severity.medium,
              fontWeight: 'bold',
              fontSize: '0.75rem',
              width: '40px'
            }}>
              M
            </TableCell>
            <TableCell align="center" sx={{ 
              bgcolor: '#f8f9fb', 
              color: dashboardTheme.colors.severity.low,
              fontWeight: 'bold',
              fontSize: '0.75rem',
              width: '40px'
            }}>
              L
            </TableCell>
            
            <TableCell align="center" sx={{ bgcolor: '#f8f9fb' }}></TableCell>
            <TableCell align="center" sx={{ bgcolor: '#f8f9fb' }}></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((instance) => {
            const isSending = sendingMap[instance.id];
            const maxDelay = instance.delay.max;
            
            return (
              <TableRow 
                key={instance.id}
                hover
                sx={{ 
                  '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 3px 5px rgba(0, 0, 0, 0.05)'
                  }
                }}
              >
                <TableCell sx={{ fontWeight: 'medium' }}>
                  {instance.owner}
                </TableCell>
                
                {/* Vulnerability counts */}
                <TableCell align="center" sx={{ 
                  color: instance.vulnerabilities.critical > 0 ? dashboardTheme.colors.severity.critical : 'text.disabled',
                  fontWeight: instance.vulnerabilities.critical > 0 ? 'bold' : 'normal'
                }}>
                  {instance.vulnerabilities.critical}
                </TableCell>
                <TableCell align="center" sx={{ 
                  color: instance.vulnerabilities.high > 0 ? dashboardTheme.colors.severity.high : 'text.disabled',
                  fontWeight: instance.vulnerabilities.high > 0 ? 'bold' : 'normal'
                }}>
                  {instance.vulnerabilities.high}
                </TableCell>
                <TableCell align="center" sx={{ 
                  color: instance.vulnerabilities.medium > 0 ? dashboardTheme.colors.severity.medium : 'text.disabled',
                  fontWeight: instance.vulnerabilities.medium > 0 ? 'bold' : 'normal'
                }}>
                  {instance.vulnerabilities.medium}
                </TableCell>
                <TableCell align="center" sx={{ 
                  color: instance.vulnerabilities.low > 0 ? dashboardTheme.colors.severity.low : 'text.disabled',
                  fontWeight: instance.vulnerabilities.low > 0 ? 'bold' : 'normal'
                }}>
                  {instance.vulnerabilities.low}
                </TableCell>
                
                {/* Delay days */}
                <TableCell align="center" sx={{ 
                  color: instance.delay.critical > 0 ? dashboardTheme.colors.severity.critical : 'text.disabled',
                  fontWeight: instance.delay.critical > 0 ? 'bold' : 'normal'
                }}>
                  {instance.delay.critical}
                </TableCell>
                <TableCell align="center" sx={{ 
                  color: instance.delay.high > 0 ? dashboardTheme.colors.severity.high : 'text.disabled',
                  fontWeight: instance.delay.high > 0 ? 'bold' : 'normal'
                }}>
                  {instance.delay.high}
                </TableCell>
                <TableCell align="center" sx={{ 
                  color: instance.delay.medium > 0 ? dashboardTheme.colors.severity.medium : 'text.disabled',
                  fontWeight: instance.delay.medium > 0 ? 'bold' : 'normal'
                }}>
                  {instance.delay.medium}
                </TableCell>
                <TableCell align="center" sx={{ 
                  color: instance.delay.low > 0 ? dashboardTheme.colors.severity.low : 'text.disabled',
                  fontWeight: instance.delay.low > 0 ? 'bold' : 'normal'
                }}>
                  {instance.delay.low}
                </TableCell>
                
                {/* Last reminded date */}
                <TableCell align="center">
                  {instance.lastReminded ? (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {instance.lastReminded}
                    </Typography>
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                      Never
                    </Typography>
                  )}
                </TableCell>
                
                {/* Action button */}
                <TableCell align="center">
                  <Button
                    variant="contained"
                    size="small"
                    color="secondary"
                    disabled={isSending}
                    startIcon={isSending ? null : (instance.lastReminded ? <DoneIcon /> : <SendIcon />)}
                    onClick={() => handleSendReminder(instance.id)}
                    sx={{
                      minWidth: 80,
                      background: instance.lastReminded ? '#F3E5F5' : 'linear-gradient(45deg, #9C27B0 30%, #AB47BC 90%)',
                      color: instance.lastReminded ? '#4A148C' : 'white',
                      boxShadow: instance.lastReminded ? 'none' : '0 2px 5px rgba(156, 39, 176, 0.3)',
                      transition: 'all 0.3s',
                      textTransform: 'none',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 8px rgba(156, 39, 176, 0.4)',
                        background: instance.lastReminded ? '#E1BEE7' : 'linear-gradient(45deg, #8E24AA 30%, #9C27B0 90%)',
                      }
                    }}
                  >
                    {isSending ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      instance.lastReminded ? 'Reminded' : 'Send'
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

export default ApplicationDetailsTable;