export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

/** Through `/api/proxy`, `token` is never sent to the browser (httpOnly cookie only). */
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

