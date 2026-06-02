import React from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Typography, Box 
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import { alpha } from '@mui/material/styles';
import dashboardTheme from '../../../theme/dashboardTheme';

const ExpiredVendorsTable = ({ data }) => {
  if (!data) return (
    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="body2" color="text.secondary">Loading data...</Typography>
    </Box>
  );
  
  // Calculate days since expiry
  const calculateDaysSinceExpiry = (expiryDate) => {
    const today = new Date('2025-04-08');
    const expiry = new Date(expiryDate);
    const diffTime = Math.abs(today - expiry);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  // Get color based on days expired
  const getExpiryColor = (days) => {
    if (days > 30) return dashboardTheme.colors.severity.critical;
    if (days > 15) return dashboardTheme.colors.severity.high;
    if (days > 7) return dashboardTheme.colors.severity.medium;
    return dashboardTheme.colors.severity.low;
  };
  
  return (
    <TableContainer sx={{ height: '100%', minHeight: 0, display: 'block' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell 
              sx={{ 
                fontWeight: dashboardTheme.typography.fontWeights.semibold,
                backgroundColor:'#f8f9fb',
              }}
            >
              Vendor
            </TableCell>
            <TableCell 
              sx={{ 
                fontWeight: dashboardTheme.typography.fontWeights.semibold,
                backgroundColor: '#f8f9fb',
              }}
              align="right"
            >
              Expired
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((vendor, index) => {
            const daysSinceExpiry = calculateDaysSinceExpiry(vendor.expiryDate);
            const expiryColor = getExpiryColor(daysSinceExpiry);
            
            return (
              <TableRow 
                key={index}
                hover
                sx={{ 
                  '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                  transition: 'all 0.2s',
                  borderLeft: `3px solid ${expiryColor}`,
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
                <TableCell align="right">
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end',
                    alignItems: 'center', 
                    color: expiryColor 
                  }}>
                    {daysSinceExpiry > 15 && <WarningIcon fontSize="small" sx={{ mr: 0.5 }} />}
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {vendor.expiryDate} 
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={2} align="center">
                <Typography variant="body2" sx={{ py: 2, color: 'text.secondary' }}>
                  No expired vendors found
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ExpiredVendorsTable;