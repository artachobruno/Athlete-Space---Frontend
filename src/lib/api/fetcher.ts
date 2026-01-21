const getBaseURL = () => {
  const isCapacitor = typeof window !== 'undefined' && (
    window.location.protocol === 'capacitor:' ||
    window.location.origin === 'capacitor://localhost' ||
    window.location.href.startsWith('capacitor://')
  );
  
  if (isCapacitor) {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      console.warn("[Fetcher] VITE_API_URL not set in Capacitor, falling back to http://localhost:8000");
      return "http://localhost:8000";
    }
    return apiUrl;
  }
  
  if (import.meta.env.PROD) {
    // CRITICAL: In production, VITE_API_URL is REQUIRED
    // Never fall back to window.location.origin - frontend and backend are on different domains
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      const errorMsg = "[Fetcher] CRITICAL: VITE_API_URL is required in production but is not set! " +
                      "Please configure VITE_API_URL in your deployment environment (e.g., Render dashboard). " +
                      "Example: VITE_API_URL=https://app.athletespace.ai";
      console.error(errorMsg);
      console.error("[Fetcher] Current window.location.origin:", window.location.origin);
      throw new Error("VITE_API_URL environment variable is required in production. Please configure it in your deployment settings.");
    }
    return apiUrl;
  }
  return "http://localhost:8000";
};

export async function fetchJSON<T>(url: string): Promise<T> {
  const baseURL = getBaseURL();
  const fullUrl = url.startsWith('http') ? url : `${baseURL}${url.startsWith('/') ? url : `/${url}`}`;
  
  const res = await fetch(fullUrl, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${fullUrl}: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
