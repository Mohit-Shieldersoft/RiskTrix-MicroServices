import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import dashboardTheme from '../../../theme/dashboardTheme';

const StandardComplianceChart = ({ data, standard }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const theme = useTheme();

  if (!data) return (
    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="body2" color="text.secondary">Loading chart data...</Typography>
    </Box>
  );
  
  // Prepare data for the chart
  const chartData = [
    { 
      name: 'Compliant', 
      value: data.compliant, 
      color: '#4CAF50' 
    },
    { 
      name: 'Non-Compliant', 
      value: data.nonCompliant, 
      color: '#FF5252' 
    }
  ];
  
  // Custom tooltip to prevent overlap
  const CustomTooltip = ({ active, payload, position }) => {
    if (active && payload && payload.length) {
      // Calculate tooltip position to avoid overlap
      const tooltipStyle = {
        // Adjust position based on which slice is hovered
        left: position?.x < 200 ? position.x + 20 : position.x - 180,
        top: position?.y < 200 ? position.y : position.y - 80,
      };
      
      return (
        <Box
          className="custom-tooltip"
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            p: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            border: '1px solid #eeeeee',
            borderRadius: dashboardTheme.borderRadius.md,
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 100,
            width: 180,
            ...tooltipStyle
          }}
        >
          <Typography sx={{ fontWeight: 'bold', color: payload[0].payload.color }}>
            {payload[0].name}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Percentage: {payload[0].value}%
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
              {entry.value}%
            </Typography>
          </Box>
        ))}
      </Box>
    );
  };
  
  return (
    <Box sx={{ height: '100%', position: 'relative' }}>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={4}
            dataKey="value"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
          >
            {chartData.map((entry, index) => (
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
          <Tooltip content={<CustomTooltip />} position={{ x: 0, y: 0 }} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center text */}
      <Box 
        sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none'
        }}
      >
        <Typography 
          variant="h4" 
          sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}
        >
          {data.compliant}%
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          Compliant
        </Typography>
        <Typography variant="caption" sx={{ color: theme.palette.secondary.main, mt: 0.5, display: 'block' }}>
          {standard}
        </Typography>
      </Box>
      
      {/* Legend */}
      <Box sx={{ position: 'absolute', bottom: 0, width: '100%' }}>
        {renderLegend({ payload: chartData })}
      </Box>
      
      {/* Gradient glow effect */}
      <Box 
        sx={{ 
          position: 'absolute',
          top: '42%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.palette.primary.main}10 0%, rgba(255,255,255,0) 70%)`,
          pointerEvents: 'none'
        }}
      />
    </Box>
  );
};

export default StandardComplianceChart;