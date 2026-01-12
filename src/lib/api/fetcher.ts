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
    const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
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
