export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
  assignments?: Array<{
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

export interface CustomerPayload {
  name: string;
  email: string;
  phone?: string;
  status?: "ACTIVE" | "INACTIVE";
}

