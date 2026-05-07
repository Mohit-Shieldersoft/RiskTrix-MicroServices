import React from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import dashboardTheme from "../../theme/dashboardTheme";
import DashboardCard from "../common/DashboardCard";

// Custom tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          padding: "10px",
          border: "1px solid #ccc",
          boxShadow: dashboardTheme.shadows.tooltip,
          borderRadius: dashboardTheme.borderRadius.md,
        }}
      >
        <p
          style={{
            fontWeight: dashboardTheme.typography.fontWeights.semibold,
            marginBottom: "5px",
          }}
        >
          {label}
        </p>
        {payload.map((entry, index) => (
          <p
            key={`item-${index}`}
            style={{ color: entry.color, margin: "2px 0" }}
          >
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }

  return null;
};

const ApplicationTypeChart = ({ data }) => {
  // data = [{ type: "web_application", data: [{name, value}] }, ...]
  // Build radar subjects from unique app types, each slice = vulnerability count
  const hasData =
    data && data.length > 0 && data.some((d) => d.data && d.data.length > 0);

  if (!hasData) {
    return (
      <DashboardCard title="Open Vulnerabilities by Application Type">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: dashboardTheme.colors.text.secondary,
            fontSize: "0.9rem",
          }}
        >
          No open vulnerability data available
        </div>
      </DashboardCard>
    );
  }

  // Build one radar entry per app type: subject = type label, one key per app
  const typeLabels = {
    web_application: "Web App",
    mobile_application: "Mobile",
    api_service: "API",
    desktop_application: "Desktop",
    database: "Database",
    infrastructure: "Infra",
    third_party: "Third Party",
  };

  // Radar data: one entry per app type with vulnerabilities, value = total open vulns in that type
  const formattedData = data.map((d) => ({
    subject: typeLabels[d.type] || d.type,
    Count: (d.data || []).reduce((sum, a) => sum + (a.value || 0), 0),
  }));
  //.filter((item) => item.Count > 0); // Only show types with vulnerabilities

  return (
    <DashboardCard title="Open Vulnerabilities by Application Type">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          data={formattedData}
          margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
        >
          <PolarGrid stroke="#e0e0e0" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: dashboardTheme.colors.text.secondary, fontSize: 12 }}
          />
          <PolarRadiusAxis angle={90} domain={[0, "auto"]} />
          <Radar
            name="Open Vulnerabilities"
            dataKey="Count"
            stroke={dashboardTheme.colors.chart.internal}
            fill={dashboardTheme.colors.chart.internal}
            fillOpacity={0.6}
            animationBegin={0}
            animationDuration={1200}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            content={(props) => {
              const { payload } = props;
              return (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginTop: "10px",
                  }}
                >
                  {payload.map((entry, index) => (
                    <div
                      key={`legend-item-${index}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginRight: "10px",
                      }}
                    >
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: entry.color,
                          marginRight: "4px",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: dashboardTheme.colors.text.secondary,
                        }}
                      >
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              );
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </DashboardCard>
  );
};

export default ApplicationTypeChart;
