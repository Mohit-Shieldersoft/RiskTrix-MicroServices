// Mock data generator for Vendor Compliance

export const generateMockVendorData = () => {
  const vendors = [
    { name: 'TechCorp Systems', category: 'IT Services' },
    { name: 'SecureNet Solutions', category: 'Security' },
    { name: 'CloudScale Inc.', category: 'Cloud Provider' },
    { name: 'DataFlow Analytics', category: 'Data Processing' },
    { name: 'NetGuard Security', category: 'Security' },
    { name: 'InfraTech Solutions', category: 'Infrastructure' },
    { name: 'DevOps Pro', category: 'Development' },
    { name: 'ServerHost Inc.', category: 'Hosting' },
    { name: 'AgileSoft Development', category: 'Development' },
    { name: 'GlobalNet Services', category: 'Internet' },
    { name: 'CyberShield Protection', category: 'Security' },
    { name: 'DataCenter Pro', category: 'Hosting' }
  ];
  
  const certifications = [
    { name: 'ISO 27001', validityYears: 3 },
    { name: 'PCI-DSS v4', validityYears: 1 },
    { name: 'SOC 2 Type II', validityYears: 1 },
    { name: 'HIPAA', validityYears: 2 },
    { name: 'GDPR Compliance', validityYears: 2 }
  ];
  
  const applications = [
    'Customer Portal', 'Payment Gateway', 'Data Analytics Platform', 
    'Authentication System', 'Content Management', 'Billing System',
    'Inventory Management', 'HR Management', 'CRM System',
    'Email Service', 'File Storage', 'Backup Solution'
  ];
  
  // Generate a random date within the past 2 years
  const getRandomPastDate = () => {
    const now = new Date('2025-04-03T14:07:13');
    const twoYearsAgo = new Date(now);
    twoYearsAgo.setFullYear(now.getFullYear() - 2);
    
    return new Date(twoYearsAgo.getTime() + Math.random() * (now.getTime() - twoYearsAgo.getTime()));
  };
  
  // Generate a future date based on start date and validity years
  const getExpiryDate = (startDate, years) => {
    const expiry = new Date(startDate);
    expiry.setFullYear(expiry.getFullYear() + years);
    return expiry;
  };
  
  // Format date as YYYY-MM-DD
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };
  
  // Generate vendor data with applications and certifications
  const vendorData = vendors.map(vendor => {
    // Assign 1-4 random applications to this vendor
    const appCount = Math.floor(Math.random() * 4) + 1;
    const vendorApps = [];
    
    for (let i = 0; i < appCount; i++) {
      const appIndex = Math.floor(Math.random() * applications.length);
      const app = applications[appIndex];
      
      // Skip if this app is already assigned to this vendor
      if (vendorApps.some(a => a.name === app)) continue;
      
      // Determine ISO and PCI compliance for this app
      const isoCompliant = Math.random() > 0.3; // 70% chance of being ISO compliant
      const pciCompliant = Math.random() > 0.4; // 60% chance of being PCI compliant
      
      vendorApps.push({
        name: app,
        isoCompliant,
        pciCompliant,
        criticality: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)]
      });
    }
    
    // Assign certifications
    const vendorCerts = [];
    const isoStartDate = getRandomPastDate();
    const pciStartDate = getRandomPastDate();
    
    vendorCerts.push({
      name: 'ISO 27001',
      startDate: formatDate(isoStartDate),
      expiryDate: formatDate(getExpiryDate(isoStartDate, 3))
    });
    
    vendorCerts.push({
      name: 'PCI-DSS v4',
      startDate: formatDate(pciStartDate),
      expiryDate: formatDate(getExpiryDate(pciStartDate, 1))
    });
    
    // Add other random certifications
    if (Math.random() > 0.5) {
      const certIndex = Math.floor(Math.random() * 3) + 2; // Skip ISO and PCI which are already added
      const cert = certifications[certIndex];
      const startDate = getRandomPastDate();
      
      vendorCerts.push({
        name: cert.name,
        startDate: formatDate(startDate),
        expiryDate: formatDate(getExpiryDate(startDate, cert.validityYears))
      });
    }
    
    // Determine overall compliance and exceptions
    const isCompliant = vendorApps.every(app => app.isoCompliant && app.pciCompliant);
    const hasException = !isCompliant && Math.random() > 0.7; // 30% chance of having exception if non-compliant
    
    return {
      id: `VEN-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      name: vendor.name,
      category: vendor.category,
      applications: vendorApps,
      certifications: vendorCerts,
      isCompliant,
      hasException,
      contactName: `Contact ${Math.floor(Math.random() * 100)}`,
      contactEmail: `contact${Math.floor(Math.random() * 100)}@example.com`
    };
  });
  
  return vendorData;
};