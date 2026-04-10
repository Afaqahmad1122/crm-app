import { apiClient } from "./axios";
import type { LoginPayload, LoginResponse } from "../types/auth.types";

export const authApi = {
  login: async (payload: LoginPayload) => {
    const { data } = await apiClient.post<LoginResponse>("/auth/login", payload);
    return data;
  },
  logout: async () => {
    await apiClient.post("/auth/logout");
  },
  me: async () => {
    const { data } = await apiClient.get<LoginResponse["user"]>("/auth/me");
    return data;
  },
};

