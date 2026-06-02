import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, Chip, Button, Box, Typography,
  IconButton, Tooltip, Dialog, DialogContent, DialogActions,
  DialogTitle, TextField, Alert, CircularProgress
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import UpdateIcon from '@mui/icons-material/Update';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CancelIcon from '@mui/icons-material/Cancel';
import exceptionApi from '../../../utils/exceptionApi';
import dashboardTheme from '../../../theme/dashboardTheme';
import { hasPermission } from '../../../utils/permissions';

const ExceptionTable = ({ data, onRefresh, loading = false }) => {
  const canUpdate = hasPermission('exceptions', 'update');
  const canCreate = hasPermission('exceptions', 'create');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedException, setSelectedException] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [remarksText, setRemarksText] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleUpdateClick = (exception) => {
    setSelectedException(exception);
    setRemarksText(exception.remarks);
    setUpdateError('');
    setIsUpdateModalOpen(true);
  };
  
  const handleUpdateSubmit = async () => {
    if (!selectedException) return;
    
    setUpdating(true);
    setUpdateError('');
    
    try {
      // Update the exception via API
      await exceptionApi.updateException(selectedException.id, {
        exception_name: selectedException.name,
        category: selectedException.category?.toLowerCase(),
        severity: selectedException.severity?.toLowerCase(),
        description: remarksText || selectedException.remarks,
        start_date: selectedException.startDate,
        end_date: selectedException.expiryDate,
        comments: remarksText,
        status: selectedException.status?.toLowerCase()
      });
      
      setIsUpdateModalOpen(false);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error updating exception:', error);
      setUpdateError('Failed to update exception. Please try again.');
    } finally {
      setUpdating(false);
    }
  };
  
  const handleUploadPOC = (exceptionId) => {
    // In a real app, you would open a file picker and upload
    console.log("Uploading POC for exception:", exceptionId);
  };
  
  const handleDownloadPOC = (documentName) => {
    // In a real app, you would trigger a download
    console.log("Downloading POC document:", documentName);
  };
  
  // Get color based on risk level
  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Critical': return dashboardTheme.colors.severity.critical;
      case 'High': return dashboardTheme.colors.severity.high;
      case 'Medium': return dashboardTheme.colors.severity.medium;
      case 'Low': return dashboardTheme.colors.severity.low;
      default: return dashboardTheme.colors.info;
    }
  };
  
  // Get color based on approval status
  const getApprovalStatusProps = (status) => {
    switch (status) {
      case 'Approved':
        return { 
          color: dashboardTheme.colors.success,
          icon: <TaskAltIcon fontSize="small" sx={{ mr: 0.5 }} />
        };
      case 'Rejected':
        return { 
          color: dashboardTheme.colors.error,
          icon: <CancelIcon fontSize="small" sx={{ mr: 0.5 }} />
        };
      case 'In Progress':
        return { 
          color: dashboardTheme.colors.warning,
          icon: <HourglassEmptyIcon fontSize="small" sx={{ mr: 0.5 }} />
        };
      default:
        return { 
          color: dashboardTheme.colors.info,
          icon: null
        };
    }
  };
  
  return (
    <>
      <TableContainer sx={{ maxHeight: '60vh' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell 
                sx={{ 
                  fontWeight: dashboardTheme.typography.fontWeights.semibold,
                  backgroundColor:  '#f8f9fb',
                  whiteSpace: 'nowrap'
                }}
              >
                Exception ID
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: dashboardTheme.typography.fontWeights.semibold,
                  backgroundColor:  '#f8f9fb',
                }}
              >
                Name
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: dashboardTheme.typography.fontWeights.semibold,
                  backgroundColor:  '#f8f9fb',
                }}
              >
                Remarks
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: dashboardTheme.typography.fontWeights.semibold,
                  backgroundColor:  '#f8f9fb',
                  whiteSpace: 'nowrap'
                }}
              >
                Date Started
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: dashboardTheme.typography.fontWeights.semibold,
                  backgroundColor:  '#f8f9fb',
                  whiteSpace: 'nowrap'
                }}
              >
                Expiry
              </TableCell>
              <TableCell 
                align="center"
                sx={{ 
                  fontWeight: dashboardTheme.typography.fontWeights.semibold,
                  backgroundColor:  '#f8f9fb',
                }}
              >
                Risk
              </TableCell>
              <TableCell 
                align="center"
                sx={{ 
                  fontWeight: dashboardTheme.typography.fontWeights.semibold,
                  backgroundColor:  '#f8f9fb',
                }}
              >
                Status
              </TableCell>
              <TableCell 
                align="center"
                sx={{ 
                  fontWeight: dashboardTheme.typography.fontWeights.semibold,
                  backgroundColor:  '#f8f9fb',
                }}
              >
                Approval POC
              </TableCell>
              <TableCell 
                align="center"
                sx={{ 
                  fontWeight: dashboardTheme.typography.fontWeights.semibold,
                  backgroundColor:  '#f8f9fb',
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((exception) => {
                const riskColor = getRiskColor(exception.risk);
                const statusProps = getApprovalStatusProps(exception.approvalStatus);
                const isExpired = exception.isExpired;
                
                return (
                  <TableRow 
                    key={exception.id}
                    hover
                    sx={{ 
                      '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                      transition: 'all 0.2s',
                      borderLeft: `4px solid ${riskColor}`,
                      opacity: isExpired ? 0.8 : 1,
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 3px 5px rgba(0, 0, 0, 0.05)'
                      }
                    }}
                  >
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                      {exception.id}
                    </TableCell>
                    
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      {exception.name}
                      {isExpired && (
                        <Chip 
                          label="EXPIRED" 
                          size="small" 
                          sx={{ 
                            ml: 1, 
                            backgroundColor: `${dashboardTheme.colors.error}15`,
                            color: dashboardTheme.colors.error,
                            fontWeight: 'bold',
                            fontSize: '0.6rem'
                          }} 
                        />
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Tooltip title={exception.remarks}>
                        <Typography
                          sx={{
                            maxWidth: 250,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {exception.remarks}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    
                    <TableCell>
                      {exception.startDate}
                    </TableCell>
                    
                    <TableCell>
                      {exception.expiryDate}
                    </TableCell>
                    
                    <TableCell align="center">
                      <Chip 
                        label={exception.risk}
                        size="small"
                        sx={{
                          backgroundColor: `${riskColor}20`,
                          color: riskColor,
                          fontWeight: 'medium',
                          minWidth: '70px'
                        }}
                      />
                    </TableCell>
                    
                    <TableCell align="center">
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: statusProps.color
                      }}>
                        {statusProps.icon}
                        <Typography 
                          sx={{ 
                            fontWeight: 'medium',
                            color: statusProps.color
                          }}
                        >
                          {exception.approvalStatus}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell align="center">
                      {exception.pocDocument ? (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownloadPOC(exception.pocDocument)}
                          sx={{
                            borderColor: dashboardTheme.colors.info,
                            color: dashboardTheme.colors.info,
                            '&:hover': {
                              borderColor: dashboardTheme.colors.info,
                              backgroundColor: `${dashboardTheme.colors.info}10`,
                            }
                          }}
                        >
                          Download
                        </Button>
                      ) : canCreate ? (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<FileUploadIcon />}
                          onClick={() => handleUploadPOC(exception.id)}
                          sx={{
                            borderColor: dashboardTheme.colors.warning,
                            color: dashboardTheme.colors.warning,
                            '&:hover': {
                              borderColor: dashboardTheme.colors.warning,
                              backgroundColor: `${dashboardTheme.colors.warning}10`,
                            }
                          }}
                        >
                          Upload
                        </Button>
                      ) : null}
                    </TableCell>
                    
                    <TableCell align="center">
                      {canUpdate && (
                        <IconButton
                          color="primary"
                          onClick={() => handleUpdateClick(exception)}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(63, 81, 181, 0.1)',
                            '&:hover': {
                              backgroundColor: 'rgba(63, 81, 181, 0.2)',
                            }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            
            {data.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={9} sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No exceptions found
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            
            {loading && (
              <TableRow>
                <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                  <CircularProgress size={30} />
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                    Loading exceptions...
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
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />
      
      {/* Update Exception Dialog */}
      <Dialog 
        open={isUpdateModalOpen} 
        onClose={() => setIsUpdateModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: dashboardTheme.borderRadius.lg }
        }}
      >
        <DialogTitle sx={{ bgcolor: dashboardTheme.colors.background.card, p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Update Exception
          </Typography>
          <IconButton
            onClick={() => setIsUpdateModalOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2, p: 3 }}>
          {updateError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {updateError}
            </Alert>
          )}
          
          {selectedException && (
            <Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  Exception ID
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 'medium' }}>
                  {selectedException.id}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  Exception Name
                </Typography>
                <Typography variant="body1">
                  {selectedException.name}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  Remarks
                </Typography>
                <TextField
                  multiline
                  rows={4}
                  value={remarksText}
                  onChange={(e) => setRemarksText(e.target.value)}
                  fullWidth
                  variant="outlined"
                  disabled={updating}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          <Button 
            onClick={() => setIsUpdateModalOpen(false)} 
            variant="outlined"
            disabled={updating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateSubmit}
            variant="contained"
            color="primary"
            disabled={updating}
            startIcon={updating ? <CircularProgress size={20} /> : <UpdateIcon />}
            sx={{ 
              background: 'linear-gradient(45deg, #512DA8 30%, #673AB7 90%)',
              boxShadow: '0 3px 5px 2px rgba(103, 58, 183, .3)',
            }}
          >
            {updating ? 'Updating...' : 'Update Exception'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ExceptionTable;