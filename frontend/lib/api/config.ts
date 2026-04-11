/**
 * API base URL used by the browser.
 *
 * Default is same-origin proxy (`/api/proxy`) to avoid cross-site cookie issues.
 * You can override with NEXT_PUBLIC_API_URL / NEXT_PUBLIC_API_BASE_URL.
 */
export function getApiBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  const fallback = "/api/proxy";
  const url = (configured ?? fallback).replace(/\/$/, "");

  if (typeof window !== "undefined") {
    try {
      const resolved = new URL(url, window.location.origin);
      if (resolved.origin !== window.location.origin) {
        return fallback;
      }
    } catch {
      return fallback;
    }
  }

  return url;
}
