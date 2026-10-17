import ipaddress
import json
import os
import re
import socket
import ssl
import subprocess
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from app.core.config import settings
from app.services.nmap_engine import is_nmap_available, nmap_command_preview, nmap_has_privileges, run_nmap_scan

SERVICE_MAP = {
    21: ("ftp", "File Transfer"),
    22: ("ssh", "Remote Management"),
    23: ("telnet", "Unencrypted Console"),
    25: ("smtp", "Mail Transfer"),
    53: ("dns", "Name Server"),
    67: ("dhcp", "Address Assignment"),
    69: ("tftp", "Trivial File Transfer"),
    80: ("http", "Web Server"),
    88: ("kerberos", "Identity & Auth"),
    110: ("pop3", "Email Ingress"),
    111: ("rpcbind", "RPC Infrastructure"),
    123: ("ntp", "Time Synchronization"),
    135: ("msrpc", "Windows RPC"),
    139: ("netbios-ssn", "Windows Networking"),
    143: ("imap", "Email Ingress"),
    161: ("snmp", "Network Monitoring"),
    389: ("ldap", "Directory"),
    443: ("https", "Secure Web Server"),
    445: ("microsoft-ds", "SMB File Sharing"),
    465: ("smtps", "Secure Email"),
    514: ("syslog", "System Logging"),
    587: ("smtp-submission", "Secure Email"),
    636: ("ldaps", "Secure Directory"),
    873: ("rsync", "File Sync"),
    993: ("imaps", "Secure Email"),
    995: ("pop3s", "Secure Email"),
    1433: ("mssql", "Microsoft SQL Server"),
    1521: ("oracle", "Oracle Database"),
    1883: ("mqtt", "IoT Message Broker"),
    2049: ("nfs", "Network File System"),
    2375: ("docker", "Docker Engine API"),
    2376: ("docker-tls", "Secure Docker API"),
    2379: ("etcd", "Kubernetes Cluster Store"),
    3000: ("http-alt", "Web Application"),
    3306: ("mysql", "MySQL / MariaDB"),
    3389: ("rdp", "Windows Remote Desktop"),
    5000: ("docker-registry", "Image Registry"),
    5432: ("postgresql", "PostgreSQL"),
    5672: ("rabbitmq", "AMQP Broker"),
    5900: ("vnc", "VNC Remote Desktop"),
    5984: ("couchdb", "CouchDB"),
    6379: ("redis", "Redis"),
    6443: ("k8s-api", "Kubernetes API"),
    8000: ("http-alt", "Web Application"),
    8080: ("http-proxy", "Web Application / Proxy"),
    8081: ("http-alt", "DevOps Portal"),
    8123: ("clickhouse", "Analytics DB"),
    8200: ("vault", "Secrets Manager"),
    8443: ("https-alt", "Secure Web Application"),
    8500: ("consul", "Service Discovery"),
    8888: ("jupyter", "Notebook Server"),
    9000: ("minio", "Object Storage"),
    9042: ("cassandra", "Cassandra"),
    9090: ("prometheus", "Metrics Server"),
    9200: ("elasticsearch", "Search API"),
    9300: ("elasticsearch-node", "Search Transport"),
    11211: ("memcached", "In-Memory Cache"),
    15672: ("rabbitmq-web", "Broker Admin"),
    27017: ("mongodb", "MongoDB"),
    28017: ("mongodb-web", "MongoDB Admin"),
    50000: ("jenkins-agent", "CI Agent"),
}

