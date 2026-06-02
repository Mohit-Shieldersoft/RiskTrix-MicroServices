import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import dashboardTheme from '../../../theme/dashboardTheme';

const ComplianceTracker = ({ compliantCount, nonCompliantCount }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const theme = useTheme();
  
  // Calculate total and percentages
  const total = compliantCount + nonCompliantCount;
  const compliantPercentage = total > 0 ? Math.round((compliantCount / total) * 100) : 0;
  const nonCompliantPercentage = total > 0 ? 100 - compliantPercentage : 0;
  
  // Prepare data for the chart
  const data = [
    { 
      name: 'Compliant', 
      value: compliantCount,
      percentage: compliantPercentage,
      color: '#4CAF50' 
    },
    { 
      name: 'Non-Compliant', 
      value: nonCompliantCount,
      percentage: nonCompliantPercentage,
      color: '#F44336' 
    }
  ];
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            p: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            border: '1px solid #eeeeee',
            borderRadius: dashboardTheme.borderRadius.md
          }}
        >
          <Typography sx={{ fontWeight: 'bold', color: data.color }}>
            {data.name}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Count: {data.value} controls
          </Typography>
          <Typography variant="body2">
            Percentage: {data.percentage}%
          </Typography>
        </Box>
      );
    }
    return null;
  };
  
  // Active shape for hover effect
  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 8}
          outerRadius={outerRadius + 12}
          fill={fill}
          opacity={0.3}
        />
      </g>
    );
  };
  
  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };
  
  const onPieLeave = () => {
    setActiveIndex(null);
  };
  
  // Custom Legend
  const renderLegend = (props) => {
    const { payload } = props;
    
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'flex-start',
          mt: 2
        }}
      >
        {payload.map((entry, index) => (
          <Box 
            key={`legend-${index}`} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mb: 1
            }}
          >
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                backgroundColor: entry.color,
                mr: 1
              }}
            />
            <Typography 
              variant="body2" 
              sx={{ 
                mr: 1,
                fontWeight: activeIndex === index ? 'bold' : 'normal'
              }}
            >
              {entry.name}:
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 'medium',
                color: entry.color
              }}
            >
              {entry.value} ({entry.percentage}%)
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };
  
  // If there's no data
  if (total === 0) {
    return (
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 'medium' }}>
          No compliance data available
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Select a different vendor or standard
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            startAngle={90}
            endAngle={-270}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color} 
                stroke="#fff"
                strokeWidth={2}
                style={{
                  filter: activeIndex === index ? 'drop-shadow(0px 0px 8px rgba(0,0,0,0.3))' : 'none',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      <Box sx={{ position: 'absolute', bottom: 0, width: '100%' }}>
        {renderLegend({ payload: data })}
      </Box>
      
      <Box 
        sx={{ 
          position: 'absolute', 
          top: '45%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
          mt:2
        }}
      >
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 'bold', 
            color: compliantPercentage >= 80 ? '#4CAF50' : 
                 compliantPercentage >= 50 ? '#FFC107' : '#F44336'
          }}
        >
          {compliantPercentage}%
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          Compliance Rate
        </Typography>
      </Box>
      
      {/* Gradient glow effect */}
      <Box 
        sx={{ 
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.palette.primary.main}10 0%, rgba(255,255,255,0) 70%)`,
          pointerEvents: 'none'
        }}
      />
    </Box>
  );
};

export default ComplianceTracker;