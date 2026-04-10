/** Browser storage for JWT when API is on another origin (Render); middleware uses httpOnly cookie on Vercel. */
export const AUTH_TOKEN_STORAGE_KEY = "crm_api_jwt";

export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setStoredAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearStoredAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}
