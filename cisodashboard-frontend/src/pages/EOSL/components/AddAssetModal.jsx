// import React, { useState } from 'react';
// import {
//   Dialog, DialogTitle, DialogContent, DialogActions,
//   Button, TextField, MenuItem, Grid, IconButton,
//   Typography, Box, Divider, FormControl, InputLabel,
//   Select
// } from '@mui/material';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import CloseIcon from '@mui/icons-material/Close';
// import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
// import dashboardTheme from '../../../theme/dashboardTheme';

// const initialFormData = {
//   name: '',
//   owner: '',
//   type: '',
//   eoslType: '',
//   date: null,
//   remark: ''
// };

// const AddAssetModal = ({ open, onClose, onAddAsset }) => {
//   const [formData, setFormData] = useState(initialFormData);
//   const [errors, setErrors] = useState({});
  
//   // Asset types
//   const assetTypes = [
//     'Server', 'Network Switch', 'Database', 'Firewall',
//     'Router', 'Storage Array', 'Load Balancer', 'Workstation',
//     'Virtual Machine', 'Container Host', 'VPN Gateway', 'Backup System'
//   ];
  
//   // Owner names
//   const owners = [
//     'John Smith', 'Emily Johnson', 'Michael Wilson', 
//     'Sarah Brown', 'David Miller', 'Jennifer Davis',
//     'Robert Taylor', 'Jessica Anderson', 'Thomas Martinez'
//   ];
  
//   // EOSL types
//   const eoslTypes = ['EOS', 'EOL'];
  
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
  
//   const handleDateChange = (newValue) => {
//     setFormData(prev => ({
//       ...prev,
//       date: newValue
//     }));
    
//     // Clear error on change
//     if (errors.date) {
//       setErrors(prev => ({
//         ...prev,
//         date: null
//       }));
//     }
//   };
  
//   const validateForm = () => {
//     const newErrors = {};
    
//     if (!formData.name.trim()) {
//       newErrors.name = 'Asset name is required';
//     }
    
//     if (!formData.owner) {
//       newErrors.owner = 'Owner is required';
//     }
    
//     if (!formData.type) {
//       newErrors.type = 'Asset type is required';
//     }
    
//     if (!formData.eoslType) {
//       newErrors.eoslType = 'EOSL type is required';
//     }
    
//     if (!formData.date) {
//       newErrors.date = 'Date is required';
//     }
    
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };
  
//   const handleSubmit = () => {
//     if (validateForm()) {
//       onAddAsset({
//         ...formData,
//         id: `ASSET-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
//         dateFormatted: formData.date ? formData.date.toISOString().split('T')[0] : '',
//         createdBy: 'SarthakDeb',
//         createdAt: '2025-04-18 09:36:24'
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
//         <AddCircleOutlineIcon sx={{ color: '#1976D2' }} />
//         <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
//           Add New Asset
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
      
//       <DialogContent sx={{ p: 3 }}>
//         <Grid container spacing={3}>
//           <Grid item xs={12} sm={6}>
//             <TextField
//               name="name"
//               label="Asset Name"
//               value={formData.name}
//               onChange={handleChange}
//               fullWidth
//               required
//               error={!!errors.name}
//               helperText={errors.name}
//               placeholder="Enter asset name"
//             />
//           </Grid>
          
//           <Grid item xs={12} sm={6}>
//             <FormControl fullWidth required error={!!errors.owner}>
//               <InputLabel id="owner-label">Owner</InputLabel>
//               <Select
//                 labelId="owner-label"
//                 name="owner"
//                 value={formData.owner}
//                 label="Owner"
//                 onChange={handleChange}
//               >
//                 {owners.map(owner => (
//                   <MenuItem key={owner} value={owner}>
//                     {owner}
//                   </MenuItem>
//                 ))}
//               </Select>
//               {errors.owner && (
//                 <Typography variant="caption" color="error">
//                   {errors.owner}
//                 </Typography>
//               )}
//             </FormControl>
//           </Grid>
          
