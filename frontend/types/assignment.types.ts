export interface Assignment {
  id: string;
  customerId: string;
  userId: string;
  assignedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AssignmentPayload {
  customerId: string;
  userId: string;
}