TOP_40 = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 993, 995, 1433, 1521, 2049, 3306, 3389, 5432, 5900, 6379, 8080, 8443, 9200, 27017, 3389, 2375, 6443, 11211, 161, 389, 636, 465, 587, 8081, 9090, 5000, 3000, 8888]
TOP_100 = sorted(set(TOP_40 + [
    69, 88, 111, 123, 161, 389, 465, 514, 587, 636, 873, 1433, 1521, 1883, 2049,
    2376, 2379, 3000, 5000, 5672, 5984, 6443, 8000, 8081, 8123, 8200, 8500, 8888,
    9000, 9042, 9090, 9300, 15672, 26257, 28017, 50000, 1723, 3268, 3269, 5060,
    5061, 5222, 5269, 5353, 5601, 5985, 5986, 7001, 7070, 7443, 8008, 8010, 8088,
    8090, 8161, 8333, 8530, 8531, 8834, 9001, 9091, 9443, 10000, 10443, 18080,
    27018, 27019, 28015, 32400, 49152,
]))
TOP_1000 = sorted(set(TOP_100 + list(SERVICE_MAP.keys()) + [
    20, 26, 37, 49, 70, 79, 81, 82, 83, 84, 85, 89, 90, 99, 102, 109, 113, 119,
    137, 138, 144, 179, 199, 264, 311, 407, 427, 443, 444, 500, 512, 513, 515,
    520, 523, 540, 548, 554, 563, 593, 623, 631, 646, 666, 749, 750, 765, 789,
    902, 903, 990, 1022, 1023, 1024, 1025, 1026, 1027, 1028, 1029, 1080, 1099,
    1111, 1194, 1214, 1241, 1311, 1337, 1352, 1414, 1434, 1494, 1512, 1524, 1604,
    1720, 1723, 1755, 1812, 1813, 1863, 1900, 2000, 2001, 2048, 2082, 2083, 2086,
    2087, 2095, 2096, 2100, 2121, 2160, 2181, 2222, 2323, 2381, 2483, 2484, 2601,
    2602, 3001, 3128, 3260, 3299, 3307, 3333, 3478, 3632, 3690, 3872, 4000, 4040,
    4190, 4369, 4443, 4444, 4500, 4550, 4662, 4848, 4899, 5001, 5009, 5050, 5060,
    5222, 5269, 5353, 5357, 5431, 5500, 5555, 5631, 5632, 5666, 5800, 5801, 5901,
    5938, 5985, 6000, 6001, 6378, 6543, 6566, 6588, 6666, 6667, 6697, 6789, 6881,
    6969, 7000, 7001, 7070, 7071, 7199, 7443, 7474, 7547, 7777, 8001, 8008, 8009,
    8010, 8020, 8042, 8060, 8069, 8082, 8083, 8084, 8085, 8086, 8087, 8088, 8089,
    8090, 8091, 8112, 8139, 8161, 8181, 8222, 8243, 8280, 8333, 8383, 8400, 8444,
    8501, 8530, 8531, 8545, 8600, 8649, 8765, 8800, 8834, 8880, 8883, 8899, 8983,
    9001, 9002, 9020, 9043, 9060, 9080, 9081, 9091, 9092, 9093, 9100, 9151, 9191,
    9201, 9301, 9418, 9443, 9500, 9600, 9800, 9876, 9990, 9998, 9999, 10000, 10001,
    10050, 10051, 10250, 10443, 11234, 11300, 12345, 16010, 18080, 18264, 19888,
    20000, 22122, 25565, 27015, 28015, 32400, 32764, 37777, 44818, 47808, 48899,
    49152, 50070, 61616,
]))
UDP_PORTS = [53, 67, 123, 161, 514, 1900]
HTTP_PORTS = {80, 8000, 8008, 8080, 8081, 8088, 8090, 8888, 9000, 9090, 9200}
TLS_PORTS = {443, 8443, 9443, 10443, 6443, 2376, 8531}
RISKY_PORTS = {
    21: ("medium", "FTP is unencrypted and often exposes anonymous or weak credentials."),
    23: ("high", "Telnet is unencrypted and should not be reachable on the public internet."),
    69: ("medium", "TFTP has no authentication and is commonly abused for file exfiltration."),
    135: ("high", "Windows RPC is a frequent lateral-movement target."),
    139: ("high", "NetBIOS session service increases SMB reconnaissance exposure."),
    445: ("high", "SMB on a public host is a common ransomware and worm target."),
    512: ("high", "rexec is a legacy remote-execution service."),
    513: ("high", "rlogin is a legacy unencrypted remote-login service."),
    1433: ("high", "Microsoft SQL Server is frequently brute-forced when exposed."),
    1521: ("medium", "Oracle listener exposure increases database attack surface."),
    2375: ("critical", "Unauthenticated Docker API can yield full host compromise."),
    2379: ("high", "etcd often stores cluster secrets and should not be public."),
    3306: ("high", "MySQL/MariaDB should not be reachable from the internet."),
    3389: ("high", "RDP is a top brute-force and ransomware entry point."),
    5432: ("high", "PostgreSQL should not be reachable from the internet."),
    5900: ("high", "VNC is frequently unauthenticated or weakly protected."),
    6379: ("critical", "Redis is commonly exposed without authentication."),
    9200: ("high", "Elasticsearch HTTP APIs often lack authentication."),
    11211: ("critical", "Memcached can be abused for amplification and data theft."),
    27017: ("critical", "MongoDB is frequently exposed without authentication."),
}

