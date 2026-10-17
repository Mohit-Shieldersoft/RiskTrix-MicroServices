import React, { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, TablePagination, Chip, Tooltip, Box, Typography 
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import dashboardTheme from '../../../theme/dashboardTheme';

const VendorTrackerTable = ({ data }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
  
  return (
    <>
      <TableContainer sx={{ height: 'calc(100% - 52px)', overflow: 'auto' }}>
        <Table stickyHeader size="small" sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow>
              <TableCell 
                sx={{ 
                  fontWeight: dashboardTheme.typography.fontWeights.semibold,
                  backgroundColor: '#f8f9fb',
                }}
              >
                Name
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
                Compliant
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
                sx={{ 
                  fontWeight: dashboardTheme.typography.fontWeights.semibold,
                  backgroundColor: '#f8f9fb',
                }}
              >
                Audit Date
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: dashboardTheme.typography.fontWeights.semibold,
                  backgroundColor: '#f8f9fb',
                }}
              >
                Remarks
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(Array.isArray(data) ? data : [])
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((vendor) => (
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
                  <TableCell align="center" sx={{ fontWeight: 'medium', color: dashboardTheme.colors.success }}>
                    {vendor.compliantApps ?? vendor.compliant_apps ?? 0}
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
                        borderRadius: '4px',
                      }}
                    />
                  </TableCell>
                  <TableCell>{vendor.auditDate ?? vendor.audit_date ?? '—'}</TableCell>
                  <TableCell>
                    <Tooltip 
                      title={vendor.remarks}
                      arrow
                      placement="top-start"
                    >
                      <Typography
                        sx={{
                          maxWidth: 200,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {vendor.remarks}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                </TableRow>
            ))}
            
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No vendor data available
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        component="div"
        count={(Array.isArray(data) ? data : []).length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </>
  );
};

export default VendorTrackerTable;