// Mock data generation for AppHistory page
export const generateMockData = (year) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const categories = ['IT', 'Finance', 'HR', 'Marketing', 'Operations', 'Customer Service'];
    
    // Generate monthly trend data
    const monthlyTrends = months.map((month, index) => {
      // Create a realistic trend with seasonal patterns
      const baseOpen = Math.floor(Math.random() * 20) + 10;
      const baseClosed = Math.floor(Math.random() * 15) + 5;
      
      // Add some seasonal patterns and trends
      const seasonFactor = Math.sin((index / 11) * Math.PI) * 8;
      const trendFactor = (index / 11) * 5; // Upward trend throughout the year
      
      return {
        month,
        quarter: Math.floor(index / 3) + 1,
        open: Math.max(0, Math.round(baseOpen + seasonFactor + trendFactor)),
        closed: Math.max(0, Math.round(baseClosed + seasonFactor - 2 + trendFactor * 1.2)),
      };
    });
    
    // Generate yearly trends data (simulating multiple years)
    const yearlyTrends = [
      {
        year: year - 2,
        critical: Math.floor(Math.random() * 15) + 5,
        high: Math.floor(Math.random() * 25) + 15,
        medium: Math.floor(Math.random() * 30) + 20,
        low: Math.floor(Math.random() * 40) + 30,
      },
      {
        year: year - 1,
        critical: Math.floor(Math.random() * 18) + 8,
        high: Math.floor(Math.random() * 28) + 18,
        medium: Math.floor(Math.random() * 35) + 25,
        low: Math.floor(Math.random() * 45) + 35,
      },
      {
        year: year,
        critical: Math.floor(Math.random() * 20) + 10,
        high: Math.floor(Math.random() * 30) + 20,
        medium: Math.floor(Math.random() * 40) + 30,
        low: Math.floor(Math.random() * 50) + 40,
      },
    ];
    
    // Generate category data
    const categoryData = categories.map(category => {
      return {
        category,
        critical: Math.floor(Math.random() * 15) + 3,
        high: Math.floor(Math.random() * 25) + 10,
        medium: Math.floor(Math.random() * 35) + 15,
        low: Math.floor(Math.random() * 45) + 20,
      };
    });
    
    // Generate application list
    const applications = Array.from({ length: 15 }, (_, i) => ({
      id: `APP-${i + 1}`,
      name: `Application ${i + 1}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      vulnerabilities: {
        critical: Math.floor(Math.random() * 5),
        high: Math.floor(Math.random() * 10) + 2,
        medium: Math.floor(Math.random() * 15) + 5,
        low: Math.floor(Math.random() * 20) + 8,
      }
    }));
    
    // Calculate totals
    const totalOpen = monthlyTrends.reduce((sum, month) => sum + month.open, 0);
    const totalClosed = monthlyTrends.reduce((sum, month) => sum + month.closed, 0);
    
    return {
      monthlyTrends,
      yearlyTrends,
      categoryData,
      applications,
      totalOpen,
      totalClosed
    };
  };