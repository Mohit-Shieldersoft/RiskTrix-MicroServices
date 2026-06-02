// Mock data generator for Exception Tracking

export const generateMockExceptionData = () => {
    // Risk levels
    const riskLevels = ['Critical', 'High', 'Medium', 'Low'];
    
    // Approval status options
    const approvalStatuses = ['Approved', 'Rejected', 'In Progress'];
    
    // Random date within a range
    const getRandomDate = (start, end) => {
      const startDate = new Date(start).getTime();
      const endDate = new Date(end).getTime();
      const randomTime = startDate + Math.random() * (endDate - startDate);
      return new Date(randomTime).toISOString().split('T')[0];
    };
    
    // Generate random POC document name
    const getRandomPOCDocument = () => {
      const docTypes = ['PDF', 'DOCX', 'XLSX', 'PPT'];
      const docNames = [
        'Approval_Letter', 
        'Risk_Assessment', 
        'Executive_Approval',
        'Security_Review',
        'Compliance_Document',
        'Vendor_Statement',
        'Exception_Request'
      ];
      
      const randomName = docNames[Math.floor(Math.random() * docNames.length)];
      const randomType = docTypes[Math.floor(Math.random() * docTypes.length)];
      return `${randomName}_${Math.floor(Math.random() * 1000)}.${randomType}`;
    };
    
    // Generate exceptions
    const generateExceptions = (count) => {
      const exceptions = [];
      
      for (let i = 1; i <= count; i++) {
        const risk = riskLevels[Math.floor(Math.random() * riskLevels.length)];
        const approvalStatus = approvalStatuses[Math.floor(Math.random() * approvalStatuses.length)];
        
        // Set dates - start date is in the past
        const startDate = getRandomDate('2024-01-01', '2025-03-01');
        
        // For expired exceptions, set expiry date in the past
        // For active exceptions, set expiry date in the future
        const now = new Date('2025-04-04');
        const isExpired = Math.random() > 0.7; // 30% chance of being expired
        
        let expiryDate;
        if (isExpired) {
          expiryDate = getRandomDate('2024-09-01', '2025-04-03');
        } else {
          const futureDate = new Date();
          futureDate.setFullYear(now.getFullYear() + 1);
          expiryDate = getRandomDate('2025-04-05', futureDate.toISOString());
        }
        
        // Generate POC document only for approved exceptions
        const pocDocument = approvalStatus === 'Approved' ? getRandomPOCDocument() : null;
        
        exceptions.push({
          id: `EXC-${String(i).padStart(3, '0')}`,
          name: `Exception ${i}`,
          remarks: getRemarkForRisk(risk, approvalStatus, isExpired),
          startDate,
          expiryDate,
          risk,
          approvalStatus,
          pocDocument,
          isExpired
        });
      }
      
      return exceptions;
    };
    
    // Generate appropriate remarks based on risk and status
    const getRemarkForRisk = (risk, approvalStatus, isExpired) => {
      const remarksByRisk = {
        'Critical': [
          'Temporary exception due to business continuity requirements',
          'Legacy system with planned replacement in progress',
          'Production emergency requiring immediate action',
          'Compliance deadline extension requested'
        ],
        'High': [
          'Alternative controls implemented as compensating measure',
          'Vendor dependency with contractual limitations',
          'Implementation timeline extended due to technical challenges',
          'Architectural redesign in progress to address issue'
        ],
        'Medium': [
          'Limited exposure with additional monitoring in place',
          'Cost-benefit analysis favors exception over remediation',
          'External dependency with risk transfer via contract',
          'Technical limitation with acceptable risk level'
        ],
        'Low': [
          'Minimal impact on security posture',
          'Documentation exception with procedural workaround',
          'Temporary deviation from standards with limited scope',
          'Acceptable business risk with minimal technical impact'
        ]
      };
      
      // Get random remark from the appropriate risk category
      const possibleRemarks = remarksByRisk[risk];
      const baseRemark = possibleRemarks[Math.floor(Math.random() * possibleRemarks.length)];
      
      // Add status-specific information
      let statusSuffix = '';
      if (approvalStatus === 'Approved') {
        statusSuffix = isExpired ? 
          ' - Exception period has ended, review needed.' : 
          ' - Exception approved by security committee.';
      } else if (approvalStatus === 'Rejected') {
        statusSuffix = ' - Request denied, remediation required.';
      } else { // In Progress
        statusSuffix = ' - Pending security committee review.';
      }
      
      return baseRemark + statusSuffix;
    };
    
    // Generate random numbers for statistics
    const exceptionCount = Math.floor(Math.random() * 15) + 20; // 20-35 exceptions
    const exceptions = generateExceptions(exceptionCount);
    
    // Calculate statistics
    const active = exceptions.filter(e => !e.isExpired).length;
    const expired = exceptions.filter(e => e.isExpired).length;
    
    const approved = exceptions.filter(e => e.approvalStatus === 'Approved').length;
    const rejected = exceptions.filter(e => e.approvalStatus === 'Rejected').length;
    const inProgress = exceptions.filter(e => e.approvalStatus === 'In Progress').length;
    
    const critical = exceptions.filter(e => e.risk === 'Critical').length;
    const high = exceptions.filter(e => e.risk === 'High').length;
    const medium = exceptions.filter(e => e.risk === 'Medium').length;
    const low = exceptions.filter(e => e.risk === 'Low').length;
    
    // Return the full data set
    return {
      exceptions,
      stats: {
        active,
        expired,
        approved,
        rejected,
        inProgress,
        critical,
        high,
        medium,
        low
      }
    };
  };