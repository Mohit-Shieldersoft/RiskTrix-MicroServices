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
  Collapse,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import OwnerApplicationsTable from "./OwnerApplicationsTable";
import dashboardTheme from "../../../theme/dashboardTheme";
import Toast from "../../../components/common/Toast";
import { useToast } from "../../../components/common/useToast";

const OwnerSection = ({ data, loading }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOwners, setFilteredOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const { toast, showToast, closeToast } = useToast();

  // Filter owners based on search term
  useEffect(() => {
    if (!data) return;

    const filtered = data.filter((owner) =>
      owner.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredOwners(filtered);

    // If selected owner is no longer in filtered list, deselect
    if (selectedOwner && !filtered.find((o) => o.id === selectedOwner.id)) {
      setSelectedOwner(null);
    }
  }, [data, searchTerm, selectedOwner]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSelectOwner = (owner) => {
    if (selectedOwner && selectedOwner.id === owner.id) {
      setSelectedOwner(null); // Deselect if clicking the same owner
    } else {
      setSelectedOwner(owner);
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
          color: dashboardTheme.colors.primary,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "#673AB7",
            mr: 1.5,
          }}
        />
        Owner Reminders
      </Typography>

      <Grid container spacing={3} sx={{ mb: 2 }} alignItems="stretch">
        {/* Owner Search and List (40%) */}
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
                placeholder="Search by owner name..."
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
                      borderColor: "#673AB7",
                    },
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#673AB7",
                      borderWidth: 1,
                    },
                  },
                }}
              />
            </Box>

            {/* Owners List */}
            <Box
              sx={{ height: 450, width: "100%", overflow: "auto", minWidth: 0 }}
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
                  <CircularProgress size={40} sx={{ color: "#673AB7" }} />
                </Box>
              ) : filteredOwners.length === 0 ? (
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
                      ? "No owners match your search"
                      : "No owners available"}
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
                          Owner Name
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ fontWeight: "bold", bgcolor: "#f8f9fb" }}
                        >
                          Apps
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
                      {filteredOwners.map((owner) => (
                        <TableRow
                          key={owner.id}
                          hover
                          selected={
                            selectedOwner && selectedOwner.id === owner.id
                          }
                          onClick={() => handleSelectOwner(owner)}
                          sx={{
                            cursor: "pointer",
                            transition: "all 0.2s",
                            "&.Mui-selected": {
                              backgroundColor: "#EDE7F6",
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
                            {owner.name}
                          </TableCell>
                          <TableCell align="center">
                            <Box
                              sx={{
                                display: "inline-block",
                                bgcolor: "#673AB7",
                                color: "white",
                                fontSize: "0.8rem",
                                fontWeight: "bold",
                                borderRadius: "100px",
                                px: 1.5,
                                py: 0.5,
                                minWidth: "28px",
                              }}
                            >
                              {owner.applicationCount}
                            </Box>
                          </TableCell>
                          <TableCell padding="none" align="center">
                            <IconButton size="small">
                              {selectedOwner &&
                              selectedOwner.id === owner.id ? (
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
          <Fade in={selectedOwner !== null} timeout={500}>
            <Box sx={{ height: "100%", minHeight: "400px" }}>
              {selectedOwner ? (
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
                      Applications Owned by {selectedOwner.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Vulnerabilities:{" "}
                      {selectedOwner.totalVulnerabilities}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      height: "calc(100% - 53px)",
                      overflow: "auto",
                      minWidth: 0,
                    }}
                  >
                    <OwnerApplicationsTable
                      data={selectedOwner.applications}
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
                    Select an owner from the list to view their applications
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

export default OwnerSection;
