import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, IconButton, Divider,
  LinearProgress, CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import dashboardTheme from '../../../theme/dashboardTheme';

const AssetUploadModal = ({ open, onClose, onUpload }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [fileSelected, setFileSelected] = useState(false);
  const [fileName, setFileName] = useState('');
  
  const handleFileSelect = () => {
    // Simulate file selection
    setFileSelected(true);
    setFileName('eosl_assets.xlsx');
  };
  
  const handleUpload = () => {
    if (!fileSelected) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev + 10;
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setUploading(false);
          setUploadComplete(true);
          
          // Simulate API response
          setTimeout(() => {
            onUpload({ fileName, success: true });
          }, 500);
          
          return 100;
        }
        
        return newProgress;
      });
    }, 300);
  };
  
  const handleClose = () => {
    // Reset state
    setUploadProgress(0);
    setUploading(false);
    setUploadComplete(false);
    setFileSelected(false);
    setFileName('');
    onClose();
  };
  
  return (
    <Dialog
      open={open}
      onClose={!uploading ? handleClose : undefined}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          p: 2,
          bgcolor: '#f8f9fb',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <UploadFileIcon sx={{ color: '#1976D2' }} />
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
          Asset Upload
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
        <Box 
          sx={{ 
            textAlign: 'center',
            my: 2
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            Upload EOSL Asset Data
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please upload an Excel file with asset details including end-of-service dates.
          </Typography>
        </Box>
        
        <Box 
          sx={{ 
            border: '2px dashed rgba(25, 118, 210, 0.3)',
            borderRadius: 2,
            p: 3,
            my: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(25, 118, 210, 0.05)',
            cursor: !fileSelected && !uploading ? 'pointer' : 'default',
            transition: 'all 0.2s',
            '&:hover': !fileSelected && !uploading ? {
              bgcolor: 'rgba(25, 118, 210, 0.1)',
              borderColor: 'rgba(25, 118, 210, 0.5)',
            } : {}
          }}
          onClick={!fileSelected && !uploading ? handleFileSelect : undefined}
        >
          {uploadComplete ? (
            <>
              <CheckCircleIcon sx={{ fontSize: 48, color: '#4CAF50', mb: 2 }} />
              <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                Upload Complete!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {fileName} was successfully uploaded.
              </Typography>
            </>
          ) : fileSelected ? (
            <>
              <FileUploadIcon sx={{ fontSize: 48, color: '#1976D2', mb: 2 }} />
              <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                {fileName}
              </Typography>
              {uploading ? (
                <Box sx={{ width: '100%', mt: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={uploadProgress} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: 'rgba(25, 118, 210, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        background: 'linear-gradient(90deg, #1976D2 0%, #42A5F5 100%)'
                      }
                    }} 
                  />
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                    Uploading... {uploadProgress}%
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Ready to upload. Click the button below to start.
                </Typography>
              )}
            </>
          ) : (
            <>
              <CloudUploadIcon sx={{ fontSize: 48, color: '#1976D2', mb: 2 }} />
              <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                Drag & drop or click to select
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supported formats: .xlsx, .xls, .csv
              </Typography>
            </>
          )}
        </Box>
        
        <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(25, 118, 210, 0.05)', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Note: Make sure your file includes Owner, Asset, EOSL Type, Date and Remarks columns.
            The system will automatically parse and validate the data.
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, bgcolor: '#f8f9fb' }}>
        {!uploadComplete && (
          <Button 
            onClick={handleClose}
            color="inherit"
            disabled={uploading}
          >
            Cancel
          </Button>
        )}
        
        {fileSelected && !uploadComplete ? (
          <Button
            variant="contained"
            color="primary"
            disabled={uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : null}
            onClick={handleUpload}
            sx={{
              background: 'linear-gradient(45deg, #1976D2 30%, #42A5F5 90%)',
              boxShadow: '0 3px 5px rgba(25, 118, 210, 0.3)'
            }}
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </Button>
        ) : uploadComplete && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleClose}
            sx={{
              background: 'linear-gradient(45deg, #4CAF50 30%, #81C784 90%)',
              boxShadow: '0 3px 5px rgba(76, 175, 80, 0.3)'
            }}
          >
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AssetUploadModal;