"""PNG twins of the SVG diagrams for editors that do not preview SVG."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent
INDIGO = (63, 81, 181)
INDIGO_DK = (48, 63, 159)
SURFACE = (232, 234, 246)
WHITE = (255, 255, 255)
TEXT = (26, 35, 126)
MUTED = (55, 71, 79)
LINE = (92, 107, 192)
ORANGE_FILL = (255, 243, 224)
ORANGE = (230, 81, 0)
GREEN = (46, 125, 50)


def font(size, bold=True):
    for name in ("segoeui.ttf", "SegoeUI.ttf", "arial.ttf", "Arial.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


class C:
    def __init__(self, w, h, heading):
        self.im = Image.new("RGB", (w, h), WHITE)
        self.d = ImageDraw.Draw(self.im)
        self.d.text((24, 14), heading, fill=TEXT, font=font(18))

    def wrap(self, text, width=18):
        words = text.replace("\n", " ").split()
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

    def box(self, x, y, w, h, label, fill=INDIGO, color=WHITE):
        self.d.rounded_rectangle((x, y, x + w, y + h), radius=10, fill=fill, outline=INDIGO_DK, width=2)
        lines = self.wrap(label, max(12, w // 9))
        f = font(14 if len(lines) < 3 else 12)
        total = (len(lines) - 1) * 16
        start = y + h / 2 - total / 2 - 7
        for i, ln in enumerate(lines):
            bbox = self.d.textbbox((0, 0), ln, font=f)
            tw = bbox[2] - bbox[0]
            self.d.text((x + w / 2 - tw / 2, start + i * 16), ln, fill=color, font=f)

    def diamond(self, cx, cy, w, h, label):
        pts = [(cx, cy - h / 2), (cx + w / 2, cy), (cx, cy + h / 2), (cx - w / 2, cy)]
        self.d.polygon(pts, fill=ORANGE_FILL, outline=(239, 108, 0))
        lines = self.wrap(label, 14)
        f = font(12)
        start = cy - (len(lines) - 1) * 7 - 6
        for i, ln in enumerate(lines):
            bbox = self.d.textbbox((0, 0), ln, font=f)
            tw = bbox[2] - bbox[0]
            self.d.text((cx - tw / 2, start + i * 14), ln, fill=ORANGE, font=f)

    def arrow(self, x1, y1, x2, y2, label=""):
        self.d.line((x1, y1, x2, y2), fill=LINE, width=3)
        # arrow head
        if abs(x2 - x1) >= abs(y2 - y1):
            direction = 1 if x2 >= x1 else -1
            self.d.polygon(
                [(x2, y2), (x2 - 10 * direction, y2 - 5), (x2 - 10 * direction, y2 + 5)],
                fill=LINE,
            )
        else:
            direction = 1 if y2 >= y1 else -1
            self.d.polygon(
                [(x2, y2), (x2 - 5, y2 - 10 * direction), (x2 + 5, y2 - 10 * direction)],
                fill=LINE,
            )
        if label:
            f = font(11)
            self.d.text(((x1 + x2) / 2 - 10, (y1 + y2) / 2 - 16), label, fill=MUTED, font=f)

    def save(self, name):
        path = OUT / name
        self.im.save(path, "PNG")
        print("wrote", path.name)


c = C(980, 220, "Login and JWT flow")
c.box(40, 70, 140, 70, "User")
c.arrow(180, 105, 230, 105)
c.box(230, 70, 160, 70, "Vite UI :5174")
c.arrow(390, 105, 440, 105)
c.box(440, 70, 160, 70, "nginx :8080")
c.arrow(600, 105, 650, 105)
c.box(650, 70, 170, 70, "Identity :8000")
c.box(650, 160, 170, 40, "JWT access + refresh", fill=SURFACE, color=TEXT)
c.box(230, 160, 300, 40, "Demo also sends X-RiskTrix-Demo: 1", fill=SURFACE, color=TEXT)
c.save("01-login-jwt.png")

c = C(920, 420, "Demo vs live tenant filter")
c.box(360, 50, 180, 50, "API request")
c.arrow(450, 100, 450, 130)
c.diamond(450, 175, 220, 80, "X-RiskTrix-Demo = 1?")
c.arrow(340, 175, 200, 175, "yes")
c.box(40, 140, 160, 70, "Return only DEMO-* ids")
c.arrow(120, 210, 120, 250)
c.box(40, 250, 160, 70, "Demo sample telemetry")
c.arrow(560, 175, 700, 175, "no")
c.box(680, 140, 200, 70, "Exclude DEMO-* ids")
c.arrow(780, 210, 780, 250)
c.diamond(780, 295, 200, 80, "In-scope accounts?")
c.arrow(680, 295, 520, 295, "none")
c.box(360, 260, 160, 70, "Empty lists, null scores")
c.arrow(780, 335, 780, 365)
c.box(680, 365, 200, 40, "Real tenant data", fill=GREEN)
c.save("02-demo-vs-live.png")

c = C(1010, 200, "CNAPP first-run operator loop")
steps = [
    (30, "1 Cloud Accounts /cloud"),
    (190, "2 Assets /assets"),
    (350, "3 CSPM Findings /findings"),
    (510, "4 CIEM /ciem"),
    (670, "5 Kubernetes /kubernetes"),
    (830, "6 Search / Ctrl+K"),
]
for i, (x, label) in enumerate(steps):
    c.box(x, 80, 140, 80, label)
    if i < len(steps) - 1:
        c.arrow(x + 140, 120, x + 160, 120)
c.save("03-cnapp-getting-started.png")

c = C(980, 360, "GRC: vendors, assignments, exceptions, POC")
c.box(40, 70, 180, 60, "Create / upload vendor")
c.arrow(220, 100, 270, 100)
c.box(270, 70, 180, 60, "Map compliance standards")
c.arrow(450, 100, 500, 100)
c.box(500, 70, 200, 60, "Assignments + assessments")
c.arrow(700, 100, 750, 100)
c.box(750, 70, 190, 60, "Upload / download control POC")
c.arrow(130, 130, 130, 170)
c.box(40, 170, 180, 60, "Certificates and expiry")
c.arrow(220, 200, 270, 200)
c.box(270, 170, 180, 60, "Vendor + audit reminders")
c.arrow(130, 230, 130, 270)
c.box(40, 270, 180, 60, "TPRM delay / expired")
c.box(500, 200, 200, 60, "Add exception")
c.arrow(700, 230, 750, 230)
c.box(750, 170, 190, 60, "Review and approve")
c.arrow(845, 230, 845, 270)
c.box(750, 270, 190, 60, "Exception POC file")
c.save("04-grc-audit.png")

c = C(980, 240, "Endpoint agent heartbeat and scan")
c.box(40, 80, 160, 70, "Agent register + heartbeat")
c.arrow(200, 115, 250, 115)
c.box(250, 80, 160, 70, "Endpoint Overview")
c.arrow(410, 115, 460, 115)
c.box(460, 80, 140, 70, "Scan Now")
c.arrow(600, 90, 650, 70)
c.box(650, 40, 150, 55, "Binary inventory")
c.arrow(600, 115, 650, 115)
c.box(650, 90, 150, 55, "Malware detections")
c.arrow(600, 140, 650, 160)
c.box(650, 145, 150, 55, "Integrity events")
c.arrow(800, 70, 850, 115)
c.box(820, 90, 140, 70, "CVE lookup + TI feeds")
c.save("05-endpoint-agents.png")

c = C(980, 360, "Cloud posture: connect, discover, scan, score")
c.box(40, 70, 180, 55, "Connect AWS / Azure / GCP")
c.arrow(220, 97, 270, 97)
c.box(270, 70, 160, 55, "Test Connection")
c.arrow(430, 97, 480, 97)
c.box(480, 70, 160, 55, "Sync / Discover")
c.arrow(560, 125, 400, 170)
c.box(300, 170, 160, 55, "Asset Explorer")
c.arrow(460, 197, 520, 197)
c.box(520, 170, 200, 55, "Network / DB / Compute")
c.box(750, 70, 180, 55, "CSPM scan")
c.arrow(840, 125, 840, 170)
c.box(740, 170, 200, 55, "Findings assign / suppress")
c.arrow(840, 225, 700, 270)
c.box(560, 255, 160, 55, "Security Score")
c.box(780, 255, 170, 55, "Cloud Compliance")
c.box(40, 255, 180, 55, "Policy catalogue")
c.save("06-cloud-posture.png")

c = C(980, 280, "Detection: alerts, SOAR, webhooks, IP scanner")
c.box(30, 70, 200, 70, "CSPM / CIEM / K8s / Runtime / Scanner")
c.arrow(230, 105, 280, 105)
c.box(280, 70, 160, 70, "Alert Inbox")
c.arrow(440, 90, 500, 70)
c.box(500, 40, 180, 55, "Comment / assign / suppress")
c.arrow(440, 120, 500, 140)
c.box(500, 120, 180, 55, "SOAR playbook execute")
c.arrow(680, 147, 740, 147)
c.box(740, 105, 200, 70, "Webhooks Slack / Teams / Email")
c.box(280, 190, 220, 55, "Toxic risks + attack paths")
c.arrow(390, 190, 360, 140)
c.box(30, 190, 200, 55, "IP Scanner CSV / JSON report")
c.save("07-detection.png")

c = C(980, 220, "Shieldersoft reports: generate and download")
c.box(30, 80, 160, 70, "Reports UI /reports")
c.arrow(190, 115, 240, 115)
c.box(240, 80, 180, 70, "GET .../reports/types")
c.arrow(420, 115, 470, 115)
c.box(470, 80, 200, 70, "POST .../reports/generate")
c.arrow(670, 115, 720, 115)
c.box(720, 80, 150, 70, "CloudReport row")
c.box(30, 165, 840, 40, "GET download  ->  PDF  HTML  CSV  JSON", fill=SURFACE, color=TEXT)
c.save("08-reports.png")

c = C(980, 390, "RiskTrix services behind nginx")
c.box(40, 55, 180, 50, "Browser Vite :5174")
c.arrow(220, 80, 290, 80)
c.box(290, 55, 180, 50, "nginx gateway :8080")
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
for label, x, y in services:
    c.box(x, y, 140, 55, label, fill=SURFACE, color=TEXT)
    c.d.line((380, 105, x + 70, y), fill=(197, 202, 233), width=1)
c.box(40, 330, 890, 40, "Postgres risktrix_db (per-service schemas)  +  Redis :6379")
c.save("09-architecture.png")
print("png done")
