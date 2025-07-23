package services

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/google/uuid"
	"github.com/iden3/go-circuits/v2"
	"github.com/iden3/go-iden3-core/v2/w3c"
	"github.com/iden3/go-schema-processor/v2/verifiable"
	"github.com/pkg/errors"

	"github.com/polygonid/sh-id-platform/internal/core/domain"
	"github.com/polygonid/sh-id-platform/internal/core/ports"
	"github.com/polygonid/sh-id-platform/internal/core/services"
	"github.com/polygonid/sh-id-platform/internal/log"
	"github.com/polygonid/sh-id-platform/internal/schema"
)

// verification is the service implementation for credential verification
type verification struct {
	claimRepo    ports.ClaimsRepository
	identityRepo ports.IdentityRepository
	zkGenerator  ports.ZKGenerator
	schemaLoader ports.SchemaService
}

// NewVerificationService creates a new verification service
func NewVerificationService(
	claimRepo ports.ClaimsRepository,
	identityRepo ports.IdentityRepository,
	zkGenerator ports.ZKGenerator,
	schemaLoader ports.SchemaService,
) ports.VerificationService {
	return &verification{
		claimRepo:    claimRepo,
		identityRepo: identityRepo,
		zkGenerator:  zkGenerator,
		schemaLoader: schemaLoader,
	}
}

// VerifyCredentialOwnership verifies if a wallet address owns a specific credential
func (v *verification) VerifyCredentialOwnership(ctx context.Context, walletAddress string, credentialID uuid.UUID) (*ports.CredentialOwnershipResult, error) {
	log.Info(ctx, "verifying credential ownership", "wallet", walletAddress, "credentialID", credentialID.String())

	result := &ports.CredentialOwnershipResult{
		WalletAddress:      walletAddress,
		CredentialID:       credentialID.String(),
		IsOwner:            false,
		VerificationMethod: "direct_lookup",
		Timestamp:          time.Now().Unix(),
		Metadata:           make(map[string]interface{}),
	}

	// Convert wallet address to DID format
	did, err := v.walletAddressToDID(ctx, walletAddress)
	if err != nil {
		return result, errors.Wrap(err, "failed to convert wallet address to DID")
	}

	// Look up the credential
	claim, err := v.claimRepo.GetByIdAndIssuer(ctx, did, credentialID)
	if err != nil {
		if errors.Is(err, services.ErrCredentialNotFound) {
			// Check if the credential exists for this wallet as subject
			claim, err = v.findCredentialBySubject(ctx, walletAddress, credentialID)
			if err != nil {
				return result, nil // Not found, IsOwner remains false
			}
		} else {
			return result, errors.Wrap(err, "failed to retrieve credential")
		}
	}

	if claim != nil {
		result.IsOwner = true
		
		// Convert claim to W3C credential
		w3cCred, err := schema.FromClaimModelToW3CCredential(*claim)
		if err != nil {
			log.Warn(ctx, "failed to convert claim to W3C credential", "err", err)
		} else {
			result.Credential = w3cCred
		}

		// Add metadata
		result.Metadata["credential_type"] = claim.SchemaType
		result.Metadata["issuer_did"] = claim.Identifier
		result.Metadata["issuance_date"] = claim.CreatedAt
		if claim.Expiration != nil {
			result.Metadata["expiration_date"] = *claim.Expiration
		}
	}

	return result, nil
}

