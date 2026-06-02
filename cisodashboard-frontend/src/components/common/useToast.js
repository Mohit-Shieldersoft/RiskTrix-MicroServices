import { useState } from "react";

/**
 * Hook that manages toast state.
 *
 * Returns:
 *   toast      — state object passed to <Toast toast={toast} />
 *   showToast  — (message, severity?) => void
 *   closeToast — () => void
 */
export function useToast() {
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showToast = (message, severity = "success") => {
    setToast({ open: true, message, severity });
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, open: false }));
  };

  return { toast, showToast, closeToast };
}
