// Stub for @capacitor/browser - used in web builds where Capacitor is not installed
// In native builds, Capacitor will provide the real implementation at runtime
// This stub checks for the real plugin and uses it if available

// Try to get the real Browser plugin from Capacitor if available (native builds)
// Capacitor plugins can be accessed via window.Capacitor.Plugins.PluginName
const getRealBrowser = () => {
  if (typeof window !== 'undefined') {
    // Try multiple ways Capacitor might expose the plugin
    const win = window as {
      Capacitor?: {
        Plugins?: { Browser?: typeof BrowserStub };
        getPlugin?: (name: string) => typeof BrowserStub | undefined;
      };
    };
    
    // Method 1: Direct plugin access
    if (win.Capacitor?.Plugins?.Browser) {
      return win.Capacitor.Plugins.Browser;
    }
    
    // Method 2: Via getPlugin (if available)
    if (win.Capacitor?.getPlugin) {
      const plugin = win.Capacitor.getPlugin('Browser');
      if (plugin) {
        return plugin as typeof BrowserStub;
      }
    }
  }
  return null;
};

interface BrowserStub {
  open: (options: { url: string; presentationStyle?: string }) => Promise<void>;
  close: () => Promise<void>;
}

const BrowserStub: BrowserStub = {
  open: async (options: { url: string; presentationStyle?: string }) => {
    // Try to use real plugin first (native builds)
    const realBrowser = getRealBrowser();
    if (realBrowser) {
      return realBrowser.open(options);
    }
    
    // Fallback to window.location for web builds
    if (typeof window !== 'undefined') {
      window.location.href = options.url;
      return;
    }
    throw new Error('Browser plugin not available');
  },
  close: async () => {
    // Try to use real plugin first (native builds)
    const realBrowser = getRealBrowser();
    if (realBrowser) {
      return realBrowser.close();
    }
    
    // No-op in web builds
    return;
  },
};

export const Browser = BrowserStub;
