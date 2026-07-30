import {
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  Mail,
  Smartphone,
} from 'lucide-react';
import {
  type FormEvent,
  useState,
} from 'react';
import {
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../services/api';

import './styles.scss';

interface LoginLocationState {
  from?: string;
}

export function Login() {
  const {
    login,
    isAuthenticated,
    isLoading: isCheckingAuth,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const locationState =
    location.state as LoginLocationState | null;

  const redirectTo =
    locationState?.from ?? '/';

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [
    isPasswordVisible,
    setIsPasswordVisible,
  ] = useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [formError, setFormError] =
    useState('');

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setFormError('');

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      setFormError(
        'Informe o seu e-mail.',
      );

      return;
    }

    if (!password) {
      setFormError(
        'Informe a sua senha.',
      );

      return;
    }

    setIsSubmitting(true);

    try {
      await login({
        email: normalizedEmail,
        password,
      });

      navigate(redirectTo, {
        replace: true,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError(
          'Não foi possível acessar o sistema. Verifique se a API está funcionando.',
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingAuth) {
    return (
      <main className="login">
        <div className="login__loading">
          Verificando autenticação...
        </div>
      </main>
    );
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        replace
      />
    );
  }

  return (
    <main className="login">
      <aside className="login__brand-area">
        <div className="login__brand">
          <div className="login__brand-icon">
            <Smartphone size={27} />
          </div>

          <div>
            <strong>Phone Store</strong>
            <span>Gestão de dispositivos</span>
          </div>
        </div>

        <div className="login__brand-content">
          <h1>
            Sua loja organizada em um só lugar.
          </h1>

          <p>
            Controle dispositivos, vendas e acessos
            com simplicidade.
          </p>
        </div>

        <div className="login__decoration">
          <span />
          <span />
          <span />
        </div>
      </aside>

      <section className="login__form-area">
        <div className="login__card">
          <header className="login__card-header">
            <div className="login__card-icon">
              <LockKeyhole size={23} />
            </div>

            <div>
              <h2>Bem-vindo</h2>

              <p>
                Entre com suas credenciais.
              </p>
            </div>
          </header>

          {formError && (
            <div
              className="login__error"
              role="alert"
            >
              {formError}
            </div>
          )}

          <form
            className="login__form"
            onSubmit={handleSubmit}
          >
            <label className="login__field">
              <span>E-mail</span>

              <div className="login__input-wrapper">
                <Mail size={18} />

                <input
                  type="email"
                  value={email}
                  placeholder="seu-email@exemplo.com"
                  autoComplete="email"
                  autoFocus
                  disabled={isSubmitting}
                  onChange={(event) => {
                    setEmail(
                      event.target.value,
                    );

                    if (formError) {
                      setFormError('');
                    }
                  }}
                />
              </div>
            </label>

            <label className="login__field">
              <span>Senha</span>

              <div className="login__input-wrapper">
                <LockKeyhole size={18} />

                <input
                  type={
                    isPasswordVisible
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  onChange={(event) => {
                    setPassword(
                      event.target.value,
                    );

                    if (formError) {
                      setFormError('');
                    }
                  }}
                />

                <button
                  type="button"
                  className="login__password-button"
                  onClick={() =>
                    setIsPasswordVisible(
                      (current) => !current,
                    )
                  }
                  aria-label={
                    isPasswordVisible
                      ? 'Ocultar senha'
                      : 'Mostrar senha'
                  }
                >
                  {isPasswordVisible ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </label>

            <button
              type="submit"
              className="login__submit"
              disabled={isSubmitting}
            >
              <LogIn size={18} />

              {isSubmitting
                ? 'Entrando...'
                : 'Entrar'}
            </button>
          </form>

          <p className="login__security">
            Acesso exclusivo para usuários
            autorizados.
          </p>
        </div>
      </section>
    </main>
  );
}