import { getApiBaseUrl } from "./config";
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
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init?.headers ?? {}),
  };

  let body: string | undefined;
  if (
    init?.body !== undefined &&
    init.body !== null &&
    method !== "GET" &&
    method !== "HEAD"
  ) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.body);
  }

  const res = await fetch(url, {
    method,
    headers,
    body,
    signal: init?.signal,
    credentials: "include",
  });

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload: unknown = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    throw ApiError.fromResponse(res.status, payload);
  }

  if (
    isJson &&
    isRecord(payload) &&
    payload.success === true &&
    "data" in payload
  ) {
    return (payload as ApiSuccessEnvelope<T>).data;
  }

  return payload as T;
}

export function apiGet<T>(path: string, init?: ApiRequestInit): Promise<T> {
  return apiRequest<T>("GET", path, init);
}
