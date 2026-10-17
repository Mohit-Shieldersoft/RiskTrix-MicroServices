"""Professional RiskTrix by Shieldersoft report templates."""

from __future__ import annotations

import html
from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional


BRAND = "RiskTrix"
VENDOR = "Shieldersoft"
CLASSIFICATION = "CONFIDENTIAL — INTERNAL USE ONLY"
PRIMARY = "#3f51b5"
PRIMARY_DARK = "#283593"
INK = "#1a237e"
BODY = "#334155"
MUTED = "#64748b"

REPORT_META: Dict[str, Dict[str, str]] = {
    "EXECUTIVE": {
        "label": "Executive Security Summary",
        "purpose": "Leadership-ready posture view: cloud footprint, risk concentration, and prioritized remediation.",
        "audience": "CISO, GRC leadership, and executive stakeholders",
    },
    "CLOUD_POSTURE": {
        "label": "Cloud Posture Assessment",
        "purpose": "Security score, connected accounts, and inventory scale for multi-cloud governance.",
        "audience": "Cloud architects and security engineering",
    },
    "CSPM": {
        "label": "CSPM Findings Report",
        "purpose": "Open misconfiguration findings mapped to assets, policies, and severity.",
        "audience": "Cloud security engineers and compliance analysts",
    },
    "CIEM": {
        "label": "CIEM Identity Report",
        "purpose": "Identity entitlement risks ranked for privilege reduction and MFA enforcement.",
        "audience": "IAM and identity governance teams",
    },
    "VULNERABILITY": {
        "label": "Vulnerability Management Report",
        "purpose": "Application and cloud vulnerability backlog ordered by severity for patch planning.",
        "audience": "Vulnerability management and application owners",
    },
    "COMPLIANCE": {
        "label": "Compliance Assessment Report",
        "purpose": "Framework assessment outcomes and control gaps for audit preparation.",
        "audience": "GRC, internal audit, and compliance officers",
    },
    "KUBERNETES": {
        "label": "Kubernetes Security Report",
        "purpose": "Cluster inventory and open Kubernetes findings for platform hardening.",
        "audience": "Platform engineering and SRE",
    },
    "CONTAINER": {
        "label": "Container Security Report",
        "purpose": "Registry images and container CVE exposure for supply-chain risk management.",
        "audience": "DevSecOps and release engineering",
    },
    "RUNTIME": {
        "label": "Runtime Security Report",
        "purpose": "Runtime threats and recent execution events for SOC investigation.",
        "audience": "SOC and incident response",
    },
    "ALERT": {
        "label": "Security Alerts Report",
        "purpose": "Alert queue with status and severity for triage and MTTR reporting.",
        "audience": "SOC analysts and security managers",
    },
    "ASSET_INVENTORY": {
        "label": "Asset Inventory Report",
        "purpose": "Cloud asset register with risk and compliance metadata for CMDB alignment.",
        "audience": "Asset management and security architecture",
    },
    "AUDIT": {
        "label": "Platform Audit Report",
        "purpose": "User and system activity trail for forensic review and compliance evidence.",
        "audience": "Internal audit and administrators",
    },
    "APPLICATION": {
        "label": "Application Vulnerability Report",
        "purpose": "Application portfolio findings with severity, status, and ownership for remediation tracking.",
        "audience": "Application owners, security champions, and CISO office",
    },
}


def _esc(value: Any) -> str:
    if value is None or value == "":
        return "—"
    return html.escape(str(value))


def _as_rows(value: Any) -> List[Dict[str, Any]]:
    if isinstance(value, list):
        return [item for item in value if isinstance(item, dict)]
    return []


def _severity_totals(rows: Iterable[Dict[str, Any]]) -> Dict[str, int]:
    totals = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0, "INFO": 0}
    for row in rows:
        sev = str(row.get("severity") or row.get("risk") or row.get("riskLevel") or "").upper()
        if sev in totals:
            totals[sev] += 1
        elif sev:
            totals["INFO"] += 1
    return totals


