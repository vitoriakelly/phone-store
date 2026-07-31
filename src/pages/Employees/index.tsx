import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Power,
  RefreshCcw,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  type FormEvent,
  useEffect,
  useState,
} from 'react';

import { ApiError } from '../../services/api';
import {
  createEmployee as createEmployeeRequest,
  listEmployees,
  resetEmployeePassword,
  updateEmployeeStatus,
} from '../../services/userApi';
import type {
  CreateEmployeeInput,
  Employee,
} from '../../types/user';

import './styles.scss';

const initialCreateForm: CreateEmployeeInput = {
  name: '',
  email: '',
  password: '',
};

function formatDate(value: string | null) {
  if (!value) {
    return 'Nunca acessou';
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      dateStyle: 'short',
      timeStyle: 'short',
    },
  ).format(new Date(value));
}

function sortEmployees(
  employees: Employee[],
) {
  return [...employees].sort((first, second) => {
    if (first.active !== second.active) {
      return first.active ? -1 : 1;
    }

    return first.name.localeCompare(
      second.name,
      'pt-BR',
    );
  });
}

export function Employees() {
  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [pageError, setPageError] =
    useState('');

  const [successMessage, setSuccessMessage] =
    useState('');

  const [createForm, setCreateForm] =
    useState<CreateEmployeeInput>(
      initialCreateForm,
    );

  const [createErrors, setCreateErrors] =
    useState<Record<string, string[]>>({});

  const [createFormError, setCreateFormError] =
    useState('');

  const [isCreating, setIsCreating] =
    useState(false);

  const [
    employeeBeingUpdated,
    setEmployeeBeingUpdated,
  ] = useState<string | null>(null);

  const [
    passwordEmployee,
    setPasswordEmployee,
  ] = useState<Employee | null>(null);

  const [newPassword, setNewPassword] =
    useState('');

  const [passwordError, setPasswordError] =
    useState('');

  const [isResettingPassword, setIsResettingPassword] =
    useState(false);

  async function loadEmployees() {
    setIsLoading(true);
    setPageError('');

    try {
      const employeeList =
        await listEmployees();

      setEmployees(
        sortEmployees(employeeList),
      );
    } catch (error) {
      if (error instanceof ApiError) {
        setPageError(error.message);
      } else {
        setPageError(
          'Não foi possível carregar os Colaboradores.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadEmployees();
  }, []);

  function updateCreateField(
    field: keyof CreateEmployeeInput,
    value: string,
  ) {
    setCreateForm((current) => ({
      ...current,
      [field]: value,
    }));

    setCreateErrors((current) => {
      const updatedErrors = {
        ...current,
      };

      delete updatedErrors[field];

      return updatedErrors;
    });

    setCreateFormError('');
    setSuccessMessage('');
  }

  async function handleCreateEmployee(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setCreateErrors({});
    setCreateFormError('');
    setSuccessMessage('');

    if (!createForm.name.trim()) {
      setCreateErrors({
        name: [
          'Informe o nome do Colaborador.',
        ],
      });

      return;
    }

    if (!createForm.email.trim()) {
      setCreateErrors({
        email: [
          'Informe o e-mail do Colaborador.',
        ],
      });

      return;
    }

    if (createForm.password.length < 8) {
      setCreateErrors({
        password: [
          'A senha deve possuir pelo menos 8 caracteres.',
        ],
      });

      return;
    }

    setIsCreating(true);

    try {
      const employee =
        await createEmployeeRequest({
          name: createForm.name.trim(),
          email: createForm.email
            .trim()
            .toLowerCase(),
          password: createForm.password,
        });

      setEmployees((current) =>
        sortEmployees([
          ...current,
          employee,
        ]),
      );

      setCreateForm(initialCreateForm);

      setSuccessMessage(
        `Funcionário ${employee.name} cadastrado com sucesso.`,
      );
    } catch (error) {
      if (error instanceof ApiError) {
        setCreateErrors(
          error.errors ?? {},
        );

        setCreateFormError(
          error.message,
        );
      } else {
        setCreateFormError(
          'Não foi possível cadastrar o Colaborador.',
        );
      }
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggleStatus(
    employee: Employee,
  ) {
    const newStatus = !employee.active;

    const confirmationMessage =
      newStatus
        ? `Deseja ativar o Colaborador ${employee.name}?`
        : `Deseja desativar o Colaborador ${employee.name}?`;

    const confirmed =
      window.confirm(
        confirmationMessage,
      );

    if (!confirmed) {
      return;
    }

    setEmployeeBeingUpdated(employee.id);
    setPageError('');
    setSuccessMessage('');

    try {
      const updatedEmployee =
        await updateEmployeeStatus(
          employee.id,
          {
            active: newStatus,
          },
        );

      setEmployees((current) =>
        sortEmployees(
          current.map((item) =>
            item.id === updatedEmployee.id
              ? updatedEmployee
              : item,
          ),
        ),
      );

      setSuccessMessage(
        newStatus
          ? 'Funcionário ativado com sucesso.'
          : 'Funcionário desativado com sucesso.',
      );
    } catch (error) {
      if (error instanceof ApiError) {
        setPageError(error.message);
      } else {
        setPageError(
          'Não foi possível alterar o status do Colaborador.',
        );
      }
    } finally {
      setEmployeeBeingUpdated(null);
    }
  }

  function openPasswordReset(
    employee: Employee,
  ) {
    setPasswordEmployee(employee);
    setNewPassword('');
    setPasswordError('');
    setSuccessMessage('');
  }

  function closePasswordReset() {
    if (isResettingPassword) {
      return;
    }

    setPasswordEmployee(null);
    setNewPassword('');
    setPasswordError('');
  }

  async function handleResetPassword(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!passwordEmployee) {
      return;
    }

    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError(
        'A nova senha deve possuir pelo menos 8 caracteres.',
      );

      return;
    }

    setIsResettingPassword(true);

    try {
      await resetEmployeePassword(
        passwordEmployee.id,
        {
          password: newPassword,
        },
      );

      setSuccessMessage(
        `Senha de ${passwordEmployee.name} redefinida com sucesso.`,
      );

      closePasswordReset();
    } catch (error) {
      if (error instanceof ApiError) {
        setPasswordError(
          error.errors?.password?.[0] ??
            error.message,
        );
      } else {
        setPasswordError(
          'Não foi possível redefinir a senha.',
        );
      }
    } finally {
      setIsResettingPassword(false);
    }
  }

  const activeEmployees =
    employees.filter(
      (employee) => employee.active,
    ).length;

  return (
    <main className="employees-page">
      <header className="employees-page__header">
        <div>
          <span className="employees-page__eyebrow">
            Administração
          </span>

          <h1>Colaboradores</h1>

          <p>
            Cadastre e gerencie os acessos dos
            Colaboradores da loja.
          </p>
        </div>

        <button
          type="button"
          className="employees-page__refresh"
          onClick={() => {
            void loadEmployees();
          }}
          disabled={isLoading}
        >
          <RefreshCcw size={18} />

          Atualizar
        </button>
      </header>

      {successMessage && (
        <div
          className="employees-page__message employees-page__message--success"
          role="status"
        >
          <CheckCircle2 size={19} />

          <span>{successMessage}</span>

          <button
            type="button"
            onClick={() =>
              setSuccessMessage('')
            }
            aria-label="Fechar mensagem"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {pageError && (
        <div
          className="employees-page__message employees-page__message--error"
          role="alert"
        >
          <AlertCircle size={19} />

          <span>{pageError}</span>

          <button
            type="button"
            onClick={() =>
              setPageError('')
            }
            aria-label="Fechar mensagem"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <section className="employees-page__summary">
        <article>
          <div>
            <span>Total de Colaboradores</span>
            <strong>{employees.length}</strong>
          </div>

          <Users size={26} />
        </article>

        <article>
          <div>
            <span>Colaboradores ativos</span>
            <strong>{activeEmployees}</strong>
          </div>

          <CheckCircle2 size={26} />
        </article>

        <article>
          <div>
            <span>Colaboradores inativos</span>
            <strong>
              {employees.length -
                activeEmployees}
            </strong>
          </div>

          <Power size={26} />
        </article>
      </section>

      <section className="employees-page__content">
        <article className="employees-page__create-card">
          <div className="employees-page__section-heading">
            <div className="employees-page__section-icon">
              <UserPlus size={22} />
            </div>

            <div>
              <h2>Novo Colaborador</h2>

              <p>
                O novo usuário será cadastrado com
                perfil Colaborador.
              </p>
            </div>
          </div>

          {createFormError && (
            <div className="employees-page__form-error">
              {createFormError}
            </div>
          )}

          <form
            className="employees-page__form"
            onSubmit={handleCreateEmployee}
          >
            <label>
              <span>Nome completo</span>

              <input
                type="text"
                value={createForm.name}
                placeholder="Nome do Colaborador"
                disabled={isCreating}
                onChange={(event) =>
                  updateCreateField(
                    'name',
                    event.target.value,
                  )
                }
              />

              {createErrors.name?.[0] && (
                <small>
                  {createErrors.name[0]}
                </small>
              )}
            </label>

            <label>
              <span>E-mail</span>

              <input
                type="email"
                value={createForm.email}
                placeholder="colaborador@exemplo.com"
                autoComplete="email"
                disabled={isCreating}
                onChange={(event) =>
                  updateCreateField(
                    'email',
                    event.target.value,
                  )
                }
              />

              {createErrors.email?.[0] && (
                <small>
                  {createErrors.email[0]}
                </small>
              )}
            </label>

            <label>
              <span>Senha inicial</span>

              <input
                type="password"
                value={createForm.password}
                placeholder="Mínimo de 8 caracteres"
                autoComplete="new-password"
                disabled={isCreating}
                onChange={(event) =>
                  updateCreateField(
                    'password',
                    event.target.value,
                  )
                }
              />

              {createErrors.password?.[0] && (
                <small>
                  {createErrors.password[0]}
                </small>
              )}
            </label>

            <button
              type="submit"
              disabled={isCreating}
            >
              <UserPlus size={18} />

              {isCreating
                ? 'Cadastrando...'
                : 'Cadastrar Colaborador'}
            </button>
          </form>
        </article>

        <article className="employees-page__list-card">
          <div className="employees-page__section-heading">
            <div className="employees-page__section-icon">
              <Users size={22} />
            </div>

            <div>
              <h2>Colaboradores cadastrados</h2>

              <p>
                Gerencie status e senhas de acesso.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="employees-page__state">
              Carregando Colaboradores...
            </div>
          ) : employees.length === 0 ? (
            <div className="employees-page__state">
              Nenhum Colaborador cadastrado.
            </div>
          ) : (
            <div className="employees-page__table-wrapper">
              <table className="employees-page__table">
                <thead>
                  <tr>
                    <th>Colaborador</th>
                    <th>Status</th>
                    <th>Último acesso</th>
                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {employees.map(
                    (employee) => {
                      const isUpdating =
                        employeeBeingUpdated ===
                        employee.id;

                      return (
                        <tr key={employee.id}>
                          <td>
                            <strong>
                              {employee.name}
                            </strong>

                            <span>
                              {employee.email}
                            </span>
                          </td>

                          <td>
                            <span
                              className={
                                employee.active
                                  ? 'employees-page__status employees-page__status--active'
                                  : 'employees-page__status employees-page__status--inactive'
                              }
                            >
                              {employee.active
                                ? 'Ativo'
                                : 'Inativo'}
                            </span>
                          </td>

                          <td>
                            {formatDate(
                              employee.lastLoginAt,
                            )}
                          </td>

                          <td>
                            <div className="employees-page__actions">
                              <button
                                type="button"
                                className="employees-page__action employees-page__action--password"
                                onClick={() =>
                                  openPasswordReset(
                                    employee,
                                  )
                                }
                              >
                                <KeyRound size={16} />

                                Senha
                              </button>

                              <button
                                type="button"
                                className={
                                  employee.active
                                    ? 'employees-page__action employees-page__action--deactivate'
                                    : 'employees-page__action employees-page__action--activate'
                                }
                                disabled={isUpdating}
                                onClick={() => {
                                  void handleToggleStatus(
                                    employee,
                                  );
                                }}
                              >
                                <Power size={16} />

                                {isUpdating
                                  ? 'Salvando...'
                                  : employee.active
                                    ? 'Desativar'
                                    : 'Ativar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>

      {passwordEmployee && (
        <div
          className="employees-page__modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closePasswordReset();
            }
          }}
        >
          <section
            className="employees-page__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-password-title"
          >
            <header>
              <div>
                <KeyRound size={22} />

                <div>
                  <h2 id="reset-password-title">
                    Redefinir senha
                  </h2>

                  <p>
                    {passwordEmployee.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closePasswordReset}
                disabled={isResettingPassword}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </header>

            <form
              onSubmit={handleResetPassword}
            >
              <label>
                <span>Nova senha</span>

                <input
                  type="password"
                  value={newPassword}
                  placeholder="Mínimo de 8 caracteres"
                  autoComplete="new-password"
                  autoFocus
                  disabled={isResettingPassword}
                  onChange={(event) => {
                    setNewPassword(
                      event.target.value,
                    );

                    setPasswordError('');
                  }}
                />
              </label>

              {passwordError && (
                <div className="employees-page__form-error">
                  {passwordError}
                </div>
              )}

              <footer>
                <button
                  type="button"
                  className="employees-page__modal-cancel"
                  onClick={closePasswordReset}
                  disabled={isResettingPassword}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="employees-page__modal-confirm"
                  disabled={isResettingPassword}
                >
                  <KeyRound size={17} />

                  {isResettingPassword
                    ? 'Salvando...'
                    : 'Redefinir senha'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}