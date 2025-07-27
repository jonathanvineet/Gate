// src/App.jsx
import React, { useState } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
function App() {
  const [authRequest, setAuthRequest] = useState(null);

  const fetchAuthRequest = async () => {
    const res = await axios.get("http://localhost:8080/api/sign-in");
    setAuthRequest(res.data);
  };

  return (
    <div>
      <h1>Privado ID Verifier</h1>
      <button onClick={fetchAuthRequest}>Start Verification</button>
      {authRequest && (
        <div>
          <p>Scan with your Privado wallet app:</p>
          <QRCodeSVG value={authRequest.uri} width={300} height={300} />
          <br />
          <a href={authRequest.uri} target="_blank" rel="noreferrer">
            Open Deep Link
          </a>
        </div>
      )}
    </div>
  );
}

export default App;
