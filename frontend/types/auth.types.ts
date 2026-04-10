export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  organizationName: string;
}

export interface RegisterResponse {
  token: string;
  user: AuthUser;
  organization: {
    id: string;
    name: string;
  };
}

