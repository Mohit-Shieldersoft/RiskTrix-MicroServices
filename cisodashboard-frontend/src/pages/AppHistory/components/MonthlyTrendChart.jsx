import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Box, Typography } from '@mui/material';
import DashboardCard from '../../../components/common/DashboardCard';
import dashboardTheme from '../../../theme/dashboardTheme';

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const quarterMap = {
      1: 'Q1',
      2: 'Q1',
      3: 'Q1',
      4: 'Q2',
      5: 'Q2', 
      6: 'Q2',
      7: 'Q3',
      8: 'Q3',
      9: 'Q3',
      10: 'Q4',
      11: 'Q4',
      12: 'Q4'
    };
    
    // Get month index (1-12) from the label
    const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                        .findIndex(m => m === label) + 1;
    const quarter = quarterMap[monthIndex];
    
    return (
      <Box sx={{
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        p: 1.5,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        border: '1px solid #eeeeee',
        borderRadius: dashboardTheme.borderRadius.md
      }}>
        <Typography sx={{ fontWeight: 'bold', mb: 1 }}>
          {label} ({quarter})
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
                width: 12, 
                height: 12, 
                backgroundColor: entry.color,
                borderRadius: '50%',
                mr: 1
              }}
            />
            <Typography variant="body2">
              {entry.name}: {entry.value}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }
  return null;
};

const MonthlyTrendChart = ({ data }) => {
  // Process data to add quarterly markings
  const chartData = data.map((item) => ({
    ...item,
    // Add a small marker if this is the start of a quarter
    isQuarterStart: ['Jan', 'Apr', 'Jul', 'Oct'].includes(item.month)
  }));
  
  return (
    <DashboardCard 
      title="Monthly Vulnerability Trends" 
      height={500}
      width={500}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 10, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          
          {/* Quarter marking lines */}
          <ReferenceLine x="Apr" stroke="#718096" strokeWidth={0.5} />
          <ReferenceLine x="Jul" stroke="#718096" strokeWidth={0.5} />
          <ReferenceLine x="Oct" stroke="#718096" strokeWidth={0.5} />
          
          <XAxis 
            dataKey="month" 
            tick={{ fill: dashboardTheme.colors.text.secondary }}
            axisLine={{ stroke: '#e0e0e0' }}
            tickLine={{ stroke: '#e0e0e0' }}
          />
          
          <YAxis 
            tick={{ fill: dashboardTheme.colors.text.secondary }}
            axisLine={{ stroke: '#e0e0e0' }}
            tickLine={{ stroke: '#e0e0e0' }}
            label={{ 
              value: 'Vulnerabilities', 
              angle: -90, 
              position: 'insideLeft',
              style: { fill: dashboardTheme.colors.text.secondary }
            }}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend 
            verticalAlign="top"
            wrapperStyle={{ paddingBottom: '15px' }}
            formatter={(value) => (
              <span style={{ color: dashboardTheme.colors.text.primary, fontWeight: 500 }}>{value}</span>
            )}
          />
          
          <Line 
            type="monotone" 
            dataKey="open" 
            name="Opened"
            stroke="#ff6384" 
            activeDot={{ r: 8, fill: '#ff6384', stroke: '#fff', strokeWidth: 2 }}
            strokeWidth={2}
            dot={{ r: 3, fill: '#ff6384', stroke: '#fff', strokeWidth: 1 }}
          />
          
          <Line 
            type="monotone" 
            dataKey="closed" 
            name="Closed"
            stroke="#36a2eb" 
            activeDot={{ r: 8, fill: '#36a2eb', stroke: '#fff', strokeWidth: 2 }}
            strokeWidth={2}
            dot={{ r: 3, fill: '#36a2eb', stroke: '#fff', strokeWidth: 1 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </DashboardCard>
  );
};

export default MonthlyTrendChart;