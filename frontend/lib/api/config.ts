/**
 * API base URL used by the browser.
 *
 * - Local (direct Nest): `http://localhost:3001/api`
 * - Production (JWT only in httpOnly cookie, no token in JSON): same-origin proxy
 *   `NEXT_PUBLIC_API_URL=/api/proxy` and server `BACKEND_URL=https://your-api.onrender.com`
 */
export function getApiBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  const fallback =
    process.env.NODE_ENV === "production"
      ? "/api/proxy"
      : "http://localhost:3001/api";
  const url = configured ?? fallback;
  return url.replace(/\/$/, "");
}
