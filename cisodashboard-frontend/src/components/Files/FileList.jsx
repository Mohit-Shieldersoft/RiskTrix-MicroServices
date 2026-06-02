import React from "react";
import {
  Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, Paper, IconButton, Tooltip, Chip, Typography, Box,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import fileApi from "../../utils/fileApi";
import { hasPermission } from "../../utils/permissions";

const CONTEXT_COLORS = {
  ticket: "primary",
  vulnerability: "error",
  poc: "warning",
  asset: "info",
  audit: "secondary",
  general: "default",
};

const formatSize = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileList = ({ files, onDelete, showToast }) => {
  const handleDownload = async (file) => {
    try {
      await fileApi.downloadFile(file.file_id, file.original_name);
      showToast(`Downloading "${file.original_name}"`, "success");
    } catch {
      showToast("Download failed", "error");
    }
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`Delete "${file.original_name}"?`)) return;
    try {
      await fileApi.deleteFile(file.file_id);
      showToast("File deleted", "success");
      if (onDelete) onDelete(file.file_id);
    } catch {
      showToast("Failed to delete file", "error");
    }
  };

  if (files.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 5 }}>
        <InsertDriveFileIcon sx={{ fontSize: 48, color: "grey.300" }} />
        <Typography color="text.secondary">No files uploaded yet</Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }} elevation={0}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: "grey.50" }}>
            <TableCell sx={{ fontWeight: "bold" }}>File Name</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Context</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Ref ID</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Size</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Uploaded</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.file_id} hover sx={{ "&:last-child td": { border: 0 } }}>
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <InsertDriveFileIcon fontSize="small" color="action" />
                  <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 200 }}>
                    {file.original_name}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={file.context}
                  color={CONTEXT_COLORS[file.context] || "default"}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {file.ref_id || "—"}
                </Typography>
              </TableCell>
              <TableCell>{formatSize(file.size_bytes ?? file.size)}</TableCell>
              <TableCell>
                <Typography variant="caption" color="text.secondary">
                  {file.content_type?.split("/")[1]?.toUpperCase() || "FILE"}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {file.uploaded_at ? new Date(file.uploaded_at).toLocaleDateString() : "—"}
                </Typography>
              </TableCell>
              <TableCell>
                <Tooltip title="Download">
                  <IconButton size="small" onClick={() => handleDownload(file)} sx={{ mr: 0.5 }}>
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {hasPermission("files", "delete") && (
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => handleDelete(file)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default FileList;