import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Alert, AlertTitle, Button, Chip, Collapse,
  IconButton, Typography, CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import policyApi from "../utils/policyApi";

const SEVERITY_MAP = {
  critical: "error",
  warning: "warning",
  info: "info",
};

/**
 * AlertsBanner — fetches live compliance alerts and shows them
 * as a collapsible banner group at the top of any page.
 *
 * Props:
 *   maxVisible  {number}  how many alerts to show before collapsing (default 2)
 *   compact     {boolean} single-line mode without AlertTitle (default false)
 */
const AlertsBanner = ({ maxVisible = 2, compact = false }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(new Set());

  const fetchAlerts = useCallback(async () => {
    try {
      const result = await policyApi.getAlerts();
      setData(result);
    } catch {
      // silently fail — alerts are non-blocking
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  if (loading || !data || data.total_alerts === 0) return null;

  const visible = data.alerts.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  const shown = expanded ? visible : visible.slice(0, maxVisible);
  const hiddenCount = visible.length - maxVisible;

  return (
    <Box sx={{ mb: 3 }}>
      {shown.map((alert) => (
        <Alert
          key={alert.id}
          severity={SEVERITY_MAP[alert.severity] || "info"}
          sx={{ mb: 1, borderRadius: 2 }}
          action={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {alert.action_url && (
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => navigate(alert.action_url)}
                >
                  View
                </Button>
              )}
              <IconButton
                size="small"
                color="inherit"
                onClick={() => setDismissed((prev) => new Set([...prev, alert.id]))}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          }
        >
          {!compact && (
            <AlertTitle sx={{ fontWeight: "bold", mb: 0.25 }}>
              {alert.title}
              {alert.count != null && (
                <Chip
                  label={alert.count}
                  size="small"
                  color={SEVERITY_MAP[alert.severity] || "default"}
                  sx={{ ml: 1, height: 18, fontSize: "0.65rem" }}
                />
              )}
            </AlertTitle>
          )}
          <Typography variant="body2">{alert.message}</Typography>
        </Alert>
      ))}

      {/* Show more / less toggle */}
      {hiddenCount > 0 && (
        <Button
          size="small"
          startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          onClick={() => setExpanded((v) => !v)}
          sx={{ mt: 0.5 }}
        >
          {expanded ? "Show less" : `Show ${hiddenCount} more alert${hiddenCount !== 1 ? "s" : ""}`}
        </Button>
      )}
    </Box>
  );
};

export default AlertsBanner;
