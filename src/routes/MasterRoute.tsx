import {
  Navigate,
  Outlet,
} from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';

export function MasterRoute() {
  const {
    isAuthenticated,
    isLoading,
    isMaster,
  } = useAuth();

  if (isLoading) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p>Verificando permissões...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (!isMaster) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <Outlet />;
}