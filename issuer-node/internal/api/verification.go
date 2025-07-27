package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/polygonid/sh-id-platform/internal/core/ports"
	"github.com/polygonid/sh-id-platform/internal/log"
)

// VerifyCredentialOwnership verifies if a wallet address owns a specific credential
func (s *Server) VerifyCredentialOwnership(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	
	walletAddress := chi.URLParam(r, "wallet_address")
	credentialIDStr := chi.URLParam(r, "credential_id")

	if walletAddress == "" {
		log.Warn(ctx, "empty wallet address")
		http.Error(w, "wallet address is required", http.StatusBadRequest)
		return
	}

	credentialID, err := uuid.Parse(credentialIDStr)
	if err != nil {
		log.Warn(ctx, "invalid credential ID", "credential_id", credentialIDStr, "err", err)
		http.Error(w, "invalid credential ID format", http.StatusBadRequest)
		return
	}

	result, err := s.verificationService.VerifyCredentialOwnership(ctx, walletAddress, credentialID)
	if err != nil {
		log.Error(ctx, "credential ownership verification failed", "err", err)
		http.Error(w, "verification failed", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

// VerifyCredentialsBySchema verifies if a wallet has credentials of a specific schema
func (s *Server) VerifyCredentialsBySchema(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	
	walletAddress := chi.URLParam(r, "wallet_address")
	schemaURL := r.URL.Query().Get("schema_url")

	if walletAddress == "" {
		log.Warn(ctx, "empty wallet address")
		http.Error(w, "wallet address is required", http.StatusBadRequest)
		return
	}

	if schemaURL == "" {
		log.Warn(ctx, "empty schema URL")
		http.Error(w, "schema_url parameter is required", http.StatusBadRequest)
		return
	}

	result, err := s.verificationService.VerifyCredentialsBySchema(ctx, walletAddress, schemaURL)
	if err != nil {
		log.Error(ctx, "schema credentials verification failed", "err", err)
		http.Error(w, "verification failed", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

// VerifyCredentialsByType verifies if a wallet has credentials of a specific type
func (s *Server) VerifyCredentialsByType(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	
	walletAddress := chi.URLParam(r, "wallet_address")
	credentialType := r.URL.Query().Get("credential_type")

	if walletAddress == "" {
		log.Warn(ctx, "empty wallet address")
		http.Error(w, "wallet address is required", http.StatusBadRequest)
		return
	}

	if credentialType == "" {
		log.Warn(ctx, "empty credential type")
		http.Error(w, "credential_type parameter is required", http.StatusBadRequest)
		return
	}

	result, err := s.verificationService.VerifyCredentialsByType(ctx, walletAddress, credentialType)
	if err != nil {
		log.Error(ctx, "type credentials verification failed", "err", err)
		http.Error(w, "verification failed", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

// VerifyZKProof verifies a zero-knowledge proof for credential ownership
func (s *Server) VerifyZKProof(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	
	var req ports.ZKProofVerificationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Warn(ctx, "invalid request body", "err", err)
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.WalletAddress == "" {
		log.Warn(ctx, "empty wallet address in ZK proof request")
		http.Error(w, "wallet address is required", http.StatusBadRequest)
		return
	}

	if req.CircuitID == "" {
		log.Warn(ctx, "empty circuit ID in ZK proof request")
		http.Error(w, "circuit ID is required", http.StatusBadRequest)
		return
	}

	if len(req.PublicSignals) == 0 {
		log.Warn(ctx, "empty public signals in ZK proof request")
		http.Error(w, "public signals are required", http.StatusBadRequest)
		return
	}

	result, err := s.verificationService.VerifyZKProof(ctx, &req)
	if err != nil {
		log.Error(ctx, "ZK proof verification failed", "err", err)
		http.Error(w, "verification failed", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

// GetWalletCredentials retrieves all credentials for a wallet address
func (s *Server) GetWalletCredentials(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	
	walletAddress := chi.URLParam(r, "wallet_address")

	if walletAddress == "" {
		log.Warn(ctx, "empty wallet address")
		http.Error(w, "wallet address is required", http.StatusBadRequest)
		return
	}

	result, err := s.verificationService.GetWalletCredentials(ctx, walletAddress)
	if err != nil {
		log.Error(ctx, "failed to get wallet credentials", "err", err)
		http.Error(w, "failed to retrieve credentials", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

// BatchVerifyCredentials verifies multiple credentials for multiple wallets
func (s *Server) BatchVerifyCredentials(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	type BatchVerificationRequest struct {
		Verifications []struct {
			WalletAddress  string    `json:"wallet_address"`
			CredentialID   uuid.UUID `json:"credential_id"`
		} `json:"verifications"`
	}

	type BatchVerificationResponse struct {
		Results []ports.CredentialOwnershipResult `json:"results"`
		Summary struct {
			Total     int `json:"total"`
			Verified  int `json:"verified"`
			Failed    int `json:"failed"`
		} `json:"summary"`
	}

	var req BatchVerificationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Warn(ctx, "invalid request body", "err", err)
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if len(req.Verifications) == 0 {
		log.Warn(ctx, "empty verifications array")
		http.Error(w, "verifications array cannot be empty", http.StatusBadRequest)
		return
	}

	if len(req.Verifications) > 100 {
		log.Warn(ctx, "too many verifications requested", "count", len(req.Verifications))
		http.Error(w, "maximum 100 verifications per batch", http.StatusBadRequest)
		return
	}

	response := BatchVerificationResponse{
		Results: make([]ports.CredentialOwnershipResult, 0, len(req.Verifications)),
	}

	for _, verification := range req.Verifications {
		result, err := s.verificationService.VerifyCredentialOwnership(
			ctx, 
			verification.WalletAddress, 
			verification.CredentialID,
		)
		
		if err != nil {
			log.Warn(ctx, "individual verification failed", 
				"wallet", verification.WalletAddress,
				"credential_id", verification.CredentialID,
				"err", err)
			
			// Create error result
			result = &ports.CredentialOwnershipResult{
				WalletAddress:      verification.WalletAddress,
				CredentialID:       verification.CredentialID.String(),
				IsOwner:            false,
				VerificationMethod: "batch_verification",
				Timestamp:          time.Now().Unix(),
				Metadata: map[string]interface{}{
					"error": err.Error(),
				},
			}
			response.Summary.Failed++
		} else if result.IsOwner {
			response.Summary.Verified++
		}

		response.Results = append(response.Results, *result)
	}

	response.Summary.Total = len(req.Verifications)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// GetVerificationStatus provides a health check for the verification service
func (s *Server) GetVerificationStatus(w http.ResponseWriter, r *http.Request) {
	
	type VerificationStatusResponse struct {
		Status    string `json:"status"`
		Timestamp int64  `json:"timestamp"`
		Version   string `json:"version"`
		Features  struct {
			CredentialOwnership bool `json:"credential_ownership"`
			SchemaVerification  bool `json:"schema_verification"`
			TypeVerification    bool `json:"type_verification"`
			ZKProofVerification bool `json:"zk_proof_verification"`
			BatchVerification   bool `json:"batch_verification"`
		} `json:"features"`
	}

	response := VerificationStatusResponse{
		Status:    "healthy",
		Timestamp: time.Now().Unix(),
		Version:   "1.0.0",
	}

	response.Features.CredentialOwnership = true
	response.Features.SchemaVerification = true
	response.Features.TypeVerification = true
	response.Features.ZKProofVerification = true
	response.Features.BatchVerification = true

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// setupVerificationRoutes adds verification routes to the router
func (s *Server) setupVerificationRoutes(r chi.Router) {
	r.Route("/v1/verification", func(r chi.Router) {
		// Verification status
		r.Get("/status", s.GetVerificationStatus)
		
		// Individual wallet credential verification
		r.Get("/wallet/{wallet_address}/credential/{credential_id}", s.VerifyCredentialOwnership)
		r.Get("/wallet/{wallet_address}/schema", s.VerifyCredentialsBySchema)
		r.Get("/wallet/{wallet_address}/type", s.VerifyCredentialsByType)
		r.Get("/wallet/{wallet_address}/credentials", s.GetWalletCredentials)
		
		// ZK proof verification
		r.Post("/zk-proof", s.VerifyZKProof)
		
		// Batch verification
		r.Post("/batch", s.BatchVerifyCredentials)
	})
}
