// import React, { useState } from 'react';
// import { 
//   BarChart, Bar, XAxis, YAxis, CartesianGrid, 
//   Tooltip, Legend, ResponsiveContainer
// } from 'recharts';
// import { Box, Typography, Button, ButtonGroup } from '@mui/material';
// import DashboardCard from '../../../components/common/DashboardCard';
// import dashboardTheme from '../../../theme/dashboardTheme';

// // Custom tooltip
// const CustomTooltip = ({ active, payload, label }) => {
//   if (active && payload && payload.length) {
//     return (
//       <Box sx={{
//         bgcolor: 'rgba(255, 255, 255, 0.95)',
//         p: 1.5,
        
//         boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
//         border: '1px solid #eeeeee',
//         borderRadius: dashboardTheme.borderRadius.md
//       }}>
//         <Typography sx={{ fontWeight: 'bold', mb: 1 }}>
//           Category: {label}
//         </Typography>
        
//         {payload.map((entry, index) => (
//           <Box 
//             key={`item-${index}`} 
//             sx={{ 
//               display: 'flex',
//               alignItems: 'center',
//               mb: 0.5
//             }}
//           >
//             <Box 
//               sx={{ 
//                 width: 12, 
//                 height: 12, 
//                 backgroundColor: entry.color,
//                 borderRadius: '50%',
//                 mr: 1
//               }}
//             />
//             <Typography variant="body2">
//               {entry.name}: {entry.value}
//             </Typography>
//           </Box>
//         ))}
//       </Box>
//     );
//   }
//   return null;
// };


// const CustomLegend = ({ payload }) => (
//   <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', pt: 1 }}>
//     {payload.map((entry) => (
//       <Box key={entry.value} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//         <Box
//           sx={{
//             width: 20,   // custom width
//             height: 20,   // custom height
//             backgroundColor: entry.color,
//             // borderRadius: 1
//           }}
//         />
//         <Typography sx={{ fontSize: 13, color: 'text.primary', fontWeight: 500 }}>
//           {entry.value}
//         </Typography>
//       </Box>
//     ))}
//   </Box>
// );

// const CategoryHistogram = ({ data }) => {
//   const [chartType, setChartType] = useState('stacked');
  
//   // Total vulnerabilities by category for sorting
//   const categoryTotals = data.map(item => ({
//     category: item.category,
//     total: item.critical + item.high + item.medium + item.low
//   })).sort((a, b) => b.total - a.total);
  
//   // Sort data by total vulnerabilities
//   const sortedData = categoryTotals.map(cat => 
//     data.find(item => item.category === cat.category)
//   );
  
//   // Define chart colors
//   const chartColors = {
//     critical: dashboardTheme.colors.severity.critical,
//     high: dashboardTheme.colors.severity.high,
//     medium: dashboardTheme.colors.severity.medium,
//     low: dashboardTheme.colors.severity.low
//   };
  
//   return (
//     <DashboardCard 
//       title="Vulnerabilities by Application Category"
//       height={400}
//     >
//       <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
//         <ButtonGroup size="small" variant="outlined">
//           <Button 
//             onClick={() => setChartType('stacked')}
//             variant={chartType === 'stacked' ? 'contained' : 'outlined'}
//           >
//             Stacked
//           </Button>
//           <Button 
//             onClick={() => setChartType('grouped')}
//             variant={chartType === 'grouped' ? 'contained' : 'outlined'}
//           >
//             Grouped
//           </Button>
//         </ButtonGroup>
//       </Box>
      
