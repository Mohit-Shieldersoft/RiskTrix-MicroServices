"""
generate_pdf.py  —  RiskTrix Technical Documentation PDF
Clean, narrative, fully readable. No XML tag leakage.
"""

import re
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether,
)

# ── Colour palette ─────────────────────────────────────────────────────────────
NAVY       = colors.HexColor("#0D1B2A")
BLUE       = colors.HexColor("#1565C0")
BLUE_LT    = colors.HexColor("#1E88E5")
BLUE_PALE  = colors.HexColor("#E3F2FD")
BLUE_RULE  = colors.HexColor("#90CAF9")
TEAL       = colors.HexColor("#00838F")
TEAL_PALE  = colors.HexColor("#E0F7FA")
GREEN      = colors.HexColor("#2E7D32")
GREEN_PALE = colors.HexColor("#E8F5E9")
AMBER      = colors.HexColor("#E65100")
AMBER_PALE = colors.HexColor("#FFF3E0")
GREY_DARK  = colors.HexColor("#37474F")
GREY_MID   = colors.HexColor("#78909C")
GREY_LIGHT = colors.HexColor("#ECEFF1")
GREY_RULE  = colors.HexColor("#CFD8DC")
WHITE      = colors.white
ROW_ALT    = colors.HexColor("#F0F7FF")

PAGE_W, PAGE_H = A4
ML = 2.2 * cm
MR = 2.0 * cm
MT = 2.8 * cm
MB = 2.2 * cm
UW = PAGE_W - ML - MR

SOURCE = r"c:\Users\DELL\Documents\GitHub\RiskTrix-MicroServices\RiskTrix_Technical_Documentation.md"
OUTPUT = r"c:\Users\DELL\Documents\GitHub\RiskTrix-MicroServices\RiskTrix_Technical_Documentation.pdf"


# ── Style factory ──────────────────────────────────────────────────────────────

def P(name, **kw):
    return ParagraphStyle(name, **kw)

def styles():
    return {
        "body":      P("body",      fontName="Helvetica",      fontSize=10,   leading=16,   textColor=GREY_DARK, spaceAfter=6,  alignment=TA_JUSTIFY),
        "body_left": P("body_left", fontName="Helvetica",      fontSize=10,   leading=16,   textColor=GREY_DARK, spaceAfter=6),
        "lead":      P("lead",      fontName="Helvetica",      fontSize=11,   leading=17,   textColor=NAVY,      spaceAfter=8,  alignment=TA_JUSTIFY),
        "h2":        P("h2",        fontName="Helvetica-Bold",  fontSize=13.5, leading=18,   textColor=BLUE,      spaceBefore=16, spaceAfter=6),
        "h3":        P("h3",        fontName="Helvetica-Bold",  fontSize=11.5, leading=16,   textColor=NAVY,      spaceBefore=12, spaceAfter=4),
        "h4":        P("h4",        fontName="Helvetica-Bold",  fontSize=10.5, leading=14,   textColor=TEAL,      spaceBefore=8,  spaceAfter=3, leftIndent=6),
        "bullet":    P("bullet",    fontName="Helvetica",      fontSize=10,   leading=15,   textColor=GREY_DARK, leftIndent=16, spaceAfter=2),
        "sub_b":     P("sub_b",     fontName="Helvetica",      fontSize=9.5,  leading=14,   textColor=GREY_MID,  leftIndent=30, spaceAfter=1),
        "num":       P("num",       fontName="Helvetica",      fontSize=10,   leading=15,   textColor=GREY_DARK, leftIndent=16, spaceAfter=2),
        "mono":      P("mono",      fontName="Courier",        fontSize=8.5,  leading=13,   textColor=NAVY,      spaceAfter=0),
        "th":        P("th",        fontName="Helvetica-Bold",  fontSize=8.5,  leading=12,   textColor=WHITE),
        "td":        P("td",        fontName="Helvetica",      fontSize=8.5,  leading=12,   textColor=GREY_DARK),
        "info_title":P("info_title",fontName="Helvetica-Bold",  fontSize=10.5, leading=15,   textColor=NAVY,      spaceAfter=5),
        "info_body": P("info_body", fontName="Helvetica",      fontSize=9.5,  leading=14.5, textColor=GREY_DARK, alignment=TA_JUSTIFY),
        "ch_label":  P("ch_label",  fontName="Helvetica-Bold",  fontSize=10,   leading=13,   textColor=BLUE_LT),
        "ch_title":  P("ch_title",  fontName="Helvetica-Bold",  fontSize=19,   leading=25,   textColor=WHITE),
        "ch_desc":   P("ch_desc",   fontName="Helvetica",      fontSize=9.5,  leading=13,   textColor=BLUE_RULE),
        "cover_h":   P("cover_h",   fontName="Helvetica-Bold",  fontSize=34,   leading=42,   textColor=WHITE,     alignment=TA_CENTER),
        "cover_sub": P("cover_sub", fontName="Helvetica",      fontSize=13,   leading=19,   textColor=BLUE_RULE, alignment=TA_CENTER),
        "cover_meta":P("cover_meta",fontName="Helvetica",      fontSize=9.5,  leading=14,   textColor=GREY_MID,  alignment=TA_CENTER),
        "badge_val": P("badge_val", fontName="Helvetica-Bold",  fontSize=20,   leading=26,   textColor=BLUE_LT,   alignment=TA_CENTER),
        "badge_lbl": P("badge_lbl", fontName="Helvetica",      fontSize=8.5,  leading=12,   textColor=GREY_MID,  alignment=TA_CENTER),
        "toc_main":  P("toc_main",  fontName="Helvetica-Bold",  fontSize=10,   leading=14,   textColor=BLUE),
        "toc_sub":   P("toc_sub",   fontName="Helvetica",      fontSize=9,    leading=13,   textColor=GREY_DARK, leftIndent=14),
    }


