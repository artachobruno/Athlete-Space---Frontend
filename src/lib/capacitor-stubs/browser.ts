// Stub for @capacitor/browser - used in web builds where Capacitor is not installed
export const Browser = {
  open: async (_options: { url: string; presentationStyle?: string }) => {
    throw new Error('Browser plugin not available in web builds');
  },
  close: async () => {
    throw new Error('Browser plugin not available in web builds');
  },
};
