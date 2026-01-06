import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global error handler to catch unhandled promise rejections
// This helps catch errors from browser extensions or other external sources
window.addEventListener('unhandledrejection', (event) => {
  // Ignore errors from browser extensions (moz-extension://, chrome-extension://)
  if (event.reason && typeof event.reason === 'object') {
    const error = event.reason as { stack?: string; message?: string };
    if (error.stack?.includes('moz-extension://') || 
        error.stack?.includes('chrome-extension://') ||
        error.message?.includes('detectStore')) {
      event.preventDefault(); // Prevent console error from extension interference
      return;
    }
  }
  
  // Log other unhandled rejections for debugging
  console.warn('[App] Unhandled promise rejection:', event.reason);
});

createRoot(document.getElementById("root")!).render(<App />);
