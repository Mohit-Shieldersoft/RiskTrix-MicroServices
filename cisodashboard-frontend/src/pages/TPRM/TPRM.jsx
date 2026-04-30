// import React, { useState, useEffect } from 'react';
// import {
//   Box, Grid, Typography, Paper, Divider,
//   useTheme, useMediaQuery, styled
// } from '@mui/material';
// import VendorTrackerTable from './components/VendorTrackerTable';
// import DelayTrackerTable from './components/DelayTrackerTable';
// import RiskDivisionChart from './components/RiskDivisionChart';
// import NonCompliantChart from './components/NonCompliantChart';
// import ExpiredVendorsTable from './components/ExpiredVendorsTable';
// import { generateMockTPRMData } from './mockData';
// import dashboardTheme from '../../theme/dashboardTheme';
// import './TPRM.css';

// // Custom styled components
// const GradientBox = styled(Box)(({ theme }) => ({
//   background: 'linear-gradient(135deg, rgba(240,242,245,1) 0%, rgba(245,247,250,1) 100%)',
//   borderRadius: dashboardTheme.borderRadius.lg,
//   overflow: 'hidden',
// }));

// const StatChip = styled(Box)(({ bgcolor }) => ({
//   padding: '8px 16px',
//   borderRadius: '50px',
//   backgroundColor: bgcolor || '#4A6572',
//   color: 'white',
//   fontWeight: 500,
//   boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
//   transition: 'all 0.3s',
//   '&:hover': {
//     transform: 'translateY(-2px)',
//     boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)'
//   }
// }));

// const TPRM = () => {
//   // State variables
//   const [tprmData, setTPRMData] = useState(null);
//   const [loading, setLoading] = useState(true);

//   // Current date and user
//   const currentDateTime = "2025-04-04 05:30:20";
//   const currentUser = "SarthakDeb";

//   // Theme breakpoints for responsive design
//   const theme = useTheme();
//   const isMobile = useMediaQuery(theme.breakpoints.down('md'));

//   // Load data on component mount
//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       // In a real app, you would fetch this data from an API
//       const data = generateMockTPRMData();
//       setTPRMData(data);
//       setLoading(false);
//     };

//     fetchData();
//   }, []);

//   // Calculate summary statistics
//   const getStats = () => {
//     if (!tprmData) return {
//       totalVendors: 0,
//       nonCompliantVendors: 0,
//       expiredVendors: 0,
//       delayedVendors: 0
//     };

//     return {
//       totalVendors: tprmData.vendors.length,
//       nonCompliantVendors: tprmData.vendors.filter(v => v.nonCompliantApps > 0).length,
//       expiredVendors: tprmData.expiredVendors.length,
//       delayedVendors: tprmData.delayedVendors.length
//     };
//   };

//   const stats = getStats();

//   return (
//     <Box sx={{
//       p: { xs: 2, md: 3 },
//       maxWidth: '100%',
//       minHeight: 'calc(100vh - 64px)',
//       overflow: 'auto'
//     }}>
//       {/* Page Header */}
//       <Box className="dashboard-header" sx={{ mb: 3 }}>
//         <Typography variant="h4" component="h1" sx={{
//           position: 'relative',
//           fontWeight: dashboardTheme.typography.fontWeights.bold,
//           opacity: 1, // Ensure visibility
//           color: '#ffffff' // Ensure contrast
//         }}>
//           Third-Party Risk Management
//         </Typography>
//         <Typography variant="subtitle1" component="h5" sx={{
//           position: 'relative',
//           opacity: 1, // Ensure visibility
//           color: '#ffffff' // Ensure contrast
//         }}>
//           {currentDateTime} • {currentUser}
//         </Typography>

//         {/* <Grid container spacing={2} sx={{ mt: 1 }}>
//           <Grid item xs={6} sm={3}>
//             <StatChip bgcolor="#3949ab">
//               <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
//                 Total Vendors: {stats.totalVendors}
//               </Typography>
//             </StatChip>
//           </Grid>

//           <Grid item xs={6} sm={3}>
//             <StatChip bgcolor="#e53935">
//               <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
//                 Non-Compliant: {stats.nonCompliantVendors}
//               </Typography>
//             </StatChip>
//           </Grid>

//           <Grid item xs={6} sm={3}>
//             <StatChip bgcolor="#f57c00">
//               <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
//                 Expired: {stats.expiredVendors}
//               </Typography>
//             </StatChip>
//           </Grid>

//           <Grid item xs={6} sm={3}>
//             <StatChip bgcolor="#1e88e5">
//               <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
//                 Delayed: {stats.delayedVendors}
//               </Typography>
//             </StatChip>
//           </Grid>
//         </Grid> */}
//         </Box>

