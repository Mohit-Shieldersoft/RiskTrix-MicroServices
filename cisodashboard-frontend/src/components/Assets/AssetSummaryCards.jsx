import React from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";

const AssetSummaryCards = ({ stats }) => {
  if (!stats) return null;

  // ✅ FIX: backend returns total_assets, not total
  const total = stats.total_assets ?? 0;
  const high = stats.riskDistribution?.high ?? 0;
  const medium = stats.riskDistribution?.medium ?? 0;
  const low = stats.riskDistribution?.low ?? 0;

  return (
    <Box display="flex" gap={2} flexWrap="wrap">
      <Card sx={{ flex: 1 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary">Total Assets</Typography>
          <Typography variant="h4">{total}</Typography>
        </CardContent>
      </Card>
      <Card sx={{ flex: 1 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary">High Risk</Typography>
          <Typography variant="h4" color="error">{high}</Typography>
        </CardContent>
      </Card>
      <Card sx={{ flex: 1 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary">Medium Risk</Typography>
          <Typography variant="h4" color="warning.main">{medium}</Typography>
        </CardContent>
      </Card>
      <Card sx={{ flex: 1 }}>
        <CardContent>
          <Typography variant="subtitle2" color="text.secondary">Low Risk</Typography>
          <Typography variant="h4" color="success.main">{low}</Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AssetSummaryCards;