import re
import shutil
import subprocess
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.core.config import settings

NSE_VULN_MAP = {
    "ssl-heartbleed": ("CVE-2014-0160", "critical", "OpenSSL Heartbleed"),
    "ssl-poodle": ("CVE-2014-3566", "high", "POODLE SSLv3"),
    "ssl-ccs-injection": ("CVE-2014-0224", "critical", "OpenSSL CCS injection"),
    "smb-vuln-ms17-010": ("CVE-2017-0144", "critical", "EternalBlue SMBv1"),
    "smb-vuln-cve-2017-7494": ("CVE-2017-7494", "critical", "SambaCry"),
    "smb-vuln-ms08-067": ("CVE-2008-4250", "critical", "MS08-067 NetAPI"),
    "http-shellshock": ("CVE-2014-6271", "critical", "Shellshock"),
    "ftp-anon": ("CVE-1999-0497", "medium", "Anonymous FTP login"),
    "mysql-empty-password": ("CVE-2012-2122", "critical", "MySQL empty password"),
    "rdp-vuln-ms12-020": ("CVE-2012-0002", "critical", "MS12-020 RDP"),
    "ssh-auth-methods": ("INFO-SSH-AUTH", "low", "SSH authentication methods"),
    "smb-enum-shares": ("INFO-SMB-SHARES", "high", "SMB share enumeration"),
    "telnet-encryption": ("INFO-TELNET", "critical", "Cleartext Telnet"),
}

_NMAP_AVAILABLE = None
_NMAP_CHECKED = 0.0
_NMAP_PRIV = None
_NMAP_PRIV_CHECKED = 0.0


def nmap_binary() -> str:
    return settings.NMAP_PATH or shutil.which("nmap") or "nmap"


def is_nmap_available() -> bool:
    global _NMAP_AVAILABLE, _NMAP_CHECKED
    now = time.time()
    if _NMAP_AVAILABLE is not None and now - _NMAP_CHECKED < 60:
        return _NMAP_AVAILABLE
    try:
        completed = subprocess.run([nmap_binary(), "--version"], capture_output=True, text=True, timeout=4)
        _NMAP_AVAILABLE = completed.returncode == 0
    except Exception:
        _NMAP_AVAILABLE = False
    _NMAP_CHECKED = now
    return _NMAP_AVAILABLE


def nmap_has_privileges() -> bool:
    global _NMAP_PRIV, _NMAP_PRIV_CHECKED
    now = time.time()
    if _NMAP_PRIV is not None and now - _NMAP_PRIV_CHECKED < 60:
        return _NMAP_PRIV
    if settings.SCANNER_ASSUME_PRIVILEGED:
        _NMAP_PRIV = True
        _NMAP_PRIV_CHECKED = now
        return True
    try:
        completed = subprocess.run(
            [nmap_binary(), "--privileged", "-sS", "-p", "80", "127.0.0.1"],
            capture_output=True,
            text=True,
            timeout=6,
        )
        text = f"{completed.stdout} {completed.stderr}"
        blocked = any(token in text.lower() for token in ("requires root", "not permitted", "failed to open device", "dnet:"))
        _NMAP_PRIV = not blocked
    except Exception as exc:
        text = str(exc).lower()
        _NMAP_PRIV = not any(token in text for token in ("requires root", "not permitted", "failed to open"))
    _NMAP_PRIV_CHECKED = now
    return bool(_NMAP_PRIV)


def resolve_port_range(port_range: Optional[str], include_udp: bool = False) -> str:
    raw = (port_range or "top100").strip()
    mapping = {
        "top40": "T:21,22,23,25,53,80,110,111,135,139,143,443,445,993,995,1723,3306,3389,5900,8080",
        "top100": "T:21,22,23,25,53,80,110,111,135,139,143,443,445,993,995,1433,1521,1723,3306,3389,5432,5900,6379,8080,8443,27017",
        "top1000": "T:1-1024,1433,1521,3306,3389,5432,5900,6379,8080,8443,9200,27017",
        "1-1024": "T:1-1024",
        "1-65535": "T:1-65535",
        "all": "T:1-65535",
        "full": "T:1-65535",
        "udp": "U:53,67,123,161,514,1900",
    }
    tcp = mapping.get(raw.lower(), raw)
    if raw.lower() not in mapping and re.fullmatch(r"[0-9,:\-TUtu\s]+", raw or ""):
        tcp = raw.replace(" ", "")
        if not tcp.upper().startswith(("T:", "U:")):
            tcp = f"T:{tcp}"
    elif raw.lower() not in mapping:
        tcp = mapping["top100"]
    if include_udp and "U:" not in tcp.upper():
        return f"{tcp},U:53,67,123,161,514,1900"
    return tcp


