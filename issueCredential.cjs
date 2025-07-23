const qrcode = require('qrcode');

// issueCredential.js

// --- Configuration ---
// Replace with your actual API base URL, username, and password
const API_BASE_URL = 'http://localhost:3001';
const USERNAME = 'user-issuer';
const PASSWORD = 'password-issuer';


// Replace with your issuer identity details (if you need to create one)
// If you already have an identity, you can use its identifier directly.


// Replace with your credential details
const CREDENTIAL_SCHEMA = 'https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json/KYCAgeCredential.json';
const CREDENTIAL_TYPE = 'KYCAgeCredential';

const CREDENTIAL_SUBJECT_DATA = {
  birthday: 20000101, // Example: YYYYMMDD format for a birthday (e.g., Jan 1, 2000)
  documentType: 1, // Example: An integer representing a document type
  // Add other claims as per your schema
};


// --- Helper Function for API Calls ---
async function callApi(method, path, body = null) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + btoa(`${USERNAME}:${PASSWORD}`)
  };

  const config = {
    method: method,
    headers: headers,
    body: body ? JSON.stringify(body) : null
  };

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, config);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error during API call:', error);
    throw error;
  }
}

// --- Main Logic ---
async function issueCredentialAndGenerateQr() {
  let issuerIdentifier;

  // 1. Get the existing Identity named "vj"
  console.log('Fetching identities to find "vj"...');
  try {
    const identitiesResponse = await callApi('GET', '/v2/identities');
    const vjIdentity = identitiesResponse.find(identity => identity.displayName === 'vj');

    if (!vjIdentity) {
      console.error('Error: Identity "vj" not found. Please ensure an identity with this display name exists.');
      return;
    }
    issuerIdentifier = vjIdentity.identifier;
    console.log('Found Identity "vj" with identifier:', issuerIdentifier);
  } catch (error) {
    console.error('Failed to fetch identities:', error);
    return;
  }


  // 2. Create a Credential Link
  console.log('Creating credential link...');
  const createLinkRequestBody = {
    credentialSchema: CREDENTIAL_SCHEMA,
    credentialType: CREDENTIAL_TYPE,
    credentialSubject: {
      ...CREDENTIAL_SUBJECT_DATA
    },
    // You can add other link-specific properties here if needed, e.g., expiration
      proofTypes: ['BJJSignatureProof'], // Changed to proofTypes array
  };

  let linkId;
  try {
    const createLinkResponse = await callApi('POST', `/v2/identities/${issuerIdentifier}/credentials/links`, createLinkRequestBody);
    linkId = createLinkResponse.id;
    console.log('Credential Link created with ID:', linkId);
  } catch (error) {
    console.error('Failed to create credential link:', error);
    return;
  }

  // 3. Get Credential Link Offer (Universal Link for QR)
  console.log('Getting credential link offer...');
  try {
    const getLinkOfferResponse = await callApi('POST', `/v2/identities/${issuerIdentifier}/credentials/links/${linkId}/offer`);
    const universalLink = getLinkOfferResponse.universalLink;
    console.log('\n--- Credential Offer Universal Link ---');
    console.log(universalLink);

    // Generate and display QR code in console
    console.log('\n--- QR Code ---');
    qrcode.toString(universalLink, { type: 'terminal' }, function (err, url) {
      if (err) console.error(err)
      console.log(url)
    })

    console.log('\nScan this QR code with your Privado ID wallet to receive the credential.');
  } catch (error) {
    console.error('Failed to get credential offer:', error);
  }
}

// Execute the main function
issueCredentialAndGenerateQr();