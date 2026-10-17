import React, { useState, useEffect } from "react";
import { Box, Typography, Grid, Fade, Divider } from "@mui/material";
import VendorReminders from "./components/VendorReminders";
import ApplicationReminders from "./components/ApplicationReminders";
import ExceptionReminders from "./components/ExceptionReminders";
import reminderApi from "../../utils/reminderApi";
import { getUserProfile } from "../../utils/auth";
import dashboardTheme from "../../theme/dashboardTheme";
import "./Reminder.css";

const Reminder = () => {
  // State
  const [loading, setLoading] = useState(true);
  const [reminderData, setReminderData] = useState(null);

  // Current date and user
  const currentDateTime = new Date().toISOString().slice(0, 10);
  const currentUser =
    getUserProfile()?.full_name || getUserProfile()?.email || "User";

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await reminderApi.getFrontendReminderData();
        setReminderData(data);
      } catch (err) {
        console.error("Failed to fetch reminders from API.", err);
        setReminderData({
          vendorReminders: [],
          applicationReminders: [],
          exceptionReminders: [],
          stats: { vendors: 0, applications: 0, exceptions: 0 },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        maxWidth: "100%",
        background:
          "linear-gradient(135deg, rgba(240,242,245,1) 0%, rgba(245,247,250,1) 100%)",
        minHeight: "calc(100vh - 64px)",
        height: "100%",
        overflow: "auto",
      }}
    >
      {/* Page Header */}
      <Box
        className="dashboard-header"
        sx={{
          mb: 4,
          pb: 2,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          background: "linear-gradient(135deg, #5C6BC0 0%, #3F51B5 100%)",
          p: 3,
          borderRadius: 2,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: dashboardTheme.typography.fontWeights.bold,
              color: "#ffffff",
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            }}
          >
            Reminder Dashboard
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              color: "rgba(255, 255, 255, 0.9)",
              mt: 0.5,
            }}
          >
            {currentDateTime} • {currentUser}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            mt: { xs: 2, sm: 0 },
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h5"
              sx={{
                color: "#4CAF50",
                fontWeight: "bold",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
              }}
            >
              {reminderData?.stats.vendors}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255, 255, 255, 0.9)" }}
            >
              Vendor Alerts
            </Typography>
          </Box>

          <Divider
            orientation="vertical"
            flexItem
            sx={{ bgcolor: "rgba(255, 255, 255, 0.2)" }}
          />

          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h5"
              sx={{
                color: "#FF9800",
                fontWeight: "bold",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
              }}
            >
              {reminderData?.stats.applications}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255, 255, 255, 0.9)" }}
            >
              App Alerts
            </Typography>
          </Box>

          <Divider
            orientation="vertical"
            flexItem
            sx={{ bgcolor: "rgba(255, 255, 255, 0.2)" }}
          />

          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="h5"
              sx={{
                color: "#F44336",
                fontWeight: "bold",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
              }}
            >
              {reminderData?.stats.exceptions}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255, 255, 255, 0.9)" }}
            >
              Exception Alerts
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Grid container spacing={1} alignItems="stretch">
        {/* Vendor Reminders - 1/3 */}
        <Grid
          size={{ xs: 12 }}
          sx={{
            display: "flex",
            flexBasis: { md: "33.3333%" },
            maxWidth: { md: "33.3333%" },
            flexGrow: 1,
            minWidth: 0,
          }}
        >
          <Fade in={!loading} timeout={800}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <VendorReminders
                data={reminderData?.vendorReminders || []}
                loading={loading}
              />
            </Box>
          </Fade>
        </Grid>

        {/* Application Reminders - 1/3 */}
        <Grid
          size={{ xs: 12 }}
          sx={{
            display: "flex",
            flexBasis: { md: "33.3333%" },
            maxWidth: { md: "33.3333%" },
            flexGrow: 1,
            minWidth: 0,
          }}
        >
          <Fade in={!loading} timeout={1000}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <ApplicationReminders
                data={reminderData?.applicationReminders || []}
                loading={loading}
              />
            </Box>
          </Fade>
        </Grid>

        {/* Exception Reminders - 1/3 */}
        <Grid
          size={{ xs: 12 }}
          sx={{
            display: "flex",
            flexBasis: { md: "33.3333%" },
            maxWidth: { md: "33.3333%" },
            flexGrow: 1,
            minWidth: 0,
          }}
        >
          <Fade in={!loading} timeout={1200}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <ExceptionReminders
                data={reminderData?.exceptionReminders || []}
                loading={loading}
              />
            </Box>
          </Fade>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reminder;
