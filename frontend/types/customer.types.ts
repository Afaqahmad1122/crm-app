export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  status: "lead" | "active" | "inactive";
}

export interface CustomerPayload {
  fullName: string;
  email: string;
  phone?: string;
}

