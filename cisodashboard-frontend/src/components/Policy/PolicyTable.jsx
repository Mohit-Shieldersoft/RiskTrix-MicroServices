import React from "react";
import {
  Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, Paper, Chip, IconButton, Tooltip,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import policyApi from "../../utils/policyApi";
import { hasPermission } from "../../utils/permissions";

const getStatusColor = (status) => {
  switch (status) {
    case "active": return "success";
    case "draft": return "warning";
    case "archived": return "default";
    default: return "default";
  }
};

const getPlatformLabel = (platform) => {
  const map = {
    all: "All Platforms", android: "Android",
    windows: "Windows", ios: "iOS", macos: "macOS",
  };
  return map[platform] || platform;
};

const getCategoryLabel = (cat) => {
  const map = {
    device_security: "Device Security",
    app_control: "App Control",
    network: "Network",
    os_update: "OS Update",
  };
  return map[cat] || cat;
};

const PolicyTable = ({ policies, onView, onEdit, onDelete, showToast }) => {
  const handleDelete = async (policy) => {
    if (!window.confirm(`Delete policy "${policy.name}"?`)) return;
    try {
      await policyApi.deletePolicy(policy.id);
      onDelete(policy.id);
      showToast("Policy deleted", "success");
    } catch {
      showToast("Failed to delete policy", "error");
    }
  };

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: "grey.50" }}>
            <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Platform</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Created</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {policies.map((policy) => (
            <TableRow key={policy.id} hover sx={{ "&:last-child td": { border: 0 } }}>
              <TableCell sx={{ fontWeight: 500 }}>{policy.name}</TableCell>
              <TableCell>{getCategoryLabel(policy.category)}</TableCell>
              <TableCell>{getPlatformLabel(policy.platform)}</TableCell>
              <TableCell>
                <Chip label={policy.status} color={getStatusColor(policy.status)} size="small" />
              </TableCell>
              <TableCell>{new Date(policy.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <Tooltip title="View Detail">
                  <IconButton size="small" onClick={() => onView(policy)} sx={{ mr: 0.5 }}>
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {hasPermission("policies", "update") && (
                  <Tooltip title="Edit Policy">
                    <IconButton size="small" onClick={() => onEdit(policy)} sx={{ mr: 0.5 }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {hasPermission("policies", "delete") && (
                  <Tooltip title="Delete Policy">
                    <IconButton size="small" color="error" onClick={() => handleDelete(policy)}>
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

export default PolicyTable;