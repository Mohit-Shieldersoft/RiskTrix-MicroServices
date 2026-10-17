import React, { useState } from "react";
import { Box, TextField, Button, Typography, Alert, Paper } from "@mui/material";
import api from "../../utils/api";
import dashboardTheme from "../../theme/dashboardTheme";

const AcceptInvite = () => {
  const params = new URLSearchParams(window.location.search);
  const [token, setToken] = useState(params.get("token") || "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const accept = async () => {
    try {
      await api.post(`/api/v1/invitations/accept?token=${encodeURIComponent(token)}&password=${encodeURIComponent(password)}`);
      setMessage("Invitation accepted. You can now log in.");
    } catch (err) {
      setMessage(err.response?.data?.detail || "Unable to accept invitation");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        bgcolor: dashboardTheme.colors.background.main,
      }}
    >
      <Paper sx={{ maxWidth: 420, width: "100%", p: { xs: 3, md: 4 }, borderRadius: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Accept invitation</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Set a password to join your RiskTrix organization.
        </Typography>
        <TextField fullWidth label="Invite token" value={token} onChange={(e) => setToken(e.target.value)} sx={{ mb: 2 }} />
        <TextField fullWidth type="password" label="Password" value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 2 }} />
        <Button fullWidth variant="contained" onClick={accept}>Accept</Button>
        {message && <Alert sx={{ mt: 2 }}>{message}</Alert>}
      </Paper>
    </Box>
  );
};

export default AcceptInvite;