//           <Grid item xs={12} sm={6}>
//             <FormControl fullWidth required error={!!errors.type}>
//               <InputLabel id="type-label">Asset Type</InputLabel>
//               <Select
//                 labelId="type-label"
//                 name="type"
//                 value={formData.type}
//                 label="Asset Type"
//                 onChange={handleChange}
//               >
//                 {assetTypes.map(type => (
//                   <MenuItem key={type} value={type}>
//                     {type}
//                   </MenuItem>
//                 ))}
//               </Select>
//               {errors.type && (
//                 <Typography variant="caption" color="error">
//                   {errors.type}
//                 </Typography>
//               )}
//             </FormControl>
//           </Grid>
          
//           <Grid item xs={12} sm={6}>
//             <FormControl fullWidth required error={!!errors.eoslType}>
//               <InputLabel id="eosl-type-label">EOSL Type</InputLabel>
//               <Select
//                 labelId="eosl-type-label"
//                 name="eoslType"
//                 value={formData.eoslType}
//                 label="EOSL Type"
//                 onChange={handleChange}
//               >
//                 {eoslTypes.map(type => (
//                   <MenuItem key={type} value={type}>
//                     {type}
//                   </MenuItem>
//                 ))}
//               </Select>
//               {errors.eoslType && (
//                 <Typography variant="caption" color="error">
//                   {errors.eoslType}
//                 </Typography>
//               )}
//             </FormControl>
//           </Grid>
          
//           <Grid item xs={12}>
//             <LocalizationProvider dateAdapter={AdapterDateFns}>
//               <DatePicker
//                 label="EOSL Date"
//                 value={formData.date}
//                 onChange={handleDateChange}
//                 renderInput={(params) => (
//                   <TextField
//                     {...params}
//                     fullWidth
//                     required
//                     error={!!errors.date}
//                     helperText={errors.date}
//                   />
//                 )}
//               />
//             </LocalizationProvider>
//           </Grid>
          
//           <Grid item xs={12}>
//             <TextField
//               name="remark"
//               label="Remarks"
//               value={formData.remark}
//               onChange={handleChange}
//               fullWidth
//               multiline
//               rows={3}
//               placeholder="Additional information about the asset"
//             />
//           </Grid>
//         </Grid>
        
//         <Box 
//           sx={{ 
//             mt: 3, 
//             p: 2, 
//             bgcolor: 'rgba(25, 118, 210, 0.08)', 
//             borderRadius: 1,
//             border: '1px solid rgba(25, 118, 210, 0.2)'
//           }}
//         >
//           <Typography variant="body2" color="text.secondary">
//             Adding a new asset will track its End of Service Life (EOSL) date and enable reminders as the date approaches.
//             Make sure to include accurate information for proper tracking and management.
//           </Typography>
//         </Box>
//       </DialogContent>
      
//       <DialogActions sx={{ p: 2, bgcolor: '#f8f9fb' }}>
//         <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
//           Created by: SarthakDeb on 2025-04-18 09:36:24
//         </Typography>
//         <Button onClick={handleClose} color="inherit">
//           Cancel
//         </Button>
//         <Button 
//           onClick={handleSubmit} 
//           variant="contained"
//           sx={{
//             background: 'linear-gradient(45deg, #1976D2 30%, #42A5F5 90%)',
//             boxShadow: '0 3px 5px rgba(25, 118, 210, 0.3)'
//           }}
//         >
//           Add Asset
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// };

// export default AddAssetModal;






// import React, { useState } from 'react';
// import {
//   Dialog, DialogTitle, DialogContent, DialogActions,
//   Button, TextField, MenuItem, Grid, IconButton,
//   Typography, Box, Divider, FormControl, InputLabel,
//   Select
// } from '@mui/material';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import CloseIcon from '@mui/icons-material/Close';
// import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

// const initialFormData = {
//   name: '',
//   owner: '',
//   type: '',
//   eoslType: '',
//   date: null,
//   remark: ''
// };

// const AddAssetModal = ({ open, onClose, onAddAsset }) => {
//   const [formData, setFormData] = useState(initialFormData);
//   const [errors, setErrors] = useState({});

