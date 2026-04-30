/**
 * Intelligence API utilities
 * Returns static security intelligence data (no backend required)
 */

/**
 * Fetch weekly intelligence data.
 * Returns curated static CVE/threat data — no API call needed.
 * @returns {Promise<Object>} Intelligence data with success status
 */
export const fetchWeeklyIntelligence = async () => {
  const staticItems = [
    {
      title: "CVE-2024-3094: XZ Utils Supply Chain Backdoor",
      severity: "critical",
      category: "Supply Chain",
      source: "NVD",
      publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      cveId: "CVE-2024-3094",
      cvssScore: "10.0",
    },
    {
      title: "CVE-2024-21762: Fortinet FortiOS SSL-VPN Out-of-Bound Write",
      severity: "high",
      category: "Network",
      source: "NVD",
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      cveId: "CVE-2024-21762",
      cvssScore: "9.6",
    },
    {
      title: "CVE-2024-1709: ConnectWise ScreenConnect Authentication Bypass",
      severity: "high",
      category: "Authentication",
      source: "NVD",
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      cveId: "CVE-2024-1709",
      cvssScore: "10.0",
    },
    {
      title: "CVE-2024-20353: Cisco ASA/FTD Denial of Service Vulnerability",
      severity: "medium",
      category: "Network",
      source: "NVD",
      publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      cveId: "CVE-2024-20353",
      cvssScore: "8.6",
    },
    {
      title: "CVE-2024-22024: Ivanti Connect Secure XXE Vulnerability",
      severity: "medium",
      category: "Web Application",
      source: "NVD",
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      cveId: "CVE-2024-22024",
      cvssScore: "8.3",
    },
  ];

  return {
    success: true,
    data: staticItems,
    error: null,
  };
};

/**
 * Format severity for display
 * @param {string} severity - Severity level (HIGH, MEDIUM, LOW)
 * @returns {string} Formatted severity
 */
export const formatSeverity = (severity) => {
  if (!severity) return "UNKNOWN";
  return severity.toUpperCase();
};

/**
 * Get severity color
 * @param {string} severity - Severity level
 * @returns {string} Color name for Material-UI
 */
export const getSeverityColor = (severity) => {
  const severityUpper = severity?.toUpperCase();

  switch (severityUpper) {
    case "HIGH":
      return "error";
    case "MEDIUM":
      return "warning";
    case "LOW":
      return "info";
    case "UNKNOWN":
      return "default";
    default:
      return "default";
  }
};

/**
 * Format published date
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export const formatPublishedDate = (dateString) => {
  if (!dateString) return "Unknown";

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch (error) {
    return "Unknown";
  }
};
