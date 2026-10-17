"""
Unit & Integration Test Suite for Multi-Cloud CSPM Collectors
"""
import sys
from pathlib import Path

# Add app directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.collectors import AWSCollector, AzureCollector, GCPCollector


def test_aws_collector():
    collector = AWSCollector(account_id="123456789012", region="us-east-1")
    assets, findings = collector.scan()

    assert len(assets) >= 2, "AWS Collector should return at least 2 assets"
    assert len(findings) >= 2, "AWS Collector should return at least 2 security findings"
    
    # Check asset fields
    assert any(a["asset_type"] == "STORAGE" for a in assets), "Should discover STORAGE asset"
    assert any(a["asset_type"] == "NETWORK" for a in assets), "Should discover NETWORK asset"

    # Check finding fields
    assert any(f["policy_id"] == "POL-AWS-001" for f in findings), "Should report S3 policy violation"
    print("[OK] test_aws_collector passed")


def test_azure_collector():
    collector = AzureCollector(account_id="sub-azure-9876-5432", region="eastus2")
    assets, findings = collector.scan()

    assert len(assets) >= 2, "Azure Collector should return at least 2 assets"
    assert len(findings) >= 1, "Azure Collector should return at least 1 security finding"

    assert any(a["provider"] == "AZURE" for a in assets), "Assets should belong to AZURE provider"
    assert any(f["policy_id"] == "POL-AZURE-001" for f in findings), "Should report Azure Storage HTTPS violation"
    print("[OK] test_azure_collector passed")


def test_gcp_collector():
    collector = GCPCollector(account_id="proj-gcp-dev-01", region="us-central1")
    assets, findings = collector.scan()

    assert len(assets) >= 2, "GCP Collector should return at least 2 assets"
    assert len(findings) >= 1, "GCP Collector should return at least 1 security finding"

    assert any(a["asset_type"] == "DATABASE" for a in assets), "Should discover DATABASE asset"
    assert any(f["policy_id"] == "POL-GCP-001" for f in findings), "Should report GCP Cloud SQL Public IP violation"
    print("[OK] test_gcp_collector passed")


if __name__ == "__main__":
    print("\nRunning Multi-Cloud CSPM Collector Tests...\n")
    test_aws_collector()
    test_azure_collector()
    test_gcp_collector()
    print("\n[OK] All Multi-Cloud Collector tests passed successfully!\n")
