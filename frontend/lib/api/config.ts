/**
 * API base URL used by the browser.
 *
 * - Local (direct Nest): `http://localhost:3001/api`
 * - Production (JWT only in httpOnly cookie, no token in JSON): same-origin proxy
 *   `NEXT_PUBLIC_API_URL=/api/proxy` and server `BACKEND_URL=https://your-api.onrender.com`
 */
export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
  return url.replace(/\/$/, "");
}
