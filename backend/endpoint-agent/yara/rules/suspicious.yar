rule Suspicious_Process {
    meta:
        description = "Detects suspicious process patterns"
    strings:
        $powershell = "powershell.exe" nocase
        $encoded = "-EncodedCommand" nocase
    condition:
        $powershell and $encoded
}