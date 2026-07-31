import type {
  AuthUser,
  CurrentUserResponse,
  LoginInput,
  LoginResponse,
  LogoutResponse,
} from '../types/auth';

import { apiRequest } from './api';

let currentUserRequest:
  Promise<AuthUser> | null = null;

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

  currentUserRequest = null;

  return response.data.user;
}

export function getCurrentUser(): Promise<AuthUser> {
  if (currentUserRequest) {
    return currentUserRequest;
  }

  currentUserRequest =
    apiRequest<CurrentUserResponse>(
      '/auth/me',
    )
      .then(
        (response) =>
          response.data.user,
      )
      .finally(() => {
        currentUserRequest = null;
      });

  return currentUserRequest;
}

export async function logout(): Promise<void> {
  currentUserRequest = null;

  await apiRequest<LogoutResponse>(
    '/auth/logout',
    {
      method: 'POST',
    },
  );
}