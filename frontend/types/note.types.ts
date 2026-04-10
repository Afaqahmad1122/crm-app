export interface Note {
  id: string;
  customerId: string;
  message: string;
  createdAt: string;
}

export interface NotePayload {
  customerId: string;
  message: string;
}

