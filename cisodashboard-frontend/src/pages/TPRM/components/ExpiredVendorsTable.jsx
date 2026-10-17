import React from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Typography, Box 
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { alpha } from '@mui/material/styles';
import dashboardTheme from '../../../theme/dashboardTheme';

const ExpiredVendorsTable = ({ data }) => {
  // Calculate days expired
  const getDaysExpired = (expiryDate) => {
    const today = new Date();
    // Accept either expiryDate or expiry_date
    const dateStr = expiryDate || '';
    const expiry = new Date(dateStr);
    if (Number.isNaN(expiry.getTime())) return 0; // invalid date -> treat as 0 days
    const diffTime = Math.abs(today - expiry);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  // Get color based on days expired
  const getExpiryColor = (days) => {
    if (days > 60) return dashboardTheme.colors.severity.critical;
    if (days > 30) return dashboardTheme.colors.severity.high;
    if (days > 15) return dashboardTheme.colors.severity.medium;
    return dashboardTheme.colors.severity.low;
  };
  
  return (
    <TableContainer sx={{ height: '100%' }}>
      <Table size="small" stickyHeader>
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
              Expiry Date
            </TableCell>
            <TableCell 
              align="right"
              sx={{ 
                fontWeight: dashboardTheme.typography.fontWeights.semibold,
                backgroundColor: '#f8f9fb',
              }}
            >
              Days
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(data || []).map((vendor) => {
            const expiryDate = vendor.expiryDate || vendor.expiry_date || null;
            const daysExpired = getDaysExpired(expiryDate);
            const expiryColor = getExpiryColor(daysExpired);
            
            return (
              <TableRow 
                key={vendor.id}
                hover
                sx={{ 
                  '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                  transition: 'all 0.2s',
                  borderLeft: `4px solid ${expiryColor}`,
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
                  {expiryDate || '—'}
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'flex-end',
                    color: expiryColor,
                    fontWeight: 'medium'
                  }}>
                    {daysExpired > 30 && <WarningAmberIcon fontSize="small" sx={{ mr: 0.5 }} />}
                    {daysExpired} days
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
          
          {(data || []).length === 0 && (
            <TableRow>
              <TableCell colSpan={3} sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No expired vendors
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