def build_nmap_args(target: str, options: Optional[Dict[str, Any]] = None, privileged: Optional[bool] = None) -> List[str]:
    options = options or {}
    preset = str(options.get("preset") or "standard").lower()
    timing = str(options.get("timing") or ("T4" if preset in {"quick", "full"} else "T3")).upper()
    if timing not in {"T1", "T2", "T3", "T4", "T5"}:
        timing = "T3"
    port_range = options.get("portRange") or options.get("port_range") or ("top1000" if preset != "quick" else "top40")
    enable_nse = options.get("enableNse", options.get("enable_nse"))
    enable_os = bool(options.get("enableOsDetect", options.get("enable_os_detect", preset in {"deep", "full", "standard", "stealth"})))
    enable_udp = bool(options.get("enableUdp", options.get("enable_udp", preset in {"udp", "full"})))
    privileged = nmap_has_privileges() if privileged is None else privileged
    tcp_scan = "-sS" if privileged else "-sT"
    args: List[str] = [f"-{timing}"]

    if preset == "quick":
        args += [tcp_scan, "-sV", "--version-intensity", "3"]
        if str(port_range) in {"top1000", "top1k"}:
            args += ["--top-ports", "1000"]
        else:
            args += ["-p", resolve_port_range(str(port_range), False)]
        args.append("--open")
    elif preset == "udp":
        args = ["-T4", "-sU", "-sV", "--version-intensity", "3", "--top-ports", "20", "--max-retries", "1"]
    elif preset == "stealth":
        args = ["-T3", "--min-rate", "300", tcp_scan, "-sV", "--version-intensity", "3"]
        args += ["-p", resolve_port_range(str(port_range), False)]
        if enable_nse is not False:
            args.append("--script=auth")
        args.append("--open")
    elif preset == "deep":
        args += ["--min-rate", "300", tcp_scan, "-sV", "--version-intensity", "5"]
        if enable_os and privileged:
            args.append("-O")
        args += ["-p", resolve_port_range(str(port_range), False)] if str(port_range) not in {"top1000", "top1k"} else ["--top-ports", "1000"]
        if enable_nse is not False:
            args.append("--script=default,vuln")
        args.append("--open")
    elif preset == "full":
        args = [f"-{timing}", "--min-rate", "800", "--max-retries", "1", tcp_scan, "-sV", "--version-intensity", "4"]
        if enable_os and privileged:
            args.append("-O")
        if enable_nse is not False:
            args.append("--script=default,vuln")
        args += ["-p", resolve_port_range(str(port_range) if str(port_range) not in {"top1000", "top1k", ""} else "1-65535", enable_udp or True)]
        args.append("--open")
    else:
        args += [tcp_scan, "-sV", "--version-intensity", "5"]
        if str(port_range) in {"top1000", "top1k"}:
            args += ["--top-ports", "1000"]
        else:
            args += ["-p", resolve_port_range(str(port_range), enable_udp)]
        if enable_nse is not False:
            args.append("--script=default")
        if enable_os and privileged:
            args.append("-O")
        args.append("--open")

    if enable_os and privileged and "-O" not in args:
        args.append("-O")
        args.append("--osscan-guess")
    args += ["--max-retries", "2", "--script-timeout", "15s"]
    args += ["--host-timeout", "600s" if preset in {"deep", "full", "stealth", "udp"} else "300s"]
    if privileged or settings.SCANNER_ASSUME_PRIVILEGED:
        args.append("--privileged")
    args += ["-oX", "-", target]
    return args


def nmap_command_preview(target: str, options: Optional[Dict[str, Any]] = None) -> str:
    return "nmap " + " ".join(build_nmap_args(target, options))


def _attr(node: Optional[ET.Element], name: str, default: str = "") -> str:
    if node is None:
        return default
    return node.attrib.get(name, default)


def _parse_os(host: Optional[ET.Element]) -> Optional[Dict[str, Any]]:
    if host is None:
        return None
    matches = []
    for osmatch in host.findall("./os/osmatch"):
        osclass = osmatch.find("osclass")
        matches.append({
            "name": _attr(osmatch, "name"),
            "accuracy": int(_attr(osmatch, "accuracy", "0") or 0),
            "family": _attr(osclass, "osfamily") if osclass is not None else "",
            "vendor": _attr(osclass, "vendor") if osclass is not None else "",
            "gen": _attr(osclass, "osgen") if osclass is not None else "",
        })
    if not matches:
        return None
    top = sorted(matches, key=lambda item: item["accuracy"], reverse=True)[0]
    accuracy = top["accuracy"]
    confidence = "high" if accuracy >= 90 else "medium" if accuracy >= 70 else "low"
    return {
        "family": top["family"] or top["name"] or "Unknown",
        "product": top["name"],
        "confidence": confidence,
        "accuracy": accuracy,
        "basis": f"nmap -O ({accuracy}% {top['name']})",
        "method": "nmap",
        "depth": "nmap-os-detect",
        "matches": matches[:5],
        "signals": [{"source": "nmap-os", "value": f"{item['name']} ({item['accuracy']}%)", "weight": "high"} for item in matches[:4]],
        "alternatives": [{"family": item["name"], "score": item["accuracy"]} for item in matches[1:4]],
    }


