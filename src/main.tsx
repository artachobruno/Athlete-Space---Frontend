import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Import debug utilities (makes them available in console)
import "./lib/auth-debug";
import "./lib/api-debug";
import "leaflet/dist/leaflet.css";

// Global error handlers to catch errors from browser extensions or other external sources
window.addEventListener('unhandledrejection', (event) => {
  // Ignore errors from browser extensions (moz-extension://, chrome-extension://)
  if (event.reason && typeof event.reason === 'object') {
    const error = event.reason as { stack?: string; message?: string; toString?: () => string };
    const errorStr = error.stack || error.message || error.toString?.() || '';
    if (errorStr.includes('moz-extension://') || 
        errorStr.includes('chrome-extension://') ||
        errorStr.includes('detectStore') ||
        errorStr.includes('h1-check.js')) {
      event.preventDefault(); // Prevent console error from extension interference
      return;
    }
  }
  
  // Check if error message contains extension-related strings
  const reasonStr = String(event.reason || '');
  if (reasonStr.includes('detectStore') || reasonStr.includes('moz-extension://') || reasonStr.includes('chrome-extension://')) {
    event.preventDefault();
    return;
  }
  
  // Log other unhandled rejections for debugging (only in development)
  if (import.meta.env.DEV) {
    console.warn('[App] Unhandled promise rejection:', event.reason);
  }
});

// Also catch regular errors from extensions
const originalError = window.onerror;
window.onerror = (message, source, lineno, colno, error) => {
  const errorStr = String(message || '') + String(source || '');
  if (errorStr.includes('moz-extension://') || 
      errorStr.includes('chrome-extension://') ||
      errorStr.includes('detectStore') ||
      errorStr.includes('h1-check.js') ||
      errorStr.includes('can\'t access property "then"')) {
    // Suppress extension errors
    return true; // Prevent default error handling
  }
  // Call original error handler if it exists
  if (originalError) {
    return originalError(message, source, lineno, colno, error);
  }
  return false; // Allow default error handling for other errors
};

createRoot(document.getElementById("root")!).render(<App />);
