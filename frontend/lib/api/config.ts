/**
 * Public base URL for the Nest API (includes `/api` prefix).
 * Set `NEXT_PUBLIC_API_URL` in `.env.local` if the backend is not on the default host.
 */
export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
  return url.replace(/\/$/, "");
}
