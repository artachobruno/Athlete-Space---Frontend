import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Import debug utilities (makes them available in console)
import "./lib/auth-debug";
import "./lib/api-debug";
import "leaflet/dist/leaflet.css";

// Global error handlers to catch errors from browser extensions or other external sources
// CRITICAL: These errors must NEVER affect app state or cause redirects
window.addEventListener('unhandledrejection', (event) => {
  // Ignore errors from browser extensions (moz-extension://, chrome-extension://)
  if (event.reason && typeof event.reason === 'object') {
    const error = event.reason as { stack?: string; message?: string; toString?: () => string };
    const errorStr = error.stack || error.message || error.toString?.() || '';
    if (errorStr.includes('moz-extension://') || 
        errorStr.includes('chrome-extension://') ||
        errorStr.includes('detectStore') ||
        errorStr.includes('h1-check.js') ||
        errorStr.includes("can't access property \"then\"")) {
      // CRITICAL: Prevent extension errors from affecting app state
      event.preventDefault();
      event.stopPropagation();
      return;
    }
  }
  
  // Check if error message contains extension-related strings
  const reasonStr = String(event.reason || '');
  if (reasonStr.includes('detectStore') || 
      reasonStr.includes('moz-extension://') || 
      reasonStr.includes('chrome-extension://') ||
      reasonStr.includes("can't access property \"then\"")) {
    // CRITICAL: Prevent extension errors from affecting app state
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  
  // Log other unhandled rejections for debugging (only in development)
  if (import.meta.env.DEV) {
    console.warn('[App] Unhandled promise rejection:', event.reason);
  }
});

// Also catch regular errors from extensions
// CRITICAL: These errors must NEVER affect app state or cause redirects
const originalError = window.onerror;
window.onerror = (message, source, lineno, colno, error) => {
  const errorStr = String(message || '') + String(source || '');
  if (errorStr.includes('moz-extension://') || 
      errorStr.includes('chrome-extension://') ||
      errorStr.includes('detectStore') ||
      errorStr.includes('h1-check.js') ||
      errorStr.includes("can't access property \"then\"") ||
      errorStr.includes('a.default.detectStore')) {
    // CRITICAL: Suppress extension errors completely - they must not affect app state
    // Return true to prevent default error handling and stop propagation
    return true;
  }
  // Call original error handler if it exists
  if (originalError) {
    return originalError(message, source, lineno, colno, error);
  }
  return false; // Allow default error handling for other errors
};

createRoot(document.getElementById("root")!).render(<App />);
