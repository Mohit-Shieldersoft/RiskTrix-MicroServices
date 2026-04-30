// // import React from 'react'

// // const AddExceptionModel = () => {
// //   return (
// //     <div>AddExceptionModel</div>
// //   )
// // }

// // export default AddExceptionModel





// import React, { useState } from 'react';
// import {
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
//   Grid,
//   Button,
//   MenuItem,
//   useMediaQuery,
//   useTheme,
//   Box,
//   Typography
// } from '@mui/material';

// const AddExceptionModel = ({ open, onClose, onSubmit }) => {
//   const theme = useTheme();
//   const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

//   const [formData, setFormData] = useState({
//     exceptionName: '',
//     category: '',
//     severity: '',
//     status: '',
//     startDate: '',
//     endDate: '',
//     comments: ''
//   });

//   const [errors, setErrors] = useState({});

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const validate = () => {
//     let newErrors = {};
//     if (!formData.exceptionName.trim()) newErrors.exceptionName = 'Exception Name is required';
//     if (!formData.category) newErrors.category = 'Category is required';
//     if (!formData.severity) newErrors.severity = 'Severity is required';
//     if (!formData.status) newErrors.status = 'Status is required';
//     if (!formData.startDate) newErrors.startDate = 'Start Date is required';
//     return newErrors;
//   };

//   const handleSubmit = () => {
//     const validationErrors = validate();
//     setErrors(validationErrors);

//     if (Object.keys(validationErrors).length === 0) {
//       onSubmit(formData);
//       onClose();
//       setFormData({
//         exceptionName: '',
//         category: '',
//         severity: '',
//         status: '',
//         startDate: '',
//         endDate: '',
//         comments: ''
//       });
//     }
//   };

//   return (
//     <Dialog
//       open={open}
//       onClose={onClose}
//       fullScreen={fullScreen}
//       maxWidth="md"
//       fullWidth
//       PaperProps={{
//         sx: {
//           borderRadius: 3,
//           p: { xs: 1, sm: 2 },
//         }
//       }}
//     >
//       <DialogTitle sx={{ pb: 1 }}>
//         <Typography variant="h6" fontWeight="bold" color="primary">
//           Add New Exception
//         </Typography>
//       </DialogTitle>

//       <DialogContent dividers>
//         <Box sx={{ mt: 1 }}>
//           <Grid container spacing={2}>
//             <Grid item xs={12} sm={6}>
//               <TextField
//                 label="Exception Name"
//                 name="exceptionName"
//                 fullWidth
//                 value={formData.exceptionName}
//                 onChange={handleChange}
//                 error={!!errors.exceptionName}
//                 helperText={errors.exceptionName}
//               />
//             </Grid>

//             <Grid item xs={12} sm={6}>
//               <TextField
//                 select
//                 label="Category"
//                 name="category"
//                 fullWidth
//                 value={formData.category}
//                 onChange={handleChange}
//                 error={!!errors.category}
//                 helperText={errors.category}
//               >
//                 <MenuItem value="Compliance">Compliance</MenuItem>
//                 <MenuItem value="Technical">Technical</MenuItem>
//                 <MenuItem value="Operational">Operational</MenuItem>
//                 <MenuItem value="Other">Other</MenuItem>
//               </TextField>
//             </Grid>

//             <Grid item xs={12} sm={6}>
//               <TextField
//                 select
//                 label="Severity"
//                 name="severity"
//                 fullWidth
//                 value={formData.severity}
//                 onChange={handleChange}
//                 error={!!errors.severity}
//                 helperText={errors.severity}
//               >
//                 <MenuItem value="Critical">Critical</MenuItem>
//                 <MenuItem value="High">High</MenuItem>
//                 <MenuItem value="Medium">Medium</MenuItem>
//                 <MenuItem value="Low">Low</MenuItem>
//               </TextField>
//             </Grid>

//             <Grid item xs={12} sm={6}>
//               <TextField
//                 select
//                 label="Status"
//                 name="status"
//                 fullWidth
//                 value={formData.status}
//                 onChange={handleChange}
//                 error={!!errors.status}
//                 helperText={errors.status}
//               >
//                 <MenuItem value="Active">Active</MenuItem>
//                 <MenuItem value="Expired">Expired</MenuItem>
//                 <MenuItem value="Pending">Pending</MenuItem>
//               </TextField>
//             </Grid>

//             <Grid item xs={12} sm={6}>
//               <TextField
//                 label="Start Date"
//                 name="startDate"
//                 type="date"
//                 fullWidth
//                 InputLabelProps={{ shrink: true }}
//                 value={formData.startDate}
//                 onChange={handleChange}
//                 error={!!errors.startDate}
//                 helperText={errors.startDate}
//               />
//             </Grid>

//             <Grid item xs={12} sm={6}>
//               <TextField
//                 label="End Date"
//                 name="endDate"
//                 type="date"
//                 fullWidth
//                 InputLabelProps={{ shrink: true }}
//                 value={formData.endDate}
//                 onChange={handleChange}
//               />
//             </Grid>

//             <Grid item xs={12}>
//               <TextField
//                 label="Comments"
//                 name="comments"
//                 multiline
//                 rows={3}
//                 fullWidth
//                 value={formData.comments}
//                 onChange={handleChange}
//               />
//             </Grid>
//           </Grid>
//         </Box>
//       </DialogContent>

//       <DialogActions sx={{ p: 2 }}>
//         <Button onClick={onClose} color="inherit" variant="outlined">
//           Cancel
//         </Button>
//         <Button onClick={handleSubmit} color="primary" variant="contained">
//           Save Exception
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// };

// export default AddExceptionModel;






import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Button,
  MenuItem,
  useMediaQuery,
  useTheme,
  Box,
  Typography,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import exceptionApi from '../../../utils/exceptionApi';

const AddExceptionModel = ({ open, onClose, onSubmit }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [formData, setFormData] = useState({
    exceptionName: '',
    category: '',
    severity: '',
    status: 'pending', // Default status
    startDate: '',
    endDate: '',
    comments: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [optionsData, setOptionsData] = useState({
    categories: [],
    severities: [],
    statuses: []
  });

  // Load form options from API
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const options = await exceptionApi.getExceptionOptions();
        setOptionsData({
          categories: options.categories || [
            { value: 'compliance', label: 'Compliance' },
            { value: 'technical', label: 'Technical' },
            { value: 'operational', label: 'Operational' },
            { value: 'other', label: 'Other' }
          ],
          severities: options.severities || [
            { value: 'critical', label: 'Critical' },
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low' }
          ],
          statuses: options.statuses || [
            { value: 'active', label: 'Active' },
            { value: 'expired', label: 'Expired' },
            { value: 'pending', label: 'Pending' }
          ]
        });
      } catch (error) {
        console.error('Failed to load form options:', error);
        // Use fallback options if API fails
        setOptionsData({
          categories: [
            { value: 'compliance', label: 'Compliance' },
            { value: 'technical', label: 'Technical' },
            { value: 'operational', label: 'Operational' },
            { value: 'other', label: 'Other' }
          ],
          severities: [
            { value: 'critical', label: 'Critical' },
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low' }
          ],
          statuses: [
            { value: 'active', label: 'Active' },
            { value: 'expired', label: 'Expired' },
            { value: 'pending', label: 'Pending' }
          ]
        });
      }
    };

    if (open) {
      loadOptions();
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
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

  const validate = () => {
    let newErrors = {};
    if (!formData.exceptionName.trim()) newErrors.exceptionName = 'Exception Name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.severity) newErrors.severity = 'Severity is required';
    if (!formData.status) newErrors.status = 'Status is required';
    if (!formData.startDate) newErrors.startDate = 'Start Date is required';
    
    // Validate end date is after start date
    if (formData.endDate && formData.startDate && formData.endDate <= formData.startDate) {
      newErrors.endDate = 'End date must be after start date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    setSubmitError('');

    try {
      // Prepare exception data for API
      const exceptionData = {
        exception_name: formData.exceptionName.trim(),
        category: formData.category.toLowerCase(),
        severity: formData.severity.toLowerCase(),
        status: formData.status.toLowerCase(),
        start_date: formData.startDate,
        end_date: formData.endDate || null,
        comments: formData.comments.trim() || null
      };

      // Call backend API
      const newException = await exceptionApi.createException(exceptionData);
      
      // Call parent callback with the new exception
      if (onSubmit) {
        onSubmit(newException);
      }
      
      handleClose();
      
    } catch (error) {
      console.error('Error creating exception:', error);
      
      // Handle specific error types
      if (error.response) {
        const { status, data } = error.response;
        if (status === 400 && data.detail) {
          if (data.detail.includes('already exists')) {
            setSubmitError('An exception with this name already exists');
          } else {
            setSubmitError(data.detail);
          }
        } else if (status === 422) {
          // Validation errors from backend
          if (data.detail && Array.isArray(data.detail)) {
            const backendErrors = {};
            data.detail.forEach(err => {
              if (err.loc && err.loc.length > 1) {
                const field = err.loc[1];
                // Map backend field names to frontend field names
                const fieldMap = {
                  'exception_name': 'exceptionName',
                  'start_date': 'startDate',
                  'end_date': 'endDate'
                };
                const frontendField = fieldMap[field] || field;
                backendErrors[frontendField] = err.msg;
              }
            });
            setErrors(backendErrors);
          } else {
            setSubmitError('Please check your input and try again');
          }
        } else {
          setSubmitError('Failed to create exception. Please try again.');
        }
      } else {
        setSubmitError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      exceptionName: '',
      category: '',
      severity: '',
      status: 'pending',
      startDate: '',
      endDate: '',
      comments: ''
    });
    setErrors({});
    setSubmitError('');
    setLoading(false);
    onClose();
  };

  // Form validation function
  const isFormValid = () => {
    return (
      formData.exceptionName?.trim() &&
      formData.category &&
      formData.severity &&
      formData.description?.trim() &&
      formData.startDate &&
      formData.endDate
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: { xs: 1, sm: 2 },
          boxShadow: '0px 8px 32px rgba(0,0,0,0.15)',
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h6" fontWeight="bold" color="primary">
          Add New Exception
        </Typography>
      </DialogTitle>

      <Divider />

      
      <DialogContent dividers>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}
        
        <Box
          sx={{
            mt: 1,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            justifyContent: 'space-between',
          }}
        >
          {/* Row 1 */}
          <Box sx={{ flexBasis: { xs: '100%', sm: '48%' } }}>
            <TextField
              label="Exception Name"
              name="exceptionName"
              fullWidth
              value={formData.exceptionName}
              onChange={handleChange}
              error={!!errors.exceptionName}
              helperText={errors.exceptionName}
              disabled={loading}
              required
            />
          </Box>

          <Box sx={{ flexBasis: { xs: '100%', sm: '48%' } }}>
            <TextField
              select
              label="Category"
              name="category"
              fullWidth
              value={formData.category}
              onChange={handleChange}
              error={!!errors.category}
              helperText={errors.category}
              disabled={loading}
              required
            >
              {optionsData.categories.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Row 2 */}
          <Box sx={{ flexBasis: { xs: '100%', sm: '48%' } }}>
            <TextField
              select
              label="Severity"
              name="severity"
              fullWidth
              value={formData.severity}
              onChange={handleChange}
              error={!!errors.severity}
              helperText={errors.severity}
              disabled={loading}
              required
            >
              {optionsData.severities.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box sx={{ flexBasis: { xs: '100%', sm: '48%' } }}>
            <TextField
              label="Description"
              name="description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={handleChange}
              error={!!errors.description}
              helperText={errors.description}
              disabled={loading}
              required
            />
          </Box>

          {/* Row 3 */}
          <Box sx={{ flexBasis: { xs: '100%', sm: '48%' } }}>
            <TextField
              label="Start Date"
              name="startDate"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.startDate}
              onChange={handleChange}
              error={!!errors.startDate}
              helperText={errors.startDate}
              disabled={loading}
              required
            />
          </Box>

          <Box sx={{ flexBasis: { xs: '100%', sm: '48%' } }}>
            <TextField
              label="End Date"
              name="endDate"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.endDate}
              onChange={handleChange}
              error={!!errors.endDate}
              helperText={errors.endDate}
              disabled={loading}
              required
            />
          </Box>

          {/* Comments (Full Width) */}
          <Box sx={{ flexBasis: '100%' }}>
            <TextField
              label="Comments"
              name="comments"
              multiline
              rows={3}
              fullWidth
              value={formData.comments}
              onChange={handleChange}
              error={!!errors.comments}
              helperText={errors.comments}
              disabled={loading}
            />
          </Box>
        </Box>
      </DialogContent>


      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          color="inherit"
          variant="outlined"
          disabled={loading}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={loading || !isFormValid()}
          startIcon={loading ? <CircularProgress size={20} /> : null}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
          }}
        >
          {loading ? 'Saving...' : 'Save Exception'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddExceptionModel;

