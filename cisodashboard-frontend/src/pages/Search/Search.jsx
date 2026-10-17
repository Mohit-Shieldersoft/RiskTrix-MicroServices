import React, { useEffect, useState } from "react";
import { Box, TextField, Button, List, ListItem, ListItemText, Chip, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../utils/api";
import PageShell, { PageSection, EmptyState } from "../../components/common/PageShell";

const TYPES = ["", "asset", "finding", "policy", "cloud_account", "identity", "alert"];
const SUGGESTIONS = ["S3", "public", "IAM", "privileged", "encryption", "kubernetes"];

const Search = () => {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const runSearch = async (nextQuery = query, nextType = type) => {
    if (!nextQuery.trim()) return;
    try {
      const res = await api.get("/api/v1/search", { params: { q: nextQuery, type: nextType || undefined } });
      setResults(res.data.results || []);
    } catch {
      setResults([]);
    } finally {
      setSearched(true);
    }
  };

  useEffect(() => {
    const q = params.get("q");
    const t = params.get("type") || "";
    if (q) {
      setQuery(q);
      setType(t);
      runSearch(q, t);
    }
  }, [params]);

  return (
    <PageShell
      title="Global Search"
      subtitle="Search assets, findings, accounts, identities, alerts, and Kubernetes objects."
    >
      <PageSection>
        <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
          <TextField
            fullWidth
            label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Type</InputLabel>
            <Select value={type} label="Type" onChange={(e) => setType(e.target.value)}>
              <MenuItem value="">All entities</MenuItem>
              {TYPES.filter(Boolean).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={() => runSearch()} sx={{ minWidth: 120 }}>
            Search
          </Button>
        </Box>
        <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
          {SUGGESTIONS.map((item) => (
            <Chip key={item} label={item} onClick={() => { setQuery(item); runSearch(item, type); }} />
          ))}
        </Box>
      </PageSection>
      <PageSection>
        {!searched ? (
          <EmptyState message="Enter a query or pick a suggested search." />
        ) : results.length === 0 ? (
          <EmptyState message="No results. Try an asset name, finding title, or identity." />
        ) : (
          <List disablePadding>
            {results.map((hit) => (
              <ListItem
                key={`${hit.type}-${hit.id}`}
                button
                onClick={() => navigate(hit.url || "/")}
                sx={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
              >
                <ListItemText
                  primary={hit.title}
                  secondary={`${hit.type}${hit.severity ? ` · ${hit.severity}` : ""}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </PageSection>
    </PageShell>
  );
};

export default Search;
