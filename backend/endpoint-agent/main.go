package main

import (
	"context"
	"time"

	"endpoint-agent/config"
	"endpoint-agent/internal/platform"
	"endpoint-agent/transport"
	"endpoint-agent/utils"

	"go.uber.org/zap"
)

func main() {
	// Initialize logger
	logger := utils.NewLogger()
	defer logger.Sync()

	logger.Info("🚀 Starting RiskTrix Endpoint Agent...")

	// Load configuration
	cfg := config.LoadConfig()
	logger.Info("Loaded configuration",
		zap.String("agentServiceURL", cfg.AgentServiceURL),
		zap.String("agentID", cfg.AgentID),
		zap.Bool("registered", cfg.Registered))

	// Initialize platform abstraction
	plat, err := platform.NewPlatform()
	if err != nil {
		logger.Fatal("Failed to initialize platform", zap.Error(err))
	}

	// Get system information
	sysInfo, err := plat.GetSystemInfo()
	if err != nil {
		logger.Error("Failed to get system info", zap.Error(err))
	} else {
		logger.Info("System information",
			zap.String("hostname", sysInfo.Hostname),
			zap.String("os", sysInfo.OS),
			zap.String("osVersion", sysInfo.OSVersion))
	}

	// Initialize transport client
	client := transport.NewClient(cfg)

	// Register agent if not already registered
	if !cfg.Registered {
		logger.Info("Agent not registered, attempting registration...")
		if err := client.Register(); err != nil {
			logger.Fatal("Failed to register agent", zap.Error(err))
		}
		logger.Info("Agent registered successfully",
			zap.String("agentID", cfg.AgentID))
	} else {
		logger.Info("Agent already registered", zap.String("agentID", cfg.AgentID))
	}

	// Start heartbeat goroutine
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				if err := client.SendHeartbeat(); err != nil {
					logger.Error("Failed to send heartbeat", zap.Error(err))
				} else {
					logger.Debug("Heartbeat sent successfully")
				}
			}
		}
	}()

	logger.Info("✅ Agent bootstrap complete. Running...")

	// Keep the agent running
	select {}
}
