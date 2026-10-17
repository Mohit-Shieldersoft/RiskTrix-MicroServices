import React from "react";
import { Box, Typography, Button, Alert } from "@mui/material";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Something went wrong." };
  }

  componentDidCatch(error, info) {
    console.error("Page error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {this.state.message}
          </Alert>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This page hit an unexpected error. You can retry or open another
            module from the sidebar.
          </Typography>
          <Button variant="contained" onClick={this.handleReset}>
            Retry page
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
