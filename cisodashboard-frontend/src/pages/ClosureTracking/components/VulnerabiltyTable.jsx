import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  Box,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Pagination,
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import dashboardTheme from "../../../theme/dashboardTheme";

// Risk level chips with colors
const RiskChip = ({ risk }) => {
  const level = String(risk || "medium");
  const getColor = () => {
    switch (level.toLowerCase()) {
      case "critical":
        return dashboardTheme.colors.severity.critical;
      case "high":
        return dashboardTheme.colors.severity.high;
      case "medium":
        return dashboardTheme.colors.severity.medium;
      case "low":
        return dashboardTheme.colors.severity.low;
      default:
        return dashboardTheme.colors.info;
    }
  };

  return (
    <Chip
      label={level.toUpperCase()}
      size="small"
      sx={{
        backgroundColor: `${getColor()}20`,
        color: getColor(),
        fontWeight: "bold",
        borderRadius: "4px",
      }}
    />
  );
};

// Status chip with custom dropdown
const StatusChip = ({ status, onStatusChange, id }) => {
  const [pos, setPos] = useState(null); // { top, left } captured at click time
  const chipRef = useRef(null);

  const handleClick = () => {
    if (pos) {
      setPos(null);
      return;
    }
    const rect = chipRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left });
  };

  useEffect(() => {
    if (!pos) return;
    const handler = () => setPos(null);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pos]);

  const options = [
    {
      value: "open",
      label: "OPEN",
      bg: "rgba(244,67,54,0.1)",
      color: dashboardTheme.colors.severity.critical,
      border: "rgba(244,67,54,0.3)",
    },
    {
      value: "closed",
      label: "CLOSED",
      bg: "rgba(76,175,80,0.1)",
      color: dashboardTheme.colors.severity.low,
      border: "rgba(76,175,80,0.3)",
    },
  ];
  const current = options.find((o) => o.value === status) || options[0];

  const dropdown =
    pos &&
    createPortal(
      <Box
        onMouseDown={(e) => e.stopPropagation()}
        sx={{
          position: "fixed",
          top: pos.top,
          left: pos.left,
          zIndex: 99999,
          backgroundColor: "#fff",
          borderRadius: "6px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
          border: "1px solid rgba(0,0,0,0.1)",
          overflow: "hidden",
          minWidth: 100,
        }}
      >
        {options.map((opt) => (
          <Box
            key={opt.value}
            onClick={() => {
              onStatusChange(id, opt.value);
              setPos(null);
            }}
            sx={{
              px: 1.5,
              py: 0.75,
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              backgroundColor:
                status === opt.value ? "rgba(0,0,0,0.05)" : "transparent",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.07)" },
            }}
          >
            <Chip
              label={opt.label}
              size="small"
              sx={{
                fontWeight: "bold",
                backgroundColor: opt.bg,
                color: opt.color,
                border: `1px solid ${opt.border}`,
                pointerEvents: "none",
              }}
            />
          </Box>
        ))}
      </Box>,
      document.body,
    );

  return (
    <>
      <Box ref={chipRef} sx={{ display: "inline-block" }}>
        <Chip
          label={current.label}
          size="small"
          onClick={handleClick}
          sx={{
            cursor: "pointer",
            fontWeight: "bold",
            backgroundColor: current.bg,
            color: current.color,
            border: `1px solid ${current.border}`,
            "&:hover": { filter: "brightness(0.93)" },
          }}
        />
      </Box>
      {dropdown}
    </>
  );
};

