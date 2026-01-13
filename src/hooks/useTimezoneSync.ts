/**
 * Hook to automatically sync user timezone to backend.
 * 
 * Runs once per session after successful authentication.
 * Silent and automatic - no UI needed.
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { detectTimezone } from '@/lib/timezone';
import { updateUserSettings } from '@/lib/apiClient';

const TIMEZONE_SYNC_KEY = 'timezone_synced_session';

/**
 * Syncs user timezone to backend after authentication.
 * 
 * Rules:
 * - Runs once per session (tracked in sessionStorage)
 * - Only runs when user is authenticated
 * - Only syncs if detected timezone differs from backend timezone
 * - Silent - no errors shown to user
 */
export function useTimezoneSync(): void {
  const { user, status } = useAuth();
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    // Only run when authenticated
    if (status !== 'authenticated' || !user) {
      return;
    }

    // Only run once per session
    if (hasSyncedRef.current) {
      return;
    }

    // Check if we've already synced this session
    const sessionKey = `${TIMEZONE_SYNC_KEY}_${user.id}`;
    const hasSyncedThisSession = sessionStorage.getItem(sessionKey) === 'true';
    
    if (hasSyncedThisSession) {
      hasSyncedRef.current = true;
      return;
    }

    // Detect local timezone
    const detectedTimezone = detectTimezone();
    const backendTimezone = user.timezone || 'UTC';

    // Only sync if timezone differs
    if (detectedTimezone === backendTimezone) {
      console.log(`[Timezone] Timezone matches backend (${detectedTimezone}), skipping sync`);
      sessionStorage.setItem(sessionKey, 'true');
      hasSyncedRef.current = true;
      return;
    }

    // Sync timezone to backend (silent - no error handling needed)
    console.log(`[Timezone] Syncing timezone: ${backendTimezone} → ${detectedTimezone}`);
    
    updateUserSettings({ timezone: detectedTimezone })
      .then(() => {
        console.log(`[Timezone] Successfully synced timezone to ${detectedTimezone}`);
        sessionStorage.setItem(sessionKey, 'true');
        hasSyncedRef.current = true;
      })
      .catch((error) => {
        // Silent failure - don't show errors to user
        // This is a background sync, not critical for app functionality
        console.warn('[Timezone] Failed to sync timezone (non-critical):', error);
        // Still mark as synced to avoid retrying repeatedly
        sessionStorage.setItem(sessionKey, 'true');
        hasSyncedRef.current = true;
      });
  }, [user, status]);
}
