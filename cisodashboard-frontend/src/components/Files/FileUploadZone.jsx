import React, { useRef, useState } from "react";
import {
  Box, Typography, Button, LinearProgress, Chip,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import fileApi from "../../utils/fileApi";

const CONTEXT_COLORS = {
  ticket: "primary",
  vulnerability: "error",
  poc: "warning",
  asset: "info",
  audit: "secondary",
  general: "default",
};

const FileUploadZone = ({ context = "general", refId = null, onUploadSuccess, showToast }) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setProgress(30);
    try {
      const res = await fileApi.uploadFile(file, context, refId);
      setProgress(100);
      showToast(`"${file.name}" uploaded successfully`, "success");
      if (onUploadSuccess) onUploadSuccess(res);
    } catch (err) {
      showToast(err?.response?.data?.detail || "Upload failed", "error");
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  return (
    <Box>
      <Box
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        sx={{
          border: "2px dashed",
          borderColor: dragging ? "primary.main" : "grey.300",
          borderRadius: 3,
          p: 4,
          textAlign: "center",
          cursor: "pointer",
          backgroundColor: dragging ? "primary.50" : "grey.50",
          transition: "all 0.2s",
          "&:hover": { borderColor: "primary.main", backgroundColor: "rgba(25,118,210,0.04)" },
        }}
      >
        <CloudUploadIcon sx={{ fontSize: 48, color: "grey.400", mb: 1 }} />
        <Typography variant="body1" fontWeight={600}>
          Drag & drop a file here
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          or click to browse
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
          <Chip
            label={`Context: ${context}`}
            color={CONTEXT_COLORS[context] || "default"}
            size="small"
          />
          {refId && <Chip label={`Ref: ${refId}`} size="small" variant="outlined" />}
        </Box>
        <input
          ref={inputRef}
          type="file"
          hidden
          onChange={(e) => handleUpload(e.target.files[0])}
        />
      </Box>
      {uploading && (
        <Box sx={{ mt: 1 }}>
          <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 2 }} />
          <Typography variant="caption" color="text.secondary">Uploading...</Typography>
        </Box>
      )}
    </Box>
  );
};

export default FileUploadZone;