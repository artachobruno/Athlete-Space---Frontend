/**
 * Native Google Sign-In using @capgo/capacitor-social-login
 *
 * This module handles Google authentication on iOS and Android using the native SDK,
 * which avoids the "disallowed_useragent" error that occurs with webview-based OAuth.
 *
 * Flow:
 * 1. Initialize SocialLogin with Google client IDs
 * 2. Call login() to trigger native Google Sign-In
 * 3. Send the returned idToken to backend for verification
 * 4. Backend sets HTTP-only auth cookie
 */

import { api } from "./api";
import { authApi } from "./api/typedClient";

// Google OAuth Client IDs - set these from environment or configuration
// These should be configured in your build process or environment variables
const GOOGLE_WEB_CLIENT_ID = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID || "";
const GOOGLE_IOS_CLIENT_ID = import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID || "";

// Types for SocialLogin plugin responses
interface GoogleLoginResult {
  provider: "google";
  result: {
    idToken: string | null;
    accessToken: {
      token: string;
    } | null;
    profile: {
      email: string | null;
      familyName: string | null;
      givenName: string | null;
      id: string | null;
      name: string | null;
      imageUrl: string | null;
    };
  };
}

interface SocialLoginPlugin {
  initialize(options: {
    google?: {
      webClientId: string;
      iOSClientId?: string;
      iOSServerClientId?: string;
      mode?: "online" | "offline";
    };
  }): Promise<void>;
  login(options: {
    provider: "google";
    options?: {
      scopes?: string[];
    };
  }): Promise<GoogleLoginResult>;
  logout(options: { provider: "google" }): Promise<void>;
  isLoggedIn(options: { provider: "google" }): Promise<{ isLoggedIn: boolean }>;
}

// Lazy-loaded SocialLogin plugin instance
let socialLoginPlugin: SocialLoginPlugin | null = null;
let initializePromise: Promise<void> | null = null;

/**
 * Dynamically imports the SocialLogin plugin.
 * This allows the module to be imported in web builds without errors.
 */
async function getSocialLoginPlugin(): Promise<SocialLoginPlugin> {
  if (socialLoginPlugin) {
    return socialLoginPlugin;
  }

  try {
    const module = await import("@capgo/capacitor-social-login");
    socialLoginPlugin = module.SocialLogin as SocialLoginPlugin;
    return socialLoginPlugin;
  } catch (error) {
    console.error("[GoogleAuthNative] Failed to import SocialLogin plugin:", error);
    throw new Error("Native Google Sign-In is not available on this platform");
  }
}

/**
 * Initializes the SocialLogin plugin with Google configuration.
 * Must be called before attempting login.
 */
export async function initializeGoogleAuth(): Promise<void> {
  // Avoid multiple simultaneous initializations
  if (initializePromise) {
    return initializePromise;
  }

  initializePromise = (async () => {
    try {
      const SocialLogin = await getSocialLoginPlugin();

      if (!GOOGLE_WEB_CLIENT_ID) {
        throw new Error(
          "VITE_GOOGLE_WEB_CLIENT_ID is not configured. " +
            "Please set this environment variable to your Google Web Client ID."
        );
      }

      console.log("[GoogleAuthNative] Initializing with config:", {
        webClientId: GOOGLE_WEB_CLIENT_ID.substring(0, 20) + "...",
        hasIosClientId: Boolean(GOOGLE_IOS_CLIENT_ID),
      });

      await SocialLogin.initialize({
        google: {
          webClientId: GOOGLE_WEB_CLIENT_ID,
          // iOS requires its own client ID for native SDK
          iOSClientId: GOOGLE_IOS_CLIENT_ID || undefined,
          // Server client ID is the web client ID - used for backend verification
          iOSServerClientId: GOOGLE_WEB_CLIENT_ID,
          mode: "online",
        },
      });

      console.log("[GoogleAuthNative] Initialization successful");
    } catch (error) {
      console.error("[GoogleAuthNative] Initialization failed:", error);
      initializePromise = null;
      throw error;
    }
  })();

  return initializePromise;
}

/**
 * Performs native Google Sign-In and authenticates with the backend.
 *
 * @returns Promise that resolves when authentication is complete
 * @throws Error if sign-in fails or backend authentication fails
 */
export async function loginWithGoogleNative(): Promise<void> {
  console.log("[GoogleAuthNative] Starting native Google Sign-In");

  // Ensure plugin is initialized
  await initializeGoogleAuth();

  const SocialLogin = await getSocialLoginPlugin();

  // Trigger native Google Sign-In
  const result = await SocialLogin.login({
    provider: "google",
    options: {
      scopes: ["email", "profile"],
    },
  });

  console.log("[GoogleAuthNative] Login result received:", {
    hasIdToken: Boolean(result.result.idToken),
    hasAccessToken: Boolean(result.result.accessToken),
    email: result.result.profile.email,
  });

  const idToken = result.result.idToken;
  const googleAccessToken = result.result.accessToken;

  if (!idToken) {
    throw new Error("Google Sign-In did not return an ID token");
  }

  // Send idToken to backend for verification and session creation
  console.log("[GoogleAuthNative] Sending idToken to backend for verification");

  try {
    const response = await authApi.googleMobile(idToken, googleAccessToken || "");
    const responseData = response.data || response;

    // Store token for mobile
    const { storeAccessToken } = await import('./tokenStorage');
    const backendAccessToken = (responseData as { access_token?: string }).access_token;
    const expiresIn = (responseData as { expires_in?: number }).expires_in || 2592000; // Default 30 days in seconds
    
    if (backendAccessToken) {
      await storeAccessToken(backendAccessToken, expiresIn);
      console.log("[GoogleAuthNative] ✅ Token stored securely for mobile");
    } else {
      console.warn("[GoogleAuthNative] ⚠️ Mobile Google login: No access_token in response");
    }

    console.log("[GoogleAuthNative] Backend authentication successful");
  } catch (error) {
    console.error("[GoogleAuthNative] Backend authentication failed:", error);
    throw error;
  }
}

/**
 * Logs out from Google (native SDK only).
 * Note: This only clears the native Google session, not the backend session.
 */
export async function logoutFromGoogleNative(): Promise<void> {
  try {
    const SocialLogin = await getSocialLoginPlugin();
    await SocialLogin.logout({ provider: "google" });
    console.log("[GoogleAuthNative] Logged out from Google");
  } catch (error) {
    // Ignore errors - user might not have been signed in via native
    console.warn("[GoogleAuthNative] Logout error (non-fatal):", error);
  }
}

/**
 * Checks if the user is currently signed in via Google native SDK.
 */
export async function isGoogleNativeLoggedIn(): Promise<boolean> {
  try {
    const SocialLogin = await getSocialLoginPlugin();
    const result = await SocialLogin.isLoggedIn({ provider: "google" });
    return result.isLoggedIn;
  } catch {
    return false;
  }
}
