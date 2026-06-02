import React from "react";
import VulnerabilityStatusChart from "../VulnerabilityStatusChart/VulnerabilityStatusChart";

const AssetRiskChart = ({ data }) => {
  // ✅ FIX: guard against undefined data
  if (!data) return null;

  const formatted = [
    { name: "High", value: data.high ?? 0 },
    { name: "Medium", value: data.medium ?? 0 },
    { name: "Low", value: data.low ?? 0 },
  ];

  return <VulnerabilityStatusChart data={formatted} />;
};

export default AssetRiskChart;