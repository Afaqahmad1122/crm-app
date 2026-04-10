import { apiGet, apiRequest } from "@/lib/api/client";
import { asArray } from "@/lib/api/normalize";
import type { Note, NotePayload } from "../types/note.types";

export const notesApi = {
  listByCustomer: async (customerId: string) => {
    const response = await apiGet<unknown>(`/notes/customer/${customerId}`);
    return asArray<Note>(response);
  },
  create: async (payload: NotePayload) => {
    return apiRequest<Note>("POST", "/notes", { body: payload });
  },
};

