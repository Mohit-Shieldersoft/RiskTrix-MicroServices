import React, { useEffect, useMemo, useState } from "react";
import { Box, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, Typography, Divider } from "@mui/material";
import api from "../../utils/api";
import PageShell, { PageSection, EmptyState } from "../../components/common/PageShell";

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState([]);

  const load = () => {
    api.get("/api/v1/roles").then((res) => setRoles(res.data || [])).catch(() => setRoles([]));
    api.get("/api/v1/permissions").then((res) => setCatalog(Array.isArray(res.data) ? res.data : [])).catch(() => setCatalog([]));
    api.get("/api/v1/permissions/grouped").then((res) => setGrouped(res.data || {})).catch(() => setGrouped({}));
  };

  useEffect(() => {
    load();
  }, []);

  const groups = useMemo(() => {
    if (grouped && Object.keys(grouped).length) return grouped;
    return catalog.reduce((acc, item) => {
      const key = item.group || "General";
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [grouped, catalog]);

  const toggle = (code, checked) => {
    setSelected((prev) => (checked ? [...new Set([...prev, code])] : prev.filter((value) => value !== code)));
  };

  return (
    <PageShell title="Roles & Permissions" subtitle="Assign catalog permissions to system and custom roles.">
      <PageSection>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField size="small" label="New role name" value={name} onChange={(e) => setName(e.target.value)} sx={{ minWidth: 220, flex: 1 }} />
          <Button
            variant="contained"
            onClick={async () => {
              if (!name.trim()) return;
              await api.post(`/api/v1/roles?name=${encodeURIComponent(name)}`);
              setName("");
              load();
            }}
          >
            Create role
          </Button>
        </Box>
      </PageSection>
      <PageSection>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Role</TableCell>
              <TableCell>System</TableCell>
              <TableCell>Permissions</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}><EmptyState message="No roles returned from IAM." /></TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>{role.system ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    {(role.permissions || []).map((perm) => (
                      <Chip key={perm} label={perm} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => { setEditing(role); setSelected(role.permissions || []); }}>
                      Edit matrix
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </PageSection>
      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} maxWidth="md" fullWidth>
        <DialogTitle>Permission matrix — {editing?.name}</DialogTitle>
        <DialogContent>
          {Object.entries(groups).map(([group, items]) => (
            <Box key={group} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{group}</Typography>
              <Divider sx={{ mb: 1 }} />
              <Table size="small">
                <TableBody>
                  {(items || []).map((item) => {
                    const code = item.code || item.id || item;
                    return (
                      <TableRow key={code}>
                        <TableCell width={56}>
                          <Checkbox
                            checked={selected.includes(code)}
                            disabled={editing?.id === "ADMIN"}
                            onChange={(e) => toggle(code, e.target.checked)}
                          />
                        </TableCell>
                        <TableCell>{item.name || code}</TableCell>
                        <TableCell><Chip size="small" label={code} /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={editing?.id === "ADMIN"}
            onClick={async () => {
              await api.put(`/api/v1/roles/${editing.id}/permissions`, selected);
              setEditing(null);
              load();
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  );
};

export default Roles;
