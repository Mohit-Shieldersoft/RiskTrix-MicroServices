import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Button, InputAdornment, Divider, CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import DoneIcon from '@mui/icons-material/Done';
import { alpha } from '@mui/material/styles';
import dashboardTheme from '../../../theme/dashboardTheme';
import Toast from '../../../components/common/Toast';
import { useToast } from '../../../components/common/useToast';
import { sendVendorNotification } from '../../../utils/tprmApi';

const VendorReminders = ({ data, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [sendingMap, setSendingMap] = useState({});
  const { toast, showToast, closeToast } = useToast();
  
  // Filter data based on search
  useEffect(() => {
    if (!data) return;
    
    const filtered = data.filter(item => 
      item.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
  }, [data, searchTerm]);
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleSendReminder = async (id) => {
    const vendorId = Number(String(id).replace(/\D/g, "")) || id;
    setSendingMap(prev => ({ ...prev, [id]: true }));
    try {
      await sendVendorNotification(vendorId, "RiskTrix vendor reminder");
      showToast("Reminder sent", "success");
    } catch (err) {
      showToast(err?.detail || err?.message || "Reminder could not be sent (SMTP required)", "error");
    } finally {
      setSendingMap(prev => ({ ...prev, [id]: false }));
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
    <Paper 
      elevation={0}
      className="futuristic-card"
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0
      }}
    >
      <Box sx={{ 
        p: 2,
        bgcolor: '#F0F2F5',
        borderBottom: '1px solid rgba(0,0,0,0.05)'
      }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 'medium',
          color: '#3F51B5',
          display: 'flex',
          alignItems: 'center',
          mb: 2
        }}>
          <Box 
            sx={{ 
              width: 14, 
              height: 14, 
              borderRadius: '50%', 
              backgroundColor: '#4CAF50',
              mr: 1,
              animation: 'pulse 2s infinite'
            }} 
          />
          Vendor Reminders
        </Typography>
        
        <TextField
          fullWidth
          placeholder="Search vendors..."
          value={searchTerm}
          onChange={handleSearch}
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }}/>
              </InputAdornment>
            ),
            sx: {
              borderRadius: 2,
              bgcolor: '#fff',
              '&:hover': {
                bgcolor: '#fff',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(0, 0, 0, 0.1)',
              },
              transition: 'all 0.3s',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#3F51B5',
              },
            }
          }}
          sx={{ 
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#3F51B5',
                borderWidth: 1,
              },
            }
          }}
        />
      </Box>
      
      <Divider />
      
      <Box sx={{ 
        flexGrow: 1,
        overflow: 'auto',
        position: 'relative'
      }}>
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '100%'
          }}>
            <CircularProgress size={40} sx={{ color: '#3F51B5' }} />
          </Box>
        ) : (
          filteredData.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              height: '100%',
              p: 3
            }}>
              <Typography variant="body2" color="text.secondary" align="center">
                {searchTerm ? 'No vendors match your search' : 'No vendor reminders available'}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Box} sx={{ height: '100%' }}>
              <Table stickyHeader size="small">
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
                      align="center"
                      sx={{ 
                        fontWeight: dashboardTheme.typography.fontWeights.semibold,
                        backgroundColor: '#f8f9fb'
                      }}
                    >
                      NC
                    </TableCell>
                    <TableCell 
                      align="center"
                      sx={{ 
                        fontWeight: dashboardTheme.typography.fontWeights.semibold,
                        backgroundColor: '#f8f9fb',
                      }}
                    >
                      Delay
                    </TableCell>
                    <TableCell 
                      align="center"
                      sx={{ 
                        fontWeight: dashboardTheme.typography.fontWeights.semibold,
                        backgroundColor: '#f8f9fb',
                      }}
                    >
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.map((item) => {
                    const delayColor = getDelayColor(item.delayDays);
                    const isSending = sendingMap[item.id];
                    
                    return (
                      <TableRow 
                        key={item.id}
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
                          {item.vendorName}
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'medium', color: '#F44336' }}>
                          {item.nonCompliantApps}
                        </TableCell>
                        <TableCell 
                          align="center" 
                          sx={{ 
                            fontWeight: 'medium', 
                            color: delayColor
                          }}
                        >
                          {item.delayDays} days
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            disabled={isSending}
                            startIcon={isSending ? null : (item.sentCount > 0 ? <DoneIcon /> : <SendIcon />)}
                            onClick={() => handleSendReminder(item.id)}
                            sx={{
                              minWidth: 100,
                              background: item.sentCount > 0 ? '#A5D6A7' : 'linear-gradient(45deg, #3F51B5 30%, #536DFE 90%)',
                              color: item.sentCount > 0 ? '#1B5E20' : 'white',
                              boxShadow: item.sentCount > 0 ? 'none' : '0 2px 5px rgba(63, 81, 181, 0.3)',
                              transition: 'all 0.3s',
                              textTransform: 'none',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 8px rgba(63, 81, 181, 0.4)',
                                background: item.sentCount > 0 ? '#81C784' : 'linear-gradient(45deg, #3949AB 30%, #3F51B5 90%)',
                              }
                            }}
                          >
                            {isSending ? (
                              <CircularProgress size={20} color="inherit" />
                            ) : (
                              item.sentCount > 0 ? `Sent (${item.sentCount})` : 'Send'
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )
        )}
      </Box>
      
      {/* Toast for notifications */}
      <Toast toast={toast} onClose={closeToast} />
    </Paper>
  );
};

export default VendorReminders;