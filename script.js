// script.js

// --- Configuration ---
// Replace with your actual API base URL, username, and password
const API_BASE_URL = 'http://localhost:3001';
const USERNAME = 'user-issuer';
const PASSWORD = 'password-issuer'; // Use a secure password in production


// Replace with your issuer identity details (if you need to create one)
// If you already have an identity, you can use its identifier directly.


// Replace with your credential details
const CREDENTIAL_SCHEMA = 'https://raw.githubusercontent.com/iden3/claim-schema-vocab/refs/heads/main/schemas/json/KYCAgeCredential-v2.json';
const CREDENTIAL_TYPE = 'KYCAgeCredential';
const CREDENTIAL_SUBJECT_ID = 'did:polygonid:polygon:amoy:2qFpPHotk6oyaX1fcrpQFT4BMnmg8YszUwxYtaoGoe'; // The DID of the user receiving the credential
const CREDENTIAL_SUBJECT_DATA = {
  birthday: 20000101, // Example: YYYYMMDD format for a birthday (e.g., Jan 1, 2000)
  documentType: 1, // Example: An integer representing a document type
  // Add other claims as per your schema
};
const CREDENTIAL_EXPIRATION = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60); // 1 year from now (Unix timestamp)

// --- DOM Elements ---
const issueCredentialBtn = document.getElementById('issueCredentialBtn');
const messagesDiv = document.getElementById('messages');
const qrcodeDiv = document.getElementById('qrcode');

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
    messagesDiv.textContent = `Error: ${error.message}`;
    throw error;
  }
}

// --- Main Logic ---
issueCredentialBtn.addEventListener('click', async () => {
  messagesDiv.textContent = 'Issuing credential...';
  qrcodeDiv.innerHTML = ''; // Clear previous QR code

  let issuerIdentifier;

  try {
    // 1. Get the existing Identity named "vj"
    messagesDiv.textContent = 'Fetching identities to find "vj"...';
    const identitiesResponse = await callApi('GET', '/v2/identities');
    const vjIdentity = identitiesResponse.find(identity => identity.displayName === 'Vj');

    if (!vjIdentity) {
      messagesDiv.textContent = 'Error: Identity "vj" not found. Please ensure an identity with this display name exists.';
      return;
    }
    issuerIdentifier = vjIdentity.identifier;
    messagesDiv.textContent = `Found Identity "vj" with identifier: ${issuerIdentifier}`;

    // 2. Create a Credential Link
    messagesDiv.textContent = 'Creating credential link...';
    const createLinkRequestBody = {
      credentialSchema: CREDENTIAL_SCHEMA,
      credentialType: CREDENTIAL_TYPE,
      credentialSubject: {
        ...CREDENTIAL_SUBJECT_DATA
      },
      // You can add other link-specific properties here if needed, e.g., expiration
      proofTypes: ['BJJSignatureProof'], // Changed to proofTypes array
    };

    const createLinkResponse = await callApi('POST', `/v2/identities/${issuerIdentifier}/credentials/links`, createLinkRequestBody);
    const linkId = createLinkResponse.id;
    messagesDiv.textContent = `Credential Link created with ID: ${linkId}`;

    // 3. Get Credential Link Offer (Universal Link for QR)
    messagesDiv.textContent = 'Getting credential link offer...';
    const getLinkOfferResponse = await callApi('POST', `/v2/identities/${issuerIdentifier}/credentials/links/${linkId}/offer`);
    const universalLink = getLinkOfferResponse.universalLink;
    messagesDiv.textContent = 'Generating QR code...';

    // Generate and display QR code
    new QRCode(qrcodeDiv, {
      text: universalLink,
      width: 256,
      height: 256,
      colorDark : "#000000",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.H
    });

    messagesDiv.textContent = 'Scan the QR code with your Privado ID wallet.';

  } catch (error) {
    console.error('Full process failed:', error);
    messagesDiv.textContent = `Error: ${error.message || 'An unknown error occurred.'}`;
  }
});
