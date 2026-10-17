"""One-shot SVG diagram renderer for user_guide.md. Not a product runtime file."""
from pathlib import Path
from xml.sax.saxutils import escape

OUT = Path(__file__).resolve().parent
INDIGO = "#3f51b5"
INDIGO_DK = "#303f9f"
SURFACE = "#e8eaf6"
WHITE = "#ffffff"
TEXT = "#1a237e"
MUTED = "#37474f"
LINE = "#5c6bc0"


def wrap(text, width=18):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if len(trial) > width and cur:
            lines.append(cur)
            cur = w
        else:
            cur = trial
    if cur:
        lines.append(cur)
    return lines or [text]


def box(x, y, w, h, label, fill=INDIGO, color=WHITE, radius=10):
    lines = wrap(label, max(12, w // 9))
    fs = 13 if len(lines) < 3 else 12
    start_y = y + h / 2 - (len(lines) - 1) * 8
    tspans = []
    for i, ln in enumerate(lines):
        dy = 0 if i == 0 else 16
        tspans.append(
            f'<tspan x="{x + w/2}" dy="{dy}">{escape(ln)}</tspan>'
        )
    return (
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" '
        f'fill="{fill}" stroke="{INDIGO_DK}" stroke-width="1.5"/>'
        f'<text x="{x + w/2}" y="{start_y}" text-anchor="middle" '
        f'font-family="Segoe UI, Arial, sans-serif" font-size="{fs}" '
        f'font-weight="600" fill="{color}">{"".join(tspans)}</text>'
    )


def diamond(cx, cy, w, h, label):
    pts = f"{cx},{cy-h/2} {cx+w/2},{cy} {cx},{cy+h/2} {cx-w/2},{cy}"
    lines = wrap(label, 14)
    start_y = cy - (len(lines) - 1) * 7
    tspans = []
    for i, ln in enumerate(lines):
        dy = 0 if i == 0 else 14
        tspans.append(f'<tspan x="{cx}" dy="{dy}">{escape(ln)}</tspan>')
    return (
        f'<polygon points="{pts}" fill="#fff3e0" stroke="#ef6c00" stroke-width="1.8"/>'
        f'<text x="{cx}" y="{start_y}" text-anchor="middle" '
        f'font-family="Segoe UI, Arial, sans-serif" font-size="12" font-weight="600" '
        f'fill="#e65100">{"".join(tspans)}</text>'
    )


def arrow(x1, y1, x2, y2, label=""):
    parts = [
        f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{LINE}" '
        f'stroke-width="2" marker-end="url(#arrow)"/>'
    ]
    if label:
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2 - 8
        parts.append(
            f'<text x="{mx}" y="{my}" text-anchor="middle" '
            f'font-family="Segoe UI, Arial, sans-serif" font-size="11" fill="{MUTED}">'
            f"{escape(label)}</text>"
        )
    return "".join(parts)


def title(text, x=24, y=28):
    return (
        f'<text x="{x}" y="{y}" font-family="Segoe UI, Arial, sans-serif" '
        f'font-size="16" font-weight="700" fill="{TEXT}">{escape(text)}</text>'
    )


def svg(w, h, inner):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
      <polygon points="0 0, 10 4, 0 8" fill="{LINE}"/>
    </marker>
  </defs>
  <rect width="{w}" height="{h}" fill="{WHITE}" rx="8"/>
  {inner}
</svg>
"""


def write(name, w, h, inner):
    path = OUT / name
    path.write_text(svg(w, h, inner), encoding="utf-8")
    print("wrote", path.name)


# 1 Login JWT
write(
    "01-login-jwt.svg",
    980,
    220,
    title("Login and JWT flow")
    + box(40, 70, 140, 70, "User")
    + arrow(180, 105, 230, 105)
    + box(230, 70, 160, 70, "Vite UI :5174")
    + arrow(390, 105, 440, 105, "POST /auth/login")
    + box(440, 70, 160, 70, "nginx :8080")
    + arrow(600, 105, 650, 105)
    + box(650, 70, 170, 70, "Identity :8000")
    + arrow(735, 140, 735, 175)
    + box(650, 175, 170, 36, "JWT access + refresh", fill=SURFACE, color=TEXT)
    + box(230, 160, 280, 40, "Demo account also sends X-RiskTrix-Demo: 1", fill=SURFACE, color=TEXT, radius=8),
)

# 2 Demo vs live
write(
    "02-demo-vs-live.svg",
    920,
    420,
    title("Demo vs live tenant filter")
    + box(360, 50, 180, 50, "API request")
    + arrow(450, 100, 450, 130)
    + diamond(450, 175, 220, 80, "X-RiskTrix-Demo = 1?")
    + arrow(340, 175, 200, 175, "yes")
    + box(40, 140, 160, 70, "Return only DEMO-* ids")
    + arrow(120, 210, 120, 250)
    + box(40, 250, 160, 70, "Demo sample telemetry")
    + arrow(560, 175, 700, 175, "no")
    + box(680, 140, 200, 70, "Exclude DEMO-* ids")
    + arrow(780, 210, 780, 250)
    + diamond(780, 295, 200, 80, "In-scope accounts?")
    + arrow(680, 295, 520, 295, "none")
    + box(360, 260, 160, 70, "Empty lists, null scores")
    + arrow(780, 335, 780, 365)
    + box(680, 365, 200, 40, "Real tenant data", fill="#2e7d32"),
)

# 3 CNAPP getting started
steps = [
    (30, "1 Cloud Accounts", "/cloud"),
    (190, "2 Assets", "/assets"),
    (350, "3 CSPM Findings", "/findings"),
    (510, "4 CIEM", "/ciem"),
    (670, "5 Kubernetes", "/kubernetes"),
    (830, "6 Search / Ctrl+K", "/search"),
]
inner = title("CNAPP first-run operator loop")
for i, (x, label, path) in enumerate(steps):
    inner += box(x, 80, 140, 80, f"{label}\n{path}")
    if i < len(steps) - 1:
        inner += arrow(x + 140, 120, x + 160, 120)
write("03-cnapp-getting-started.svg", 1010, 200, inner)

# 4 GRC
write(
    "04-grc-audit.svg",
    980,
    360,
    title("GRC: vendors, assignments, exceptions, POC")
    + box(40, 70, 180, 60, "Create / upload vendor")
    + arrow(220, 100, 270, 100)
    + box(270, 70, 180, 60, "Map compliance standards")
    + arrow(450, 100, 500, 100)
    + box(500, 70, 200, 60, "Assignments + assessments")
    + arrow(700, 100, 750, 100)
    + box(750, 70, 190, 60, "Upload / download control POC")
    + arrow(130, 130, 130, 170)
    + box(40, 170, 180, 60, "Certificates and expiry")
    + arrow(220, 200, 270, 200)
    + box(270, 170, 180, 60, "Vendor + audit reminders")
    + arrow(130, 230, 130, 270)
    + box(40, 270, 180, 60, "TPRM delay / expired")
    + box(500, 200, 200, 60, "Add exception")
    + arrow(700, 230, 750, 230)
    + box(750, 170, 190, 60, "Review and approve")
    + arrow(845, 230, 845, 270)
    + box(750, 270, 190, 60, "Exception POC file"),
)

# 5 Endpoint
write(
    "05-endpoint-agents.svg",
    980,
    240,
    title("Endpoint agent heartbeat and scan")
    + box(40, 80, 160, 70, "Agent register + heartbeat")
    + arrow(200, 115, 250, 115)
    + box(250, 80, 160, 70, "Endpoint Overview")
    + arrow(410, 115, 460, 115)
    + box(460, 80, 140, 70, "Scan Now")
    + arrow(600, 90, 650, 70)
    + box(650, 40, 150, 55, "Binary inventory")
    + arrow(600, 115, 650, 115)
    + box(650, 90, 150, 55, "Malware detections")
    + arrow(600, 140, 650, 160)
    + box(650, 145, 150, 55, "Integrity events")
    + arrow(800, 70, 850, 115)
    + box(820, 90, 140, 70, "CVE lookup + TI feeds"),
)

# 6 Cloud posture
write(
    "06-cloud-posture.svg",
    980,
    360,
    title("Cloud posture: connect, discover, scan, score")
    + box(40, 70, 180, 55, "Connect AWS / Azure / GCP")
    + arrow(220, 97, 270, 97)
    + box(270, 70, 160, 55, "Test Connection")
    + arrow(430, 97, 480, 97)
    + box(480, 70, 160, 55, "Sync / Discover")
    + arrow(560, 125, 400, 170)
    + box(300, 170, 160, 55, "Asset Explorer")
    + arrow(460, 197, 520, 197)
    + box(520, 170, 200, 55, "Network / DB / Compute")
    + arrow(640, 125, 640, 170)
    + box(750, 70, 180, 55, "CSPM scan")
    + arrow(840, 125, 840, 170)
    + box(740, 170, 200, 55, "Findings assign / suppress / playbook")
    + arrow(840, 225, 700, 270)
    + box(560, 255, 160, 55, "Security Score")
    + arrow(840, 225, 920, 270)
    + box(780, 255, 170, 55, "Cloud Compliance")
    + box(40, 255, 180, 55, "Policy catalogue"),
)

# 7 Detection
write(
    "07-detection.svg",
    980,
    280,
    title("Detection: alerts, SOAR, webhooks, IP scanner")
    + box(30, 70, 200, 70, "CSPM / CIEM / K8s / Runtime / Scanner")
    + arrow(230, 105, 280, 105)
    + box(280, 70, 160, 70, "Alert Inbox")
    + arrow(440, 90, 500, 70)
    + box(500, 40, 180, 55, "Comment / assign / suppress")
    + arrow(440, 120, 500, 140)
    + box(500, 120, 180, 55, "SOAR playbook execute")
    + arrow(680, 147, 740, 147)
    + box(740, 105, 200, 70, "Webhooks Slack / Teams / Email")
    + box(280, 190, 220, 55, "Toxic risks + attack paths")
    + arrow(390, 190, 360, 140)
    + box(30, 190, 200, 55, "IP Scanner CSV / JSON report"),
)

# 8 Reports
write(
    "08-reports.svg",
    980,
    220,
    title("Shieldersoft reports: generate and download")
    + box(30, 80, 160, 70, "Reports UI /reports")
    + arrow(190, 115, 240, 115)
    + box(240, 80, 180, 70, "GET .../reports/types")
    + arrow(420, 115, 470, 115)
    + box(470, 80, 200, 70, "POST .../reports/generate")
    + arrow(670, 115, 720, 115)
    + box(720, 80, 150, 70, "CloudReport row")
    + arrow(795, 150, 795, 175)
    + box(30, 165, 840, 40, "GET .../reports/{id}/download  →  PDF (WeasyPrint or ReportLab)  ·  HTML  ·  CSV  ·  JSON", fill=SURFACE, color=TEXT),
)

# 9 Architecture
services = [
    ("Identity :8000", 40, 160),
    ("Application :8001", 190, 160),
    ("Audit :8002", 340, 160),
    ("Agents :8010", 490, 160),
    ("Binary :8011", 640, 160),
    ("Integrity :8012", 790, 160),
    ("Threat :8013", 40, 250),
    ("CSPM :8014", 190, 250),
    ("CIEM :8015", 340, 250),
    ("K8s :8016", 490, 250),
    ("Alerts :8017", 640, 250),
    ("IP Scanner :8018", 790, 250),
]
inner = title("RiskTrix services behind nginx")
inner += box(40, 55, 180, 50, "Browser Vite :5174")
inner += arrow(220, 80, 290, 80)
inner += box(290, 55, 180, 50, "nginx gateway :8080")
inner += arrow(380, 105, 380, 145)
for label, x, y in services:
    inner += box(x, y, 140, 55, label, fill=SURFACE, color=TEXT)
    # stem from gateway bar
    inner += f'<line x1="380" y1="105" x2="{x+70}" y2="{y}" stroke="{LINE}" stroke-width="1.2" opacity="0.5"/>'
inner += box(40, 330, 890, 40, "Postgres risktrix_db (per-service schemas)  ·  Redis :6379", fill=INDIGO, color=WHITE)
write("09-architecture.svg", 980, 390, inner)

print("done")
