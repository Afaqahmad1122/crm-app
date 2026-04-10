import { getStoredAuthToken } from "@/lib/auth/token-storage";
import { getApiBaseUrl } from "./config";
import axios, { isAxiosError } from "axios";
import { ApiError } from "./errors";
import type { ApiSuccessEnvelope } from "./types";

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

/**
 * Single place for JSON fetch + Nest success wrapper `{ success, data }` + errors.
 */
export async function apiRequest<T>(
  method: string,
  path: string,
  init?: ApiRequestInit,
): Promise<T> {
  const url = joinUrl(getApiBaseUrl(), path);
  const bearer =
    typeof window !== "undefined" ? getStoredAuthToken() : null;
  const headers: Record<string, string | undefined> = {
    Accept: "application/json",
    ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
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
      throw ApiError.fromResponse(status, payload);
    }
    throw error;
  }
}

export function apiGet<T>(path: string, init?: ApiRequestInit): Promise<T> {
  return apiRequest<T>("GET", path, init);
}