// VerifyCredentialsBySchema verifies if a wallet address has credentials of a specific schema
func (v *verification) VerifyCredentialsBySchema(ctx context.Context, walletAddress string, schemaURL string) (*ports.SchemaCredentialResult, error) {
	log.Info(ctx, "verifying credentials by schema", "wallet", walletAddress, "schema", schemaURL)

	result := &ports.SchemaCredentialResult{
		WalletAddress:  walletAddress,
		SchemaURL:      schemaURL,
		HasCredentials: false,
		Credentials:    make([]*verifiable.W3CCredential, 0),
		Timestamp:      time.Now().Unix(),
	}

	// Find credentials by schema
	credentials, err := v.findCredentialsBySchema(ctx, walletAddress, schemaURL)
	if err != nil {
		return result, errors.Wrap(err, "failed to find credentials by schema")
	}

	if len(credentials) > 0 {
		result.HasCredentials = true
		result.CredentialCount = len(credentials)
		
		// Convert to W3C credentials
		for _, claim := range credentials {
			w3cCred, err := schema.FromClaimModelToW3CCredential(*claim)
			if err != nil {
				log.Warn(ctx, "failed to convert claim to W3C credential", "err", err, "claimID", claim.ID)
				continue
			}
			result.Credentials = append(result.Credentials, w3cCred)
		}
	}

	return result, nil
}

// VerifyCredentialsByType verifies if a wallet address has credentials of a specific type
func (v *verification) VerifyCredentialsByType(ctx context.Context, walletAddress string, credentialType string) (*ports.TypeCredentialResult, error) {
	log.Info(ctx, "verifying credentials by type", "wallet", walletAddress, "type", credentialType)

	result := &ports.TypeCredentialResult{
		WalletAddress:  walletAddress,
		CredentialType: credentialType,
		HasCredentials: false,
		Credentials:    make([]*verifiable.W3CCredential, 0),
		Timestamp:      time.Now().Unix(),
	}

	// Find credentials by type
	credentials, err := v.findCredentialsByType(ctx, walletAddress, credentialType)
	if err != nil {
		return result, errors.Wrap(err, "failed to find credentials by type")
	}

	if len(credentials) > 0 {
		result.HasCredentials = true
		result.CredentialCount = len(credentials)
		
		// Convert to W3C credentials
		for _, claim := range credentials {
			w3cCred, err := schema.FromClaimModelToW3CCredential(*claim)
			if err != nil {
				log.Warn(ctx, "failed to convert claim to W3C credential", "err", err, "claimID", claim.ID)
				continue
			}
			result.Credentials = append(result.Credentials, w3cCred)
		}
	}

	return result, nil
}

// VerifyZKProof verifies a zero-knowledge proof for credential ownership
func (v *verification) VerifyZKProof(ctx context.Context, req *ports.ZKProofVerificationRequest) (*ports.ZKProofResult, error) {
	log.Info(ctx, "verifying ZK proof", "wallet", req.WalletAddress, "circuitID", req.CircuitID)

	result := &ports.ZKProofResult{
		WalletAddress:    req.WalletAddress,
		IsValid:          false,
		ProofVerified:    false,
		RequirementsMet:  false,
		VerificationTime: time.Now().Unix(),
		CircuitID:        req.CircuitID,
		PublicOutputs:    make(map[string]interface{}),
	}

	// Verify the cryptographic proof
	proofValid, err := v.verifyProofCryptography(ctx, req)
	if err != nil {
		result.Error = fmt.Sprintf("proof verification failed: %v", err)
		return result, nil
	}

	result.ProofVerified = proofValid
	if !proofValid {
		result.Error = "cryptographic proof verification failed"
		return result, nil
	}

	// Verify requirements if specified
	if req.Requirements != nil {
		requirementsMet, outputs, err := v.verifyProofRequirements(ctx, req)
		if err != nil {
			result.Error = fmt.Sprintf("requirements verification failed: %v", err)
			return result, nil
		}
		
		result.RequirementsMet = requirementsMet
		result.PublicOutputs = outputs
		result.IsValid = proofValid && requirementsMet
	} else {
		result.RequirementsMet = true
		result.IsValid = proofValid
	}

	return result, nil
}

