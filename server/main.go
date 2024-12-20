package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

type Snippet struct {
	Name      string    `json:"name"`
	Code      string    `json:"code"`
	Timestamp time.Time `json:"timestamp"`
}

var (
	mu       sync.Mutex
	snippets = make(map[string]Snippet)
)

// Expiration time (default 10 seconds)
var expirationDuration time.Duration = 10 * time.Second

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	(*w).Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func handleOptions(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	w.WriteHeader(http.StatusOK)
}

func submitSnippet(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	mu.Lock()
	defer mu.Unlock()

	// Check if there is an active snippet and if it's expired
	if len(snippets) > 0 {
		activeSnippet := snippets["active"]
		if time.Since(activeSnippet.Timestamp) < expirationDuration {
			http.Error(w, "Submission disabled: snippet active", http.StatusForbidden)
			return
		}
		// If the snippet is expired, remove it
		delete(snippets, "active")
	}

	var s Snippet
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if len(s.Code) > 500 {
		http.Error(w, "Code too long", http.StatusBadRequest)
		return
	}

	// Set timestamp when snippet is submitted
	s.Timestamp = time.Now()

	// You can change the expiration time based on the request
	expiration := r.URL.Query().Get("expiration")
	if expiration != "" {
		// Convert expiration parameter into time.Duration
		expTime, err := time.ParseDuration(expiration)
		if err != nil {
			http.Error(w, fmt.Sprintf("Invalid expiration time: %v", err), http.StatusBadRequest)
			return
		}
		expirationDuration = expTime
	}

	snippets["active"] = s
	w.WriteHeader(http.StatusCreated)
}

func getSnippet(w http.ResponseWriter, r *http.Request) {
	enableCors(&w)
	if r.Method == http.MethodOptions {
		handleOptions(w, r)
		return
	}

	mu.Lock()
	defer mu.Unlock()

	if snippet, exists := snippets["active"]; exists {
		// Calculate remaining time
		remainingTime := expirationDuration - time.Since(snippet.Timestamp)
		if remainingTime < 0 {
			remainingTime = 0
		}

		// Add duration field to the snippet
		snippetDuration := struct {
			Snippet
			Duration int64 `json:"duration"`
		}{
			Snippet:  snippet,
			Duration: int64(remainingTime.Seconds()),
		}

		// Return the snippet with the duration
		json.NewEncoder(w).Encode(snippetDuration)
		return
	}

	http.Error(w, "No snippet available", http.StatusNotFound)
}

// Cleanup function to remove expired snippets
func cleanup() {
	for {
		time.Sleep(1 * time.Second) // Check every second to ensure prompt cleanup
		mu.Lock()
		if snippet, exists := snippets["active"]; exists {
			// If the snippet has expired, delete it
			if time.Since(snippet.Timestamp) > expirationDuration {
				delete(snippets, "active")
			}
		}
		mu.Unlock()
	}
}

func main() {
	// Start cleanup goroutine
	go cleanup()

	// routes
	http.HandleFunc("/submit", submitSnippet)
	http.HandleFunc("/snippet", getSnippet)
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			handleOptions(w, r)
		}
	})

	http.ListenAndServe(":8080", nil)
}
