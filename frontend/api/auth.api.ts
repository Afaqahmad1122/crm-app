import { apiRequest } from "@/lib/api/client";
import type {
  AuthUser,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
} from "@/types/auth.types";

export const authApi = {
  login: async (payload: LoginPayload) => {
    return apiRequest<LoginResponse>("POST", "/auth/login", { body: payload });
  },
  register: async (payload: RegisterPayload) => {
    return apiRequest<RegisterResponse>("POST", "/auth/register", {
      body: payload,
    });
  },
  logout: async () => {
    return apiRequest<{ ok: true }>("POST", "/auth/logout");
  },
  me: async () => {
    return apiRequest<AuthUser>("GET", "/auth/me");
  },
};
