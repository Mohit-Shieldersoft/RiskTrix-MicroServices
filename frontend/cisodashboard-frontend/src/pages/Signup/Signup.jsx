// import React, { useState } from 'react';
// import {
//   Box,
//   TextField,
//   Button,
//   Typography,
//   Paper,
//   Alert,
//   Container,
//   Link as MuiLink
// } from '@mui/material';
// import { useNavigate, Link } from 'react-router-dom';
// import Security from '@mui/icons-material/Security';

// const Signup = () => {
//   const [formData, setFormData] = useState({
//     email: '',
//     password: '',
//     confirmPassword: ''
//   });
//   const [error, setError] = useState('');
//   const [successMsg, setSuccessMsg] = useState('');
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const { email, password, confirmPassword } = formData;

//   const handleChange = e => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async e => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');
//     setSuccessMsg('');

//     if (!email || !password || !confirmPassword) {
//       setError('Please fill all required fields.');
//       setLoading(false);
//       return;
//     }
//     if (password !== confirmPassword) {
//       setError('Passwords do not match.');
//       setLoading(false);
//       return;
//     }
//     try {
//       const res = await fetch('/api/auth/signup', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password })
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         // server may return { error: '...' } or { msg: '...' }
//         throw new Error(data.error || data.msg || 'Signup failed');
//       }

//       // Option 1: redirect to login (recommended)
//       setSuccessMsg('Signup successful. Redirecting to login...');
//       setTimeout(() => navigate('/login'), 1200);

//       // Option 2 (if your backend returns tokens and you want to auto-login):
//       // localStorage.setItem('token', data.token || data.access_token);
//       // navigate('/');

//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Box
//       sx={{
//         display: 'flex',
//         minHeight: '100vh',
//         alignItems: 'center',
//         justifyContent: 'center',
//         backgroundColor: '#f5f7fa'
//       }}
//     >
//       <Container maxWidth="sm">
//         <Paper
//           elevation={3}
//           sx={{
//             p: 4,
//             display: 'flex',
//             flexDirection: 'column',
//             alignItems: 'center',
//             borderRadius: 2
//           }}
//         >
//           <Security
//             sx={{
//               fontSize: 56,
//               color: theme => theme.palette.primary.main,
//               mb: 2
//             }}
//           />

//           <Typography component="h1" variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
//             RiskTrix
//           </Typography>

//           {error && (
//             <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
//               {error}
//             </Alert>
//           )}

//           {successMsg && (
//             <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
//               {successMsg}
//             </Alert>
//           )}

//           <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
//             <TextField
//               variant="outlined"
//               margin="normal"
//               required
//               fullWidth
//               id="email"
//               label="Email Address"
//               name="email"
//               autoComplete="email"
//               autoFocus
//               value={email}
//               onChange={handleChange}
//             />

//             <TextField
//               variant="outlined"
//               margin="normal"
//               required
//               fullWidth
//               name="password"
//               label="Password"
//               type="password"
//               id="password"
//               autoComplete="new-password"
//               value={password}
//               onChange={handleChange}
//             />

//             <TextField
//               variant="outlined"
//               margin="normal"
//               required
//               fullWidth
//               name="confirmPassword"
//               label="Confirm Password"
//               type="password"
//               id="confirmPassword"
//               autoComplete="new-password"
//               value={confirmPassword}
//               onChange={handleChange}
//             />

//             <Button
//               type="submit"
//               fullWidth
//               variant="contained"
//               sx={{ mt: 3, mb: 2, py: 1.5 }}
//               disabled={loading}
//             >
//               {loading ? 'Creating account...' : 'Create Account'}
//             </Button>
//           </Box>

//           <Typography variant="body2" sx={{ mt: 1 }}>
//             Already have an account?{' '}
//             <MuiLink component={Link} to="/login" underline="hover">
//               Sign in
//             </MuiLink>
//           </Typography>
//         </Paper>
//       </Container>
//     </Box>
//   );
// };

// export default Signup;









import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  Container,
  Link as MuiLink,
  MenuItem, // 👈 add this for dropdown
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import Security from '@mui/icons-material/Security';

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 4, // 👈 default Viewer / lowest role
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { email, password, confirmPassword,role } = formData;

//   const handleChange = e => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (!email || !password || !confirmPassword) {
      setError('Please fill all required fields.');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      // simple client-side signup stored in localStorage
      const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
      const exists = users.find(u => u.email === (email || '').toLowerCase());
      if (exists) {
        setError('Email already registered. Please login.');
        return;
      }
      const newUser = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        email: (email || '').toLowerCase(),
        password,
        role: Number(role) || 4,
        created_at: new Date().toISOString()
      };
      users.push(newUser);
      localStorage.setItem('mock_users', JSON.stringify(users));

      setSuccessMsg('Signup successful. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f7fa'
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2
          }}
        >
          <Security
            sx={{
              fontSize: 56,
              color: theme => theme.palette.primary.main,
              mb: 2
            }}
          />

          <Typography component="h1" variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
            RiskTrix
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          {successMsg && (
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              {successMsg}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={handleChange}
            />

            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={handleChange}
            />

            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={handleChange}
            />

            {/* 👇 NEW: role select */}
            <TextField
              select
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="role"
              label="Role"
              id="role"
              value={role}
              onChange={handleChange}
              helperText="Choose account type"
            >
              <MenuItem value={1}>Admin</MenuItem>
              <MenuItem value={2}>Doctor</MenuItem>
              <MenuItem value={3}>Patient</MenuItem>
              <MenuItem value={4}>Viewer / Regular User</MenuItem>
            </TextField>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </Box>

          <Typography variant="body2" sx={{ mt: 1 }}>
            Already have an account?{' '}
            <MuiLink component={Link} to="/login" underline="hover">
              Sign in
            </MuiLink>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Signup;

