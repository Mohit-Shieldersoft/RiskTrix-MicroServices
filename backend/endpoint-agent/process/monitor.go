package process

import (
	"endpoint-agent/config"
)

type Monitor struct {
	config *config.Config
}

func NewMonitor(cfg *config.Config) *Monitor {
	return &Monitor{config: cfg}
}

func (p *Monitor) Start() {
	// TODO: Implement process monitoring
}
