package monitor

import (
	"runtime"
)

// GetWatchPaths returns OS-specific critical paths
func GetWatchPaths() []string {
	switch runtime.GOOS {
	case "windows":
		return []string{
			`C:\Windows\System32`,
			`C:\Users`,
			`C:\ProgramData`,
			`C:\Windows\Temp`,
			`C:\Users\*\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup`,
		}
	case "linux":
		return []string{
			"/bin",
			"/sbin",
			"/usr/bin",
			"/usr/sbin",
			"/tmp",
			"/var/tmp",
			"/etc/cron.d",
			"/etc/init.d",
			"/home",
		}
	case "darwin":
		return []string{
			"/usr/bin",
			"/usr/local/bin",
			"/Library/LaunchAgents",
			"/Library/LaunchDaemons",
			"/Users",
			"/tmp",
		}
	default:
		return []string{"/tmp"}
	}
}
