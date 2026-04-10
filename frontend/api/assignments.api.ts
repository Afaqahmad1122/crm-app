import { apiClient } from "./axios";
import type {
  Assignment,
  AssignmentPayload,
} from "../types/assignment.types";

export const assignmentsApi = {
  list: async () => {
    const { data } = await apiClient.get<Assignment[]>("/assignments");
    return data;
  },
  create: async (payload: AssignmentPayload) => {
    const { data } = await apiClient.post<Assignment>("/assignments", payload);
    return data;
  },
};

