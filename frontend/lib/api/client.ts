import { getApiBaseUrl } from "./config";
import axios, { isAxiosError } from "axios";
import { ApiError } from "./errors";
import type { ApiSuccessEnvelope } from "./types";

let refreshInFlight: Promise<boolean> | null = null;
const API_TIMEOUT_MS = 15_000;

export type ApiRequestInit = {
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

function joinUrl(base: string, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/$/, "")}${normalizedPath}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function clearAuthToken(): void {
  // Auth is cookie-only (httpOnly). Kept as a compatibility no-op.
}

function shouldAttemptRefreshOn401(path: string): boolean {
  const noRefreshPaths = [
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/logout",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/refresh",
    "/api/auth/logout",
  ];
  return !noRefreshPaths.includes(path);
}

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      // Use the dedicated Next.js auth route so the refreshed cookies are
      // re-set with SameSite=lax and the correct Vercel domain.
      await axios.request({
        url: "/api/auth/refresh",
        method: "POST",
        headers: { Accept: "application/json" },
        withCredentials: true,
        responseType: "json",
        timeout: API_TIMEOUT_MS,
      });
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/**
 * JSON fetch + Nest `{ success, data }` envelope + 401 refresh (single-flight) + errors.
 */
export async function apiRequest<T>(
  method: string,
  path: string,
  init?: ApiRequestInit,
  isRetry = false,
): Promise<T> {
  const url = joinUrl(getApiBaseUrl(), path);
  const headers: Record<string, string | undefined> = {
    Accept: "application/json",
    ...(init?.headers ?? {}),
  };

  let body: unknown;
  if (
    init?.body !== undefined &&
    init.body !== null &&
    method !== "GET" &&
    method !== "HEAD"
  ) {
    headers["Content-Type"] = "application/json";
    body = init.body;
  }

  try {
    const res = await axios.request({
      url,
      method,
      headers,
      data: body,
      signal: init?.signal,
      withCredentials: true,
      responseType: "json",
      timeout: API_TIMEOUT_MS,
    });
    const payload: unknown = res.data;

    if (isRecord(payload) && payload.success === true && "data" in payload) {
      return (payload as ApiSuccessEnvelope<T>).data;
    }

    return payload as T;
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      const status = error.response?.status ?? 0;
      const payload = error.response?.data;

      if (status === 401 && !isRetry && shouldAttemptRefreshOn401(path)) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          return apiRequest<T>(method, path, init, true);
        }
      }

      if (status === 401) {
        clearAuthToken();
      }

      throw ApiError.fromResponse(status, payload);
    }
    throw error;
  }
}

export function apiGet<T>(path: string, init?: ApiRequestInit): Promise<T> {
  return apiRequest<T>("GET", path, init);
}
