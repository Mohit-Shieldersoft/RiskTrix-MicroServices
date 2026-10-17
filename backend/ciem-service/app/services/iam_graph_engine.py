try:
    import networkx as nx
    HAS_NETWORKX = True
except ImportError:
    HAS_NETWORKX = False

from typing import List, Dict, Tuple, Any
from app.schemas.ciem import IAMGraphNode, IAMGraphLink, IAMGraphTopologyResponse

# Default Graph Data
DEFAULT_NODES = [
    {"id": "user:devops-jdoe", "label": "devops-jdoe (User)", "type": "USER", "provider": "AWS", "risk_score": 8.8, "is_dormant": False},
    {"id": "role:EC2FullAccessRole", "label": "EC2FullAccessRole (Role)", "type": "ROLE", "provider": "AWS", "risk_score": 9.2, "is_dormant": False},
    {"id": "role:AdministratorAccessRole", "label": "AdministratorAccess (Role)", "type": "ROLE", "provider": "AWS", "risk_score": 10.0, "is_dormant": False},
    {"id": "user:legacy-contractor", "label": "legacy-contractor (Dormant User)", "type": "USER", "provider": "AWS", "risk_score": 9.5, "is_dormant": True},
    {"id": "role:AzureGlobalAdmin", "label": "AzureGlobalAdmin (Role)", "type": "ROLE", "provider": "AZURE", "risk_score": 9.8, "is_dormant": False},
    {"id": "svc:gcp-ci-builder", "label": "gcp-ci-builder (Service Account)", "type": "SERVICE_ACCOUNT", "provider": "GCP", "risk_score": 7.5, "is_dormant": False},
]

DEFAULT_LINKS = [
    {"source": "user:devops-jdoe", "target": "role:EC2FullAccessRole", "relationship": "CAN_ASSUME_ROLE", "is_escalation_path": False},
    {"source": "role:EC2FullAccessRole", "target": "role:AdministratorAccessRole", "relationship": "IAM_PASS_ROLE_ESCALATION", "is_escalation_path": True},
    {"source": "user:legacy-contractor", "target": "role:AdministratorAccessRole", "relationship": "STALE_ADMIN_ACCESS", "is_escalation_path": True},
    {"source": "svc:gcp-ci-builder", "target": "role:AzureGlobalAdmin", "relationship": "CROSS_CLOUD_CREDENTIAL", "is_escalation_path": True},
]


class IAMGraphEngine:
    def __init__(self):
        if HAS_NETWORKX:
            self.graph = nx.DiGraph()
        else:
            self.nodes_dict = {}
            self.edges_list = []
        if HAS_NETWORKX:
            self.graph.clear()
        else:
            self.nodes_dict = {}
            self.edges_list = []

    def _build_default_graph(self):
        # Empty until a live CIEM sync populates identities.
        self.update_graph([], [])

    def update_graph(self, nodes_data: List[Dict[str, Any]], links_data: List[Dict[str, Any]]):
        if HAS_NETWORKX:
            self.graph.clear()
            for node in nodes_data:
                self.graph.add_node(
                    node["id"],
                    label=node.get("label", node["id"]),
                    type=node.get("type", "USER"),
                    provider=node.get("provider", "AWS"),
                    risk_score=node.get("risk_score", 5.0),
                    is_dormant=node.get("is_dormant", False),
                )
            for link in links_data:
                if self.graph.has_node(link["source"]) and self.graph.has_node(link["target"]):
                    self.graph.add_edge(
                        link["source"],
                        link["target"],
                        relationship=link.get("relationship", "ASSOCIATED_WITH"),
                        is_escalation_path=link.get("is_escalation_path", False),
                    )
        else:
            self.nodes_dict = {n["id"]: n for n in nodes_data}
            self.edges_list = list(links_data)

    def get_topology(self) -> IAMGraphTopologyResponse:
        nodes = []
        links = []
        escalation_count = 0

        if HAS_NETWORKX:
            for n, data in self.graph.nodes(data=True):
                nodes.append(IAMGraphNode(
                    id=n,
                    label=data.get("label", n),
                    type=data.get("type", "USER"),
                    provider=data.get("provider", "AWS"),
                    risk_score=data.get("risk_score", 5.0),
                    is_dormant=data.get("is_dormant", False),
                ))
            for u, v, data in self.graph.edges(data=True):
                is_esc = data.get("is_escalation_path", False)
                if is_esc:
                    escalation_count += 1
                links.append(IAMGraphLink(
                    source=u,
                    target=v,
                    relationship=data.get("relationship", "ASSOCIATED_WITH"),
                    is_escalation_path=is_esc,
                ))
        else:
            for n_id, data in self.nodes_dict.items():
                nodes.append(IAMGraphNode(
                    id=n_id,
                    label=data.get("label", n_id),
                    type=data.get("type", "USER"),
                    provider=data.get("provider", "AWS"),
                    risk_score=data.get("risk_score", 5.0),
                    is_dormant=data.get("is_dormant", False),
                ))
            for edge in self.edges_list:
                is_esc = edge.get("is_escalation_path", False)
                if is_esc:
                    escalation_count += 1
                links.append(IAMGraphLink(
                    source=edge["source"],
                    target=edge["target"],
                    relationship=edge.get("relationship", "ASSOCIATED_WITH"),
                    is_escalation_path=is_esc,
                ))

        return IAMGraphTopologyResponse(
            nodes=nodes,
            links=links,
            privilege_escalation_paths_count=escalation_count,
        )


iam_graph_engine = IAMGraphEngine()

