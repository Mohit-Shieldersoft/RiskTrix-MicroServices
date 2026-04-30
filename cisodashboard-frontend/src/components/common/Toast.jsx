import { Snackbar, Alert } from "@mui/material";

/**
 * Reusable Toast notification component.
 *
 * Usage:
 *   import Toast from "../../components/common/Toast";
 *   import { useToast } from "../../components/common/useToast";
 *
 *   const { toast, showToast, closeToast } = useToast();
 *
 *   showToast("Saved successfully");               // default: success
 *   showToast("Something went wrong", "error");
 *   showToast("Please review", "warning");
 *   showToast("FYI", "info");
 *
 *   <Toast toast={toast} onClose={closeToast} />
 */
export default function Toast({ toast, onClose, duration = 3000 }) {
  return (
    <Snackbar
      open={toast.open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <Alert
        onClose={onClose}
        severity={toast.severity}
        variant="filled"
        sx={{ width: "100%" }}
      >
        {toast.message}
      </Alert>
    </Snackbar>
  );
}
