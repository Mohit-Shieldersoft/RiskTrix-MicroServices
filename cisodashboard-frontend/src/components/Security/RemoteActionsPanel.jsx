import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Avatar,
  Paper,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SyncIcon from "@mui/icons-material/Sync";
import MessageIcon from "@mui/icons-material/Message";
import PinIcon from "@mui/icons-material/Pin";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CancelIcon from "@mui/icons-material/Cancel";
import RefreshIcon from "@mui/icons-material/Refresh";
import commandsApi from "../../utils/commandsApi";

// ── Config ────────────────────────────────────────────────────────────────────

const ACTIONS = [
  {
    key: "lock",
    label: "Lock Device",
    icon: <LockIcon />,
    color: "warning",
    description: "Immediately locks the screen and requires PIN/biometric to unlock.",
    confirm: true,
    confirmText: "Lock this device remotely?",
  },
  {
    key: "wipe",
    label: "Factory Wipe",
    icon: <DeleteForeverIcon />,
    color: "error",
    description: "Erases all data and restores factory settings. IRREVERSIBLE.",
    confirm: true,
    confirmText: "⚠️ This will PERMANENTLY erase all data on the device. Are you sure?",
    dangerous: true,
  },
  {
    key: "restart",
    label: "Restart",
    icon: <RestartAltIcon />,
    color: "info",
    description: "Sends a remote reboot command to the device.",
    confirm: true,
    confirmText: "Restart this device remotely?",
  },
  {
    key: "sync",
    label: "Force Sync",
    icon: <SyncIcon />,
    color: "primary",
    description: "Forces the device to re-fetch and apply the latest policies.",
    confirm: false,
  },
  {
    key: "message",
    label: "Send Message",
    icon: <MessageIcon />,
    color: "secondary",
    description: "Displays a message on the device screen.",
    confirm: false,
    hasInput: true,
  },
  {
    key: "clear_passcode",
    label: "Clear Passcode",
    icon: <PinIcon />,
    color: "warning",
    description: "Removes the device PIN/password (supervised devices only).",
    confirm: true,
    confirmText: "Clear the device passcode?",
  },
  {
    key: "enable_lost_mode",
    label: "Lost Mode",
    icon: <LocationOnIcon />,
    color: "error",
    description: "Locks the device and displays a lost message with contact info.",
    confirm: true,
    confirmText: "Enable Lost Mode on this device?",
  },
];

const STATUS_COLOR = {
  pending:      "default",
  sent:         "info",
  acknowledged: "warning",
  completed:    "success",
  failed:       "error",
  cancelled:    "default",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function RemoteActionsPanel({ deviceId }) {
  const [commands, setCommands] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(null);  // key of action being sent
  const [cancellingId, setCancellingId] = useState(null);

  // Confirm dialog state
  const [confirmAction, setConfirmAction] = useState(null);  // action config
  const [messageText, setMessageText] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const data = await commandsApi.list(deviceId);
      setCommands(data || []);
    } catch (e) {
      console.error("Failed to load commands:", e);
    } finally {
      setLoadingHistory(false);
    }
  }, [deviceId]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // ── Dispatch ──────────────────────────────────────────────────────────────

  const dispatch = async (action) => {
    setSending(action.key);
    try {
      if (action.key === "message") {
        await commandsApi.sendMessage(deviceId, messageText);
      } else {
        await commandsApi.issue(deviceId, action.key);
      }
      setMessageText("");
      await loadHistory();
    } catch (e) {
      console.error("Command failed:", e);
    } finally {
      setSending(null);
    }
  };

  const handleActionClick = (action) => {
    if (action.confirm || action.hasInput) {
      setConfirmAction(action);
      setDialogOpen(true);
    } else {
      dispatch(action);
    }
  };

  const handleDialogConfirm = () => {
    setDialogOpen(false);
    if (confirmAction) dispatch(confirmAction);
    setConfirmAction(null);
  };

  const handleCancel = async (commandId) => {
    setCancellingId(commandId);
    try {
      await commandsApi.cancel(commandId);
      await loadHistory();
    } catch (e) {
      console.error(e);
    } finally {
      setCancellingId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                Remote Actions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Commands are queued and executed when the device checks in.
              </Typography>
            </Box>
            <Tooltip title="Refresh command history">
              <IconButton size="small" onClick={loadHistory}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Action Buttons */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 1.5,
              mb: 3,
            }}
          >
            {ACTIONS.map((action) => (
              <Button
                key={action.key}
                variant={action.dangerous ? "contained" : "outlined"}
                color={action.color}
                size="small"
                startIcon={
                  sending === action.key
                    ? <CircularProgress size={14} color="inherit" />
                    : action.icon
                }
                disabled={!!sending}
                onClick={() => handleActionClick(action)}
                sx={{
                  py: 1,
                  fontWeight: "bold",
                  fontSize: "0.75rem",
                  flexDirection: "column",
                  gap: 0.5,
                  height: 64,
                  "& .MuiButton-startIcon": { margin: 0 },
                }}
              >
                {sending === action.key ? "Sending…" : action.label}
              </Button>
            ))}
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Command History */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              Command History
            </Typography>
            <Chip
              label={`${commands.length} total`}
              size="small"
              variant="outlined"
            />
          </Box>

          {loadingHistory ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : commands.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
              No commands sent yet.
            </Typography>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ "& th": { fontWeight: "bold", bgcolor: "grey.50" } }}>
                    <TableCell>Command</TableCell>
                    <TableCell>Issued By</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Sent At</TableCell>
                    <TableCell align="center">Cancel</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {commands.map((cmd) => (
                    <TableRow key={cmd.id} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, bgcolor: "primary.light", fontSize: "0.65rem" }}>
                            {cmd.command_type.slice(0, 2).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: "medium" }}>
                              {cmd.command_type}
                            </Typography>
                            {cmd.payload?.message && (
                              <Typography variant="caption" color="text.secondary">
                                "{cmd.payload.message}"
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{cmd.issued_by}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={cmd.status}
                          size="small"
                          color={STATUS_COLOR[cmd.status] || "default"}
                          variant={cmd.status === "completed" ? "filled" : "outlined"}
                          sx={{ fontWeight: "bold", fontSize: "0.7rem" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(cmd.created_at).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {(cmd.status === "pending" || cmd.status === "sent") && (
                          <Tooltip title="Cancel command">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                disabled={cancellingId === cmd.id}
                                onClick={() => handleCancel(cmd.id)}
                              >
                                {cancellingId === cmd.id
                                  ? <CircularProgress size={14} />
                                  : <CancelIcon fontSize="small" />}
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Confirm / Input Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {confirmAction && (
            <Avatar sx={{ bgcolor: `${confirmAction.color}.main`, width: 32, height: 32 }}>
              {confirmAction.icon}
            </Avatar>
          )}
          {confirmAction?.label}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: confirmAction?.hasInput ? 2 : 0 }}>
            {confirmAction?.hasInput
              ? confirmAction.description
              : confirmAction?.confirmText}
          </Typography>
          {confirmAction?.hasInput && (
            <TextField
              autoFocus
              label="Message"
              fullWidth
              multiline
              rows={3}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              size="small"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={confirmAction?.color || "primary"}
            onClick={handleDialogConfirm}
            disabled={confirmAction?.hasInput && !messageText.trim()}
          >
            {confirmAction?.dangerous ? "Yes, Wipe Device" : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
