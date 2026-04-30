// Mock data generator for Reports page

export const generateMockReportsData = () => {
    // Application categories
    const categories = [
      'Web Application', 'Mobile App', 'API', 'Database', 'Microservice',
      'Internal Tool', 'Customer Portal', 'Payment System', 'Administrative',
      'Integration Service'
    ];
    
    // Vulnerability categories
    const vulnCategories = [
      'SQL Injection', 'XSS', 'CSRF', 'Authentication Bypass', 
      'Data Leakage', 'Input Validation', 'Access Control', 
      'Insecure Configuration', 'Broken Authentication', 'Sensitive Data Exposure'
    ];
    
    // Risk levels
    const riskLevels = ['Critical', 'High', 'Medium', 'Low'];
    
    // Statuses
    const statuses = ['Open', 'Closed', 'In Progress', 'In Review'];
    
    // Vendors
    const vendors = [
      'Acme Technologies', 'SecureNet Systems', 'CloudScale Inc.',
      'TechWave Solutions', 'DataFlow Corp', 'Nexus Software',
      'GlobalSoft Systems', 'CoreTech Partners', 'InnovateTech'
    ];
    
    // Owners
    const owners = [
      'John Smith', 'Emily Johnson', 'Michael Wilson',
      'Sarah Brown', 'David Miller', 'Jennifer Davis',
      'Robert Taylor', 'Jessica Anderson', 'Thomas Martinez'
    ];
    
    // Generate random application ID
    const generateAppId = (index) => {
      return `APP-${String(index + 1).padStart(3, '0')}`;
    };
    
    // Generate random vulnerability ID
    const generateVulnId = (appIndex, vulnIndex) => {
      return `VLN-${String(appIndex + 1).padStart(3, '0')}-${String(vulnIndex + 1).padStart(3, '0')}`;
    };
    
    // Generate random description
    const generateDescription = (type, category) => {
      if (type === 'app') {
        const appDescriptions = [
          `Enterprise-grade ${category} that provides business-critical functionality for operations.`,
          `Customer-facing ${category} that handles sensitive data and interactions.`,
          `Internal ${category} used by employees for daily operations and management.`,
          `Third-party integrated ${category} that connects with multiple external systems.`,
          `Core business ${category} that supports key revenue-generating activities.`
        ];
        return appDescriptions[Math.floor(Math.random() * appDescriptions.length)];
      } else {
        const vulnDescriptions = {
          'SQL Injection': 'Vulnerability allows attackers to inject malicious SQL commands that could affect database integrity.',
          'XSS': 'Cross-site scripting vulnerability enables attackers to inject client-side scripts into web pages.',
          'CSRF': 'Cross-site request forgery vulnerability allows unauthorized commands from a trusted user.',
          'Authentication Bypass': 'Weakness in authentication mechanism allows users to gain unauthorized access.',
          'Data Leakage': 'Application unintentionally exposes sensitive information to unauthorized parties.',
          'Input Validation': 'Insufficient validation of user input can lead to various attack vectors.',
          'Access Control': 'Inadequate access control restrictions allow unauthorized access to resources.',
          'Insecure Configuration': 'System or application configuration creates security vulnerabilities.',
          'Broken Authentication': 'Implementation flaws in authentication allow account compromise.',
          'Sensitive Data Exposure': 'Application does not adequately protect sensitive information.'
        };
        return vulnDescriptions[category] || 'Security vulnerability discovered during assessment.';
      }
    };
    
    // Generate random remark
    const generateRemark = (risk, status) => {
      if (status === 'Closed') {
        return 'Vulnerability has been remediated and validated.';
      }
      
      const openRemarks = {
        'Critical': [
          'Needs immediate attention. Escalated to security team.',
          'High exposure risk. Prioritize for immediate remediation.',
          'Can lead to significant data breach if exploited.'
        ],
        'High': [
          'Schedule remediation within 14 days.',
          'Requires security team review and approval for mitigation plan.',
          'Potentially exploitable in current threat landscape.'
        ],
        'Medium': [
          'Include in next sprint for remediation.',
          'Requires standard fix within 30 days.',
          'Limited exploitation potential but should be addressed.'
        ],
        'Low': [
          'Address during regular maintenance cycle.',
          'Low priority but should be documented and tracked.',
          'Minimal risk but represents security debt.'
        ]
      };
      
      const remarks = openRemarks[risk];
      return remarks[Math.floor(Math.random() * remarks.length)];
    };
    
    // Generate applications
    const generateApplications = (count) => {
      const applications = [];
      
      for (let i = 0; i < count; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const vendor = vendors[Math.floor(Math.random() * vendors.length)];
        const owner = owners[Math.floor(Math.random() * owners.length)];
        
        // Generate 1-8 vulnerabilities per application
        const vulnerabilityCount = Math.floor(Math.random() * 8) + 1;
        const vulnerabilities = [];
        
        for (let j = 0; j < vulnerabilityCount; j++) {
          const vulnCategory = vulnCategories[Math.floor(Math.random() * vulnCategories.length)];
          const risk = riskLevels[Math.floor(Math.random() * riskLevels.length)];
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          const poc = Math.random() > 0.3 ? `remediation_plan_${i}_${j}.pdf` : null;
          
          vulnerabilities.push({
            id: generateVulnId(i, j),
            name: `${vulnCategory} Vulnerability`,
            category: vulnCategory,
            risk,
            status,
            description: generateDescription('vuln', vulnCategory),
            remark: generateRemark(risk, status),
            poc
          });
        }
        
        applications.push({
          id: generateAppId(i),
          name: `${category} ${i + 1}`,
          category,
          vendor,
          owner,
          description: generateDescription('app', category),
          vulnerabilities
        });
      }
      
      return applications;
    };
    
    // Generate all data
    const applications = generateApplications(15);
    
    // Calculate statistics
    const allVulnerabilities = applications.flatMap(app => app.vulnerabilities);
    const totalVulnerabilities = allVulnerabilities.length;
    const openVulnerabilities = allVulnerabilities.filter(v => v.status === 'Open').length;
    
    // Count vulnerabilities by risk
    const criticalCount = allVulnerabilities.filter(v => v.risk === 'Critical').length;
    const highCount = allVulnerabilities.filter(v => v.risk === 'High').length;
    const mediumCount = allVulnerabilities.filter(v => v.risk === 'Medium').length;
    const lowCount = allVulnerabilities.filter(v => v.risk === 'Low').length;
    
    return {
      applications,
      stats: {
        totalApplications: applications.length,
        totalVulnerabilities,
        openVulnerabilities,
        criticalCount,
        highCount,
        mediumCount,
        lowCount
      }
    };
  };