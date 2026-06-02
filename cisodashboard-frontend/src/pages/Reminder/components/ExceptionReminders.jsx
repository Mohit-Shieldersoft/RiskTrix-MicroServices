import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Button, InputAdornment, Divider, CircularProgress,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import DoneIcon from '@mui/icons-material/Done';
import { alpha } from '@mui/material/styles';
import dashboardTheme from '../../../theme/dashboardTheme';
import reminderApi from '../../../utils/reminderApi';
import Toast from '../../../components/common/Toast';
import { useToast } from '../../../components/common/useToast';

const ExceptionReminders = ({ data, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [sendingMap, setSendingMap] = useState({});
  const { toast, showToast, closeToast } = useToast();
  
  // Filter data based on search
  useEffect(() => {
    if (!data) return;
    
    const filtered = data.filter(item => 
      item.exceptionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.remark.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(filtered);
  }, [data, searchTerm]);
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleSendReminder = async (id) => {
    // Set sending state
    setSendingMap(prev => ({ ...prev, [id]: true }));

    // Try to map to a numeric targetId when possible (mock IDs are like ER-1)
    const item = filteredData.find(x => x.id === id) || {};
    let targetId = item.exceptionId ?? item.id;
    if (typeof targetId === 'string') {
      const m = targetId.match(/(\d+)$/);
      if (m) targetId = parseInt(m[1], 10);
    }

    // call backend API
    try {
      await reminderApi.sendReminder({ targetType: 'exception', targetId });
      showToast('Exception reminder sent successfully', 'success');
      // increment sentCount locally
      setFilteredData(prev => prev.map(it => it.id === id ? { ...it, sentCount: (it.sentCount || 0) + 1 } : it));
    } catch (err) {
      console.error('Error sending exception reminder', err);
      showToast('Failed to send exception reminder', 'error');
    } finally {
      setSendingMap(prev => ({ ...prev, [id]: false }));
    }
  };
  
  // Toast
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
          color: '#F44336',
          display: 'flex',
          alignItems: 'center',
          mb: 2
        }}>
          <Box 
            sx={{ 
              width: 14, 
              height: 14, 
              borderRadius: '50%', 
              backgroundColor: '#F44336',
              mr: 1,
              animation: 'pulse 2s infinite'
            }} 
          />
          Exception Reminders
        </Typography>
        
        <TextField
          fullWidth
          placeholder="Search exceptions..."
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
                borderColor: '#F44336',
              },
            }
          }}
          sx={{ 
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#F44336',
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
            <CircularProgress size={40} sx={{ color: '#F44336' }} />
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
                {searchTerm ? 'No exceptions match your search' : 'No exception reminders available'}
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
                        width: '40%'
                      }}
                    >
                      Exception
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontWeight: dashboardTheme.typography.fontWeights.semibold,
                        backgroundColor: '#f8f9fb',
                      }}
                    >
                      Remark
                    </TableCell>
                    <TableCell 
                      align="center"
                      sx={{ 
                        fontWeight: dashboardTheme.typography.fontWeights.semibold,
                        backgroundColor: '#f8f9fb',
                        width: '100px'
                      }}
                    >
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.map((item) => {
                    const isSending = sendingMap[item.id];
                    
                    return (
                      <TableRow 
                        key={item.id}
                        hover
                        sx={{ 
                          '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                          transition: 'all 0.2s',
                          borderLeft: '3px solid #F44336',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 3px 5px rgba(0, 0, 0, 0.05)'
                          }
                        }}
                      >
                        <TableCell sx={{ fontWeight: 'medium' }}>
                          {item.exceptionType}
                        </TableCell>
                        <TableCell>
                          <Tooltip title={item.remark} placement="top">
                            <Typography
                              variant="body2"
                              sx={{
                                maxWidth: '150px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {item.remark}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            variant="contained"
                            size="small"
                            color="error"
                            disabled={isSending}
                            startIcon={isSending ? null : (item.sentCount > 0 ? <DoneIcon /> : <SendIcon />)}
                            onClick={() => handleSendReminder(item.id)}
                            sx={{
                              minWidth: 100,
                              background: item.sentCount > 0 ? '#FFCDD2' : 'linear-gradient(45deg, #F44336 30%, #EF5350 90%)',
                              color: item.sentCount > 0 ? '#B71C1C' : 'white',
                              boxShadow: item.sentCount > 0 ? 'none' : '0 2px 5px rgba(244, 67, 54, 0.3)',
                              transition: 'all 0.3s',
                              textTransform: 'none',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: '0 4px 8px rgba(244, 67, 54, 0.4)',
                                background: item.sentCount > 0 ? '#EF9A9A' : 'linear-gradient(45deg, #E53935 30%, #F44336 90%)',
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

export default ExceptionReminders;