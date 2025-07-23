package ports

import (
	"context"

	"github.com/google/uuid"
	"github.com/iden3/go-iden3-core/v2/w3c"
	"github.com/iden3/go-schema-processor/v2/verifiable"

	"github.com/polygonid/sh-id-platform/internal/core/domain"
)

// VerificationService defines the interface for credential verification
type VerificationService interface {
	// VerifyCredentialOwnership verifies if a wallet address owns a specific credential
	VerifyCredentialOwnership(ctx context.Context, walletAddress string, credentialID uuid.UUID) (*CredentialOwnershipResult, error)
	
	// VerifyCredentialsBySchema verifies if a wallet address has credentials of a specific schema
	VerifyCredentialsBySchema(ctx context.Context, walletAddress string, schemaURL string) (*SchemaCredentialResult, error)
	
	// VerifyCredentialsByType verifies if a wallet address has credentials of a specific type
	VerifyCredentialsByType(ctx context.Context, walletAddress string, credentialType string) (*TypeCredentialResult, error)
	
	// VerifyZKProof verifies a zero-knowledge proof for credential ownership
	VerifyZKProof(ctx context.Context, req *ZKProofVerificationRequest) (*ZKProofResult, error)
	
	// GetWalletCredentials retrieves all credentials associated with a wallet address
	GetWalletCredentials(ctx context.Context, walletAddress string) (*WalletCredentialsResult, error)
}

// CredentialOwnershipResult represents the result of credential ownership verification
type CredentialOwnershipResult struct {
	WalletAddress   string               `json:"wallet_address"`
	CredentialID    string               `json:"credential_id"`
	IsOwner         bool                 `json:"is_owner"`
	Credential      *verifiable.W3CCredential `json:"credential,omitempty"`
	VerificationMethod string           `json:"verification_method"`
	Timestamp       int64                `json:"timestamp"`
	Metadata        map[string]interface{} `json:"metadata,omitempty"`
}

// SchemaCredentialResult represents credentials found for a specific schema
type SchemaCredentialResult struct {
	WalletAddress   string                    `json:"wallet_address"`
	SchemaURL       string                    `json:"schema_url"`
	HasCredentials  bool                      `json:"has_credentials"`
	CredentialCount int                       `json:"credential_count"`
	Credentials     []*verifiable.W3CCredential `json:"credentials"`
	Timestamp       int64                     `json:"timestamp"`
}

// TypeCredentialResult represents credentials found for a specific type
type TypeCredentialResult struct {
	WalletAddress   string                    `json:"wallet_address"`
	CredentialType  string                    `json:"credential_type"`
	HasCredentials  bool                      `json:"has_credentials"`
	CredentialCount int                       `json:"credential_count"`
	Credentials     []*verifiable.W3CCredential `json:"credentials"`
	Timestamp       int64                     `json:"timestamp"`
}

// ZKProofVerificationRequest represents a request to verify a zero-knowledge proof
type ZKProofVerificationRequest struct {
	WalletAddress  string                 `json:"wallet_address"`
	Proof          map[string]interface{} `json:"proof"`
	PublicSignals  []string               `json:"public_signals"`
	CircuitID      string                 `json:"circuit_id"`
	Challenge      string                 `json:"challenge,omitempty"`
	Requirements   *ProofRequirements     `json:"requirements,omitempty"`
}

// ProofRequirements defines what needs to be proven
type ProofRequirements struct {
	SchemaURL       string                 `json:"schema_url,omitempty"`
	CredentialType  string                 `json:"credential_type,omitempty"`
	MinAge          *int                   `json:"min_age,omitempty"`
	Country         string                 `json:"country,omitempty"`
	CustomClaims    map[string]interface{} `json:"custom_claims,omitempty"`
}

// ZKProofResult represents the result of zero-knowledge proof verification
type ZKProofResult struct {
	WalletAddress     string                 `json:"wallet_address"`
	IsValid           bool                   `json:"is_valid"`
	ProofVerified     bool                   `json:"proof_verified"`
	RequirementsMet   bool                   `json:"requirements_met"`
	VerificationTime  int64                  `json:"verification_time"`
	CircuitID         string                 `json:"circuit_id"`
	PublicOutputs     map[string]interface{} `json:"public_outputs,omitempty"`
	Error             string                 `json:"error,omitempty"`
}

// WalletCredentialsResult represents all credentials for a wallet
type WalletCredentialsResult struct {
	WalletAddress   string                    `json:"wallet_address"`
	CredentialCount int                       `json:"credential_count"`
	Credentials     []*VerifiedCredential     `json:"credentials"`
	Timestamp       int64                     `json:"timestamp"`
}

// VerifiedCredential represents a credential with verification status
type VerifiedCredential struct {
	Credential      *verifiable.W3CCredential `json:"credential"`
	IsRevoked       bool                      `json:"is_revoked"`
	IsExpired       bool                      `json:"is_expired"`
	IssuerDID       string                    `json:"issuer_did"`
	SubjectDID      string                    `json:"subject_did"`
	SchemaURL       string                    `json:"schema_url"`
	CredentialType  string                    `json:"credential_type"`
	IssuanceDate    int64                     `json:"issuance_date"`
	ExpirationDate  *int64                    `json:"expiration_date,omitempty"`
}
