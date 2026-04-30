import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  Sector
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import dashboardTheme from '../../../theme/dashboardTheme';

const NonCompliantChart = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [chartData, setChartData] = useState([]);
  const theme = useTheme();
  
  useEffect(() => {
    if (!data || data.length === 0) {
      setChartData([]);
      return;
    }
    
  // Count compliant vs non-compliant vendors
  // Accept both camelCase (nonCompliantApps) and snake_case (non_compliant_apps)
  const nonCompliantCount = data.filter(vendor => ((vendor.nonCompliantApps ?? vendor.non_compliant_apps ?? 0) > 0)).length;
  const compliantCount = data.length - nonCompliantCount;
    
    // Prepare data for chart
    const chartData = [
      { 
        name: 'Non-Compliant', 
        value: nonCompliantCount,
        color: dashboardTheme.colors.error
      },
      { 
        name: 'Compliant', 
        value: compliantCount,
        color: dashboardTheme.colors.success
      }
    ];
    
    // Calculate percentages
    const total = chartData.reduce((sum, item) => sum + item.value, 0);
    chartData.forEach(item => {
      item.percentage = ((item.value / total) * 100).toFixed(1);
    });
    
    setChartData(chartData);
  }, [data]);
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box sx={{
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          p: 1.5,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          border: '1px solid #eeeeee',
          borderRadius: dashboardTheme.borderRadius.md
        }}>
          <Typography sx={{ fontWeight: 'bold', color: data.color }}>
            {data.name}
          </Typography>
          <Typography variant="body2">
            Vendors: {data.value} ({data.percentage}%)
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
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
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
  
  // Custom legend renderer
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
              mb: 2
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
  
  if (chartData.length === 0) {
    return (
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        flexDirection: 'column' 
      }}>
        <Typography variant="body2" color="text.secondary">
          No vendor data available
        </Typography>
      </Box>
    );
  }
  
  // Find non-compliant percentage
  const nonCompliantData = chartData.find(item => item.name === 'Non-Compliant');
  const nonCompliantPercentage = nonCompliantData ? nonCompliantData.percentage : '0.0';
  
  return (
    <Box sx={{ height: '100%', position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            startAngle={90}
            endAngle={-270}
            paddingAngle={2}
            dataKey="value"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                stroke="white"
                strokeWidth={2}
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
          top: '40%', 
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
          {nonCompliantPercentage}%
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          Non-Compliant
        </Typography>
      </Box>
    </Box>
  );
};

export default NonCompliantChart;