export type UserRole =
  | 'MASTER'
  | 'FUNCIONARIO';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;

  data: {
    user: AuthUser;
  };
}

export interface CurrentUserResponse {
  data: {
    user: AuthUser;
  };
}

export interface LogoutResponse {
  message: string;
}