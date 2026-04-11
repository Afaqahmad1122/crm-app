/**
 * Resolves the backend base URL for server-side auth API calls.
 * Priority: API_PROXY_TARGET_URL > BACKEND_API_URL > hard-coded Render URL.
 */
export function getBackendBaseUrl(): string {
  const url =
    process.env.API_PROXY_TARGET_URL ??
    process.env.BACKEND_API_URL ??
    (process.env.NODE_ENV === "production"
      ? "https://crm-app-z2zk.onrender.com/api"
      : "http://localhost:3001/api");
  return url.replace(/\/$/, "");
}

export type ParsedCookie = {
  name: string;
  value: string;
  httpOnly: boolean;
  path: string;
  maxAge?: number;
};

/**
 * Parses a single Set-Cookie header string into its name/value and attributes.
 */
export function parseSetCookieHeader(header: string): ParsedCookie | null {
  const parts = header.split(";").map((p) => p.trim());
  const nameValue = parts[0];
  if (!nameValue) return null;
  const eqIdx = nameValue.indexOf("=");
  if (eqIdx === -1) return null;

  const name = nameValue.slice(0, eqIdx).trim();
  const value = nameValue.slice(eqIdx + 1);

  let httpOnly = false;
  let path = "/";
  let maxAge: number | undefined;

  for (const part of parts.slice(1)) {
    const lower = part.toLowerCase();
    if (lower === "httponly") {
      httpOnly = true;
    } else if (lower.startsWith("path=")) {
      path = part.slice(5).trim() || "/";
    } else if (lower.startsWith("max-age=")) {
      const n = parseInt(lower.slice(8), 10);
      if (!isNaN(n)) maxAge = n;
    }
  }

  return { name, value, httpOnly, path, maxAge };
}

/**
 * Extracts all Set-Cookie headers from a fetch Response.
 */
export function getSetCookieHeaders(headers: Headers): string[] {
  if (typeof (headers as { getSetCookie?: () => string[] }).getSetCookie === "function") {
    return (headers as { getSetCookie: () => string[] }).getSetCookie();
  }
  const single = headers.get("set-cookie");
  return single ? [single] : [];
}
