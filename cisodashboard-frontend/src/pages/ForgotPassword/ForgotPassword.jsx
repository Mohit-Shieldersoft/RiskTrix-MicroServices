import React, { useState } from "react";
import { Box, Button, Container, Paper, TextField, Typography, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Forgot password</Typography>
        <TextField fullWidth label="Email" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} />
        <Button variant="contained" onClick={async () => {
          try {
            const res = await api.post("/api/v1/auth/forgot-password", { email });
            setToken(res.data.reset_token || "");
            setMessage(res.data.message || "If the account exists, a reset token was issued.");
          } catch (err) {
            setMessage(err.response?.data?.detail || "Request failed");
          }
        }}>Send reset token</Button>
        {message && <Alert sx={{ mt: 2 }}>{message}{token ? ` Token: ${token}` : ""}</Alert>}
        <Box sx={{ mt: 2 }}>
          <Button onClick={() => navigate("/reset-password")}>I have a token</Button>
          <Button onClick={() => navigate("/login")}>Back to login</Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ForgotPassword;