# ── Text helpers ───────────────────────────────────────────────────────────────

def safe(text):
    """Escape XML special characters. Never add <font> or other tags from here."""
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def md_inline(text):
    """
    Apply ONLY bold and italic markdown formatting.
    Backtick code is shown as plain text (no font tags).
    This prevents any XML tag from leaking into the output.
    """
    # Backticks: strip the backticks, keep text as-is (no font tag)
    text = re.sub(r'`([^`]+)`', r'\1', text)
    # Escape XML AFTER stripping backticks
    text = safe(text)
    # Bold+italic
    text = re.sub(r'\*\*\*(.+?)\*\*\*', r'<b><i>\1</i></b>', text)
    # Bold
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    # Italic
    text = re.sub(r'\*([^*]+?)\*', r'<i>\1</i>', text)
    return text

def p(text, style):
    """Create a Paragraph. Always uses md_inline for safe markup."""
    return Paragraph(md_inline(str(text)), style)

def sp(h=6):
    return Spacer(1, h)

def hr(color=BLUE_RULE, thickness=0.5):
    return HRFlowable(width="100%", thickness=thickness, color=color,
                      spaceAfter=4, spaceBefore=4)


# ── Chapter banner ─────────────────────────────────────────────────────────────

def chapter_banner(label, title, desc, ST):
    rows = []
    if label:
        rows.append([Paragraph(safe(label), ST["ch_label"])])
    rows.append([Paragraph(safe(title), ST["ch_title"])])
    if desc:
        rows.append([Paragraph(safe(desc), ST["ch_desc"])])

    t = Table(rows, colWidths=[UW])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), NAVY),
        ("LEFTPADDING",   (0, 0), (-1, -1), 16),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 16),
        ("TOPPADDING",    (0, 0), (0, 0),   14),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 14),
        ("TOPPADDING",    (0, 1), (-1, -1),  4),
        ("LINEBELOW",     (0, -1), (-1, -1), 3, BLUE_LT),
    ]))
    return t


# ── Info / callout box ─────────────────────────────────────────────────────────

def info_box(title, body, ST, bg=BLUE_PALE, border=BLUE_LT):
    """A clean coloured box with a left accent line. No XML tags in content."""
    content = []
    if title:
        content.append(Paragraph(safe(title), ST["info_title"]))
    content.append(Paragraph(safe(body), ST["info_body"]))
    t = Table([[content]], colWidths=[UW - 8])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), bg),
        ("LEFTPADDING",   (0, 0), (-1, -1), 14),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 14),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LINEBEFORE",    (0, 0), (0, -1),  4, border),
        ("BOX",           (0, 0), (-1, -1), 0.5, border),
    ]))
    return t


# ── Data table from markdown ───────────────────────────────────────────────────

