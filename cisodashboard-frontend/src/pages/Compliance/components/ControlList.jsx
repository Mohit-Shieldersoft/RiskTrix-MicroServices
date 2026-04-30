import React from 'react';
import { 
  List, ListItem, ListItemText, ListItemIcon, 
  Box, Typography, Divider, Badge
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import FolderIcon from '@mui/icons-material/Folder';
import dashboardTheme from '../../../theme/dashboardTheme';

const ControlList = ({ sections, selectedSection, onSectionSelect }) => {
  if (!sections || sections.length === 0) {
    return (
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Typography variant="body2" color="text.secondary">
          No control sections available
        </Typography>
      </Box>
    );
  }
  
  return (
    <List component="nav" dense sx={{ p: 0 }}>
      {sections.map((section, index) => (
        <React.Fragment key={section.id}>
          <ListItem
            button
            selected={selectedSection?.id === section.id}
            onClick={() => onSectionSelect(section)}
            sx={{
              py: 1.5,
              transition: 'all 0.2s',
              borderLeft: selectedSection?.id === section.id ? 
                `4px solid ${dashboardTheme.colors.primary}` : '4px solid transparent',
              bgcolor: selectedSection?.id === section.id ? 'rgba(0, 121, 107, 0.08)' : 'transparent',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)'
              },
              '&.Mui-selected:hover': {
                bgcolor: 'rgba(0, 121, 107, 0.12)'
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <FolderIcon 
                sx={{ 
                  color: selectedSection?.id === section.id ? 
                    dashboardTheme.colors.primary : 'text.secondary',
                  transition: 'color 0.2s'
                }} 
              />
            </ListItemIcon>
            <ListItemText 
              primary={
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: selectedSection?.id === section.id ? 'bold' : 'medium',
                    color: selectedSection?.id === section.id ? 
                      dashboardTheme.colors.primary : 'text.primary'
                  }}
                >
                  {section.id}. {section.name}
                </Typography>
              }
            />
            {selectedSection?.id === section.id && (
              <ArrowRightIcon 
                sx={{ 
                  color: dashboardTheme.colors.primary,
                  animation: 'pulse 1.5s infinite'
                }} 
              />
            )}
          </ListItem>
          {index < sections.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </List>
  );
};

export default ControlList;