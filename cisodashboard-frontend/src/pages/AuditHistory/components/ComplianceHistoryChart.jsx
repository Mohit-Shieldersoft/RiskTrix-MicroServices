import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import dashboardTheme from '../../../theme/dashboardTheme';

const ComplianceHistoryChart = ({ data }) => {
  const theme = useTheme();
  const [activeIndex, setActiveIndex] = useState(null);
  
  if (!data) return (
    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="body2" color="text.secondary">Loading chart data...</Typography>
    </Box>
  );
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          className="custom-tooltip"
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            p: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            border: '1px solid #eeeeee',
            borderRadius: dashboardTheme.borderRadius.md,
            position: 'relative',
            zIndex: 1000
          }}
        >
          <Typography sx={{ fontWeight: 'bold' }}>
            {label}
          </Typography>
          <Box sx={{ mt: 1.5, mb: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  backgroundColor: '#4CAF50',
                  mr: 1 
                }}
              />
              <Typography variant="body2">
                Compliant: {payload[0].value}%
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: '50%', 
                  backgroundColor: '#FF5252',
                  mr: 1 
                }}
              />
              <Typography variant="body2">
                Non-Compliant: {payload[1].value}%
              </Typography>
            </Box>
          </Box>
        </Box>
      );
    }
    return null;
  };
  
  const formatYAxis = (value) => `${value}%`;
  
  const handleMouseEnter = (_, index) => {
    setActiveIndex(index);
  };
  
  const handleMouseLeave = () => {
    setActiveIndex(null);
  };
  
  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', minHeight: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
          onMouseMove={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="colorCompliant" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#4CAF50" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorNonCompliant" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF5252" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#FF5252" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="month" 
            tick={{ fill: theme.palette.text.secondary }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            tickFormatter={formatYAxis} 
            tick={{ fill: theme.palette.text.secondary }}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
          />
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
          content={(props) => {
            const { payload } = props;
            
            return (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '16px',
                paddingTop: '8px'
              }}>
                {payload.map((entry, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        backgroundColor: entry.color 
                      }} 
                    />
                    <Typography variant="caption" sx={{ color: theme.palette.text.primary, fontSize: '0.85rem' }}>
                      {entry.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            );
          }}
        />
          <Area 
            type="monotone" 
            dataKey="compliant" 
            name="Compliant" 
            stroke="#4CAF50" 
            fillOpacity={1} 
            fill="url(#colorCompliant)" 
            activeDot={{ 
              r: 6, 
              fill: '#4CAF50', 
              stroke: 'white', 
              strokeWidth: 2 
            }} 
          />
          <Area 
            type="monotone" 
            dataKey="nonCompliant" 
            name="Non-Compliant" 
            stroke="#FF5252" 
            fillOpacity={1} 
            fill="url(#colorNonCompliant)" 
            activeDot={{ 
              r: 6, 
              fill: '#FF5252', 
              stroke: 'white', 
              strokeWidth: 2 
            }} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default ComplianceHistoryChart;