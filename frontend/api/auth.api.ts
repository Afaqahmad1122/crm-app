import { apiClient } from "./axios";
import type {
  AuthUser,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
} from "@/types/auth.types";

export const authApi = {
  login: async (payload: LoginPayload) => {
    const { data } = await apiClient.post<LoginResponse>(
      "/auth/login",
      payload,
    );
    return data;
  },
  register: async (payload: RegisterPayload) => {
    const { data } = await apiClient.post<RegisterResponse>(
      "/auth/register",
      payload,
    );
    return data;
  },
  logout: async () => {
    const { data } = await apiClient.post<{ ok: true }>("/auth/logout");
    return data;
  },
  me: async () => {
    const { data } = await apiClient.get<AuthUser>("/auth/me");
    return data;
  },
};
