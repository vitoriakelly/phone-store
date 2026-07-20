import {
  BadgeDollarSign,
  LayoutDashboard,
  PlusCircle,
  Smartphone,
  X,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

import './styles.scss';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      <div className="sidebar__header">
        <div className="sidebar__logo">
          <Smartphone size={24} />

          <div>
            <strong>Phone Store</strong>
            <span>Gerenciamento</span>
          </div>
        </div>

        <button
          type="button"
          className="sidebar__close"
          onClick={onClose}
          aria-label="Fechar menu"
        >
          <X size={24} />
        </button>
      </div>

      <nav className="sidebar__navigation">
        <NavLink
          to="/"
          end
          onClick={onClose}
          className={({ isActive }) =>
            `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
          }
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/dispositivos"
          onClick={onClose}
          className={({ isActive }) =>
            `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
          }
        >
          <Smartphone size={20} />
          <span>Dispositivos</span>
        </NavLink>

        <NavLink
          to="/dispositivos/cadastrar"
          onClick={onClose}
          className={({ isActive }) =>
            `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
          }
        >
          <PlusCircle size={20} />
          <span>Novo dispositivo</span>
        </NavLink>
        <NavLink
          to="/vendas"
          onClick={onClose}
          className={({ isActive }) =>
            `sidebar__link ${isActive
              ? 'sidebar__link--active'
              : ''
            }`
          }
        >
          <BadgeDollarSign size={20} />
          <span>Vendas</span>
        </NavLink>
      </nav>

      <footer className="sidebar__footer">
        <p>Controle de estoque</p>
        <span>Versão 1.0.0</span>
      </footer>
    </aside>
  );
}