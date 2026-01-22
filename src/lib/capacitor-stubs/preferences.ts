// Stub for @capacitor/preferences - used in web builds where Capacitor is not installed
// Falls back to localStorage for web builds

interface PreferencesGetResult {
  value: string | null;
}

interface PreferencesSetOptions {
  key: string;
  value: string;
}

interface PreferencesGetOptions {
  key: string;
}

interface PreferencesRemoveOptions {
  key: string;
}

export const Preferences = {
  /**
   * Set a value in preferences.
   * Web stub uses localStorage.
   */
  async set(options: PreferencesSetOptions): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.setItem(options.key, options.value);
  },

  /**
   * Get a value from preferences.
   * Web stub uses localStorage.
   */
  async get(options: PreferencesGetOptions): Promise<PreferencesGetResult> {
    if (typeof window === 'undefined') {
      return { value: null };
    }
    const value = localStorage.getItem(options.key);
    return { value };
  },

  /**
   * Remove a value from preferences.
   * Web stub uses localStorage.
   */
  async remove(options: PreferencesRemoveOptions): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.removeItem(options.key);
  },

  /**
   * Clear all preferences.
   * Web stub uses localStorage.
   */
  async clear(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.clear();
  },

  /**
   * Get all keys from preferences.
   * Web stub uses localStorage.
   */
  async keys(): Promise<{ keys: string[] }> {
    if (typeof window === 'undefined') {
      return { keys: [] };
    }
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }
    return { keys };
  },
};