//       <ResponsiveContainer width="100%" height="85%">
//         <BarChart
//           data={sortedData}
//           margin={{ top: 20, right: 30, left: 5, bottom: 5 }}
//           barGap={chartType === 'grouped' ? 2 : 0}
//           barCategoryGap={chartType === 'grouped' ? '15%' : '35%'}
//         >
//           <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//           <XAxis 
//             dataKey="category" 
//             tick={{ fill: dashboardTheme.colors.text.secondary }}
//             axisLine={{ stroke: '#e0e0e0' }}
//             tickLine={{ stroke: '#e0e0e0' }}
//           />
//           <YAxis 
//             tick={{ fill: dashboardTheme.colors.text.secondary }}
//             axisLine={{ stroke: '#e0e0e0' }}
//             tickLine={{ stroke: '#e0e0e0' }}
//             label={{ 
//               value: 'Count', 
//               angle: -90, 
//               position: 'insideLeft',
//               style: { fill: dashboardTheme.colors.text.secondary }
//             }}
//           />
//           <Tooltip content={<CustomTooltip />} />
//           {/* <Legend 
//               wrapperStyle={{ paddingTop: '5px', paddingBottom: '25px' }}
//               formatter={(value) => (
//                 <span style={{ color: dashboardTheme.colors.text.primary, fontWeight: 500 }}>{value}</span>
//               )}
//             /> */}

//             <Legend
//               //  verticalAlign="bottom"
//               // align="center"
//               content={<CustomLegend />}
//             />
//           <Bar 
//             dataKey="critical" 
//             name="Critical" 
//             fill={chartColors.critical}
//             radius={chartType === 'stacked' ? [0, 0, 0, 0] : [3, 3, 0, 0]}
//             stackId={chartType === 'stacked' ? 'a' : undefined}
//             animationDuration={1000}
//             animationBegin={0}
//           />
//           <Bar 
//             dataKey="high" 
//             name="High" 
//             fill={chartColors.high}
//             radius={chartType === 'stacked' ? [0, 0, 0, 0] : [3, 3, 0, 0]}
//             stackId={chartType === 'stacked' ? 'a' : undefined}
//             animationDuration={1000}
//             animationBegin={100}
//           />
//           <Bar 
//             dataKey="medium" 
//             name="Medium" 
//             fill={chartColors.medium}
//             radius={chartType === 'stacked' ? [0, 0, 0, 0] : [3, 3, 0, 0]}
//             stackId={chartType === 'stacked' ? 'a' : undefined}
//             animationDuration={1000}
//             animationBegin={200}
//           />
//           <Bar 
//             dataKey="low" 
//             name="Low" 
//             fill={chartColors.low}
//             radius={chartType === 'stacked' ? [0, 0, 3, 3] : [3, 3, 0, 0]}
//             stackId={chartType === 'stacked' ? 'a' : undefined}
//             animationDuration={1000}
//             animationBegin={300}
//           />
//         </BarChart>
//       </ResponsiveContainer>
//     </DashboardCard>
//   );
// };

// export default CategoryHistogram;


import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Box, Typography, Button, ButtonGroup } from '@mui/material';
import DashboardCard from '../../../components/common/DashboardCard';
import dashboardTheme from '../../../theme/dashboardTheme';

// Custom tooltip (unchanged)
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
          Category: {label}
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

// CustomLegend now receives `payload` (from recharts) and `totals` (map name -> sum)
const CustomLegend = ({ payload = [], totals = {}, iconSize = 16, fontSize = 13 }) => (
  <Box sx={{
    display: 'flex',
    justifyContent: 'center',
    gap: 2,
    flexWrap: 'wrap',
    pt: 1,
    pb: 1
  }}>
    {payload.map((entry) => {
      // entry.value is the name you set on <Bar name="...">
      const count = totals[entry.value] ?? 0;
      return (
        <Box key={entry.value} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 0.5 }}>
          <Box
            sx={{
              width: iconSize,
              height: iconSize,
              backgroundColor: entry.color,
              // borderRadius: 1
            }}
          />
          <Typography sx={{ fontSize: fontSize, color: 'text.primary', fontWeight: 500 }}>
            {entry.value} {`(${count})`}
          </Typography>
        </Box>
      );
    })}
  </Box>
);

