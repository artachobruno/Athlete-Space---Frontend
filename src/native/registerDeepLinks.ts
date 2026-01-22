/**
 * Top-level deep link registration for native apps.
 * 
 * CRITICAL: This MUST be registered at module load time, not in React hooks.
 * When Safari returns from OAuth, iOS relaunches the app and the deep link
 * event is delivered BEFORE React mounts. If the listener isn't registered
 * at this point, the event is lost forever.
 * 
 * This file is imported at app entry (main.tsx) to ensure the listener
 * exists before any deep links can arrive.
 */

import { App } from '@capacitor/app';
import { isNative } from '@/lib/platform';

if (isNative()) {
  console.log('[DeepLink] Registering appUrlOpen listener (top-level, module load)');

  App.addListener('appUrlOpen', (event) => {
    if (!event?.url) {
      console.warn('[DeepLink] Received appUrlOpen event but URL is empty');
      return;
    }

    console.log('[DeepLink] ✅ Received:', event.url);

    // Dispatch a custom event that React components can listen to
    // This allows React code to handle the callback while keeping
    // the listener registration at top-level
    window.dispatchEvent(
      new CustomEvent('oauth-callback', { detail: { url: event.url } })
    );
  });

  console.log('[DeepLink] ✅ appUrlOpen listener registered successfully');
} else {
  console.log('[DeepLink] Skipping deep link registration (web build)');
}
