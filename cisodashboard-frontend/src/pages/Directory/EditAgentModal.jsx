import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Typography,
  Box,
  Paper,
  Chip,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import Groups2Icon from "@mui/icons-material/Groups2";
import PsychologyIcon from "@mui/icons-material/Psychology";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";

import directoryApi from "../../utils/directoryApi";

const TEAMS = [
  "security",
  "network",
  "compliance",
  "infrastructure",
  "general",
];

const TIERS = ["standard", "senior"];

export default function EditAgentModal({
  open,
  agent,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (agent) {
      setForm({
        name: agent.name || "",
        email: agent.email || "",
        team: agent.team || "security",
        tier: agent.tier || "standard",
        categories: agent.categories || "",
        is_active: agent.is_active !== false,
      });
    }
  }, [agent]);

  const set = (field) => (e) =>
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await directoryApi.updateAgent(agent.id, {
        name: form.name,
        team: form.team,
        tier: form.tier,
        categories: form.categories,
        is_active: form.is_active,
      });

      onSaved();
    } catch (e) {
      const detail = e?.response?.data?.detail;

      setError(
        detail || "Failed to update agent."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 5,
          overflow: "hidden",
          background:
            "linear-gradient(to bottom, #ffffff, #f8fafc)",
        },
      }}
    >
      {/* HEADER */}
      <DialogTitle
        sx={{
          px: 4,
          py: 3,
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background:
            "linear-gradient(to right, #f8fafc, #ffffff)",
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 3,
              bgcolor: "#ede9fe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <EditIcon color="primary" />
          </Box>

          <Box>
            <Typography
              variant="h5"
              fontWeight={700}
            >
              Edit Agent
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Update profile, assignment settings,
              and participation configuration
            </Typography>
          </Box>
        </Box>

        <Chip
          label={
            form.is_active
              ? "Active"
              : "Inactive"
          }
          color={
            form.is_active
              ? "success"
              : "default"
          }
          sx={{
            fontWeight: 700,
            borderRadius: 2,
          }}
        />
      </DialogTitle>

      {/* CONTENT */}
      <DialogContent
        sx={{
          backgroundColor: "#f8fafc",
          px: 4,
          py: 4,
        }}
      >
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: 3,
            }}
          >
            {error}
          </Alert>
        )}

        {/* BASIC INFO */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 4,
            border: "1px solid #e5e7eb",
            backgroundColor: "#fff",
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            mb={3}
          >
            <Groups2Icon color="primary" />

            <Typography
              variant="h6"
              fontWeight={700}
            >
              Basic Information
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Full Name"
                fullWidth
                required
                value={form.name || ""}
                onChange={set("name")}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Email Address"
                fullWidth
                disabled
                value={form.email || ""}
                helperText="Email cannot be changed"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* ASSIGNMENT CONFIG */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 4,
            border: "1px solid #e5e7eb",
            backgroundColor: "#fff",
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            mb={3}
          >
            <SettingsSuggestIcon color="primary" />

            <Typography
              variant="h6"
              fontWeight={700}
            >
              Assignment Configuration
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>
                  Assignment Team
                </InputLabel>

                <Select
                  value={form.team || ""}
                  label="Assignment Team"
                  onChange={set("team")}
                >
                  {TEAMS.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>
                  Experience Tier
                </InputLabel>

                <Select
                  value={form.tier || ""}
                  label="Experience Tier"
                  onChange={set("tier")}
                >
                  {TIERS.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* SKILLS */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 4,
            border: "1px solid #e5e7eb",
            backgroundColor: "#fff",
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            mb={3}
          >
            <PsychologyIcon color="primary" />

            <Typography
              variant="h6"
              fontWeight={700}
            >
              Skills & Categories
            </Typography>
          </Box>

          <TextField
            label="Skills / Categories"
            fullWidth
            multiline
            minRows={3}
            placeholder="network, malware, phishing..."
            value={form.categories || ""}
            onChange={set("categories")}
          />

          {form.categories && (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                mt: 2,
              }}
            >
              {form.categories
                .split(",")
                .map((skill) => skill.trim())
                .filter(Boolean)
                .map((skill) => (
                  <Chip
                    key={skill}
                    label={skill}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 600,
                      bgcolor: "#eff6ff",
                    }}
                  />
                ))}
            </Box>
          )}
        </Paper>

        {/* PARTICIPATION */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 4,
            border: "1px solid #e5e7eb",
            backgroundColor: "#fff",
          }}
        >
          <Typography
            variant="h6"
            fontWeight={700}
            mb={3}
          >
            Participation Settings
          </Typography>

          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              bgcolor: "#f8fafc",
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={!!form.is_active}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      is_active:
                        e.target.checked,
                    }))
                  }
                />
              }
              label={
                <Box>
                  <Typography fontWeight={700}>
                    Active Agent
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Participates in AutoAssign and
                    ticket routing workflows.
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Alert
            severity={
              form.is_active
                ? "success"
                : "warning"
            }
            sx={{
              mt: 3,
              borderRadius: 3,
            }}
          >
            {form.is_active
              ? "Agent is currently eligible for AutoAssign."
              : "Inactive agents will not receive tickets."}
          </Alert>
        </Paper>
      </DialogContent>

      {/* FOOTER */}
      <DialogActions
        sx={{
          px: 4,
          py: 3,
          borderTop: "1px solid #e5e7eb",
          justifyContent: "space-between",
          backgroundColor: "#fff",
        }}
      >
        <Button
          variant="outlined"
          onClick={handleClose}
          disabled={saving}
          sx={{
            borderRadius: 2,
            px: 4,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
          startIcon={
            saving ? (
              <CircularProgress
                size={18}
                color="inherit"
              />
            ) : null
          }
          sx={{
            borderRadius: 2,
            px: 5,
            py: 1.2,
            fontWeight: 700,
            textTransform: "none",
            boxShadow: "none",
          }}
        >
          {saving
            ? "Saving..."
            : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}