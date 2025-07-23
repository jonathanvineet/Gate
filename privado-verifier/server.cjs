const express = require("express");
const getRawBody = require("raw-body");
const { auth, Verifier, resolver } = require("@iden3/js-iden3-auth");
const path = require("path");

const app = express();
const port = 8000;

// === Replace these ===
const CALLBACK_URL = "http://localhost:8000/api/callback"; // This must match what you send in request
const VERIFIER_DID = "did:iden3:privado:main:2ScwqMj93k1wGLto2qp7MJ6UNzRULo8jnVcf23rF8M";
const TRUSTED_ISSUER_DID = "did:iden3:privado:main:2ShURX9tMiZrEyUkppLqwnyku1QoCcXYaWWcdbfm5e";
const ETH_NODE = "https://mainnet.infura.io/v3/bfebfef38464407e8b4ff77652a3eed7"; // Polygon Mumbai
const CONTRACT_ADDRESS = "0x134B1BE34911E39A8397ec6289782989729807a4"; // Polygon ID state contract
const CIRCUIT_DIR = path.join(__dirname, "circuits"); // Public key circuit files

let authRequest = null;

// =========== STEP 1: REQUEST ============= //
app.get("/api/request", async (req, res) => {
  const request = auth.createAuthorizationRequest(
    "Proof of Age",
    VERIFIER_DID,
    CALLBACK_URL
  );

  const proofRequest = {
    id: 1,
    circuitId: "credentialAtomicQuerySigV2",
    query: {
      allowedIssuers: [TRUSTED_ISSUER_DID],
      type: "KYCAgeCredential",
      context:
        "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld",
      credentialSubject: {
        birthday: { $lt: 20000101 } // e.g., over 25 years old
      }
    }
  };

  request.body.scope = [proofRequest];
  authRequest = request;
  res.json(authRequest);
});

// =========== STEP 2: CALLBACK ============= //
app.post("/api/callback", async (req, res) => {
  const raw = await getRawBody(req);
  const tokenStr = raw.toString().trim();

  try {
    const ethStateResolver = new resolver.EthStateResolver(
      ETH_NODE,
      CONTRACT_ADDRESS
    );
    const resolvers = {
      ["polygon:mumbai"]: ethStateResolver
    };

    const verifier = await Verifier.newVerifier({
      stateResolver: resolvers,
      circuitsDir: CIRCUIT_DIR,
      ipfsGatewayURL: "https://ipfs.io"
    });

    const opts = {
      AcceptedStateTransitionDelay: 5 * 60 * 1000 // 5 minutes
    };

    const authResponse = await verifier.fullVerify(tokenStr, authRequest, opts);

    console.log("✅ Proof verified!");
    console.log("User DID: ", authResponse.from);

    // You can now authenticate this user using their DID
    res.send("✅ Proof verified and user DID received: " + authResponse.from);
  } catch (e) {
    console.error("❌ Verification failed: ", e);
    res.status(400).send("Verification failed.");
  }
});

app.listen(port, () => {
  console.log(`🔐 Privado Verifier running at http://localhost:${port}`);
});
