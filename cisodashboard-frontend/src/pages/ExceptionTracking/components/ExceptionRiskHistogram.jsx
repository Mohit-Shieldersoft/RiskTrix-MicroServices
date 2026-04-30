import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import dashboardTheme from '../../../theme/dashboardTheme';

const ExceptionRiskHistogram = ({ critical, high, medium, low }) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Responsive sizing - optimized for column layout
  const barSize = isXs ? 30 : isSm ? 40 : 50;
  const margins = isXs 
    ? { top: 20, right: 15, left: 5, bottom: 20 }
    : isSm
    ? { top: 25, right: 20, left: 10, bottom: 25 }
    : { top: 30, right: 25, left: 15, bottom: 30 };
  const fontSize = isXs ? 11 : isSm ? 12 : 13;
  const labelOffset = isXs ? 6 : isSm ? 8 : 10;
  
  // Prepare data for the chart
  const data = [
    { 
      name: 'Critical', 
      value: critical, 
      color: dashboardTheme.colors.severity.critical 
    },
    { 
      name: 'High', 
      value: high, 
      color: dashboardTheme.colors.severity.high 
    },
    { 
      name: 'Medium', 
      value: medium, 
      color: dashboardTheme.colors.severity.medium 
    },
    { 
      name: 'Low', 
      value: low, 
      color: dashboardTheme.colors.severity.low 
    },
  ];
  
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
            {data.name} Risk
          </Typography>
          <Typography variant="body2">
            Exceptions: {data.value}
          </Typography>
        </Box>
      );
    }
    return null;
  };
  
  return (
    <Box sx={{ height: '100%', position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={margins}
          barSize={barSize}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: theme.palette.text.secondary, fontWeight: 500, fontSize }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: theme.palette.text.secondary, fontSize }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="value" 
            radius={[8, 8, 0, 0]}
            background={{ fill: '#f5f5f5', radius: [8, 8, 0, 0] }}
            animationBegin={300}
            animationDuration={1500}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                style={{
                  filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.1))',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
            <LabelList 
              dataKey="value" 
              position="top" 
              fill={theme.palette.text.primary}
              fontWeight={700}
              fontSize={fontSize}
              offset={labelOffset}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default ExceptionRiskHistogram;