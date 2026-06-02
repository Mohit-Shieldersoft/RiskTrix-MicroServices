// import React from 'react';
// import { 
//   BarChart, Bar, XAxis, YAxis, CartesianGrid, 
//   Tooltip, Legend, ResponsiveContainer, LabelList 
// } from 'recharts';
// import { Box, Typography, Paper } from '@mui/material';
// import dashboardTheme from '../../../theme/dashboardTheme';

// const TopVendorsChart = ({ vendorData }) => {
//   if (!vendorData) return null;
  
//   // Get top 5 vendors by application count and prepare data for the chart
//   const topVendors = [...vendorData]
//     .sort((a, b) => b.applications.length - a.applications.length)
//     .slice(0, 5)
//     .map(vendor => {
//       const compliantApps = vendor.applications.filter(app => app.isoCompliant && app.pciCompliant).length;
//       const nonCompliantApps = vendor.applications.length - compliantApps;
      
//       return {
//         name: vendor.name,
//         compliant: compliantApps,
//         nonCompliant: nonCompliantApps,
//         total: vendor.applications.length,
//         compliantPercentage: ((compliantApps / vendor.applications.length) * 100).toFixed(0)
//       };
//     });
  
//   // Custom tooltip
//   const CustomTooltip = ({ active, payload, label }) => {
//     if (active && payload && payload.length) {
//       return (
//         <Box 
//           sx={{ 
//             backgroundColor: 'white', 
//             padding: '10px', 
//             border: '1px solid #f5f5f5',
//             borderRadius: '8px',
//             boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
//           }}
//         >
//           <Typography sx={{ fontWeight: 'bold', mb: 1 }}>
//             {label}
//           </Typography>
//           <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
//             {payload.map((entry, index) => (
//               <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                 <Box 
//                   sx={{ 
//                     width: 12, 
//                     height: 12, 
//                     backgroundColor: entry.color, 
//                     borderRadius: '50%' 
//                   }} 
//                 />
//                 <Typography variant="body2">
//                   {entry.name}: {entry.value} applications
//                 </Typography>
//               </Box>
//             ))}
//             <Typography 
//               variant="body2" 
//               sx={{ mt: 1, fontWeight: 'medium', color: 'text.secondary' }}
//             >
//               Total: {payload[0].payload.total} applications
//             </Typography>
//           </Box>
//         </Box>
//       );
//     }
//     return null;
//   };
  
//   // Label formatter for the chart
//   const labelFormatter = (entry) => {
//     return entry.compliantPercentage + '%';
//   };
  
//   return (
//     <Paper
//   elevation={0}
//   sx={{
//     p: 3,
//     height: '100%',
//     width: '100%', // Add this to ensure full width
//     minWidth: { xs: '100%', md: '800px' },
//     maxWidth: '100%',
//     overflowX: 'auto',
//     borderRadius: dashboardTheme.borderRadius.lg,
//     background: 'linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%)',
//     boxShadow: '0 10px 20px rgba(0, 0, 0, 0.05)',
//     transition: 'transform 0.3s',
//     border: '1px solid rgba(0,0,0,0.03)',
//     '&:hover': {
//       transform: 'translateY(-5px)',
//       boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)',
//     },
//   }}
// >
//       <Typography
//         variant="h6"
//         sx={{ 
//           mb: 2,
//           fontWeight: dashboardTheme.typography.fontWeights.semibold,
//           color: dashboardTheme.colors.text.primary,
//         }}
//       >
//         Top 5 Vendors by Application Count
//       </Typography>
      
//       <Box sx={{ height: 400, width: '100%' }}>
//         <ResponsiveContainer width="100%" height="100%">
//           <BarChart
//             data={topVendors}
//             margin={{ top: 5, right: 30, left: 20, bottom: 40 }}
//           >
//             <CartesianGrid strokeDasharray="3 3" horizontal={false} />
//             <YAxis type="number" domain={[0, 'dataMax']} />
//             <XAxis 
//               dataKey="name" 
//               type="category" 
//               tick={{ fill: dashboardTheme.colors.text.secondary }}
//               width={150}
//               height={80} // Allow more height for names
//               angle={-45} // Angle labels to prevent overlap
//               textAnchor="end"
//             />
//             <Tooltip content={<CustomTooltip />} />
//             <Legend />
//             <Bar 
//   dataKey="compliant" 
//   name="Compliant" 
//   stackId="a" 
//   fill="#4CAF50"
//   radius={[4, 0, 0, 4]}
//   animationBegin={0}
//   animationDuration={1500}
//   barSize={35} // Make bars narrower (default is usually ~32px)
// >
//   <LabelList 
//     dataKey={labelFormatter} 
//     position="center"
//     fill="#fff" 
//     style={{ fontWeight: 'bold', fontSize: '12px', textShadow: '0px 0px 2px rgba(0,0,0,0.5)' }} 
//   />
// </Bar>
// <Bar 
//   dataKey="nonCompliant" 
//   name="Non-Compliant" 
//   stackId="a" 
//   fill="#FF5252"
//   radius={[0, 4, 4, 0]}
//   animationBegin={300}
//   animationDuration={1500}
//   // No need to add barSize here as it inherits from the first Bar in the same stack
// />
//           </BarChart>
//         </ResponsiveContainer>
//       </Box>
//     </Paper>
//   );
// };

