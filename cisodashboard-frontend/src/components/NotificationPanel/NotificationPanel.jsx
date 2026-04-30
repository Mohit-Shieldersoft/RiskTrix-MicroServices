import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Typography, IconButton, Badge, Popper, 
  Paper, List, ListItem, Divider, Avatar, Fade,
  Tabs, Tab, Chip, Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import UpdateIcon from '@mui/icons-material/Update';
import PersonIcon from '@mui/icons-material/Person';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CloseIcon from '@mui/icons-material/Close';
import { generateMockNotifications } from './mockNotification';
import './NotificationPanel.css';

// Styled components
const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#FF4842',
    color: '#fff',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

const StyledHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: `1px solid ${theme.palette.divider}`,
  background: 'linear-gradient(90deg, #1976D2 0%, #42A5F5 100%)',
  color: 'white'
}));

const NotificationPanel = () => {
  const [open, setOpen] = useState(false);
  const [notificationData, setNotificationData] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);
  
  // Load notification data
  useEffect(() => {
    const data = generateMockNotifications();
    setNotificationData(data);
    setUnreadCount(data.filter(notification => !notification.read).length);
  }, []);
  
  // Handle click outside to close panel
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        panelRef.current && 
        !panelRef.current.contains(event.target) && 
        anchorEl && 
        !anchorEl.contains(event.target)
      ) {
        setOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [panelRef, anchorEl]);
  
  const handleNotificationClick = (event) => {
    setOpen(!open);
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setOpen(false);
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleMarkAllAsRead = () => {
    const updatedData = notificationData.map(notification => ({
      ...notification,
      read: true,
    }));
    setNotificationData(updatedData);
    setUnreadCount(0);
  };
  
  const handleMarkAsRead = (id) => {
    const updatedData = notificationData.map(notification => {
      if (notification.id === id && !notification.read) {
        setUnreadCount(prev => prev - 1);
        return { ...notification, read: true };
      }
      return notification;
    });
    setNotificationData(updatedData);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'alert':
        return <ErrorOutlineIcon sx={{ color: '#FF4842' }} />;
      case 'update':
        return <UpdateIcon sx={{ color: '#3366FF' }} />;
      case 'user':
        return <PersonIcon sx={{ color: '#36B37E' }} />;
      default:
        return <UpdateIcon sx={{ color: '#3366FF' }} />;
    }
  };
  
  const getTimeAgo = (timestamp) => {
    const now = new Date('2025-04-18T10:03:19');
    const notifTime = new Date(timestamp);
    const diffSeconds = Math.floor((now - notifTime) / 1000);
    
    if (diffSeconds < 60) {
      return `${diffSeconds} seconds ago`;
    } else if (diffSeconds < 3600) {
      return `${Math.floor(diffSeconds / 60)} minutes ago`;
    } else if (diffSeconds < 86400) {
      return `${Math.floor(diffSeconds / 3600)} hours ago`;
    } else {
      return `${Math.floor(diffSeconds / 86400)} days ago`;
    }
  };
  
  const filteredNotifications = () => {
    if (tabValue === 0) return notificationData;
    if (tabValue === 1) return notificationData.filter(n => !n.read);
    return notificationData.filter(n => n.type === ['all', 'unread', 'alerts', 'updates'][tabValue]);
  };
  
  return (
    <>
      {/* Notification Bell Icon with Badge */}
      <IconButton 
        onClick={handleNotificationClick} 
        size="large"
        aria-label={`show ${unreadCount} new notifications`}
        color="inherit"
        sx={{ position: 'relative' }}
      >
        <StyledBadge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </StyledBadge>
      </IconButton>
      
      {/* Notification Panel Popper */}
      <Popper 
        open={open} 
        anchorEl={anchorEl}
        placement="bottom-end"
        transition
        disablePortal
        className="notification-popper"
        modifiers={[
          {
            name: 'preventOverflow',
            enabled: true,
            options: {
              boundary: document.body,
            },
          },
        ]}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={300}>
            <Paper 
              ref={panelRef}
              elevation={6}
              sx={{ 
                width: 380, 
                maxHeight: 500,
                overflow: 'hidden',
                borderRadius: 2,
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              }}
              className="notification-panel"
            >
              {/* Header */}
              <StyledHeader>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Notifications
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {unreadCount > 0 && (
                    <Tooltip title="Mark all as read">
                      <IconButton size="small" onClick={handleMarkAllAsRead} color="inherit">
                        <MarkEmailReadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <IconButton size="small" onClick={handleClose} color="inherit">
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </StyledHeader>
              
              {/* Tabs */}
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ 
                  px: 1, 
                  borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                  '& .MuiTab-root': {
                    minWidth: 'auto',
                    minHeight: 48,
                    px: 1.5,
                    py: 0.5,
                  }
                }}
              >
                <Tab 
                  label="All" 
                  icon={<Badge badgeContent={notificationData.length} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '10px', height: 16, minWidth: 16 } }} />}
                  iconPosition="end"
                />
                <Tab 
                  label="Unread" 
                  icon={<Badge badgeContent={unreadCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '10px', height: 16, minWidth: 16 } }} />}
                  iconPosition="end"
                />
                <Tab label="Alerts" />
                <Tab label="Updates" />
              </Tabs>
              
              {/* Notification List */}
              <Box sx={{ height: 350, overflowY: 'auto' }}>
                <List sx={{ p: 0 }}>
                  {filteredNotifications().length > 0 ? (
                    filteredNotifications().map((notification, index) => (
                      <React.Fragment key={notification.id}>
                        <ListItem 
                          alignItems="flex-start"
                          sx={{
                            px: 2, 
                            py: 1.5,
                            bgcolor: notification.read ? 'transparent' : 'rgba(25, 118, 210, 0.04)',
                            transition: 'background-color 0.3s',
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: 'rgba(25, 118, 210, 0.08)',
                            },
                          }}
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <Avatar
                            sx={{
                              bgcolor: notification.type === 'alert' ? '#FFF5F5' : 
                                     notification.type === 'update' ? '#F0F7FF' : '#F2FCF5',
                              width: 44,
                              height: 44,
                              mr: 2,
                              mt: 0.5
                            }}
                          >
                            {getNotificationIcon(notification.type)}
                          </Avatar>
                          
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {notification.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {getTimeAgo(notification.timestamp)}
                              </Typography>
                            </Box>
                            
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: 'text.secondary',
                                mb: 0.5
                              }}
                            >
                              {notification.message}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Tooltip title={notification.user}>
                                <Chip
                                  size="small"
                                  label={notification.user}
                                  avatar={<Avatar sx={{ bgcolor: '#1976D2' }}>{notification.user.charAt(0)}</Avatar>}
                                  sx={{ 
                                    height: 22, 
                                    fontSize: '0.75rem', 
                                    '& .MuiChip-avatar': { 
                                      width: 16, 
                                      height: 16, 
                                      fontSize: '0.7rem' 
                                    } 
                                  }}
                                />
                              </Tooltip>
                              
                              {!notification.read && (
                                <Box 
                                  sx={{ 
                                    ml: 'auto',
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: '#1976D2'
                                  }}
                                >
                                  <DoneAllIcon fontSize="small" sx={{ fontSize: '0.9rem', mr: 0.5 }} />
                                  <Typography variant="caption">Mark as read</Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </ListItem>
                        {index < filteredNotifications().length - 1 && (
                          <Divider component="li" />
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        height: 200,
                        flexDirection: 'column'
                      }}
                    >
                      <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
                      <Typography color="text.secondary">No notifications found</Typography>
                    </Box>
                  )}
                </List>
              </Box>
              
              {notificationData.length > 0 && (
                <Box 
                  sx={{ 
                    p: 1.5, 
                    textAlign: 'center', 
                    borderTop: '1px solid rgba(0, 0, 0, 0.12)',
                    bgcolor: '#F9FAFC'
                  }}
                >
                  <Typography 
                    variant="body2" 
                    color="primary" 
                    sx={{ 
                      fontWeight: 'medium',
                      cursor: 'pointer',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    View all notifications
                  </Typography>
                </Box>
              )}
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  );
};

export default NotificationPanel;