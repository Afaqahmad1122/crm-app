import { apiClient } from "./axios";
import type { Note, NotePayload } from "../types/note.types";

export const notesApi = {
  listByCustomer: async (customerId: string) => {
    const { data } = await apiClient.get<Note[]>(`/customers/${customerId}/notes`);
    return data;
  },
  create: async (payload: NotePayload) => {
    const { data } = await apiClient.post<Note>("/notes", payload);
    return data;
  },
};

