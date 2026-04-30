// Mock data generator for TPRM

export const generateMockTPRMData = () => {
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
      { name: 'DataCenter Pro', category: 'Hosting' },
      { name: 'CloudNine Computing', category: 'Cloud Provider' },
      { name: 'SecurePulse', category: 'Security' },
      { name: 'NetMatrix Solutions', category: 'Networking' }
    ];
    
    // Generate random date within the past 6 months
    const getRandomPastDate = () => {
      const now = new Date('2025-04-04');
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      
      return new Date(sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime()));
    };
    
    // Format date as YYYY-MM-DD
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };
    
    // Determine risk level based on non-compliant apps count
    const getRiskLevel = (nonCompliantApps, totalApps) => {
      const ratio = nonCompliantApps / totalApps;
      if (ratio >= 0.7) return 'Critical';
      if (ratio >= 0.5) return 'High';
      if (ratio >= 0.3) return 'Medium';
      if (ratio > 0) return 'Low';
      return 'None';
    };
    
    // Generate vendor data including compliance
    const vendorData = vendors.map(vendor => {
      const totalApps = Math.floor(Math.random() * 15) + 1;
      const nonCompliantApps = Math.floor(Math.random() * (totalApps + 1));
      const compliantApps = totalApps - nonCompliantApps;
      const auditDate = formatDate(getRandomPastDate());
      const risk = getRiskLevel(nonCompliantApps, totalApps);
      
      // Generate random remarks based on risk level
      let remarks;
      switch (risk) {
        case 'Critical':
          remarks = 'Immediate action required - critical vulnerabilities';
          break;
        case 'High':
          remarks = 'Urgent mitigation needed - high priority';
          break;
        case 'Medium':
          remarks = 'Remediation plan in progress';
          break;
        case 'Low':
          remarks = 'Minor issues identified - monitoring';
          break;
        case 'None':
          remarks = 'All applications compliant';
          break;
        default:
          remarks = '';
      }
      
      return {
        id: `VEN-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        name: vendor.name,
        category: vendor.category,
        nonCompliantApps,
        compliantApps,
        totalApps,
        risk,
        auditDate,
        remarks
      };
    });
    
    // Generate list of expired vendors
    const expiredVendors = vendorData
      .filter(() => Math.random() > 0.7) // Randomly select some vendors
      .map(vendor => {
        const expiryDate = formatDate(getRandomPastDate());
        return {
          id: vendor.id,
          name: vendor.name,
          expiryDate
        };
      });
    
    // Generate delayed vendors data
    const delayedVendors = vendorData
      .filter(vendor => vendor.nonCompliantApps > 0) // Only include non-compliant vendors
      .slice(0, 8) // Take first 8 items
      .map(vendor => {
        const delay = Math.floor(Math.random() * 90) + 5; // 5 to 95 days
        return {
          id: vendor.id,
          name: vendor.name,
          category: vendor.category,
          nonCompliantApps: vendor.nonCompliantApps,
          risk: vendor.risk,
          delay
        };
      });
    
    // Sort vendors by risk level (Critical -> High -> Medium -> Low -> None)
    const riskOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3, 'None': 4 };
    vendorData.sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk]);
    
    // Sort delayed vendors by delay (highest first)
    delayedVendors.sort((a, b) => b.delay - a.delay);
    
    return {
      vendors: vendorData,
      expiredVendors,
      delayedVendors
    };
  };