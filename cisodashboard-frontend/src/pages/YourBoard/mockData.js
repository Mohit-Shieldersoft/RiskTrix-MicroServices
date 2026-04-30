export const generateYourBoardData = () => {
    return {
      lastUpdated: '2025-05-08 06:22:25',
      currentUser: 'SarthakDeb',
      metrics: [
        {
          title: 'App Track',
          count: 16,
          unit: 'vuln',
          trend: 8,
          trendDirection: 'up',
          trendPeriod: 'This month'
        },
        {
          title: 'Infra Track',
          count: '32',
          unit: 'vuln',
          trend: 16,
          trendDirection: 'down',
          trendPeriod: 'This month'
        },
        {
          title: 'Audit Track',
          count: 26,
          unit: 'NC',
          trend: 3,
          trendDirection: 'up',
          trendPeriod: 'This month'
        },
        {
          title: 'Exceptions',
          count: 15,
          unit: 'cases',
          trend: 8,
          trendDirection: 'up',
          trendPeriod: 'this month'
        }
      ],
      intelligenceItems: [
        {
          text: 'CVE-2023-20045 impacts on your 4 assets',
          severity: 'high'
        },
        {
          text: '10 new ISO & 3 new IoT discovery',
          severity: 'medium'
        },
        {
          text: 'APT35 attacks on Japan',
          severity: 'warning'
        },
        {
          severity: 'high',
          text: 'Critical zero-day vulnerability discovered in Apache Log4j affecting production systems',
          date: 'May 6, 2025'
        },
        {
          severity: 'low',
          text: 'New compliance requirements for financial data processing will be effective next quarter',
          date: 'May 4, 2025'
        }
      ],
      securityTech: [
        { 
          name: 'DLP', 
          score: 78, 
          status: 'Healthy',
          assets: [
            { name: 'Server-DLP-01', type: 'server', status: 'active', lastUpdated: '2025-05-07', health: 85 },
            { name: 'Gateway-DLP-Main', type: 'network', status: 'active', lastUpdated: '2025-05-06', health: 92 },
            { name: 'Mail-Gateway', type: 'server', status: 'active', lastUpdated: '2025-05-04', health: 78 },
            { name: 'SharePoint-DLP', type: 'server', status: 'pending', lastUpdated: '2025-05-01', health: 65 }
          ]
        },
        { 
          name: 'AV', 
          score: 92, 
          status: 'Optimal',
          assets: [
            { name: 'DC-AV-01', type: 'server', status: 'active', lastUpdated: '2025-05-08', health: 95 },
            { name: 'Endpoint-AV-Mgr', type: 'endpoint', status: 'active', lastUpdated: '2025-05-07', health: 97 },
            { name: 'VDI-AV-Manager', type: 'server', status: 'active', lastUpdated: '2025-05-07', health: 89 },
            { name: 'Mobile-AV-Gateway', type: 'network', status: 'active', lastUpdated: '2025-05-05', health: 92 }
          ]
        },
        { 
          name: 'EDR', 
          score: 65, 
          status: 'Attention Needed',
          assets: [
            { name: 'EDR-Central-01', type: 'server', status: 'active', lastUpdated: '2025-05-06', health: 72 },
            { name: 'EDR-Collector', type: 'server', status: 'active', lastUpdated: '2025-05-05', health: 68 },
            { name: 'EDR-Analyzer', type: 'server', status: 'pending', lastUpdated: '2025-05-01', health: 58 },
            { name: 'EDR-Response', type: 'endpoint', status: 'expired', lastUpdated: '2025-04-15', health: 45 }
          ]
        },
        { 
          name: 'SIEM', 
          score: 84, 
          status: 'Good',
          assets: [
            { name: 'SIEM-Central', type: 'server', status: 'active', lastUpdated: '2025-05-08', health: 88 },
            { name: 'SIEM-Collector-01', type: 'server', status: 'active', lastUpdated: '2025-05-07', health: 90 },
            { name: 'SIEM-Collector-02', type: 'server', status: 'active', lastUpdated: '2025-05-06', health: 87 },
            { name: 'Log-Aggregator', type: 'network', status: 'active', lastUpdated: '2025-05-05', health: 82 }
          ]
        },
        { 
          name: 'Asset Management', 
          score: 92, 
          status: 'Optimal',
          assets: [
            { name: 'Core-Router-01', type: 'network', status: 'active', lastUpdated: '2025-05-08', health: 94 },
            { name: 'DMZ-Firewall', type: 'network', status: 'active', lastUpdated: '2025-05-07', health: 95 },
            { name: 'Load-Balancer-Prod', type: 'network', status: 'active', lastUpdated: '2025-05-06', health: 89 },
            { name: 'Datacenter-Switch', type: 'network', status: 'warning', lastUpdated: '2025-05-04', health: 78 }
          ]
        }
      ],
      generalUpdates: [
        {
          title: "Critical Vuln on APP-32",
          description: "Critical vulnerability was closed on APP-32 web application on 28th March after emergency patching.",
          date: "28 Mar",
          status: "Completed",
          tags: ["Web App", "Critical", "Patched"],
          highlight: "Response time: 4 hours from detection to resolution"
        },
        {
          title: "3 Vendor Compliance Reviews",
          description: "3 vendors submitted their annual certification artifacts for ISO 27001 compliance review.",
          date: "1 May",
          status: "In Progress",
          tags: ["Vendor", "Compliance", "ISO 27001"]
        },
        {
          title: "5 Exception Requests",
          description: "5 new security exception requests were captured and are awaiting your approval.",
          date: "Today",
          status: "Pending",
          tags: ["Exception", "Review Required"],
          highlight: "2 exceptions are high priority and require immediate attention"
        },
        {
          title: "Non-compliant Controller Added",
          description: "A non-compliant network controller was identified and added to the asset inventory.",
          date: "Today",
          status: "Pending",
          tags: ["Compliance", "Asset Management"]
        },
        {
          title: "New Web Applications",
          description: "2 new web applications were added to the asset inventory and are pending security assessment.",
          date: "Yesterday",
          status: "In Progress",
          tags: ["New Assets", "Assessment"]
        },
        {
          title: "End-of-life Assets",
          description: "26 assets have reached end-of-life status and require replacement planning.",
          date: "Today",
          status: "Pending",
          tags: ["EOL", "Planning Required"]
        }
      ]
    };
  };