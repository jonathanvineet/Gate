import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { verificationService } from './services/verificationService';

// Set the base URL for the verification service
verificationService.setBaseUrl('https://a402836e773f.ngrok-free.app');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
