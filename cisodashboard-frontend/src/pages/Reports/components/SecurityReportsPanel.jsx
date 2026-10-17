import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Menu,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import api from "../../../utils/api";
import { PageSection, EmptyState } from "../../../components/common/PageShell";
import dashboardTheme from "../../../theme/dashboardTheme";

const FALLBACK_TYPES = [
  { value: "EXECUTIVE", label: "Executive Security Summary", purpose: "Leadership posture, KPIs, and prioritized recommendations.", group: "Governance" },
  { value: "CLOUD_POSTURE", label: "Cloud Posture Assessment", purpose: "Security score, accounts, and inventory scale.", group: "Cloud" },
  { value: "CSPM", label: "CSPM Findings", purpose: "Open misconfigurations by asset, policy, and severity.", group: "Cloud" },
  { value: "CIEM", label: "CIEM Identity", purpose: "Entitlement risk for privilege reduction.", group: "Cloud" },
  { value: "ASSET_INVENTORY", label: "Asset Inventory", purpose: "Cloud asset register for CMDB alignment.", group: "Cloud" },
  { value: "COMPLIANCE", label: "Compliance", purpose: "Framework outcomes and control gaps.", group: "Governance" },
  { value: "AUDIT", label: "Platform Audit", purpose: "IAM and configuration activity trail.", group: "Governance" },
  { value: "VULNERABILITY", label: "Vulnerabilities", purpose: "Application and cloud vulnerability backlog.", group: "Applications" },
  { value: "APPLICATION", label: "Application Portfolio", purpose: "RiskTrix application findings with ownership.", group: "Applications" },
  { value: "KUBERNETES", label: "Kubernetes", purpose: "Clusters and open Kubernetes findings.", group: "Workloads" },
  { value: "CONTAINER", label: "Containers", purpose: "Images and container CVE exposure.", group: "Workloads" },
  { value: "RUNTIME", label: "Runtime", purpose: "Threats and execution events.", group: "Operations" },
  { value: "ALERT", label: "Alerts", purpose: "SOC queue for triage and MTTR.", group: "Operations" },
];

const GROUP_ORDER = ["Governance", "Cloud", "Workloads", "Applications", "Operations"];

const downloadBlob = (data, filename, type) => {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const filenameFromHeader = (header, fallback) => {
  const match = String(header || "").match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i);
  const raw = decodeURIComponent(match?.[1] || match?.[2] || "");
  return raw || fallback;
};

export const downloadSecurityReport = async (reportId, title, format = "PDF") => {
  const res = await api.get(`/api/v1/cloud/reports/${reportId}/download`, {
    params: { fmt: format },
    responseType: "blob",
  });
  const ext = format === "CSV" ? "csv" : format === "JSON" ? "json" : format === "HTML" ? "html" : "pdf";
  const mime = res.headers["content-type"] || (
    format === "CSV" ? "text/csv" : format === "JSON" ? "application/json" : format === "HTML" ? "text/html" : "application/pdf"
  );
  const filename = filenameFromHeader(
    res.headers["content-disposition"],
    `${(title || "risktrix-report").replace(/\s+/g, "-").toLowerCase()}.${ext}`
  );
  downloadBlob(res.data, filename, mime);
};

const formatChipColor = (format) => {
  if (format === "CSV") return "warning";
  if (format === "JSON") return "info";
  return "primary";
};

