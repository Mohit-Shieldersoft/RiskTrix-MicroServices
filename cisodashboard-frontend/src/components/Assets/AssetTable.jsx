import React from "react";
import {
  Table, TableHead, TableRow, TableCell,
  TableBody, Chip, TableContainer, Paper, IconButton, Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import assetApi from "../../utils/assetApi";
import { hasPermission } from "../../utils/permissions";

const getRiskColor = (risk) => {
  switch (risk?.toLowerCase()) {
    case "high": return "error";
    case "medium": return "warning";
    case "low": return "success";
    default: return "default";
  }
};

const getTypeLabel = (type) => {
  switch (type?.toLowerCase()) {
    case "web_application": return "Web Application";
    case "mobile_application": return "Mobile Application";
    case "api": return "API";
    case "server": return "Server";
    case "database": return "Database";
    case "network_device": return "Network Device";
    case "endpoint": return "Endpoint";
    case "cloud_service": return "Cloud Service";
    case "iot_device": return "IoT Device";
    case "container": return "Container";
    case "firewall": return "Firewall";
    case "router": return "Router";
    case "switch": return "Switch";
    case "load_balancer": return "Load Balancer";
    default: return type;
  }
};

// ✅ onDelete prop added
const AssetTable = ({ assets, onEdit, onView, onDelete, showToast }) => {

  const handleDelete = async (asset) => {
    if (!window.confirm(`Delete asset "${asset.name}"? This cannot be undone.`)) return;
    try {
      await assetApi.deleteAsset(asset.id);
      onDelete(asset.id);
      showToast("Asset deleted successfully", "success");
    } catch {
      showToast("Failed to delete asset", "error");
    }
  };

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: "grey.50" }}>
            <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Type</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Risk</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Vulnerabilities</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Created</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {assets.map((asset) => (
            <TableRow key={asset.id} hover sx={{ "&:last-child td": { border: 0 } }}>
              <TableCell sx={{ fontWeight: 500 }}>{asset.name}</TableCell>
              <TableCell>{getTypeLabel(asset.type)}</TableCell>
              <TableCell>
                <Chip label={asset.risk_level} color={getRiskColor(asset.risk_level)} size="small" />
              </TableCell>
              <TableCell>{asset.vulnerabilities_count ?? 0}</TableCell>
              <TableCell>{new Date(asset.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <Tooltip title="View Detail">
                  <IconButton size="small" onClick={() => onView(asset)} sx={{ mr: 0.5 }}>
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {hasPermission("assets", "update") && (
                  <Tooltip title="Edit Asset">
                    <IconButton size="small" onClick={() => onEdit(asset)} sx={{ mr: 0.5 }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {hasPermission("assets", "delete") && (
                  <Tooltip title="Delete Asset">
                    <IconButton size="small" color="error" onClick={() => handleDelete(asset)}>
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

export default AssetTable;