//   // Asset types
//   const assetTypes = [
//     'Server', 'Network Switch', 'Database', 'Firewall',
//     'Router', 'Storage Array', 'Load Balancer', 'Workstation',
//     'Virtual Machine', 'Container Host', 'VPN Gateway', 'Backup System'
//   ];

//   // Owner names
//   const owners = [
//     'John Smith', 'Emily Johnson', 'Michael Wilson',
//     'Sarah Brown', 'David Miller', 'Jennifer Davis',
//     'Robert Taylor', 'Jessica Anderson', 'Thomas Martinez'
//   ];

//   // EOSL types
//   const eoslTypes = ['EOS', 'EOL'];

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));

//     if (errors[name]) {
//       setErrors(prev => ({ ...prev, [name]: null }));
//     }
//   };

//   const handleDateChange = (newValue) => {
//     setFormData(prev => ({ ...prev, date: newValue }));
//     if (errors.date) {
//       setErrors(prev => ({ ...prev, date: null }));
//     }
//   };

//   const validateForm = () => {
//     const newErrors = {};
//     if (!formData.name.trim()) newErrors.name = 'Asset name is required';
//     if (!formData.owner) newErrors.owner = 'Owner is required';
//     if (!formData.type) newErrors.type = 'Asset type is required';
//     if (!formData.eoslType) newErrors.eoslType = 'EOSL type is required';
//     if (!formData.date) newErrors.date = 'Date is required';

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = () => {
//     if (validateForm()) {
//       onAddAsset({
//         ...formData,
//         id: `ASSET-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
//         dateFormatted: formData.date ? formData.date.toISOString().split('T')[0] : '',
//         createdBy: 'SarthakDeb',
//         createdAt: '2025-04-18 09:36:24'
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
//       maxWidth="lg"
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
//         <AddCircleOutlineIcon sx={{ color: '#1976D2' }} />
//         <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
//           Add New Asset
//         </Typography>
//         <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
//           <CloseIcon />
//         </IconButton>
//       </DialogTitle>

//       <Divider />

//       {/* <DialogContent sx={{ p: 3 }}>
         
//         <Grid container spacing={2}  wrap="wrap" alignItems="center">
          
//           <Grid item sx={{ flex: '1 1 200px', minWidth: 200 }}>
//             <TextField
//               name="name"
//               label="Asset Name"
//               value={formData.name}
//               onChange={handleChange}
//               fullWidth
//               required
//               error={!!errors.name}
//               helperText={errors.name}
//               placeholder="Enter asset name"
//             />
//           </Grid>

//           <Grid item sx={{ flex: '1 1 200px', minWidth: 200 }}>
//             <FormControl fullWidth required error={!!errors.owner}>
//               <InputLabel id="owner-label">Owner</InputLabel>
//               <Select
//                 labelId="owner-label"
//                 name="owner"
//                 value={formData.owner}
//                 label="Owner"
//                 onChange={handleChange}
//                 size="medium"
//               >
//                 {owners.map(owner => (
//                   <MenuItem key={owner} value={owner}>
//                     {owner}
//                   </MenuItem>
//                 ))}
//               </Select>
//               {errors.owner && (
//                 <Typography variant="caption" color="error">
//                   {errors.owner}
//                 </Typography>
//               )}
//             </FormControl>
//           </Grid>

//           <Grid item sx={{ flex: '1 1 220px', minWidth: 220 }}>
//             <FormControl fullWidth required error={!!errors.type}>
//               <InputLabel id="type-label">Asset Type</InputLabel>
//               <Select
//                 labelId="type-label"
//                 name="type"
//                 value={formData.type}
//                 label="Asset Type"
//                 onChange={handleChange}
//                 size="medium"
//               >
//                 {assetTypes.map(type => (
//                   <MenuItem key={type} value={type}>
//                     {type}
//                   </MenuItem>
//                 ))}
//               </Select>
//               {errors.type && (
//                 <Typography variant="caption" color="error">
//                   {errors.type}
//                 </Typography>
//               )}
//             </FormControl>
//           </Grid>

//           <Grid item sx={{ flex: '0 0 140px', minWidth: 140 }}>
//             <FormControl fullWidth required error={!!errors.eoslType}>
//               <InputLabel id="eosl-type-label">EOSL Type</InputLabel>
//               <Select
//                 labelId="eosl-type-label"
//                 name="eoslType"
//                 value={formData.eoslType}
//                 label="EOSL Type"
//                 onChange={handleChange}
//                 size="medium"
//               >
//                 {eoslTypes.map(type => (
//                   <MenuItem key={type} value={type}>
//                     {type}
//                   </MenuItem>
//                 ))}
//               </Select>
//               {errors.eoslType && (
//                 <Typography variant="caption" color="error">
//                   {errors.eoslType}
//                 </Typography>
//               )}
//             </FormControl>
//           </Grid>

//           <Grid item sx={{ flex: '0 0 200px', minWidth: 160 }}>
//             <LocalizationProvider dateAdapter={AdapterDateFns}>
//               <DatePicker
//                 label="EOSL Date"
//                 value={formData.date}
//                 onChange={handleDateChange}
//                 renderInput={(params) => (
//                   <TextField
//                     {...params}
//                     fullWidth
//                     required
//                     error={!!errors.date}
//                     helperText={errors.date}
//                   />
//                 )}
//               />
//             </LocalizationProvider>
//           </Grid>

           
//           <Grid item xs={12}>
//             <TextField
//               name="remark"
//               label="Remarks"
//               value={formData.remark}
//               onChange={handleChange}
//               fullWidth
//               multiline
//               rows={3}
//               placeholder="Additional information about the asset"
//             />
//           </Grid>
//         </Grid>

//         <Box
//           sx={{
//             mt: 3,
//             p: 2,
//             bgcolor: 'rgba(25, 118, 210, 0.08)',
//             borderRadius: 1,
//             border: '1px solid rgba(25, 118, 210, 0.2)'
//           }}
//         >
//           <Typography variant="body2" color="text.secondary">
//             Adding a new asset will track its End of Service Life (EOSL) date and enable reminders as the date approaches.
//             Make sure to include accurate information for proper tracking and management.
//           </Typography>
//         </Box>
//       </DialogContent> */}


//       <DialogContent sx={{ p: 3 }}>
//   <Grid container spacing={2}>
//     {/* Row 1 */}
//     <Grid item xs={12} sm={6}>
//       <TextField
//         name="name"
//         label="Asset Name"
//         value={formData.name}
//         onChange={handleChange}
//         fullWidth
//         required
//         error={!!errors.name}
//         helperText={errors.name}
//         placeholder="Enter asset name"
//       />
//     </Grid>

//     <Grid item xs={12} sm={6}>
//       <FormControl fullWidth required error={!!errors.owner}>
//         <InputLabel id="owner-label">Owner</InputLabel>
//         <Select
//           labelId="owner-label"
//           name="owner"
//           value={formData.owner}
//           label="Owner"
//           onChange={handleChange}
//         >
//           {owners.map(owner => (
//             <MenuItem key={owner} value={owner}>
//               {owner}
//             </MenuItem>
//           ))}
//         </Select>
//         {errors.owner && (
//           <Typography variant="caption" color="error">
//             {errors.owner}
//           </Typography>
//         )}
//       </FormControl>
//     </Grid>

//     {/* Row 2 */}
//     <Grid item xs={12} sm={6}>
//       <FormControl fullWidth required error={!!errors.type}>
//         <InputLabel id="type-label">Asset Type</InputLabel>
//         <Select
//           labelId="type-label"
//           name="type"
//           value={formData.type}
//           label="Asset Type"
//           onChange={handleChange}
//         >
//           {assetTypes.map(type => (
//             <MenuItem key={type} value={type}>
//               {type}
//             </MenuItem>
//           ))}
//         </Select>
//         {errors.type && (
//           <Typography variant="caption" color="error">
//             {errors.type}
//           </Typography>
//         )}
//       </FormControl>
//     </Grid>

//     <Grid item xs={12} sm={6}>
//       <FormControl fullWidth required error={!!errors.eoslType}>
//         <InputLabel id="eosl-type-label">EOSL Type</InputLabel>
//         <Select
//           labelId="eosl-type-label"
//           name="eoslType"
//           value={formData.eoslType}
//           label="EOSL Type"
//           onChange={handleChange}
//         >
//           {eoslTypes.map(type => (
//             <MenuItem key={type} value={type}>
//               {type}
//             </MenuItem>
//           ))}
//         </Select>
//         {errors.eoslType && (
//           <Typography variant="caption" color="error">
//             {errors.eoslType}
//           </Typography>
//         )}
//       </FormControl>
//     </Grid>

//     {/* Row 3 */}
//     <Grid item xs={12} sm={6}>
//       <LocalizationProvider dateAdapter={AdapterDateFns}>
//         <DatePicker
//           label="EOSL Date"
//           value={formData.date}
//           onChange={handleDateChange}
//           renderInput={(params) => (
//             <TextField
//               {...params}
//               fullWidth
//               required
//               error={!!errors.date}
//               helperText={errors.date}
//             />
//           )}
//         />
//       </LocalizationProvider>
//     </Grid>

//     <Grid item xs={12} sm={6}>
//       <TextField
//         name="remark"
//         label="Remarks"
//         value={formData.remark}
//         onChange={handleChange}
//         fullWidth
//         multiline
//         rows={3}
//         placeholder="Additional information about the asset"
//       />
//     </Grid>
//   </Grid>

//   {/* Info Box */}
//   <Box
//     sx={{
//       mt: 3,
//       p: 2,
//       bgcolor: 'rgba(25,118,210,0.08)',
//       borderRadius: 1,
//       border: '1px solid rgba(25,118,210,0.2)'
//     }}
//   >
//     <Typography variant="body2" color="text.secondary">
//       Adding a new asset will track its End of Service Life (EOSL) date and enable reminders as the date approaches.
//       Make sure to include accurate information for proper tracking and management.
//     </Typography>
//   </Box>
// </DialogContent>


//       <DialogActions sx={{ p: 2, bgcolor: '#f8f9fb' }}>
//         <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
//           Created by: SarthakDeb on 2025-04-18 09:36:24
//         </Typography>
//         <Button onClick={handleClose} color="inherit">
//           Cancel
//         </Button>
//         <Button
//           onClick={handleSubmit}
//           variant="contained"
//           sx={{
//             background: 'linear-gradient(45deg, #1976D2 30%, #42A5F5 90%)',
//             boxShadow: '0 3px 5px rgba(25, 118, 210, 0.3)'
//           }}
//         >
//           Add Asset
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// };

// export default AddAssetModal;




import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, IconButton,
  Typography, Box, Divider, FormControl, InputLabel,
  Select, CircularProgress, Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { createEOSLAsset } from '../../../utils/eoslApi';

const initialFormData = {
  name: '',
  owner: '',
  type: '',
  eoslType: '',
  date: null,
  remark: ''
};

const AddAssetModal = ({ open, onClose, onAddAsset }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Asset types
  const assetTypes = [
    'Server', 'Network Switch', 'Database', 'Firewall',
    'Router', 'Storage Array', 'Load Balancer', 'Workstation',
    'Virtual Machine', 'Container Host', 'VPN Gateway', 'Backup System'
  ];

  // Owner names
  const owners = [
    'John Smith', 'Emily Johnson', 'Michael Wilson',
    'Sarah Brown', 'David Miller', 'Jennifer Davis',
    'Robert Taylor', 'Jessica Anderson', 'Thomas Martinez'
  ];

  // EOSL types
  const eoslTypes = ['EOS', 'EOL'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    if (error) setError(null);
  };

  const handleDateChange = (newValue) => {
    setFormData(prev => ({ ...prev, date: newValue }));
    if (errors.date) setErrors(prev => ({ ...prev, date: null }));
    if (error) setError(null);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Asset name is required';
    if (!formData.owner) newErrors.owner = 'Owner is required';
    if (!formData.type) newErrors.type = 'Asset type is required';
    if (!formData.eoslType) newErrors.eoslType = 'EOSL type is required';
    if (!formData.date) newErrors.date = 'Date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Prepare data for API
      const assetData = {
        name: formData.name,
        owner: formData.owner,
        type: formData.type,
        eoslType: formData.eoslType,
        date: formData.date ? formData.date.toISOString().split('T')[0] : null,
        remark: formData.remark || ''
      };
      
      // Call API to create asset
      const createdAsset = await createEOSLAsset(assetData);
      
      // Notify parent component
      if (onAddAsset) {
        onAddAsset(createdAsset);
      }
      
      // Close modal and reset form
      handleClose();
    } catch (err) {
      console.error('Error creating asset:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to create asset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return; // Prevent closing while loading
    setFormData(initialFormData);
    setErrors({});
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
          // constrain height so dialog doesn't have huge empty space
          maxHeight: '55vh',
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
        <AddCircleOutlineIcon sx={{ color: '#1976D2' }} />
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
          Add New Asset
        </Typography>
        <IconButton 
          edge="end" 
          color="inherit" 
          onClick={handleClose} 
          aria-label="close"
          disabled={loading}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

  <DialogContent sx={{ p: 3, flex: '1 1 auto', overflowY: 'auto', maxHeight: '55vh' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        <Box
          component="form"
          noValidate
          autoComplete="off"
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
            alignItems: 'start'
          }}
        >
          {/* Asset Name */}
          <TextField
            name="name"
            label="Asset Name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
            error={!!errors.name}
            helperText={errors.name}
            placeholder="Enter asset name"
            disabled={loading}
          />

          {/* Owner */}
          <FormControl fullWidth required error={!!errors.owner}>
            <InputLabel id="owner-label">Owner</InputLabel>
            <Select
              labelId="owner-label"
              name="owner"
              value={formData.owner}
              label="Owner"
              onChange={handleChange}
              disabled={loading}
            >
              {owners.map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
            </Select>
            {errors.owner && <Typography variant="caption" color="error">{errors.owner}</Typography>}
          </FormControl>

          {/* Asset Type */}
          <FormControl fullWidth required error={!!errors.type}>
            <InputLabel id="type-label">Asset Type</InputLabel>
            <Select
              labelId="type-label"
              name="type"
              value={formData.type}
              label="Asset Type"
              onChange={handleChange}
              disabled={loading}
            >
              {assetTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
            {errors.type && <Typography variant="caption" color="error">{errors.type}</Typography>}
          </FormControl>

          {/* EOSL Type */}
          <FormControl fullWidth required error={!!errors.eoslType}>
            <InputLabel id="eosl-type-label">EOSL Type</InputLabel>
            <Select
              labelId="eosl-type-label"
              name="eoslType"
              value={formData.eoslType}
              label="EOSL Type"
              onChange={handleChange}
              disabled={loading}
            >
              {eoslTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
            {errors.eoslType && <Typography variant="caption" color="error">{errors.eoslType}</Typography>}
          </FormControl>

          {/* EOSL Date */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="EOSL Date"
              value={formData.date}
              onChange={handleDateChange}
              disabled={loading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  required
                  error={!!errors.date}
                  helperText={errors.date}
                />
              )}
            />
          </LocalizationProvider>

          {/* Remarks */}
          <TextField
            name="remark"
            label="Remarks"
            value={formData.remark}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
            placeholder="Additional information about the asset"
            disabled={loading}
          />

          {/* Info box */}
          <Box
            sx={{
              gridColumn: '1 / -1',
              mt: 1,
              p: 2,
              bgcolor: 'rgba(25,118,210,0.08)',
              borderRadius: 1,
              border: '1px solid rgba(25,118,210,0.2)'
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Adding a new asset will track its End of Service Life (EOSL) date and enable reminders as the date approaches.
              Make sure to include accurate information for proper tracking and management.
            </Typography>
          </Box>
        </Box>
      </DialogContent>

  <DialogActions sx={{ p: 2, bgcolor: '#f8f9fb' }}>
        <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
          All fields marked with * are required
        </Typography>
        <Button onClick={handleClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{
            background: 'linear-gradient(45deg, #1976D2 30%, #42A5F5 90%)',
            boxShadow: '0 3px 5px rgba(25,118,210,0.3)',
            minWidth: 80,
            py: 0.8
          }}
        >
          {loading ? 'Adding...' : 'Add Asset'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddAssetModal;







 