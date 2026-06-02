import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Grid, IconButton,
  Typography, Box, Divider, Alert, CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BusinessIcon from '@mui/icons-material/Business';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dashboardTheme from '../../../theme/dashboardTheme';
import vendorApi from '../../../utils/vendorApi';

const initialFormData = {
  name: '',
  standard: '',
  description: '',
  category: 'security_vendor', // Default category
  contact_email: '',
  website: '',
  expiry_date: null
};

const AddVendorModal = ({ open, onClose, onAddVendor }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [standardOptions, setStandardOptions] = useState([]);
  
  // Category options that match the backend enum
  const categoryOptions = [
    { value: 'security_vendor', label: 'Security Vendor' },
    { value: 'cloud_service', label: 'Cloud Service Provider' },
    // Backend expects 'software_provider' (not 'software_vendor')
    { value: 'software_provider', label: 'Software Provider' },
    { value: 'hardware_vendor', label: 'Hardware Vendor' },
    { value: 'consulting', label: 'Consulting Services' },
    { value: 'data_processor', label: 'Data Processor' },
    { value: 'payment_processor', label: 'Payment Processor' },
    { value: 'other', label: 'Other' }
  ];

  // Load compliance standards from backend
  useEffect(() => {
    const loadStandards = async () => {
      try {
        const response = await vendorApi.getComplianceStandards();
        setStandardOptions(response.standards || []);
      } catch (error) {
        console.error('Failed to load compliance standards:', error);
        // Fallback to default standards
        setStandardOptions([
          { value: 'ISO27001', label: 'ISO 27001 - Information Security Management' },
          { value: 'PCI_DSS', label: 'PCI DSS - Payment Card Industry Data Security Standard' },
          { value: 'SOC2', label: 'SOC 2 - Service Organization Control 2' },
          { value: 'GDPR', label: 'GDPR - General Data Protection Regulation' }
        ]);
      }
    };
    
    if (open) {
      loadStandards();
    }
  }, [open]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors on change
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
    
    if (submitError) {
      setSubmitError('');
    }
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      expiry_date: date
    }));
    
    // Clear error when date is updated
    if (errors.expiry_date) {
      setErrors(prev => ({
        ...prev,
        expiry_date: null
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Vendor name is required';
    }
    
    if (!formData.standard) {
      newErrors.standard = 'Compliance standard is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (formData.contact_email && !/\S+@\S+\.\S+/.test(formData.contact_email)) {
      newErrors.contact_email = 'Please enter a valid email address';
    }
    
    if (formData.website && !/^https?:\/\//.test(formData.website) && formData.website.trim()) {
      // Auto-fix website URL
      setFormData(prev => ({
        ...prev,
        website: `https://${formData.website}`
      }));
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSubmitError('');

    try {
      // Format date to YYYY-MM-DD
      const formatDate = (date) => {
        if (!date) return null;
        const d = new Date(date);
        return d.toISOString().split('T')[0];
      };

      // Prepare vendor data for API
      const vendorData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        contact_email: formData.contact_email.trim() || null,
        website: formData.website.trim() || null,
        standard: formData.standard,
        certificate_expiry_date: formatDate(formData.expiry_date)
      };

      // Call backend API
      const newVendor = await vendorApi.createVendor(vendorData);
      
      // Call parent callback with the new vendor
      if (onAddVendor) {
        onAddVendor(newVendor);
      }
      
      handleClose();
      
    } catch (error) {
      console.error('Error creating vendor:', error);
      
      // Handle specific error types
      if (error.response) {
        const { status, data } = error.response;

        // If backend sent a simple string detail
        if (data && typeof data.detail === 'string') {
          setSubmitError(data.detail);
        }

        // 409 conflict
        else if (status === 409) {
          setSubmitError('A vendor with this name already exists');
        }

        // 422 validation errors (detailed list)
        else if (status === 422 && data && Array.isArray(data.detail)) {
          const backendErrors = {};
          data.detail.forEach(err => {
            // pydantic-style errors: { loc: [...], msg: '...', type: '...'}
            if (err.loc && err.loc.length > 0) {
              const key = err.loc[0] === 'body' && err.loc[1] ? err.loc[1] : err.loc[0];
              backendErrors[key] = err.msg || JSON.stringify(err);
            }
          });
          setErrors(backendErrors);
        }

        // Fallback message from backend
        else if (data && data.detail) {
          setSubmitError(JSON.stringify(data.detail));
        } else {
          setSubmitError('Failed to create vendor. Please try again.');
        }
      } else {
        setSubmitError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
    setSubmitError('');
    setLoading(false);
    onClose();
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
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
        <BusinessIcon sx={{ color: '#00796B' }} />
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
          Add New Vendor
        </Typography>
        <IconButton 
          edge="end" 
          color="inherit" 
          onClick={handleClose} 
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />
      
  <DialogContent sx={{ p: 3 }}>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}
        
        <Grid
          container
          spacing={2}
          wrap="wrap"
          sx={{
             
            flexWrap: 'wrap !important',
            flexDirection: { xs: 'column', sm: 'row !important' }
          }}
        >
           
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              flexBasis: { sm: '48% !important' },
              maxWidth: { sm: '48% !important' }
            }}
          >
            <TextField
              name="name"
              label="Vendor Name"
              value={formData.name}
              onChange={handleChange}
                fullWidth
                size="small"
              required
              error={!!errors.name}
              helperText={errors.name}
              disabled={loading}
            />
          </Grid>
          
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              flexBasis: { sm: '48% !important' },
              maxWidth: { sm: '48% !important' }
            }}
          >
            <TextField
              name="category"
              label="Category"
              value={formData.category}
              onChange={handleChange}
              select
              fullWidth
              size="small"
              required
              error={!!errors.category}
              helperText={errors.category}
              disabled={loading}
            >
              {categoryOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              flexBasis: { sm: '48% !important' },
              maxWidth: { sm: '48% !important' }
            }}
          >
            <TextField
              name="standard"
              label="Compliance Standard"
              value={formData.standard}
              onChange={handleChange}
              select
              fullWidth
              size="small"
              required
              error={!!errors.standard}
              helperText={errors.standard}
              disabled={loading}
            >
              {standardOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              flexBasis: { sm: '48% !important' },
              maxWidth: { sm: '48% !important' }
            }}
          >
            <TextField
              name="contact_email"
              label="Contact Email"
              type="email"
              value={formData.contact_email}
              onChange={handleChange}
              fullWidth
              size="small"
              error={!!errors.contact_email}
              helperText={errors.contact_email}
              disabled={loading}
            />
          </Grid>
          
           
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              flexBasis: { sm: '48% !important' },
              maxWidth: { sm: '48% !important' }
            }}
          >
            <TextField
              name="website"
              label="Website"
              value={formData.website}
              onChange={handleChange}
              fullWidth
              size="small"
              error={!!errors.website}
              helperText={errors.website}
              placeholder="https://example.com"
              disabled={loading}
            />
          </Grid>
          
          <Grid
            item
            xs={12}
            md={6}
            sx={{
              flexBasis: { sm: '48% !important' },
              maxWidth: { sm: '48% !important' }
            }}
          >
            <TextField
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              size="small"
              multiline
              rows={1}
              placeholder="Provide details about the vendor"
              disabled={loading}
            />
          </Grid>

          <Grid
            item
            xs={12}
            md={6}
            sx={{
              flexBasis: { sm: '48% !important' },
              maxWidth: { sm: '48% !important' }
            }}
          >
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Expiry Date"
                value={formData.expiry_date}
                onChange={handleDateChange}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                    error: !!errors.expiry_date,
                    helperText: errors.expiry_date,
                    disabled: loading
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
        
        <Box 
          sx={{ 
            mt: 3, 
            p: 2, 
            bgcolor: 'rgba(0, 121, 107, 0.08)', 
            borderRadius: 1,
            border: '1px solid rgba(0, 121, 107, 0.2)'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Adding a new vendor will create a compliance entry for the selected standard. 
            You'll be able to track compliance status, upload proofs of compliance, and manage controls.
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, bgcolor: '#f8f9fb' }}>
        <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
          {loading ? 'Creating vendor...' : 'Fill in vendor details and select compliance standard'}
        </Typography>
        <Button 
          onClick={handleClose} 
          color="inherit"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
          sx={{
            background: loading 
              ? 'rgba(0, 121, 107, 0.3)' 
              : 'linear-gradient(45deg, #00796B 30%, #009688 90%)',
            boxShadow: '0 3px 5px rgba(0, 121, 107, 0.3)'
          }}
        >
          {loading ? 'Creating...' : 'Add Vendor'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddVendorModal;