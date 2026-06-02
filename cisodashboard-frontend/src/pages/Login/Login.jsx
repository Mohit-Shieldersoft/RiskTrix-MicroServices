import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Container,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import Security from "@mui/icons-material/Security";
import DeveloperModeIcon from "@mui/icons-material/DeveloperMode";
import { setToken, setRefreshToken, setUserProfile } from "../../utils/auth";
import { enableDevMode } from "../../utils/devAuthBypass";
import axios from "axios";

const Login = () => {
  const [formData, setFormData] = useState({
    emailOrUsername: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { emailOrUsername, password } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const API_BASE_URL = "";
      const API_PREFIX = "/api/v1";

      // Determine if input is email or username
      const isEmail = emailOrUsername.includes("@");
      const payload = {
        password,
        ...(isEmail
          ? { email: emailOrUsername }
          : { username: emailOrUsername }),
      };

      const res = await axios.post(
        `${API_BASE_URL}${API_PREFIX}/auth/login`,
        payload,
      );
      const data = res.data;

      // Store tokens
      if (data.access_token) {
        setToken(data.access_token);
      }
      if (data.refresh_token) {
        setRefreshToken(data.refresh_token);
      }

      // Store user profile information
      if (data.user) {
        setUserProfile(data.user);
        console.log("✅ Login successful - User profile:", data.user);
      }

      // Redirect to dashboard
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      const msg =
        err?.response?.data?.detail || err?.message || "Authentication failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f7fa",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderRadius: 2,
          }}
        >
          <Security
            sx={{
              fontSize: 56,
              color: (theme) => theme.palette.primary.main,
              mb: 2,
            }}
          />

          <Typography
            component="h1"
            variant="h4"
            sx={{ mb: 3, fontWeight: "bold" }}
          >
            {/* CISO Dashboard */}
            RiskTrix
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="emailOrUsername"
              label="Email or Username"
              name="emailOrUsername"
              autoComplete="email"
              autoFocus
              value={emailOrUsername}
              onChange={handleChange}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={handleChange}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? "Authenticating..." : "Sign In"}
            </Button>

            {/* Dev Mode Button - Always show for testing */}
            <>
              <Divider sx={{ my: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Development Mode
                </Typography>
              </Divider>
              <Button
                fullWidth
                variant="outlined"
                color="warning"
                startIcon={<DeveloperModeIcon />}
                onClick={enableDevMode}
                sx={{ py: 1.5 }}
              >
                Skip Login (Test Microservices)
              </Button>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, textAlign: "center", display: "block" }}
              >
                Bypass auth to test TPRM/Vendors & Compliance microservices
              </Typography>
            </>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
