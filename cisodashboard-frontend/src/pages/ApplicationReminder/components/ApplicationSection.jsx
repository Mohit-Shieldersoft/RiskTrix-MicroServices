import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  CircularProgress,
  Fade,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import ApplicationDetailsTable from "./ApplicationDetailsTable";
import dashboardTheme from "../../../theme/dashboardTheme";
import Toast from "../../../components/common/Toast";
import { useToast } from "../../../components/common/useToast";

const ApplicationSection = ({ data, loading }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredApps, setFilteredApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const { toast, showToast, closeToast } = useToast();

  // Filter applications based on search term
  useEffect(() => {
    if (!data) return;

    const filtered = data.filter((app) =>
      app.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredApps(filtered);

    // If selected app is no longer in filtered list, deselect
    if (selectedApp && !filtered.find((a) => a.id === selectedApp.id)) {
      setSelectedApp(null);
    }
  }, [data, searchTerm, selectedApp]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSelectApp = (app) => {
    if (selectedApp && selectedApp.id === app.id) {
      setSelectedApp(null); // Deselect if clicking the same app
    } else {
      setSelectedApp(app);
    }
  };

  const handleSendSuccess = () => {
    showToast("Reminder sent successfully", "success");
  };

  return (
    <Box>
      <Typography
        variant="h5"
        component="h2"
        sx={{
          mb: 3,
          fontWeight: dashboardTheme.typography.fontWeights.semibold,
          color: dashboardTheme.colors.secondary,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "#9C27B0",
            mr: 1.5,
          }}
        />
        Application Reminders
      </Typography>

      <Grid container spacing={3} alignItems="stretch">
        {/* Application Search and List (40%) */}
        <Grid
          size={{ xs: 12 }}
          sx={{
            flexBasis: { md: "40%" },
            maxWidth: { md: "40%" },
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          <Paper
            elevation={0}
            className="futuristic-card"
            sx={{
              p: 0,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
            }}
          >
            {/* Search Field */}
            <Box
              sx={{
                p: 2,
                bgcolor: "#f8f9fb",
                borderBottom: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <TextField
                fullWidth
                placeholder="Search by application name..."
                value={searchTerm}
                onChange={handleSearch}
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 2,
                    bgcolor: "#fff",
                    "&:hover": {
                      bgcolor: "#fff",
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(0, 0, 0, 0.1)",
                    },
                    transition: "all 0.3s",
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#9C27B0",
                    },
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#9C27B0",
                      borderWidth: 1,
                    },
                  },
                }}
              />
            </Box>

            {/* Applications List */}
            <Box
              sx={{ height: 400, width: "100%", overflow: "auto", minWidth: 0 }}
            >
              {loading ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                  }}
                >
                  <CircularProgress size={40} sx={{ color: "#9C27B0" }} />
                </Box>
              ) : filteredApps.length === 0 ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {searchTerm
                      ? "No applications match your search"
                      : "No applications available"}
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Box}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{ fontWeight: "bold", bgcolor: "#f8f9fb" }}
                        >
                          Application
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: "bold", bgcolor: "#f8f9fb" }}
                        >
                          Owners
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            fontWeight: "bold",
                            bgcolor: "#f8f9fb",
                            width: 40,
                          }}
                        ></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredApps.map((app) => (
                        <TableRow
                          key={app.id}
                          hover
                          selected={selectedApp && selectedApp.id === app.id}
                          onClick={() => handleSelectApp(app)}
                          sx={{
                            cursor: "pointer",
                            transition: "all 0.2s",
                            "&.Mui-selected": {
                              backgroundColor: "#F3E5F5",
                            },
                            "&.Mui-selected:hover": {
                              backgroundColor: "#E1BEE7",
                            },
                            "&:hover": {
                              backgroundColor: "rgba(0, 0, 0, 0.04)",
                              transform: "translateY(-1px)",
                            },
                          }}
                        >
                          <TableCell sx={{ fontWeight: "medium" }}>
                            {app.name}
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 0.5,
                              }}
                            >
                              {app.instances
                                .slice(0, 2)
                                .map((instance, index) => (
                                  <Box
                                    key={index}
                                    sx={{
                                      bgcolor: "#F3E5F5",
                                      color: "#4A148C",
                                      fontSize: "0.75rem",
                                      fontWeight: "medium",
                                      borderRadius: "4px",
                                      px: 1,
                                      py: 0.5,
                                    }}
                                  >
                                    {instance.owner}
                                  </Box>
                                ))}
                              {app.instances.length > 2 && (
                                <Box
                                  sx={{
                                    bgcolor: "#F3E5F5",
                                    color: "#4A148C",
                                    fontSize: "0.75rem",
                                    fontWeight: "medium",
                                    borderRadius: "4px",
                                    px: 1,
                                    py: 0.5,
                                  }}
                                >
                                  +{app.instances.length - 2} more
                                </Box>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell padding="none" align="center">
                            <IconButton size="small">
                              {selectedApp && selectedApp.id === app.id ? (
                                <KeyboardArrowUpIcon />
                              ) : (
                                <KeyboardArrowDownIcon />
                              )}
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Application Details (60%) */}
        <Grid
          size={{ xs: 12 }}
          sx={{
            flexBasis: { md: "60%" },
            maxWidth: { md: "60%" },
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          <Fade in={selectedApp !== null} timeout={500}>
            <Box sx={{ height: "100%", minHeight: "400px" }}>
              {selectedApp ? (
                <Paper
                  elevation={0}
                  className="futuristic-card"
                  sx={{
                    p: 0,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "#f8f9fb",
                      borderBottom: "1px solid rgba(0,0,0,0.05)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                      {selectedApp.name} Instances
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedApp.instances.length}{" "}
                      {selectedApp.instances.length === 1
                        ? "Instance"
                        : "Instances"}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      height: "calc(100% - 53px)",
                      overflow: "auto",
                      minWidth: 0,
                    }}
                  >
                    <ApplicationDetailsTable
                      data={selectedApp.instances}
                      onSendSuccess={handleSendSuccess}
                    />
                  </Box>
                </Paper>
              ) : (
                <Box
                  sx={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px dashed #E1BEE7",
                    borderRadius: 2,
                    p: 3,
                  }}
                >
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    align="center"
                  >
                    Select an application from the list to view details
                  </Typography>
                </Box>
              )}
            </Box>
          </Fade>
        </Grid>
      </Grid>

      {/* Toast for notifications */}
      <Toast toast={toast} onClose={closeToast} />
    </Box>
  );
};

export default ApplicationSection;
