import {
  BadgeDollarSign,
  FileBarChart2,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Smartphone,
  Users,
  X,
} from 'lucide-react';
import {
  NavLink,
  useNavigate,
} from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../services/api';

import './styles.scss';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  isOpen,
  onClose,
}: SidebarProps) {
  const navigate = useNavigate();

  const {
    isMaster,
    logout,
    isLoggingOut,
  } = useAuth();

  async function handleLogout() {
    try {
      /*
       * O backend invalida o token
       * antes de o usuário ser removido
       * do AuthContext.
       */
      await logout();

      onClose();

      navigate('/login', {
        replace: true,
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Não foi possível encerrar a sessão. Tente novamente.';

      window.alert(message);
    }
  }

  return (
    <aside
      className={`sidebar ${
        isOpen ? 'sidebar--open' : ''
      }`}
    >
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
            `sidebar__link ${
              isActive
                ? 'sidebar__link--active'
                : ''
            }`
          }
        >
          <LayoutDashboard size={20} />

          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/dispositivos"
          end
          onClick={onClose}
          className={({ isActive }) =>
            `sidebar__link ${
              isActive
                ? 'sidebar__link--active'
                : ''
            }`
          }
        >
          <Smartphone size={20} />

          <span>Dispositivos</span>
        </NavLink>

        <NavLink
          to="/dispositivos/cadastrar"
          end
          onClick={onClose}
          className={({ isActive }) =>
            `sidebar__link ${
              isActive
                ? 'sidebar__link--active'
                : ''
            }`
          }
        >
          <PlusCircle size={20} />

          <span>Novo dispositivo</span>
        </NavLink>

        <NavLink
          to="/vendas"
          onClick={onClose}
          className={({ isActive }) =>
            `sidebar__link ${
              isActive
                ? 'sidebar__link--active'
                : ''
            }`
          }
        >
          <BadgeDollarSign size={20} />

          <span>Vendas</span>
        </NavLink>

        {isMaster && (
          <>
            <NavLink
              to="/relatorios"
              onClick={onClose}
              className={({
                isActive,
              }) =>
                `sidebar__link ${
                  isActive
                    ? 'sidebar__link--active'
                    : ''
                }`
              }
            >
              <FileBarChart2
                size={20}
              />

              <span>Relatórios</span>
            </NavLink>

            <NavLink
              to="/funcionarios"
              onClick={onClose}
              className={({
                isActive,
              }) =>
                `sidebar__link ${
                  isActive
                    ? 'sidebar__link--active'
                    : ''
                }`
              }
            >
              <Users size={20} />

              <span>Colaboradores</span>
            </NavLink>
          </>
        )}

        <div className="sidebar__logout-container">
          <button
            type="button"
            className="sidebar__logout"
            onClick={() =>
              void handleLogout()
            }
            disabled={isLoggingOut}
          >
            <LogOut size={20} />

            <span>
              {isLoggingOut
                ? 'Saindo...'
                : 'Sair'}
            </span>
          </button>
        </div>
      </nav>

      <footer className="sidebar__footer">
        <p>Controle de estoque</p>
        <span>Versão 1.0.0</span>
      </footer>
    </aside>
  );
}