// Stub for @capacitor/haptics - used in web builds where Capacitor is not installed
// Haptics are not available on web, so all methods are no-ops

export enum ImpactStyle {
  Light = 'Light',
  Medium = 'Medium',
  Heavy = 'Heavy',
}

interface ImpactOptions {
  style: ImpactStyle;
}

export const Haptics = {
  /**
   * Trigger a haptic impact.
   * Web stub does nothing (haptics not available on web).
   */
  async impact(options: ImpactOptions): Promise<void> {
    // No-op on web
  },

  /**
   * Start a haptic selection.
   * Web stub does nothing (haptics not available on web).
   */
  async selectionStart(): Promise<void> {
    // No-op on web
  },

  /**
   * End a haptic selection.
   * Web stub does nothing (haptics not available on web).
   */
  async selectionEnd(): Promise<void> {
    // No-op on web
  },

  /**
   * Trigger a haptic notification.
   * Web stub does nothing (haptics not available on web).
   */
  async notification(options?: { type: 'success' | 'warning' | 'error' }): Promise<void> {
    // No-op on web
  },

  /**
   * Vibrate the device.
   * Web stub does nothing (haptics not available on web).
   */
  async vibrate(options?: { duration: number }): Promise<void> {
    // No-op on web
  },
};
