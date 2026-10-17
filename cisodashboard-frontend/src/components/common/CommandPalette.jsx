import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, TextField, List, ListItem, ListItemText, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";

const ROUTES = [
  { title: "Cloud Accounts", url: "/cloud" },
  { title: "Asset Explorer", url: "/assets" },
  { title: "CSPM Findings", url: "/findings" },
  { title: "Policies", url: "/policies" },
  { title: "CIEM", url: "/ciem" },
  { title: "Kubernetes", url: "/kubernetes" },
  { title: "Containers", url: "/containers" },
  { title: "Runtime", url: "/runtime" },
  { title: "Alerts", url: "/alerts" },
  { title: "IP Scanner", url: "/ip-scanner" },
  { title: "Security Score", url: "/security-score" },
  { title: "Search", url: "/search" },
  { title: "Help", url: "/help" },
  { title: "Roles", url: "/admin/roles" },
  { title: "Platform Audit", url: "/platform-audit" },
];

const CommandPalette = ({ open, onClose }) => {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setHits(ROUTES.filter((item) => item.title.toLowerCase().includes(query.toLowerCase())));
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/api/v1/search", { params: { q: query } });
        setHits([
          ...ROUTES.filter((item) => item.title.toLowerCase().includes(query.toLowerCase())),
          ...(res.data.results || []),
        ]);
      } catch {
        setHits(ROUTES.filter((item) => item.title.toLowerCase().includes(query.toLowerCase())));
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogContent>
        <Typography variant="caption" sx={{ fontWeight: 700 }}>Ctrl+K command palette</Typography>
        <TextField autoFocus fullWidth placeholder="Jump to a page or search entities" value={query} onChange={(e) => setQuery(e.target.value)} sx={{ my: 1 }} />
        <List>
          {(hits.length ? hits : ROUTES).slice(0, 12).map((item) => (
            <ListItem
              key={`${item.type || "route"}-${item.id || item.url}`}
              button
              onClick={() => {
                navigate(item.url || "/search");
                onClose();
              }}
            >
              <ListItemText primary={item.title} secondary={item.type || "page"} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default CommandPalette;