def _primary_register(content: Dict[str, Any]) -> tuple[str, List[Dict[str, Any]]]:
    for key, title in (
        ("findings", "Findings register"),
        ("vulnerabilities", "Vulnerability register"),
        ("identities", "Identity exposure"),
        ("alerts", "Security alerts"),
        ("assessments", "Compliance assessments"),
        ("clusters", "Kubernetes clusters"),
        ("images", "Container images"),
        ("threats", "Runtime threats"),
        ("events", "Runtime events"),
        ("assets", "Asset inventory"),
        ("applications", "Applications"),
        ("auditLogs", "Audit trail"),
        ("cloudAccounts", "Cloud accounts"),
    ):
        rows = _as_rows(content.get(key))
        if rows:
            return title, rows
    return "Records", []


def _preferred_columns(rows: List[Dict[str, Any]]) -> List[str]:
    preferred = [
        "severity", "risk", "status", "title", "name", "email", "type", "asset",
        "policy", "region", "provider", "riskScore", "risk_score", "framework",
        "action", "cve_id", "owner", "created_at", "id",
    ]
    keys = []
    for row in rows[:25]:
        for key in row.keys():
            if key.startswith("_") or key in ("metadata", "tags", "evidence", "details", "credentials"):
                continue
            if key not in keys:
                keys.append(key)
    ordered = [key for key in preferred if key in keys]
    for key in keys:
        if key not in ordered and len(ordered) < 7:
            ordered.append(key)
    return ordered[:7]


def _cell(value: Any) -> str:
    if value is None or value == "":
        return "—"
    if isinstance(value, (dict, list)):
        return _esc(str(value)[:80])
    return _esc(str(value)[:80])


def _kpis(content: Dict[str, Any]) -> List[tuple[str, Any, str]]:
    summary = content.get("summary") if isinstance(content.get("summary"), dict) else {}
    ops = content.get("operationalSnapshot") if isinstance(content.get("operationalSnapshot"), dict) else {}
    score = summary.get("riskScore") if summary.get("riskScore") is not None else content.get("overall_score")
    return [
        ("Posture score", score if score is not None else "—", "Composite RiskTrix index"),
        ("Cloud accounts", summary.get("totalCloudAccounts", content.get("accounts", 0)), "Connected providers"),
        ("Assets in scope", summary.get("totalAssets", content.get("assets", 0)), "Discovered inventory"),
        ("Open findings", ops.get("openFindings", content.get("open_findings", 0)), "Awaiting remediation"),
        ("Critical items", ops.get("criticalAlerts", content.get("critical", 0)), "P0 concentration"),
        ("Active alerts", ops.get("openAlerts", 0), "SOC workflow"),
    ]


def _highlights(content: Dict[str, Any], report_type: str) -> List[str]:
    stored = content.get("insights") if isinstance(content.get("insights"), dict) else {}
    if stored.get("highlights"):
        return [str(item) for item in stored["highlights"][:6]]
    title, rows = _primary_register(content)
    sev = _severity_totals(rows)
    highlights = []
    if sev["CRITICAL"] or sev["HIGH"]:
        highlights.append(
            f"{title} contains {sev['CRITICAL']} critical and {sev['HIGH']} high items that should be prioritized this cycle."
        )
    ops = content.get("operationalSnapshot") if isinstance(content.get("operationalSnapshot"), dict) else {}
    if ops.get("openFindings"):
        highlights.append(f"{ops['openFindings']} open CSPM finding(s) require remediation or accepted-risk documentation.")
    if not highlights:
        highlights.append("No critical concentration is present in this export. Maintain weekly discovery and review cadence.")
    meta = REPORT_META.get(report_type, {})
    if meta.get("purpose"):
        highlights.append(meta["purpose"])
    return highlights[:6]


def _recommendations(content: Dict[str, Any]) -> List[str]:
    recs = []
    _, rows = _primary_register(content)
    sev = _severity_totals(rows)
    if sev["CRITICAL"]:
        recs.append(f"Open a P0 workstream for {sev['CRITICAL']} critical item(s) and validate closure with evidence within 72 hours.")
    if sev["HIGH"]:
        recs.append(f"Schedule P1 hardening for {sev['HIGH']} high item(s), starting with internet-exposed and privileged resources.")
    if content.get("identities"):
        recs.append("Review CIEM risk scores, revoke unused admin paths, enforce MFA, and rotate long-lived credentials.")
    if content.get("alerts"):
        recs.append("Assign owners to open alerts and record MTTR against the SOC runbook.")
    if not recs:
        recs.append("Keep continuous discovery enabled and review this RiskTrix report in the next governance cadence.")
        recs.append("Align control evidence to CIS, NIST, and ISO obligations used by your GRC program.")
    return recs[:6]


