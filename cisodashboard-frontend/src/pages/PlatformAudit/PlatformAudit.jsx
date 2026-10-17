import React, { useEffect, useState } from "react";
import { Box, Button, TextField, Table, TableHead, TableRow, TableCell, TableBody, Alert } from "@mui/material";
import api from "../../utils/api";
import PageShell, { PageSection, EmptyState } from "../../components/common/PageShell";

const PlatformAudit = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (action) params.action = action;
      const res = await api.get("/api/v1/platform-audit", { params });
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch {
      setLogs([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const exportCsv = async () => {
    try {
      const res = await api.get("/api/v1/platform-audit/export");
      const blob = new Blob([res.data.content || ""], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "platform-audit.csv";
      link.click();
      URL.revokeObjectURL(url);
      setMessage(`Exported ${res.data.count || 0} audit events`);
    } catch (err) {
      setMessage(err.response?.data?.detail || "Export failed");
    }
  };

  return (
    <PageShell title="Platform Audit" subtitle="Search and filter tenant IAM, invitation, and configuration events.">
      <PageSection>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField size="small" placeholder="Search actor or detail" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 240, flex: 1 }} />
          <TextField size="small" placeholder="Filter action" value={action} onChange={(e) => setAction(e.target.value)} />
          <Button variant="outlined" onClick={load}>Apply filters</Button>
          <Button variant="contained" onClick={exportCsv}>Export CSV</Button>
        </Box>
        {message && <Alert sx={{ mt: 2 }}>{message}</Alert>}
      </PageSection>
      <PageSection>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Actor</TableCell>
              <TableCell>Detail</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}><EmptyState message="No platform audit events match the current filters." /></TableCell>
              </TableRow>
            ) : (
              logs.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.created_at}</TableCell>
                  <TableCell>{row.action}</TableCell>
                  <TableCell>{row.actor}</TableCell>
                  <TableCell>{row.detail}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </PageSection>
    </PageShell>
  );
};

export default PlatformAudit;