TIMING_PROFILE = {
    "T1": {"timeout": 1.2, "workers": 8, "label": "Sneaky"},
    "T2": {"timeout": 0.8, "workers": 16, "label": "Polite"},
    "T3": {"timeout": 0.4, "workers": 32, "label": "Normal"},
    "T4": {"timeout": 0.25, "workers": 64, "label": "Aggressive"},
}

PRESET_DEFAULTS = {
    "quick": {"timing": "T4", "port_range": "top40", "udp": False, "os": False, "findings": False, "http_tls": True},
    "standard": {"timing": "T3", "port_range": "top100", "udp": False, "os": True, "findings": True, "http_tls": True},
    "deep": {"timing": "T3", "port_range": "top1000", "udp": False, "os": True, "findings": True, "http_tls": True},
    "stealth": {"timing": "T1", "port_range": "top100", "udp": False, "os": True, "findings": True, "http_tls": True},
    "udp": {"timing": "T3", "port_range": "udp", "udp": True, "os": False, "findings": False, "http_tls": False},
    "full": {"timing": "T3", "port_range": "top1000", "udp": True, "os": True, "findings": True, "http_tls": True},
}
OS_HINT_PORTS = [22, 80, 135, 139, 443, 445, 548, 3389, 5900, 5985]
GREETING_PORTS = {21, 22, 25, 110, 143}


def is_blocked_target(target: str) -> bool:
    host = (target or "").split("/")[0].strip()
    if not host:
        return False
    if host.lower() in {"localhost", "127.0.0.1", "::1"}:
        return not settings.ALLOW_INTERNAL_SCAN
    try:
        ip = ipaddress.ip_address(host)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            return not settings.ALLOW_INTERNAL_SCAN
    except ValueError:
        return False
    return False


def parse_port_spec(spec: str) -> List[int]:
    raw = (spec or "").strip().lower()
    if not raw or raw in {"top40", "top100"}:
        return list(TOP_40 if raw != "top100" else TOP_100)
    if raw in {"top1000", "top1k"}:
        return list(TOP_1000)
    if raw in {"udp", "u:53,67,123,161,514,1900"}:
        return []
    if raw in {"1-1024", "wellknown", "well-known"}:
        return list(range(1, 1025))
    if raw in {"1-65535", "all", "full"}:
        return sorted(set(range(1, 1025)).union(TOP_1000))
    ports: List[int] = []
    for chunk in raw.replace(" ", "").split(","):
        if not chunk or chunk.startswith("u:"):
            continue
        if "-" in chunk:
            start_s, end_s = chunk.split("-", 1)
            try:
                start, end = int(start_s), int(end_s)
            except ValueError:
                continue
            if start > end:
                start, end = end, start
            end = min(end, start + 2047)
            ports.extend(range(max(1, start), min(65535, end) + 1))
        else:
            try:
                port = int(chunk)
            except ValueError:
                continue
            if 1 <= port <= 65535:
                ports.append(port)
    return sorted(set(ports))[:4096] or list(TOP_100)


def _service_for(port: int) -> Tuple[str, str]:
    return SERVICE_MAP.get(port, ("unknown", "Unclassified"))


def _read_greeting(host: str, port: int, timeout: float) -> str:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(max(timeout, 1.5))
    try:
        if sock.connect_ex((host, port)) != 0:
            return ""
        return sock.recv(180).decode("utf-8", errors="ignore")
    except Exception:
        return ""
    finally:
        sock.close()


def _tcp_probe(host: str, port: int, timeout: float) -> Optional[Dict[str, Any]]:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    try:
        if sock.connect_ex((host, port)) != 0:
            return None
        banner = ""
        try:
            if port in GREETING_PORTS:
                banner = sock.recv(160).decode("utf-8", errors="ignore")
            else:
                sock.sendall(b"HEAD / HTTP/1.0\r\n\r\n")
                banner = sock.recv(96).decode("utf-8", errors="ignore")
        except Exception:
            banner = ""
        name, category = _service_for(port)
        return {
            "port": port,
            "protocol": "tcp",
            "state": "open",
            "service": name,
            "category": category,
            "banner": (banner or "").replace("\r", " ").replace("\n", " ").strip()[:120],
        }
    except Exception:
        return None
    finally:
        sock.close()


