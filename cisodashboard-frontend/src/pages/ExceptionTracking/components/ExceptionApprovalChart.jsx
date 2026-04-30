import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import dashboardTheme from '../../../theme/dashboardTheme';

const ExceptionApprovalChart = ({ approved, rejected, inProgress }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const theme = useTheme();

  // Calculate total
  const total = approved + rejected + inProgress;
  
  // Prepare data for the chart
  const data = [
    { name: 'Approved', value: approved, color: '#4CAF50' },
    { name: 'Rejected', value: rejected, color: '#FF5252' },
    { name: 'In Progress', value: inProgress, color: '#FFC107' }
  ];
  
  // Calculate percentages
  data.forEach(item => {
    item.percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
  });
  
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
          <Typography variant="body2">
            Count: {data.value}
          </Typography>
          <Typography variant="body2">
            Percentage: {data.percentage}%
          </Typography>
        </Box>
      );
    }
    return null;
  };
  
  // Active shape for hover effect - matches Exception Status
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
          justifyContent: 'center', 
          flexWrap: 'wrap',
          mt: 2
        }}
      >
        {payload.map((entry, index) => (
          <Box 
            key={`legend-${index}`} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              mx: 1.5,
              mb: 1
            }}
          >
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                backgroundColor: entry.color,
                mr: 0.5
              }}
            />
            <Typography 
              variant="body2" 
              sx={{ 
                color: theme.palette.text.primary,
                fontWeight: activeIndex === index ? 'bold' : 'normal'
              }}
            >
              {entry.value} ({entry.payload.percentage}%)
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };
  
  return (
    <Box sx={{ height: '100%', position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={4}
            dataKey="value"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
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
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
      
      <Box 
        sx={{ 
          position: 'absolute', 
          top: '41%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none'
        }}
      >
        <Typography 
          variant="h4" 
          sx={{ fontWeight: 'bold', color: theme.palette.secondary.main }}
        >
          {total}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          Total
        </Typography>
      </Box>
      
      {/* Gradient glow effect */}
      <Box 
        sx={{ 
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.palette.secondary.main}20 0%, rgba(255,255,255,0) 70%)`,
          pointerEvents: 'none'
        }}
      />
    </Box>
  );
};

export default ExceptionApprovalChart;