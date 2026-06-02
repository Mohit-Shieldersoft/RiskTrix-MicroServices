const BASE = "/api/v1";

const commandsApi = {
  // Issue a generic command
  issue: async (deviceId, commandType, payload = {}, issuedBy = "admin") => {
    const res = await fetch(`${BASE}/devices/${deviceId}/commands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command_type: commandType, payload, issued_by: issuedBy }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Shortcut wrappers
  lock:             (deviceId, issuedBy = "admin") =>
    commandsApi.issue(deviceId, "lock", {}, issuedBy),
  wipe:             (deviceId, issuedBy = "admin") =>
    commandsApi.issue(deviceId, "wipe", {}, issuedBy),
  restart:          (deviceId, issuedBy = "admin") =>
    commandsApi.issue(deviceId, "restart", {}, issuedBy),
  sync:             (deviceId, issuedBy = "admin") =>
    commandsApi.issue(deviceId, "sync", {}, issuedBy),
  clearPasscode:    (deviceId, issuedBy = "admin") =>
    commandsApi.issue(deviceId, "clear_passcode", {}, issuedBy),
  enableLostMode:   (deviceId, issuedBy = "admin") =>
    commandsApi.issue(deviceId, "enable_lost_mode", {}, issuedBy),
  sendMessage:      (deviceId, message, issuedBy = "admin") =>
    commandsApi.issue(deviceId, "message", { message }, issuedBy),

  // List all commands for a device
  list: async (deviceId) => {
    const res = await fetch(`${BASE}/devices/${deviceId}/commands`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Cancel a command
  cancel: async (commandId) => {
    const res = await fetch(`${BASE}/commands/${commandId}`, { method: "DELETE" });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

export default commandsApi;
