// Platform detection - checks runtime environment to determine if running in native app
export function isNative(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  // Check if we're running in a Capacitor native app
  // Native apps use capacitor:// protocol
  const origin = window.location.origin;
  const href = window.location.href;
  const protocol = window.location.protocol;
  
  // Capacitor native apps use capacitor:// protocol
  if (
    origin === 'capacitor://localhost' ||
    href.startsWith('capacitor://') ||
    protocol === 'capacitor:'
  ) {
    return true;
  }
  
  // Check for iOS/Android-specific indicators
  // iOS apps might use custom schemes or localhost with specific ports
  const userAgent = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  
  // If we're on mobile device and NOT in a standard browser (http/https), we're likely native
  // Standard browsers use http:// or https://, native apps use custom schemes
  if ((isIOS || isAndroid) && !protocol.startsWith('http')) {
    return true;
  }
  
  return false;
}