const SecurityReportsPanel = () => {
  const [types, setTypes] = useState(FALLBACK_TYPES);
  const [reports, setReports] = useState([]);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [formatFilter, setFormatFilter] = useState("ALL");
  const [form, setForm] = useState({ type: "EXECUTIVE", format: "PDF", title: "" });
  const [downloadMenu, setDownloadMenu] = useState({ anchor: null, report: null });

  const catalog = useMemo(
    () => types.map((item) => ({ ...item, group: item.group || FALLBACK_TYPES.find((row) => row.value === item.value)?.group || "Governance" })),
    [types]
  );

  const selectedType = useMemo(
    () => catalog.find((item) => item.value === form.type) || catalog[0],
    [catalog, form.type]
  );

  const grouped = useMemo(() => {
    const buckets = {};
    catalog.forEach((item) => {
      buckets[item.group] = buckets[item.group] || [];
      buckets[item.group].push(item);
    });
    return GROUP_ORDER.filter((group) => buckets[group]?.length).map((group) => ({ group, items: buckets[group] }));
  }, [catalog]);

  const load = async () => {
    try {
      const [typeRes, listRes] = await Promise.all([
        api.get("/api/v1/cloud/reports/types").catch(() => ({ data: FALLBACK_TYPES })),
        api.get("/api/v1/cloud/reports"),
      ]);
      setTypes(Array.isArray(typeRes.data) && typeRes.data.length ? typeRes.data : FALLBACK_TYPES);
      setReports(Array.isArray(listRes.data) ? listRes.data : []);
    } catch {
      setReports([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const type = report.report_type || report.type || "";
      if (typeFilter !== "ALL" && type !== typeFilter) return false;
      if (formatFilter !== "ALL" && (report.format || "").toUpperCase() !== formatFilter) return false;
      if (search) {
        const hay = `${report.title || ""} ${type}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [reports, search, typeFilter, formatFilter]);

  const stats = useMemo(() => ({
    total: reports.length,
    pdf: reports.filter((row) => ["PDF", "HTML"].includes((row.format || "").toUpperCase())).length,
    csv: reports.filter((row) => (row.format || "").toUpperCase() === "CSV").length,
    json: reports.filter((row) => (row.format || "").toUpperCase() === "JSON").length,
  }), [reports]);

  const openGenerate = (type) => {
    setForm((prev) => ({ ...prev, type: type || prev.type }));
    setOpen(true);
  };

  const generate = async () => {
    setGenerating(true);
    try {
      await api.post("/api/v1/cloud/reports/generate", {
        report_type: form.type,
        format: form.format,
        title: form.title.trim() || undefined,
      });
      setOpen(false);
      setForm((prev) => ({ ...prev, title: "" }));
      setToast({ open: true, message: "Report generated on the RiskTrix by Shieldersoft template.", severity: "success" });
      await load();
    } catch (err) {
      setToast({ open: true, message: err.response?.data?.detail || "Report generation failed.", severity: "error" });
    } finally {
      setGenerating(false);
    }
  };

  const previewReport = async (report) => {
    try {
      const res = await api.get(`/api/v1/cloud/reports/${report.id}/download`, {
        params: { fmt: "HTML" },
        responseType: "text",
      });
      setPreviewTitle(report.title);
      setPreview(typeof res.data === "string" ? res.data : "");
    } catch (err) {
      setToast({ open: true, message: err.response?.data?.detail || "Preview failed.", severity: "error" });
    }
  };

  return (
    <>
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {[
          { label: "Generated reports", value: stats.total, color: dashboardTheme.colors.primary },
          { label: "PDF exports", value: stats.pdf, color: "#283593" },
          { label: "CSV exports", value: stats.csv, color: dashboardTheme.colors.warning },
          { label: "JSON exports", value: stats.json, color: dashboardTheme.colors.info },
        ].map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
            <Card sx={{ borderLeft: `3px solid ${card.color}`, boxShadow: "none", border: "1px solid rgba(63,81,181,0.08)" }}>
              <CardContent sx={{ py: 1.25, px: 2, "&:last-child": { pb: 1.25 } }}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>{card.label}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: card.color, mt: 0.25 }}>{card.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <PageSection>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 2.5 }}>
          <Box>
            <Typography variant="overline" sx={{ color: dashboardTheme.colors.primary, letterSpacing: "0.08em", fontWeight: 700, fontFamily: '"Segoe UI", Roboto, Arial, sans-serif' }}>Catalog</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Choose a report type</Typography>
            <Typography variant="body2" color="text.secondary">
              Each export uses the official RiskTrix by Shieldersoft cover, KPIs, and register tables.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<DescriptionIcon />} onClick={() => openGenerate()} sx={{ bgcolor: dashboardTheme.colors.primary, alignSelf: "flex-start" }}>
            Generate report
          </Button>
        </Box>

        {grouped.map(({ group, items }) => (
          <Box key={group} sx={{ mb: 2.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>{group}</Typography>
            <Grid container spacing={1} sx={{ mt: 0.5 }}>
              {items.map((item) => {
                const selected = form.type === item.value;
                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={item.value}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: "100%",
                        borderColor: selected ? dashboardTheme.colors.primary : "rgba(63,81,181,0.10)",
                        backgroundColor: selected ? "rgba(63,81,181,0.03)" : "#fff",
                        boxShadow: "none",
                      }}
                    >
                      <CardActionArea onClick={() => openGenerate(item.value)} sx={{ height: "100%", alignItems: "stretch" }}>
                        <CardContent sx={{ minHeight: 96, py: 1.5, px: 1.75 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>{item.label}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.4 }}>{item.purpose}</Typography>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        ))}
      </PageSection>

      <PageSection>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Generated library</Typography>
            <Typography variant="body2" color="text.secondary">Preview or download any completed export.</Typography>
          </Box>
          <Tooltip title="Refresh">
            <IconButton onClick={load} size="small"><RefreshIcon /></IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
          <TextField
            size="small"
            placeholder="Search title or type"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 240, flex: 1 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Type</InputLabel>
            <Select label="Type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <MenuItem value="ALL">All types</MenuItem>
              {catalog.map((item) => (
                <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Format</InputLabel>
            <Select label="Format" value={formatFilter} onChange={(e) => setFormatFilter(e.target.value)}>
              <MenuItem value="ALL">All formats</MenuItem>
              <MenuItem value="PDF">PDF</MenuItem>
              <MenuItem value="CSV">CSV</MenuItem>
              <MenuItem value="JSON">JSON</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {["Title", "Type", "Format", "Status", "Created", ""].map((label) => (
                  <TableCell key={label} align={label === "" ? "right" : "left"} sx={{ fontWeight: 700, color: "text.secondary" }}>{label}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState
                      title="No matching reports"
                      message="Generate an executive, CSPM, or application export, or clear the filters."
                      action={<Button variant="outlined" onClick={() => openGenerate()}>Generate report</Button>}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredReports.map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{report.title}</TableCell>
                    <TableCell>{report.report_type || report.type}</TableCell>
                    <TableCell>
                      <Chip size="small" color={formatChipColor(report.format)} variant="outlined" label={report.format || "PDF"} />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" color="success" variant="outlined" label={report.status || "COMPLETED"} />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary" }}>
                      {report.created_at ? new Date(report.created_at).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Preview">
                        <IconButton size="small" onClick={() => previewReport(report)}><VisibilityIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton size="small" onClick={(e) => setDownloadMenu({ anchor: e.currentTarget, report })}>
                          <FileDownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </PageSection>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Generate RiskTrix report</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedType?.purpose} Audience-ready PDF uses the Shieldersoft cover and document control block.
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2, mt: 0.5 }}>
            <InputLabel>Report type</InputLabel>
            <Select label="Report type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {catalog.map((item) => (
                <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Alert severity="info" sx={{ mb: 2 }}>{selectedType?.audience || "Authorized security and GRC stakeholders"}</Alert>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Format</InputLabel>
            <Select label="Format" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
              <MenuItem value="PDF">PDF</MenuItem>
              <MenuItem value="CSV">CSV</MenuItem>
              <MenuItem value="JSON">JSON</MenuItem>
              <MenuItem value="HTML">HTML preview file</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            size="small"
            label="Custom title (optional)"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={selectedType?.label}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={generating} onClick={generate} sx={{ bgcolor: dashboardTheme.colors.primary }}>
            {generating ? "Generating..." : "Generate"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(preview)} onClose={() => setPreview("")} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{previewTitle || "Report preview"}</DialogTitle>
        <DialogContent sx={{ p: 0, height: "72vh", bgcolor: "#eef1f8" }}>
          <iframe title="RiskTrix report preview" srcDoc={preview} style={{ width: "100%", height: "100%", border: 0 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreview("")}>Close</Button>
        </DialogActions>
      </Dialog>

      <Menu anchorEl={downloadMenu.anchor} open={Boolean(downloadMenu.anchor)} onClose={() => setDownloadMenu({ anchor: null, report: null })}>
        {["PDF", "CSV", "JSON"].map((fmt) => (
          <MenuItem
            key={fmt}
            onClick={async () => {
              const report = downloadMenu.report;
              setDownloadMenu({ anchor: null, report: null });
              if (report) {
                try {
                  await downloadSecurityReport(report.id, report.title, fmt);
                  setToast({ open: true, message: `${fmt} download started.`, severity: "success" });
                } catch {
                  setToast({ open: true, message: `${fmt} download failed.`, severity: "error" });
                }
              }
            }}
          >
            Download {fmt}
          </MenuItem>
        ))}
      </Menu>
      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })}>{toast.message}</Alert>
      </Snackbar>
    </>
  );
};

export default SecurityReportsPanel;
