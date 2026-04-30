import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Box, Typography, Paper, useTheme, useMediaQuery } from '@mui/material';
import dashboardTheme from '../../../theme/dashboardTheme';

const PCIDSSChart = ({ complianceData }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const innerRadius = isXs ? 45 : isSm ? 55 : 60;
  const outerRadius = isXs ? 60 : isSm ? 72 : 80;
  
  if (!complianceData) return null;
  
  // Use data directly from API
  const pciCompliantApps = complianceData.compliant || 0;
  const pciNonCompliantApps = complianceData.non_compliant || 0;
  const totalApps = complianceData.total || 0;
  const compliantPercentage = complianceData.compliant_percentage?.toFixed(1) || '0.0';
  const nonCompliantPercentage = (100 - parseFloat(compliantPercentage)).toFixed(1);
  
  const data = [
    { name: 'Compliant', value: pciCompliantApps, percentage: compliantPercentage },
    { name: 'Non-Compliant', value: pciNonCompliantApps, percentage: nonCompliantPercentage }
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
            zIndex: 10,
            position: 'relative',
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
        PCI-DSS v4 Compliance
      </Typography>
      
      <Box sx={{ height: { xs: 180, sm: 220, md: 280 }, position: 'relative', minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={5}
              dataKey="value"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              startAngle={90}
              endAngle={-270}
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
        marginTop: '10px'
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
              marginRight: '4px'
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
        
        <Box 
          sx={{ 
            position: 'absolute', 
            top: '45%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
            zIndex: 1,
            mt : 2
          }}
        >
          <Typography 
            variant="h4" 
            sx={{ fontWeight: 'bold', color: dashboardTheme.colors.secondary }}
          >
            {compliantPercentage}%
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary',lineHeight: 1,       // keep line-height tight
      mt: 0.25,            // smaller gap between percentage and text (0.25 = ~2px)
      display: 'block', }}>
            Compliant
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default PCIDSSChart;