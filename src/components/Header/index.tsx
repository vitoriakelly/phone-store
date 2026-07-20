import { Menu, UserRound } from 'lucide-react';

import './styles.scss';

interface HeaderProps {
  onOpenMenu: () => void;
}

export function Header({ onOpenMenu }: HeaderProps) {
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
        <strong>Gestão de dispositivos</strong>
        <span>Controle os aparelhos da sua loja</span>
      </div>

      <div className="header__profile">
        <div className="header__profile-icon">
          <UserRound size={20} />
        </div>

        <div className="header__profile-info">
          <strong>Vitória Kelly</strong>
          <span>Administradora</span>
        </div>
      </div>
    </header>
  );
}