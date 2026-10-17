import React from "react";
import { Box, Paper, Typography, Stack } from "@mui/material";
import dashboardTheme from "../../theme/dashboardTheme";

const PageShell = ({ title, subtitle, actions, children, maxWidth = 1440 }) => {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth,
        mx: "auto",
        px: { xs: 0, sm: 0 },
        pb: { xs: 2, md: 3 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          mb: 2.5,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: dashboardTheme.typography.fontWeights.bold,
              color: dashboardTheme.colors.text.primary,
              fontSize: { xs: "1.5rem", md: "1.75rem" },
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              sx={{ color: dashboardTheme.colors.text.secondary, mt: 0.5, maxWidth: 720 }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {actions}
          </Stack>
        )}
      </Box>
      {children}
    </Box>
  );
};

export const PageSection = ({ children, sx = {} }) => (
  <Paper
    elevation={0}
    sx={{
      p: { xs: 2, md: 2.5 },
      mb: 2.5,
      border: "1px solid rgba(63, 81, 181, 0.08)",
      borderRadius: dashboardTheme.borderRadius.lg,
      backgroundColor: dashboardTheme.colors.background.paper,
      boxShadow: dashboardTheme.shadows.card,
      height: "auto",
      ...sx,
    }}
  >
    {children}
  </Paper>
);

export const EmptyState = ({ title, message, action }) => (
  <Box sx={{ py: 7, px: 3, textAlign: "center" }}>
    {title && (
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.75, color: dashboardTheme.colors.text.primary }}>
        {title}
      </Typography>
    )}
    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520, mx: "auto" }}>
      {message}
    </Typography>
    {action && <Box sx={{ mt: 2.5 }}>{action}</Box>}
  </Box>
);

export default PageShell;
