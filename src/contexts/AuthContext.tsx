import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { ApiError } from '../services/api';
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
} from '../services/authApi';
import type {
  AuthUser,
  LoginInput,
} from '../types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isMaster: boolean;
  isLoading: boolean;
  login: (
    input: LoginInput,
  ) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext =
  createContext<AuthContextValue | null>(
    null,
  );

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const refreshUser =
    useCallback(async () => {
      try {
        const authenticatedUser =
          await getCurrentUser();

        setUser(authenticatedUser);
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.status === 401
        ) {
          setUser(null);
          return;
        }

        setUser(null);

        console.error(
          'Erro ao verificar usuário autenticado:',
          error,
        );
      }
    }, []);

  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      setIsLoading(true);

      try {
        const authenticatedUser =
          await getCurrentUser();

        if (isMounted) {
          setUser(authenticatedUser);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setUser(null);

        if (
          !(
            error instanceof ApiError &&
            error.status === 401
          )
        ) {
          console.error(
            'Erro ao inicializar autenticação:',
            error,
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(
    async (
      input: LoginInput,
    ): Promise<AuthUser> => {
      const authenticatedUser =
        await loginRequest(input);

      setUser(authenticatedUser);

      return authenticatedUser;
    },
    [],
  );

  const logout = useCallback(
    async () => {
      try {
        await logoutRequest();
      } finally {
        setUser(null);
      }
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,

      isAuthenticated:
        user !== null,

      isMaster:
        user?.role === 'MASTER',

      isLoading,

      login,
      logout,
      refreshUser,
    }),
    [
      user,
      isLoading,
      login,
      logout,
      refreshUser,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth deve ser utilizado dentro de AuthProvider.',
    );
  }

  return context;
}