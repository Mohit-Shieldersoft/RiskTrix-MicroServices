// Mock data generator for Compliance page

export const generateMockComplianceData = () => {
    // Vendor names
    const vendors = [
      'TechCorp Systems', 'SecureNet Solutions', 'CloudScale Inc.', 
      'DataFlow Analytics', 'NetGuard Security', 'InfraTech Solutions',
      'DevOps Pro', 'ServerHost Inc.', 'AgileSoft Development',
      'GlobalNet Services', 'CyberShield Protection', 'DataCenter Pro'
    ];
    
    // Generate sections for PCI DSS v4
    const generatePCIDSSSections = () => {
      return [
        { id: 'C1', name: 'Install and maintain network security controls' },
        { id: 'C2', name: 'Apply secure configurations to all system components' },
        { id: 'C3', name: 'Protect stored account data' },
        { id: 'C4', name: 'Protect cardholder data with strong cryptography during transmission' },
        { id: 'C5', name: 'Protect all systems and networks from malicious software' },
        { id: 'C6', name: 'Develop and maintain secure systems and software' },
        { id: 'C7', name: 'Restrict access to system components and cardholder data by business need to know' },
        { id: 'C8', name: 'Identify users and authenticate access to system components' },
        { id: 'C9', name: 'Restrict physical access to cardholder data' },
        { id: 'C10', name: 'Log and monitor all access to system components and cardholder data' },
        { id: 'C11', name: 'Test security of systems and networks regularly' },
        { id: 'C12', name: 'Support information security with organizational policies and programs' }
      ];
    };
    
    // Generate sections for ISO 27001
    const generateISO27001Sections = () => {
      return [
        { id: 'A5', name: 'Information security policies' },
        { id: 'A6', name: 'Organization of information security' },
        { id: 'A7', name: 'Human resource security' },
        { id: 'A8', name: 'Asset management' },
        { id: 'A9', name: 'Access control' },
        { id: 'A10', name: 'Cryptography' },
        { id: 'A11', name: 'Physical and environmental security' },
        { id: 'A12', name: 'Operations security' },
        { id: 'A13', name: 'Communications security' },
        { id: 'A14', name: 'System acquisition, development and maintenance' },
        { id: 'A15', name: 'Supplier relationships' },
        { id: 'A16', name: 'Information security incident management' },
        { id: 'A17', name: 'Information security aspects of business continuity management' },
        { id: 'A18', name: 'Compliance' }
      ];
    };
    
    // Generate controls for PCI DSS v4
    const generatePCIDSSControls = (sectionId) => {
      const controlsData = {
        'C1': [
          { id: 'C1.1', statement: 'Processes and mechanisms for installing and maintaining network security controls are defined and understood.' },
          { id: 'C1.2', statement: 'Network security controls (NSCs) are installed and operational between trusted and untrusted networks.' },
          { id: 'C1.3', statement: 'Network access to and from the cardholder data environment is restricted.' },
          { id: 'C1.4', statement: 'NSC configurations are reviewed at least once every six months.' },
          { id: 'C1.5', statement: 'NSC configuration standards are consistent with industry-accepted system hardening standards.' }
        ],
        'C2': [
          { id: 'C2.1', statement: 'Processes and mechanisms for applying secure configurations to all system components are defined and understood.' },
          { id: 'C2.2', statement: 'System configuration standards are developed, implemented, and maintained.' },
          { id: 'C2.3', statement: 'System configurations, including security settings and parameters, are defined, documented, and deployed.' }
        ],
        'C3': [
          { id: 'C3.1', statement: 'Processes and mechanisms for protecting stored account data are defined and understood.' },
          { id: 'C3.2', statement: 'Storage of account data is kept to a minimum.' },
          { id: 'C3.3', statement: 'Sensitive authentication data (SAD) is not stored after authorization.' },
          { id: 'C3.4', statement: 'PAN is masked when displayed.' },
          { id: 'C3.5', statement: 'Access to displays of full PAN and ability to copy PAN is restricted.' },
          { id: 'C3.6', statement: 'PAN is rendered unreadable anywhere it is stored.' },
          { id: 'C3.7', statement: 'Cryptographic keys used to protect stored account data are secured.' }
        ]
      };
      
      return controlsData[sectionId] || [];
    };
    
    // Generate controls for ISO 27001
    const generateISO27001Controls = (sectionId) => {
      const controlsData = {
        'A5': [
          { id: 'A5.1.1', statement: 'Information security policies are defined and approved by management.' },
          { id: 'A5.1.2', statement: 'Information security policies are reviewed at planned intervals or when significant changes occur.' }
        ],
        'A6': [
          { id: 'A6.1.1', statement: 'Information security roles and responsibilities are defined and allocated.' },
          { id: 'A6.1.2', statement: 'Conflicting duties and areas of responsibility are segregated.' },
          { id: 'A6.1.3', statement: 'Appropriate contacts with relevant authorities are maintained.' },
          { id: 'A6.1.4', statement: 'Appropriate contacts with special interest groups or other specialist security forums and professional associations are maintained.' },
          { id: 'A6.1.5', statement: 'Information security is addressed in project management.' }
        ],
        'A7': [
          { id: 'A7.1.1', statement: 'Screening is undertaken for candidates for employment in accordance with relevant laws, regulations and ethics.' },
          { id: 'A7.1.2', statement: 'The terms and conditions of employment include information security responsibilities.' },
          { id: 'A7.2.1', statement: 'Management requires all employees and contractors to apply information security in accordance with established policies and procedures of the organization.' },
          { id: 'A7.2.2', statement: 'All employees and contractors receive appropriate information security awareness education and training and regular updates in organizational policies and procedures.' },
          { id: 'A7.2.3', statement: 'There is a formal and communicated disciplinary process to take action against employees who have committed an information security breach.' }
        ]
      };
      
      return controlsData[sectionId] || [];
    };
    
    // Generate random vendor data for a standard
    const generateVendorsForStandard = (standard) => {
      const vendorList = [];
      const sections = standard === 'PCIDSS_V4' ? generatePCIDSSSections() : generateISO27001Sections();
      
      // Shuffle vendor names to randomize assignment
      const shuffledVendors = [...vendors].sort(() => 0.5 - Math.random());
      
      // Generate 8 random vendors for this standard
      for (let i = 0; i < 8; i++) {
        const vendorName = shuffledVendors[i];
        const vendorControls = [];
        
        // For each section, add controls
        sections.forEach(section => {
          const sectionControls = standard === 'PCIDSS_V4' 
            ? generatePCIDSSControls(section.id)
            : generateISO27001Controls(section.id);
          
          // Add random compliance status for each control
          sectionControls.forEach(control => {
            // 70% chance of being compliant
            const isCompliant = Math.random() > 0.3;
            const remark = isCompliant 
              ? 'Control implemented according to requirements.'
              : 'Implementation in progress. Expected completion by next quarter.';
            
            vendorControls.push({
              ...control,
              section: section.id,
              compliant: isCompliant,
              remark,
              poc: isCompliant ? `poc_${section.id}_${control.id.replace('.', '_')}.pdf` : null
            });
          });
        });
        
        // Calculate compliance metrics
        const compliantControls = vendorControls.filter(c => c.compliant).length;
        const nonCompliantControls = vendorControls.length - compliantControls;
        const complianceRate = Math.round((compliantControls / vendorControls.length) * 100);
        
        // Generate random dates
        const lastAuditDate = getRandomPastDate(180);
        const hasExpiry = Math.random() > 0.3; // 70% chance of having an expiry date
        const expiryDate = hasExpiry ? getRandomFutureDate(365) : null;
        
        vendorList.push({
          id: `VDR-${standard}-${i + 1}`,
          name: vendorName,
          standard,
          controls: vendorControls,
          controlSections: sections,
          compliantControls,
          nonCompliantControls,
          complianceRate,
          lastAuditDate,
          expiryDate
        });
      }
      
      return vendorList;
    };
    
    // Helper function to generate a random past date
    const getRandomPastDate = (maxDaysAgo) => {
      const today = new Date();
      const daysAgo = Math.floor(Math.random() * maxDaysAgo) + 1;
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - daysAgo);
      return pastDate.toISOString().split('T')[0];
    };
    
    // Helper function to generate a random future date
    const getRandomFutureDate = (maxDaysAhead) => {
      const today = new Date();
      const daysAhead = Math.floor(Math.random() * maxDaysAhead) + 30; // At least 30 days ahead
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + daysAhead);
      return futureDate.toISOString().split('T')[0];
    };
    
    // Generate data for both standards
    const pcidssVendors = generateVendorsForStandard('PCIDSS_V4');
    const iso27001Vendors = generateVendorsForStandard('ISO_27001');
    
    // Calculate overall statistics
    const totalVendors = pcidssVendors.length + iso27001Vendors.length;
    const compliantVendors = [
      ...pcidssVendors.filter(v => v.complianceRate >= 80),
      ...iso27001Vendors.filter(v => v.complianceRate >= 80)
    ].length;
    const nonCompliantVendors = totalVendors - compliantVendors;
    
    return {
      PCIDSS_V4: {
        vendors: pcidssVendors,
        sections: generatePCIDSSSections()
      },
      ISO_27001: {
        vendors: iso27001Vendors,
        sections: generateISO27001Sections()
      },
      stats: {
        vendors: totalVendors,
        compliantVendors,
        nonCompliantVendors
      }
    };
  };