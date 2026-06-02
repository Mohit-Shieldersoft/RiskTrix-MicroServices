import React, { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, TablePagination, Chip, Button, Box, Typography 
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import WarningIcon from '@mui/icons-material/Warning';
import dashboardTheme from '../../../theme/dashboardTheme';
import { sendVendorNotification } from '../../../utils/tprmApi';

const DelayTrackerTable = ({ data }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sentNotifications, setSentNotifications] = useState([]);
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleSendNotification = async (id) => {
    // Extract numeric vendor ID from "VEN-XXX" format
    const vendorId = parseInt(id.split('-')[1]);
    
    setSentNotifications(prev => [...prev, id]);
    
    try {
      // Call API to send notification
      await sendVendorNotification(vendorId, 'Please address the delayed compliance issues');
      console.log(`Notification sent to vendor ${id}`);
      
      // Remove notification status after 3 seconds
      setTimeout(() => {
        setSentNotifications(prev => prev.filter(itemId => itemId !== id));
      }, 3000);
    } catch (error) {
      console.error('Failed to send notification:', error);
      // Remove from sent list on error
      setSentNotifications(prev => prev.filter(itemId => itemId !== id));
    }
  };
  
  // Get color based on risk level
  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Critical': return dashboardTheme.colors.severity.critical;
      case 'High': return dashboardTheme.colors.severity.high;
      case 'Medium': return dashboardTheme.colors.severity.medium;
      case 'Low': return dashboardTheme.colors.severity.low;
      default: return dashboardTheme.colors.success;
    }
  };
  
  // Get color and icon for delay alerts
  const getDelayAlert = (days) => {
    if (days > 60) return { 
      color: dashboardTheme.colors.severity.critical,
      icon: <WarningIcon fontSize="small" sx={{ mr: 0.5 }} /> 
    };
    if (days > 30) return { 
      color: dashboardTheme.colors.severity.high,
      icon: <WarningIcon fontSize="small" sx={{ mr: 0.5 }} />  
    };
    if (days > 15) return { 
      color: dashboardTheme.colors.severity.medium,
      icon: null
    };
    return { 
      color: dashboardTheme.colors.severity.low,
      icon: null
    };
  };
  
  return (
    <>
      <TableContainer sx={{ height: 'calc(100% - 52px)', overflow: 'auto' }}>
        <Table stickyHeader size="small" sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell 
                sx={{ 
                  fontWeight: dashboardTheme.typography.fontWeights.semibold,
                  backgroundColor: '#f8f9fb',
                }}
              >
                Vendor
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: dashboardTheme.typography.fontWeights.semibold,
                  backgroundColor: '#f8f9fb',
                }}
              >
                Category
              </TableCell>
              <TableCell 
                align="center"
                sx={{ 
                  fontWeight: dashboardTheme.typography.fontWeights.semibold,
                  backgroundColor: '#f8f9fb',
                }}
              >
                Expiry Date
              </TableCell>
              <TableCell 
                align="center"
                sx={{ 
                  fontWeight: dashboardTheme.typography.fontWeights.semibold,
                  backgroundColor: '#f8f9fb',
                }}
              >
                Non-Compliant
              </TableCell>
              <TableCell 
                align="center"
                sx={{ 
                  fontWeight: dashboardTheme.typography.fontWeights.semibold,
                  backgroundColor: '#f8f9fb',
                }}
              >
                Risk
              </TableCell>
              <TableCell 
                align="center"
                sx={{ 
                  fontWeight: dashboardTheme.typography.fontWeights.semibold,
                  backgroundColor: '#f8f9fb',
                }}
              >
                Delay (Days)
              </TableCell>
              <TableCell 
                align="center"
                sx={{ 
                  fontWeight: dashboardTheme.typography.fontWeights.semibold,
                  backgroundColor: '#f8f9fb',
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data || [])
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((vendor) => {
                // Support multiple field names: delayDays, delay, days_until_expiry
                const delayDays = vendor.delayDays ?? vendor.delay ?? vendor.days_until_expiry ?? 0;
                const delayAlert = getDelayAlert(delayDays);
                const isSent = sentNotifications.includes(vendor.id);
                
                return (
                  <TableRow 
                    key={vendor.id}
                    hover
                    sx={{ 
                      '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                      transition: 'all 0.2s',
                      borderLeft: `4px solid ${getRiskColor(vendor.risk)}`,
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 3px 5px rgba(0, 0, 0, 0.05)'
                      }
                    }}
                  >
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      {vendor.name}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={vendor.category}
                        size="small"
                        sx={{ 
                          fontSize: '0.75rem',
                          backgroundColor: 'rgba(0, 0, 0, 0.08)',
                          color: 'text.primary'
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'medium' }}>
                      {vendor.expiry_date || vendor.expiryDate || 'N/A'}
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'medium', color: dashboardTheme.colors.error }}>
                      {vendor.nonCompliantApps ?? vendor.non_compliant_apps ?? 0}
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={vendor.risk}
                        size="small"
                        sx={{
                          backgroundColor: `${getRiskColor(vendor.risk)}20`,
                          color: getRiskColor(vendor.risk),
                          fontWeight: 'medium',
                          minWidth: '70px',
                          borderRadius: '4px'
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: delayAlert.color,
                        fontWeight: 'medium'
                      }}>
                        {delayAlert.icon}
                        {delayDays} days
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        size="small"
                        disabled={isSent}
                        startIcon={<SendIcon />}
                        onClick={() => handleSendNotification(vendor.id)}
                        sx={{
                          background: isSent ? '#A5D6A7' : 'linear-gradient(45deg, #3949ab 30%, #1e88e5 90%)',
                          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.2s',
                          textTransform: 'none',
                          minWidth: '100px',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)'
                          }
                        }}
                      >
                        {isSent ? 'Sent' : 'Send'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No delayed vendors
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        component="div"
        count={data.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </>
  );
};

export default DelayTrackerTable;