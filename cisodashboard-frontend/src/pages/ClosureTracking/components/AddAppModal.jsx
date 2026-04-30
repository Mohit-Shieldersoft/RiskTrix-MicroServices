import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, MenuItem, IconButton,
  Typography, Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import dashboardTheme from '../../../theme/dashboardTheme';

const initialAppData = {
  name: '',
  type: '',
  description: '',
  owner: '',
  vendor: '',
  vulnerabilities: []
};

const AddAppModal = ({ open, onClose, onAddApp }) => {
  const [appData, setAppData] = useState(initialAppData);
  const [vulnerabilityForm, setVulnerabilityForm] = useState({
    name: '',
    category: '',
    description: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAppData({
      ...appData,
      [name]: value
    });
  };

  const handleVulnerabilityInputChange = (e) => {
    const { name, value } = e.target;
    setVulnerabilityForm({
      ...vulnerabilityForm,
      [name]: value
    });
  };

  const addVulnerability = () => {
    // Basic validation
    if (!vulnerabilityForm.name || !vulnerabilityForm.category) {
      return;
    }

    setAppData({
      ...appData,
      vulnerabilities: [...appData.vulnerabilities, { ...vulnerabilityForm, id: Date.now() }]
    });

    // Reset the form
    setVulnerabilityForm({
      name: '',
      category: '',
      description: ''
    });
  };

  const removeVulnerability = (id) => {
    setAppData({
      ...appData,
      vulnerabilities: appData.vulnerabilities.filter(v => v.id !== id)
    });
  };

  const handleSubmit = () => {
    // Validate form
    if (!appData.name || !appData.type) {
      return; // Show validation errors in a real app
    }

    onAddApp(appData);
    setAppData(initialAppData); // Reset form after submission
  };

  const handleClose = () => {
    setAppData(initialAppData);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: dashboardTheme.borderRadius.lg,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          maxHeight: '65vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, bgcolor: '#f5f5f5' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          Add New Application
        </Typography>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 12,
            top: 12,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3, flex: '1 1 auto', overflowY: 'auto', maxHeight: '65vh' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <TextField
            label="Application Name"
            name="name"
            value={appData.name}
            onChange={handleInputChange}
            fullWidth
            required
            margin="dense"
          />

          <TextField
            select
            label="Application Type"
            name="type"
            value={appData.type}
            onChange={handleInputChange}
            fullWidth
            required
            margin="dense"
            SelectProps={{
              MenuProps: {
                PaperProps: {
                  style: {
                    maxHeight: 300, // 👈 control height here
                  },
                },
              },
            }}
          >
            <MenuItem value="web_application">Web Application</MenuItem>
            <MenuItem value="mobile_application">Mobile Application</MenuItem>
            <MenuItem value="desktop_application">Desktop Application</MenuItem>
            <MenuItem value="api_service">API Service</MenuItem>
            <MenuItem value="database">Database</MenuItem>
            <MenuItem value="infrastructure">Infrastructure</MenuItem>
            <MenuItem value="third_party">Third Party</MenuItem>
          </TextField>

          <TextField
            label="Owner"
            name="owner"
            value={appData.owner}
            onChange={handleInputChange}
            fullWidth
            margin="dense"
          />

          <TextField
            label="Vendor (if applicable)"
            name="vendor"
            value={appData.vendor}
            onChange={handleInputChange}
            fullWidth
            margin="dense"
          />

          <TextField
            label="Description"
            name="description"
            value={appData.description}
            onChange={handleInputChange}
            fullWidth
            multiline
            rows={2}
            margin="dense"
            sx={{ gridColumn: '1 / span 2' }}
          />
        </Box>

        <Box sx={{ mt: 4, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
            Add Vulnerabilities (Optional)
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: 2, alignItems: 'start' }}>
            <TextField
              label="Vulnerability Name"
              name="name"
              value={vulnerabilityForm.name}
              onChange={handleVulnerabilityInputChange}
              size="small"
            />

            <TextField
              select
              label="Category"
              name="category"
              value={vulnerabilityForm.category}
              onChange={handleVulnerabilityInputChange}
              size="small"
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    style: {
                      maxHeight: 180, // 👈 control height here
                    },
                  },
                },
              }}
            >
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </TextField>

            <TextField
              label="Description"
              name="description"
              value={vulnerabilityForm.description}
              onChange={handleVulnerabilityInputChange}
              size="small"
            />

            <Button
              variant="contained"
              color="secondary"
              onClick={addVulnerability}
              sx={{ height: '40px', whiteSpace: 'nowrap' }}
            >
              Add
            </Button>
          </Box>
        </Box>

        {appData.vulnerabilities.length > 0 && (
          <Box sx={{ mt: 3, border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Added Vulnerabilities:
            </Typography>

            {appData.vulnerabilities.map((vuln, index) => (
              <Box
                key={vuln.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1,
                  borderBottom: index < appData.vulnerabilities.length - 1 ? '1px solid #f0f0f0' : 'none',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' }
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {vuln.name}
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{
                        ml: 1,
                        bgcolor: getColorForCategory(vuln.category),
                        color: '#fff',
                        px: 1,
                        py: 0.5,
                        borderRadius: '4px'
                      }}
                    >
                      {vuln.category.toUpperCase()}
                    </Typography>
                  </Typography>
                  {vuln.description && (
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                      {vuln.description}
                    </Typography>
                  )}
                </Box>

                <IconButton
                  size="small"
                  onClick={() => removeVulnerability(vuln.id)}
                  sx={{ color: dashboardTheme.colors.error }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} variant="outlined">Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          sx={{
            px: 4,
            backgroundImage: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)',
          }}
        >
          Add Application
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Helper function to get color based on category
const getColorForCategory = (category) => {
  switch (category) {
    case 'critical': return dashboardTheme.colors.severity.critical;
    case 'high': return dashboardTheme.colors.severity.high;
    case 'medium': return dashboardTheme.colors.severity.medium;
    case 'low': return dashboardTheme.colors.severity.low;
    default: return dashboardTheme.colors.info;
  }
};

export default AddAppModal;