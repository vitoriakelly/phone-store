import type {
  AuthUser,
  CurrentUserResponse,
  LoginInput,
  LoginResponse,
  LogoutResponse,
} from '../types/auth';

import { apiRequest } from './api';

export async function login(
  input: LoginInput,
): Promise<AuthUser> {
  const response =
    await apiRequest<LoginResponse>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );

  return response.data.user;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response =
    await apiRequest<CurrentUserResponse>(
      '/auth/me',
    );

  return response.data.user;
}

export async function logout(): Promise<void> {
  await apiRequest<LogoutResponse>(
    '/auth/logout',
    {
      method: 'POST',
    },
  );
}