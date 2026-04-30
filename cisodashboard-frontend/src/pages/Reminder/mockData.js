// Mock data generator for Reminder page

export const generateMockReminderData = () => {
    // Vendor names
    const vendors = [
      'TechCorp Systems', 'SecureNet Solutions', 'CloudScale Inc.', 
      'DataFlow Analytics', 'NetGuard Security', 'InfraTech Solutions',
      'DevOps Pro', 'ServerHost Inc.', 'AgileSoft Development',
      'GlobalNet Services', 'CyberShield Protection', 'DataCenter Pro'
    ];
    
    // Application names
    const applications = [
      'Customer Portal', 'Payment Gateway', 'Data Analytics Platform', 
      'Authentication System', 'Content Management', 'Billing System',
      'Inventory Management', 'HR Management', 'CRM System',
      'Email Service', 'File Storage', 'Backup Solution'
    ];
    
    // Owner names
    const owners = [
      'John Smith', 'Emily Johnson', 'Michael Wilson', 
      'Sarah Brown', 'David Miller', 'Jennifer Davis',
      'Robert Taylor', 'Jessica Anderson', 'Thomas Martinez',
      'Elizabeth Thomas', 'Daniel Jackson', 'Lisa White'
    ];
    
    // Exception types
    const exceptionTypes = [
      'Temporary Compliance Waiver', 'Technical Limitation', 
      'Business Continuity Exception', 'Legacy System Exception',
      'Vendor Dependency', 'Regulatory Conflict',
      'Architectural Constraint', 'Resource Limitation'
    ];
    
    // Remarks for exceptions
    const remarks = [
      'Pending security review', 'Approved by CISO with conditions',
      'Waiting for vendor remediation', 'Periodic risk assessment required',
      'Compensating controls in place', 'Scheduled for next audit cycle',
      'Technical workaround implemented', 'Business impact analysis completed'
    ];
    
    // Generate vendor reminders
    const generateVendorReminders = (count) => {
      const reminders = [];
      
      for (let i = 0; i < count; i++) {
        const vendorIndex = Math.floor(Math.random() * vendors.length);
        const nonCompliantApps = Math.floor(Math.random() * 10) + 1;
        const delayDays = Math.floor(Math.random() * 60) + 5;
        
        reminders.push({
          id: `VR-${i + 1}`,
          vendorName: vendors[vendorIndex],
          nonCompliantApps,
          delayDays,
          sentCount: Math.floor(Math.random() * 3)
        });
      }
      
      return reminders;
    };
    
    // Generate application reminders
    const generateApplicationReminders = (count) => {
      const reminders = [];
      
      for (let i = 0; i < count; i++) {
        const appIndex = Math.floor(Math.random() * applications.length);
        const ownerIndex = Math.floor(Math.random() * owners.length);
        const delayDays = Math.floor(Math.random() * 45) + 5;
        
        reminders.push({
          id: `AR-${i + 1}`,
          owner: owners[ownerIndex],
          application: applications[appIndex],
          delayDays,
          sentCount: Math.floor(Math.random() * 3)
        });
      }
      
      return reminders;
    };
    
    // Generate exception reminders
    const generateExceptionReminders = (count) => {
      const reminders = [];
      
      for (let i = 0; i < count; i++) {
        const exceptionIndex = Math.floor(Math.random() * exceptionTypes.length);
        const remarkIndex = Math.floor(Math.random() * remarks.length);
        
        reminders.push({
          id: `ER-${i + 1}`,
          exceptionType: exceptionTypes[exceptionIndex],
          remark: remarks[remarkIndex],
          sentCount: Math.floor(Math.random() * 3)
        });
      }
      
      return reminders;
    };
    
    // Generate counts for each type
    const vendorCount = Math.floor(Math.random() * 5) + 8;
    const applicationCount = Math.floor(Math.random() * 6) + 7;
    const exceptionCount = Math.floor(Math.random() * 4) + 6;
    
    return {
      vendorReminders: generateVendorReminders(vendorCount),
      applicationReminders: generateApplicationReminders(applicationCount),
      exceptionReminders: generateExceptionReminders(exceptionCount),
      stats: {
        vendors: vendorCount,
        applications: applicationCount,
        exceptions: exceptionCount
      }
    };
  };