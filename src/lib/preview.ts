/**
 * Detects if the app is running in Lovable preview mode.
 * Lovable preview runs in an iframe with hostname like preview.lovable.app
 * 
 * This is used to enable preview-only features like auth bypass for visual previews.
 * This does NOT affect production security.
 */
export function isPreviewMode(): boolean {
  if (typeof window === "undefined") return false;
  
  const hostname = window.location.hostname;
  
  // Check for Lovable preview hostnames
  if (hostname.includes("lovable")) {
    return true;
  }
  
  // Check for Vite preview mode (optional, for local previews)
  if (import.meta.env.MODE === "preview") {
    return true;
  }
  
  // Check for explicit environment variable (for testing)
  if (import.meta.env.VITE_PREVIEW_MODE === "true") {
    return true;
  }
  
  return false;
}

/**
 * Gets a mock user object for preview mode.
 * This is ONLY used when isPreviewMode() returns true.
 */
export function getPreviewUser() {
  return {
    user_id: "preview-user",
    email: "preview@example.com",
    name: "Preview User",
    onboarding_complete: true,
    created_at: new Date().toISOString(),
  };
}
