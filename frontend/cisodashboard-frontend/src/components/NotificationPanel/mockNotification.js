export const generateMockNotifications = () => {
    const currentTimestamp = new Date('2025-04-18T10:03:19').getTime();
    
    const notifications = [
      {
        id: 1,
        type: 'alert',
        title: 'Critical Vulnerability Detected',
        message: 'Critical vulnerability detected in Server 12. Immediate action required.',
        user: 'SecurityBot',
        read: false,
        timestamp: new Date(currentTimestamp - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      },
      {
        id: 2,
        type: 'update',
        title: 'Asset Reminder Sent',
        message: 'Reminder sent to Jessica Anderson about Backup System 15 approaching EOL.',
        user: 'SarthakDeb',
        read: false,
        timestamp: new Date(currentTimestamp - 25 * 60 * 1000).toISOString(), // 25 minutes ago
      },
      {
        id: 3,
        type: 'user',
        title: 'New Asset Added',
        message: 'Michael Wilson added Container Host 18 to the asset inventory.',
        user: 'Michael Wilson',
        read: false,
        timestamp: new Date(currentTimestamp - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      },
      {
        id: 4,
        type: 'update',
        title: 'Compliance Report Generated',
        message: 'Monthly compliance report for April 2025 has been generated.',
        user: 'System',
        read: true,
        timestamp: new Date(currentTimestamp - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      },
      {
        id: 5,
        type: 'alert',
        title: 'EOL Approaching',
        message: 'Server 7 will reach End of Life in 30 days. Plan for replacement.',
        user: 'ReminderService',
        read: true,
        timestamp: new Date(currentTimestamp - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      },
      {
        id: 6,
        type: 'user',
        title: 'Vendor Added to Compliance',
        message: 'Emily Johnson added TechCorp Systems to ISO 27001 compliance tracking.',
        user: 'Emily Johnson',
        read: true,
        timestamp: new Date(currentTimestamp - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      },
      {
        id: 7,
        type: 'update',
        title: 'Asset Upload Successful',
        message: 'Bulk asset upload completed successfully. 15 new assets added.',
        user: 'SarthakDeb',
        read: true,
        timestamp: new Date(currentTimestamp - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      }
    ];
    
    return notifications;
  };