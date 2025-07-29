const ISSUER_DID = 'did:polygonid:polygon:amoy:2qY78akW9i87q2hKuPpjP3ews85TnvZPrcJwHBra1a';
const SUBJECT_DID = 'did:iden3:privado:main:2ScwqMj93k1wGLto2qp7MJ6UNzRULo8jnVcf23rF8M';

export const API_CONFIG = {
  // Use proxy in development, direct server URL in production
  BASE_URL: import.meta.env.DEV ? '' : 'https://a402836e773f.ngrok-free.app',
  
  // Identity DID - this should match your issuer identity
  IDENTITY_DID: encodeURIComponent(ISSUER_DID),
  
  // Credential subject ID - this should be the same as the issuer for self-issued credentials
  CREDENTIAL_SUBJECT_ID: SUBJECT_DID,
  
  // Auth header
  AUTH_HEADER: 'Basic dXNlci1pc3N1ZXI6cGFzc3dvcmQtaXNzdWVy',
  
  // Headers
  HEADERS: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': 'Basic dXNlci1pc3N1ZXI6cGFzc3dvcmQtaXNzdWVy',
    'ngrok-skip-browser-warning': 'true'
  }
};

export const getCredentialsUrl = (): string => {
  return `${API_CONFIG.BASE_URL}/v2/identities/${encodeURIComponent(ISSUER_DID)}/credentials`;
};

export const getOfferUrl = (credentialId: string): string => {
  return `${API_CONFIG.BASE_URL}/v2/identities/${encodeURIComponent(ISSUER_DID)}/credentials/${credentialId}/qrcode`;
};

export const createCredentialPayload = (birthday: string) => {
  return {
    credentialSchema: "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json/KYCAgeCredential-v3.json",
    type: "KYCAgeCredential",
    credentialSubject: {
      id: SUBJECT_DID,
      birthday: parseInt(birthday, 10),
      documentType: 2
    },
    expiration: 1903357766
  };
};
