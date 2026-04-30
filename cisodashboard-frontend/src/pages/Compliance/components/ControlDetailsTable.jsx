import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Box, Typography, Checkbox, Button, IconButton, TextField,
  CircularProgress, Tooltip, MenuItem, Select, FormControl, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpIcon from '@mui/icons-material/Help';
import dashboardTheme from '../../../theme/dashboardTheme';

const ControlDetailsTable = ({ controls, onUpdate, selectedStandard }) => {
  const [localControls, setLocalControls] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Initialize local state when controls change
  useEffect(() => {
    setLocalControls(controls || []);
    setHasChanges(false);
  }, [controls]);
  
  // Handle compliance checkbox change
  const handleCompliantChange = (controlId, value) => {
    const updatedControls = localControls.map(control => {
      if (control.id === controlId) {
        return { ...control, compliant: value };
      }
      return control;
    });
    
    setLocalControls(updatedControls);
    setHasChanges(true);
  };
  
  // Handle remark change
  const handleRemarkChange = (controlId, value) => {
    const updatedControls = localControls.map(control => {
      if (control.id === controlId) {
        return { ...control, remark: value };
      }
      return control;
    });
    
    setLocalControls(updatedControls);
    setHasChanges(true);
  };
  
  // Handle POC upload
  const handleUploadPOC = (controlId) => {
    // In a real app, you would open a file picker and upload
    console.log("Uploading POC for control:", controlId);
    
    // Simulate successful upload
    setTimeout(() => {
      const updatedControls = localControls.map(control => {
        if (control.id === controlId) {
          return { 
            ...control, 
            poc: `poc_${control.section}_${control.id.replace('.', '_')}.pdf` 
          };
        }
        return control;
      });
      
      setLocalControls(updatedControls);
      setHasChanges(true);
    }, 500);
  };
  
  // Handle POC download
  const handleDownloadPOC = (poc) => {
    // In a real app, you would download the file
    console.log("Downloading POC:", poc);
  };
  
  // Handle save changes
  const handleSaveChanges = () => {
    if (!hasChanges) return;
    
    setSaving(true);
    
    // Simulate API call delay
    setTimeout(() => {
      if (onUpdate) {
        onUpdate(localControls);
      }
      
      setSaving(false);
      setHasChanges(false);
    }, 1000);
  };
  
  // If no controls available
  if (!controls || controls.length === 0) {
    return (
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        p: 3 
      }}>
        <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1, color: 'text.secondary' }}>
          Select a control section to view details
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
          Click on any section from the Control List to view and update compliance status
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TableContainer sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Table size="small" stickyHeader sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8f9fb', width: '70px', minWidth: '70px' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8f9fb', width: '200px', maxWidth: '200px' }}>Control Statement</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8f9fb', width: '150px', maxWidth: '150px' }}>Remarks</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8f9fb', width: '180px', minWidth: '180px', whiteSpace: 'nowrap' }}>Implementation Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#f8f9fb', width: '100px', minWidth: '100px' }}>POC</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#f8f9fb', width: '100px', minWidth: '100px' }}>Compliant</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {localControls.map((control) => (
              <TableRow 
                key={control.id}
                hover
                sx={{ 
                  '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                  borderLeft: control.compliant ? 
                    '4px solid #4CAF50' : '4px solid #F44336',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)'
                  }
                }}
              >
                <TableCell sx={{ width: '70px', minWidth: '70px' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.813rem' }}>
                    {control.id}
                  </Typography>
                </TableCell>
                <TableCell sx={{ 
                  width: '200px', 
                  maxWidth: '200px',
                  wordWrap: 'break-word',
                  whiteSpace: 'normal'
                }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontSize: '0.813rem',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    title={control.statement}
                  >
                    {control.statement}
                  </Typography>
                </TableCell>
                <TableCell sx={{ 
                  width: '150px', 
                  maxWidth: '150px'
                }}>
                  <TextField
                    fullWidth
                    multiline
                    size="small"
                    rows={1}
                    value={control.remark || ''}
                    onChange={(e) => handleRemarkChange(control.id, e.target.value)}
                    variant="outlined"
                    placeholder="Add remarks..."
                    InputProps={{
                      sx: { fontSize: '0.813rem' }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <FormControl fullWidth size="small">
                    <Select
                      value={control.status || ""}
                      onChange={(e) => {
                        // Update the control status
                        const updatedControl = { 
                          ...control, 
                          status: e.target.value,
                          // Automatically update compliance based on status
                          compliant: e.target.value === 'implemented'
                        };
                        onUpdate([updatedControl]);
                      }}
                      displayEmpty
                      renderValue={(value) => {
                        if (!value) {
                          return <span style={{ color: 'text.secondary', fontSize: '0.85rem' }}>Set status</span>;
                        }
                        
                        // Return appropriate chip based on status
                        switch(value) {
                          case 'implemented':
                            return (
                              <Chip
                                icon={<CheckCircleIcon sx={{ fontSize: '16px' }} />}
                                label="Implemented"
                                size="small"
                                sx={{ 
                                  bgcolor: 'rgba(76, 175, 80, 0.1)', 
                                  color: '#2e7d32',
                                  fontWeight: 500,
                                  '& .MuiChip-icon': { color: '#2e7d32' }
                                }}
                              />
                            );
                          case 'notImplemented':
                            return (
                              <Chip
                                icon={<CancelIcon sx={{ fontSize: '16px' }} />}
                                label="Not Implemented"
                                size="small"
                                sx={{ 
                                  bgcolor: 'rgba(244, 67, 54, 0.1)', 
                                  color: '#d32f2f',
                                  fontWeight: 500,
                                  '& .MuiChip-icon': { color: '#d32f2f' }
                                }}
                              />
                            );
                          case 'notApplicable':
                            return (
                              <Chip
                                icon={<HelpIcon sx={{ fontSize: '16px' }} />}
                                label="Not Applicable"
                                size="small"
                                sx={{ 
                                  bgcolor: 'rgba(158, 158, 158, 0.1)', 
                                  color: '#616161',
                                  fontWeight: 500,
                                  '& .MuiChip-icon': { color: '#616161' }
                                }}
                              />
                            );
                          default:
                            return <span>{value}</span>;
                        }
                      }}
                      sx={{
                        '& .MuiSelect-select': {
                          padding: '4px 8px',
                          display: 'flex',
                          alignItems: 'center'
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(0, 0, 0, 0.1)'
                        },
                        borderRadius: 1,
                        minWidth: 160,
                        fontSize: '0.85rem'
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            maxHeight: 200,
                            '& .MuiMenuItem-root': {
                              fontSize: '0.85rem',
                              padding: '6px 16px'
                            }
                          }
                        }
                      }}
                    >
                      <MenuItem value="">
                        <em>Select status</em>
                      </MenuItem>
                      <MenuItem value="implemented">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircleIcon sx={{ fontSize: '16px', color: '#2e7d32' }} />
                          <Typography variant="body2">Implemented</Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value="notImplemented">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CancelIcon sx={{ fontSize: '16px', color: '#d32f2f' }} />
                          <Typography variant="body2">Not Implemented</Typography>
                        </Box>
                      </MenuItem>
                      <MenuItem value="notApplicable">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <HelpIcon sx={{ fontSize: '16px', color: '#616161' }} />
                          <Typography variant="body2">Not Applicable</Typography>
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell align="center">
                  {control.poc ? (
                    <Tooltip title="Download POC">
                      <IconButton 
                        size="small"
                        onClick={() => handleDownloadPOC(control.poc)}
                        sx={{ 
                          bgcolor: 'rgba(0, 121, 107, 0.1)',
                          color: dashboardTheme.colors.primary,
                          '&:hover': {
                            bgcolor: 'rgba(0, 121, 107, 0.2)'
                          }
                        }}
                      >
                        <FileDownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Upload POC">
                      <IconButton 
                        size="small"
                        onClick={() => handleUploadPOC(control.id)}
                        sx={{ 
                          bgcolor: 'rgba(0, 0, 0, 0.05)',
                          color: 'text.secondary',
                          '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.1)'
                          }
                        }}
                      >
                        <CloudUploadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell align="center">
                  <Checkbox
                    checked={control.compliant}
                    onChange={(e) => handleCompliantChange(control.id, e.target.checked)}
                    color="primary"
                    sx={{
                      color: control.compliant ? '#4CAF50' : '#F44336',
                      '&.Mui-checked': {
                        color: '#4CAF50',
                      }
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Save Changes Button */}
      <Box 
        sx={{ 
          p: 2, 
          borderTop: '1px solid rgba(0, 0, 0, 0.12)',
          display: 'flex',
          justifyContent: 'flex-end',
          bgcolor: hasChanges ? 'rgba(0, 121, 107, 0.05)' : 'transparent',
          transition: 'background-color 0.3s'
        }}
      >
        <Button
          variant="contained"
          color="primary"
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={handleSaveChanges}
          disabled={!hasChanges || saving}
          sx={{
            background: 'linear-gradient(45deg, #00796B 30%, #009688 90%)',
            boxShadow: '0 3px 5px rgba(0, 121, 107, 0.3)',
            transition: 'all 0.3s',
            '&:hover': {
              boxShadow: '0 4px 10px rgba(0, 121, 107, 0.4)',
              transform: 'translateY(-1px)'
            },
            '&.Mui-disabled': {
              background: 'rgba(0, 0, 0, 0.12)'
            }
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>
    </Box>
  );
};

export default ControlDetailsTable;