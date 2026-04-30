-- Seed data for audit-service (temporary, for UI testing)
-- Run: docker cp audit-service/seed_audit.sql micro-ciso-postgres:/tmp/seed_audit.sql
--      docker exec micro-ciso-postgres psql -U postgres -d risktrix_db -f /tmp/seed_audit.sql

-- ── Vendors ──────────────────────────────────────────────────────────────────
INSERT INTO vendors (name, description, category, contact_email,
    risk_level, compliance_status, compliance_rate,
    compliant_controls, non_compliant_controls,
    last_compliance_check, certificate_type, certificate_expiry_date,
    contract_start_date, contract_end_date, created_at, updated_at)
VALUES
  ('Acme Cloud Services',  'Cloud infrastructure provider',   'Software', 'sec@acme.io',
   'HIGH'::risklevel,    'COMPLIANT'::compliancestatus,     85.0, 17, 3,
   CURRENT_DATE, 'ISO 27001', CURRENT_DATE + INTERVAL '180 days',
   CURRENT_DATE - INTERVAL '365 days', CURRENT_DATE + INTERVAL '365 days', now(), now()),

  ('DataSafe Solutions',   'Data backup and recovery',        'Service',  'admin@datasafe.com',
   'MEDIUM'::risklevel,  'COMPLIANT'::compliancestatus,     92.0, 23, 2,
   CURRENT_DATE, 'PCI-DSS',   CURRENT_DATE + INTERVAL '90 days',
   CURRENT_DATE - INTERVAL '365 days', CURRENT_DATE + INTERVAL '365 days', now(), now()),

  ('NetGuard Security',    'Network security appliances',     'Hardware', 'info@netguard.net',
   'HIGH'::risklevel,    'NON_COMPLIANT'::compliancestatus, 54.0,  9, 8,
   CURRENT_DATE, 'ISO 27001', CURRENT_DATE - INTERVAL '15 days',
   CURRENT_DATE - INTERVAL '365 days', CURRENT_DATE + INTERVAL '365 days', now(), now()),

  ('PayFlow Payments',     'Payment gateway services',        'Software', 'contact@payflow.io',
   'CRITICAL'::risklevel,'COMPLIANT'::compliancestatus,     78.0, 14, 4,
   CURRENT_DATE, 'PCI-DSS',   CURRENT_DATE + INTERVAL '365 days',
   CURRENT_DATE - INTERVAL '365 days', CURRENT_DATE + INTERVAL '365 days', now(), now()),

  ('SwiftLog Analytics',   'Log management and SIEM',         'Software', 'support@swiftlog.com',
   'LOW'::risklevel,     'COMPLIANT'::compliancestatus,     96.0, 24, 1,
   CURRENT_DATE, 'SOC 2',     CURRENT_DATE + INTERVAL '270 days',
   CURRENT_DATE - INTERVAL '365 days', CURRENT_DATE + INTERVAL '365 days', now(), now()),

  ('VaultKey Identity',    'IAM and SSO provider',            'Software', 'ops@vaultkey.com',
   'MEDIUM'::risklevel,  'PENDING'::compliancestatus,       68.0, 13, 6,
   CURRENT_DATE, 'ISO 27001', CURRENT_DATE + INTERVAL '45 days',
   CURRENT_DATE - INTERVAL '365 days', CURRENT_DATE + INTERVAL '365 days', now(), now()),

  ('CloudEdge CDN',        'Content delivery network',        'Service',  'admin@cloudedge.net',
   'LOW'::risklevel,     'COMPLIANT'::compliancestatus,     88.0, 22, 3,
   CURRENT_DATE, 'SOC 2',     CURRENT_DATE + INTERVAL '200 days',
   CURRENT_DATE - INTERVAL '365 days', CURRENT_DATE + INTERVAL '365 days', now(), now())
ON CONFLICT DO NOTHING;

-- ── Vendor Certificates ───────────────────────────────────────────────────────
INSERT INTO vendor_certificates
    (vendor_id, certificate_type, certificate_number, issue_date,
     expiry_date, status, issuing_authority, scope, created_at, updated_at)
SELECT v.id, c.cert_type, c.cert_num,
       CURRENT_DATE - INTERVAL '365 days',
       c.expiry, c.status::compliancestatus, c.authority, c.scope, now(), now()
FROM vendors v
JOIN (VALUES
  ('Acme Cloud Services',  'ISO 27001', 'ISO-2024-001', CURRENT_DATE + INTERVAL '180 days', 'COMPLIANT',     'BSI Group',     'Cloud infrastructure'),
  ('DataSafe Solutions',   'PCI-DSS',   'PCI-2024-042', CURRENT_DATE + INTERVAL '90 days',  'COMPLIANT',     'QSA Certify',   'Data backup services'),
  ('NetGuard Security',    'ISO 27001', 'ISO-2023-099', CURRENT_DATE - INTERVAL '15 days',  'NON_COMPLIANT', 'Bureau Veritas', 'Network security'),
  ('PayFlow Payments',     'PCI-DSS',   'PCI-2024-077', CURRENT_DATE + INTERVAL '365 days', 'COMPLIANT',     'QSA Certify',   'Payment processing'),
  ('SwiftLog Analytics',   'SOC 2',     'SOC-2024-011', CURRENT_DATE + INTERVAL '270 days', 'COMPLIANT',     'AICPA',         'Log management'),
  ('VaultKey Identity',    'ISO 27001', 'ISO-2024-033', CURRENT_DATE + INTERVAL '45 days',  'COMPLIANT',     'BSI Group',     'IAM services'),
  ('CloudEdge CDN',        'SOC 2',     'SOC-2024-022', CURRENT_DATE + INTERVAL '200 days', 'COMPLIANT',     'AICPA',         'CDN services')
) AS c(vname, cert_type, cert_num, expiry, status, authority, scope)
ON v.name = c.vname
ON CONFLICT DO NOTHING;

