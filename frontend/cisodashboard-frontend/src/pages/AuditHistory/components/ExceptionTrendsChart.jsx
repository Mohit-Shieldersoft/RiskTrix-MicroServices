import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import dashboardTheme from '../../../theme/dashboardTheme';

const ExceptionTrendsChart = ({ data }) => {
  const theme = useTheme();
  
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
            borderRadius: dashboardTheme.borderRadius.md
          }}
        >
          <Typography sx={{ fontWeight: 'bold', mb: 1 }}>
            {label}
          </Typography>
          
          {payload.map((entry, index) => (
            <Box 
              key={`risk-${index}`} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 0.5 
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
              <Typography variant="body2">
                {entry.name}: {entry.value} exceptions
              </Typography>
            </Box>
          ))}
        </Box>
      );
    }
    return null;
  };
  
  // Ensure data is ordered by month (Jan..Dec), fill missing months and remove duplicate months
  const monthOrder = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const processed = monthOrder.map((m) => {
    const found = data.find(d => d.month === m);
    if (found) {
      // Ensure numeric values and remove undefined
      return {
        month: m,
        critical: Number(found.critical) || 0,
        high: Number(found.high) || 0,
        medium: Number(found.medium) || 0,
        low: Number(found.low) || 0
      };
    }
    return { month: m, critical: 0, high: 0, medium: 0, low: 0 };
  });

  // Compute max value to set a friendly Y axis domain (add a small headroom)
  const maxVal = Math.max(...processed.flatMap(d => [d.critical, d.high, d.medium, d.low]), 1);

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', minHeight: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={processed}
          margin={{ top: 6, right: 12, left: 12, bottom: 10 }}
          connectNulls={true}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
            tick={{ fill: theme.palette.text.secondary }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            tick={{ fill: theme.palette.text.secondary }}
            tickLine={false}
            axisLine={false}
            domain={[0, (maxVal === 0 ? 1 : maxVal)]}
            allowDecimals={false}
            tickCount={Math.max(3, Math.ceil((maxVal === 0 ? 1 : maxVal)) + 1)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: 10 }}
            formatter={(value) => {
              return <span style={{ color: theme.palette.text.primary, fontSize: '0.875rem' }}>{value}</span>;
            }}
          />
          <Line 
            type="monotone" 
            dataKey="critical" 
            name="Critical" 
            stroke={dashboardTheme.colors.severity.critical} 
            activeDot={{ r: 6 }}
            strokeWidth={3}
            dot={{ r: 5, strokeWidth: 2 }}
            isAnimationActive={false}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Line 
            type="monotone" 
            dataKey="high" 
            name="High" 
            stroke={dashboardTheme.colors.severity.high} 
            activeDot={{ r: 6 }}
            strokeWidth={2.5}
            dot={{ r: 5, strokeWidth: 2 }}
            isAnimationActive={false}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Line 
            type="monotone" 
            dataKey="medium" 
            name="Medium" 
            stroke={dashboardTheme.colors.severity.medium} 
            activeDot={{ r: 6 }}
            strokeWidth={3}
            dot={{ r: 5, strokeWidth: 2 }}
            isAnimationActive={false}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Line 
            type="monotone" 
            dataKey="low" 
            name="Low" 
            stroke={dashboardTheme.colors.severity.low} 
            activeDot={{ r: 6 }}
            strokeWidth={2}
            dot={{ r: 5, strokeWidth: 2 }}
            isAnimationActive={false}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default ExceptionTrendsChart;