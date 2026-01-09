// Stub for @capacitor/app - used in web builds where Capacitor is not installed
export const App = {
  addListener: () => {
    return Promise.resolve({
      remove: () => Promise.resolve(),
    });
  },
};
