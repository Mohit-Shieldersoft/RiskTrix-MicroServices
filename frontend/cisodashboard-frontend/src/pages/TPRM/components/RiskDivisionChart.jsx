import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  Sector
} from 'recharts';
import { Box, Typography, useTheme } from '@mui/material';
import dashboardTheme from '../../../theme/dashboardTheme';

const RiskDivisionChart = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [chartData, setChartData] = useState([]);
  const theme = useTheme();
  
  useEffect(() => {
    if (!data || data.length === 0) {
      setChartData([]);
      return;
    }
    
    // Count vendors by risk level
    const riskCounts = data.reduce((acc, vendor) => {
      acc[vendor.risk] = (acc[vendor.risk] || 0) + 1;
      return acc;
    }, {});
    
    // Convert to array for chart
    const chartData = [
      { name: 'Critical', value: riskCounts.Critical || 0, color: dashboardTheme.colors.severity.critical },
      { name: 'High', value: riskCounts.High || 0, color: dashboardTheme.colors.severity.high },
      { name: 'Medium', value: riskCounts.Medium || 0, color: dashboardTheme.colors.severity.medium },
      { name: 'Low', value: riskCounts.Low || 0, color: dashboardTheme.colors.severity.low },
      { name: 'None', value: riskCounts.None || 0, color: dashboardTheme.colors.none }
    ].filter(item => item.value > 0); // Remove empty categories
    
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
            {data.name} Risk
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
          No risk data available
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ height: '100%', position: 'relative' ,
     overflow: 'visible',
           minHeight: 240                 // ensure ResponsiveContainer has some height to work with

                // <--- allow overflow

    }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={chartData}
            cx="50%"
            cy="52%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={4}
            dataKey="value"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                // stroke="white"
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
          top: '46%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
          mb:3
        }}
      >
        <Typography 
          variant="h4" 
          sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}
        >
          {data.length}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
          Vendors
        </Typography>
      </Box>
    </Box>
  );
};

export default RiskDivisionChart;