def _udp_probe(host: str, port: int, timeout: float) -> Optional[Dict[str, Any]]:
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(timeout)
    try:
        sock.sendto(b"\x00", (host, port))
        try:
            data, _ = sock.recvfrom(64)
            name, category = _service_for(port)
            return {
                "port": port,
                "protocol": "udp",
                "state": "open",
                "service": name,
                "category": category,
                "banner": data[:40].hex(),
            }
        except socket.timeout:
            name, category = _service_for(port)
            return {
                "port": port,
                "protocol": "udp",
                "state": "open|filtered",
                "service": name,
                "category": category,
                "banner": "",
            }
    except Exception:
        return None
    finally:
        sock.close()


def _http_inspect(host: str, port: int, use_tls: bool, timeout: float) -> Optional[Dict[str, Any]]:
    scheme = "https" if use_tls else "http"
    url = f"{scheme}://{host}:{port}/"
    req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "RiskTrix-IP-Scanner"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            headers = {k.lower(): v for k, v in resp.headers.items()}
            return {
                "url": url,
                "status": resp.status,
                "server": headers.get("server"),
                "powered_by": headers.get("x-powered-by"),
                "content_type": headers.get("content-type"),
                "hsts": bool(headers.get("strict-transport-security")),
            }
    except urllib.error.HTTPError as exc:
        return {"url": url, "status": exc.code, "server": exc.headers.get("Server") if exc.headers else None}
    except Exception:
        return None


def _tls_inspect(host: str, port: int, timeout: float) -> Optional[Dict[str, Any]]:
    context = ssl.create_default_context()
    try:
        with socket.create_connection((host, port), timeout=timeout) as raw:
            with context.wrap_socket(raw, server_hostname=host) as tls:
                cert = tls.getpeercert()
                subject = dict(x[0] for x in cert.get("subject", []) if x)
                issuer = dict(x[0] for x in cert.get("issuer", []) if x)
                return {
                    "port": port,
                    "subject": subject.get("commonName"),
                    "issuer": issuer.get("commonName"),
                    "not_before": cert.get("notBefore"),
                    "not_after": cert.get("notAfter"),
                    "san": [item[1] for item in cert.get("subjectAltName", []) if item[0] == "DNS"][:8],
                    "version": tls.version(),
                }
    except Exception:
        return None


def _read_ttl(host: str) -> Optional[int]:
    command = ["ping", "-n", "1", "-w", "1200", host] if os.name == "nt" else ["ping", "-c", "1", "-W", "1", host]
    try:
        completed = subprocess.run(command, capture_output=True, text=True, timeout=3)
        match = re.search(r"ttl[=:](\d+)", f"{completed.stdout} {completed.stderr}", re.I)
        return int(match.group(1)) if match else None
    except Exception:
        return None


def _ttl_family(ttl: Optional[int]) -> Optional[str]:
    if ttl is None:
        return None
    if 96 <= ttl <= 128:
        return "Windows"
    if 32 <= ttl <= 64:
        return "Linux / Unix"
    if 200 <= ttl <= 255:
        return "Network appliance"
    return None


def _add_score(scores: Dict[str, int], family: str, points: int) -> None:
    scores[family] = scores.get(family, 0) + points


