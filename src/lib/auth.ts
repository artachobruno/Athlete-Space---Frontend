const TOKEN_KEY = "auth_token";

export const auth = {
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => localStorage.removeItem(TOKEN_KEY),
  isLoggedIn: (): boolean => !!localStorage.getItem(TOKEN_KEY),
};