const VulnerabilityTable = ({
  vulnerabilities,
  onStatusUpdate,
  onRemarksUpdate,
  onUploadPOC,
  newlyAddedIds = new Set(),
  page = 1,
  totalPages = 1,
  onPageChange,
}) => {
  const [editingRemarks, setEditingRemarks] = useState(null);
  const [remarksText, setRemarksText] = useState("");

  const startEditRemarks = (id, currentRemarks) => {
    setEditingRemarks(id);
    setRemarksText(currentRemarks);
  };

  const saveRemarks = (id) => {
    onRemarksUpdate(id, remarksText);
    setEditingRemarks(null);
  };

  const cancelEdit = () => {
    setEditingRemarks(null);
  };

  return (
    <>
      <TableContainer
        component={Paper}
        sx={{ maxHeight: "calc(100vh - 380px)" }}
      >
        <Table stickyHeader sx={{ minWidth: 1200 }} size="medium">
          <TableHead
            sx={{
              backgroundColor: "#f5f5f5", // solid background
              "& .MuiTableCell-root": {
                backgroundColor: "#f5f5f5",
                zIndex: 1,
              },
            }}
          >
            <TableRow>
              {[
                "ID",
                "Vulnerability",
                "Description",
                "Impact",
                "Risk",
                "Status",
                "Open Date",
                "Closure Date",
                "Remarks",
                "Actions",
              ].map((header, index) => (
                <TableCell
                  key={index}
                  sx={{
                    fontWeight: dashboardTheme.typography.fontWeights.semibold,
                    // backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    whiteSpace: "nowrap",
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {vulnerabilities.map((vuln) => {
              const isNew = newlyAddedIds.has(vuln.id);
              return (
                <TableRow
                  key={vuln.id}
                  hover
                  sx={{
                    "&:nth-of-type(odd)": {
                      backgroundColor: isNew
                        ? "rgba(76, 175, 80, 0.12)"
                        : "rgba(0, 0, 0, 0.02)",
                    },
                    backgroundColor: isNew
                      ? "rgba(76, 175, 80, 0.12)"
                      : undefined,
                    outline: isNew
                      ? "2px solid rgba(76, 175, 80, 0.5)"
                      : undefined,
                    transition: "background-color 0.5s ease, outline 0.5s ease",
                    "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                  }}
                >
                  {/* ID Column */}
                  <TableCell
                    component="th"
                    scope="row"
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    <Box sx={{ fontFamily: "monospace", fontWeight: "bold" }}>
                      {vuln.id}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{ display: "block", color: "text.secondary" }}
                    >
                      {vuln.application}
                    </Typography>
                  </TableCell>

                  {/* Name Column */}
                  <TableCell
                    sx={{
                      minWidth: "180px",
                      maxWidth: "250px",
                      fontWeight: 500,
                    }}
                  >
                    {vuln.name}
                  </TableCell>

                  {/* Description Column */}
                  <TableCell sx={{ maxWidth: "300px" }}>
                    <Typography
                      noWrap
                      sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      {vuln.description}
                    </Typography>
                  </TableCell>

                  {/* Impact Column */}
                  <TableCell sx={{ maxWidth: "300px" }}>
                    <Typography
                      noWrap
                      sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      {vuln.impact || "-"}
                    </Typography>
                  </TableCell>

                  {/* Risk Column */}
                  <TableCell align="center">
                    <RiskChip risk={vuln.risk} />
                  </TableCell>

                  {/* Status Column */}
                  <TableCell align="center">
                    <StatusChip
                      status={vuln.status}
                      onStatusChange={onStatusUpdate}
                      id={vuln.id}
                    />
                  </TableCell>

                  {/* Open Date Column */}
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {new Date(vuln.openDate).toLocaleDateString()}
                  </TableCell>

                  {/* Closure Date Column */}
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {vuln.closureDate
                      ? new Date(vuln.closureDate).toLocaleDateString()
                      : "-"}
                  </TableCell>

                  {/* Remarks Column */}
                  <TableCell sx={{ minWidth: "200px" }}>
                    {editingRemarks === vuln.id ? (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <TextField
                          size="small"
                          fullWidth
                          multiline
                          maxRows={3}
                          value={remarksText}
                          onChange={(e) => setRemarksText(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              saveRemarks(vuln.id);
                            }
                            if (e.key === "Escape") {
                              cancelEdit();
                            }
                          }}
                        />
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => saveRemarks(vuln.id)}
                          >
                            <SaveIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="default"
                            onClick={cancelEdit}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography
                          sx={{
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {vuln.remarks || "-"}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() =>
                            startEditRemarks(vuln.id, vuln.remarks || "")
                          }
                          sx={{ opacity: 0.6, "&:hover": { opacity: 1 } }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </TableCell>

                  {/* Actions Column */}
                  <TableCell align="center">
                    <Tooltip title="Upload Proof of Concept">
                      <IconButton
                        color="primary"
                        onClick={() => onUploadPOC(vuln.id)}
                        sx={{
                          backgroundColor: "rgba(33, 150, 243, 0.1)",
                          "&:hover": {
                            backgroundColor: "rgba(33, 150, 243, 0.2)",
                          },
                        }}
                      >
                        <AttachFileIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}

            {vulnerabilities.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                  <Typography
                    sx={{ fontStyle: "italic", color: "text.secondary" }}
                  >
                    No vulnerabilities found matching your search criteria.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {totalPages > 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 1.5,
            borderTop: "1px solid rgba(0,0,0,0.08)",
            backgroundColor: "white",
          }}
        >
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => onPageChange && onPageChange(newPage)}
            color="primary"
            shape="rounded"
            size="medium"
          />
        </Box>
      )}
    </>
  );
};

export default VulnerabilityTable;
