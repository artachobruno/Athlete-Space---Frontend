/**
 * Debug utilities for API requests.
 * Use these in browser console to test if headers are being sent.
 */

import { api } from './api';
import { auth } from './auth';

/**
 * Test if Authorization header is being sent.
 * Run in browser console: window.testAuthHeader()
 */
export async function testAuthHeader() {
  console.group('🧪 Testing Authorization Header');
  
  const token = auth.getToken();
  console.log('Token in localStorage:', token ? '✅ Found' : '❌ Missing');
  
  if (!token) {
    console.error('❌ No token found! Cannot test header.');
    console.log('Action: User needs to authenticate via Strava OAuth');
    console.groupEnd();
    return;
  }
  
  console.log('Token length:', token.length);
  console.log('Token preview:', token.substring(0, 50) + '...');
  
  // Check if token is expired
  if (auth.isTokenExpired()) {
    console.error('❌ Token is EXPIRED!');
    console.log('Action: User needs to reconnect Strava');
    console.groupEnd();
    return;
  }
  
  console.log('✅ Token is valid');
  
  // Test with debug endpoint (if available)
  try {
    console.log('\n📡 Testing with debug endpoint...');
    const response = await api.get('/debug/headers');
    console.log('Response:', response);
    
    if (response && typeof response === 'object') {
      const debugData = response as { authorization_header?: string; authorization_value?: string; all_headers?: Record<string, string> };
      
      if (debugData.authorization_header === 'MISSING' || !debugData.authorization_header) {
        console.error('❌ Authorization header is NOT being sent!');
        console.error('Fix: Check axios interceptor configuration');
      } else {
        console.log('✅ Authorization header is being sent');
        console.log('Header value preview:', debugData.authorization_value?.substring(0, 30) + '...');
      }
      
      if (debugData.all_headers) {
        console.log('All headers received:', debugData.all_headers);
      }
    }
  } catch (error) {
    console.warn('Debug endpoint not available, testing with profile endpoint...');
    
    // Fallback: test with actual endpoint
    try {
      const profileResponse = await api.get('/me/profile');
      console.log('✅ Profile request succeeded - header is being sent!');
      console.log('Profile data:', profileResponse);
    } catch (profileError) {
      const apiError = profileError as { status?: number; response?: { status?: number } };
      const status = apiError.status || apiError.response?.status;
      
      if (status === 401) {
        console.error('❌ Got 401 Unauthorized - header might not be sent correctly');
        console.error('Error:', profileError);
      } else {
        console.error('❌ Request failed:', profileError);
      }
    }
  }
  
  console.groupEnd();
}

/**
 * Test raw fetch with Authorization header.
 * Run in browser console: window.testRawFetch()
 */
export async function testRawFetch() {
  console.group('🧪 Testing Raw Fetch with Authorization Header');
  
  const token = auth.getToken();
  if (!token) {
    console.error('❌ No token found!');
    console.groupEnd();
    return;
  }
  
  const baseURL = typeof window !== 'undefined' 
    ? (import.meta.env.VITE_API_URL || window.location.origin)
    : 'http://localhost:8000';
  
  const testUrl = `${baseURL}/debug/headers`;
  
  console.log('Testing URL:', testUrl);
  console.log('Token:', token.substring(0, 30) + '...');
  
  try {
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (data.authorization_header === 'MISSING') {
      console.error('❌ Header is MISSING in raw fetch too!');
    } else {
      console.log('✅ Header is present in raw fetch');
    }
  } catch (error) {
    console.error('❌ Fetch failed:', error);
  }
  
  console.groupEnd();
}

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as { testAuthHeader?: () => Promise<void>; testRawFetch?: () => Promise<void> }).testAuthHeader = testAuthHeader;
  (window as { testAuthHeader?: () => Promise<void>; testRawFetch?: () => Promise<void> }).testRawFetch = testRawFetch;
}

