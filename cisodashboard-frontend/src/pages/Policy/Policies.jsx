import React, { useEffect, useState } from "react";
import {
  Box, Typography, Button, Card, CardContent, Grid,
  TextField, InputAdornment, Chip, CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import policyApi from "../../utils/policyApi";
import PolicyTable from "../../components/Policy/PolicyTable";
import CreatePolicyModal from "../../components/Policy/CreatePolicyModal";
import Toast from "../../components/common/Toast";
import { useToast } from "../../components/common/useToast";
import { hasPermission } from "../../utils/permissions";

const Policies = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const { toast, showToast, closeToast } = useToast();
  const navigate = useNavigate();

  const fetchPolicies = async () => {
    try {
      const data = await policyApi.getPolicies();
      setPolicies(data || []);
    } catch (err) {
      console.error("Error fetching policies", err);
      showToast("Failed to load policies", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPolicies(); }, []);

  const filtered = policies.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const total = policies.length;
  const active = policies.filter((p) => p.status === "active").length;
  const draft = policies.filter((p) => p.status === "draft").length;

  const handleSave = (newPolicy) => {
    setPolicies((prev) => [...prev, newPolicy]);
  };

  const handleDelete = (id) => {
    setPolicies((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* HEADER */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Policy Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Define and manage device security policies
          </Typography>
        </Box>
        {hasPermission("policies", "create") && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
            Create Policy
          </Button>
        )}
      </Box>

      {/* SUMMARY CARDS */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Total Policies", value: total },
          { label: "Active", value: active, color: "success.main" },
          { label: "Draft", value: draft, color: "warning.main" },
        ].map((item, i) => (
          <Grid size={{ xs: 12, md: 4 }} key={i}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2">{item.label}</Typography>
                <Typography variant="h5" sx={{ color: item.color }}>{item.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* SEARCH + FILTER */}
      <Box sx={{ mb: 2, display: "flex", gap: 2, alignItems: "center" }}>
        <TextField
          placeholder="Search policies..."
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start"><SearchIcon /></InputAdornment>
            ),
          }}
        />
        {["all", "active", "draft", "archived"].map((s) => (
          <Chip
            key={s}
            label={s.charAt(0).toUpperCase() + s.slice(1)}
            color={s === "active" ? "success" : s === "draft" ? "warning" : "default"}
            variant={statusFilter === s ? "filled" : "outlined"}
            onClick={() => setStatusFilter(s)}
            clickable
          />
        ))}
      </Box>

      {/* TABLE */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: "center", mt: 5 }}>
          <Typography color="text.secondary">No policies found</Typography>
          {policies.length === 0 && hasPermission("policies", "create") && (
            <Button sx={{ mt: 2 }} variant="outlined" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
              Create your first policy
            </Button>
          )}
        </Box>
      ) : (
        <PolicyTable
          policies={filtered}
          onView={(p) => navigate(`/policies/${p.id}`)}
          onEdit={(p) => navigate(`/policies/${p.id}/edit`)}
          onDelete={handleDelete}
          showToast={showToast}
        />
      )}

      <CreatePolicyModal
        open={open}
        handleClose={() => setOpen(false)}
        handleSave={handleSave}
        showToast={showToast}
      />
      <Toast toast={toast} onClose={closeToast} />
    </Box>
  );
};

export default Policies;