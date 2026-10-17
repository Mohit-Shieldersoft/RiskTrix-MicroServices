import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  Snackbar,
} from "@mui/material";
import api from "../../utils/api";
import PageShell, { PageSection, EmptyState } from "../../components/common/PageShell";
import NoCloudWorkspace from "../../components/common/NoCloudWorkspace";

const riskBucket = (score) => {
  const value = Number(score) || 0;
  if (value >= 8) return "CRITICAL";
  if (value >= 6) return "HIGH";
  if (value >= 4) return "MEDIUM";
  return "LOW";
};

const matchesType = (assetType, needles) => {
  const type = (assetType || "").toUpperCase();
  return needles.some((needle) => type.includes(needle));
};

const CloudInventory = ({ title, subtitle, assetTypes = [], tabs = [], extraStats }) => {
  const [assets, setAssets] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [tab, setTab] = useState(tabs[0]?.id || "all");
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState({ relationships: [], history: [] });
  const [notification, setNotification] = useState({ open: false, message: "", severity: "success" });

  const load = async () => {
    setLoading(true);
    try {
      const [assetRes, accountRes] = await Promise.all([
        api.get("/api/v1/cloud/assets"),
        api.get("/api/v1/cloud/accounts").catch(() => ({ data: [] })),
      ]);
      const rows = Array.isArray(assetRes.data) ? assetRes.data : [];
      setAssets(
        assetTypes.length
          ? rows.filter((item) => assetTypes.includes((item.asset_type || "").toUpperCase()) || matchesType(item.asset_type, assetTypes))
          : rows
      );
      setAccounts(Array.isArray(accountRes.data) ? accountRes.data : []);
    } catch {
      setAssets([]);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [assetTypes.join(",")]);

  const inspect = async (asset) => {
    setSelected(asset);
    try {
      const id = asset.id || asset.asset_id || asset.resource_id;
      const [rel, hist] = await Promise.all([
        api.get(`/api/v1/cloud/assets/${id}/relationships`).catch(() => ({ data: {} })),
        api.get(`/api/v1/cloud/assets/${id}/history`).catch(() => ({ data: [] })),
      ]);
      setDetail({
        relationships: rel.data?.relationships || [],
        history: Array.isArray(hist.data) ? hist.data : [],
      });
    } catch {
      setDetail({ relationships: [], history: [] });
    }
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      await api.post("/api/v1/cloud/scan");
      await api.post("/api/v1/cloud/assets/discover");
      setNotification({ open: true, message: "Posture scan and discovery completed.", severity: "success" });
      await load();
    } catch (err) {
      setNotification({
        open: true,
        message: err.response?.data?.detail || "Scan failed. Connect a cloud account first.",
        severity: "error",
      });
    } finally {
      setScanning(false);
    }
  };

  const filtered = useMemo(() => {
    const activeTab = tabs.find((item) => item.id === tab);
    return assets.filter((asset) => {
      if (activeTab?.needles?.length && !matchesType(asset.asset_type, activeTab.needles)) return false;
      if (provider !== "ALL" && (asset.provider || "").toUpperCase() !== provider) return false;
      if (riskFilter !== "ALL" && riskBucket(asset.risk_score) !== riskFilter) return false;
      if (search) {
        const query = search.toLowerCase();
        return [asset.name, asset.asset_name, asset.resource_id, asset.region]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      }
      return true;
    });
  }, [assets, tab, provider, riskFilter, search, tabs]);

  const stats = useMemo(() => {
    const critical = assets.filter((item) => riskBucket(item.risk_score) === "CRITICAL").length;
    const high = assets.filter((item) => riskBucket(item.risk_score) === "HIGH").length;
    const nonCompliant = assets.filter((item) => (item.compliance_status || "").toUpperCase() === "NON_COMPLIANT").length;
    const extra = extraStats ? extraStats(assets) : {};
    return { total: assets.length, critical, high, nonCompliant, ...extra };
  }, [assets, extraStats]);

  return (
    <PageShell
      title={title}
      subtitle={subtitle}
      actions={
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" onClick={load} disabled={!accounts.length}>Refresh</Button>
          <Button variant="contained" disabled={!accounts.length || scanning} onClick={handleScan} sx={{ bgcolor: "#3f51b5" }}>
            {scanning ? "Scanning..." : "Scan & Discover"}
          </Button>
        </Box>
      }
    >
      {accounts.length === 0 && !loading ? (
        <NoCloudWorkspace title={`No ${title.toLowerCase()} yet`} message="Connect a cloud account, then run discovery to populate this inventory." />
      ) : null}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {[
          { label: "Total resources", value: stats.total, color: "#3f51b5" },
          { label: "Critical risk", value: stats.critical, color: "#d32f2f" },
          { label: "High risk", value: stats.high, color: "#f57c00" },
          { label: stats.extraLabel || "Non-compliant", value: stats.extraValue ?? stats.nonCompliant, color: "#455a64" },
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

      {tabs.length > 0 && (
        <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
          {tabs.map((item) => (
            <Tab key={item.id} value={item.id} label={item.label} />
          ))}
        </Tabs>
      )}

      <PageSection>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={5}>
            <TextField size="small" fullWidth placeholder="Search name, resource ID, or region" value={search} onChange={(e) => setSearch(e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel>Provider</InputLabel>
              <Select value={provider} label="Provider" onChange={(e) => setProvider(e.target.value)}>
                <MenuItem value="ALL">All</MenuItem>
                <MenuItem value="AWS">AWS</MenuItem>
                <MenuItem value="AZURE">Azure</MenuItem>
                <MenuItem value="GCP">GCP</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl size="small" fullWidth>
              <InputLabel>Risk</InputLabel>
              <Select value={riskFilter} label="Risk" onChange={(e) => setRiskFilter(e.target.value)}>
                <MenuItem value="ALL">All</MenuItem>
                <MenuItem value="CRITICAL">Critical</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="LOW">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Provider</TableCell>
                  <TableCell>Region</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Risk</TableCell>
                  <TableCell align="right">Inspect</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <EmptyState message="No matching assets. Connect a cloud account and run Scan & Discover." />
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((asset) => (
                    <TableRow key={asset.id || asset.resource_id} hover>
                      <TableCell>{asset.name || asset.asset_name}</TableCell>
                      <TableCell>{asset.asset_type}</TableCell>
                      <TableCell>{asset.provider}</TableCell>
                      <TableCell>{asset.region}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={asset.compliance_status || "UNKNOWN"}
                          color={asset.compliance_status === "NON_COMPLIANT" ? "error" : "success"}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={`${riskBucket(asset.risk_score)} · ${asset.risk_score ?? 0}`} />
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => inspect(asset)}>Details</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </PageSection>

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="md" fullWidth>
        <DialogTitle>{selected?.name || selected?.asset_name || "Asset"}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {selected?.provider} · {selected?.asset_type} · {selected?.region} · {selected?.resource_id}
          </Typography>
          <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 700 }}>Relationships</Typography>
          {(detail.relationships || []).length === 0 ? (
            <Typography variant="body2" color="text.secondary">No relationship graph for this asset yet.</Typography>
          ) : (
            detail.relationships.map((item, idx) => (
              <Typography key={idx} variant="body2">{item.source || item.from} → {item.target || item.to} ({item.type || item.relationship})</Typography>
            ))
          )}
          <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 700 }}>History</Typography>
          {(detail.history || []).length === 0 ? (
            <Typography variant="body2" color="text.secondary">No change history recorded.</Typography>
          ) : (
            detail.history.map((item, idx) => (
              <Typography key={idx} variant="body2">{item.created_at || item.at} · {item.event || item.message}</Typography>
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={notification.open} autoHideDuration={4000} onClose={() => setNotification({ ...notification, open: false })}>
        <Alert severity={notification.severity}>{notification.message}</Alert>
      </Snackbar>
    </PageShell>
  );
};

const NETWORK_TYPES = ["NETWORK", "SECURITY_GROUP", "VPC", "SUBNET", "LOAD_BALANCER", "FIREWALL", "NSG", "VNET", "GATEWAY"];
const DATABASE_TYPES = ["DATABASE", "STORAGE", "S3", "BUCKET", "RDS", "SQL", "DYNAMODB", "REDIS", "COSMOS"];
const COMPUTE_TYPES = ["COMPUTE", "EC2", "INSTANCE", "VM", "LAMBDA", "FUNCTION", "APP_SERVICE"];

export const NetworkPage = () => (
  <CloudInventory
    title="Network Security"
    subtitle="Security groups, VPCs, subnets, and load balancers from connected cloud accounts."
    assetTypes={NETWORK_TYPES}
    tabs={[
      { id: "security_groups", label: "Security groups", needles: ["SECURITY_GROUP", "FIREWALL", "NSG"] },
      { id: "vpcs", label: "VPCs & subnets", needles: ["VPC", "SUBNET", "VNET", "NETWORK"] },
      { id: "gateways", label: "Load balancers", needles: ["LOAD_BALANCER", "GATEWAY", "CLOUDFRONT"] },
    ]}
    extraStats={(rows) => ({ extraLabel: "Public / open", extraValue: rows.filter((item) => item.is_public).length })}
  />
);

export const DatabasesPage = () => (
  <CloudInventory
    title="Databases & Storage"
    subtitle="RDS, SQL, object storage, and NoSQL posture from live discovery."
    assetTypes={DATABASE_TYPES}
    tabs={[
      { id: "all", label: "All" },
      { id: "relational", label: "Relational", needles: ["RDS", "SQL", "DATABASE"] },
      { id: "nosql", label: "NoSQL & object", needles: ["DYNAMODB", "REDIS", "S3", "BUCKET", "STORAGE", "COSMOS"] },
    ]}
    extraStats={(rows) => ({
      extraLabel: "Unencrypted",
      extraValue: rows.filter((item) => item.is_encrypted === false).length,
    })}
  />
);

export const ComputePage = () => (
  <CloudInventory
    title="Compute Instances"
    subtitle="VMs and serverless functions discovered from connected accounts."
    assetTypes={COMPUTE_TYPES}
    tabs={[
      { id: "all", label: "All" },
      { id: "vms", label: "VMs", needles: ["INSTANCE", "VM", "COMPUTE"] },
      { id: "serverless", label: "Serverless", needles: ["LAMBDA", "FUNCTION", "APP_SERVICE", "RUN"] },
    ]}
    extraStats={(rows) => ({ extraLabel: "Low risk", extraValue: rows.filter((item) => riskBucket(item.risk_score) === "LOW").length })}
  />
);

export default CloudInventory;
