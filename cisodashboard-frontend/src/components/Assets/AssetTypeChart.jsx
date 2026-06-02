import React from "react";
import { Box, Typography, LinearProgress } from "@mui/material";

const TYPE_LABELS = {
  web_application: "Web Application",
  mobile_application: "Mobile Application",
  api: "API",
  server: "Server",
  database: "Database",
  network_device: "Network Device",
  endpoint: "Endpoint",
  cloud_service: "Cloud Service",
  iot_device: "IoT Device",
  container: "Container",
  firewall: "Firewall",
  router: "Router",
  switch: "Switch",
  load_balancer: "Load Balancer",
};

const AssetTypeChart = ({ data }) => {
  // ✅ FIX: guard against undefined/empty data
  if (!data || Object.keys(data).length === 0) {
    return <Typography color="text.secondary">No data available</Typography>;
  }

  const total = Object.values(data).reduce((sum, v) => sum + v, 0);

  return (
    <Box>
      {Object.entries(data).map(([type, count]) => (
        <Box key={type} sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography variant="body2">
              {TYPE_LABELS[type] || type}
            </Typography>
            <Typography variant="body2" fontWeight="bold">{count}</Typography>
          </Box>
          {/* ✅ Visual progress bar showing proportion */}
          <LinearProgress
            variant="determinate"
            value={total > 0 ? (count / total) * 100 : 0}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      ))}
    </Box>
  );
};

export default AssetTypeChart;