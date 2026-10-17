import React, { useState } from "react";
import { Box, Button, Container, Paper, TextField, Typography, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";

const ResetPassword = () => {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Reset password</Typography>
        <TextField fullWidth label="Reset token" value={token} onChange={(e) => setToken(e.target.value)} sx={{ mb: 2 }} />
        <TextField fullWidth type="password" label="New password" value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 2 }} />
        <Button variant="contained" onClick={async () => {
          try {
            const res = await api.post("/api/v1/auth/reset-password", { token, password });
            setMessage(res.data.message || "Password updated");
            setTimeout(() => navigate("/login"), 800);
          } catch (err) {
            setMessage(err.response?.data?.detail || "Reset failed");
          }
        }}>Update password</Button>
        {message && <Alert sx={{ mt: 2 }}>{message}</Alert>}
        <Box sx={{ mt: 2 }}><Button onClick={() => navigate("/login")}>Back to login</Button></Box>
      </Paper>
    </Container>
  );
};

export default ResetPassword;
