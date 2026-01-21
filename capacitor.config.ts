import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.athletespace.app',
  appName: 'AthleteSpace',
  webDir: 'dist',
  // Enable deep linking for OAuth callbacks
  plugins: {
    // App plugin handles URL scheme deep links
    App: {
      // Listen for athletespace:// URLs
    },
    // Native Google Sign-In configuration
    SocialLogin: {
      providers: {
        google: true,
      },
    },
  },
  // Server config for handling OAuth redirects
  server: {
    // Allow navigation to external OAuth providers
    allowNavigation: [
      'accounts.google.com',
      'www.strava.com',
      'athletespace.ai',
      'virtus-ai.onrender.com',
    ],
  },
  ios: {
    // URL scheme for deep linking (matches Info.plist CFBundleURLSchemes)
    scheme: 'athletespace',
  },
  android: {
    // URL scheme for deep linking
    appendUserAgent: 'AthleteSpace-App',
  },
};

export default config;