def build_table(md_lines, ST):
    rows_raw = []
    for line in md_lines:
        if re.match(r'^\s*\|[\s\-:|]+\|\s*$', line):
            continue
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        rows_raw.append(cells)
    if not rows_raw:
        return None

    headers = rows_raw[0]
    data_rows = rows_raw[1:]
    n = len(headers)
    col_w = UW / n

    data = [[Paragraph(safe(h), ST["th"]) for h in headers]]
    for row in data_rows:
        while len(row) < n:
            row.append("")
        data.append([Paragraph(safe(c[:200]), ST["td"]) for c in row[:n]])

    t = Table(data, colWidths=[col_w] * n, repeatRows=1, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("FONTNAME",       (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE",       (0, 0), (-1, -1), 8.5),
        ("LEADING",        (0, 0), (-1, -1), 12),
        ("VALIGN",         (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING",     (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",  (0, 0), (-1, -1), 5),
        ("LEFTPADDING",    (0, 0), (-1, -1), 7),
        ("RIGHTPADDING",   (0, 0), (-1, -1), 7),
        ("BACKGROUND",     (0, 0), (-1, 0),  BLUE),
        ("TEXTCOLOR",      (0, 0), (-1, 0),  WHITE),
        ("FONTNAME",       (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, ROW_ALT]),
        ("GRID",           (0, 0), (-1, -1), 0.4, GREY_RULE),
    ]))
    return t


def build_code_block(text, ST):
    t = Table(
        [[Paragraph(safe(text).replace("\n", "<br/>"), ST["mono"])]],
        colWidths=[UW - 16],
    )
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), GREY_LIGHT),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("BOX",           (0, 0), (-1, -1), 0.8, GREY_RULE),
    ]))
    return t


# ── Header / Footer ────────────────────────────────────────────────────────────

def hf(canvas, doc):
    canvas.saveState()
    w, h = A4

    canvas.setFillColor(NAVY)
    canvas.rect(0, h - 26, w, 26, fill=1, stroke=0)
    canvas.setFillColor(BLUE_LT)
    canvas.rect(0, h - 26, 4, 26, fill=1, stroke=0)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.setFillColor(WHITE)
    canvas.drawString(ML, h - 16, "RiskTrix  —  Technical Documentation")
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(BLUE_RULE)
    canvas.drawRightString(w - MR, h - 16, "Cybersecurity Governance Platform")

    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, w, 20, fill=1, stroke=0)
    canvas.setFillColor(BLUE_LT)
    canvas.rect(0, 0, 4, 20, fill=1, stroke=0)
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(BLUE_RULE)
    canvas.drawString(ML, 6, "© 2026 RiskTrix  ·  Confidential — Internal Use Only")
    canvas.setFont("Helvetica-Bold", 8.5)
    canvas.setFillColor(WHITE)
    canvas.drawRightString(w - MR, 6, f"Page {doc.page}")

    canvas.restoreState()


# ── Cover ──────────────────────────────────────────────────────────────────────

def cover_page(ST):
    story = [sp(50)]

    brand = Table(
        [[Paragraph("RiskTrix", ST["cover_h"])],
         [sp(4)],
         [Paragraph("Technical Documentation", ST["cover_sub"])],
         [sp(12)],
         [Paragraph("A complete guide to the platform — architecture, services, modules, and features.", ST["cover_meta"])],
         [sp(8)],
         [Paragraph("Version 1.0   ·   May 29, 2026   ·   Internal Use Only", ST["cover_meta"])],
         ],
        colWidths=[UW],
    )
    brand.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), NAVY),
        ("LEFTPADDING",   (0, 0), (-1, -1), 30),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 30),
        ("TOPPADDING",    (0, 0), (0, 0),   24),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 24),
        ("LINEBELOW",     (0, -1), (-1, -1), 4, BLUE_LT),
    ]))
    story.append(brand)
    story.append(sp(28))

    badges = [("11","Microservices"), ("30+","Pages"), ("100+","API Endpoints"), ("7","User Roles")]
    bw = (UW - 12) / len(badges)
    cells = []
    for val, lbl in badges:
        c = Table([[Paragraph(val, ST["badge_val"])], [Paragraph(lbl, ST["badge_lbl"])]],
                  colWidths=[bw - 4])
        c.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), BLUE_PALE),
            ("TOPPADDING",    (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, -1), (-1, -1), 10),
            ("BOX",           (0, 0), (-1, -1), 0.5, BLUE_RULE),
        ]))
        cells.append(c)
    row = Table([cells], colWidths=[bw] * len(badges))
    row.setStyle(TableStyle([("LEFTPADDING",(0,0),(-1,-1),2),("RIGHTPADDING",(0,0),(-1,-1),2)]))
    story.append(row)
    story.append(sp(28))

    story.append(info_box(
        "What is this document?",
        "This document explains everything about the RiskTrix platform in plain language. "
        "It covers what RiskTrix does, how it is built, every feature a user can access, "
        "how the backend services work, and how data flows through the system. "
        "Whether you are a brand new user, a developer, or a manager — this guide is written so "
        "that anyone can understand how RiskTrix works without needing prior technical knowledge.",
        ST, bg=BLUE_PALE, border=BLUE_LT,
    ))
    story.append(sp(12))
    story.append(info_box(
        "Who should read which section?",
        "New users: Start with Section 1 (What is RiskTrix?) then Section 5 (Platform Modules) for feature walkthroughs.  "
        "Developers: Focus on Section 2 (Architecture), Section 6 (Microservices), and Section 10 (Developer Map).  "
        "Managers and auditors: Read Section 1, Section 3 (Roles), Section 5 (Features), and Section 8 (Workflows).",
        ST, bg=TEAL_PALE, border=TEAL,
    ))
    story.append(PageBreak())
    return story


