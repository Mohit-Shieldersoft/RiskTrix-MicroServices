package transport

import "time"

type RegisterRequest struct {
	Hostname     string `json:"hostname"`
	OS           string `json:"os"`
	Arch         string `json:"arch"`
	AgentVersion string `json:"agent_version"`
	SecretKey    string `json:"secret_key"`
}

type RegisterResponse struct {
	AgentID  string `json:"agent_id"`
	JWTToken string `json:"jwt_token"`
}

type HeartbeatRequest struct {
	Status     string    `json:"status"`
	CPUUsage   float64   `json:"cpu_usage"`
	MemUsage   float64   `json:"mem_usage"`
	LastScanAt time.Time `json:"last_scan_at"`
}

type BinaryScanResult struct {
	AgentID   string  `json:"agent_id"`
	FilePath  string  `json:"file_path"`
	FileName  string  `json:"file_name"`
	SHA256    string  `json:"sha256"`
	MD5       string  `json:"md5"`
	FileSize  int64   `json:"file_size"`
	Entropy   float64 `json:"entropy"`
	FileType  string  `json:"file_type"`
	IsSigned  bool    `json:"is_signed"`
	ScannedAt string  `json:"scanned_at"`
}