//       {/* Main Content */}
//       <Grid container spacing={3}>
//         {/* Left Half - Tables */}
//         <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
//           {/* Vendor Tracker Table */}
//           <Paper
//             elevation={0}
//             className="futuristic-card"
//             sx={{
//               p: 0,
//               overflow: 'hidden',
//               height: '49%',
//               minHeight: '340px',
//               flexGrow: 1,
//             }}
//           >
//             <Box sx={{ p: 2, bgcolor: dashboardTheme.colors.background.card }}>
//               <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
//                 Vendor Tracker
//               </Typography>
//             </Box>
//             <Divider />
//             <Box sx={{ height: 'calc(100% - 53px)', overflow: 'hidden' }}>
//               <VendorTrackerTable data={tprmData?.vendors || []} />
//             </Box>
//           </Paper>

//           {/* Delay Tracker Table */}
//           <Paper
//             elevation={0}
//             className="futuristic-card"
//             sx={{
//               p: 0,
//               overflow: 'hidden',
//               height: '49%',
//               minHeight: '340px',
//               flexGrow: 1,
//             }}
//           >
//             <Box sx={{ p: 2, bgcolor: dashboardTheme.colors.background.card }}>
//               <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
//                 Delay Tracker
//               </Typography>
//             </Box>
//             <Divider />
//             <Box sx={{ height: 'calc(100% - 53px)', overflow: 'hidden' }}>
//               <DelayTrackerTable data={tprmData?.delayedVendors || []} />
//             </Box>
//           </Paper>
//         </Grid>

//         {/* Right Half - Charts and Expired Table */}
//         <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
//           {/* Top Section - Risk Division Chart (Full Width) */}
//           <Paper
//             elevation={0}
//             className="futuristic-card"
//             sx={{
//               p: 0,
//               overflow: 'hidden',
//               height: '450px'
//             }}
//           >
//             <Box sx={{ p: 2, bgcolor: dashboardTheme.colors.background.card }}>
//               <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
//                 Risk Division
//               </Typography>
//             </Box>
//             <Divider />
//             <Box sx={{ height: 'calc(100% - 53px)', p: 8 }}>
//               <RiskDivisionChart data={tprmData?.vendors || []} />
//             </Box>
//           </Paper>

//           {/* Bottom Section - Two columns */}
//           <Grid container spacing={1} sx={{ m: 0, width: '100%' }}>
//             {/* Non-Compliant Pie Chart - Left Half */}
//             <Grid item xs={10} sm={6} sx={{ pl: 0, pr: { xs: 0, sm: 1.5 } }}>
//               <Paper
//                 elevation={0}
//                 className="futuristic-card"
//                 sx={{
//                   p: 0,
//                   overflow: 'hidden',
//                   height: '300px'
//                 }}
//               >
//                 <Box sx={{ p: 0, bgcolor: dashboardTheme.colors.background.card }}>
//                   <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
//                     Non-Compliant Status
//                   </Typography>
//                 </Box>
//                 <Divider />
//                 <Box sx={{ height: 'calc(100% - 58px)', p: 1 }}>
//                   <NonCompliantChart data={tprmData?.vendors || []} />
//                 </Box>
//               </Paper>
//             </Grid>

//             {/* Expired Vendors Table - Right Half */}
//             <Grid item xs={12} sm={8} sx={{ pl: { xs: 0, sm: 1.5 }, pr: 0 }}>
//               <Paper
//                 elevation={0}
//                 className="futuristic-card"
//                 sx={{
//                   p: 0,
//                   overflow: 'hidden',
//                   height: '350px'
//                 }}
//               >
//                 <Box sx={{ p: 2, bgcolor: dashboardTheme.colors.background.card }}>
//                   <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
//                     Expired Vendors
//                   </Typography>
//                 </Box>
//                 <Divider />
//                 <Box sx={{ height: 'calc(100% - 53px)', overflow: 'auto' }}>
//                   <ExpiredVendorsTable data={tprmData?.expiredVendors || []} />
//                 </Box>
//               </Paper>
//             </Grid>
//           </Grid>
//         </Grid>
//       </Grid>
//     </Box>
//   );
// };

// export default TPRM;

import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  Paper,
  Divider,
  useTheme,
  useMediaQuery,
  styled,
  CircularProgress,
  Alert,
} from "@mui/material";
import VendorTrackerTable from "./components/VendorTrackerTable";
import DelayTrackerTable from "./components/DelayTrackerTable";
import RiskDivisionChart from "./components/RiskDivisionChart";
import NonCompliantChart from "./components/NonCompliantChart";
import ExpiredVendorsTable from "./components/ExpiredVendorsTable";
import { getTPRMData } from "../../utils/tprmApi";
import dashboardTheme from "../../theme/dashboardTheme";
import "./TPRM.css";

// Styled helpers
const GradientBox = styled(Box)(({ theme }) => ({
  background:
    "linear-gradient(135deg, rgba(240,242,245,1) 0%, rgba(245,247,250,1) 100%)",
  borderRadius: dashboardTheme.borderRadius.lg,
  overflow: "hidden",
}));