-- ── Compliance Standards ──────────────────────────────────────────────────────
INSERT INTO compliance_standards (name, full_name, description, version, authority, created_at, updated_at)
VALUES
  ('ISO27001', 'ISO/IEC 27001 - Information Security Management',
   'International standard for information security management systems', '2022', 'ISO/IEC', now(), now()),
  ('PCI_DSS',  'PCI DSS - Payment Card Industry Data Security Standard',
   'Security standard for organizations handling payment cards', 'v4.0', 'PCI SSC', now(), now()),
  ('SOC2',     'SOC 2 - Service Organization Control 2',
   'Auditing procedure for service organizations managing customer data', 'Type II', 'AICPA', now(), now()),
  ('GDPR',     'GDPR - General Data Protection Regulation',
   'EU regulation on data protection and privacy', '2018', 'European Parliament', now(), now())
ON CONFLICT (name) DO NOTHING;

-- ── Exceptions ────────────────────────────────────────────────────────────────
INSERT INTO exceptions
    (exception_name, category, severity, status,
     start_date, end_date, comments, risk_assessment,
     mitigation_plan, approval_status, created_at, updated_at)
VALUES
  ('Unpatched Legacy VPN Appliance',
   'TECHNICAL'::exceptioncategory,   'HIGH'::exceptionseverity,    'ACTIVE'::exceptionstatus,
   CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '90 days',
   'End-of-life VPN appliance pending replacement in Q3.',
   'Medium risk - isolated network segment', 'Replace with ZTA solution by Q3', 'approved', now(), now()),

  ('MFA Exemption for Break-Glass Account',
   'COMPLIANCE'::exceptioncategory,  'CRITICAL'::exceptionseverity, 'ACTIVE'::exceptionstatus,
   CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '60 days',
   'Emergency access account exempt from MFA per policy waiver.',
   'High risk - compensating controls applied', 'Implement FIDO2 hardware key', 'approved', now(), now()),

  ('PCI Scope Expansion Delay',
   'OPERATIONAL'::exceptioncategory, 'MEDIUM'::exceptionseverity,  'ACTIVE'::exceptionstatus,
   CURRENT_DATE - INTERVAL '5 days',  CURRENT_DATE + INTERVAL '45 days',
   'Delayed scope assessment due to system migration.',
   'Low risk - migration on track', 'Complete assessment by end of month', 'pending', now(), now()),

  ('Outdated SSL Certificate on Dev Server',
   'TECHNICAL'::exceptioncategory,   'LOW'::exceptionseverity,     'ACTIVE'::exceptionstatus,
   CURRENT_DATE - INTERVAL '2 days',  CURRENT_DATE + INTERVAL '30 days',
   'Dev environment SSL cert expired, no prod impact.',
   'Minimal risk - dev only', 'Renew cert via automation pipeline', 'pending', now(), now()),

  ('Firewall Rule Exception for BI Tool',
   'COMPLIANCE'::exceptioncategory,  'MEDIUM'::exceptionseverity,  'EXPIRED'::exceptionstatus,
   CURRENT_DATE - INTERVAL '120 days', CURRENT_DATE - INTERVAL '10 days',
   'Temporary rule allowed BI tool direct DB access.',
   'Rule has now expired', 'Exception closed - rule removed', 'approved', now(), now()),

  ('Delayed SOC2 Evidence Collection',
   'COMPLIANCE'::exceptioncategory,  'HIGH'::exceptionseverity,    'ACTIVE'::exceptionstatus,
   CURRENT_DATE - INTERVAL '7 days',  CURRENT_DATE + INTERVAL '20 days',
   'Evidence collection delayed due to team capacity.',
   'High risk if missed audit deadline', 'Assign dedicated resource', 'rejected', now(), now()),

  ('Password Policy Waiver - Ops Team',
   'COMPLIANCE'::exceptioncategory,  'MEDIUM'::exceptionseverity,  'ACTIVE'::exceptionstatus,
   CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '75 days',
   'Temporary relaxed policy during system migration.',
   'Compensating controls: enhanced monitoring', 'Enforce new policy post-migration', 'approved', now(), now())
ON CONFLICT DO NOTHING;

SELECT 'vendors'              AS table_name, COUNT(*) FROM vendors
UNION ALL
SELECT 'vendor_certificates',               COUNT(*) FROM vendor_certificates
UNION ALL
SELECT 'compliance_standards',              COUNT(*) FROM compliance_standards
UNION ALL
SELECT 'exceptions',                        COUNT(*) FROM exceptions;