# ── Table of Contents ──────────────────────────────────────────────────────────

def toc_page(ST):
    story = []
    story.append(chapter_banner("", "Table of Contents", "Every section in this document", ST))
    story.append(sp(14))

    entries = [
        (False, "1.",    "What is RiskTrix?",
                         "The product explained — purpose, users, and value"),
        (False, "2.",    "System Architecture",
                         "How all services and components fit together"),
        (False, "3.",    "User Roles and Permissions",
                         "Who can access what, and why"),
        (False, "4.",    "The Frontend Application",
                         "How the web application is structured and navigated"),
        (False, "5.",    "Platform Modules — Full Feature Guide",
                         "Every sidebar module with all features explained"),
        (True,  "5.1",  "Dashboard", ""),
        (True,  "5.2",  "Asset Management", ""),
        (True,  "5.3",  "Policies and Device Management", ""),
        (True,  "5.4",  "Tickets", ""),
        (True,  "5.5",  "Security", ""),
        (True,  "5.6",  "Automation Engine", ""),
        (True,  "5.7",  "File Manager", ""),
        (True,  "5.8",  "Agent Directory", ""),
        (True,  "5.9",  "Search", ""),
        (True,  "5.10", "Queue Monitor", ""),
        (True,  "5.11", "Settings", ""),
        (True,  "5.12", "User Management", ""),
        (False, "6.",    "Backend Services In Detail",
                         "Each microservice — what it does, its API, its behavior"),
        (False, "7.",    "Data and Database",
                         "What data is stored and in which service"),
        (False, "8.",    "End-to-End Workflows",
                         "Step-by-step walkthroughs of key platform operations"),
        (False, "9.",    "Deployment and Local Setup",
                         "How to run RiskTrix on your machine"),
        (False, "10.",   "Developer Quick-Start Map",
                         "Where to look first when reading the codebase"),
        (False, "11.",   "Glossary",
                         "Plain-English definitions of every technical term"),
    ]

    for is_sub, num, title, desc in entries:
        num_p = Paragraph(num,
            P("tn", fontName="Helvetica-Bold", fontSize=9 if not is_sub else 8.5,
              textColor=BLUE if not is_sub else GREY_MID, leading=13))
        title_p = Paragraph(title,
            P("tt", fontName="Helvetica-Bold" if not is_sub else "Helvetica",
              fontSize=9.5 if not is_sub else 9,
              textColor=NAVY if not is_sub else GREY_DARK, leading=13))
        desc_p = Paragraph(desc if desc else "",
            P("td2", fontName="Helvetica-Oblique", fontSize=8.5,
              textColor=GREY_MID, leading=12))

        row = Table([[num_p, title_p, desc_p]],
                    colWidths=[1.0*cm, 7*cm, UW - 8.2*cm])
        row.setStyle(TableStyle([
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING",    (0, 0), (-1, -1), 4 if not is_sub else 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4 if not is_sub else 2),
            ("LEFTPADDING",   (0, 0), (-1, -1), 6),
            ("BACKGROUND",    (0, 0), (-1, -1), BLUE_PALE if not is_sub else WHITE),
            ("LINEBELOW",     (0, 0), (-1, -1), 0.3, GREY_RULE),
        ]))
        story.append(row)
        if not is_sub:
            story.append(sp(2))

    story.append(PageBreak())
    return story


# ── Module intro cards ─────────────────────────────────────────────────────────

