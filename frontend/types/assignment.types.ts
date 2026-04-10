export interface Assignment {
  id: string;
  customerId: string;
  userId: string;
  assignedAt: string;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    status: "ACTIVE" | "INACTIVE";
  };
  user?: {
    id: string;
    name: string;
    email: string;
    role?: "ADMIN" | "MEMBER";
  };
}

export interface AssignmentPayload {
  customerId: string;
  userId: string;
}

