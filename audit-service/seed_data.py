"""
Seed script for audit-service database.
Run with:
  docker cp audit-service/seed_data.py audit-service:/app/seed_data.py
  docker exec audit-service python seed_data.py
"""
import asyncio
from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:password@micro-ciso-postgres:5432/risktrix_db"
)

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

today = date.today()
d = lambda days: today + timedelta(days=days)


async def seed():
    async with AsyncSessionLocal() as db:

        # ── Vendors ───────────────────────────────────────────────────────────
        vendors = [
            ("Acme Cloud Services",  "Cloud infrastructure provider",   "Software", "sec@acme.io",
             "HIGH",    "COMPLIANT",     85.0, 17, 3, "ISO 27001", d(180)),
            ("DataSafe Solutions",   "Data backup and recovery",        "Service",  "admin@datasafe.com",
             "MEDIUM",  "COMPLIANT",     92.0, 23, 2, "PCI-DSS",   d(90)),
            ("NetGuard Security",    "Network security appliances",     "Hardware", "info@netguard.net",
             "HIGH",    "NON_COMPLIANT", 54.0,  9, 8, "ISO 27001", d(-15)),
            ("PayFlow Payments",     "Payment gateway services",        "Software", "contact@payflow.io",
             "CRITICAL","COMPLIANT",    78.0, 14, 4, "PCI-DSS",   d(365)),
            ("SwiftLog Analytics",   "Log management and SIEM",         "Software", "support@swiftlog.com",
             "LOW",     "COMPLIANT",     96.0, 24, 1, "SOC 2",     d(270)),
            ("VaultKey Identity",    "IAM and SSO provider",            "Software", "ops@vaultkey.com",
             "MEDIUM",  "PENDING",       68.0, 13, 6, "ISO 27001", d(45)),
            ("CloudEdge CDN",        "Content delivery network",        "Service",  "admin@cloudedge.net",
             "LOW",     "COMPLIANT",     88.0, 22, 3, "SOC 2",     d(200)),
        ]
        for v in vendors:
            await db.execute(text("""
                INSERT INTO vendors
                    (name, description, category, contact_email, risk_level,
                     compliance_status, compliance_rate, compliant_controls, non_compliant_controls,
                     last_compliance_check, certificate_type, certificate_expiry_date,
                     contract_start_date, contract_end_date, created_at, updated_at)
                VALUES (:name,:desc,:cat,:email,
                        :risk::risklevel, :cs::compliancestatus,
                        :cr,:cc,:ncc,:today,:ctype,:cexp,
                        :cstart,:cend, now(), now())
                ON CONFLICT DO NOTHING
            """), {
                "name": v[0], "desc": v[1], "cat": v[2], "email": v[3],
                "risk": v[4], "cs": v[5], "cr": v[6], "cc": v[7], "ncc": v[8],
                "today": today, "ctype": v[9], "cexp": v[10],
                "cstart": d(-365), "cend": d(365),
            })

        # ── VendorCertificates ────────────────────────────────────────────────
        certs = [
            ("Acme Cloud Services",  "ISO 27001", "ISO-2024-001", d(180), "COMPLIANT",     "BSI Group",     "Cloud infrastructure"),
            ("DataSafe Solutions",   "PCI-DSS",   "PCI-2024-042", d(90),  "COMPLIANT",     "QSA Certify",   "Data backup services"),
            ("NetGuard Security",    "ISO 27001", "ISO-2023-099", d(-15), "NON_COMPLIANT", "Bureau Veritas", "Network security"),
            ("PayFlow Payments",     "PCI-DSS",   "PCI-2024-077", d(365), "COMPLIANT",     "QSA Certify",   "Payment processing"),
            ("SwiftLog Analytics",   "SOC 2",     "SOC-2024-011", d(270), "COMPLIANT",     "AICPA",         "Log management"),
            ("VaultKey Identity",    "ISO 27001", "ISO-2024-033", d(45),  "COMPLIANT",     "BSI Group",     "IAM services"),
            ("CloudEdge CDN",        "SOC 2",     "SOC-2024-022", d(200), "COMPLIANT",     "AICPA",         "CDN services"),
        ]
        for c in certs:
            await db.execute(text("""
                INSERT INTO vendor_certificates
                    (vendor_id, certificate_type, certificate_number, issue_date,
                     expiry_date, status, issuing_authority, scope, created_at, updated_at)
                SELECT v.id, :ctype, :cnum, :issue, :expiry,
                       :status::compliancestatus, :authority, :scope, now(), now()
                FROM vendors v WHERE v.name = :vname
                ON CONFLICT DO NOTHING
            """), {
                "vname": c[0], "ctype": c[1], "cnum": c[2],
                "issue": d(-365), "expiry": c[3],
                "status": c[4], "authority": c[5], "scope": c[6],
            })

        # ── Compliance Standards ──────────────────────────────────────────────
        standards = [
            ("ISO27001", "ISO/IEC 27001 - Information Security Management",
             "International standard for information security management systems", "2022",   "ISO/IEC"),
            ("PCI_DSS",  "PCI DSS - Payment Card Industry Data Security Standard",
             "Security standard for organizations handling payment cards",          "v4.0",  "PCI SSC"),
            ("SOC2",     "SOC 2 - Service Organization Control 2",
             "Auditing procedure for service organizations managing customer data", "Type II","AICPA"),
            ("GDPR",     "GDPR - General Data Protection Regulation",
             "EU regulation on data protection and privacy",                        "2018",  "European Parliament"),
        ]
        for s in standards:
            await db.execute(text("""
                INSERT INTO compliance_standards
                    (name, full_name, description, version, authority, created_at, updated_at)
                VALUES (:name,:full,:desc,:ver,:auth, now(), now())
                ON CONFLICT (name) DO NOTHING
            """), {"name": s[0], "full": s[1], "desc": s[2], "ver": s[3], "auth": s[4]})

        # ── Exceptions ────────────────────────────────────────────────────────
        exceptions = [
            ("Unpatched Legacy VPN Appliance",         "TECHNICAL",   "HIGH",     "ACTIVE",  d(-30), d(90),
             "End-of-life VPN appliance pending replacement in Q3.",
             "Medium risk - isolated network segment", "Replace with ZTA solution by Q3", "approved"),
            ("MFA Exemption for Break-Glass Account",  "COMPLIANCE",  "CRITICAL", "ACTIVE",  d(-10), d(60),
             "Emergency access account exempt from MFA per policy waiver.",
             "High risk - compensating controls applied", "Implement FIDO2 hardware key", "approved"),
            ("PCI Scope Expansion Delay",              "OPERATIONAL", "MEDIUM",   "ACTIVE",  d(-5),  d(45),
             "Delayed scope assessment due to system migration.",
             "Low risk - migration on track", "Complete assessment by end of month", "pending"),
            ("Outdated SSL Certificate on Dev Server", "TECHNICAL",   "LOW",      "ACTIVE",  d(-2),  d(30),
             "Dev environment SSL cert expired, no prod impact.",
             "Minimal risk - dev only", "Renew cert via automation pipeline", "pending"),
            ("Firewall Rule Exception for BI Tool",    "COMPLIANCE",  "MEDIUM",   "EXPIRED", d(-120),d(-10),
             "Temporary rule allowed BI tool direct DB access.",
             "Rule has now expired", "Exception closed - rule removed", "approved"),
            ("Delayed SOC2 Evidence Collection",       "COMPLIANCE",  "HIGH",     "ACTIVE",  d(-7),  d(20),
             "Evidence collection delayed due to team capacity.",
             "High risk if missed audit deadline", "Assign dedicated resource", "rejected"),
            ("Password Policy Waiver - Ops Team",      "COMPLIANCE",  "MEDIUM",   "ACTIVE",  d(-15), d(75),
             "Temporary relaxed policy during system migration.",
             "Compensating controls: enhanced monitoring", "Enforce new policy post-migration", "approved"),
        ]
        for e in exceptions:
            await db.execute(text("""
                INSERT INTO exceptions
                    (exception_name, category, severity, status,
                     start_date, end_date, comments, risk_assessment,
                     mitigation_plan, approval_status, created_at, updated_at)
                VALUES (:name, :cat::exceptioncategory, :sev::exceptionseverity,
                        :status::exceptionstatus, :start, :end,
                        :comments, :risk, :mitigation, :approval, now(), now())
                ON CONFLICT DO NOTHING
            """), {
                "name": e[0], "cat": e[1], "sev": e[2], "status": e[3],
                "start": e[4], "end": e[5], "comments": e[6],
                "risk": e[7], "mitigation": e[8], "approval": e[9],
            })

        await db.commit()
        print("Seed complete:")
        print("  7 vendors")
        print("  7 vendor certificates")
        print("  4 compliance standards")
        print("  7 exceptions")


if __name__ == "__main__":
    asyncio.run(seed())