MODULE_INTROS = {
    "5.1 Dashboard": (
        "Your Personal Home Screen",
        "When you first log in to RiskTrix, the Dashboard is what you see. It is your personal "
        "starting point — showing work that has been assigned to you, a feed of recent activity "
        "across the platform, and quick links to the areas you work in most. Think of it as the "
        "morning briefing screen that tells you what needs your attention today.",
    ),
    "5.2 Asset Management": (
        "Track Everything Your Organisation Owns",
        "Before you can protect something, you need to know it exists. Asset Management is where "
        "you register and monitor every device, system, and application in your organisation — "
        "servers, laptops, mobile devices, web applications, cloud services, databases, and more. "
        "Each asset has a risk level, a list of known vulnerabilities, a software inventory, "
        "attached files, and a full change history. If something changes on an asset, you can "
        "see exactly what changed and when.",
    ),
    "5.3 Policies": (
        "Define the Security Rules Every Device Must Follow",
        "Policies are the rules your organisation sets for how devices must be configured to be "
        "considered secure. For example: every device must have a screen lock, encryption must "
        "be turned on, the operating system must be kept up to date. In this module you create "
        "those rules, assign them to specific devices or groups of devices, and run compliance "
        "scans to check which devices are following the rules. Devices that fail a check show up "
        "as non-compliant so you can take action. You can also send remote commands to managed "
        "devices directly from the platform — like locking a lost phone or wiping a compromised laptop.",
    ),
    "5.4 Tickets": (
        "Manage Every Security Incident and Service Request",
        "When something needs to be investigated or fixed — a security alert, an access problem, "
        "a user complaint, a vulnerability that needs patching — a Ticket is created to track it "
        "from start to finish. Each ticket has a priority, a status, an assigned person, notes, "
        "attachments, and an SLA timer that shows how long is left before the issue must be "
        "resolved. Tickets are automatically assigned to the right person based on category and "
        "who has the lightest workload at that moment. Managers can use the Ticket Dashboard to "
        "see the health of the whole queue at a glance.",
    ),
    "5.5 Security": (
        "See the Security Risk of Every Managed Device in Real Time",
        "The Security module gives you a live view of the risk level of every device the platform "
        "manages. It works by calculating a risk score for each device based on security findings — "
        "is the device rooted or jailbroken? Is encryption turned off? Is the OS outdated? Are any "
        "dangerous apps installed? The higher the score, the higher the risk. When a device crosses "
        "a risk threshold, the platform automatically creates a Security Alert. You can acknowledge "
        "alerts, assign remediation tasks, and send remote commands like Lock or Wipe from the "
        "device's security detail page.",
    ),
    "5.6 Automation": (
        "Make the Platform Respond to Security Events Automatically",
        "The Automation Engine lets you write rules that make the platform react to events without "
        "anyone having to watch and respond manually. For example, you could write a rule that says: "
        "whenever a device risk score goes above 80, automatically lock the device AND create a "
        "high-severity alert AND log a remediation action. You build these rules using a simple "
        "visual form — no coding required. The engine evaluates every security event, device "
        "check-in, and offline notification against your active rules and fires the appropriate "
        "actions instantly.",
    ),
    "5.7 File Manager": (
        "One Central Place for All Evidence and Attachments",
        "Every file uploaded anywhere in the platform — a ticket attachment, a vulnerability "
        "screenshot, an audit document, an asset manual, a proof-of-concept — is stored and "
        "accessible through the File Manager. Files are tagged with a context so you can filter "
        "and find everything related to a particular ticket, asset, or audit engagement without "
        "searching through multiple modules.",
    ),
    "5.8 Agent Directory": (
        "The Directory of People Who Handle Security Work",
        "The Agent Directory is the list of people in your team who handle tickets, respond to "
        "incidents, and cover on-call shifts. It stores each person's name, email, team, skills, "
        "availability schedule, and current ticket workload. When a new ticket arrives without an "
        "assigned person, the platform uses this directory to automatically find the most suitable "
        "available person and assign it to them — based on matching skills, team, and who currently "
        "has the fewest open tickets.",
    ),
    "5.9 Search": (
        "Find Anything Across the Entire Platform in Seconds",
        "Instead of switching between modules to find something, the Search module lets you type "
        "a keyword and instantly see matching results from all areas — tickets, assets, agents, "
        "and policies — grouped by type. It is the fastest way to find something when you are not "
        "sure which module it belongs to.",
    ),
    "5.10 Queue Monitor": (
        "Monitor Background Jobs and Fix Failures",
        "Some platform operations happen in the background — notifications being sent, events "
        "being processed between services. The Queue Monitor shows the status of all these "
        "background jobs. If a job failed, authorised users can see exactly what went wrong and "
        "replay it. This is mainly used by system administrators and auditors who need to verify "
        "that all background processing completed successfully.",
    ),
    "5.11 Settings": (
        "System Configuration for Administrators",
        "The Settings module lets administrators manage their own profile, configure compliance "
        "standards the platform tracks, and set up email delivery so the platform can send "
        "notifications when events occur.",
    ),
    "5.12 User Management": (
        "Create and Manage Every User Account",
        "The User Management page is only accessible to administrators. It shows every user "
        "account in the platform and lets admins create new accounts, edit roles and details, "
        "activate or deactivate users, and delete accounts that are no longer needed. This is "
        "how you control who can log in and what they are allowed to do.",
    ),
}

# Which H3 headings trigger a module intro card
MODULE_TRIGGER = {
    "5.1 Dashboard", "5.2 Asset Management", "5.3 Policies",
    "5.4 Tickets", "5.5 Security", "5.6 Automation",
    "5.7 File Manager", "5.8 Agent Directory", "5.9 Search",
    "5.10 Queue Monitor", "5.11 Settings", "5.12 User Management",
}