const CategoryHistogram = ({ data }) => {
  const [chartType, setChartType] = useState('stacked');

  // Total vulnerabilities by category for sorting
  const categoryTotals = data.map(item => ({
    category: item.category,
    total: item.critical + item.high + item.medium + item.low
  })).sort((a, b) => b.total - a.total);

  // Sort data by total vulnerabilities
  const sortedData = categoryTotals.map(cat =>
    data.find(item => item.category === cat.category)
  );

  // Series definition so we can compute totals and keep names consistent
  const series = [
    { key: 'critical', name: 'Critical' },
    { key: 'high', name: 'High' },
    { key: 'medium', name: 'Medium' },
    { key: 'low', name: 'Low' }
  ];

  // Compute totals for each series (sum across sortedData)
  const totals = series.reduce((acc, s) => {
    acc[s.name] = sortedData.reduce((sum, row) => {
      const v = row?.[s.key];
      return sum + (typeof v === 'number' ? v : 0);
    }, 0);
    return acc;
  }, {});

  // Define chart colors
  const chartColors = {
    critical: dashboardTheme.colors.severity.critical,
    high: dashboardTheme.colors.severity.high,
    medium: dashboardTheme.colors.severity.medium,
    low: dashboardTheme.colors.severity.low
  };

  return (
    <DashboardCard
      title="Vulnerabilities by Application Category"
      height={460} /* make a little extra room for legend */
    >
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <ButtonGroup size="small" variant="outlined">
          <Button
            onClick={() => setChartType('stacked')}
            variant={chartType === 'stacked' ? 'contained' : 'outlined'}
          >
            Stacked
          </Button>
          <Button
            onClick={() => setChartType('grouped')}
            variant={chartType === 'grouped' ? 'contained' : 'outlined'}
          >
            Grouped
          </Button>
        </ButtonGroup>
      </Box>

      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          data={sortedData}
          margin={{ top: 20, right: 30, left: 5, bottom: 60 }} // leave space for legend
          barGap={chartType === 'grouped' ? 2 : 0}
          barCategoryGap={chartType === 'grouped' ? '15%' : '35%'}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="category"
            tick={{ fill: dashboardTheme.colors.text.secondary }}
            axisLine={{ stroke: '#e0e0e0' }}
            tickLine={{ stroke: '#e0e0e0' }}
          />
          <YAxis
            tick={{ fill: dashboardTheme.colors.text.secondary }}
            axisLine={{ stroke: '#e0e0e0' }}
            tickLine={{ stroke: '#e0e0e0' }}
            label={{
              value: 'Count',
              angle: -90,
              position: 'insideLeft',
              style: { fill: dashboardTheme.colors.text.secondary }
            }}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Use custom legend and pass `totals` so counts are shown */}
          <Legend
            verticalAlign="bottom"
            align="center"
            content={(props) => <CustomLegend {...props} totals={totals} iconSize={14} fontSize={13} />}
          />

          <Bar
            dataKey="critical"
            name="Critical"
            fill={chartColors.critical}
            radius={chartType === 'stacked' ? [0, 0, 0, 0] : [3, 3, 0, 0]}
            stackId={chartType === 'stacked' ? 'a' : undefined}
            animationDuration={1000}
            animationBegin={0}
          />
          <Bar
            dataKey="high"
            name="High"
            fill={chartColors.high}
            radius={chartType === 'stacked' ? [0, 0, 0, 0] : [3, 3, 0, 0]}
            stackId={chartType === 'stacked' ? 'a' : undefined}
            animationDuration={1000}
            animationBegin={100}
          />
          <Bar
            dataKey="medium"
            name="Medium"
            fill={chartColors.medium}
            radius={chartType === 'stacked' ? [0, 0, 0, 0] : [3, 3, 0, 0]}
            stackId={chartType === 'stacked' ? 'a' : undefined}
            animationDuration={1000}
            animationBegin={200}
          />
          <Bar
            dataKey="low"
            name="Low"
            fill={chartColors.low}
            radius={chartType === 'stacked' ? [0, 0, 3, 3] : [3, 3, 0, 0]}
            stackId={chartType === 'stacked' ? 'a' : undefined}
            animationDuration={1000}
            animationBegin={300}
          />
        </BarChart>
      </ResponsiveContainer>
    </DashboardCard>
  );
};

export default CategoryHistogram;
