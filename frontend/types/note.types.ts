export interface Note {
  id: string;
  customerId: string;
  content: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface NotePayload {
  customerId: string;
  content: string;
}

