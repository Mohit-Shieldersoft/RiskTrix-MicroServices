import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Box, Typography, Paper, useTheme, useMediaQuery } from '@mui/material';
import dashboardTheme from '../../../theme/dashboardTheme';

const ISO27001Chart = ({ complianceData }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm')); // treat sm and below as small
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // compute radii responsively so the pie doesn't overflow small cards
  const innerRadius = isXs ? 45 : isSm ? 55 : 60;
  const outerRadius = isXs ? 60 : isSm ? 72 : 80;
  
  if (!complianceData) return null;
  
  // Use data directly from API
  const isoCompliantApps = complianceData.compliant || 0;
  const isoNonCompliantApps = complianceData.non_compliant || 0;
  const totalApps = complianceData.total || 0;
  const compliantPercentage = complianceData.compliant_percentage?.toFixed(1) || '0.0';
  const nonCompliantPercentage = (100 - parseFloat(compliantPercentage)).toFixed(1);
  
  const data = [
    { name: 'Compliant', value: isoCompliantApps, percentage: compliantPercentage },
    { name: 'Non-Compliant', value: isoNonCompliantApps, percentage: nonCompliantPercentage }
  ];
  
  const COLORS = ['#4CAF50', '#FF5252'];
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Box 
          sx={{ 
            backgroundColor: 'white', 
            padding: '10px', 
            border: '1px solid #f5f5f5',
            borderRadius: '8px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
          }}
        >
          <Typography sx={{ color: payload[0].payload.fill || payload[0].color, fontWeight: 'bold' }}>
            {payload[0].name}: {payload[0].value} applications
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            {payload[0].payload.percentage}% of total
          </Typography>
        </Box>
      );
    }
    return null;
  };
  
  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };
  
  const onPieLeave = () => {
    setActiveIndex(null);
  };
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        height: '100%',
        width: '100%',
        boxSizing: 'border-box',
        borderRadius: dashboardTheme.borderRadius.lg,
        background: 'linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%)',
        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.05)',
        transition: 'transform 0.3s',
        // allow visible overflow so drop-shadows and tooltips don't clip the parent unexpectedly
        overflow: 'visible',
        border: '1px solid rgba(0,0,0,0.03)',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <Typography
        variant="h6"
        sx={{ 
          mb: 2,
          fontWeight: dashboardTheme.typography.fontWeights.semibold,
          color: dashboardTheme.colors.text.primary,
          fontSize: { xs: '1.05rem', sm: '1.15rem', md: '1.25rem' }
        }}
      >
        ISO 27001 Compliance
      </Typography>
      
      <Box sx={{ height: { xs: 180, sm: 220, md: 280 }, position: 'relative', minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="55%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={5}
              dataKey="value"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index]} 
                  stroke="#fff"
                  strokeWidth={2}
                  style={{
                    filter: activeIndex === index ? 'drop-shadow(0px 0px 6px rgba(0,0,0,0.3))' : 'none',
                    opacity: activeIndex === null || activeIndex === index ? 1 : 0.7,
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
  content={(props) => {
    const { payload } = props;
    
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        flexWrap: 'wrap',
        gap: '10px',
        marginTop: '25px'
      }}>
        {payload.map((entry, index) => (
          <div key={`legend-item-${index}`} style={{ 
            display: 'flex', 
            alignItems: 'center',
            marginRight: '10px'
          }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: entry.color,
              marginRight: '4px',
              marginBottom: '2px'
            }} />
            <span style={{ 
              fontSize: '0.75rem',
              color: entry.color,
              fontWeight: dashboardTheme.typography.fontWeights.light
            }}>
              {entry.value} ({data[index].value})
            </span>
          </div>
        ))}
      </div>
    );
  }}
/>
          </PieChart>
        </ResponsiveContainer>
        
        {/* <Box 
          sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}
        >
          <Typography 
            variant="h4" 
            sx={{ fontWeight: 'bold', color: dashboardTheme.colors.primary }}
          >
            {compliantPercentage}%
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Compliant
          </Typography>
        </Box> */}

        <Box
    sx={{
      position: 'absolute',
      inset: 0,                      // top:0; right:0; bottom:0; left:0;
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',          // center horizontally
      justifyContent: 'center',      // center vertically
      pointerEvents: 'none',         // so overlay doesn't block hover on the chart
      textAlign: 'center',
      mt: 2,
    }}
  >
    <Typography
      component="div"
      sx={{
        // fontSize: { xs: '1rem', sm: '2.6rem', md: '2rem' }, // responsive
        fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2rem' },
        fontWeight: 700,
        color: dashboardTheme.colors.primary,
        lineHeight: 1,            // IMPORTANT: keep line-height tight so visual center matches
        display: 'block',         // remove browser default inline baseline behavior
        mb: 0.25,                 // small spacing between percent and label
      }}
    >
      {compliantPercentage}%
    </Typography>

    <Typography
      variant="caption"
      component="div"
      sx={{
        color: 'text.secondary',
        fontSize: { xs: '0.75rem', sm: '0.85rem' },
        lineHeight: 1,
      }}
    >
      Compliant
    </Typography>
      </Box>
      </Box>
    </Paper>
  );
};

export default ISO27001Chart;