package platform

import (
	"fmt"
	"runtime"
)

// NewPlatform returns the appropriate platform implementation
func NewPlatform() (PlatformInterface, error) {
	switch runtime.GOOS {
	case "windows":
		return &WindowsPlatform{}, nil
	case "linux":
		return &LinuxPlatform{}, nil
	case "darwin":
		return &MacOSPlatform{}, nil
	default:
		return nil, fmt.Errorf("unsupported platform: %s", runtime.GOOS)
	}
}
