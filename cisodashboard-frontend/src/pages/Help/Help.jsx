import React from "react";
import { Card, CardContent, Grid, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import PageShell from "../../components/common/PageShell";

const STEPS = [
  { title: "Connect a cloud account", path: "/cloud", text: "Onboard AWS, Azure, or GCP with read-only audit credentials." },
  { title: "Discover assets", path: "/assets", text: "Run discovery, then inspect relationships and history." },
  { title: "Review findings", path: "/findings", text: "Assign, suppress, or follow the CLI/Terraform/console playbook." },
  { title: "Analyze identities", path: "/ciem", text: "Run CIEM analysis and resize over-privileged roles." },
  { title: "Scan workloads", path: "/kubernetes", text: "Audit clusters, container images, and runtime feeds." },
  { title: "Search everything", path: "/search", text: "Use Ctrl+K or Global Search to jump across modules." },
];

const Help = () => {
  const navigate = useNavigate();
  return (
    <PageShell title="Documentation" subtitle="How to operate RiskTrix CNAPP modules. This is product guidance, not a copy of third-party docs.">
      <Grid container spacing={2}>
        {STEPS.map((item, idx) => (
          <Grid item xs={12} md={6} key={item.path}>
            <Card>
              <CardContent>
                <Typography variant="overline">Step {idx + 1}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{item.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>{item.text}</Typography>
                <Button onClick={() => navigate(item.path)}>Open</Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </PageShell>
  );
};

export default Help;
