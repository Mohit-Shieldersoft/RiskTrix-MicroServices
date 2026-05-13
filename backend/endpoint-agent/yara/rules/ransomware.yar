rule Ransomware_FileExtension_Change {
    meta:
        description = "Detects mass file extension change typical of ransomware"
    strings:
        $ext1 = ".locked" nocase
        $ext2 = ".encrypted" nocase
        $ext3 = ".crypted" nocase
    condition:
        any of them
}