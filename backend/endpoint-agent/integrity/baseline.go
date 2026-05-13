package integrity

import (
	"endpoint-agent/config"
)

type Integrity struct {
	config *config.Config
}

func NewIntegrity(cfg *config.Config) *Integrity {
	return &Integrity{config: cfg}
}

func (i *Integrity) Start() {
	// TODO: Implement integrity monitoring
}
