import { apiGet, apiRequest } from "@/lib/api/client";
import { asArray } from "@/lib/api/normalize";
import type {
  Assignment,
  AssignmentPayload,
} from "../types/assignment.types";

export const assignmentsApi = {
  listByUser: async (userId: string) => {
    const response = await apiGet<unknown>(`/assignments/user/${userId}`);
    return asArray<Assignment>(response);
  },
  create: async (payload: AssignmentPayload) => {
    return apiRequest<Assignment>("POST", "/assignments", { body: payload });
  },
  remove: async (payload: AssignmentPayload) => {
    return apiRequest<{ message: string }>("DELETE", "/assignments", {
      body: payload,
    });
  },
};

