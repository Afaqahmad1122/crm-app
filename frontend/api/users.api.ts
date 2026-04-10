import { apiGet } from "@/lib/api/client";
import { asArray } from "@/lib/api/normalize";
import type { User } from "../types/user.types";

export const usersApi = {
  list: async () => {
    const response = await apiGet<unknown>("/users");
    return asArray<User>(response);
  },
};

