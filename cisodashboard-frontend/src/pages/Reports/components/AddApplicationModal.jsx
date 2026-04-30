// import React, { useState } from 'react';
// import {
//   Dialog, DialogTitle, DialogContent, DialogActions,
//   Button, TextField, MenuItem, Grid, IconButton,
//   Typography, Box, Divider
// } from '@mui/material';
// import CloseIcon from '@mui/icons-material/Close';
// import AppIcon from '@mui/icons-material/Apps';
// import dashboardTheme from '../../../theme/dashboardTheme';

// const initialFormData = {
//   name: '',
//   category: '',
//   owner: '',
//   vendor: '',
//   description: ''
// };

// const AddApplicationModal = ({ open, onClose, onAddApplication }) => {
//   const [formData, setFormData] = useState(initialFormData);
//   const [errors, setErrors] = useState({});
  
//   // Categories options
//   const categories = [
//     'Web Application', 'Mobile App', 'API', 'Database', 'Microservice',
//     'Internal Tool', 'Customer Portal', 'Payment System', 'Administrative',
//     'Integration Service'
//   ];
  
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
    
//     // Clear error on change
//     if (errors[name]) {
//       setErrors(prev => ({
//         ...prev,
//         [name]: null
//       }));
//     }
//   };
  
//   const validateForm = () => {
//     const newErrors = {};
    
//     if (!formData.name.trim()) {
//       newErrors.name = 'Application name is required';
//     }
    
//     if (!formData.category) {
//       newErrors.category = 'Category is required';
//     }
    
//     if (!formData.owner.trim()) {
//       newErrors.owner = 'Owner name is required';
//     }
    
//     if (!formData.vendor.trim()) {
//       newErrors.vendor = 'Vendor name is required';
//     }
    
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };
  
//   const handleSubmit = () => {
//     if (validateForm()) {
//       onAddApplication({
//         ...formData,
//         id: `APP-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
//         vulnerabilities: []
//       });
      
//       handleClose();
//     }
//   };
  
//   const handleClose = () => {
//     setFormData(initialFormData);
//     setErrors({});
//     onClose();
//   };
  
//   return (
//     <Dialog 
//       open={open} 
//       onClose={handleClose}
//       maxWidth="md"
//       fullWidth
//       PaperProps={{
//         sx: {
//           borderRadius: 2,
//           boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
//         }
//       }}
//     >
//       <DialogTitle 
//         sx={{ 
//           p: 2,
//           bgcolor: '#f8f9fb',
//           display: 'flex',
//           alignItems: 'center',
//           gap: 1
//         }}
//       >
//         <AppIcon sx={{ color: '#00796B' }} />
//         <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
//           Add New Application
//         </Typography>
//         <IconButton 
//           edge="end" 
//           color="inherit" 
//           onClick={handleClose} 
//           aria-label="close"
//         >
//           <CloseIcon />
//         </IconButton>
//       </DialogTitle>
      
//       <Divider />
      
//       {/* <DialogContent sx={{ p: 3 }}>
//   <Grid
//     container
//     spacing={2}
//     wrap="wrap"             
//     sx={{ flexWrap: 'wrap !important' }}
//   >
     
//     <Grid item xs={12} md={6}>
//       <TextField
//         name="name"
//         label="Application Name"
//         value={formData.name}
//         onChange={handleChange}
//         fullWidth
//         required
//         error={!!errors.name}
//         helperText={errors.name}
//       />
//     </Grid>
//     <Grid item xs={12} md={6}>
//       <TextField
//         name="category"
//         label="Category"
//         select
//         value={formData.category}
//         onChange={handleChange}
//         fullWidth
//         required
//         error={!!errors.category}
//         helperText={errors.category}
//       >
//         {categories.map(opt => (
//           <MenuItem key={opt} value={opt}>{opt}</MenuItem>
//         ))}
//       </TextField>
//     </Grid>

     
//     <Grid item xs={12} md={6}>
//       <TextField
//         name="owner"
//         label="Owner"
//         value={formData.owner}
//         onChange={handleChange}
//         fullWidth
//         required
//         error={!!errors.owner}
//         helperText={errors.owner}
//       />
//     </Grid>
//     <Grid item xs={12} md={6}>
//       <TextField
//         name="vendor"
//         label="Vendor"
//         value={formData.vendor}
//         onChange={handleChange}
//         fullWidth
//         required
//         error={!!errors.vendor}
//         helperText={errors.vendor}
//       />
//     </Grid>

     
//     <Grid item xs={12}>
//       <TextField
//         name="description"
//         label="Description"
//         value={formData.description}
//         onChange={handleChange}
//         fullWidth
//         multiline
//         rows={4}
//         placeholder="Provide a description of the application"
//       />
//     </Grid>
//   </Grid>

