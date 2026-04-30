import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Box, Typography, Button, Chip, TextField, InputAdornment,
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import DoneIcon from '@mui/icons-material/Done';
import AlarmIcon from '@mui/icons-material/Alarm';
import ErrorIcon from '@mui/icons-material/Error';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import dashboardTheme from '../../../theme/dashboardTheme';
import Toast from '../../../components/common/Toast';
import { useToast } from '../../../components/common/useToast';

const EOSLTable = ({ data, loading }) => {
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingMap, setSendingMap] = useState({});
  const { toast, showToast, closeToast } = useToast();
  
  // Filter data based on search term
  useEffect(() => {
    if (!data || !Array.isArray(data)) {
      setFilteredData([]);
      return;
    }
    
    const filtered = data.filter(asset => 
      (asset.owner && asset.owner.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (asset.assetName && asset.assetName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (asset.eoslType && asset.eoslType.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    setFilteredData(filtered);
  }, [data, searchTerm]);
  
  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle sending reminder
  const handleSendReminder = (assetId) => {
    // Set sending state
    setSendingMap(prev => ({ ...prev, [assetId]: true }));
    
    // Simulate API call
    setTimeout(() => {
      setSendingMap(prev => ({ ...prev, [assetId]: false }));
      
      // Show success message
      showToast('Reminder sent successfully', 'success');
    }, 1500);
  };
  
  // Get color based on EOSL type
  const getEOSLColor = (type) => {
    switch (type) {
      case 'EOS': return '#E57373';
      case 'EOL': return '#F44336';
      default: return '#9E9E9E';
    }
  };
  
  // Get icon based on days until EOSL
  const getStatusIcon = (days) => {
    if (days < 30) return <ErrorIcon sx={{ color: '#F44336' }} />;
    if (days < 90) return <AlarmIcon sx={{ color: '#FF9800' }} />;
    return <WatchLaterIcon sx={{ color: '#4CAF50' }} />;
  };
  
  // Calculate text from days
  const getDaysText = (days) => {
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return `${Math.floor(days / 365)} years`;
  };
  
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100%' 
      }}>
        <CircularProgress sx={{ color: '#1976D2' }} />
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {/* Search Field */}
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <TextField
          fullWidth
          placeholder="Search by owner, asset name, or EOSL type..."
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
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#1976D2',
              },
            }
          }}
        />
      </Box>
      
      {/* Table */}
      <TableContainer sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8f9fb' }}>Owner</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8f9fb' }}>Asset</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8f9fb', width: '80px' }}>EOSL</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8f9fb', width: '120px' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#f8f9fb' }}>Remark</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: '#f8f9fb', width: '100px' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((asset) => {
                const eoslColor = getEOSLColor(asset.eoslType);
                const isSending = sendingMap[asset.id];
                const daysUntil = asset.daysUntil || 0;
                const statusIcon = getStatusIcon(daysUntil);
                
                return (
                  <TableRow 
                    key={asset.id}
                    hover
                    sx={{ 
                      '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                      transition: 'all 0.2s',
                      borderLeft: `4px solid ${eoslColor}`,
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 3px 5px rgba(0, 0, 0, 0.05)'
                      }
                    }}
                  >
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      {asset.owner}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {asset.assetName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={asset.eoslType}
                        size="small"
                        sx={{
                          bgcolor: `${eoslColor}20`,
                          color: eoslColor,
                          fontWeight: 'bold',
                          minWidth: '60px'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {statusIcon}
                        <Box>
                          <Typography variant="caption" display="block" sx={{ fontWeight: 'medium' }}>
                            {asset.eoslDate || asset.date}
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                            in {getDaysText(asset.daysUntil || 0)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 250,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {asset.remark || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        size="small"
                        color="primary"
                        disabled={isSending}
                        startIcon={isSending ? null : (asset.reminderSent ? <DoneIcon /> : <SendIcon />)}
                        onClick={() => handleSendReminder(asset.id)}
                        sx={{
                          minWidth: 90,
                          background: asset.reminderSent ? '#BBDEFB' : 'linear-gradient(45deg, #1976D2 30%, #42A5F5 90%)',
                          color: asset.reminderSent ? '#0D47A1' : 'white',
                          boxShadow: asset.reminderSent ? 'none' : '0 2px 5px rgba(25, 118, 210, 0.3)',
                          transition: 'all 0.3s',
                          textTransform: 'none',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 8px rgba(25, 118, 210, 0.4)',
                            background: asset.reminderSent ? '#90CAF9' : 'linear-gradient(45deg, #1565C0 30%, #1976D2 90%)',
                          }
                        }}
                      >
                        {isSending ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          asset.reminderSent ? 'Reminded' : 'Send'
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    {searchTerm ? 'No assets match your search' : 'No assets found'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Toast for notifications */}
      <Toast toast={toast} onClose={closeToast} />
    </Box>
  );
};

export default EOSLTable;