def parse_nmap_xml(xml_text: str, target: str) -> Dict[str, Any]:
    open_ports: List[Dict[str, Any]] = []
    udp_ports: List[Dict[str, Any]] = []
    findings: List[Dict[str, Any]] = []
    scripts: List[Dict[str, Any]] = []
    if not xml_text or "<nmaprun" not in xml_text:
        return {"open_ports": [], "udp_ports": [], "findings": [], "os": None, "scripts": []}
    root = ET.fromstring(xml_text)
    host = root.find("host")
    port_nodes = host.findall("./ports/port") if host is not None else []
    for port_node in port_nodes:
        port = int(_attr(port_node, "portid") or 0)
        protocol = _attr(port_node, "protocol", "tcp")
        state = _attr(port_node.find("state"), "state", "closed")
        service = port_node.find("service")
        name = _attr(service, "name", "unknown")
        product = _attr(service, "product")
        version = _attr(service, "version")
        extra = _attr(service, "extrainfo")
        ostype = _attr(service, "ostype")
        banner = " ".join(part for part in (product, version, extra) if part).strip()
        row = {
            "port": port,
            "protocol": protocol,
            "state": state,
            "service": name,
            "product": product or None,
            "version": version or None,
            "extra": extra or None,
            "ostype": ostype or None,
            "banner": banner or name,
            "category": "nmap",
        }
        if state == "open":
            (udp_ports if protocol == "udp" else open_ports).append(row)
        for script in port_node.findall("script"):
            script_id = _attr(script, "id")
            output = _attr(script, "output")
            scripts.append({"id": script_id, "port": port, "output": output[:400]})
            mapped = NSE_VULN_MAP.get(script_id)
            cves = re.findall(r"CVE-\d{4}-\d{4,7}", output, flags=re.I)
            if mapped:
                cve_id, severity, title = mapped
                findings.append({
                    "port": port,
                    "service": name,
                    "severity": severity,
                    "title": title,
                    "detail": output[:240],
                    "cveId": cve_id,
                    "nseScript": script_id,
                })
            for cve in list(dict.fromkeys(item.upper() for item in cves))[:4]:
                if any(item.get("cveId") == cve and item.get("port") == port for item in findings):
                    continue
                findings.append({
                    "port": port,
                    "service": name,
                    "severity": "high",
                    "title": f"{cve} on {name}",
                    "detail": output[:240],
                    "cveId": cve,
                    "nseScript": script_id,
                })
    return {
        "open_ports": sorted(open_ports, key=lambda item: item["port"]),
        "udp_ports": sorted(udp_ports, key=lambda item: item["port"]),
        "findings": findings,
        "os": _parse_os(host),
        "scripts": scripts,
    }


def run_nmap_scan(target: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    started = datetime.now(timezone.utc)
    privileged = nmap_has_privileges()
    args = build_nmap_args(target, options, privileged)
    command = "nmap " + " ".join(args)
    try:
        completed = subprocess.run(
            [nmap_binary(), *args],
            capture_output=True,
            text=True,
            timeout=int(settings.NMAP_TIMEOUT_SECONDS),
        )
        xml_text = completed.stdout or ""
        if "<nmaprun" not in xml_text and completed.stderr:
            raise RuntimeError(completed.stderr[:240])
    except subprocess.TimeoutExpired as exc:
        xml_text = exc.stdout.decode("utf-8", errors="ignore") if isinstance(exc.stdout, bytes) else (exc.stdout or "")
        if "<nmaprun" not in xml_text:
            parsed = {"open_ports": [], "udp_ports": [], "findings": [], "os": None, "scripts": []}
            duration_ms = int((datetime.now(timezone.utc) - started).total_seconds() * 1000)
            return {
                **parsed,
                "engine": "nmap",
                "command": command,
                "privileged": privileged,
                "status": "COMPLETED_WITH_LIMITATIONS",
                "duration_ms": duration_ms,
            }
    parsed = parse_nmap_xml(xml_text, target)
    used_privileged = privileged
    if privileged and not parsed.get("open_ports") and not parsed.get("udp_ports") and "-sS" in args:
        fallback_args = build_nmap_args(target, options, privileged=False)
        fallback_cmd = "nmap " + " ".join(fallback_args)
        try:
            retry = subprocess.run(
                [nmap_binary(), *fallback_args],
                capture_output=True,
                text=True,
                timeout=int(settings.NMAP_TIMEOUT_SECONDS),
            )
            if "<nmaprun" in (retry.stdout or ""):
                parsed = parse_nmap_xml(retry.stdout, target)
                command = fallback_cmd
                xml_text = retry.stdout
                used_privileged = False
        except Exception:
            pass
    duration_ms = int((datetime.now(timezone.utc) - started).total_seconds() * 1000)
    return {
        **parsed,
        "engine": "nmap",
        "command": command,
        "privileged": used_privileged,
        "status": "COMPLETED",
        "duration_ms": duration_ms,
        "raw_xml": xml_text[:20000],
    }
