import React, { useEffect, useState } from "react";
import {
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Box,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import api from "../../utils/api";
import PageShell, { PageSection, EmptyState } from "../../components/common/PageShell";

const Runtime = () => {
  const [threats, setThreats] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState("threats");
  const [severity, setSeverity] = useState("ALL");
  const [selectedThreat, setSelectedThreat] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [threatRes, statsRes, eventRes] = await Promise.all([
        api.get("/api/v1/runtime/threats"),
        api.get("/api/v1/runtime/stats"),
        api.get("/api/v1/runtime/events"),
      ]);
      setThreats(threatRes.data || []);
      setStats(statsRes.data);
      setEvents(eventRes.data || []);
    } catch {
      setThreats([]);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const ingest = async () => {
    try {
      const res = await api.post("/api/v1/runtime/ingest");
      setMessage(`Ingested ${res.data.ingested || 0} runtime findings`);
      load();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Ingest failed");
    }
  };

  const resolveThreat = async (threatId) => {
    try {
      await api.patch(`/api/v1/runtime/threats/${threatId}/status?status=RESOLVED`);
      setMessage(`Resolved threat ${threatId}`);
      load();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Resolve failed");
    }
  };

  return (
    <PageShell
      title="Runtime Threat Protection"
      subtitle="Ingest GuardDuty, Defender, and SCC findings. No cloud mutation is performed."
      actions={<Button variant="contained" onClick={ingest}>Ingest runtime feeds</Button>}
    >
      {message && <Alert sx={{ mb: 2 }}>{message}</Alert>}
      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
        <Tab value="threats" label="Threats" />
        <Tab value="events" label="Events" />
      </Tabs>
      {stats && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {[
            { label: "Open threats", value: stats.open, color: "#3f51b5" },
            { label: "Critical", value: stats.critical, color: "#d32f2f" },
            { label: "High", value: stats.high, color: "#f57c00" },
            { label: "Total ingested", value: stats.total, color: "#455a64" },
          ].map((card) => (
            <Grid item xs={12} sm={6} md={3} key={card.label}>
              <Card sx={{ borderLeft: `4px solid ${card.color}` }}>
                <CardContent sx={{ py: 1.5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{card.label}</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: card.color }}>{card.value ?? 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      {tab === "threats" && (
      <PageSection>
        <TextField size="small" select label="Severity" value={severity} onChange={(e) => setSeverity(e.target.value)} sx={{ mb: 2, minWidth: 160 }} SelectProps={{ native: true }}>
          <option value="ALL">All</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
        </TextField>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
        ) : (
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Provider</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {threats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState message="No runtime threats. Ingest a feed after connecting cloud credentials." />
                    </TableCell>
                  </TableRow>
                ) : (
                  threats.filter((item) => severity === "ALL" || item.severity === severity).map((threat) => (
                    <TableRow key={threat.id}>
                      <TableCell sx={{ cursor: "pointer" }} onClick={async () => {
                        try {
                          const res = await api.get(`/api/v1/runtime/threats/${threat.id}`);
                          setSelectedThreat(res.data);
                        } catch {
                          setSelectedThreat(threat);
                        }
                      }}>{threat.title}</TableCell>
                      <TableCell>{threat.source}</TableCell>
                      <TableCell>
                        <Chip size="small" color={threat.severity === "CRITICAL" ? "error" : "warning"} label={threat.severity} />
                      </TableCell>
                      <TableCell>{threat.status}</TableCell>
                      <TableCell>{threat.provider}</TableCell>
                      <TableCell align="right">
                        {threat.status === "OPEN" && (
                          <Button size="small" onClick={() => resolveThreat(threat.id)}>Resolve</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </PageSection>
      )}
      {tab === "events" && (
      <PageSection>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>Runtime events</Typography>
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Threat</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}><EmptyState message="No runtime events ingested yet." /></TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.event_type}</TableCell>
                    <TableCell>{event.threat_id}</TableCell>
                    <TableCell>{event.message}</TableCell>
                    <TableCell>{event.created_at}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </PageSection>
      )}
      <Dialog open={Boolean(selectedThreat)} onClose={() => setSelectedThreat(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedThreat?.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">{selectedThreat?.description}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>{selectedThreat?.source} · {selectedThreat?.severity} · {selectedThreat?.status}</Typography>
        </DialogContent>
        <DialogActions><Button onClick={() => setSelectedThreat(null)}>Close</Button></DialogActions>
      </Dialog>
    </PageShell>
  );
};

export default Runtime;
