import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from './context/ThemeContext'; // Import ThemeProvider

// Set up axios interceptors for token handling
import './utils/axiosConfig.ts';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider> {/* Wrap App with ThemeProvider */}
      <App />
    </ThemeProvider>
  </StrictMode>
);

// Register the lightweight PWA service worker in production builds
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}