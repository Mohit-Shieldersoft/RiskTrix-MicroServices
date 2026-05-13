package monitor

import (
	"endpoint-agent/config"
	"log"

	"github.com/fsnotify/fsnotify"
)

type Monitor struct {
	config  *config.Config
	watcher *fsnotify.Watcher
}

func NewMonitor(cfg *config.Config) *Monitor {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		log.Fatal(err)
	}
	return &Monitor{config: cfg, watcher: watcher}
}

func (m *Monitor) Start() {
	defer m.watcher.Close()

	// Set OS-specific watch paths
	m.config.WatchPaths = GetWatchPaths()

	for _, path := range m.config.WatchPaths {
		if err := m.watcher.Add(path); err != nil {
			log.Printf("Failed to watch %s: %v", path, err)
		} else {
			log.Printf("Watching %s", path)
		}
	}

	for {
		select {
		case event, ok := <-m.watcher.Events:
			if !ok {
				return
			}
			log.Println("event:", event)
			// TODO: Handle file events - scan new/modified files
			if event.Op&fsnotify.Create == fsnotify.Create || event.Op&fsnotify.Write == fsnotify.Write {
				// Scan the file
				go m.handleFileEvent(event.Name)
			}
		case err, ok := <-m.watcher.Errors:
			if !ok {
				return
			}
			log.Println("error:", err)
		}
	}
}

func (m *Monitor) handleFileEvent(filePath string) {
	// TODO: Implement file scanning on events
	log.Printf("Handling file event for: %s", filePath)
}
