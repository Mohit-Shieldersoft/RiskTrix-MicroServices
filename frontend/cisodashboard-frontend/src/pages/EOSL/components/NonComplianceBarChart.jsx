import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Box, Typography, Skeleton } from '@mui/material';
import dashboardTheme from '../../../theme/dashboardTheme';

const NonComplianceBarChart = ({ data, loading }) => {
  // Colors for the bars
  const colors = ['#1976D2', '#42A5F5', '#64B5F6', '#90CAF9'];
  
  // Ensure data is valid with numerical values
  const chartData = React.useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data.map(item => ({
      name: item.name,
      count: Number(item.count || 0)
    }));
  }, [data]);
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
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
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {payload[0].payload.name}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {payload[0].value} non-compliant assets
          </Typography>
        </Box>
      );
    }
    return null;
  };
  
  if (loading) {
    return (
      <Box sx={{ width: '100%', height: '100%', minWidth: 0 }}>
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
          No non-compliant assets found
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', minWidth: 0 }}>
      <ResponsiveContainer width="99%" height="99%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
          barSize={18}
        >
          <XAxis 
            type="number" 
            axisLine={{ stroke: '#E0E0E0' }}
            tickLine={false}
            tick={{ fontSize: 11, fill: dashboardTheme.colors.text.secondary }}
          />
          <YAxis 
            dataKey="name" 
            type="category" 
            axisLine={false}
            tickLine={false}
            tick={{ 
              fontSize: 11, 
              fontWeight: 'medium',
              fill: dashboardTheme.colors.text.secondary
            }}
            width={100}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
          <Bar isAnimationActive={false} dataKey="count" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default NonComplianceBarChart;