def render_report_html(title: str, report_type: str, content: Dict[str, Any], meta: Optional[Dict[str, Any]] = None) -> str:
    meta = meta or {}
    info = REPORT_META.get(report_type, REPORT_META["EXECUTIVE"])
    generated = content.get("generatedAt") or content.get("generated_at") or datetime.utcnow().isoformat()
    report_id = str(meta.get("reportId") or "draft")
    doc_ref = f"RTX-{report_type[:3]}-{report_id[:8].upper()}"
    org = meta.get("organizationName") or "RiskTrix tenant"
    prepared = meta.get("generatedByEmail") or "RiskTrix Platform"
    highlights = _highlights(content, report_type)
    recommendations = _recommendations(content)
    kpis = _kpis(content)
    section_title, rows = _primary_register(content)
    columns = _preferred_columns(rows)
    extra_tables = []
    for key, label in (("topRiskyAssets", "Top risky assets"), ("recentActivity", "Recent platform activity"), ("events", "Supporting events")):
        extra = _as_rows(content.get(key))
        if extra and extra is not rows:
            extra_tables.append((label, extra[:20], _preferred_columns(extra)))

    kpi_html = "".join(
        f"""<div class="kpi"><div class="kpi-label">{_esc(label)}</div><div class="kpi-value">{_esc(value)}</div><div class="kpi-hint">{_esc(hint)}</div></div>"""
        for label, value, hint in kpis
    )
    highlight_html = "".join(f"<li>{_esc(item)}</li>" for item in highlights)
    rec_html = "".join(f"<li>{_esc(item)}</li>" for item in recommendations)

    def table_html(label: str, data: List[Dict[str, Any]], cols: List[str]) -> str:
        if not data or not cols:
            return f'<section class="block"><h2>{_esc(label)}</h2><p class="empty">No records in this register for the current tenant scope.</p></section>'
        head = "".join(f"<th>{_esc(col.replace('_', ' ').title())}</th>" for col in cols)
        body = []
        for row in data[:80]:
            cells = []
            for col in cols:
                raw = row.get(col)
                css = ""
                if col.lower() in ("severity", "risk") and raw:
                    css = f' class="sev {html.escape(str(raw).lower())}"'
                cells.append(f"<td{css}>{_cell(raw)}</td>")
            body.append("<tr>" + "".join(cells) + "</tr>")
        return f"""
        <section class="block">
          <h2>{_esc(label)}</h2>
          <p class="lede">First {min(len(data), 80)} of {len(data)} records included in this export.</p>
          <table><thead><tr>{head}</tr></thead><tbody>{''.join(body)}</tbody></table>
        </section>
        """

    extras = "".join(table_html(label, data, cols) for label, data, cols in extra_tables)
    generated_pretty = generated.replace("T", " ")[:19]

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>{_esc(title)} · {BRAND} by {VENDOR}</title>
  <style>
    @page {{ margin: 18mm 16mm 20mm 16mm; }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; font-family: "Segoe UI", Calibri, Arial, sans-serif; color: {BODY}; background: #eef1f8; }}
    .page {{ max-width: 920px; margin: 0 auto; background: #fff; }}
    .cover {{ background: linear-gradient(145deg, {PRIMARY_DARK} 0%, {PRIMARY} 70%, #5c6bc0 100%); color: #fff; padding: 48px 48px 36px; }}
    .eyebrow {{ letter-spacing: 0.18em; font-size: 11px; text-transform: uppercase; opacity: 0.85; }}
    .brand {{ font-size: 15px; font-weight: 700; margin-top: 10px; }}
    .brand span {{ font-weight: 400; opacity: 0.85; }}
    h1 {{ font-size: 32px; line-height: 1.2; margin: 18px 0 8px; }}
    .type {{ font-size: 14px; opacity: 0.9; }}
    .meta {{ display: grid; grid-template-columns: 180px 1fr; gap: 8px 16px; margin-top: 28px; font-size: 13px; }}
    .meta b {{ opacity: 0.7; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.04em; }}
    .notice {{ margin-top: 28px; border: 1px solid rgba(255,255,255,0.25); padding: 14px 16px; font-size: 12px; }}
    .content {{ padding: 32px 48px 48px; }}
    h2 {{ color: {INK}; font-size: 18px; margin: 0 0 8px; }}
    .lede, .empty {{ color: {MUTED}; font-size: 13px; }}
    .kpis {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0 28px; }}
    .kpi {{ border: 1px solid #e0e4f0; padding: 12px 14px; background: #f7f8fd; }}
    .kpi-label {{ font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: {MUTED}; }}
    .kpi-value {{ font-size: 22px; font-weight: 700; color: {INK}; margin: 4px 0; }}
    .kpi-hint {{ font-size: 11px; color: {MUTED}; }}
    .block {{ margin: 28px 0; }}
    ul {{ padding-left: 18px; }}
    li {{ margin: 6px 0; }}
    table {{ width: 100%; border-collapse: collapse; font-size: 12px; }}
    th {{ text-align: left; background: {PRIMARY}; color: #fff; padding: 8px; font-weight: 600; }}
    td {{ padding: 7px 8px; border-bottom: 1px solid #e8eaf2; vertical-align: top; }}
    tr:nth-child(even) td {{ background: #f8f9fc; }}
    .sev.critical {{ color: #b71c1c; font-weight: 700; }}
    .sev.high {{ color: #e65100; font-weight: 700; }}
    .sev.medium {{ color: #f9a825; font-weight: 700; }}
    .sev.low {{ color: #2e7d32; font-weight: 700; }}
    footer {{ border-top: 3px solid {PRIMARY}; padding: 12px 48px 20px; font-size: 11px; color: {MUTED}; display: flex; justify-content: space-between; }}
    @media print {{
      body {{ background: #fff; }}
      .page {{ max-width: none; }}
      .cover {{ break-after: page; }}
    }}
  </style>
</head>
<body>
  <article class="page">
    <header class="cover">
      <div class="eyebrow">{CLASSIFICATION}</div>
      <div class="brand">{BRAND} <span>by {VENDOR}</span></div>
      <h1>{_esc(title)}</h1>
      <div class="type">{_esc(info["label"])}</div>
      <div class="meta">
        <b>Organization</b><div>{_esc(org)}</div>
        <b>Document</b><div>{_esc(doc_ref)}</div>
        <b>Generated</b><div>{_esc(generated_pretty)}</div>
        <b>Prepared by</b><div>{_esc(prepared)}</div>
        <b>Audience</b><div>{_esc(info["audience"])}</div>
        <b>Classification</b><div>{CLASSIFICATION}</div>
      </div>
      <div class="notice">This document is produced by {BRAND} by {VENDOR}. Findings represent tenant-scoped live data at generation time and are not a continuous feed. Distribution is limited to authorized personnel.</div>
    </header>
    <div class="content">
      <section class="block">
        <h2>Purpose</h2>
        <p>{_esc(info["purpose"])}</p>
      </section>
      <section class="block">
        <h2>Key performance indicators</h2>
        <div class="kpis">{kpi_html}</div>
      </section>
      <section class="block">
        <h2>Highlights</h2>
        <ul>{highlight_html}</ul>
      </section>
      {table_html(section_title, rows, columns)}
      {extras}
      <section class="block">
        <h2>Recommended actions</h2>
        <ul>{rec_html}</ul>
      </section>
      <section class="block">
        <h2>Methodology</h2>
        <p class="lede">RiskTrix aggregates cloud posture, identity, workload, alert, and application registers already present in the platform. Empty tenants stay empty. No synthetic CVE, exploit, or score data is invented for this export.</p>
      </section>
    </div>
    <footer>
      <div>© {datetime.utcnow().year} {VENDOR}. {BRAND} security and governance report.</div>
      <div>{_esc(doc_ref)}</div>
    </footer>
  </article>
</body>
</html>
"""


def content_to_csv(content: Dict[str, Any]) -> str:
    _, rows = _primary_register(content)
    if not rows:
        return "id,title,status\n"
    columns = _preferred_columns(rows) or list(rows[0].keys())[:7]
    lines = [",".join(columns)]
    for row in rows:
        lines.append(",".join(_csv_cell(row.get(col)) for col in columns))
    return "\n".join(lines) + "\n"


def _csv_cell(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).replace('"', '""')
    return f'"{text}"'