// export default TopVendorsChart;









// import React from 'react';
// import {
//   BarChart, Bar, XAxis, YAxis, CartesianGrid,
//   Tooltip, Legend, ResponsiveContainer, LabelList
// } from 'recharts';
// import { Box, Typography, Paper } from '@mui/material';
// import dashboardTheme from '../../../theme/dashboardTheme';

// const TopVendorsChart = ({ vendorData }) => {
//   if (!vendorData) return null;

//   // Build top 5 vendor data
//   const topVendors = [...vendorData]
//     .sort((a, b) => b.applications.length - a.applications.length)
//     .slice(0, 5)
//     .map(vendor => {
//       const compliantApps = vendor.applications.filter(app => app.isoCompliant && app.pciCompliant).length;
//       const nonCompliantApps = vendor.applications.length - compliantApps;

//       return {
//         name: vendor.name,
//         compliant: compliantApps,
//         nonCompliant: nonCompliantApps,
//         total: vendor.applications.length,
//         compliantPercentage: ((compliantApps / vendor.applications.length) * 100).toFixed(0)
//       };
//     });

//   // Custom tooltip (kept same as yours)
//   const CustomTooltip = ({ active, payload, label }) => {
//     if (active && payload && payload.length) {
//       return (
//         <Box
//           sx={{
//             backgroundColor: 'white',
//             padding: '10px',
//             border: '1px solid #f5f5f5',
//             borderRadius: '8px',
//             boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
//           }}
//         >
//           <Typography sx={{ fontWeight: 'bold', mb: 1 }}>{label}</Typography>
//           <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
//             {payload.map((entry, index) => (
//               <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                 <Box sx={{ width: 12, height: 12, backgroundColor: entry.color, borderRadius: '50%' }} />
//                 <Typography variant="body2">
//                   {entry.name}: {entry.value} applications
//                 </Typography>
//               </Box>
//             ))}
//             <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium', color: 'text.secondary' }}>
//               Total: {payload[0].payload.total} applications
//             </Typography>
//           </Box>
//         </Box>
//       );
//     }
//     return null;
//   };

//   // Label formatter for the chart
//   const labelFormatter = (entry) => `${entry.compliantPercentage}%`;

//   // ---------------------------
//   // Custom legend renderer
//   // ---------------------------
//   // You get `payload` from recharts which contains entries for each series.
//   // We control the container height, item width, icon size, wrap behavior here.
//   const renderLegend = (props) => {
//     const { payload = [] } = props;

//     // Config: tweak these to change legend size & spacing
//     const legendHeight = 56;      // total legend container height (px)
//     const itemWidth = 160;        // width allocated per legend item (px)
//     const iconSize = 14;          // size of color box/icon
//     const gap = 12;               // gap between items

//     return (
//       <Box
//         sx={{
//           width: '100%',
//           height: legendHeight,
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'flex-start',
//           gap: `${gap}px`,
//           flexWrap: 'wrap',
//           paddingTop: 1,
//           // optional: background for legend area
//           // backgroundColor: '#fafafa'
//         }}
//       >
//         {payload.map((entry, index) => {
//           // entry has { value, type, id, color, payload? }
//           const label = entry.value ?? entry.payload?.name ?? `Series ${index + 1}`;
//           return (
//             <Box
//               key={`legend-item-${index}`}
//               sx={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: 1,
//                 width: itemWidth,
//                 minWidth: 120,
//                 // keep each item on one line with ellipsis for long text
//                 whiteSpace: 'nowrap',
//                 overflow: 'hidden',
//                 textOverflow: 'ellipsis'
//               }}
//               title={label}
//             >
//               <Box
//                 sx={{
//                   width: iconSize,
//                   height: iconSize,
//                   // borderRadius: 1,
//                   backgroundColor: entry.color,
//                   boxShadow: `0 0 0 2px rgba(0,0,0,0.03) inset`
//                 }}
//               />
//               <Typography variant="body2" sx={{ fontWeight: 600, color: dashboardTheme.colors.text.primary }}>
//                 {label}
//               </Typography>
//             </Box>
//           );
//         })}
//       </Box>
//     );
//   };