//   <Box
//     sx={{
//       mt: 3,
//       p: 2,
//       bgcolor: 'rgba(0, 121, 107, 0.08)',
//       borderRadius: 1,
//       border: '1px solid rgba(0, 121, 107, 0.2)'
//     }}
//   >
//     <Typography variant="body2" color="text.secondary">
//       Adding an application will allow you to track vulnerabilities and generate reports.
//       You can add vulnerabilities to this application once it's created.
//     </Typography>
//   </Box>
// </DialogContent> */}


// {/* <DialogContent sx={{ p: 3 }}>
//   <Grid
//     container
//     spacing={2}
//     sx={{
//       flexWrap: 'wrap',
//       '& .MuiGrid-item': {
//         display: 'flex',
//         alignItems: 'stretch',
//       },
//     }}
//   >
    
//     <Grid item xs={12} sm={6}>
//       <TextField
//         name="name"
//         label="Application Name"
//         value={formData.name}
//         onChange={handleChange}
//         fullWidth
//         required
//         error={!!errors.name}
//         helperText={errors.name}
//       />
//     </Grid>

//     <Grid item xs={12} sm={6}>
//       <TextField
//         name="category"
//         label="Category"
//         select
//         value={formData.category}
//         onChange={handleChange}
//         fullWidth
//         required
//         error={!!errors.category}
//         helperText={errors.category}
//       >
//         {categories.map(opt => (
//           <MenuItem key={opt} value={opt}>
//             {opt}
//           </MenuItem>
//         ))}
//       </TextField>
//     </Grid>

     
//     <Grid item xs={12} sm={6}>
//       <TextField
//         name="owner"
//         label="Owner"
//         value={formData.owner}
//         onChange={handleChange}
//         fullWidth
//         required
//         error={!!errors.owner}
//         helperText={errors.owner}
//       />
//     </Grid>

//     <Grid item xs={12} sm={6}>
//       <TextField
//         name="vendor"
//         label="Vendor"
//         value={formData.vendor}
//         onChange={handleChange}
//         fullWidth
//         required
//         error={!!errors.vendor}
//         helperText={errors.vendor}
//       />
//     </Grid>

     
//     <Grid item xs={12}>
//       <TextField
//         name="description"
//         label="Description"
//         value={formData.description}
//         onChange={handleChange}
//         fullWidth
//         multiline
//         rows={4}
//         placeholder="Provide a description of the application"
//       />
//     </Grid>
//   </Grid>

   
//   <Box
//     sx={{
//       mt: 3,
//       p: 2,
//       bgcolor: 'rgba(0, 121, 107, 0.08)',
//       borderRadius: 1,
//       border: '1px solid rgba(0, 121, 107, 0.2)',
//     }}
//   >
//     <Typography variant="body2" color="text.secondary">
//       Adding an application will allow you to track vulnerabilities and generate reports.
//       You can add vulnerabilities to this application once it's created.
//     </Typography>
//   </Box>
// </DialogContent> */}


 

// <DialogContent
//   sx={{
//     p: { xs: 2.5, md: 3 },              // nice even padding
//     display: 'flex',
//     flexDirection: 'column',
//     gap: 2.5, 
//     width: 'full',                          // consistent vertical spacing between rows
//     bgcolor: '#fafafa',                 // subtle background contrast
//   }}
// >
//   {/* === Row 1: Application Name + Category === */}
//   <Grid container spacing={40} xs={12} sm={6}>
//     <Grid item xs={12} sm={6}>
//       <TextField
//         name="name"
//         label="Application Name"
//         value={formData.name}
//         onChange={handleChange}
//         fullWidth
//         required
//         error={!!errors.name}
//         helperText={errors.name}
//       />
//     </Grid>

//     <Grid item xs={12} sm={6}>
//       <TextField
//         name="category"
//         label="Category"
//         select
//         value={formData.category}
//         onChange={handleChange}
//         fullWidth
//         required
//         error={!!errors.category}
//         helperText={errors.category}
//       >
//         {categories.map(opt => (
//           <MenuItem key={opt} value={opt}>
//             {opt}
//           </MenuItem>
//         ))}
//       </TextField>
//     </Grid>
//   </Grid>