const StatChip = styled(Box)(({ bgcolor }) => ({
  padding: "8px 16px",
  borderRadius: "50px",
  backgroundColor: bgcolor || "#4A6572",
  color: "white",
  fontWeight: 500,
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  transition: "all 0.3s",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)",
  },
}));

const cardPaper = {
  p: 0,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
};

const TPRM = () => {
  const [tprmData, setTPRMData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentDateTime = new Date().toLocaleString();
  const currentUser = localStorage.getItem("userEmail") || "User";

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getTPRMData();
        setTPRMData(data);
      } catch (err) {
        console.error("Failed to fetch TPRM data:", err);
        setError("Failed to load TPRM data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStats = () => {
    // Defensive access: tprmData may exist but missing keys while async-loading
    const vendors = tprmData?.vendors || [];
    const expired = tprmData?.expiredVendors || [];
    const delayed = tprmData?.delayedVendors || [];

    return {
      totalVendors: vendors.length,
      nonCompliantVendors: vendors.filter((v) => (v.nonCompliantApps ?? 0) > 0)
        .length,
      expiredVendors: expired.length,
      delayedVendors: delayed.length,
    };
  };

  const stats = getStats();

  // Show loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        maxWidth: "100%",
        minHeight: "calc(100vh - 64px)",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <Box className="dashboard-header" sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            position: "relative",
            fontWeight: dashboardTheme.typography.fontWeights.bold,
            color: "#ffffff",
          }}
        >
          Third-Party Risk Management
        </Typography>
        <Typography
          variant="subtitle1"
          component="h5"
          sx={{
            position: "relative",
            color: "#ffffff",
          }}
        >
          {currentDateTime} • {currentUser}
        </Typography>
      </Box>

      {/* Main grid */}
      <Grid container spacing={3}>
        {/* LEFT: two stacked tables that split available vertical space */}
        <Grid
          size={{ xs: 12, md: 6 }}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            // ensure left column expands on large screens
            minHeight: { xs: "auto", md: "600px" },
          }}
        >
          {/* Vendor Tracker */}
          <Paper
            elevation={0}
            className="futuristic-card"
            sx={{
              ...cardPaper,
              flex: "1 1 0",
              minHeight: 300,
            }}
          >
            <Box sx={{ p: 2, bgcolor: dashboardTheme.colors.background.card }}>
              <Typography variant="h6" sx={{ fontWeight: "medium" }}>
                Vendor Tracker
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
              <VendorTrackerTable data={tprmData?.vendors || []} />
            </Box>
          </Paper>

          {/* Delay Tracker */}
          <Paper
            elevation={0}
            className="futuristic-card"
            sx={{
              ...cardPaper,
              flex: "1 1 0",
              minHeight: 300,
            }}
          >
            <Box sx={{ p: 2, bgcolor: dashboardTheme.colors.background.card }}>
              <Typography variant="h6" sx={{ fontWeight: "medium" }}>
                Delay Tracker
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
              <DelayTrackerTable data={tprmData?.delayedVendors || []} />
            </Box>
          </Paper>
        </Grid>

        {/* RIGHT: Chart on top, two responsive widgets below */}
        <Grid
          size={{ xs: 12, md: 6 }}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            minHeight: { xs: "auto", md: "600px" },
          }}
        >
          {/* Top: risk chart - give it a responsive minHeight */}
          <Paper
            elevation={0}
            className="futuristic-card"
            sx={{
              ...cardPaper,
              minHeight: { xs: 280, sm: 340, md: 360 },
              // allow chart to grow
              flex: "0 1 auto",
            }}
          >
            <Box sx={{ p: 2, bgcolor: dashboardTheme.colors.background.card }}>
              <Typography variant="h6" sx={{ fontWeight: "medium" }}>
                Risk Division
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ flex: 1, minHeight: 0, p: { xs: 1, sm: 3 } }}>
              <RiskDivisionChart data={tprmData?.vendors || []} />
            </Box>
          </Paper>

          {/* Bottom: responsive 2-column area that collapses to 1 column on small screens */}
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              alignItems: "stretch",
            }}
          >
            <Paper
              elevation={0}
              className="futuristic-card"
              sx={{
                ...cardPaper,
                minHeight: 260,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                sx={{ p: 2, bgcolor: dashboardTheme.colors.background.card }}
              >
                <Typography variant="h6" sx={{ fontWeight: "medium" }}>
                  Non-Compliant Status
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 1, flex: 1, minHeight: 0 }}>
                <NonCompliantChart data={tprmData?.vendors || []} />
              </Box>
            </Paper>

            <Paper
              elevation={0}
              className="futuristic-card"
              sx={{
                ...cardPaper,
                minHeight: 260,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                sx={{ p: 2, bgcolor: dashboardTheme.colors.background.card }}
              >
                <Typography variant="h6" sx={{ fontWeight: "medium" }}>
                  Expired Vendors
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", p: 1 }}>
                <ExpiredVendorsTable data={tprmData?.expiredVendors || []} />
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TPRM;