def _fingerprint_os(
    open_ports: List[Dict[str, Any]],
    http_rows: Optional[List[Dict[str, Any]]] = None,
    tls_rows: Optional[List[Dict[str, Any]]] = None,
    host: Optional[str] = None,
) -> Dict[str, Any]:
    ports = {row["port"] for row in open_ports if row.get("protocol") == "tcp" and row.get("state") == "open"}
    banners = " ".join(str(row.get("banner") or "") for row in open_ports).lower()
    http_blob = " ".join(
        " ".join(str(row.get(key) or "") for key in ("server", "powered_by"))
        for row in (http_rows or [])
    ).lower()
    tls_blob = " ".join(
        " ".join(str(row.get(key) or "") for key in ("subject", "issuer"))
        for row in (tls_rows or [])
    ).lower()
    text = f"{banners} {http_blob} {tls_blob}"

    scores: Dict[str, int] = {}
    signals: List[Dict[str, str]] = []
    product = None

    windows_ports = ports & {135, 139, 445, 3389, 5985, 47001}
    if windows_ports:
        _add_score(scores, "Windows", 4)
        signals.append({"source": "ports", "value": f"Windows services {sorted(windows_ports)}", "weight": "high"})
    if ports & {22, 111, 2049}:
        _add_score(scores, "Linux / Unix", 2)
        signals.append({"source": "ports", "value": f"Unix services {sorted(ports & {22, 111, 2049})}", "weight": "medium"})
    if 548 in ports:
        _add_score(scores, "macOS", 3)
        signals.append({"source": "ports", "value": "AFP 548", "weight": "medium"})

    ssh_banner = next((row.get("banner") or "" for row in open_ports if row.get("port") == 22), "")
    if ssh_banner:
        signals.append({"source": "ssh-banner", "value": ssh_banner[:120], "weight": "high"})
        lowered = ssh_banner.lower()
        if "windows" in lowered or "powershell" in lowered:
            _add_score(scores, "Windows", 5)
            product = product or ssh_banner.strip()
        elif "darwin" in lowered:
            _add_score(scores, "macOS", 5)
            product = product or ssh_banner.strip()
        elif "ubuntu" in lowered:
            _add_score(scores, "Linux / Unix", 6)
            product = "Ubuntu (OpenSSH)"
        elif "debian" in lowered:
            _add_score(scores, "Linux / Unix", 6)
            product = "Debian (OpenSSH)"
        elif "freebsd" in lowered:
            _add_score(scores, "BSD", 6)
            product = ssh_banner.strip()
        elif "dropbear" in lowered:
            _add_score(scores, "Embedded Linux", 5)
            product = "Dropbear SSH"
        elif "openssh" in lowered:
            _add_score(scores, "Linux / Unix", 4)
            product = product or ssh_banner.strip()
        elif "cisco" in lowered:
            _add_score(scores, "Network appliance", 6)
            product = "Cisco IOS / NX-OS"

    if re.search(r"microsoft-iis|microsoft-httpapi|asp\.net|win32|iis/", text):
        _add_score(scores, "Windows", 5)
        signals.append({"source": "http", "value": "IIS / Microsoft HTTP stack", "weight": "high"})
        product = product or "Microsoft IIS"
    if "nginx" in text:
        _add_score(scores, "Linux / Unix", 2)
        signals.append({"source": "http", "value": "nginx", "weight": "low"})
        product = product or "nginx on Unix-like host"
    if re.search(r"\bapache\b", text):
        _add_score(scores, "Linux / Unix", 2)
        signals.append({"source": "http", "value": "Apache", "weight": "low"})
    if re.search(r"cisco|junos|fortinet|mikrotik|vyos|palo alto", text):
        _add_score(scores, "Network appliance", 6)
        signals.append({"source": "banner", "value": "Network OS marker", "weight": "high"})
    if "cloudflare" in text:
        signals.append({"source": "http", "value": "Cloudflare edge; origin OS hidden", "weight": "low"})

    ttl = _read_ttl(host) if host else None
    ttl_guess = _ttl_family(ttl)
    if ttl is not None:
        signals.append({"source": "ip-ttl", "value": f"TTL {ttl}", "weight": "medium"})
        if ttl_guess:
            _add_score(scores, ttl_guess, 3)

    if not scores:
        family = "Generic network host" if ports & {80, 443} else "Unknown"
        confidence = "low"
        basis = "Insufficient identifying banners or OS-specific services"
    else:
        ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
        family, top_score = ranked[0]
        runner = ranked[1][1] if len(ranked) > 1 else 0
        if top_score >= 8 and top_score - runner >= 3:
            confidence = "high"
        elif top_score >= 4:
            confidence = "medium"
        else:
            confidence = "low"
        if family == "Windows" and scores.get("Linux / Unix", 0) >= 4:
            family = "Mixed / virtualized"
            confidence = "medium"
            product = product or "Windows services with SSH"
        basis = "; ".join(signal["value"] for signal in signals[:4]) or "Service combination"

    alternatives = [
        {"family": name, "score": value}
        for name, value in sorted(scores.items(), key=lambda item: item[1], reverse=True)
        if name != family
    ][:3]

    return {
        "family": family,
        "product": product,
        "confidence": confidence,
        "basis": basis,
        "ttl": ttl,
        "method": "multi-signal",
        "depth": "advanced",
        "signals": signals,
        "alternatives": alternatives,
        "scores": scores,
    }


