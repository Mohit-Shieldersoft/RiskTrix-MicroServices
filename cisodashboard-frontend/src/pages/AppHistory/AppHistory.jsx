// import React, { useState, useEffect } from 'react';
// import { Box, Typography, Grid, Button, Menu, MenuItem, Divider, Chip } from '@mui/material';
// import DownloadIcon from '@mui/icons-material/Download';
// import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
// import MonthlyTrendChart from './components/MonthlyTrendChart';
// import YearlyTrendChart from './components/YearlyTrendChart';
// import CategoryHistogram from './components/CategoryHistogram';
// import dashboardTheme from '../../theme/dashboardTheme';
// import { generateMockData } from './mockData';
// import './AppHistory.css';

// const AppHistory = () => {
//   // State variables
//   const [selectedYear, setSelectedYear] = useState(2025);
//   const [anchorEl, setAnchorEl] = useState(null);
//   const [data, setData] = useState(null);
//   const open = Boolean(anchorEl);

//   // Generate the years for download dropdown (current year and 4 previous years)
//   const currentYear = 2025; // Using fixed year from your date
//   const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

//   // Fetch or generate data when the selected year changes
//   useEffect(() => {
//     // In a real app, you would fetch this data from your API
//     const mockData = generateMockData(selectedYear);
//     setData(mockData);
//   }, [selectedYear]);

//   const handleDownloadClick = (event) => {
//     setAnchorEl(event.currentTarget);
//   };

//   const handleMenuClose = () => {
//     setAnchorEl(null);
//   };

//   const handleYearSelect = (year) => {
//     setSelectedYear(year);
//     // In a real app, you would generate and download the report here
//     alert(`Downloading vulnerability report for ${year}`);
//     handleMenuClose();
//   };

//   if (!data) return null;

//   return (
//     <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: '100%', animation: 'fadeIn 0.5s ease-out' }}>
//       {/* Page Header */}
//       <Box className="dashboard-header" sx={{ mb: 3 }}>
//         <Typography variant="h4" component="h1" sx={{ position: 'relative' }}>
//           Application Vulnerability History
//         </Typography>
//         <Typography variant="subtitle1" component="h5" sx={{ position: 'relative' }}>
//           2025-04-02 • SarthakDeb
//         </Typography>

//         <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap', position: 'relative' }}>
//           <Chip
//             label={`Total Applications: ${data.applications.length}`}
//             sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 'bold' }}
//           />
//           <Chip
//             label={`Year: ${selectedYear}`}
//             sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 'bold' }}
//           />
//           <Chip
//             label={`Open: ${data.totalOpen}`}
//             sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 'bold' }}
//           />
//           <Chip
//             label={`Closed: ${data.totalClosed}`}
//             sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 'bold' }}
//           />
//         </Box>
//       </Box>

// {/* Main Content Grid */}
// <Grid container item xs={12} md={6} spacing={3} sx={{
//   width: '100%',
//   height: 'calc(100vh - 200px)', // Adjust based on your header and padding
//   mb: 4
// }}>
//   {/* Left Column - 50% width */}
//   <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', height: '100%', width:'50%'}}>
//     {/* Monthly Trend Chart - Top Half */}
//     <Box sx={{
//       width: '100%',
//       height: '70%',
//       mb: 15
//     }}>
//       <MonthlyTrendChart data={data.monthlyTrends} />
//     </Box>

//     {/* Category Histogram - Bottom Half */}
//     <Box sx={{
//       width: '100%',
//       height: '50%',
//       mt: 5
//     }}>
//       <CategoryHistogram data={data.categoryData} />
//     </Box>
//   </Grid>

//   {/* Right Column - 50% width */}
//   <Grid item xs={12} md={6} sx={{ height: '100%', width:'50%'}}>
//     {/* Yearly Trend - Full Height */}
//     <Box sx={{
//       width: '100%',
//       height: '100%'
//     }}>
//       <YearlyTrendChart data={data.yearlyTrends} />
//     </Box>
//   </Grid>
// </Grid>

//       {/* Download Section */}
//       <Box sx={{
//         mt: 55,
//         display: 'flex',
//         justifyContent: 'center',
//         pb: 2
//       }}>
//         <Button
//           variant="contained"
//           startIcon={<DownloadIcon />}
//           endIcon={<KeyboardArrowDownIcon />}
//           onClick={handleDownloadClick}
//           sx={{
//             background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
//             boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
//             color: 'white',
//             fontWeight: 'bold',
//             py: 1.5,
//             px: 3,
//             '&:hover': {
//               background: 'linear-gradient(45deg, #1976D2 30%, #00B0FF 90%)',
//             }
//           }}
//         >
//           Download Historical Data
//         </Button>
//         <Menu
//           anchorEl={anchorEl}
//           open={open}
//           onClose={handleMenuClose}
//           MenuListProps={{
//             'aria-labelledby': 'download-button',
//           }}
//           PaperProps={{
//             elevation: 3,
//             sx: {
//               borderRadius: 2,
//               minWidth: 180,
//             }
//           }}
//         >
//           <Typography sx={{ p: '8px 16px', fontWeight: 'medium', color: 'text.secondary' }}>
//             Select Year
//           </Typography>
//           <Divider />
//           {years.map((year) => (
//             <MenuItem
//               key={year}
//               onClick={() => handleYearSelect(year)}
//               sx={{
//                 py: 1.5,
//                 '&:hover': {
//                   backgroundColor: `${dashboardTheme.colors.primary}15`,
//                 }
//               }}
//             >
//               {year}
//             </MenuItem>
//           ))}
//         </Menu>
//       </Box>
//     </Box>
//   );
// };

