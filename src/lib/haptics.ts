import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Trigger a light haptic feedback - used for subtle interactions
 */
export async function hapticLight() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Haptics not available
  }
}

/**
 * Trigger a medium haptic feedback - used for navigation/swipes
 */
export async function hapticMedium() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    // Haptics not available
  }
}

/**
 * Trigger a heavy haptic feedback - used for important actions
 */
export async function hapticHeavy() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch {
    // Haptics not available
  }
}

/**
 * Trigger a selection haptic - light tap for UI selections
 */
export async function hapticSelection() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await Haptics.selectionStart();
    await Haptics.selectionEnd();
  } catch {
    // Haptics not available
  }
}
