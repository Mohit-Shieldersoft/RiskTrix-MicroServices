"""Render RiskTrix by Shieldersoft reports as real PDF bytes."""

from __future__ import annotations

from datetime import datetime
from io import BytesIO
from typing import Any, Dict, Optional

from app.services.report_template import (
    BRAND,
    CLASSIFICATION,
    REPORT_META,
    VENDOR,
    _as_rows,
    _highlights,
    _kpis,
    _preferred_columns,
    _primary_register,
    _recommendations,
    render_report_html,
)


def render_report_pdf(title: str, report_type: str, content: Dict[str, Any], meta: Optional[Dict[str, Any]] = None) -> bytes:
    html = render_report_html(title, report_type, content, meta)
    try:
        from weasyprint import HTML

        pdf = HTML(string=html).write_pdf()
        if pdf and pdf[:4] == b"%PDF":
            return pdf
    except Exception:
        pass
    return _reportlab_pdf(title, report_type, content, meta or {})


def _plain(value: Any, limit: int = 48) -> str:
    if value is None or value == "":
        return "—"
    if isinstance(value, (dict, list)):
        return str(value)[:limit]
    return str(value)[:limit]


def _reportlab_pdf(title: str, report_type: str, content: Dict[str, Any], meta: Dict[str, Any]) -> bytes:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_LEFT
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.platypus import (
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
        KeepTogether,
    )

    info = REPORT_META.get(report_type, REPORT_META["EXECUTIVE"])
    report_id = str(meta.get("reportId") or "draft")
    doc_ref = f"RTX-{report_type[:3]}-{report_id[:8].upper()}"
    generated = str(content.get("generatedAt") or content.get("generated_at") or datetime.utcnow().isoformat())[:19].replace("T", " ")
    org = meta.get("organizationName") or "RiskTrix tenant"
    prepared = meta.get("generatedByEmail") or "RiskTrix Platform"
    indigo = colors.HexColor("#3f51b5")
    indigo_dark = colors.HexColor("#283593")
    ink = colors.HexColor("#1a237e")
    muted = colors.HexColor("#64748b")

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=18 * mm,
        bottomMargin=16 * mm,
        title=title,
        author=f"{BRAND} by {VENDOR}",
    )
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="Brand", fontName="Helvetica-Bold", fontSize=11, textColor=colors.white, spaceAfter=6))
    styles.add(ParagraphStyle(name="CoverTitle", fontName="Helvetica-Bold", fontSize=20, textColor=colors.white, leading=24, spaceAfter=6))
    styles.add(ParagraphStyle(name="CoverMeta", fontName="Helvetica", fontSize=9, textColor=colors.white, leading=13))
    styles.add(ParagraphStyle(name="H", fontName="Helvetica-Bold", fontSize=12, textColor=ink, spaceBefore=10, spaceAfter=6))
    styles.add(ParagraphStyle(name="Body", fontName="Helvetica", fontSize=9, textColor=colors.HexColor("#334155"), leading=13, alignment=TA_LEFT))
    styles.add(ParagraphStyle(name="Muted", fontName="Helvetica", fontSize=8, textColor=muted, leading=11))
    styles.add(ParagraphStyle(name="Cell", fontName="Helvetica", fontSize=7.5, textColor=colors.HexColor("#334155"), leading=10))

    story = []
    cover = Table(
        [
            [Paragraph(CLASSIFICATION, styles["CoverMeta"])],
            [Paragraph(f"{BRAND} by {VENDOR}", styles["Brand"])],
            [Paragraph(_plain(title, 90), styles["CoverTitle"])],
            [Paragraph(info["label"], styles["CoverMeta"])],
            [Paragraph(
                f"<b>Organization</b> {org}<br/><b>Document</b> {doc_ref}<br/><b>Generated</b> {generated}<br/>"
                f"<b>Prepared by</b> {prepared}<br/><b>Audience</b> {info['audience']}",
                styles["CoverMeta"],
            )],
        ],
        colWidths=[doc.width],
    )
    cover.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), indigo_dark),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, 0), 14),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 14),
        ("TOPPADDING", (0, 1), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -2), 4),
        ("BOX", (0, 0), (-1, -1), 0, indigo),
    ]))
    story.append(cover)
    story.append(Spacer(1, 12))
    story.append(Paragraph("Purpose", styles["H"]))
    story.append(Paragraph(info["purpose"], styles["Body"]))
    story.append(Paragraph("Key performance indicators", styles["H"]))
    kpis = _kpis(content)
    kpi_row = [[Paragraph(f"<b>{_plain(value)}</b><br/><font size='7'>{label}</font>", styles["Cell"]) for label, value, _hint in kpis[:3]]]
    kpi_row2 = [[Paragraph(f"<b>{_plain(value)}</b><br/><font size='7'>{label}</font>", styles["Cell"]) for label, value, _hint in kpis[3:6]]]
    for rows in (kpi_row, kpi_row2):
        table = Table(rows, colWidths=[doc.width / 3.0] * 3)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f7f8fd")),
            ("BOX", (0, 0), (-1, -1), 0.4, colors.HexColor("#e0e4f0")),
            ("INNERGRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#e0e4f0")),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(table)
        story.append(Spacer(1, 6))

    story.append(Paragraph("Highlights", styles["H"]))
    for item in _highlights(content, report_type):
        story.append(Paragraph(f"• {_plain(item, 220)}", styles["Body"]))

    section_title, rows = _primary_register(content)
    columns = _preferred_columns(rows)
    story.append(Paragraph(section_title, styles["H"]))
    if not rows or not columns:
        story.append(Paragraph("No records in this register for the current tenant scope.", styles["Muted"]))
    else:
        header = [Paragraph(col.replace("_", " ").title(), styles["Cell"]) for col in columns]
        data = [header]
        for row in rows[:40]:
            data.append([Paragraph(_plain(row.get(col), 36), styles["Cell"]) for col in columns])
        widths = [doc.width / len(columns)] * len(columns)
        grid = Table(data, colWidths=widths, repeatRows=1)
        grid.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), indigo),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("BACKGROUND", (0, 1), (-1, -1), colors.white),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8f9fc")]),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e8eaf2")),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(grid)

    extras = (("topRiskyAssets", "Top risky assets"),)
    for key, label in extras:
        extra = _as_rows(content.get(key))
        if extra and extra is not rows:
            story.append(Paragraph(label, styles["H"]))
            cols = _preferred_columns(extra)[:5]
            header = [Paragraph(col.replace("_", " ").title(), styles["Cell"]) for col in cols]
            data = [header] + [[Paragraph(_plain(row.get(col), 32), styles["Cell"]) for col in cols] for row in extra[:12]]
            grid = Table(data, colWidths=[doc.width / max(len(cols), 1)] * max(len(cols), 1))
            grid.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), indigo),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e8eaf2")),
                ("FONTSIZE", (0, 0), (-1, -1), 7),
            ]))
            story.append(KeepTogether(grid))

    story.append(Paragraph("Recommended actions", styles["H"]))
    for item in _recommendations(content):
        story.append(Paragraph(f"• {_plain(item, 220)}", styles["Body"]))
    story.append(Paragraph("Methodology", styles["H"]))
    story.append(Paragraph(
        "RiskTrix aggregates cloud posture, identity, workload, alert, and application registers already present "
        "in the platform. Empty tenants stay empty. No synthetic CVE, exploit, or score data is invented for this export.",
        styles["Muted"],
    ))
    story.append(Spacer(1, 10))
    story.append(Paragraph(f"© {datetime.utcnow().year} {VENDOR}. {BRAND} security and governance report.  {doc_ref}", styles["Muted"]))

    def _footer(canvas, _doc):
        canvas.saveState()
        canvas.setFillColor(indigo)
        canvas.rect(0, A4[1] - 8, A4[0], 8, fill=1, stroke=0)
        canvas.setFillColor(muted)
        canvas.setFont("Helvetica", 7)
        canvas.drawString(16 * mm, 8 * mm, f"{BRAND} by {VENDOR}")
        canvas.drawRightString(A4[0] - 16 * mm, 8 * mm, f"{doc_ref}   {canvas.getPageNumber()}")
        canvas.restoreState()

    doc.build(story, onFirstPage=_footer, onLaterPages=_footer)
    return buffer.getvalue()