//   {/* === Row 2: Owner + Vendor === */}
//   <Grid container spacing={40} xs={12} sm={6}>
//     <Grid item >
//       <TextField
//         name="owner"
//         label="Owner"
//         value={formData.owner}
//         onChange={handleChange}
//         fullWidth
//         required
//         error={!!errors.owner}
//         helperText={errors.owner}
//       />
//     </Grid>

//     <Grid item xs={12} sm={6}>
//       <TextField
//         name="vendor"
//         label="Vendor"
//         value={formData.vendor}
//         onChange={handleChange}
//         fullWidth
//         required
//         error={!!errors.vendor}
//         helperText={errors.vendor}
//       />
//     </Grid>
//   </Grid>

//   {/* === Row 3: Description (full width) === */}
//   <Grid container spacing={2} xs={12} sm={6}>
//     <Grid item xs={12}>
//       <TextField
//         name="description"
//         label="Description"
//         value={formData.description}
//         onChange={handleChange}
//         fullWidth
//         multiline
//         rows={4}
//         placeholder="Provide a description of the application"
//       />
//     </Grid>
//   </Grid>

//   {/* === Info Box === */}
//   <Box
//     sx={{
//       mt: 1.5,
//       p: 2,
//       bgcolor: 'rgba(0, 121, 107, 0.06)',
//       borderRadius: 2,
//       border: '1px solid rgba(0, 121, 107, 0.2)',
//       transition: 'background-color 0.3s ease',
//       '&:hover': {
//         bgcolor: 'rgba(0, 121, 107, 0.1)',
//       },
//     }}
//   >
//     <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
//       Adding an application will allow you to track vulnerabilities and generate reports.
//       You can add vulnerabilities to this application once it's created.
//     </Typography>
//   </Box>
// </DialogContent>


// <DialogContent
//   sx={{
//     p: { xs: 2.5, md: 3 },
//     display: 'flex',
//     flexDirection: 'column',
//     gap: 3,
//     width: '100%',
//     bgcolor: '#fafafa',
//   }}
// >
//   {/* === Row 1: Application Name + Category === */}
//   <Grid
//     container
//     spacing={2}
//     justifyContent="space-between"
//     alignItems="center"
//   >
//     <Grid item xs={12} sm={5.8}>
//       <TextField
//         name="name"
//         label="Application Name"
//         value={formData.name}
//         onChange={handleChange}
//         fullWidth
//         required
//         error={!!errors.name}
//         helperText={errors.name}
//       />
//     </Grid>

//     <Grid item xs={12} sm={5.8}>
//       <TextField
//         name="category"
//         label="Category"
//         select
//         value={formData.category}
//         onChange={handleChange}
//         fullWidth
//         required
//         error={!!errors.category}
//         helperText={errors.category}
//       >
//         {categories.map(opt => (
//           <MenuItem key={opt} value={opt}>
//             {opt}
//           </MenuItem>
//         ))}
//       </TextField>
//     </Grid>
//   </Grid>

//   {/* === Row 2: Owner + Vendor === */}
//   <Grid
//     container
//     spacing={2}
//     justifyContent="space-between"
//     alignItems="center"
//   >
//     <Grid item xs={12} sm={5.8}>
//       <TextField
//         name="owner"
//         label="Owner"
//         value={formData.owner}
//         onChange={handleChange}
//         fullWidth
//         required
//         error={!!errors.owner}
//         helperText={errors.owner}
//       />
//     </Grid>

//     <Grid item xs={12} sm={5.8}>
//       <TextField
//         name="vendor"
//         label="Vendor"
//         value={formData.vendor}
//         onChange={handleChange}
//         fullWidth
//         required
//         error={!!errors.vendor}
//         helperText={errors.vendor}
//       />
//     </Grid>
//   </Grid>

//   {/* === Row 3: Description (full width) === */}
//   <Grid
//     container
//     justifyContent="center"
//     alignItems="center"
//   >
//     <Grid item xs={12} sm={11.6}>
//       <TextField
//         name="description"
//         label="Description"
//         value={formData.description}
//         onChange={handleChange}
//         fullWidth
//         multiline
//         rows={4}
//         placeholder="Provide a description of the application"
//       />
//     </Grid>
//   </Grid>

