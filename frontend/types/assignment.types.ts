export interface Assignment {
  id: string;
  customerId: string;
  assigneeId: string;
  dueDate?: string;
}

export interface AssignmentPayload {
  customerId: string;
  assigneeId: string;
  dueDate?: string;
}

