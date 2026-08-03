import {
  Menu,
  UserRound,
} from 'lucide-react';



import './styles.scss';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onOpenMenu: () => void;
}

function getRoleLabel(
  role: 'MASTER' | 'FUNCIONARIO',
) {
  return role === 'MASTER'
    ? 'Administrador'
    : 'Colaborador';
}

export function Header({
  onOpenMenu,
}: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="header">
      <button
        type="button"
        className="header__menu-button"
        onClick={onOpenMenu}
        aria-label="Abrir menu"
      >
        <Menu size={24} />
      </button>

      <div className="header__title">
        <strong>
          Phone Store
        </strong>

        <span>
          Painel de gestão da loja
        </span>
      </div>

      <div className="header__profile">
        <div className="header__profile-icon">
          <UserRound size={20} />
        </div>

        <div className="header__profile-info">
          <strong>
            {user?.name ??
              'Usuário'}
          </strong>

          <span>
            {user
              ? getRoleLabel(user.role)
              : 'Carregando...'}
          </span>
        </div>
      </div>
    </header>
  );
}