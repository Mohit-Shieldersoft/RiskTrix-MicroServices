import React from "react";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { PageSection, EmptyState } from "./PageShell";

const NoCloudWorkspace = ({
  title = "No cloud account connected",
  message = "Connect an AWS, Azure, or GCP account to run discovery, posture scans, and compliance assessments. Real tenants stay empty until credentials are added.",
}) => {
  const navigate = useNavigate();
  return (
    <PageSection>
      <EmptyState
        title={title}
        message={message}
        action={
          <Button variant="contained" onClick={() => navigate("/cloud")}>
            Connect cloud account
          </Button>
        }
      />
    </PageSection>
  );
};

export default NoCloudWorkspace;
