# Credential Verification API Testing Guide

## Overview

The verification system allows you to check if a wallet address has specific credentials. This guide shows how to test the functionality with the wallet address `0x670298e73c5E6735E1fdBeD858Be1d6A26db00b1` and `KYCAgeCrendential`.

## API Endpoints

### 1. Check Verification Service Status

```bash
curl -X GET "http://localhost:8001/v1/verification/status" \
  -H "Accept: application/json"
```

Expected Response:
```json
{
  "status": "healthy",
  "timestamp": 1705923637,
  "version": "1.0.0",
  "features": {
    "credential_ownership": true,
    "schema_verification": true,
    "type_verification": true,
    "zk_proof_verification": true,
    "batch_verification": true
  }
}
```

### 2. Verify Credentials by Type (KYCAgeCrendential)

```bash
curl -X GET "http://localhost:8001/v1/verification/wallet/0x670298e73c5E6735E1fdBeD858Be1d6A26db00b1/type?credential_type=KYCAgeCrendential" \
  -H "Accept: application/json"
```

Expected Response:
```json
{
  "wallet_address": "0x670298e73c5E6735E1fdBeD858Be1d6A26db00b1",
  "credential_type": "KYCAgeCrendential",
  "has_credentials": true,
  "credential_count": 1,
  "credentials": [
    {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld"
      ],
      "id": "https://issuer.example.com/credentials/3732",
      "type": ["VerifiableCredential", "KYCAgeCredential"],
      "issuer": "did:polygonid:polygon:mumbai:2qFroxB5kwgCKGNGqaMepd4SuKxWndkPVH9H6Cgquk",
      "issuanceDate": "2023-10-09T12:00:00Z",
      "expirationDate": "2024-10-09T12:00:00Z",
      "credentialSubject": {
        "id": "did:polygonid:polygon:mumbai:670298e73c5E6735E1fdBeD858Be1d6A26db00b1",
        "birthday": 19960424,
        "documentType": 2
      },
      "credentialStatus": {
        "id": "https://issuer.example.com/credentials/status/3732",
        "type": "Iden3ReverseSparseMerkleTreeProof",
        "revocationNonce": 1193394
      },
      "proof": {
        "type": "BJJSignature2021",
        "issuerData": {
          "id": "did:polygonid:polygon:mumbai:2qFroxB5kwgCKGNGqaMepd4SuKxWndkPVH9H6Cgquk",
          "state": {
            "claimsTreeRoot": "0x...",
            "value": "0x..."
          }
        },
        "signature": "0x..."
      }
    }
  ],
  "timestamp": 1705923637
}
```

### 3. Get All Wallet Credentials

```bash
curl -X GET "http://localhost:8001/v1/verification/wallet/0x670298e73c5E6735E1fdBeD858Be1d6A26db00b1/credentials" \
  -H "Accept: application/json"
```

Expected Response:
```json
{
  "wallet_address": "0x670298e73c5E6735E1fdBeD858Be1d6A26db00b1",
  "credential_count": 2,
  "credentials": [
    {
      "credential": {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        "id": "credential-1",
        "type": ["VerifiableCredential", "KYCAgeCredential"],
        "issuer": "did:polygonid:polygon:mumbai:issuer",
        "issuanceDate": "2023-10-09T12:00:00Z",
        "credentialSubject": {
          "id": "did:polygonid:polygon:mumbai:670298e73c5E6735E1fdBeD858Be1d6A26db00b1",
          "birthday": 19960424
        }
      },
      "is_revoked": false,
      "is_expired": false,
      "issuer_did": "did:polygonid:polygon:mumbai:issuer",
      "subject_did": "did:polygonid:polygon:mumbai:670298e73c5E6735E1fdBeD858Be1d6A26db00b1",
      "schema_url": "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld",
      "credential_type": "KYCAgeCrendential",
      "issuance_date": 1696852800,
      "expiration_date": 1728475200
    }
  ],
  "timestamp": 1705923637
}
```

### 4. Verify Specific Credential Ownership

```bash
curl -X GET "http://localhost:8001/v1/verification/wallet/0x670298e73c5E6735E1fdBeD858Be1d6A26db00b1/credential/f47ac10b-58cc-4372-a567-0e02b2c3d479" \
  -H "Accept: application/json"
```

Expected Response:
```json
{
  "wallet_address": "0x670298e73c5E6735E1fdBeD858Be1d6A26db00b1",
  "credential_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "is_owner": true,
  "credential": {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "id": "credential-1",
    "type": ["VerifiableCredential", "KYCAgeCredential"],
    "issuer": "did:polygonid:polygon:mumbai:issuer",
    "credentialSubject": {
      "id": "did:polygonid:polygon:mumbai:670298e73c5E6735E1fdBeD858Be1d6A26db00b1",
      "birthday": 19960424
    }
  },
  "verification_method": "direct_lookup",
  "timestamp": 1705923637,
  "metadata": {
    "credential_type": "KYCAgeCrendential",
    "issuer_did": "did:polygonid:polygon:mumbai:issuer",
    "issuance_date": "2023-10-09T12:00:00Z"
  }
}
```

