import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box, Typography, TextField, InputAdornment, IconButton,
  Tabs, Tab, Chip, CircularProgress, Alert, Card, CardContent,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Paper, Tooltip, Divider, Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import DevicesIcon from "@mui/icons-material/Devices";
import GroupIcon from "@mui/icons-material/Group";
import PolicyIcon from "@mui/icons-material/Policy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import searchApi from "../../utils/searchApi";

// ── Colour helpers ────────────────────────────────────────────────────────
const PRIORITY_COLOR = { critical: "error", high: "warning", medium: "info", low: "default" };
const STATUS_COLOR   = { new: "info", assigned: "warning", in_progress: "primary", resolved: "success", closed: "default" };
const RISK_COLOR     = { critical: "error", high: "warning", medium: "info", low: "success" };

function HighlightText({ text = "", query = "" }) {
  if (!query || !text) return <span>{text}</span>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part)
          ? <mark key={i} style={{ background: "#fff176", padding: 0 }}>{part}</mark>
          : part
      )}
    </span>
  );
}

// ── Ticket results table ──────────────────────────────────────────────────
function TicketResults({ tickets, query, onNavigate }) {
  if (tickets.length === 0)
    return <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>No tickets matched "{query}"</Typography>;

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "action.hover" }}>
            <TableCell><strong>Ticket #</strong></TableCell>
            <TableCell><strong>Title</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell><strong>Priority</strong></TableCell>
            <TableCell><strong>Category</strong></TableCell>
            <TableCell><strong>Assigned To</strong></TableCell>
            <TableCell align="right"></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tickets.map((t) => (
            <TableRow key={t.id} hover>
              <TableCell>
                <Typography variant="body2" fontWeight={600} color="primary">
                  <HighlightText text={t.ticket_number} query={query} />
                </Typography>
              </TableCell>
              <TableCell sx={{ maxWidth: 320 }}>
                <Typography variant="body2" noWrap>
                  <HighlightText text={t.title} query={query} />
                </Typography>
              </TableCell>
              <TableCell>
                <Chip label={t.status.replace("_", " ")} size="small"
                  color={STATUS_COLOR[t.status] || "default"} />
              </TableCell>
              <TableCell>
                <Chip label={t.priority} size="small"
                  color={PRIORITY_COLOR[t.priority] || "default"} />
              </TableCell>
              <TableCell>
                <Typography variant="caption">{t.category}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="caption" color="text.secondary">
                  {t.assigned_to || "—"}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Open ticket">
                  <IconButton size="small" onClick={() => onNavigate(`/tickets/${t.id}`)}>
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ── Asset results table ───────────────────────────────────────────────────
function AssetResults({ assets, query, onNavigate }) {
  if (assets.length === 0)
    return <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>No assets matched "{query}"</Typography>;

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "action.hover" }}>
            <TableCell><strong>Asset Name</strong></TableCell>
            <TableCell><strong>Type</strong></TableCell>
            <TableCell><strong>Risk Level</strong></TableCell>
            <TableCell align="center"><strong>Vulnerabilities</strong></TableCell>
            <TableCell align="right"></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {assets.map((a) => (
            <TableRow key={a.id} hover>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  <HighlightText text={a.name} query={query} />
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="caption">{a.type || "—"}</Typography>
              </TableCell>
              <TableCell>
                {a.risk_level
                  ? <Chip label={a.risk_level} size="small" color={RISK_COLOR[a.risk_level?.toLowerCase()] || "default"} />
                  : <Typography variant="caption" color="text.secondary">—</Typography>
                }
              </TableCell>
              <TableCell align="center">
                <Chip label={a.vulnerabilities_count} size="small"
                  color={a.vulnerabilities_count > 0 ? "warning" : "default"} variant="outlined" />
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Open asset">
                  <IconButton size="small" onClick={() => onNavigate(`/assets/${a.id}`)}>
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ── Agent results table ───────────────────────────────────────────────────
function AgentResults({ agents, query, onNavigate }) {
  if (agents.length === 0)
    return <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>No agents matched "{query}"</Typography>;

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "action.hover" }}>
            <TableCell><strong>Name</strong></TableCell>
            <TableCell><strong>Email</strong></TableCell>
            <TableCell><strong>Team</strong></TableCell>
            <TableCell><strong>Tier</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell align="right"></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {agents.map((a) => (
            <TableRow key={a.id} hover>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  <HighlightText text={a.name} query={query} />
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="caption">
                  <HighlightText text={a.email} query={query} />
                </Typography>
              </TableCell>
              <TableCell><Typography variant="caption">{a.team || "-"}</Typography></TableCell>
              <TableCell><Typography variant="caption">{a.tier || "-"}</Typography></TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={a.is_active ? "active" : "inactive"}
                  color={a.is_active ? "success" : "default"}
                  variant="outlined"
                />
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Open directory">
                  <IconButton size="small" onClick={() => onNavigate("/directory")}>
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ── Policy results table ──────────────────────────────────────────────────
function PolicyResults({ policies, query, onNavigate }) {
  if (policies.length === 0)
    return <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>No policies matched "{query}"</Typography>;

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "action.hover" }}>
            <TableCell><strong>Name</strong></TableCell>
            <TableCell><strong>Category</strong></TableCell>
            <TableCell><strong>Platform</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell align="right"></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {policies.map((p) => (
            <TableRow key={p.id} hover>
              <TableCell sx={{ maxWidth: 340 }}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  <HighlightText text={p.name} query={query} />
                </Typography>
              </TableCell>
              <TableCell><Typography variant="caption">{p.category || "-"}</Typography></TableCell>
              <TableCell><Typography variant="caption">{p.platform || "-"}</Typography></TableCell>
              <TableCell>
                <Chip label={p.status || "unknown"} size="small" color={p.status === "active" ? "success" : "default"} />
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Open policy">
                  <IconButton size="small" onClick={() => onNavigate(`/policies/${p.id}`)}>
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQ);
  const [submitted, setSubmitted] = useState(initialQ);
  const [results, setResults] = useState(null);   // SearchResponse | null
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);              // 0=All, 1=Tickets, 2=Assets, 3=Agents, 4=Policies
  const inputRef = useRef(null);

  const doSearch = useCallback(async (q) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const data = await searchApi.search(q.trim(), 50);
      setResults(data);
      setTab(0);
      setSearchParams({ q: q.trim() }, { replace: true });
    } catch {
      setError("Search service unavailable — make sure port 8009 is running.");
    } finally {
      setLoading(false);
    }
  }, [setSearchParams]);

  // Run search if page opened with ?q= param
  useEffect(() => {
    if (initialQ) doSearch(initialQ);
    inputRef.current?.focus();
  }, []); // eslint-disable-line

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(query);
    doSearch(query);
  };

  const handleClear = () => {
    setQuery("");
    setResults(null);
    setSubmitted("");
    setSearchParams({});
    inputRef.current?.focus();
  };

  const tickets = results?.tickets || [];
  const assets  = results?.assets  || [];
  const agents = results?.agents || [];
  const policies = results?.policies || [];
  const total   = results?.total   || 0;

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: "auto" }}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>Global Search</Typography>
        <Typography variant="body2" color="text.secondary">
          Search across Tickets, Assets, Agents, and Policies simultaneously
        </Typography>
      </Box>

      {/* ── Search bar ─────────────────────────────────────────────── */}
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
        <TextField
          inputRef={inputRef}
          fullWidth
          size="medium"
          placeholder='Search tickets, assets, agents, policies… e.g. "firewall", "alice", "baseline"'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {query && (
                  <IconButton size="small" onClick={handleClear}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
                <Button
                  type="submit"
                  variant="contained"
                  size="small"
                  disabled={!query.trim() || loading}
                  sx={{ ml: 1 }}
                >
                  Search
                </Button>
              </InputAdornment>
            ),
          }}
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
        />
      </Box>

      {/* ── Loading ─────────────────────────────────────────────────── */}
      {loading && (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Searching…
          </Typography>
        </Box>
      )}

      {/* ── Error ───────────────────────────────────────────────────── */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── Results ─────────────────────────────────────────────────── */}
      {results && !loading && (
        <>
          {/* Summary bar */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>{total}</strong> result{total !== 1 ? "s" : ""} for{" "}
              <strong>"{submitted}"</strong>
            </Typography>
            <Chip
              icon={<ConfirmationNumberIcon style={{ fontSize: 14 }} />}
              label={`${tickets.length} ticket${tickets.length !== 1 ? "s" : ""}`}
              size="small" color={tickets.length ? "primary" : "default"} variant="outlined"
            />
            <Chip
              icon={<DevicesIcon style={{ fontSize: 14 }} />}
              label={`${assets.length} asset${assets.length !== 1 ? "s" : ""}`}
              size="small" color={assets.length ? "secondary" : "default"} variant="outlined"
            />
            <Chip
              icon={<GroupIcon style={{ fontSize: 14 }} />}
              label={`${agents.length} agent${agents.length !== 1 ? "s" : ""}`}
              size="small" color={agents.length ? "success" : "default"} variant="outlined"
            />
            <Chip
              icon={<PolicyIcon style={{ fontSize: 14 }} />}
              label={`${policies.length} polic${policies.length !== 1 ? "ies" : "y"}`}
              size="small" color={policies.length ? "warning" : "default"} variant="outlined"
            />
          </Box>

          {/* Tabs */}
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label={`All (${total})`} />
            <Tab
              label={`Tickets (${tickets.length})`}
              icon={<ConfirmationNumberIcon fontSize="small" />}
              iconPosition="start"
            />
            <Tab
              label={`Assets (${assets.length})`}
              icon={<DevicesIcon fontSize="small" />}
              iconPosition="start"
            />
            <Tab
              label={`Agents (${agents.length})`}
              icon={<GroupIcon fontSize="small" />}
              iconPosition="start"
            />
            <Tab
              label={`Policies (${policies.length})`}
              icon={<PolicyIcon fontSize="small" />}
              iconPosition="start"
            />
          </Tabs>

          {/* All tab */}
          {tab === 0 && total === 0 && (
            <Typography color="text.secondary" sx={{ textAlign: "center", py: 5 }}>
              No results found for "{submitted}"
            </Typography>
          )}

          {tab === 0 && tickets.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Tickets
              </Typography>
              <TicketResults tickets={tickets} query={submitted} onNavigate={navigate} />
            </Box>
          )}

          {tab === 0 && assets.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Assets
              </Typography>
              <AssetResults assets={assets} query={submitted} onNavigate={navigate} />
            </Box>
          )}

          {tab === 0 && agents.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Agents
              </Typography>
              <AgentResults agents={agents} query={submitted} onNavigate={navigate} />
            </Box>
          )}

          {tab === 0 && policies.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Policies
              </Typography>
              <PolicyResults policies={policies} query={submitted} onNavigate={navigate} />
            </Box>
          )}

          {/* Tickets-only tab */}
          {tab === 1 && (
            <TicketResults tickets={tickets} query={submitted} onNavigate={navigate} />
          )}

          {/* Assets-only tab */}
          {tab === 2 && (
            <AssetResults assets={assets} query={submitted} onNavigate={navigate} />
          )}

          {/* Agents-only tab */}
          {tab === 3 && (
            <AgentResults agents={agents} query={submitted} onNavigate={navigate} />
          )}

          {/* Policies-only tab */}
          {tab === 4 && (
            <PolicyResults policies={policies} query={submitted} onNavigate={navigate} />
          )}
        </>
      )}

      {/* ── Empty state ─────────────────────────────────────────────── */}
      {!results && !loading && !error && (
        <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
          <SearchIcon sx={{ fontSize: 64, opacity: 0.2, mb: 1 }} />
          <Typography>Type a keyword and press Search</Typography>
          <Typography variant="caption">
            Searches tickets, assets, directory agents, and policy metadata
          </Typography>
        </Box>
      )}
    </Box>
  );
}