def _findings(open_ports: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    findings = []
    for row in open_ports:
        if row.get("protocol") != "tcp" or row.get("state") != "open":
            continue
        detail = RISKY_PORTS.get(row["port"])
        if not detail:
            continue
        severity, detail_text = detail
        findings.append({
            "port": row["port"],
            "service": row.get("service"),
            "severity": severity,
            "title": f"Exposed {row.get('service', 'service')} on port {row['port']}",
            "detail": detail_text,
        })
    return findings


def _risk_grade(open_ports: List[Dict[str, Any]], findings: List[Dict[str, Any]]) -> str:
    severities = {item["severity"] for item in findings}
    if "critical" in severities:
        return "F"
    if "high" in severities:
        return "D"
    open_count = len([p for p in open_ports if p.get("state") == "open"])
    if "medium" in severities or open_count >= 8:
        return "C"
    if open_count >= 3:
        return "B"
    return "A"


def _lookup_shodan(host: str) -> Dict[str, Any]:
    if not settings.SHODAN_API_KEY:
        return {"enabled": False, "reason": "SHODAN_API_KEY is not configured"}
    url = f"https://api.shodan.io/shodan/host/{host}?key={settings.SHODAN_API_KEY}"
    try:
        with urllib.request.urlopen(url, timeout=6) as resp:
            data = json.loads(resp.read().decode("utf-8", errors="ignore"))
        return {
            "enabled": True,
            "org": data.get("org"),
            "isp": data.get("isp"),
            "os": data.get("os"),
            "ports": data.get("ports") or [],
            "tags": data.get("tags") or [],
        }
    except Exception as exc:
        return {"enabled": True, "error": str(exc)[:160]}


def _lookup_virustotal(host: str) -> Dict[str, Any]:
    if not settings.VIRUSTOTAL_API_KEY:
        return {"enabled": False, "reason": "VIRUSTOTAL_API_KEY is not configured"}
    req = urllib.request.Request(
        f"https://www.virustotal.com/api/v3/ip_addresses/{host}",
        headers={"x-apikey": settings.VIRUSTOTAL_API_KEY},
    )
    try:
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode("utf-8", errors="ignore"))
        stats = (((data.get("data") or {}).get("attributes") or {}).get("last_analysis_stats") or {})
        return {"enabled": True, "stats": stats, "asn": ((data.get("data") or {}).get("attributes") or {}).get("asn")}
    except Exception as exc:
        return {"enabled": True, "error": str(exc)[:160]}


def _tcp_reachable(host: str, port: int, timeout: float) -> bool:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    try:
        return sock.connect_ex((host, port)) == 0
    except Exception:
        return False
    finally:
        sock.close()


def _ping_check(host: str, timeout: float) -> Dict[str, Any]:
    reachable = _tcp_reachable(host, 80, timeout) or _tcp_reachable(host, 443, timeout) or _tcp_reachable(host, 22, timeout)
    return {"method": "tcp-connect", "reachable": reachable}


