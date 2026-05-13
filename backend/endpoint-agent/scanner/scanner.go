package scanner

import (
	"crypto/md5"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"endpoint-agent/config"
	"endpoint-agent/transport"
	"fmt"
	"io"
	"math"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type Scanner struct {
	config    *config.Config
	transport *transport.Client
}

func NewScanner(cfg *config.Config) *Scanner {
	return &Scanner{
		config:    cfg,
		transport: transport.NewClient(cfg),
	}
}

func (s *Scanner) Start() {
	// Register agent first (skip if already registered)
	if s.transport.GetAgentID() == "" {
		if err := s.transport.Register(); err != nil {
			fmt.Printf("Failed to register agent: %v\n", err)
			return
		}
		fmt.Println("Agent registered successfully, starting scan loop...")
	} else {
		fmt.Println("Agent already registered, starting scan loop...")
	}

	// Start heartbeat goroutine
	go s.startHeartbeat()

	// Start scan request polling goroutine
	go s.pollForScanRequests()

	// Initial scan
	fmt.Println("Performing initial scan...")
	s.scanAllFiles()
	fmt.Println("Initial scan completed.")

	// For testing, just poll once and exit
	fmt.Println("Checking for pending scans...")
	scanID := s.checkForPendingScans()
	if scanID != "" {
		fmt.Println("Found pending scan, executing...")
		s.scanAllFiles()
		s.markScanCompleted(scanID)
		fmt.Println("Scan completed and marked.")
	} else {
		fmt.Println("No pending scans found.")
	}
}

func (s *Scanner) startHeartbeat() {
	ticker := time.NewTicker(60 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		if err := s.transport.SendHeartbeat(); err != nil {
			fmt.Printf("Failed to send heartbeat: %v\n", err)
		}
	}
}

func (s *Scanner) pollForScanRequests() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		scanID := s.checkForPendingScans()
		if scanID != "" {
			fmt.Println("Manual scan requested, executing immediate scan...")
			s.scanAllFiles()
			s.markScanCompleted(scanID)
		}
	}
}

func (s *Scanner) checkForPendingScans() string {
	if s.transport.GetAgentID() == "" {
		return ""
	}

	// Call the agent-service to check for pending scans
	resp, err := s.transport.GetAgentClient().R().
		SetAuthToken(s.transport.GetJWTToken()).
		Get(fmt.Sprintf("/api/v1/agents/%s/pending-scans", s.transport.GetAgentID()))

	if err != nil {
		fmt.Printf("Failed to check for pending scans: %v\n", err)
		return ""
	}

	if resp.StatusCode() != 200 {
		return ""
	}

	var result struct {
		PendingScans []struct {
			ID          string `json:"id"`
			AgentID     string `json:"agent_id"`
			RequestedAt string `json:"requested_at"`
			ScanType    string `json:"scan_type"`
		} `json:"pending_scans"`
	}

	if err := json.Unmarshal(resp.Body(), &result); err != nil {
		fmt.Printf("Failed to parse pending scans response: %v\n", err)
		return ""
	}

	if len(result.PendingScans) > 0 {
		// Return the first pending scan ID
		return result.PendingScans[0].ID
	}

	return ""
}

func (s *Scanner) markScanCompleted(scanID string) {
	_, err := s.transport.GetAgentClient().R().
		SetAuthToken(s.transport.GetJWTToken()).
		Patch(fmt.Sprintf("/api/v1/agents/scan/%s/complete", scanID))

	if err != nil {
		fmt.Printf("Failed to mark scan as completed: %v\n", err)
	}
}

func (s *Scanner) scanAllFiles() {
	fmt.Println("Starting file scan...")

	for _, path := range s.config.WatchPaths {
		fmt.Printf("Scanning path: %s\n", path)
		filepath.Walk(path, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				fmt.Printf("Error accessing %s: %v\n", path, err)
				return nil
			}

			if !info.IsDir() && s.isBinaryFile(path) {
				fmt.Printf("Found binary file: %s\n", path)
				s.scanFile(path)
			}

			return nil
		})
	}
	fmt.Println("File scan completed.")
}

func (s *Scanner) isBinaryFile(path string) bool {
	ext := strings.ToLower(filepath.Ext(path))
	binaryExts := []string{".exe", ".dll", ".so", ".dylib", ".bin", ".sys", ".mach-o"}

	for _, binaryExt := range binaryExts {
		if ext == binaryExt {
			return true
		}
	}

	return false
}

func (s *Scanner) scanFile(path string) {
	// Calculate hashes
	sha256, err := HashFileSHA256(path)
	if err != nil {
		fmt.Printf("Failed to hash file %s: %v\n", path, err)
		return
	}

	md5, err := HashFileMD5(path)
	if err != nil {
		fmt.Printf("Failed to hash file %s: %v\n", path, err)
		return
	}

	// Get file info
	info, err := os.Stat(path)
	if err != nil {
		fmt.Printf("Failed to get file info %s: %v\n", path, err)
		return
	}

	// Calculate entropy
	entropy, _ := GetFileEntropy(path)

	// Create scan result
	result := transport.BinaryScanResult{
		AgentID:   s.config.AgentID,
		FilePath:  path,
		FileName:  filepath.Base(path),
		SHA256:    sha256,
		MD5:       md5,
		FileSize:  info.Size(),
		Entropy:   entropy,
		FileType:  "binary",
		IsSigned:  false, // TODO: Implement signature checking
		ScannedAt: time.Now().Format(time.RFC3339),
	}

	// Send to binary-analysis-service
	if err := s.transport.SendScanResult(result); err != nil {
		fmt.Printf("Failed to send scan result for %s: %v\n", path, err)
	} else {
		fmt.Printf("Sent scan result for %s\n", path)
	}
}

func HashFileSHA256(path string) (string, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()

	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		return "", err
	}

	return hex.EncodeToString(hash.Sum(nil)), nil
}

func HashFileMD5(path string) (string, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()

	hash := md5.New()
	if _, err := io.Copy(hash, file); err != nil {
		return "", err
	}

	return hex.EncodeToString(hash.Sum(nil)), nil
}

func GetFileEntropy(path string) (float64, error) {
	file, err := os.Open(path)
	if err != nil {
		return 0.0, err
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		return 0.0, err
	}

	if len(data) == 0 {
		return 0.0, nil
	}

	// Count frequency of each byte
	freq := make(map[byte]int)
	for _, b := range data {
		freq[b]++
	}

	// Calculate entropy
	entropy := 0.0
	fileLen := float64(len(data))
	for _, count := range freq {
		p := float64(count) / fileLen
		if p > 0 {
			entropy -= p * math.Log2(p)
		}
	}

	return entropy, nil
}
