/**
 * Debugging utilities for authentication.
 * Use these in browser console to debug auth issues.
 */

import { auth } from './auth';

/**
 * Debug function to check token status.
 * Run in browser console: window.debugAuth()
 */
export function debugAuth() {
  const token = auth.getToken();
  
  console.group('🔐 Authentication Debug');
  
  if (!token) {
    console.log('❌ No token found in localStorage');
    console.log('Token key:', 'auth_token');
    console.log('Action: User needs to authenticate via Strava OAuth');
    console.groupEnd();
    return;
  }
  
  console.log('✅ Token found');
  console.log('Token length:', token.length);
  
  // Check token format
  const parts = token.split('.');
  console.log('Token parts:', parts.length, '(should be 3 for JWT)');
  
  if (parts.length !== 3) {
    console.error('❌ Invalid token format - should have 3 parts (header.payload.signature)');
    console.groupEnd();
    return;
  }
  
  // Decode and show token info
  try {
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    
    console.log('Token header:', header);
    console.log('Token payload:', payload);
    
    // Check expiration
    if (payload.exp) {
      const expDate = new Date(payload.exp * 1000);
      const now = new Date();
      const isExpired = now >= expDate;
      
      console.log('Expiration date:', expDate.toISOString());
      console.log('Current time:', now.toISOString());
      console.log(isExpired ? '❌ Token is EXPIRED' : '✅ Token is valid');
      
      if (isExpired) {
        console.log('Action: Token needs to be refreshed - reconnect Strava');
      }
    } else {
      console.warn('⚠️ Token has no expiration claim');
    }
    
    // Show other claims
    if (payload.athlete_id) {
      console.log('Athlete ID:', payload.athlete_id);
    }
    if (payload.user_id) {
      console.log('User ID:', payload.user_id);
    }
    
  } catch (error) {
    console.error('❌ Failed to decode token:', error);
  }
  
  // Check if token would be used
  const isLoggedIn = auth.isLoggedIn();
  console.log('auth.isLoggedIn():', isLoggedIn);
  
  const expiration = auth.getTokenExpiration();
  if (expiration) {
    console.log('Token expires:', expiration.toISOString());
  }
  
  console.groupEnd();
}

/**
 * Check Authorization header format.
 * Run in browser console: window.checkAuthHeader()
 */
export function checkAuthHeader() {
  const token = auth.getToken();
  
  if (!token) {
    console.log('❌ No token - cannot check header format');
    return;
  }
  
  const headerValue = `Bearer ${token}`;
  console.group('📋 Authorization Header Check');
  console.log('Header format:', 'Authorization: Bearer <token>');
  console.log('Header value length:', headerValue.length);
  console.log('Starts with "Bearer ":', headerValue.startsWith('Bearer '));
  console.log('Token part:', token.substring(0, 20) + '...');
  console.groupEnd();
}

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as { debugAuth?: () => void; checkAuthHeader?: () => void }).debugAuth = debugAuth;
  (window as { debugAuth?: () => void; checkAuthHeader?: () => void }).checkAuthHeader = checkAuthHeader;
}

