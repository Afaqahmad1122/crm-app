/**
 * API base URL used by the browser.
 *
 * - Local (direct Nest): `http://localhost:3001/api`
 * - Production (direct backend): `https://your-backend.onrender.com/api`
 */
export function getApiBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  const fallback =
    process.env.NODE_ENV === "production"
      ? "https://crm-app-z2zk.onrender.com/api"
      : "http://localhost:3001/api";
  const url = configured ?? fallback;
  return url.replace(/\/$/, "");
}
