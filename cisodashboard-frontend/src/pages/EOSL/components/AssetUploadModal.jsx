import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Divider,
  LinearProgress,
  CircularProgress,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { bulkUploadAssets } from "../../../utils/eoslApi";

/**
 * Parses a CSV/TSV text into asset objects.
 * Expected header row (case-insensitive):
 *   asset_name, owner, asset_type, eosl_type, eosl_date, remark
 */
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2)
    throw new Error("CSV must have a header row and at least one data row.");

  const sep = lines[0].includes("\t") ? "\t" : ",";
  const headers = lines[0]
    .split(sep)
    .map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));

  const requiredCols = [
    "asset_name",
    "owner",
    "asset_type",
    "eosl_type",
    "eosl_date",
  ];
  for (const col of requiredCols) {
    if (!headers.includes(col)) {
      throw new Error(
        `Missing required column: "${col}". Required: ${requiredCols.join(", ")}`,
      );
    }
  }

  return lines
    .slice(1)
    .filter((l) => l.trim())
    .map((line, idx) => {
      const values = line.split(sep).map((v) => v.trim().replace(/^"|"$/g, ""));
      const row = {};
      headers.forEach((h, i) => {
        row[h] = values[i] || "";
      });

      const type = (row.eosl_type || "").toUpperCase();
      if (!["EOS", "EOL"].includes(type)) {
        throw new Error(
          `Row ${idx + 2}: eosl_type must be EOS or EOL, got "${row.eosl_type}"`,
        );
      }
      if (!row.eosl_date || !/^\d{4}-\d{2}-\d{2}$/.test(row.eosl_date)) {
        throw new Error(
          `Row ${idx + 2}: eosl_date must be YYYY-MM-DD, got "${row.eosl_date}"`,
        );
      }

      return {
        asset_name: row.asset_name,
        owner: row.owner,
        asset_type: row.asset_type,
        eosl_type: type,
        eosl_date: row.eosl_date,
        remark: row.remark || "",
      };
    });
}

const AssetUploadModal = ({ open, onClose, onUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [file, setFile] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [parsedRows, setParsedRows] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setParseError(null);
    setParsedRows(null);
    setFile(selected);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rows = parseCSV(ev.target.result);
        setParsedRows(rows);
      } catch (err) {
        setParseError(err.message);
      }
    };
    reader.readAsText(selected);
  };

  const handleDropZoneClick = () => {
    if (!uploading && !uploadResult) fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!parsedRows || parsedRows.length === 0) return;
    setUploading(true);
    try {
      const result = await bulkUploadAssets(parsedRows);
      setUploadResult(result);
      onUpload(result);
    } catch (err) {
      setParseError(
        err?.response?.data?.detail || "Upload failed. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (uploading) return;
    setFile(null);
    setParsedRows(null);
    setParseError(null);
    setUploadResult(null);
    onClose();
  };

  const success = uploadResult?.success === true || uploadResult?.created > 0;

  return (
    <Dialog
      open={open}
      onClose={!uploading ? handleClose : undefined}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, boxShadow: "0 10px 40px rgba(0,0,0,0.1)" },
      }}
    >
      <DialogTitle
        sx={{
          p: 2,
          bgcolor: "#f8f9fb",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <UploadFileIcon sx={{ color: "#1976D2" }} />
        <Typography
          variant="h6"
          component="span"
          sx={{ fontWeight: "bold", flexGrow: 1 }}
        >
          Bulk Asset Upload
        </Typography>
        {!uploading && (
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Upload a CSV file with columns:{" "}
          <strong>
            asset_name, owner, asset_type, eosl_type (EOS/EOL), eosl_date
            (YYYY-MM-DD), remark
          </strong>
        </Typography>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.txt"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        {/* Drop zone */}
        <Box
          onClick={handleDropZoneClick}
          sx={{
            border: "2px dashed rgba(25,118,210,0.3)",
            borderRadius: 2,
            p: 3,
            my: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(25,118,210,0.04)",
            cursor:
              !file && !uploading && !uploadResult ? "pointer" : "default",
            transition: "all 0.2s",
            "&:hover":
              !file && !uploading && !uploadResult
                ? {
                    bgcolor: "rgba(25,118,210,0.08)",
                    borderColor: "rgba(25,118,210,0.5)",
                  }
                : {},
          }}
        >
          {uploadResult ? (
            <>
              <CheckCircleIcon
                sx={{
                  fontSize: 48,
                  color: success ? "#4CAF50" : "#FF9800",
                  mb: 1,
                }}
              />
              <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                {success ? "Upload Complete!" : "Partial Upload"}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {uploadResult.created} created, {uploadResult.failed} failed
              </Typography>
            </>
          ) : uploading ? (
            <>
              <CircularProgress sx={{ mb: 1 }} />
              <Typography variant="body2">
                Uploading {parsedRows?.length} assets...
              </Typography>
              <LinearProgress sx={{ width: "100%", mt: 1, borderRadius: 1 }} />
            </>
          ) : file ? (
            <>
              <FileUploadIcon sx={{ fontSize: 48, color: "#1976D2", mb: 1 }} />
              <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                {file.name}
              </Typography>
              {parsedRows && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {parsedRows.length} asset{parsedRows.length !== 1 ? "s" : ""}{" "}
                  ready to upload
                </Typography>
              )}
            </>
          ) : (
            <>
              <CloudUploadIcon sx={{ fontSize: 48, color: "#1976D2", mb: 1 }} />
              <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                Click to select a CSV file
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supported: .csv, .tsv, .txt
              </Typography>
            </>
          )}
        </Box>

        {parseError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {parseError}
          </Alert>
        )}

        {uploadResult?.errors?.length > 0 && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            {uploadResult.errors.map((e, i) => (
              <div key={i}>{e}</div>
            ))}
          </Alert>
        )}

        <Box
          sx={{
            mt: 2,
            p: 1.5,
            bgcolor: "rgba(25,118,210,0.05)",
            borderRadius: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Example row: My Server,John Smith,Server,EOS,2025-12-31,Needs
            replacement
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: "#f8f9fb" }}>
        {!uploadResult ? (
          <>
            <Button onClick={handleClose} color="inherit" disabled={uploading}>
              Cancel
            </Button>
            <Button
              onClick={
                file ? () => fileInputRef.current?.click() : handleDropZoneClick
              }
              variant="outlined"
              disabled={uploading}
            >
              {file ? "Change File" : "Select File"}
            </Button>
            {parsedRows && parsedRows.length > 0 && !parseError && (
              <Button
                onClick={handleUpload}
                variant="contained"
                disabled={uploading}
                startIcon={
                  uploading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <UploadFileIcon />
                  )
                }
                sx={{ bgcolor: "#1976D2", "&:hover": { bgcolor: "#1565C0" } }}
              >
                {uploading
                  ? "Uploading..."
                  : `Upload ${parsedRows.length} Asset${parsedRows.length !== 1 ? "s" : ""}`}
              </Button>
            )}
          </>
        ) : (
          <Button onClick={handleClose} variant="contained" color="primary">
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AssetUploadModal;