// export default AppHistory;

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  Menu,
  MenuItem,
  Divider,
  Chip,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import MonthlyTrendChart from "./components/MonthlyTrendChart";
import YearlyTrendChart from "./components/YearlyTrendChart";
import CategoryHistogram from "./components/CategoryHistogram";
import dashboardTheme from "../../theme/dashboardTheme";
import { getAppHistoryData } from "../../utils/appHistoryApi";
import { getUserProfile } from "../../utils/auth";
import "./AppHistory.css";

const AppHistory = () => {
  // State variables
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [anchorEl, setAnchorEl] = useState(null);
  const [data, setData] = useState(null);
  const open = Boolean(anchorEl);

  // Generate the years for download dropdown (current year and 4 previous years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Fetch or generate data when the selected year changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiData = await getAppHistoryData(selectedYear);
        setData(apiData);
      } catch (error) {
        console.error("Error fetching app history data:", error);
      }
    };

    fetchData();
  }, [selectedYear]);

  const handleDownloadClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    // In a real app, you would generate and download the report here
    alert(`Downloading vulnerability report for ${year}`);
    handleMenuClose();
  };

  if (!data) return null;

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        maxWidth: "100%",
        animation: "fadeIn 0.5s ease-out",
      }}
    >
      {/* Page Header */}
      <Box className="dashboard-header" sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ position: "relative" }}>
          Application Vulnerability History
        </Typography>
        <Typography
          variant="subtitle1"
          component="h5"
          sx={{ position: "relative" }}
        >
          {new Date().toISOString().slice(0, 10)} •{" "}
          {getUserProfile()?.full_name || getUserProfile()?.email || "User"}
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            mt: 3,
            flexWrap: "wrap",
            position: "relative",
          }}
        >
          <Chip
            label={`Total Applications: ${data.applications.length}`}
            sx={{
              bgcolor: "rgba(255,255,255,0.15)",
              color: "white",
              fontWeight: "bold",
            }}
          />
          <Chip
            label={`Year: ${selectedYear}`}
            sx={{
              bgcolor: "rgba(255,255,255,0.15)",
              color: "white",
              fontWeight: "bold",
            }}
          />
          <Chip
            label={`Open: ${data.totalOpen}`}
            sx={{
              bgcolor: "rgba(255,255,255,0.15)",
              color: "white",
              fontWeight: "bold",
            }}
          />
          <Chip
            label={`Closed: ${data.totalClosed}`}
            sx={{
              bgcolor: "rgba(255,255,255,0.15)",
              color: "white",
              fontWeight: "bold",
            }}
          />
        </Box>
      </Box>

      {/* Main Content Grid */}
      <Grid
        container
        spacing={3}
        sx={{
          width: "100%",
          height: { xs: "auto", md: "calc(100vh - 200px)" }, // only fix height for large screens
          mb: 4,
        }}
      >
        {/* Left Column */}
        <Grid
          size={{ xs: 12, md: 6 }}
          sx={{
            display: "flex",
            flexDirection: "column",
            height: { xs: "auto", md: "100%" },
            width: "100%",
          }}
        >
          {/* Monthly Trend Chart */}
          <Box
            sx={{
              width: "100%",
              height: { xs: "70%", sm: "70%", md: "70%" }, // smaller height for mobile
              mb: { xs: 2, md: 15 },
            }}
          >
            <MonthlyTrendChart data={data.monthlyTrends} />
          </Box>

          {/* Category Histogram */}
          <Box
            sx={{
              width: "100%",
              height: { xs: "50%", sm: "50%", md: "50%" },
              mt: { xs: 1, md: 5 },
            }}
          >
            <CategoryHistogram data={data.categoryData} />
          </Box>
        </Grid>

        {/* Right Column */}
        <Grid
          size={{ xs: 12, md: 6 }}
          sx={{
            height: { xs: "auto", md: "100%" },
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Yearly Trend Chart */}
          <Box
            sx={{
              width: "100%",
              height: { xs: 400, sm: 450, md: "100%" },
            }}
          >
            <YearlyTrendChart data={data.yearlyTrends} />
          </Box>
        </Grid>
      </Grid>

      {/* Download Section */}
      <Box
        sx={{
          mt: 60,
          display: "flex",
          justifyContent: "center",
          pb: 2,
        }}
      >
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          endIcon={<KeyboardArrowDownIcon />}
          onClick={handleDownloadClick}
          sx={{
            background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
            boxShadow: "0 3px 5px 2px rgba(33, 203, 243, .3)",
            color: "white",
            fontWeight: "bold",
            py: 1.5,
            px: 3,
            "&:hover": {
              background: "linear-gradient(45deg, #1976D2 30%, #00B0FF 90%)",
            },
          }}
        >
          Download Historical Data
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          MenuListProps={{
            "aria-labelledby": "download-button",
          }}
          PaperProps={{
            elevation: 3,
            sx: {
              borderRadius: 2,
              minWidth: 180,
            },
          }}
        >
          <Typography
            sx={{
              p: "8px 16px",
              fontWeight: "medium",
              color: "text.secondary",
            }}
          >
            Select Year
          </Typography>
          <Divider />
          {years.map((year) => (
            <MenuItem
              key={year}
              onClick={() => handleYearSelect(year)}
              sx={{
                py: 1.5,
                "&:hover": {
                  backgroundColor: `${dashboardTheme.colors.primary}15`,
                },
              }}
            >
              {year}
            </MenuItem>
          ))}
        </Menu>
      </Box>
    </Box>
  );
};

export default AppHistory;
