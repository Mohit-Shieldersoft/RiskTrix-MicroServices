import React, { useEffect, useState } from 'react';
import { Box, List, ListItem, ListItemText, Typography, Divider } from '@mui/material';
import assignmentApi from '../../../utils/assignmentApi';

const AssignmentList = ({ vendorId, selectedStandard, onSelectAssignment }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Map frontend standard names to backend IDs (from seed data)
  const standardIdMap = {
    'ISO27001': 1,
    'PCI_DSS': 2,
    'SOC2': null,  // not seeded yet
    'GDPR': null   // not seeded yet
  };

  useEffect(() => {
    const load = async () => {
      if (!vendorId) {
        setAssignments([]);
        return;
      }
      
      setLoading(true);
      try {
        const res = await assignmentApi.list();
        const items = res || [];
        // Filter by vendor and optionally by standard
        let filtered = items.filter(a => a.vendor_id === vendorId);
        
        const standardId = standardIdMap[selectedStandard];
        if (standardId) {
          filtered = filtered.filter(a => a.standard_id === standardId);
        }
        
        setAssignments(filtered);
      } catch (e) {
        console.error('Failed to load assignments', e);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [vendorId, selectedStandard]);

  if (!vendorId) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">Select a vendor to view assignments</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <List dense>
        {assignments.map(a => (
          <React.Fragment key={a.id}>
            <ListItem button onClick={() => onSelectAssignment(a)}>
              <ListItemText primary={a.name} secondary={a.due_date || ''} />
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default AssignmentList;
