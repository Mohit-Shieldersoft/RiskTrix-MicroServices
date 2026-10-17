"""
Multi-Cloud Collectors Package for RiskTrix CSPM Service
"""
from .aws_collector import AWSCollector
from .azure_collector import AzureCollector
from .gcp_collector import GCPCollector

__all__ = ["AWSCollector", "AzureCollector", "GCPCollector"]