### 5. Batch Verification

```bash
curl -X POST "http://localhost:8001/v1/verification/batch" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "verifications": [
      {
        "wallet_address": "0x670298e73c5E6735E1fdBeD858Be1d6A26db00b1",
        "credential_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
      },
      {
        "wallet_address": "0x670298e73c5E6735E1fdBeD858Be1d6A26db00b1",
        "credential_id": "a12ac10b-58cc-4372-a567-0e02b2c3d999"
      }
    ]
  }'
```

### 6. ZK Proof Verification

```bash
curl -X POST "http://localhost:8001/v1/verification/zk-proof" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "wallet_address": "0x670298e73c5E6735E1fdBeD858Be1d6A26db00b1",
    "proof": {
      "pi_a": ["0x...", "0x...", "1"],
      "pi_b": [["0x...", "0x..."], ["0x...", "0x..."], ["1", "0"]],
      "pi_c": ["0x...", "0x...", "1"]
    },
    "public_signals": ["123", "456", "789"],
    "circuit_id": "credentialAtomicQuerySigV2",
    "requirements": {
      "credential_type": "KYCAgeCrendential",
      "min_age": 18
    }
  }'
```

## Integration Steps

### 1. Add Verification Service to Main Application

Update your main application file (likely in `cmd/platform/main.go`):

```go
// Add verification service initialization
verificationService := services.NewVerificationService(
    claimsRepository,
    identityRepository,
    zkGenerator,
    schemaService,
)

// Add to server constructor
server := api.NewServer(
    cfg,
    identityService,
    accountService,
    connectionsService,
    claimsService,
    qrService,
    publisherGateway,
    packageManager,
    networkResolver,
    health,
    schemaService,
    linkService,
    displayMethodService,
    keyService,
    paymentService,
    discoveryService,
    verificationService, // Add this
)
```

### 2. Add Routes to Router

In your router setup, add the verification routes:

```go
// Add this to your router configuration
server.setupVerificationRoutes(router)
```

### 3. Testing with curl

Here's a simple test script to check if the wallet has the KYCAgeCrendential:

```bash
#!/bin/bash

WALLET_ADDRESS="0x670298e73c5E6735E1fdBeD858Be1d6A26db00b1"
CREDENTIAL_TYPE="KYCAgeCrendential"
BASE_URL="http://localhost:8001"

echo "Testing credential verification for wallet: $WALLET_ADDRESS"
echo "Credential type: $CREDENTIAL_TYPE"
echo

# Check service status
echo "1. Checking verification service status..."
curl -s -X GET "$BASE_URL/v1/verification/status" | jq .

echo
echo "2. Checking for KYCAgeCrendential..."
RESULT=$(curl -s -X GET "$BASE_URL/v1/verification/wallet/$WALLET_ADDRESS/type?credential_type=$CREDENTIAL_TYPE")
echo $RESULT | jq .

# Check if credentials were found
HAS_CREDENTIALS=$(echo $RESULT | jq -r '.has_credentials')
if [ "$HAS_CREDENTIALS" = "true" ]; then
    echo
    echo "✅ SUCCESS: Wallet $WALLET_ADDRESS has $CREDENTIAL_TYPE"
    CREDENTIAL_COUNT=$(echo $RESULT | jq -r '.credential_count')
    echo "   Found $CREDENTIAL_COUNT credential(s)"
else
    echo
    echo "❌ RESULT: Wallet $WALLET_ADDRESS does NOT have $CREDENTIAL_TYPE"
fi
```

## Expected Results

When you test with the wallet address `0x670298e73c5E6735E1fdBeD858Be1d6A26db00b1`:

1. **If the wallet HAS KYCAgeCrendential:**
   - `has_credentials`: true
   - `credential_count`: > 0
   - `credentials`: Array of credential objects

2. **If the wallet DOES NOT have KYCAgeCrendential:**
   - `has_credentials`: false
   - `credential_count`: 0
   - `credentials`: Empty array

## Error Cases

### Invalid Wallet Address
```bash
curl -X GET "http://localhost:8001/v1/verification/wallet/invalid-address/type?credential_type=KYCAgeCrendential"
```
Returns: `400 Bad Request` with error message about invalid wallet address format.

### Missing Credential Type
```bash
curl -X GET "http://localhost:8001/v1/verification/wallet/0x670298e73c5E6735E1fdBeD858Be1d6A26db00b1/type"
```
Returns: `400 Bad Request` with error message about missing credential_type parameter.

### Service Unavailable
If the verification service is not properly initialized, you'll get a `500 Internal Server Error`.

## Next Steps

1. **Build and run the application** with the verification service integrated
2. **Test the endpoints** using the curl commands above
3. **Integrate with your frontend** to provide UI for credential verification
4. **Add authentication** if needed for production use
5. **Monitor and log** verification requests for analytics