def build_scan_plan(options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    options = options or {}
    preset = str(options.get("preset") or "standard").lower()
    defaults = PRESET_DEFAULTS.get(preset, PRESET_DEFAULTS["standard"])
    timing = str(options.get("timing") or defaults["timing"]).upper()
    if timing not in TIMING_PROFILE:
        timing = defaults["timing"]
    port_range = options.get("portRange") or options.get("port_range") or defaults["port_range"]
    enable_udp = bool(options.get("enableUdp", options.get("enable_udp", defaults["udp"])) or preset == "udp")
    enable_os = bool(options.get("enableOsDetect", options.get("enable_os_detect", defaults["os"])))
    enable_findings = bool(options.get("enableNse", options.get("enable_nse", defaults["findings"])))
    enable_http_tls = bool(options.get("enableHttpTls", options.get("enable_http_tls", defaults["http_tls"]))) or enable_os
    enable_shodan = bool(options.get("enableShodan", options.get("enable_shodan", False)))
    enable_vt = bool(options.get("enableVirusTotal", options.get("enable_virus_total", False)))
    use_host_discovery = bool(options.get("useHostDiscovery", options.get("use_host_discovery", False)))
    profile = TIMING_PROFILE[timing]
    timeout = float(options.get("timeout") or profile["timeout"])
    workers = int(options.get("concurrency") or profile["workers"])
    tcp_ports = [] if preset == "udp" and port_range in {"udp", "top1000", "top100", "top40"} else parse_port_spec(str(port_range))
    if enable_os and preset != "udp":
        tcp_ports = sorted(set(tcp_ports).union(OS_HINT_PORTS))
    return {
        "preset": preset,
        "timing": timing,
        "port_range": port_range,
        "tcp_ports": tcp_ports,
        "udp_ports": list(UDP_PORTS) if enable_udp or preset in {"udp", "full"} else [],
        "timeout": timeout,
        "workers": max(4, min(workers, 96)),
        "enable_os": enable_os,
        "enable_findings": enable_findings,
        "enable_http_tls": enable_http_tls,
        "enable_shodan": enable_shodan,
        "enable_vt": enable_vt,
        "use_host_discovery": use_host_discovery,
        "engine": "nmap" if settings.USE_NMAP and is_nmap_available() else "tcp-http-probe",
        "privileged": nmap_has_privileges() if settings.USE_NMAP and is_nmap_available() else False,
        "command": (
            nmap_command_preview("<target>", options)
            if settings.USE_NMAP and is_nmap_available()
            else (
                f"tcp-probe --preset {preset} --timing {timing} --ports {port_range}"
                f"{' --udp' if enable_udp or preset in {'udp', 'full'} else ''}"
                f"{' --http-tls' if enable_http_tls else ''}"
                f"{' --os-fingerprint' if enable_os else ''}"
                f"{' --risk-findings' if enable_findings else ''}"
            )
        ),
    }


def probe_host(target: str, ports: Optional[List[int]] = None, timeout: float = 0.4, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    if is_blocked_target(target):
        raise ValueError("RFC1918/internal targets are blocked. Set ALLOW_INTERNAL_SCAN=true to override.")

    started = datetime.now(timezone.utc)
    plan = build_scan_plan(options)
    if ports:
        plan["tcp_ports"] = list(ports)
        plan["timeout"] = timeout

    host = target.strip()
    try:
        resolved = socket.getaddrinfo(host, None, socket.AF_INET)[0][4][0]
    except Exception:
        resolved = host

    if settings.USE_NMAP and is_nmap_available():
        nmap_result = run_nmap_scan(host, options or {"preset": plan["preset"], "timing": plan["timing"], "portRange": plan["port_range"], "enableOsDetect": plan["enable_os"], "enableNse": plan["enable_findings"], "enableUdp": bool(plan["udp_ports"])})
        open_ports = nmap_result.get("open_ports") or []
        udp_ports = nmap_result.get("udp_ports") or []
        http_rows = []
        tls_rows = []
        if plan["enable_http_tls"]:
            for row in open_ports:
                if row["port"] in HTTP_PORTS:
                    inspected = _http_inspect(host, row["port"], False, max(plan["timeout"], 1.2))
                    if inspected:
                        http_rows.append(inspected)
                if row["port"] in TLS_PORTS:
                    inspected = _http_inspect(host, row["port"], True, max(plan["timeout"], 1.5))
                    if inspected:
                        http_rows.append(inspected)
                    cert = _tls_inspect(host, row["port"], max(plan["timeout"], 1.5))
                    if cert:
                        tls_rows.append(cert)
        os_guess = nmap_result.get("os")
        if plan["enable_os"] and (not os_guess or (os_guess.get("accuracy") or 0) < 70):
            inferred = _fingerprint_os(open_ports, http_rows, tls_rows, resolved)
            if not os_guess:
                os_guess = inferred
            else:
                os_guess["signals"] = (os_guess.get("signals") or []) + inferred.get("signals", [])
                if not os_guess.get("product"):
                    os_guess["product"] = inferred.get("product")
        findings = nmap_result.get("findings") or []
        if plan["enable_findings"]:
            extra = _findings(open_ports)
            existing = {(item.get("port"), item.get("title")) for item in findings}
            findings.extend([item for item in extra if (item.get("port"), item.get("title")) not in existing])
        risk_grade = _risk_grade(open_ports, findings)
        shodan = _lookup_shodan(resolved) if plan["enable_shodan"] else None
        virustotal = _lookup_virustotal(resolved) if plan["enable_vt"] else None
        duration_ms = nmap_result.get("duration_ms") or int((datetime.now(timezone.utc) - started).total_seconds() * 1000)
        open_count = len([p for p in open_ports if p.get("state") == "open"])
        return {
            "target": target,
            "resolved_ip": resolved,
            "open_ports": open_ports,
            "udp_ports": udp_ports,
            "http": http_rows,
            "tls": tls_rows,
            "os": os_guess,
            "findings": findings,
            "risk_grade": risk_grade,
            "shodan": shodan,
            "virustotal": virustotal,
            "summary": f"{open_count} open ports on {target} via nmap ({plan['preset']} / {plan['timing']}, {duration_ms} ms)",
            "duration_ms": duration_ms,
            "scan_options": {**plan, "command": nmap_result.get("command") or plan.get("command"), "tcp_ports": len(plan["tcp_ports"]), "udp_ports": len(plan["udp_ports"])},
            "engine": "nmap",
            "nmap": {
                "command": nmap_result.get("command"),
                "privileged": nmap_result.get("privileged"),
                "scripts": nmap_result.get("scripts") or [],
            },
        }

    if plan["use_host_discovery"]:
        discovery = _ping_check(resolved, plan["timeout"])
        if not discovery.get("reachable"):
            duration_ms = int((datetime.now(timezone.utc) - started).total_seconds() * 1000)
            return {
                "target": target,
                "resolved_ip": resolved,
                "open_ports": [],
                "udp_ports": [],
                "http": [],
                "tls": [],
                "os": None,
                "findings": [],
                "risk_grade": "A",
                "shodan": None,
                "virustotal": None,
                "summary": f"Host discovery failed for {target}; TCP/HTTP probes were not started.",
                "duration_ms": duration_ms,
                "scan_options": {**plan, "tcp_ports": len(plan["tcp_ports"]), "udp_ports": len(plan["udp_ports"])},
                "host_discovery": discovery,
            }

    open_ports: List[Dict[str, Any]] = []
    if plan["tcp_ports"]:
        with ThreadPoolExecutor(max_workers=plan["workers"]) as pool:
            futures = [pool.submit(_tcp_probe, resolved, port, plan["timeout"]) for port in plan["tcp_ports"]]
            for future in as_completed(futures):
                row = future.result()
                if row:
                    open_ports.append(row)
        open_ports.sort(key=lambda item: item["port"])
        if plan["enable_os"]:
            for row in open_ports:
                if row["port"] in GREETING_PORTS and not (row.get("banner") or "").strip():
                    greeting = _read_greeting(resolved, row["port"], 1.6)
                    if greeting:
                        row["banner"] = greeting.replace("\r", " ").replace("\n", " ").strip()[:120]

    udp_ports: List[Dict[str, Any]] = []
    if plan["udp_ports"]:
        with ThreadPoolExecutor(max_workers=min(8, plan["workers"])) as pool:
            futures = [pool.submit(_udp_probe, resolved, port, max(plan["timeout"], 0.6)) for port in plan["udp_ports"]]
            for future in as_completed(futures):
                row = future.result()
                if row:
                    udp_ports.append(row)
        udp_ports.sort(key=lambda item: item["port"])

    http_rows = []
    tls_rows = []
    if plan["enable_http_tls"]:
        for row in open_ports:
            if row["port"] in HTTP_PORTS:
                inspected = _http_inspect(host, row["port"], False, max(plan["timeout"], 1.2))
                if inspected:
                    http_rows.append(inspected)
            if row["port"] in TLS_PORTS:
                inspected = _http_inspect(host, row["port"], True, max(plan["timeout"], 1.5))
                if inspected:
                    http_rows.append(inspected)
                cert = _tls_inspect(host, row["port"], max(plan["timeout"], 1.5))
                if cert:
                    tls_rows.append(cert)

    os_guess = (
        _fingerprint_os(open_ports, http_rows, tls_rows, resolved)
        if plan["enable_os"]
        else None
    )
    findings = _findings(open_ports) if plan["enable_findings"] else []
    risk_grade = _risk_grade(open_ports, findings)
    shodan = _lookup_shodan(resolved) if plan["enable_shodan"] else None
    virustotal = _lookup_virustotal(resolved) if plan["enable_vt"] else None
    duration_ms = int((datetime.now(timezone.utc) - started).total_seconds() * 1000)
    open_count = len([p for p in open_ports if p.get("state") == "open"])
    summary = f"{open_count} open TCP ports on {target} ({plan['preset']} / {plan['timing']}, {duration_ms} ms)"
    return {
        "target": target,
        "resolved_ip": resolved,
        "open_ports": open_ports,
        "udp_ports": udp_ports,
        "http": http_rows,
        "tls": tls_rows,
        "os": os_guess,
        "findings": findings,
        "risk_grade": risk_grade,
        "shodan": shodan,
        "virustotal": virustotal,
        "summary": summary,
        "duration_ms": duration_ms,
        "scan_options": {**plan, "tcp_ports": len(plan["tcp_ports"]), "udp_ports": len(plan["udp_ports"])},
        "engine": "tcp-http-probe",
    }
