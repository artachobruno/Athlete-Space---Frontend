import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Import debug utilities (makes them available in console)
import "./lib/auth-debug";
import "./lib/api-debug";
import "leaflet/dist/leaflet.css";

// Global error handlers to catch errors from browser extensions or other external sources
// CRITICAL: These errors must NEVER affect app state, cause redirects, or break bootstrap
// They should be silently swallowed to prevent app crashes during hydration

// Handle unhandled promise rejections (e.g., detectStore().then() when detectStore is undefined)
window.addEventListener('unhandledrejection', (event) => {
  const reasonStr = String(event.reason || '');
  const errorStr = event.reason && typeof event.reason === 'object'
    ? String((event.reason as { stack?: string; message?: string; toString?: () => string }).stack || 
             (event.reason as { message?: string }).message || 
             (event.reason as { toString?: () => string }).toString?.() || '')
    : '';

  const combinedStr = reasonStr + errorStr;

  // Suppress detectStore and extension errors - these must not break app bootstrap
  if (
    combinedStr.includes('detectStore') ||
    combinedStr.includes('a.default.detectStore') ||
    combinedStr.includes('moz-extension://') ||
    combinedStr.includes('chrome-extension://') ||
    combinedStr.includes('h1-check.js') ||
    combinedStr.includes("can't access property \"then\"")
  ) {
    // CRITICAL: Just log and swallow - do NOT do anything that could affect app state
    if (import.meta.env.DEV) {
      console.warn('[GlobalError] Ignored detectStore/extension rejection:', reasonStr.substring(0, 100));
    }
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  // Log other unhandled rejections for debugging (only in development)
  if (import.meta.env.DEV) {
    console.warn('[App] Unhandled promise rejection:', event.reason);
  }
});

// Handle regular JavaScript errors (e.g., detectStore() throws)
const originalError = window.onerror;
window.onerror = (message, source, lineno, colno, error) => {
  const errorStr = String(message || '') + String(source || '');
  const errorStack = error?.stack || '';

  // Suppress detectStore and extension errors - these must not break app bootstrap
  if (
    errorStr.includes('detectStore') ||
    errorStr.includes('a.default.detectStore') ||
    errorStack.includes('detectStore') ||
    errorStr.includes('moz-extension://') ||
    errorStr.includes('chrome-extension://') ||
    errorStr.includes('h1-check.js') ||
    errorStr.includes("can't access property \"then\"")
  ) {
    // CRITICAL: Just log and swallow - do NOT do anything that could affect app state
    if (import.meta.env.DEV) {
      console.warn('[GlobalError] Ignored detectStore/extension error:', errorStr.substring(0, 100));
    }
    // Return true to prevent default error handling and stop propagation
    // This prevents the error from breaking app bootstrap
    return true;
  }

  // Call original error handler if it exists (for legitimate errors)
  if (originalError) {
    return originalError(message, source, lineno, colno, error);
  }

  // Allow default error handling for other errors
  return false;
};

createRoot(document.getElementById("root")!).render(<App />);