def module_intro(key, ST):
    for trigger in MODULE_TRIGGER:
        if key.strip().startswith(trigger):
            headline, desc = MODULE_INTROS[trigger]
            return [info_box(headline, desc, ST, bg=BLUE_PALE, border=BLUE_LT), sp(10)]
    return []


# ── Concept callouts inserted after certain headings ───────────────────────────

CONCEPT_CALLOUTS = {
    "3.1 Roles": (
        "What does a role mean in practice?",
        "A role is a label that controls what a user is allowed to see and do. "
        "For example, a Viewer can only read data and cannot make changes. "
        "A Security Analyst can create alerts and remediation tasks. "
        "A CISO can see everything and change system settings. "
        "Roles are assigned when an account is created by an administrator.",
        BLUE_PALE, BLUE_LT,
    ),
    "3.2 Role Inheritance": (
        "How role inheritance works",
        "Inheritance means a senior role automatically gets all the permissions of roles below it "
        "in the chain. So a CISO can do everything an InfoSec Manager can do, plus more. "
        "Auditor roles are intentionally kept separate from this chain — "
        "they can see compliance and audit data but are blocked from operational management screens "
        "like the Agent Directory.",
        TEAL_PALE, TEAL,
    ),
    "9.1 Ticket Auto-Assignment": (
        "Why does automatic assignment matter?",
        "Without auto-assignment, someone would have to manually read every new ticket and decide "
        "who to give it to. This is slow and creates bottlenecks. "
        "The auto-assignment system uses live workload data from the Agent Directory to instantly "
        "find the least-busy person who has the right skills for that type of ticket, "
        "and assigns it automatically the moment the ticket is created.",
        GREEN_PALE, GREEN,
    ),
    "9.2 Policy Compliance and Security Risk": (
        "The continuous security feedback loop",
        "This is not a one-time check — it is a continuous cycle. "
        "Policies define what secure looks like. "
        "Devices report their state when they check in. "
        "Compliance scans measure each device against the policies. "
        "The risk engine scores each device based on what it finds. "
        "Alerts are raised when something is wrong. "
        "Automation rules respond immediately. "
        "This loop runs constantly in the background so threats are caught quickly.",
        TEAL_PALE, TEAL,
    ),
}

def concept_callout(heading_text, ST):
    for key, (title, body, bg, border) in CONCEPT_CALLOUTS.items():
        if heading_text.strip().startswith(key):
            return [info_box(title, body, ST, bg=bg, border=border), sp(8)]
    return []


# ── Page-break triggers ────────────────────────────────────────────────────────

PAGE_BREAK_AT = {
    "## 3.", "## 4.", "## 5.", "## 6.", "## 7.",
    "## 8.", "## 9.", "## 10.", "## 11.", "## 12.",
    "## 13.", "## 14.", "## 15.",
}

def needs_page_break(stripped):
    for trigger in PAGE_BREAK_AT:
        if stripped.startswith(trigger):
            return True
    return False


# ── Main markdown parser ───────────────────────────────────────────────────────

def parse(md_text, ST):
    lines = md_text.splitlines()
    out = []
    i = 0

    while i < len(lines):
        raw = lines[i]
        stripped = raw.strip()

        # Blank line
        if not stripped:
            out.append(sp(4))
            i += 1
            continue

        # Fenced code block
        if stripped.startswith("```"):
            code_lines = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("```"):
                code_lines.append(lines[i])
                i += 1
            i += 1
            out.append(build_code_block("\n".join(code_lines), ST))
            out.append(sp(6))
            continue

        # H1 — skip (already on cover)
        if re.match(r'^# [^#]', stripped):
            i += 1
            continue

        # H2 — chapter banner
        m = re.match(r'^## (.+)', stripped)
        if m:
            title = m.group(1)
            if needs_page_break(stripped):
                out.append(PageBreak())
            nm = re.match(r'^(\d+[\.\d]*)\.\s+(.*)', title)
            if nm:
                out.append(chapter_banner(f"Section {nm.group(1)}", nm.group(2), "", ST))
            else:
                out.append(chapter_banner("", title, "", ST))
            out.append(sp(10))
            i += 1
            continue

        # H3 — section heading with optional module intro and concept callout
        m = re.match(r'^### (.+)', stripped)
        if m:
            title = m.group(1)
            out.append(sp(6))
            out.append(HRFlowable(width="100%", thickness=1.5, color=BLUE_RULE,
                                  spaceAfter=4, spaceBefore=4))
            out.append(Paragraph(safe(title), ST["h3"]))
            out.append(sp(4))
            out += module_intro(title, ST)
            out += concept_callout(title, ST)
            i += 1
            continue

        # H4
        m = re.match(r'^#### (.+)', stripped)
        if m:
            out.append(Paragraph(safe(m.group(1)), ST["h4"]))
            i += 1
            continue

        # Markdown table
        if stripped.startswith("|"):
            tbl_lines = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                tbl_lines.append(lines[i])
                i += 1
            t = build_table(tbl_lines, ST)
            if t:
                out.append(sp(4))
                out.append(t)
                out.append(sp(8))
            continue

        # Unordered bullet
        bm = re.match(r'^(\s*)[-*]\s+(.*)', raw)
        if bm:
            indent = len(bm.group(1))
            text = md_inline(bm.group(2))
            if indent >= 4:
                out.append(Paragraph(f"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;◦  {text}", ST["sub_b"]))
            else:
                out.append(Paragraph(f"•  {text}", ST["bullet"]))
            i += 1
            continue

        # Ordered list
        m = re.match(r'^(\d+)\.\s+(.*)', stripped)
        if m:
            text = md_inline(m.group(2))
            out.append(Paragraph(f"<b>{m.group(1)}.</b>  {text}", ST["num"]))
            i += 1
            continue

        # Normal paragraph
        out.append(Paragraph(md_inline(stripped), ST["body"]))
        i += 1

    return out


