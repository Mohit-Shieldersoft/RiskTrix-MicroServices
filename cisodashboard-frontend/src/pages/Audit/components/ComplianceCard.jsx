import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FlagIcon from '@mui/icons-material/Flag';
import dashboardTheme from '../../../theme/dashboardTheme';

const ComplianceCard = ({ title, count, trend, trendDirection, icon, color }) => {
  const getIcon = () => {
    switch (icon) {
      case 'warning':
        return <WarningAmberIcon sx={{ fontSize: 40, color }} />;
      case 'check':
        return <CheckCircleIcon sx={{ fontSize: 40, color }} />;
      case 'flag':
        return <FlagIcon sx={{ fontSize: 40, color }} />;
      default:
        return null;
    }
  };
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: '100%',
        borderRadius: dashboardTheme.borderRadius.lg,
        background: 'linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%)',
        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.3s',
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.03)',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '4px',
          background: color,
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography
          variant="subtitle1"
          sx={{
            color: 'text.secondary',
            fontWeight: dashboardTheme.typography.fontWeights.medium,
          }}
        >
          {title}
        </Typography>
        <Box sx={{ 
          width: 50, 
          height: 50, 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: `${color}15`,
        }}>
          {getIcon()}
        </Box>
      </Box>
      
      <Typography
        variant="h3"
        sx={{
          fontWeight: dashboardTheme.typography.fontWeights.bold,
          mb: 2,
          color: dashboardTheme.colors.text.primary,
        }}
      >
        {count}
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {trendDirection === 'up' ? (
          <ArrowUpwardIcon 
            sx={{ 
              fontSize: 16, 
              color: title === 'Non-Compliant Vendors' || title === 'Exceptions' ? '#FF5252' : '#4CAF50',
              mr: 0.5 
            }} 
          />
        ) : (
          <ArrowDownwardIcon 
            sx={{ 
              fontSize: 16, 
              color: title === 'Non-Compliant Vendors' || title === 'Exceptions' ? '#4CAF50' : '#FF5252',
              mr: 0.5 
            }} 
          />
        )}
        <Typography
          variant="body2"
          sx={{
            color: trendDirection === 'up' 
              ? (title === 'Non-Compliant Vendors' || title === 'Exceptions' ? '#FF5252' : '#4CAF50')
              : (title === 'Non-Compliant Vendors' || title === 'Exceptions' ? '#4CAF50' : '#FF5252'),
            fontWeight: dashboardTheme.typography.fontWeights.medium,
          }}
        >
          {trend}% {trendDirection === 'up' ? 'increase' : 'decrease'}
        </Typography>
      </Box>
      
      <Box
        sx={{
          position: 'absolute',
          bottom: -30,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: '50%',
          backgroundColor: `${color}10`,
          zIndex: 0,
        }}
      />
    </Paper>
  );
};

export default ComplianceCard;