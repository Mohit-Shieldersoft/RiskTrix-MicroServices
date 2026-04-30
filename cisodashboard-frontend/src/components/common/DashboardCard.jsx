import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import dashboardTheme from '../../theme/dashboardTheme';

const DashboardCard = ({ 
  title, 
  children, 
  height = 400, 
  minWidth = 250,
  sx = {} 
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        height,
        minWidth,
        borderRadius: dashboardTheme.borderRadius.lg,
        background: dashboardTheme.colors.background.card,
        boxShadow: dashboardTheme.shadows.card,
        transition: dashboardTheme.transitions.normal,
        overflow: 'hidden',
        '&:hover': {
          boxShadow: dashboardTheme.shadows.cardHover,
          transform: 'translateY(-4px)',
        },
        ...sx
      }}
    >
      {title && (
        <Box
          sx={{
            p: '16px 20px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            background: 'rgba(0, 0, 0, 0.01)',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontSize: '1rem',
              fontWeight: dashboardTheme.typography.fontWeights.semibold,
              color: dashboardTheme.colors.text.primary,
            }}
          >
            {title}
          </Typography>
        </Box>
      )}
      <Box sx={{ p: 2, height: title ? 'calc(100% - 57px)' : '100%' }}>
        {children}
      </Box>
    </Paper>
  );
};

export default DashboardCard;