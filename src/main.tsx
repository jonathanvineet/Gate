import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Import buffer polyfill for ethers.js compatibility
import { Buffer } from 'buffer';

// Make Buffer available globally for browser compatibility
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  // Also add it to globalThis for broader compatibility
  globalThis.Buffer = Buffer;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
