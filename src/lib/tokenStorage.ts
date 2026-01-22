/**
 * Secure token storage for mobile apps using Capacitor Preferences API.
 * Falls back to localStorage for web (development only - production web uses cookies).
 */

import { Preferences } from '@capacitor/preferences';
import { isNative } from './platform';

const ACCESS_TOKEN_KEY = 'auth_access_token';
const TOKEN_EXPIRY_KEY = 'auth_token_expiry';

/**
 * Store access token securely.
 * On mobile: Uses Capacitor Preferences (secure storage)
 * On web: Uses localStorage (fallback, web should use cookies)
 */
export async function storeAccessToken(token: string, expiresIn: number): Promise<void> {
  try {
    if (isNative()) {
      // Mobile: Use Capacitor secure storage
      console.log('[TokenStorage] Storing token in Capacitor Preferences...');
      await Preferences.set({ key: ACCESS_TOKEN_KEY, value: token });
      
      // Store expiry timestamp
      const expiryTimestamp = Date.now() + (expiresIn * 1000);
      await Preferences.set({ key: TOKEN_EXPIRY_KEY, value: expiryTimestamp.toString() });
      
      // Verify it was stored
      const verifyResult = await Preferences.get({ key: ACCESS_TOKEN_KEY });
      if (verifyResult.value === token) {
        console.log('[TokenStorage] ✅ Token stored and verified in Capacitor Preferences');
      } else {
        console.error('[TokenStorage] ❌ Token storage verification failed!', {
          expected: token.substring(0, 20) + '...',
          got: verifyResult.value?.substring(0, 20) + '...',
        });
        throw new Error('Token storage verification failed');
      }
    } else {
      // Web: Use localStorage (fallback - production web should use cookies)
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
      const expiryTimestamp = Date.now() + (expiresIn * 1000);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTimestamp.toString());
      console.log('[TokenStorage] Token stored in localStorage (web fallback)');
    }
  } catch (error) {
    console.error('[TokenStorage] ❌ Failed to store token:', error);
    throw error;
  }
}

/**
 * Retrieve access token.
 * Returns null if token is missing or expired.
 */
export async function getAccessToken(): Promise<string | null> {
  let token: string | null = null;
  let expiryTimestamp: number | null = null;
  
  try {
    if (isNative()) {
      // Mobile: Get from Capacitor secure storage
      const tokenResult = await Preferences.get({ key: ACCESS_TOKEN_KEY });
      const expiryResult = await Preferences.get({ key: TOKEN_EXPIRY_KEY });
      
      token = tokenResult.value;
      expiryTimestamp = expiryResult.value ? parseInt(expiryResult.value, 10) : null;
      
      console.log('[TokenStorage] Retrieved from Capacitor Preferences:', {
        hasToken: !!token,
        hasExpiry: !!expiryTimestamp,
        expiryTimestamp,
        isExpired: expiryTimestamp ? Date.now() >= expiryTimestamp : null,
      });
    } else {
      // Web: Get from localStorage
      token = localStorage.getItem(ACCESS_TOKEN_KEY);
      const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
      expiryTimestamp = expiryStr ? parseInt(expiryStr, 10) : null;
      
      console.log('[TokenStorage] Retrieved from localStorage:', {
        hasToken: !!token,
        hasExpiry: !!expiryTimestamp,
      });
    }
  } catch (error) {
    console.error('[TokenStorage] Error retrieving token:', error);
    return null;
  }
  
  // Check if token exists
  if (!token) {
    console.log('[TokenStorage] No token found');
    return null;
  }
  
  // Check if token is expired
  if (expiryTimestamp && Date.now() >= expiryTimestamp) {
    console.log('[TokenStorage] Token expired, clearing');
    await clearAccessToken();
    return null;
  }
  
  console.log('[TokenStorage] Valid token found');
  return token;
}

/**
 * Clear stored access token.
 */
export async function clearAccessToken(): Promise<void> {
  if (isNative()) {
    // Mobile: Clear from Capacitor secure storage
    await Preferences.remove({ key: ACCESS_TOKEN_KEY });
    await Preferences.remove({ key: TOKEN_EXPIRY_KEY });
    console.log('[TokenStorage] Token cleared from Capacitor Preferences');
  } else {
    // Web: Clear from localStorage
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    console.log('[TokenStorage] Token cleared from localStorage');
  }
}

/**
 * Check if a valid token exists.
 */
export async function hasValidToken(): Promise<boolean> {
  const token = await getAccessToken();
  return token !== null;
}