# ── Narrative intro (hand-written, not from md) ────────────────────────────────

def reading_guide(ST):
    story = []
    story.append(chapter_banner("Introduction", "How to Read This Document",
                                "A guide for every type of reader", ST))
    story.append(sp(14))

    story.append(Paragraph(
        "This document is written for any reader — developer, manager, auditor, or first-time user — "
        "who needs to understand how RiskTrix works. You do not need any prior technical knowledge. "
        "Technical words are explained when they first appear, and every section starts with a "
        "plain-language explanation before going into detail.",
        ST["body"]))
    story.append(sp(8))

    story.append(info_box(
        "I am completely new to RiskTrix",
        "Start with Section 1 — What is RiskTrix? — to understand what the product does and who it is for. "
        "Then read Section 2 to see how all the pieces connect. "
        "Then go to Section 5, which walks through every feature in the application, module by module.",
        ST, bg=GREEN_PALE, border=GREEN,
    ))
    story.append(sp(8))

    story.append(info_box(
        "I am a developer joining the team",
        "Read Section 2 for the overall architecture and technology stack, "
        "Section 6 for each backend service's API and behaviour, "
        "and Section 10 for the fastest path into the codebase.",
        ST, bg=BLUE_PALE, border=BLUE_LT,
    ))
    story.append(sp(8))

    story.append(info_box(
        "I am a manager, auditor, or security reviewer",
        "Focus on Section 1 for the product overview, "
        "Section 3 for roles and access control, "
        "Section 5 for what each module does, "
        "and Section 8 for how the key security workflows operate end to end.",
        ST, bg=TEAL_PALE, border=TEAL,
    ))

    story.append(PageBreak())
    return story


