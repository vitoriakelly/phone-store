import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  isLoggingOut: boolean;

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

  const [
    isLoggingOut,
    setIsLoggingOut,
  ] = useState(false);

  const logoutInProgressRef =
    useRef(false);

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
      /*
       * Impede dois cliques rápidos de
       * enviarem duas requisições.
       */
      if (
        logoutInProgressRef.current
      ) {
        return;
      }

      logoutInProgressRef.current =
        true;

      setIsLoggingOut(true);

      try {
        /*
         * O backend incrementa
         * tokenVersion e apaga o cookie.
         */
        await logoutRequest();

        setUser(null);
      } catch (error) {
        /*
         * Um 401 significa que o token
         * já estava expirado, inválido
         * ou foi encerrado anteriormente.
         */
        if (
          error instanceof ApiError &&
          error.status === 401
        ) {
          setUser(null);
          return;
        }

        /*
         * Em erros internos ou de rede,
         * não fingimos que o logout foi
         * concluído. A sidebar poderá
         * mostrar a mensagem do erro.
         */
        throw error;
      } finally {
        logoutInProgressRef.current =
          false;

        setIsLoggingOut(false);
      }
    },
    [],
  );

  const value =
    useMemo<AuthContextValue>(
      () => ({
        user,

        isAuthenticated:
          user !== null,

        isMaster:
          user?.role === 'MASTER',

        isLoading,
        isLoggingOut,

        login,
        logout,
        refreshUser,
      }),
      [
        user,
        isLoading,
        isLoggingOut,
        login,
        logout,
        refreshUser,
      ],
    );

  return (
    <AuthContext.Provider
      value={value}
    >
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