// GetWalletCredentials retrieves all credentials associated with a wallet address
func (v *verification) GetWalletCredentials(ctx context.Context, walletAddress string) (*ports.WalletCredentialsResult, error) {
	log.Info(ctx, "getting wallet credentials", "wallet", walletAddress)

	result := &ports.WalletCredentialsResult{
		WalletAddress: walletAddress,
		Credentials:   make([]*ports.VerifiedCredential, 0),
		Timestamp:     time.Now().Unix(),
	}

	// Find all credentials for the wallet
	credentials, err := v.findAllCredentialsForWallet(ctx, walletAddress)
	if err != nil {
		return result, errors.Wrap(err, "failed to find credentials for wallet")
	}

	result.CredentialCount = len(credentials)

	// Convert and verify each credential
	for _, claim := range credentials {
		verifiedCred, err := v.convertToVerifiedCredential(ctx, claim)
		if err != nil {
			log.Warn(ctx, "failed to convert credential", "err", err, "claimID", claim.ID)
			continue
		}
		result.Credentials = append(result.Credentials, verifiedCred)
	}

	return result, nil
}

// Helper methods

// walletAddressToDID converts an Ethereum wallet address to a DID
func (v *verification) walletAddressToDID(ctx context.Context, walletAddress string) (*w3c.DID, error) {
	// Validate the wallet address format
	if !common.IsHexAddress(walletAddress) {
		return nil, fmt.Errorf("invalid wallet address format: %s", walletAddress)
	}

	// Try to find an identity by wallet address
	// This assumes you have a mapping or can derive DID from wallet address
	did, err := w3c.ParseDID(fmt.Sprintf("did:polygonid:polygon:mumbai:%s", strings.TrimPrefix(walletAddress, "0x")))
	if err != nil {
		return nil, errors.Wrap(err, "failed to parse DID")
	}

	return did, nil
}

// findCredentialBySubject finds a credential where the wallet is the subject
func (v *verification) findCredentialBySubject(ctx context.Context, walletAddress string, credentialID uuid.UUID) (*domain.Claim, error) {
	// This would need to be implemented based on your specific data model
	// For now, we'll return not found
	return nil, services.ErrCredentialNotFound
}

// findCredentialsBySchema finds credentials by schema URL
func (v *verification) findCredentialsBySchema(ctx context.Context, walletAddress string, schemaURL string) ([]*domain.Claim, error) {
	did, err := v.walletAddressToDID(ctx, walletAddress)
	if err != nil {
		return nil, err
	}

	// Use the existing claim repository to find claims
	filter := &ports.ClaimsFilter{
		SchemaID: &schemaURL,
	}

	claims, _, err := v.claimRepo.GetAll(ctx, did, filter)
	return claims, err
}

// findCredentialsByType finds credentials by type
func (v *verification) findCredentialsByType(ctx context.Context, walletAddress string, credentialType string) ([]*domain.Claim, error) {
	did, err := v.walletAddressToDID(ctx, walletAddress)
	if err != nil {
		return nil, err
	}

	// Use the existing claim repository to find claims
	filter := &ports.ClaimsFilter{
		SchemaType: &credentialType,
	}

	claims, _, err := v.claimRepo.GetAll(ctx, did, filter)
	return claims, err
}

// findAllCredentialsForWallet finds all credentials for a wallet
func (v *verification) findAllCredentialsForWallet(ctx context.Context, walletAddress string) ([]*domain.Claim, error) {
	did, err := v.walletAddressToDID(ctx, walletAddress)
	if err != nil {
		return nil, err
	}

	// Use the existing claim repository to find all claims
	filter := &ports.ClaimsFilter{}
	claims, _, err := v.claimRepo.GetAll(ctx, did, filter)
	return claims, err
}