//   {/* === Info Box === */}
//   <Box
//     sx={{
//       mt: 2,
//       p: 2,
//       bgcolor: 'rgba(0, 121, 107, 0.06)',
//       borderRadius: 2,
//       border: '1px solid rgba(0, 121, 107, 0.2)',
//       transition: 'background-color 0.3s ease',
//       width: { xs: '100%', sm: '90%' },
//       mx: 'auto',
//       '&:hover': {
//         bgcolor: 'rgba(0, 121, 107, 0.1)',
//       },
//     }}
//   >
//     <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
//       Adding an application will allow you to track vulnerabilities and generate reports.
//       You can add vulnerabilities to this application once it's created.
//     </Typography>
//   </Box>
// </DialogContent>





      
//       <DialogActions sx={{ p: 2, bgcolor: '#f8f9fb' }}>
//         <Button onClick={handleClose} color="inherit">
//           Cancel
//         </Button>
//         <Button 
//           onClick={handleSubmit} 
//           variant="contained"
//           sx={{
//             background: 'linear-gradient(45deg, #00796B 30%, #009688 90%)',
//             boxShadow: '0 3px 5px rgba(0, 121, 107, 0.3)'
//           }}
//         >
//           Add Application
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// };

// export default AddApplicationModal;





// AddApplicationModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, IconButton,
  Typography, Box, Divider, CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AppIcon from '@mui/icons-material/Apps';
import applicationApi from '../../../utils/applicationApi';
import api from '../../../utils/api';

const initialFormData = {
  name: '',
  category: '',
  owner: '',
  vendor: '',
  description: '',
  version: '1.0',
  url: '',
  risk_level: 'medium'
};

// Map to backend ApplicationType enum values
const categories = [
  { label: 'Web Application', value: 'web_application' },
  { label: 'Mobile Application', value: 'mobile_application' },
  { label: 'Desktop Application', value: 'desktop_application' },
  { label: 'API Service', value: 'api_service' },
  { label: 'Database', value: 'database' },
  { label: 'Infrastructure', value: 'infrastructure' },
  { label: 'Third Party', value: 'third_party' }
];

const riskLevels = [
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' }
];

