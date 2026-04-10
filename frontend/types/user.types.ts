export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  createdAt?: string;
  _count?: {
    assignments: number;
  };
}

