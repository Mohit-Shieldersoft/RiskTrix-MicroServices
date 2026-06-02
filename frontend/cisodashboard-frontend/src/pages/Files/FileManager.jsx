import React, { useEffect, useState } from "react";
import {
  Box, Typography, Card, CardContent, Grid,
  Chip, CircularProgress, TextField, InputAdornment, Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import fileApi from "../../utils/fileApi";
import FileUploadZone from "../../components/Files/FileUploadZone";
import FileList from "../../components/Files/FileList";
import Toast from "../../components/common/Toast";
import { useToast } from "../../components/common/useToast";
import { hasPermission } from "../../utils/permissions";

const CONTEXTS = ["all", "ticket", "vulnerability", "poc", "asset", "audit", "general"];

const CONTEXT_COLORS = {
  ticket: "primary", vulnerability: "error", poc: "warning",
  asset: "info", audit: "secondary", general: "default",
};

const FileManager = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [contextFilter, setContextFilter] = useState("all");
  const [uploadContext, setUploadContext] = useState("general");
  const { toast, showToast, closeToast } = useToast();

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const data = await fileApi.listFiles(
        contextFilter !== "all" ? contextFilter : null
      );
      setFiles(data || []);
    } catch (err) {
      console.error("Error fetching files", err);
      showToast("Failed to load files", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFiles(); }, [contextFilter]);

  const filtered = files.filter((f) =>
    f.original_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const totalSize = files.reduce((sum, f) => sum + (f.size_bytes ?? f.size ?? 0), 0);
  const formatTotalSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const byContext = CONTEXTS.slice(1).reduce((acc, ctx) => {
    acc[ctx] = files.filter((f) => f.context === ctx).length;
    return acc;
  }, {});

  const handleUploadSuccess = (newFile) => {
    setFiles((prev) => [newFile, ...prev]);
  };

  const handleDelete = (fileId) => {
    setFiles((prev) => prev.filter((f) => f.file_id !== fileId));
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">File Manager</Typography>
          <Typography variant="body2" color="text.secondary">
            Upload and manage files across tickets, assets, vulnerabilities and more
          </Typography>
        </Box>
        <Button startIcon={<RefreshIcon />} variant="outlined" onClick={fetchFiles} size="small">
          Refresh
        </Button>
      </Box>

      {/* STATS */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="subtitle2" color="text.secondary">Total Files</Typography>
              <Typography variant="h4" fontWeight="bold">{files.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ py: 1.5 }}>
              <Typography variant="subtitle2" color="text.secondary">Total Size</Typography>
              <Typography variant="h4" fontWeight="bold">{formatTotalSize(totalSize)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        {Object.entries(byContext)
          .filter(([, count]) => count > 0)
          .slice(0, 2)
          .map(([ctx, count]) => (
            <Grid size={{ xs: 6, md: 3 }} key={ctx}>
              <Card>
                <CardContent sx={{ py: 1.5 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: "capitalize" }}>
                    {ctx} Files
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">{count}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>

      {/* UPLOAD SECTION */}
      {hasPermission("files", "upload") && (
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Upload File</Typography>
          {/* Context selector */}
          <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
            <Typography variant="body2" color="text.secondary" sx={{ alignSelf: "center", mr: 1 }}>
              Upload to:
            </Typography>
            {CONTEXTS.slice(1).map((ctx) => (
              <Chip
                key={ctx}
                label={ctx}
                color={CONTEXT_COLORS[ctx] || "default"}
                variant={uploadContext === ctx ? "filled" : "outlined"}
                onClick={() => setUploadContext(ctx)}
                clickable
                size="small"
                sx={{ textTransform: "capitalize" }}
              />
            ))}
          </Box>
          <FileUploadZone
            context={uploadContext}
            onUploadSuccess={handleUploadSuccess}
            showToast={showToast}
          />
        </CardContent>
      </Card>
      )}

      {/* FILE LIST */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>All Files</Typography>

          {/* Search + Context Filter */}
          <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              placeholder="Search files..."
              size="small"
              sx={{ flex: 1, minWidth: 200 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><SearchIcon /></InputAdornment>
                ),
              }}
            />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {CONTEXTS.map((ctx) => (
                <Chip
                  key={ctx}
                  label={ctx === "all" ? "All" : ctx}
                  color={ctx !== "all" ? CONTEXT_COLORS[ctx] : "default"}
                  variant={contextFilter === ctx ? "filled" : "outlined"}
                  onClick={() => setContextFilter(ctx)}
                  clickable
                  size="small"
                  sx={{ textTransform: "capitalize" }}
                />
              ))}
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <FileList
              files={filtered}
              onDelete={handleDelete}
              showToast={showToast}
            />
          )}
        </CardContent>
      </Card>

      <Toast toast={toast} onClose={closeToast} />
    </Box>
  );
};

export default FileManager;