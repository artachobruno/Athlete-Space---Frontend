import { Capacitor } from "@capacitor/core";

// Platform detection - uses Capacitor stub in web builds, real Capacitor in native
export const isNative = Capacitor.isNativePlatform();
