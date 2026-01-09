// Stub for @capacitor/app - used in web builds where Capacitor is not installed
export const App = {
  addListener: (_eventName: string, _callback: (data: { url: string }) => void) => {
    return Promise.resolve({
      remove: () => Promise.resolve(),
    });
  },
};
