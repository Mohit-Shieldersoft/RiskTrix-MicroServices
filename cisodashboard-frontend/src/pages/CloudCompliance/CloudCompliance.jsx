import React, { useEffect, useState } from "react";
import {
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  LinearProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import api from "../../utils/api";
import PageShell from "../../components/common/PageShell";
import NoCloudWorkspace from "../../components/common/NoCloudWorkspace";

const CloudCompliance = () => {
  const [assessments, setAssessments] = useState([]);
  const [frameworks, setFrameworks] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [accountId, setAccountId] = useState("ALL");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [addOpen, setAddOpen] = useState(false);
  const [newFramework, setNewFramework] = useState({ code: "", category: "Custom", controls: "MFA, encryption" });

  const load = async (reassess = false) => {
    setLoading(true);
    try {
      const [accountRes, frameworkRes, assessmentRes] = await Promise.all([
        api.get("/api/v1/cloud/accounts"),
        api.get("/api/v1/cloud/compliance/frameworks"),
        reassess
          ? api.post("/api/v1/cloud/compliance/assessments", null, { params: { cloudAccountId: accountId !== "ALL" ? accountId : undefined } })
          : api.get("/api/v1/cloud/compliance/assessments", { params: { cloudAccountId: accountId !== "ALL" ? accountId : undefined } }),
      ]);
      const connected = Array.isArray(accountRes.data) ? accountRes.data : [];
      setAccounts(connected);
      setFrameworks(Array.isArray(frameworkRes.data) ? frameworkRes.data : []);
      setAssessments(connected.length ? assessmentRes.data || [] : []);
    } catch {
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(false);
  }, []);

  const exportEvidence = async () => {
    try {
      const res = await api.get("/api/v1/cloud/compliance/export");
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "cloud-compliance-evidence.json";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      /* keep page usable */
    }
  };

  return (
    <PageShell
      title="Cloud Compliance"
      subtitle="Finding-derived CIS, SOC 2, PCI DSS, ISO 27001, and NIST evidence. Separate from vendor GRC Compliance."
      actions={
        <>
          <Button variant="outlined" disabled={!accounts.length} onClick={() => setAddOpen(true)}>Add framework</Button>
          <Button variant="outlined" disabled={!accounts.length} onClick={exportEvidence}>
            Export evidence
          </Button>
          <Button variant="contained" disabled={!accounts.length} onClick={() => load(true)}>
            Run all
          </Button>
        </>
      }
    >
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : accounts.length === 0 ? (
        <NoCloudWorkspace
          title="No compliance evidence yet"
          message="Connect a cloud account first. Framework cards stay hidden so an empty tenant is not scored as 100% compliant."
        />
      ) : (
        <>
          <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Account</InputLabel>
              <Select value={accountId} label="Account" onChange={(e) => setAccountId(e.target.value)}>
                <MenuItem value="ALL">All accounts</MenuItem>
                {accounts.map((item) => (
                  <MenuItem key={item.account_id || item.id} value={item.account_id || item.id}>{item.name || item.account_id}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Category</InputLabel>
              <Select value={category} label="Category" onChange={(e) => setCategory(e.target.value)}>
                <MenuItem value="ALL">All</MenuItem>
                <MenuItem value="Benchmarks">Benchmarks</MenuItem>
                <MenuItem value="Regulatory">Regulatory</MenuItem>
                <MenuItem value="Trust">Trust</MenuItem>
              </Select>
            </FormControl>
            <TextField size="small" placeholder="Search framework" value={search} onChange={(e) => setSearch(e.target.value)} />
          </Box>
          <Grid container spacing={2}>
            {assessments.filter((item) => {
              if (category !== "ALL" && (item.category || "") !== category) return false;
              if (search && !String(item.framework).toLowerCase().includes(search.toLowerCase())) return false;
              return true;
            }).map((item) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.framework}>
                <Card
                  elevation={0}
                  sx={{ border: "1px solid rgba(63,81,181,0.1)", height: "100%", cursor: "pointer" }}
                  onClick={() => setSelected(item)}
                >
                  <CardContent>
                    <Typography variant="overline" color="text.secondary">{item.framework}</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, my: 1 }}>
                      {item.score}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.max(0, Math.min(100, Number(item.score) || 0))}
                      sx={{ mb: 1.5, height: 6, borderRadius: 99 }}
                    />
                    <Chip label={`${item.passed} passed`} color="success" size="small" sx={{ mr: 1 }} />
                    <Chip label={`${item.failed} failed`} color="error" size="small" />
                    <Box sx={{ mt: 1.5 }}>
                      <Button size="small" onClick={async (e) => {
                        e.stopPropagation();
                        const res = await api.post("/api/v1/cloud/compliance/assessments", null, { params: { frameworkType: item.framework, cloudAccountId: accountId !== "ALL" ? accountId : undefined } });
                        const next = Array.isArray(res.data) ? res.data : assessments;
                        setAssessments(next);
                      }}>Run</Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="md" fullWidth>
        <DialogTitle>{selected?.framework} controls</DialogTitle>
        <DialogContent dividers>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Control</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Evidence</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(selected?.controls || []).map((control) => (
                <TableRow key={control.control}>
                  <TableCell>{control.control}</TableCell>
                  <TableCell>
                    <Chip size="small" color={control.status === "PASS" ? "success" : "error"} label={control.status} />
                  </TableCell>
                  <TableCell>{control.evidence || "No open finding matched this keyword."}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={addOpen} onClose={() => setAddOpen(false)}>
        <DialogTitle>Add framework</DialogTitle>
        <DialogContent>
          <TextField fullWidth sx={{ mt: 1 }} label="Code" value={newFramework.code} onChange={(e) => setNewFramework({ ...newFramework, code: e.target.value })} />
          <TextField fullWidth sx={{ mt: 1 }} label="Category" value={newFramework.category} onChange={(e) => setNewFramework({ ...newFramework, category: e.target.value })} />
          <TextField fullWidth sx={{ mt: 1 }} label="Controls (comma separated)" value={newFramework.controls} onChange={(e) => setNewFramework({ ...newFramework, controls: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button onClick={async () => {
            await api.post("/api/v1/cloud/compliance/frameworks", {
              code: newFramework.code,
              category: newFramework.category,
              keywords: newFramework.controls.split(",").map((item) => item.trim()).filter(Boolean),
            });
            setAddOpen(false);
            load(true);
          }}>Save</Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  );
};

export default CloudCompliance;
