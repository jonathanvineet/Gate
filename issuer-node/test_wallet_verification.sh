#!/bin/bash

# Test script for wallet credential verification
# Usage: ./test_wallet_verification.sh [wallet_address] [credential_type] [base_url]

WALLET_ADDRESS="${1:-0x670298e73c5E6735E1fdBeD858Be1d6A26db00b1}"
CREDENTIAL_TYPE="${2:-KYCAgeCrendential}"
BASE_URL="${3:-http://localhost:8001}"

echo "==========================================="
echo "Wallet Credential Verification Test"
echo "==========================================="
echo "Wallet: $WALLET_ADDRESS"
echo "Credential Type: $CREDENTIAL_TYPE"
echo "Base URL: $BASE_URL"
echo "==========================================="
echo

# Function to make HTTP requests and handle errors
make_request() {
    local url="$1"
    local method="${2:-GET}"
    local data="$3"
    local description="$4"
    
    echo "🔍 $description"
    echo "URL: $url"
    echo
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X GET "$url" -H "Accept: application/json")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$url" \
            -H "Content-Type: application/json" \
            -H "Accept: application/json" \
            -d "$data")
    fi
    
    # Extract HTTP status and response body
    http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo "$response" | sed -e 's/HTTPSTATUS\:.*//g')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo "✅ SUCCESS (HTTP $http_code)"
        if command -v jq >/dev/null 2>&1; then
            echo "$body" | jq .
        else
            echo "$body"
        fi
    else
        echo "❌ ERROR (HTTP $http_code)"
        echo "Response: $body"
    fi
    echo
    echo "---"
    echo
    
    return $http_code
}

# Test 1: Check service status
make_request "$BASE_URL/v1/verification/status" "GET" "" "Checking verification service status"

# Test 2: Check for specific credential type
make_request "$BASE_URL/v1/verification/wallet/$WALLET_ADDRESS/type?credential_type=$CREDENTIAL_TYPE" "GET" "" "Checking for $CREDENTIAL_TYPE credentials"

# Test 3: Get all wallet credentials
make_request "$BASE_URL/v1/verification/wallet/$WALLET_ADDRESS/credentials" "GET" "" "Getting all credentials for wallet"

# Test 4: Test with a sample credential ID (this will likely fail but shows the format)
SAMPLE_CREDENTIAL_ID="f47ac10b-58cc-4372-a567-0e02b2c3d479"
make_request "$BASE_URL/v1/verification/wallet/$WALLET_ADDRESS/credential/$SAMPLE_CREDENTIAL_ID" "GET" "" "Testing specific credential ownership"

# Test 5: Test batch verification
batch_data='{
  "verifications": [
    {
      "wallet_address": "'$WALLET_ADDRESS'",
      "credential_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
    }
  ]
}'
make_request "$BASE_URL/v1/verification/batch" "POST" "$batch_data" "Testing batch verification"

# Summary function to check if wallet has the specific credential
check_credential_summary() {
    echo "=========================================="
    echo "FINAL SUMMARY"
    echo "=========================================="
    
    # Quick check for credential type
    result=$(curl -s "$BASE_URL/v1/verification/wallet/$WALLET_ADDRESS/type?credential_type=$CREDENTIAL_TYPE" 2>/dev/null)
    
    if echo "$result" | grep -q '"has_credentials".*true'; then
        credential_count=$(echo "$result" | grep -o '"credential_count":[0-9]*' | cut -d: -f2)
        echo "✅ RESULT: Wallet $WALLET_ADDRESS HAS $CREDENTIAL_TYPE"
        echo "   Credential count: $credential_count"
        
        # Extract additional info if jq is available
        if command -v jq >/dev/null 2>&1; then
            echo "   Timestamp: $(echo "$result" | jq -r '.timestamp // "N/A"')"
        fi
    elif echo "$result" | grep -q '"has_credentials".*false'; then
        echo "❌ RESULT: Wallet $WALLET_ADDRESS does NOT have $CREDENTIAL_TYPE"
    else
        echo "⚠️  WARNING: Could not determine credential status"
        echo "   This might be due to:"
        echo "   - Service not running on $BASE_URL"
        echo "   - Network connectivity issues"
        echo "   - Invalid wallet address format"
        echo "   - Service configuration issues"
        echo
        echo "   Raw response: $result"
    fi
    
    echo "=========================================="
}

# Check the final result
check_credential_summary

echo
echo "Test completed. If the service is not running, start it with:"
echo "  cd /path/to/issuer-node && go run cmd/platform/main.go"
echo
echo "For more information, see: verification_test_examples.md"
