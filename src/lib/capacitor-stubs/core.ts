// Stub for @capacitor/core - used in web builds where Capacitor is not installed
export const Capacitor = {
  isNativePlatform: () => false,
  getPlatform: () => 'web',
};

// Stub for registerPlugin - returns a mock plugin that throws on method calls
// This is used by Capacitor plugins like @capgo/capacitor-social-login
interface PluginImplementations {
  web?: () => Promise<unknown>;
  ios?: () => Promise<unknown>;
  android?: () => Promise<unknown>;
}

export function registerPlugin<T>(
  pluginName: string,
  _implementations?: PluginImplementations
): T {
  // Return a proxy that throws when any method is called
  // This ensures the code compiles for web but fails gracefully at runtime
  const handler: ProxyHandler<object> = {
    get(_target: object, prop: string | symbol): unknown {
      if (typeof prop === 'string') {
        return () => {
          throw new Error(
            `${pluginName}.${prop}() is not available in web builds. ` +
            `This plugin only works on iOS/Android.`
          );
        };
      }
      return undefined;
    },
  };
  return new Proxy({}, handler) as T;
}

// Stub for WebPlugin - base class for Capacitor web plugins
export class WebPlugin {
  protected listeners: Record<string, Array<(...args: unknown[]) => void>> = {};

  addListener(
    eventName: string,
    listenerFunc: (...args: unknown[]) => void
  ): Promise<{ remove: () => Promise<void> }> {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(listenerFunc);
    return Promise.resolve({
      remove: () => {
        const idx = this.listeners[eventName]?.indexOf(listenerFunc) ?? -1;
        if (idx >= 0) {
          this.listeners[eventName].splice(idx, 1);
        }
        return Promise.resolve();
      },
    });
  }

  protected notifyListeners(eventName: string, data: unknown): void {
    const handlers = this.listeners[eventName] || [];
    for (const handler of handlers) {
      handler(data);
    }
  }
}
