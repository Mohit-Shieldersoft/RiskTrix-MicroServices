// Central theme configuration for dashboard
const dashboardTheme = {
    // Color palette
    colors: {
      // Primary colors
      primary: '#3f51b5',
      secondary: '#f50057',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3',
      none: '#bcbcbc',
      
      // Severity specific colors
      severity: {
        critical: '#d32f2f',
        high: '#f57c00',
        medium: '#fbc02d',
        low: '#4caf50',
      },
      
      // Background colors
      background: {
        main: '#f8fafe',
        paper: '#ffffff',
        card: 'linear-gradient(145deg, #ffffff, #f5f7fb)',
        dashboardHeader: 'linear-gradient(120deg, #3f51b5 0%, #5c6bc0 100%)',
      },
      
      // Chart colors
      chart: {
        open: '#ff6384',
        closed: '#36a2eb',
        internal: '#8884d8',
        external: '#82ca9d',
        delay: ['#3f51b5', '#f50057', '#ffc107', '#4caf50'],
      },
      
      // Text colors
      text: {
        primary: '#3a3a3a',
        secondary: '#666666',
        light: '#ffffff',
        muted: '#9e9e9e',
      }
    },
    
    // Spacing
    spacing: {
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
      xxl: '48px',
    },
    
    // Shadows
    shadows: {
      card: '0 4px 20px rgba(0, 0, 0, 0.05)',
      cardHover: '0 8px 30px rgba(0, 0, 0, 0.12)',
      tooltip: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    
    // Border radiuses
    borderRadius: {
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '16px',
      circle: '50%',
    },
    
    // Transitions
    transitions: {
      fast: 'all 0.2s ease',
      normal: 'all 0.3s ease',
      slow: 'all 0.5s ease',
    },
    
    // Typography
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      headerSizes: {
        h1: '2.5rem',
        h2: '2rem',
        h3: '1.75rem',
        h4: '1.5rem',
        h5: '1.25rem',
        h6: '1rem',
      },
      fontWeights: {
        light: 300,
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      }
    },
    
    // Card styling
    card: {
      padding: '16px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
      transition: 'all 0.3s ease',
      hoverState: {
        transform: 'translateY(-5px)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
      }
    }
  };
  
  export default dashboardTheme;