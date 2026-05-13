package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	AgentServiceURL  string
	BinaryServiceURL string
	SecretKey        string
	ScanInterval     time.Duration
	WatchPaths       []string
	AgentID          string
	JWTToken         string
}

func LoadConfig() *Config {
	return &Config{
		AgentServiceURL:  getEnv("AGENT_SERVICE_URL", "http://localhost:8010"),
		BinaryServiceURL: getEnv("BINARY_SERVICE_URL", "http://localhost:8011"),
		SecretKey:        getEnv("SECRET_KEY", "default-secret"),
		ScanInterval:     time.Duration(getEnvAsInt("SCAN_INTERVAL", 30)) * time.Second,     // 30 seconds for testing
		WatchPaths:       []string{"C:\\Temp", "C:\\Windows\\System32\\notepad.exe"},        // Simple test paths
		AgentID:          getEnv("AGENT_ID", "2f396b1e-7475-42b8-b217-4aec6a430aed"),        // Use existing agent ID
		JWTToken:         getEnv("JWT_TOKEN", "agent-2f396b1e-7475-42b8-b217-4aec6a430aed"), // Use existing token
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}
