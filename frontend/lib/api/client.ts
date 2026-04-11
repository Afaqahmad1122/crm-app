import { getApiBaseUrl } from "./config";
import axios, { isAxiosError } from "axios";
import { ApiError } from "./errors";
import type { ApiSuccessEnvelope } from "./types";

let refreshInFlight: Promise<boolean> | null = null;

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

function unwrapEnvelope<T>(payload: unknown): T {
  if (isRecord(payload) && payload.success === true && "data" in payload) {
    return (payload as ApiSuccessEnvelope<T>).data;
  }
  return payload as T;
}

export function clearAuthToken(): void {
  // Auth state is cookie-based (httpOnly cookies set by backend).
  // Keep this function as a compatibility no-op for existing callers.
}

function shouldAttemptRefreshOn401(path: string): boolean {
  return (
    path !== "/auth/login" &&
    path !== "/auth/register" &&
    path !== "/auth/refresh" &&
    path !== "/auth/logout"
  );
}

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const url = joinUrl(getApiBaseUrl(), "/auth/refresh");
      const res = await axios.request({
        url,
        method: "POST",
        headers: { Accept: "application/json" },
        withCredentials: true,
        responseType: "json",
      });
      const data = unwrapEnvelope<{ accessToken?: string }>(res.data);
      if (data?.accessToken) {
        return true;
      }
      return false;
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

      if (
        status === 401 &&
        !isRetry &&
        shouldAttemptRefreshOn401(path)
      ) {
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
