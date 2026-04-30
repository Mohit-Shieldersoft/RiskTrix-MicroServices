// Mock data generator for EOSL page

export const generateMockEOSLData = () => {
    // Owner names
    const owners = [
      'John Smith', 'Emily Johnson', 'Michael Wilson', 
      'Sarah Brown', 'David Miller', 'Jennifer Davis',
      'Robert Taylor', 'Jessica Anderson', 'Thomas Martinez'
    ];
    
    // Asset types
    const assetTypes = [
      'Server', 'Network Switch', 'Database', 'Firewall',
      'Router', 'Storage Array', 'Load Balancer', 'Workstation',
      'Virtual Machine', 'Container Host', 'VPN Gateway', 'Backup System'
    ];
    
    // EOSL types
    const eoslTypes = ['EOS', 'EOL'];
    
    // Remark templates
    const remarkTemplates = [
      'Needs immediate attention, critical system.',
      'Plan replacement within next quarter.',
      'Migration in progress to new system.',
      'Vendor extended support available.',
      'Using custom support contract.',
      'Replacement budgeted for next year.',
      'Isolated from network as security measure.',
      'Maintaining internal support capabilities.',
      'Part of legacy system being phased out.',
      'Replacement hardware on order.'
    ];
    
    // Generate random assets
    const generateAssets = (count) => {
      const assets = [];
      
      for (let i = 0; i < count; i++) {
        const ownerIndex = Math.floor(Math.random() * owners.length);
        const assetTypeIndex = Math.floor(Math.random() * assetTypes.length);
        const eoslType = eoslTypes[Math.floor(Math.random() * eoslTypes.length)];
        const remarkIndex = Math.floor(Math.random() * remarkTemplates.length);
        
        // Generate a random date within the next 2 years
        const today = new Date();
        const maxDays = 730; // 2 years
        const randomDays = Math.floor(Math.random() * maxDays);
        const date = new Date();
        date.setDate(today.getDate() + randomDays);
        const formattedDate = date.toISOString().split('T')[0];
        
        // Determine if reminder has been sent (30% chance)
        const reminderSent = Math.random() < 0.3;
        
        assets.push({
          id: `ASSET-${i + 1}`,
          owner: owners[ownerIndex],
          assetName: `${assetTypes[assetTypeIndex]} ${i + 1}`,
          eoslType,
          date: formattedDate,
          remark: remarkTemplates[remarkIndex],
          reminderSent,
          daysUntil: randomDays
        });
      }
      
      // Sort by date (closest first)
      return assets.sort((a, b) => a.daysUntil - b.daysUntil);
    };
    
    // Generate top non-compliant assets
    const generateTopNonCompliantAssets = () => {
      const nonCompliantAssets = [];
      
      // Use a subset of asset types for the top non-compliant
      const shuffledAssetTypes = [...assetTypes].sort(() => 0.5 - Math.random());
      const topAssetTypes = shuffledAssetTypes.slice(0, 4);
      
      for (let i = 0; i < 4; i++) {
        const assetType = topAssetTypes[i];
        const count = Math.floor(Math.random() * 25) + 5; // 5-30 assets
        
        nonCompliantAssets.push({
          name: assetType,
          count
        });
      }
      
      // Sort by count (highest first)
      return nonCompliantAssets.sort((a, b) => b.count - a.count);
    };
    
    // Generate compliance data by year
    const generateComplianceByYear = () => {
      const years = ['2023', '2024', '2025', '2026'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const complianceByYear = {};
      
      years.forEach(year => {
        const yearlyData = [];
        let compliantTrend = 65 + Math.floor(Math.random() * 10); // Start between 65-75%
        
        for (let i = 0; i < 12; i++) {
          // Add some randomness but with a general upward trend
          compliantTrend = Math.min(95, Math.max(50, compliantTrend + (Math.random() * 8 - 3)));
          const compliant = Math.round(compliantTrend);
          const nonCompliant = 100 - compliant;
          
          yearlyData.push({
            month: months[i],
            compliant,
            nonCompliant
          });
        }
        
        complianceByYear[year] = yearlyData;
      });
      
      return complianceByYear;
    };
    
    // Generate all assets
    const assets = generateAssets(20);
    
    // Count EOS and EOL assets
    const eosCount = assets.filter(asset => asset.eoslType === 'EOS').length;
    const eolCount = assets.filter(asset => asset.eoslType === 'EOL').length;
    
    return {
      assets,
      topNonCompliantAssets: generateTopNonCompliantAssets(),
      complianceByYear: generateComplianceByYear(),
      summary: {
        eosCount,
        eolCount,
        totalAssets: assets.length
      },
      currentDateTime: "2025-04-18 09:43:53",
      currentUser: "SarthakDeb"
    };
  };