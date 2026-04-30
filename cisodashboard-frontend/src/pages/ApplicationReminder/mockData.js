// Mock data generator for Application Reminder page

export const generateMockApplicationReminderData = () => {
    // Owner names
    const owners = [
      'John Smith', 'Emily Johnson', 'Michael Wilson', 
      'Sarah Brown', 'David Miller', 'Jennifer Davis',
      'Robert Taylor', 'Jessica Anderson', 'Thomas Martinez',
      'Elizabeth Thomas', 'Daniel Jackson', 'Lisa White'
    ];
    
    // Application names
    const applications = [
      'Customer Portal', 'Payment Gateway', 'Data Analytics Platform', 
      'Authentication System', 'Content Management', 'Billing System',
      'Inventory Management', 'HR Management', 'CRM System',
      'Email Service', 'File Storage', 'Backup Solution',
      'Network Monitor', 'Security Scanner', 'API Gateway',
      'Document Management', 'Database Service', 'Integration Service'
    ];
    
    // Generate random number of applications for each owner
    const generateOwnerApps = () => {
      const ownerData = [];
      
      owners.forEach((owner, index) => {
        // Each owner gets 1-5 applications
        const appCount = Math.floor(Math.random() * 5) + 1;
        
        // Assign random applications to this owner
        const ownerApps = [];
        for (let i = 0; i < appCount; i++) {
          // Pick a random application
          const appIndex = Math.floor(Math.random() * applications.length);
          const appName = applications[appIndex];
          
          // Generate vulnerability counts for each severity
          const criticalVulns = Math.floor(Math.random() * 3);
          const highVulns = Math.floor(Math.random() * 5);
          const mediumVulns = Math.floor(Math.random() * 8);
          const lowVulns = Math.floor(Math.random() * 10);
          
          // Calculate delays for each severity
          const criticalDelay = criticalVulns > 0 ? Math.floor(Math.random() * 30) + 1 : 0;
          const highDelay = highVulns > 0 ? Math.floor(Math.random() * 45) + 1 : 0;
          const mediumDelay = mediumVulns > 0 ? Math.floor(Math.random() * 60) + 1 : 0;
          const lowDelay = lowVulns > 0 ? Math.floor(Math.random() * 90) + 1 : 0;
          
          // Generate last reminded date (if any)
          const hasBeenReminded = Math.random() > 0.4; // 60% chance of having been reminded
          const lastReminded = hasBeenReminded ? 
            getRandomPastDate(30) : null;
          
          ownerApps.push({
            id: `APP-${index}-${i}`,
            name: appName,
            vulnerabilities: {
              critical: criticalVulns,
              high: highVulns,
              medium: mediumVulns,
              low: lowVulns,
              total: criticalVulns + highVulns + mediumVulns + lowVulns
            },
            delay: {
              critical: criticalDelay,
              high: highDelay,
              medium: mediumDelay,
              low: lowDelay,
              max: Math.max(criticalDelay, highDelay, mediumDelay, lowDelay)
            },
            lastReminded,
            owner: owner
          });
        }
        
        // Calculate total apps and vulnerabilities for this owner
        const totalVulnerabilities = ownerApps.reduce((sum, app) => sum + app.vulnerabilities.total, 0);
        
        ownerData.push({
          id: `OWN-${index}`,
          name: owner,
          applicationCount: appCount,
          totalVulnerabilities,
          applications: ownerApps
        });
      });
      
      return ownerData;
    };
    
    // Get random past date
    const getRandomPastDate = (maxDaysAgo) => {
      const today = new Date('2025-04-16');
      const daysAgo = Math.floor(Math.random() * maxDaysAgo) + 1;
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - daysAgo);
      return pastDate.toISOString().split('T')[0];
    };
    
    // Generate application data organized by application name
    const generateApplicationData = (ownerData) => {
      // Flatten all applications
      const allApps = [];
      ownerData.forEach(owner => {
        owner.applications.forEach(app => {
          allApps.push(app);
        });
      });
      
      // Group by application name
      const appGroups = {};
      allApps.forEach(app => {
        if (!appGroups[app.name]) {
          appGroups[app.name] = [];
        }
        appGroups[app.name].push(app);
      });
      
      // Create application data structure
      const applicationData = Object.keys(appGroups).map((appName, index) => {
        const apps = appGroups[appName];
        
        return {
          id: `APPGRP-${index}`,
          name: appName,
          instances: apps.map(app => ({
            id: app.id,
            owner: app.owner,
            vulnerabilities: app.vulnerabilities,
            delay: app.delay,
            lastReminded: app.lastReminded
          }))
        };
      });
      
      return applicationData;
    };
    
    // Generate owner data
    const ownerData = generateOwnerApps();
    
    // Generate application data based on owner data
    const applicationData = generateApplicationData(ownerData);
    
    // Calculate statistics
    const totalOwners = ownerData.length;
    const totalApplications = ownerData.reduce((sum, owner) => sum + owner.applicationCount, 0);
    const totalVulnerabilities = ownerData.reduce((sum, owner) => sum + owner.totalVulnerabilities, 0);
    
    return {
      ownerData,
      applicationData,
      stats: {
        owners: totalOwners,
        applications: totalApplications,
        totalVulnerabilities
      }
    };
  };