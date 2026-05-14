package platform

import "time"

// PlatformInterface defines the interface for OS-specific operations
type PlatformInterface interface {
	// GetSystemInfo returns basic system information
	GetSystemInfo() (*SystemInfo, error)

	// GetProcesses returns list of running processes
	GetProcesses() ([]ProcessInfo, error)

	// GetHardwareInfo returns hardware information
	GetHardwareInfo() (*HardwareInfo, error)

	// GetSoftwareInfo returns installed software information
	GetSoftwareInfo() ([]SoftwareInfo, error)

	// GetNetworkInfo returns network interface information
	GetNetworkInfo() ([]NetworkInfo, error)
}

// SystemInfo contains basic system information
type SystemInfo struct {
	Hostname      string
	OS            string
	OSVersion     string
	KernelVersion string
	Uptime        time.Duration
}

// ProcessInfo contains process information
type ProcessInfo struct {
	PID        int32
	Name       string
	Path       string
	User       string
	CPUPercent float64
	MemPercent float32
	StartTime  time.Time
}

// HardwareInfo contains hardware information
type HardwareInfo struct {
	CPUModel    string
	CPUCount    int
	MemoryTotal uint64
	MemoryUsed  uint64
	DiskTotal   uint64
	DiskUsed    uint64
}

// SoftwareInfo contains installed software information
type SoftwareInfo struct {
	Name        string
	Version     string
	Vendor      string
	InstallDate time.Time
	InstallPath string
}

// NetworkInfo contains network interface information
type NetworkInfo struct {
	Name      string
	MAC       string
	IPAddress string
	Netmask   string
}