def architecture_section(ST):
    story = []
    story.append(chapter_banner("Section 2", "How RiskTrix is Built",
                                "Architecture in plain English", ST))
    story.append(sp(12))

    story.append(Paragraph(
        "RiskTrix is built as a microservices platform. This means the system is not one large "
        "application — it is a collection of smaller, focused services that each own one area "
        "of the product. They talk to each other over standard web APIs.",
        ST["body"]))
    story.append(sp(6))

    story.append(info_box(
        "What is a microservice?",
        "Imagine a large company with separate departments — HR, Finance, IT, Legal. "
        "Each department has its own responsibilities and its own records. "
        "If Finance needs information about an employee, it calls HR. "
        "Microservices work the same way. The Tickets service handles only tickets. "
        "The Assets service handles only assets. "
        "They call each other when they need data from another area.",
        ST, bg=BLUE_PALE, border=BLUE_LT,
    ))
    story.append(sp(10))

    story.append(Paragraph("<b>The three layers of RiskTrix:</b>", ST["body_left"]))
    story.append(sp(4))

    layers = [
        ("The Frontend — what you see in your browser",
         "A React web application that runs at port 8888. "
         "It shows all the dashboards, tables, forms, and charts you interact with. "
         "It does not store data itself — it fetches everything from the backend services via APIs."),
        ("The Backend Services — the business logic",
         "Ten separate FastAPI services, each responsible for one domain. "
         "They validate your input, apply business rules, and save results to the database. "
         "The main backend handles login, users, and shared platform features. "
         "Specialist services handle assets, tickets, policies, security, files, search, and more."),
        ("The Database and Infrastructure — the memory",
         "PostgreSQL stores all platform data. "
         "Redis is available for caching and event-based communication. "
         "An Nginx API Gateway acts as the single entry point for requests from outside. "
         "Docker Compose starts everything together with a single command."),
    ]

    for i, (title, detail) in enumerate(layers, 1):
        row = Table([[
            Paragraph(str(i), P("ln", fontName="Helvetica-Bold", fontSize=16,
                                textColor=WHITE, alignment=TA_CENTER, leading=20)),
            [Paragraph(title, P("lt", fontName="Helvetica-Bold", fontSize=10.5,
                                textColor=NAVY, leading=14, spaceAfter=4)),
             Paragraph(detail, P("ld", fontName="Helvetica", fontSize=9.5,
                                 textColor=GREY_DARK, leading=14))],
        ]], colWidths=[0.8*cm, UW - 1.2*cm])
        row.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (0, -1), BLUE),
            ("VALIGN",        (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING",   (0, 0), (0, -1), 0),
            ("RIGHTPADDING",  (0, 0), (0, -1), 0),
            ("TOPPADDING",    (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING",   (1, 0), (1, -1), 12),
            ("BACKGROUND",    (1, 0), (1, -1), BLUE_PALE),
            ("LINEBELOW",     (0, 0), (-1, -1), 0.3, GREY_RULE),
        ]))
        story.append(row)
        story.append(sp(4))

    story.append(sp(10))
    story.append(Paragraph(
        "<b>How a typical request travels through the system — step by step:</b>",
        ST["body_left"]))
    story.append(sp(6))

    steps = [
        ("Open the browser",
         "The React frontend loads. You see the login screen."),
        ("Log in",
         "Your username and password are sent to the Main Backend, which checks them "
         "and returns a token — a small digital proof that you are who you say you are. "
         "The frontend stores this token and sends it with every future request."),
        ("Navigate to a page",
         "The frontend checks your role and shows only the pages you are permitted to access. "
         "Menu items you do not have permission for are hidden."),
        ("Load data",
         "The page makes an API call to the relevant microservice — for example, "
         "the Asset Service when you open Asset Management. "
         "The service queries the database and returns the data."),
        ("See the results",
         "The frontend renders the data as tables, charts, and cards."),
        ("Save a change",
         "When you fill in a form and click Save, the frontend sends a POST or PUT request. "
         "The service validates it, saves it to the database, "
         "and may trigger background events for other services to process."),
    ]

    for idx, (step, detail) in enumerate(steps, 1):
        row = Table([[
            Paragraph(str(idx), P("sn", fontName="Helvetica-Bold", fontSize=13,
                                  textColor=WHITE, alignment=TA_CENTER, leading=18)),
            [Paragraph(step, P("sh", fontName="Helvetica-Bold", fontSize=10,
                               textColor=NAVY, leading=14, spaceAfter=3)),
             Paragraph(detail, P("sd", fontName="Helvetica", fontSize=9.5,
                                 textColor=GREY_DARK, leading=14))],
        ]], colWidths=[0.8*cm, UW - 1.2*cm])
        row.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (0, -1), TEAL),
            ("VALIGN",        (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING",   (0, 0), (0, -1), 0),
            ("RIGHTPADDING",  (0, 0), (0, -1), 0),
            ("TOPPADDING",    (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ("LEFTPADDING",   (1, 0), (1, -1), 12),
            ("LINEBELOW",     (0, 0), (-1, -1), 0.3, GREY_RULE),
        ]))
        story.append(row)

    story.append(PageBreak())
    return story


# ── Main ───────────────────────────────────────────────────────────────────────

def generate():
    print("Reading markdown...")
    with open(SOURCE, encoding="utf-8") as f:
        md = f.read()

    print("Building styles...")
    ST = styles()

    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=A4,
        leftMargin=ML,
        rightMargin=MR,
        topMargin=MT + 4,
        bottomMargin=MB + 10,
        title="RiskTrix Technical Documentation",
        author="RiskTrix Platform",
        subject="Architecture, Services, Features, Workflows",
    )

    print("Assembling story...")
    story = []

    # Front matter
    story += cover_page(ST)
    story += toc_page(ST)
    story += reading_guide(ST)
    story += architecture_section(ST)

    # Markdown content — start from Section 3 (skip 1 and 2 which we wrote manually)
    lines = md.splitlines()
    start = 0
    for idx, l in enumerate(lines):
        if l.strip().startswith("## 3."):
            start = idx
            break
    content_md = "\n".join(lines[start:])

    story += parse(content_md, ST)

    print("Writing PDF...")
    doc.build(story, onFirstPage=hf, onLaterPages=hf)
    print(f"\n  PDF saved to:\n  {OUTPUT}")


if __name__ == "__main__":
    generate()
