import { apiClient } from "./axios";
import type { User } from "../types/user.types";

export const usersApi = {
  list: async () => {
    const { data } = await apiClient.get<User[]>("/users");
    return data;
  },
};

