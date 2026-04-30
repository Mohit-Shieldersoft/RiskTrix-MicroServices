// Mock data generator for Audit History

export const generateMockAuditHistoryData = () => {
    // Define months for the x-axis
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Generate compliance history data (last 12 months)
    const generateComplianceHistory = () => {
      const data = [];
      let compliantTrend = Math.floor(Math.random() * 40) + 50; // Start between 50-90%
      
      for (let i = 0; i < 12; i++) {
        // Random fluctuation but with a slight upward trend
        compliantTrend = Math.min(95, Math.max(50, compliantTrend + (Math.random() * 10 - 4)));
        const compliant = Math.round(compliantTrend);
        const nonCompliant = 100 - compliant;
        
        data.push({
          month: months[i],
          compliant,
          nonCompliant
        });
      }
      
      return data;
    };
    
    // Generate TPRM compliance data (last 12 months)
    const generateTPRMCompliance = () => {
      const data = [];
      let compliantTrend = Math.floor(Math.random() * 30) + 40; // Start between 40-70%
      
      for (let i = 0; i < 12; i++) {
        // Random fluctuation with improvement over time
        compliantTrend = Math.min(90, Math.max(40, compliantTrend + (Math.random() * 8 - 2)));
        const compliant = Math.round(compliantTrend);
        const nonCompliant = 100 - compliant;
        
        data.push({
          month: months[i],
          compliant,
          nonCompliant
        });
      }
      
      return data;
    };
    
    // Generate exception trends by risk level (last 12 months)
    const generateExceptionTrends = () => {
      const data = [];
      
      for (let i = 0; i < 12; i++) {
        data.push({
          month: months[i],
          critical: Math.floor(Math.random() * 8) + 1,
          high: Math.floor(Math.random() * 15) + 5,
          medium: Math.floor(Math.random() * 25) + 15,
          low: Math.floor(Math.random() * 20) + 10
        });
      }
      
      return data;
    };
    
    // Generate expired vendors
    const generateExpiredVendors = () => {
      const vendors = [
        'TechCorp Systems', 'SecureNet Solutions', 'CloudScale Inc.', 
        'DataFlow Analytics', 'NetGuard Security', 'InfraTech Solutions',
        'DevOps Pro', 'ServerHost Inc.', 'AgileSoft Development',
        'GlobalNet Services', 'CyberShield Protection', 'DataCenter Pro'
      ];
      
      const expiredVendors = [];
      const now = new Date('2025-04-08');
      
      // Get a random past date
      const getRandomPastDate = (maxDaysAgo) => {
        const daysAgo = Math.floor(Math.random() * maxDaysAgo) + 1;
        const pastDate = new Date(now);
        pastDate.setDate(pastDate.getDate() - daysAgo);
        return pastDate.toISOString().split('T')[0];
      };
      
      // Random selection of vendors as expired
      const selectedVendors = new Set();
      while (selectedVendors.size < 7) {
        const randomIndex = Math.floor(Math.random() * vendors.length);
        selectedVendors.add(vendors[randomIndex]);
      }
      
      Array.from(selectedVendors).forEach(vendor => {
        expiredVendors.push({
          name: vendor,
          expiryDate: getRandomPastDate(60)
        });
      });
      
      // Sort by expiry date (most recent first)
      return expiredVendors.sort((a, b) => new Date(b.expiryDate) - new Date(a.expiryDate));
    };
    
    // Generate standard compliance data
    const generateStandardCompliance = () => {
      return {
        iso27001: {
          compliant: Math.floor(Math.random() * 30) + 60, // 60-90%
          nonCompliant: 0 // will be calculated as 100 - compliant
        },
        pcidss: {
          compliant: Math.floor(Math.random() * 30) + 50, // 50-80%
          nonCompliant: 0 // will be calculated as 100 - compliant
        }
      };
    };
    
    // Finalize the data
    const standardCompliance = generateStandardCompliance();
    standardCompliance.iso27001.nonCompliant = 100 - standardCompliance.iso27001.compliant;
    standardCompliance.pcidss.nonCompliant = 100 - standardCompliance.pcidss.compliant;
    
    return {
      complianceHistory: generateComplianceHistory(),
      tprmCompliance: generateTPRMCompliance(),
      expiredVendors: generateExpiredVendors(),
      exceptionTrends: generateExceptionTrends(),
      standardCompliance
    };
  };
  