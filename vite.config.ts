import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Stub Capacitor modules for web builds where they're not installed
      "@capacitor/core": path.resolve(__dirname, "./src/lib/capacitor-stubs/core.ts"),
      "@capacitor/browser": path.resolve(__dirname, "./src/lib/capacitor-stubs/browser.ts"),
      "@capacitor/app": path.resolve(__dirname, "./src/lib/capacitor-stubs/app.ts"),
      "@capacitor/preferences": path.resolve(__dirname, "./src/lib/capacitor-stubs/preferences.ts"),
      "@capacitor/haptics": path.resolve(__dirname, "./src/lib/capacitor-stubs/haptics.ts"),
    },
  },
}));
