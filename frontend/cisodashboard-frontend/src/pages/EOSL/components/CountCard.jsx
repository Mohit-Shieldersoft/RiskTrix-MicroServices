import React from 'react';
import { Paper, Box, Typography, Skeleton } from '@mui/material';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import dashboardTheme from '../../../theme/dashboardTheme';

const CountCard = ({ title, count, icon, color, subtext, loading }) => {
  // Get icon based on type
  const getIcon = () => {
    switch (icon) {
      case 'eos':
        return <EventBusyIcon sx={{ fontSize: 40, color }} />;
      case 'eol':
        return <DeleteForeverIcon sx={{ fontSize: 40, color }} />;
      default:
        return null;
    }
  };
  
  return (
    <Paper
      elevation={0}
      className="futuristic-card count-card"
      sx={{
        p: 2,
        display: 'flex',
          flex: 1,
          minWidth: 0,
          alignItems: 'center',
        background: `linear-gradient(135deg, #ffffff 0%, ${color}08 100%)`,
        borderLeft: `4px solid ${color}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 10px 20px ${color}20`
        },
        /* allow parent to control height via aspect-ratio or flex */
        height: 'auto'
      }}
    >
      <Box sx={{ mr: 2 }}>{getIcon()}</Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 'medium', color: 'text.primary' }}>
          {title}
        </Typography>

        {loading ? (
          <Skeleton variant="text" width={60} height={40} />
        ) : (
          <Typography
            variant="h4"
            sx={{
              fontWeight: 'bold',
              color,
              mt: 0.5
            }}
          >
            {count}
          </Typography>
        )}

        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {subtext}
        </Typography>
      </Box>
    </Paper>
  );
};

export default CountCard;