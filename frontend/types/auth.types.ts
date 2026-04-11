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
  user: AuthUser;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  organizationName: string;
}

export interface RegisterResponse {
  user: AuthUser;
  organization: {
    id: string;
    name: string;
  };
}

export interface RefreshResponse {
  ok: true;
}
