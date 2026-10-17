import React, { useEffect, useState } from "react";
import {
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  LinearProgress,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import api from "../../utils/api";
import PageShell, { PageSection, EmptyState } from "../../components/common/PageShell";
import NoCloudWorkspace from "../../components/common/NoCloudWorkspace";

const formatWhen = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

const scoreColor = (value) => {
  if (value == null) return "#64748b";
  if (value >= 85) return "#2e7d32";
  if (value >= 70) return "#ed6c02";
  return "#c62828";
};

const ScoreCard = ({ label, value, hint }) => (
  <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
    <Card elevation={0} sx={{ border: "1px solid rgba(63,81,181,0.1)", height: "100%" }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, color: scoreColor(value), mt: 1 }}>
          {value == null ? "—" : Number(value).toFixed(1)}
        </Typography>
        {value != null && (
          <LinearProgress
            variant="determinate"
            value={Math.max(0, Math.min(100, Number(value)))}
            sx={{ mt: 1.5, height: 6, borderRadius: 99 }}
          />
        )}
        {hint && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            {hint}
          </Typography>
        )}
      </CardContent>
    </Card>
  </Grid>
);

const SecurityScore = () => {
  const [score, setScore] = useState(null);
  const [history, setHistory] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [drill, setDrill] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [current, hist, accountRes] = await Promise.all([
          api.get("/api/v1/security-score"),
          api.get(`/api/v1/security-score/history?days=${days}`),
          api.get("/api/v1/cloud/accounts"),
        ]);
        setScore(current.data);
        setHistory(Array.isArray(hist.data) ? hist.data : []);
        setAccounts(Array.isArray(accountRes.data) ? accountRes.data : []);
      } catch {
        setScore(null);
        setHistory([]);
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [days]);

  const connected = accounts.length > 0 && (score?.accounts_active ?? accounts.length) > 0;
  const cards = [
    ["Overall", score?.overall_score, "Weighted posture, IAM, vulns, compliance"],
    ["Posture", score?.posture_score, "Open misconfigurations"],
    ["IAM", score?.iam_score, "Identity and access findings"],
    ["Vulns", score?.vuln_score, "Critical and high exposure"],
    ["Compliance", score?.compliance_score, "Control coverage"],
  ];

  return (
    <PageShell
      title="Executive Security Score"
      subtitle="Live composite score from connected cloud accounts. Scores stay blank until an account is connected and scanned."
      actions={
        <>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>History</InputLabel>
            <Select value={days} label="History" onChange={(e) => setDays(Number(e.target.value))}>
              <MenuItem value={7}>7 days</MenuItem>
              <MenuItem value={30}>30 days</MenuItem>
              <MenuItem value={90}>90 days</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" disabled={!accounts.length} onClick={async () => {
            await api.post("/api/v1/cloud/scan");
            window.location.reload();
          }}>Trigger scan</Button>
        </>
      }
    >
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : !connected ? (
        <NoCloudWorkspace
          title="No security score yet"
          message="Connect a cloud account and run a posture scan. We do not invent a 100% score for an empty tenant."
        />
      ) : (
        <>
          <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
            <Chip size="small" label={`${score.accounts_active || accounts.length} accounts`} />
            <Chip size="small" label={`${score.assets_scanned || 0} assets scanned`} />
            <Chip size="small" color="error" variant="outlined" label={`${score.critical_findings || 0} critical`} />
            <Chip size="small" color="warning" variant="outlined" label={`${score.high_findings || 0} high`} />
          </Box>
          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            {cards.map(([label, value, hint]) => (
              <ScoreCard key={label} label={label} value={value} hint={hint} />
            ))}
          </Grid>
          {(score.providerScores || []).length > 0 && (
            <PageSection>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Provider breakdown</Typography>
              {score.providerScores.map((item) => (
                <Chip key={item.provider} sx={{ mr: 1, mb: 1 }} label={`${item.provider}: ${item.score} (${item.open_findings} open)`} onClick={() => setDrill({ title: item.provider, findings: score.open_findings?.filter((row) => row.provider === item.provider), assets: score.risky_assets?.filter((row) => row.provider === item.provider) })} />
              ))}
              {(score.categoryScores || []).map((item) => (
                <Chip key={item.category} variant="outlined" sx={{ mr: 1, mb: 1 }} label={`${item.category}: ${item.score}`} onClick={() => setDrill({ title: item.category, findings: score.open_findings, assets: score.risky_assets })} />
              ))}
            </PageSection>
          )}
        </>
      )}

      <Dialog open={Boolean(drill)} onClose={() => setDrill(null)} maxWidth="md" fullWidth>
        <DialogTitle>{drill?.title} drill-down</DialogTitle>
        <DialogContent>
          {(drill?.findings || []).map((item) => (
            <Typography key={item.id} variant="body2">{item.severity} · {item.title}</Typography>
          ))}
          {(drill?.assets || []).map((item) => (
            <Typography key={item.id} variant="body2">Asset · {item.name} · risk {item.risk_score}</Typography>
          ))}
        </DialogContent>
        <DialogActions><Button onClick={() => setDrill(null)}>Close</Button></DialogActions>
      </Dialog>

      <PageSection>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          Score history
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Overall</TableCell>
              <TableCell>Posture</TableCell>
              <TableCell>IAM</TableCell>
              <TableCell>Vulns</TableCell>
              <TableCell>Compliance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!connected || history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState message="History is created only after a connected account is scored." />
                </TableCell>
              </TableRow>
            ) : (
              history.slice(0, 20).map((row) => (
                <TableRow key={row.id || row.created_at} hover>
                  <TableCell>{formatWhen(row.created_at)}</TableCell>
                  <TableCell>{row.overall_score ?? "—"}</TableCell>
                  <TableCell>{row.posture_score ?? "—"}</TableCell>
                  <TableCell>{row.iam_score ?? "—"}</TableCell>
                  <TableCell>{row.vuln_score ?? "—"}</TableCell>
                  <TableCell>{row.compliance_score ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </PageSection>
    </PageShell>
  );
};

export default SecurityScore;
