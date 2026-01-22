// Stub for @capacitor/app - used in web builds where Capacitor is not installed
// In native builds, Capacitor will provide the real implementation at runtime
// This stub checks for the real plugin and uses it if available

// Try to get the real App plugin from Capacitor if available (native builds)
const getRealApp = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Try multiple ways Capacitor might expose the plugin
  const win = window as {
    Capacitor?: {
      Plugins?: { App?: typeof AppStub };
      getPlugin?: (name: string) => typeof AppStub | undefined;
    };
  };
  
  // Method 1: Direct plugin access (most common)
  if (win.Capacitor?.Plugins?.App) {
    console.log('[App] Found real Capacitor App plugin via Capacitor.Plugins.App');
    return win.Capacitor.Plugins.App;
  }
  
  // Method 2: Via getPlugin (if available)
  if (win.Capacitor?.getPlugin) {
    const plugin = win.Capacitor.getPlugin('App');
    if (plugin) {
      console.log('[App] Found real Capacitor App plugin via getPlugin');
      return plugin as typeof AppStub;
    }
  }
  
  // Method 3: Check if Capacitor is loaded at all
  if (!win.Capacitor) {
    console.warn('[App] Capacitor not found on window - this is a web build or Capacitor not initialized');
  } else {
    console.warn('[App] Capacitor found but App plugin not available - check plugin registration');
  }
  
  return null;
};

interface AppStub {
  addListener: (eventName: string, callback: (data: { url: string }) => void) => Promise<{ remove: () => Promise<void> }>;
}

const AppStub: AppStub = {
  addListener: (eventName: string, callback: (data: { url: string }) => void) => {
    // Try to use real plugin first (native builds)
    const realApp = getRealApp();
    if (realApp) {
      console.log(`[App] Using real Capacitor App plugin for event: ${eventName}`);
      return realApp.addListener(eventName, callback);
    }
    
    // Fallback: return no-op listener for web builds
    console.warn(`[App] App plugin not available (web build), listener for ${eventName} will not work`);
    return Promise.resolve({
      remove: () => Promise.resolve(),
    });
  },
};

export const App = AppStub;
