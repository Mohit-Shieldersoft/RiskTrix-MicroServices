package platform

import (
	"os"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/net"
	"github.com/shirou/gopsutil/v3/process"
)

// LinuxPlatform implements PlatformInterface for Linux
type LinuxPlatform struct{}

// GetSystemInfo returns basic system information for Linux
func (p *LinuxPlatform) GetSystemInfo() (*SystemInfo, error) {
	hostInfo, err := host.Info()
	if err != nil {
		return nil, err
	}

	hostname, _ := os.Hostname()

	return &SystemInfo{
		Hostname:      hostname,
		OS:           hostInfo.OS,
		OSVersion:    hostInfo.PlatformVersion,
		KernelVersion: hostInfo.KernelVersion,
		Uptime:       time.Duration(hostInfo.Uptime) * time.Second,
	}, nil
}

// GetProcesses returns list of running processes for Linux
func (p *LinuxPlatform) GetProcesses() ([]ProcessInfo, error) {
	processes, err := process.Processes()
	if err != nil {
		return nil, err
	}

	var result []ProcessInfo
	for _, proc := range processes {
		name, _ := proc.Name()
		username, _ := proc.Username()
		cpuPercent, _ := proc.CPUPercent()
		memPercent, _ := proc.MemoryPercent()
		createTime, _ := proc.CreateTime()

		result = append(result, ProcessInfo{
			PID:        proc.Pid,
			Name:       name,
			User:       username,
			CPUPercent: cpuPercent,
			MemPercent: memPercent,
			StartTime:  time.Unix(createTime/1000, 0),
		})
	}

	return result, nil
}

// GetHardwareInfo returns hardware information for Linux
func (p *LinuxPlatform) GetHardwareInfo() (*HardwareInfo, error) {
	cpuInfo, err := cpu.Info()
	if err != nil {
		return nil, err
	}

	memInfo, err := mem.VirtualMemory()
	if err != nil {
		return nil, err
	}

	diskInfo, err := disk.Usage("/")
	if err != nil {
		return nil, err
	}

	var cpuModel string
	if len(cpuInfo) > 0 {
		cpuModel = cpuInfo[0].ModelName
	}

	return &HardwareInfo{
		CPUModel:    cpuModel,
		CPUCount:    len(cpuInfo),
		MemoryTotal: memInfo.Total,
		MemoryUsed:  memInfo.Used,
		DiskTotal:   diskInfo.Total,
		DiskUsed:    diskInfo.Used,
	}, nil
}

// GetSoftwareInfo returns installed software information for Linux
func (p *LinuxPlatform) GetSoftwareInfo() ([]SoftwareInfo, error) {
	// TODO: Implement package manager-based software enumeration (apt, yum, etc.)
	return []SoftwareInfo{}, nil
}

// GetNetworkInfo returns network interface information for Linux
func (p *LinuxPlatform) GetNetworkInfo() ([]NetworkInfo, error) {
	interfaces, err := net.Interfaces()
	if err != nil {
		return nil, err
	}

	var result []NetworkInfo
	for _, iface := range interfaces {
		var ipAddr, netmask string
		if len(iface.Addrs) > 0 {
			ipAddr = iface.Addrs[0].Addr
		}

		result = append(result, NetworkInfo{
			Name:      iface.Name,
			MAC:       iface.HardwareAddr,
			IPAddress: ipAddr,
			Netmask:   netmask,
		})
	}

	return result, nil
}