//   return (
//     <Paper
//       elevation={0}
//       sx={{
//         p: 3,
//         height: '100%',
//         width: '100%',
//         minWidth: { xs: '100%', md: '800px' },
//         maxWidth: '100%',
//         overflowX: 'auto',
//         borderRadius: dashboardTheme.borderRadius.lg,
//         background: 'linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%)',
//         boxShadow: '0 10px 20px rgba(0, 0, 0, 0.05)',
//         transition: 'transform 0.3s',
//         border: '1px solid rgba(0,0,0,0.03)',
//         '&:hover': {
//           transform: 'translateY(-5px)',
//           boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)',
//         },
//       }}
//     >
//       <Typography
//         variant="h6"
//         sx={{
//           mb: 2,
//           fontWeight: dashboardTheme.typography.fontWeights.semibold,
//           color: dashboardTheme.colors.text.primary,
//         }}
//       >
//         Top 5 Vendors by Application Count
//       </Typography>

//       <Box sx={{ height: 400, width: '100%' }}>
//         <ResponsiveContainer width="100%" height="100%">
//           <BarChart data={topVendors} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
//             <CartesianGrid strokeDasharray="3 3" horizontal={false} />
//             <YAxis type="number" domain={[0, 'dataMax']} />
//             <XAxis
//               dataKey="name"
//               type="category"
//               tick={{ fill: dashboardTheme.colors.text.secondary }}
//               width={150}
//               height={80}
//               angle={-45}
//               textAnchor="end"
//             />
//             <Tooltip content={<CustomTooltip />} />

//             {/* Use custom Legend with wrapperStyle to set overall height if you want */}
//             <Legend
//               content={renderLegend}
//               verticalAlign="bottom"
//               align="center"
//               wrapperStyle={{ bottom: 0, left: 0, right: 0, width: '100%', height: 56 }}
//             />

//             <Bar
//               dataKey="compliant"
//               name="Compliant"
//               stackId="a"
//               fill="#4CAF50"
//               radius={[4, 0, 0, 4]}
//               animationBegin={0}
//               animationDuration={1500}
//               barSize={35}
//             >
//               <LabelList
//                 dataKey={labelFormatter}
//                 position="center"
//                 fill="#fff"
//                 style={{ fontWeight: 'bold', fontSize: '12px', textShadow: '0px 0px 2px rgba(0,0,0,0.5)' }}
//               />
//             </Bar>

//             <Bar
//               dataKey="nonCompliant"
//               name="Non-Compliant"
//               stackId="a"
//               fill="#FF5252"
//               radius={[0, 4, 4, 0]}
//               animationBegin={300}
//               animationDuration={1500}
//             />
//           </BarChart>
//         </ResponsiveContainer>
//       </Box>
//     </Paper>
//   );
// };

// export default TopVendorsChart;







import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, LabelList
} from 'recharts';
import { Box, Typography, Paper, useTheme, useMediaQuery } from '@mui/material';
import dashboardTheme from '../../../theme/dashboardTheme';