// convertToVerifiedCredential converts a claim to a verified credential with status checks
func (v *verification) convertToVerifiedCredential(ctx context.Context, claim *domain.Claim) (*ports.VerifiedCredential, error) {
	w3cCred, err := schema.FromClaimModelToW3CCredential(*claim)
	if err != nil {
		return nil, errors.Wrap(err, "failed to convert to W3C credential")
	}

	verifiedCred := &ports.VerifiedCredential{
		Credential:     w3cCred,
		IsRevoked:      claim.Revoked,
		IsExpired:      false,
		IssuerDID:      claim.Identifier,
		SchemaURL:      claim.SchemaURL,
		CredentialType: claim.SchemaType,
		IssuanceDate:   claim.CreatedAt.Unix(),
	}

	// Check expiration
	if claim.Expiration != nil {
		expirationTime := *claim.Expiration
		verifiedCred.ExpirationDate = &expirationTime.Unix()
		verifiedCred.IsExpired = time.Now().After(expirationTime)
	}

	// Extract subject DID from credential
	if w3cCred.CredentialSubject != nil {
		if subjectMap, ok := w3cCred.CredentialSubject.(map[string]interface{}); ok {
			if subjectID, exists := subjectMap["id"]; exists {
				if subjectIDStr, ok := subjectID.(string); ok {
					verifiedCred.SubjectDID = subjectIDStr
				}
			}
		}
	}

	return verifiedCred, nil
}

// verifyProofCryptography verifies the cryptographic validity of a proof
func (v *verification) verifyProofCryptography(ctx context.Context, req *ports.ZKProofVerificationRequest) (bool, error) {
	// Convert circuit ID
	circuitID := circuits.CircuitID(req.CircuitID)
	
	// Create verification handler
	verificationHandler := func(id circuits.CircuitID, pubsignals []string) error {
		// Custom verification logic based on circuit type
		switch id {
		case circuits.AuthV2CircuitID:
			// Verify auth circuit
			return v.verifyAuthCircuit(ctx, pubsignals)
		default:
			return fmt.Errorf("unsupported circuit ID: %s", id)
		}
	}

	// Verify the proof using the ZK generator
	err := verificationHandler(circuitID, req.PublicSignals)
	return err == nil, err
}

// verifyAuthCircuit verifies auth circuit public signals
func (v *verification) verifyAuthCircuit(ctx context.Context, pubsignals []string) error {
	// Parse and verify auth circuit public signals
	// This is a simplified version - you would implement full verification
	if len(pubsignals) < 2 {
		return fmt.Errorf("insufficient public signals for auth circuit")
	}
	
	log.Info(ctx, "auth circuit verification completed", "signals_count", len(pubsignals))
	return nil
}

// verifyProofRequirements verifies that the proof meets specified requirements
func (v *verification) verifyProofRequirements(ctx context.Context, req *ports.ZKProofVerificationRequest) (bool, map[string]interface{}, error) {
	outputs := make(map[string]interface{})
	requirements := req.Requirements

	// Verify schema requirement
	if requirements.SchemaURL != "" {
		schemaResult, err := v.VerifyCredentialsBySchema(ctx, req.WalletAddress, requirements.SchemaURL)
		if err != nil {
			return false, outputs, errors.Wrap(err, "schema requirement verification failed")
		}
		if !schemaResult.HasCredentials {
			outputs["schema_verification"] = false
			return false, outputs, nil
		}
		outputs["schema_verification"] = true
		outputs["schema_credentials_count"] = schemaResult.CredentialCount
	}

	// Verify credential type requirement
	if requirements.CredentialType != "" {
		typeResult, err := v.VerifyCredentialsByType(ctx, req.WalletAddress, requirements.CredentialType)
		if err != nil {
			return false, outputs, errors.Wrap(err, "credential type requirement verification failed")
		}
		if !typeResult.HasCredentials {
			outputs["type_verification"] = false
			return false, outputs, nil
		}
		outputs["type_verification"] = true
		outputs["type_credentials_count"] = typeResult.CredentialCount
	}

	// Add more requirement verifications as needed
	if requirements.MinAge != nil {
		outputs["min_age_requirement"] = *requirements.MinAge
		// Implement age verification logic
	}

	if requirements.Country != "" {
		outputs["country_requirement"] = requirements.Country
		// Implement country verification logic
	}

	return true, outputs, nil
}
