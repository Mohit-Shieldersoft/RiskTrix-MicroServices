import React, { useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Box, Typography, Skeleton, useTheme } from '@mui/material';
import dashboardTheme from '../../../theme/dashboardTheme';

const ComplianceLineChart = ({ data, loading }) => {
  const theme = useTheme();
  const containerRef = useRef(null);
  
  // Ensure data has proper numeric values for charts
  const chartData = React.useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];
    return data.map(item => ({
      month: item.month,
      compliant: Number(item.compliant || 0),
      nonCompliant: Number(item.nonCompliant || 0)
    }));
  }, [data]);
  
  // Force re-render after mounting to ensure chart sizing is correct
  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const event = new Event('resize');
        window.dispatchEvent(event);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [data]);
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            p: 1.5,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            border: '1px solid #eeeeee',
            borderRadius: dashboardTheme.borderRadius.md
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {label}
          </Typography>
          
          {payload.map((entry, index) => (
            <Box 
              key={`item-${index}`} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 0.5 
              }}
            >
              <Box 
                sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  backgroundColor: entry.color,
                  mr: 1 
                }}
              />
              <Typography variant="caption">
                {entry.name}: {entry.value}%
              </Typography>
            </Box>
          ))}
        </Box>
      );
    }
    return null;
  };
  
  if (loading) {
    return (
      <Box sx={{ width: '100%', height: '100%' }}>
        <Skeleton variant="rectangular" width="100%" height="100%" animation="wave" />
      </Box>
    );
  }
  
  if (!chartData.length) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100%' 
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No compliance data available for the selected year
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100%',
        height: '100%',
        minHeight: '200px',
        position: 'relative',
        minWidth: 0
      }}
    >
      <ResponsiveContainer width="99%" height="99%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
            tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#E0E0E0' }}
          />
          <YAxis 
            tickFormatter={(value) => `${value}%`}
            domain={[0, 100]}
            tick={{ fill: theme.palette.text.secondary, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#E0E0E0' }}
          />
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
          <Line 
            isAnimationActive={false}
            type="monotone" 
            dataKey="compliant" 
            name="Compliant" 
            stroke="#4CAF50" 
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 1 }}
            activeDot={{ r: 5, strokeWidth: 1 }}
          />
          <Line 
            isAnimationActive={false}
            type="monotone" 
            dataKey="nonCompliant" 
            name="Non-Compliant" 
            stroke="#F44336" 
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 1 }}
            activeDot={{ r: 5, strokeWidth: 1 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default ComplianceLineChart;