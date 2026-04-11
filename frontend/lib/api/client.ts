import { getApiBaseUrl } from "./config";
import axios, { isAxiosError } from "axios";
import { ApiError } from "./errors";
import type { ApiSuccessEnvelope } from "./types";

const AUTH_TOKEN_STORAGE_KEY = "crm_auth_token";
const AUTH_TOKEN_COOKIE_KEY = "crm_auth_token";

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

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function setAuthTokenCookie(token: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_TOKEN_COOKIE_KEY}=${encodeURIComponent(token)}; Path=/; SameSite=Lax`;
}

function clearAuthTokenCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_TOKEN_COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getAuthToken(): string | null {
  if (!canUseStorage()) return null;
  const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  return token && token.length > 0 ? token : null;
}

export function setAuthToken(token: string): void {
  if (canUseStorage()) {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  }
  setAuthTokenCookie(token);
}

export function clearAuthToken(): void {
  if (canUseStorage()) {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }
  clearAuthTokenCookie();
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
        setAuthToken(data.accessToken);
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
  const token = getAuthToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

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
