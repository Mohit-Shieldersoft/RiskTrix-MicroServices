import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import DashboardCard from '../../../components/common/DashboardCard';
import dashboardTheme from '../../../theme/dashboardTheme';

// Custom tooltip for the chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        p: 1.5,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        border: '1px solid #eeeeee',
        borderRadius: dashboardTheme.borderRadius.md
      }}>
        <Typography sx={{ fontWeight: 'bold', mb: 1 }}>
          Year: {label}
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

const CustomLegend = ({ payload }) => (
  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', pt: 1 }}>
    {payload.map((entry) => (
      <Box key={entry.value} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            width: 20,   // custom width
            height: 20,   // custom height
            backgroundColor: entry.color,
            // borderRadius: 1
          }}
        />
        <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 500 }}>
          {entry.value}
        </Typography>
      </Box>
    ))}
  </Box>
);

 


const YearlyTrendChart = ({ data }) => {
  const [tab, setTab] = useState(0);
  
  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };
  
  // Get data based on selected tab
  const getChartData = () => {
    switch(tab) {
      case 0: // All
        return data;
      case 1: // Critical
        return data.map(item => ({
          year: item.year,
          critical: item.critical
        }));
      case 2: // High
        return data.map(item => ({
          year: item.year,
          high: item.high
        }));
      case 3: // Medium
        return data.map(item => ({
          year: item.year,
          medium: item.medium
        }));
      case 4: // Low
        return data.map(item => ({
          year: item.year,
          low: item.low
        }));
      default:
        return data;
    }
  };
  
  const chartData = getChartData();
  
  // Define chart colors
  const chartColors = {
    critical: dashboardTheme.colors.severity.critical,
    high: dashboardTheme.colors.severity.high,
    medium: dashboardTheme.colors.severity.medium,
    low: dashboardTheme.colors.severity.low
  };
  
  return (
    <DashboardCard 
      title="Yearly Vulnerability Closure Trends" 
      height={750}
      sx={{
        '& .MuiTabs-root': {
          minHeight: 'auto',
          mb: 2
        },
        '& .MuiTab-root': {
          minHeight: 'auto',
          py: 1
        }
      }}
    >
      <Tabs 
        value={tab} 
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        textColor="primary"
        indicatorColor="primary"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="All" />
        <Tab label="Critical" />
        <Tab label="High" />
        <Tab label="Medium" />
        <Tab label="Low" />
      </Tabs>
      
      <Box sx={{ height: '90%', pt: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis 
              type="number"
              tick={{ fill: dashboardTheme.colors.text.secondary }}
              axisLine={{ stroke: '#e0e0e0' }}
              tickLine={{ stroke: '#e0e0e0' }}
            />
            <YAxis 
              dataKey="year" 
              type="category"
              tick={{ fill: dashboardTheme.colors.text.secondary }}
              axisLine={{ stroke: '#e0e0e0' }}
              tickLine={{ stroke: '#e0e0e0' }}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* <Legend 
              wrapperStyle={{ paddingTop: '15px' }}
              formatter={(value) => (
                <span style={{ color: dashboardTheme.colors.text.primary,boxWidth: 10 ,boxHeight: 10, fontWeight: 500 }}>{value}</span>
              )}
            /> */}
            
<Legend
  verticalAlign="bottom"
  align="center"
  content={<CustomLegend />}
/>
            {tab === 0 || tab === 1 ? (
              <Bar 
                dataKey="critical" 
                name="Critical"
                fill={chartColors.critical} 
                radius={[0, 4, 4, 0]}
                barSize={30}
                animationDuration={1000}
              />
            ) : null}
            
            {tab === 0 || tab === 2 ? (
              <Bar 
                dataKey="high" 
                name="High"
                fill={chartColors.high} 
                radius={[0, 4, 4, 0]}
                barSize={30}

                animationDuration={1200}
              />
            ) : null}
            
            {tab === 0 || tab === 3 ? (
              <Bar 
                dataKey="medium" 
                name="Medium"
                fill={chartColors.medium} 
                radius={[0, 4, 4, 0]}
                barSize={30}
                animationDuration={1400}
              />
            ) : null}
            
            {tab === 0 || tab === 4 ? (
              <Bar 
                dataKey="low" 
                name="Low"
                fill={chartColors.low} 
                radius={[0, 4, 4, 0]}
                barSize={30}
                animationDuration={1600}
              />
            ) : null}
          </BarChart>
        </ResponsiveContainer>
      </Box>
      
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
          * Data represents closed vulnerabilities per year by severity
        </Typography>
      </Box>
    </DashboardCard>
  );
};

export default YearlyTrendChart;