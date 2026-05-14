package config

import (
	"os"
	"strconv"
	"time"

	"github.com/google/uuid"
)

type Config struct {
	AgentServiceURL  string
	BinaryServiceURL string
	SecretKey        string
	ScanInterval     time.Duration
	WatchPaths       []string
	AgentID          string
	JWTToken         string
	Registered       bool
}

func LoadConfig() *Config {
	agentID := getEnv("AGENT_ID", "")
	if agentID == "" {
		agentID = uuid.New().String()
	}

	jwtToken := getEnv("JWT_TOKEN", "")
	registered := jwtToken != ""

	return &Config{
		AgentServiceURL:  getEnv("AGENT_SERVICE_URL", "http://localhost:8010"),
		BinaryServiceURL: getEnv("BINARY_SERVICE_URL", "http://localhost:8011"),
		SecretKey:        getEnv("SECRET_KEY", "default-secret"),
		ScanInterval:     time.Duration(getEnvAsInt("SCAN_INTERVAL", 30)) * time.Second,
		WatchPaths:       []string{"C:\\Temp", "C:\\Windows\\System32\\notepad.exe"},
		AgentID:          agentID,
		JWTToken:         jwtToken,
		Registered:       registered,
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

// SaveConfig saves the agent ID and JWT token to environment or config file
func (c *Config) SaveConfig() error {
	// For now, just set environment variables
	// In production, this should save to a secure config file
	os.Setenv("AGENT_ID", c.AgentID)
	os.Setenv("JWT_TOKEN", c.JWTToken)
	c.Registered = true
	return nil
}
