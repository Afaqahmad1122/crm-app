import axios, { isAxiosError } from "axios";
import { ApiError } from "@/lib/api/errors";
import { apiRequest, setAccessToken, clearAuthToken } from "@/lib/api/client";
import type {
  AuthUser,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
} from "@/types/auth.types";

/**
 * Auth endpoints go to dedicated Next.js route handlers (/api/auth/*)
 * instead of the generic proxy. Those handlers re-set the cookies via
 * NextResponse.cookies.set() with SameSite=lax so all browsers accept them.
 */

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function unwrap<T>(data: unknown): T {
  if (isRecord(data) && data.success === true && "data" in data) {
    return (data as { success: true; data: T }).data;
  }
  return data as T;
}

async function authPost<T>(path: string, body?: unknown): Promise<T> {
  try {
    const res = await axios.post(path, body, {
      withCredentials: true,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
    });
    return unwrap<T>(res.data);
  } catch (err: unknown) {
    if (isAxiosError(err)) {
      throw ApiError.fromResponse(
        err.response?.status ?? 0,
        err.response?.data,
      );
    }
    throw err;
  }
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const result = await authPost<LoginResponse>("/api/auth/login", payload);
    setAccessToken(result.accessToken);
    return result;
  },

  register: async (payload: RegisterPayload): Promise<RegisterResponse> => {
    const result = await authPost<RegisterResponse>(
      "/api/auth/register",
      payload,
    );
    setAccessToken(result.accessToken);
    return result;
  },

  logout: async (): Promise<{ ok: true }> => {
    const result = await authPost<{ ok: true }>("/api/auth/logout");
    clearAuthToken();
    return result;
  },

  refresh: () => authPost<{ accessToken: string }>("/api/auth/refresh"),

  me: () => apiRequest<AuthUser>("GET", "/auth/me"),
};