const TopVendorsChart = ({ vendorData }) => {
  if (!vendorData || vendorData.length === 0) return null;

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg'));

  // Use data directly from API (already sorted and limited to top 5)
  const topVendors = vendorData.map(vendor => ({
    name: vendor.name,
    compliant: vendor.compliant,
    nonCompliant: vendor.non_compliant,
    total: vendor.total,
    compliantPercentage: vendor.compliant_percentage
  }));

  // Custom tooltip (kept same as yours)
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: 'white',
            padding: '10px',
            border: '1px solid #f5f5f5',
            borderRadius: '8px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
          }}
        >
          <Typography sx={{ fontWeight: 'bold', mb: 1 }}>{label}</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {payload.map((entry, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, backgroundColor: entry.color, borderRadius: '50%' }} />
                <Typography variant="body2">
                  {entry.name}: {entry.value} applications
                </Typography>
              </Box>
            ))}
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium', color: 'text.secondary' }}>
              Total: {payload[0].payload.total} applications
            </Typography>
          </Box>
        </Box>
      );
    }
    return null;
  };

  // Label formatter for the chart
  const labelFormatter = (entry) => `${entry.compliantPercentage}%`;

  // ---------------------------
  // Custom legend renderer
  // ---------------------------
  const renderLegend = (props) => {
    const { payload = [] } = props;

    // Responsive legend sizing
    const legendHeight = isXs ? 60 : isSm ? 70 : 80;
    const itemWidth = isXs ? 140 : isSm ? 180 : 220;
    const iconSize = isXs ? 14 : isSm ? 16 : 18;
    const gap = isXs ? 12 : isSm ? 16 : 24;
    const fontSize = isXs ? 12 : isSm ? 13 : 15;

    return (
      <Box
        sx={{
          width: '100%',
          height: legendHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',   // CENTER the overall legend row
          gap: `${gap}px`,
          flexWrap: 'wrap',
          paddingTop: 1,
          boxSizing: 'border-box'
        }}
      >
        {payload.map((entry, index) => {
          const label = entry.value ?? entry.payload?.name ?? `Series ${index + 1}`;

          // Optionally compute count for label (uncomment if needed):
          // const count = entry.payload && entry.payload[ entry.dataKey || 'total' ] !== undefined
          //   ? ` (${entry.payload.total})`
          //   : '';

          return (
            <Box
              key={`legend-item-${index}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                width: itemWidth,
                minWidth: 140,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                justifyContent: 'flex-start', // item content alignment
                px: 1
              }}
              title={label}
            >
              <Box
                sx={{
                  width: iconSize,
                  height: iconSize,
                  borderRadius: 1,
                  backgroundColor: entry.color,
                  boxShadow: `0 0 0 2px rgba(0,0,0,0.03) inset`,
                  flexShrink: 0
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: dashboardTheme.colors.text.primary,
                  fontSize: `${fontSize}px`,
                  lineHeight: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {label /* + (count || '') */}
              </Typography>
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5, md: 3 },
        height: '100%',
        width: '100%',
        boxSizing: 'border-box',
        borderRadius: dashboardTheme.borderRadius.lg,
        background: 'linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%)',
        boxShadow: '0 10px 20px rgba(0, 0, 0, 0.05)',
        transition: 'transform 0.3s',
        border: '1px solid rgba(0,0,0,0.03)',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 15px 30px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <Typography
        variant="h6"
        sx={{
          mb: 2,
          fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
          fontWeight: dashboardTheme.typography.fontWeights.semibold,
          color: dashboardTheme.colors.text.primary,
        }}
      >
        Top 5 Vendors by Application Count
      </Typography>

      <Box sx={{ 
        height: { xs: 350, sm: 380, md: 420 }, 
        width: '100%',
        minWidth: 0
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={topVendors} 
            margin={{ 
              top: 5, 
              right: isXs ? 10 : isSm ? 20 : 30, 
              left: isXs ? 10 : 20, 
              bottom: isXs ? 70 : isSm ? 75 : 80 
            }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <YAxis type="number" domain={[0, 'dataMax']} />
            <XAxis
              dataKey="name"
              type="category"
              tick={{ fill: dashboardTheme.colors.text.secondary, fontSize: isXs ? 10 : 12 }}
              height={isXs ? 60 : isSm ? 70 : 80}
              angle={isXs ? -35 : -45}
              textAnchor="end"
              interval={0}
            />
            <Tooltip content={<CustomTooltip />} />

            <Legend
              content={renderLegend}
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{
                bottom: 0,
                left: 0,
                right: 0,
                width: '100%',
                height: isXs ? 60 : isSm ? 70 : 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}
            />

            <Bar
              dataKey="compliant"
              name="Compliant"
              stackId="a"
              fill="#4CAF50"
              radius={[4, 0, 0, 4]}
              animationBegin={0}
              animationDuration={1500}
              barSize={isXs ? 24 : isSm ? 32 : 40}
            >
              <LabelList
                dataKey={labelFormatter}
                position="center"
                fill="#fff"
                style={{ 
                  fontWeight: 'bold', 
                  fontSize: isXs ? '10px' : '12px', 
                  textShadow: '0px 0px 2px rgba(0,0,0,0.5)' 
                }}
              />
            </Bar>

            <Bar
              dataKey="nonCompliant"
              name="Non-Compliant"
              stackId="a"
              fill="#FF5252"
              radius={[0, 4, 4, 0]}
              animationBegin={300}
              animationDuration={1500}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default TopVendorsChart;