const AddApplicationModal = ({ open, onClose, onAddApplication }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);

  // Fetch vendors when modal opens
  useEffect(() => {
    if (open) {
      fetchVendors();
    }
  }, [open]);

  const fetchVendors = async () => {
    setLoadingVendors(true);
    try {
      // Use audit endpoint to get all vendors with a high limit
      const response = await api.get('/api/v1/audit/top-vendors', { 
        params: { limit: 1000 } // High limit to get all vendors
      });
      
      // Extract vendor names from the audit response
      const vendorList = response.data.vendors || [];
      
      // Transform audit vendor data to simple vendor list
      const transformedVendors = vendorList.map(v => ({
        id: v.name, // Use name as id since audit endpoint doesn't provide id
        name: v.name
      }));
      
      setVendors(transformedVendors);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setServerError('Failed to load vendors');
    } finally {
      setLoadingVendors(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Application name is required';
    if (!formData.category) newErrors.category = 'Application type is required';
    // Owner and vendor are optional in the backend schema

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log('=== handleSubmit called ===');
    console.log('Form data:', formData);
    
    setServerError(null);
    if (!validateForm()) {
      console.log('Validation failed');
      return;
    }
    
    setLoading(true);
    console.log('Starting API call...');
    
    try {
      // Map frontend fields to backend schema - IMPORTANT: use 'type' not 'application_type'
      const payload = {
        name: formData.name,
        type: formData.category, // Backend expects 'type' field with ApplicationTypeEnum value
        description: formData.description || '',
        owner: formData.owner || null,
        vendor: formData.vendor || null,
        version: formData.version || '1.0',
        url: formData.url || '',
        risk_level: formData.risk_level || 'medium'
      };
      
      console.log('Payload to send:', payload);

      const created = await applicationApi.createApplication(payload);
      console.log('API response:', created);
      
      // pass created resource back to parent
      if (onAddApplication) onAddApplication(created);
      handleClose();
    } catch (err) {
      console.error('API error:', err);
      // handle pydantic style errors or plain messages
      if (err && err.detail) {
        if (Array.isArray(err.detail)) {
          // Pydantic validation errors
          const messages = err.detail.map(e => `${e.loc.join('.')}: ${e.msg}`).join('; ');
          setServerError(messages);
        } else {
          setServerError(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail));
        }
      } else if (err && err.message) {
        setServerError(err.message);
      } else {
        setServerError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setErrors({});
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
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
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
        <AppIcon sx={{ color: '#00796B' }} />
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
          Add New Application
        </Typography>
        <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: { xs: 2, md: 3 ,flex: '1 1 auto', overflowY: 'auto', maxHeight: '60vh'} }}>
        {serverError && (
          <Box sx={{ mb: 2, p: 2, bgcolor: '#ffebee', borderRadius: 1, border: '1px solid #ef5350' }}>
            <Typography variant="body2" color="error">{serverError}</Typography>
          </Box>
        )}
        
        {/* Use CSS Grid — reliable two columns on sm+ and single column on xs */}
        <Box
          component="form"
          noValidate
          autoComplete="off"
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,                 // spacing between fields
            alignItems: 'start'
          }}
        >
          {/* Name (col 1) */}
          <TextField
            name="name"
            label="Application Name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
            error={!!errors.name}
            helperText={errors.name}
            disabled={loading}
            sx={{ width: '100%' }}
          />

          {/* Category (col 2) */}
          <TextField
            name="category"
            label="Application Type"
            select
            value={formData.category}
            onChange={handleChange}
            fullWidth
            required
            error={!!errors.category}
            helperText={errors.category}
            disabled={loading}
            sx={{ width: '100%' }}
          >
            {categories.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
          </TextField>

          {/* Owner (col 1, row 2) */}
          <TextField
            name="owner"
            label="Owner"
            value={formData.owner}
            onChange={handleChange}
            fullWidth
            error={!!errors.owner}
            helperText={errors.owner}
            disabled={loading}
            placeholder="Enter owner name"
            sx={{ width: '100%' }}
          />

          {/* Vendor (col 2, row 2) - Dropdown from database */}
          <TextField
            name="vendor"
            label="Vendor"
            select
            value={formData.vendor}
            onChange={handleChange}
            fullWidth
            error={!!errors.vendor}
            helperText={errors.vendor || (loadingVendors ? 'Loading vendors...' : '')}
            disabled={loading || loadingVendors}
            sx={{ width: '100%' }}
          >
            <MenuItem value="">
              <em>Select a vendor</em>
            </MenuItem>
            {vendors.map(vendor => (
              <MenuItem key={vendor.id} value={vendor.name}>
                {vendor.name}
              </MenuItem>
            ))}
          </TextField>

          {/* Version (col 1, row 3) */}
          <TextField
            name="version"
            label="Version"
            value={formData.version}
            onChange={handleChange}
            fullWidth
            disabled={loading}
            placeholder="e.g., 1.0.0"
            sx={{ width: '100%' }}
          />

          {/* Risk Level (col 2, row 3) */}
          <TextField
            name="risk_level"
            label="Risk Level"
            select
            value={formData.risk_level}
            onChange={handleChange}
            fullWidth
            disabled={loading}
            sx={{ width: '100%' }}
          >
            {riskLevels.map(level => (
              <MenuItem key={level.value} value={level.value}>{level.label}</MenuItem>
            ))}
          </TextField>

          {/* URL (spanning both columns) */}
          <TextField
            name="url"
            label="Application URL"
            value={formData.url}
            onChange={handleChange}
            fullWidth
            disabled={loading}
            placeholder="https://example.com"
            sx={{ gridColumn: '1 / -1' }}
          />

          {/* Description spanning both columns */}
          <TextField
            name="description"
            label="Description"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            multiline
            rows={4}
            disabled={loading}
            placeholder="Provide a description of the application"
            sx={{ gridColumn: '1 / -1' }}
          />

          {/* Info box spanning both columns (centered width on larger screens) */}
          <Box
            sx={{
              gridColumn: '1 / -1',
              mt: 0.5,
              p: 2,
              bgcolor: 'rgba(0, 121, 107, 0.06)',
              borderRadius: 1.5,
              border: '1px solid rgba(0, 121, 107, 0.16)',
              width: { xs: '100%', sm: '95%' },
              mx: 'auto'
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
              Adding an application will allow you to track vulnerabilities and generate reports.
              You can add vulnerabilities to this application once it's created.
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#f8f9fb' }}>
        <Box sx={{ flexGrow: 1 }}>
          {/* left area can be used for small note if desired */}
        </Box>

        <Button onClick={handleClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || loadingVendors}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{
            background: 'linear-gradient(45deg, #00796B 30%, #009688 90%)',
            boxShadow: '0 3px 5px rgba(0, 121, 107, 0.25)',
            minWidth: 140
          }}
        >
          {loading ? 'Adding...' : 'Add Application'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddApplicationModal;
