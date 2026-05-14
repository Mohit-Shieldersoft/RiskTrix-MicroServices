package transport

import (
	"encoding/json"
	"endpoint-agent/config"
	"endpoint-agent/utils"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/go-resty/resty/v2"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/mem"
)

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

type Client struct {
	config       *config.Config
	agentClient  *resty.Client
	binaryClient *resty.Client
}

func NewClient(cfg *config.Config) *Client {
	// Use agent-service for registration/heartbeat, binary-analysis-service for scan results
	agentServiceURL := getEnv("AGENT_SERVICE_URL", "http://localhost:8010")
	binaryServiceURL := getEnv("BINARY_SERVICE_URL", "http://localhost:8011")

	agentClient := resty.New().
		SetBaseURL(agentServiceURL).
		SetHeader("Content-Type", "application/json")

	binaryClient := resty.New().
		SetBaseURL(binaryServiceURL).
		SetHeader("Content-Type", "application/json")

	return &Client{
		config:       cfg,
		agentClient:  agentClient,
		binaryClient: binaryClient,
	}
}

func (c *Client) Register() error {
	hostname, err := os.Hostname()
	if err != nil {
		hostname = "unknown"
	}

	req := RegisterRequest{
		Hostname:     hostname,
		OS:           utils.GetOS(),
		Arch:         utils.GetArch(),
		AgentVersion: "1.0.0",
		SecretKey:    c.config.SecretKey,
	}

	resp, err := c.agentClient.R().
		SetBody(req).
		Post("/api/v1/agents/register")

	if err != nil {
		return err
	}

	if resp.StatusCode() != http.StatusOK {
		return fmt.Errorf("registration failed: %s", resp.String())
	}

	var regResp RegisterResponse
	if err := json.Unmarshal(resp.Body(), &regResp); err != nil {
		return err
	}

	c.config.AgentID = regResp.AgentID
	c.config.JWTToken = regResp.JWTToken

	// Save config
	return c.config.SaveConfig()
}

func (c *Client) SendHeartbeat() error {
	if c.config.AgentID == "" || c.config.JWTToken == "" {
		return fmt.Errorf("agent not registered")
	}

	// Get CPU usage
	cpuPercent, err := cpu.Percent(time.Second, false)
	if err != nil {
		cpuPercent = []float64{0.0}
	}

	// Get memory usage
	memStats, err := mem.VirtualMemory()
	if err != nil {
		memStats = &mem.VirtualMemoryStat{}
	}

	req := HeartbeatRequest{
		Status:     "active",
		CPUUsage:   cpuPercent[0],
		MemUsage:   memStats.UsedPercent,
		LastScanAt: time.Now(), // TODO: track actual last scan time
	}

	resp, err := c.agentClient.R().
		SetAuthToken(c.config.JWTToken).
		SetBody(req).
		Post(fmt.Sprintf("/api/v1/agents/%s/heartbeat", c.config.AgentID))

	if err != nil {
		return err
	}

	if resp.StatusCode() != http.StatusOK {
		return fmt.Errorf("heartbeat failed: %s", resp.String())
	}

	return nil
}

func (c *Client) SendScanResult(result BinaryScanResult) error {
	if c.config.AgentID == "" || c.config.JWTToken == "" {
		return fmt.Errorf("agent not registered")
	}

	resp, err := c.binaryClient.R().
		SetAuthToken(c.config.JWTToken).
		SetBody(result).
		Post("/api/v1/binary/submit")

	if err != nil {
		return err
	}

	if resp.StatusCode() != http.StatusOK {
		return fmt.Errorf("scan result submission failed: %s", resp.String())
	}

	return nil
}

// GetAgentID returns the agent's ID
func (c *Client) GetAgentID() string {
	return c.config.AgentID
}

// GetJWTToken returns the agent's JWT token
func (c *Client) GetJWTToken() string {
	return c.config.JWTToken
}

// GetAgentClient returns the agent service HTTP client
func (c *Client) GetAgentClient() *resty.Client {
	return c.agentClient
}
