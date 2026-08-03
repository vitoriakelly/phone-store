import {
  BadgeDollarSign,
  CalendarDays,
  Eye,
  FileDown,
  ListChecks,
  Plus,
  RotateCcw,
  Search,
  Smartphone,
  Trash2,
} from 'lucide-react';
import {
  useEffect,
  useState,
} from 'react';
import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { ApiError } from '../../services/api';
import {
  deleteDevice,
  listAllDevices,
  listDevicesPage,
  type DeviceListMeta,
} from '../../services/deviceApi';
import type {
  Device,
  DeviceCondition,
  DeviceStatus,
} from '../../types/device';
import { formatCurrency } from '../../utils/currency';
import {
  generateDevicesPdf,
} from '../../utils/generateDevicesPdf';

import './styles.scss';

type StatusFilter =
  | 'TODOS'
  | DeviceStatus;

type ConditionFilter =
  | 'TODOS'
  | DeviceCondition;

interface LocationState {
  successMessage?: string;
}

const initialMeta: DeviceListMeta = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

function getStatusLabel(
  status: DeviceStatus,
) {
  const labels: Record<
    DeviceStatus,
    string
  > = {
    PENDENTE_INFORMACOES:
      'Pendente de informações',
    DISPONIVEL: 'Disponível',
    RESERVADO: 'Reservado',
    VENDIDO: 'Vendido',
  };

  return labels[status];
}

function getConditionLabel(
  condition: DeviceCondition,
) {
  const labels: Record<
    DeviceCondition,
    string
  > = {
    NOVO: 'Novo',
    SEMINOVO: 'Seminovo',
    USADO: 'Usado',
  };

  return labels[condition];
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(
    'pt-BR',
  ).format(
    new Date(`${date}T12:00:00`),
  );
}

function formatNullableCurrency(
  value: number | null,
) {
  if (value === null) {
    return 'Pendente';
  }

  return formatCurrency(value);
}

function getOptionalValue(
  value: string | null,
  fallback = 'Pendente',
) {
  return value || fallback;
}


export function Devices() {
  const location = useLocation();
  const navigate = useNavigate();

  const locationState =
    location.state as LocationState | null;

  const [devices, setDevices] =
    useState<Device[]>([]);

  const [meta, setMeta] =
    useState<DeviceListMeta>(
      initialMeta,
    );

  const [page, setPage] =
    useState(1);

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0);

  const [search, setSearch] =
    useState('');

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<StatusFilter>(
    'TODOS',
  );

  const [
    conditionFilter,
    setConditionFilter,
  ] = useState<ConditionFilter>(
    'TODOS',
  );

  const [startDate, setStartDate] =
    useState('');

  const [endDate, setEndDate] =
    useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState(
    locationState?.successMessage ??
      '',
  );

  const [isLoading, setIsLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState('');

  const [
    deletingDeviceId,
    setDeletingDeviceId,
  ] = useState<string | null>(null);

  const [
    selectedDevices,
    setSelectedDevices,
  ] = useState<Map<string, Device>>(
    () => new Map(),
  );

  const [
    isSelectingAllAvailable,
    setIsSelectingAllAvailable,
  ] = useState(false);

  const isDateRangeInvalid =
    startDate !== '' &&
    endDate !== '' &&
    startDate > endDate;

  const hasActiveFilters =
    search.trim() !== '' ||
    statusFilter !== 'TODOS' ||
    conditionFilter !== 'TODOS' ||
    startDate !== '' ||
    endDate !== '';

  const availableDevicesOnPage =
    devices.filter(
      (device) =>
        device.status === 'DISPONIVEL',
    );

  const areAllAvailableOnPageSelected =
    availableDevicesOnPage.length > 0 &&
    availableDevicesOnPage.every(
      (device) =>
        selectedDevices.has(device.id),
    );

  const selectedDevicesCount =
    selectedDevices.size;

  useEffect(() => {
    let isMounted = true;

    if (isDateRangeInvalid) {
      setDevices([]);
      setMeta(initialMeta);
      setIsLoading(false);

      return () => {
        isMounted = false;
      };
    }

    const timeout =
      window.setTimeout(
        async () => {
          setIsLoading(true);
          setLoadError('');

          try {
            const response =
              await listDevicesPage({
                page,

                search:
                  search.trim() ||
                  undefined,

                status:
                  statusFilter ===
                  'TODOS'
                    ? undefined
                    : statusFilter,

                condition:
                  conditionFilter ===
                  'TODOS'
                    ? undefined
                    : conditionFilter,

                startDate:
                  startDate ||
                  undefined,

                endDate:
                  endDate ||
                  undefined,
              });

            if (!isMounted) {
              return;
            }

            setDevices(response.data);
            setMeta(response.meta);
          } catch (error) {
            if (!isMounted) {
              return;
            }

            setDevices([]);
            setMeta(initialMeta);

            if (
              error instanceof ApiError
            ) {
              setLoadError(
                error.message,
              );
            } else {
              setLoadError(
                'Não foi possível carregar os dispositivos. Verifique se a API está funcionando.',
              );
            }
          } finally {
            if (isMounted) {
              setIsLoading(false);
            }
          }
        },
        350,
      );

    return () => {
      isMounted = false;
      window.clearTimeout(timeout);
    };
  }, [
    page,
    search,
    statusFilter,
    conditionFilter,
    startDate,
    endDate,
    isDateRangeInvalid,
    refreshKey,
  ]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    navigate(location.pathname, {
      replace: true,
      state: null,
    });

    const timeout =
      window.setTimeout(() => {
        setSuccessMessage('');
      }, 4000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    location.pathname,
    navigate,
    successMessage,
  ]);

  function handleClearFilters() {
    setPage(1);
    setSearch('');
    setStatusFilter('TODOS');
    setConditionFilter('TODOS');
    setStartDate('');
    setEndDate('');
  }

  function handleToggleDeviceSelection(
    device: Device,
  ) {
    if (device.status !== 'DISPONIVEL') {
      return;
    }

    setSelectedDevices(
      (currentDevices) => {
        const nextDevices =
          new Map(currentDevices);

        if (nextDevices.has(device.id)) {
          nextDevices.delete(device.id);
        } else {
          nextDevices.set(
            device.id,
            device,
          );
        }

        return nextDevices;
      },
    );
  }

  function handleTogglePageSelection() {
    setSelectedDevices(
      (currentDevices) => {
        const nextDevices =
          new Map(currentDevices);

        if (
          areAllAvailableOnPageSelected
        ) {
          availableDevicesOnPage.forEach(
            (device) => {
              nextDevices.delete(
                device.id,
              );
            },
          );
        } else {
          availableDevicesOnPage.forEach(
            (device) => {
              nextDevices.set(
                device.id,
                device,
              );
            },
          );
        }

        return nextDevices;
      },
    );
  }

  async function handleSelectAllAvailable() {
    setIsSelectingAllAvailable(true);
    setLoadError('');

    try {
      const availableDevices =
        await listAllDevices({
          status: 'DISPONIVEL',
        });

      setSelectedDevices(
        new Map(
          availableDevices.map(
            (device) => [
              device.id,
              device,
            ],
          ),
        ),
      );
    } catch (error) {
      if (error instanceof ApiError) {
        window.alert(error.message);
      } else {
        window.alert(
          'Não foi possível selecionar todos os dispositivos disponíveis.',
        );
      }
    } finally {
      setIsSelectingAllAvailable(false);
    }
  }

  function handleClearSelection() {
    setSelectedDevices(new Map());
  }

  function handleGeneratePdf() {
    try {
      generateDevicesPdf(
        Array.from(
          selectedDevices.values(),
        ),
      );
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : 'Não foi possível gerar o PDF.',
      );
    }
  }

  async function handleDeleteDevice(
    device: Device,
  ) {
    const shouldDelete =
      window.confirm(
        `Deseja realmente excluir ${device.brand} ${device.model}?`,
      );

    if (!shouldDelete) {
      return;
    }

    setDeletingDeviceId(device.id);
    setLoadError('');

    try {
      await deleteDevice(device.id);

      setSuccessMessage(
        'Dispositivo excluído com sucesso.',
      );

      setSelectedDevices(
        (currentDevices) => {
          const nextDevices =
            new Map(currentDevices);

          nextDevices.delete(device.id);

          return nextDevices;
        },
      );

      if (
        devices.length === 1 &&
        page > 1
      ) {
        setPage(
          (currentPage) =>
            currentPage - 1,
        );
      } else {
        setRefreshKey(
          (currentValue) =>
            currentValue + 1,
        );
      }
    } catch (error) {
      if (error instanceof ApiError) {
        window.alert(error.message);
      } else {
        window.alert(
          'Não foi possível excluir o dispositivo. Verifique a conexão com a API.',
        );
      }
    } finally {
      setDeletingDeviceId(null);
    }
  }

  return (
    <main className="devices">
      <section className="devices__heading">
        <div>
          <h1>Dispositivos</h1>

          <p>
            Consulte e gerencie os
            aparelhos cadastrados.
          </p>
        </div>

        <Link
          to="/dispositivos/cadastrar"
          className="devices__create"
        >
          <Plus size={19} />

          Novo dispositivo
        </Link>
      </section>

      {successMessage && (
        <div
          className="devices__success"
          role="status"
        >
          {successMessage}
        </div>
      )}

      {loadError && (
        <div
          className="devices__load-error"
          role="alert"
        >
          {loadError}
        </div>
      )}

      <section className="devices__content">
        <div className="devices__filters">
          <div className="devices__search">
            <Search size={19} />

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(
                  event.target.value,
                );
              }}
              placeholder="Pesquisar por marca, modelo, condição, IMEI, cor ou fornecedor"
              aria-label="Pesquisar dispositivos"
              disabled={isLoading}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => {
              setPage(1);
              setStatusFilter(
                event.target
                  .value as StatusFilter,
              );
            }}
            aria-label="Filtrar por status"
            disabled={isLoading}
          >
            <option value="TODOS">
              Todos os status
            </option>

            <option value="PENDENTE_INFORMACOES">
              Pendentes de informações
            </option>

            <option value="DISPONIVEL">
              Disponíveis
            </option>

            <option value="RESERVADO">
              Reservados
            </option>

            <option value="VENDIDO">
              Vendidos
            </option>
          </select>

          <select
            value={conditionFilter}
            onChange={(event) => {
              setPage(1);
              setConditionFilter(
                event.target
                  .value as ConditionFilter,
              );
            }}
            aria-label="Filtrar por condição"
            disabled={isLoading}
          >
            <option value="TODOS">
              Todas as condições
            </option>

            <option value="NOVO">
              Novos
            </option>

            <option value="SEMINOVO">
              Seminovos
            </option>

            <option value="USADO">
              Usados
            </option>
          </select>

          <div className="devices__date-filter">
            <CalendarDays size={18} />

            <label htmlFor="deviceStartDate">
              De
            </label>

            <input
              id="deviceStartDate"
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => {
                setPage(1);
                setStartDate(
                  event.target.value,
                );
              }}
              aria-label="Data inicial de entrada"
              disabled={isLoading}
            />
          </div>

          <div className="devices__date-filter">
            <CalendarDays size={18} />

            <label htmlFor="deviceEndDate">
              Até
            </label>

            <input
              id="deviceEndDate"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => {
                setPage(1);
                setEndDate(
                  event.target.value,
                );
              }}
              aria-label="Data final de entrada"
              disabled={isLoading}
            />
          </div>

          <button
            type="button"
            className="devices__clear-filters"
            onClick={handleClearFilters}
            disabled={
              isLoading ||
              !hasActiveFilters
            }
          >
            <RotateCcw size={17} />

            Limpar filtros
          </button>
        </div>

        {isDateRangeInvalid && (
          <div
            className="devices__filter-error"
            role="alert"
          >
            A data inicial não pode ser
            posterior à data final.
          </div>
        )}

        {isLoading ? (
          <div className="devices__loading">
            <Smartphone size={28} />

            <span>
              Carregando dispositivos...
            </span>
          </div>
        ) : (
          <>
            <div className="devices__result">
              <strong>
                {meta.total}{' '}
                {meta.total ===
                1
                  ? 'dispositivo encontrado'
                  : 'dispositivos encontrados'}
              </strong>
            </div>

            <div className="devices__report-toolbar">
              <div className="devices__selection-summary">
                <ListChecks size={19} />

                <span>
                  {selectedDevicesCount}{' '}
                  {selectedDevicesCount === 1
                    ? 'dispositivo selecionado'
                    : 'dispositivos selecionados'}
                </span>
              </div>

              <div className="devices__report-actions">
                <button
                  type="button"
                  onClick={() =>
                    void handleSelectAllAvailable()
                  }
                  disabled={
                    isLoading ||
                    isSelectingAllAvailable
                  }
                >
                  <ListChecks size={17} />

                  {isSelectingAllAvailable
                    ? 'Selecionando...'
                    : 'Selecionar todos os disponíveis'}
                </button>

                <button
                  type="button"
                  onClick={handleClearSelection}
                  disabled={
                    selectedDevicesCount === 0
                  }
                >
                  <RotateCcw size={17} />

                  Limpar seleção
                </button>

                <button
                  type="button"
                  className="devices__generate-pdf"
                  onClick={handleGeneratePdf}
                  disabled={
                    selectedDevicesCount === 0
                  }
                >
                  <FileDown size={18} />

                  Gerar PDF
                </button>
              </div>
            </div>

            {devices.length >
            0 ? (
              <>
                <div className="devices__table-container">
                  <table className="devices__table">
                    <thead>
                      <tr>
                        <th className="devices__selection-column">
                          <input
                            type="checkbox"
                            checked={
                              areAllAvailableOnPageSelected
                            }
                            onChange={handleTogglePageSelection}
                            disabled={
                              availableDevicesOnPage.length === 0
                            }
                            aria-label="Selecionar todos os dispositivos disponíveis desta página"
                            title="Selecionar disponíveis desta página"
                          />
                        </th>

                        <th>
                          Dispositivo
                        </th>

                        <th>Condição</th>
                        <th>IMEI</th>
                        <th>Entrada</th>
                        <th>Compra</th>
                        <th>Venda</th>
                        <th>Status</th>
                        <th>Ações</th>
                      </tr>
                    </thead>

                    <tbody>
                      {devices.map(
                        (device) => {
                          const isDeleting =
                            deletingDeviceId ===
                            device.id;

                          const canRegisterSale =
                            (
                              device.status ===
                                'DISPONIVEL' ||
                              device.status ===
                                'RESERVADO'
                            ) &&
                            Boolean(
                              device.imei,
                            ) &&
                            Boolean(
                              device.color,
                            ) &&
                            device.salePrice !==
                              null;

                          return (
                            <tr
                              key={
                                device.id
                              }
                            >
                              <td className="devices__selection-cell">
                                <input
                                  type="checkbox"
                                  checked={
                                    selectedDevices.has(
                                      device.id,
                                    )
                                  }
                                  onChange={() =>
                                    handleToggleDeviceSelection(
                                      device,
                                    )
                                  }
                                  disabled={
                                    device.status !==
                                    'DISPONIVEL'
                                  }
                                  aria-label={`Selecionar ${device.brand} ${device.model} para o relatório`}
                                />
                              </td>

                              <td>
                                <div className="devices__device">
                                  <div className="devices__device-icon">
                                    <Smartphone
                                      size={
                                        20
                                      }
                                    />
                                  </div>

                                  <div>
                                    <strong>
                                      {
                                        device.brand
                                      }{' '}
                                      {
                                        device.model
                                      }
                                    </strong>

                                    <span>
                                      {
                                        device.storage
                                      }{' '}
                                      ·{' '}
                                      {getOptionalValue(
                                        device.color,
                                        'Cor pendente',
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td>
                                <span
                                  className={`devices__condition devices__condition--${device.condition.toLowerCase()}`}
                                >
                                  {getConditionLabel(
                                    device.condition,
                                  )}
                                </span>
                              </td>

                              <td>
                                {getOptionalValue(
                                  device.imei,
                                )}
                              </td>

                              <td>
                                {formatDate(
                                  device.entryDate,
                                )}
                              </td>

                              <td>
                                {formatCurrency(
                                  device.purchasePrice,
                                )}
                              </td>

                              <td>
                                {formatNullableCurrency(
                                  device.salePrice,
                                )}
                              </td>

                              <td>
                                <span
                                  className={`devices__status devices__status--${device.status.toLowerCase()}`}
                                >
                                  {getStatusLabel(
                                    device.status,
                                  )}
                                </span>
                              </td>

                              <td>
                                <div className="devices__actions">
                                  <Link
                                    to={`/dispositivos/${device.id}`}
                                    className="devices__action devices__action--view"
                                    aria-label={`Visualizar ${device.brand} ${device.model}`}
                                    title="Visualizar"
                                  >
                                    <Eye
                                      size={
                                        18
                                      }
                                    />
                                  </Link>

                                  {canRegisterSale && (
                                    <Link
                                      to={`/dispositivos/${device.id}/vender`}
                                      className="devices__action devices__action--sell"
                                      aria-label={`Registrar venda de ${device.brand} ${device.model}`}
                                      title="Registrar venda"
                                    >
                                      <BadgeDollarSign
                                        size={
                                          18
                                        }
                                      />
                                    </Link>
                                  )}

                                  <button
                                    type="button"
                                    className="devices__action devices__action--delete"
                                    onClick={() =>
                                      void handleDeleteDevice(
                                        device,
                                      )
                                    }
                                    aria-label={`Excluir ${device.brand} ${device.model}`}
                                    title="Excluir"
                                    disabled={
                                      isDeleting
                                    }
                                  >
                                    <Trash2
                                      size={
                                        18
                                      }
                                    />
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

                <div className="devices__mobile-list">
                  {devices.map(
                    (device) => {
                      const isDeleting =
                        deletingDeviceId ===
                        device.id;

                      const canRegisterSale =
                        (
                          device.status ===
                            'DISPONIVEL' ||
                          device.status ===
                            'RESERVADO'
                        ) &&
                        Boolean(
                          device.imei,
                        ) &&
                        Boolean(
                          device.color,
                        ) &&
                        device.salePrice !==
                          null;

                      return (
                        <article
                          key={device.id}
                          className="devices__card"
                        >
                          {device.status ===
                            'DISPONIVEL' && (
                            <label className="devices__card-selection">
                              <input
                                type="checkbox"
                                checked={
                                  selectedDevices.has(
                                    device.id,
                                  )
                                }
                                onChange={() =>
                                  handleToggleDeviceSelection(
                                    device,
                                  )
                                }
                              />

                              Incluir no PDF
                            </label>
                          )}

                          <div className="devices__card-header">
                            <div className="devices__device">
                              <div className="devices__device-icon">
                                <Smartphone
                                  size={20}
                                />
                              </div>

                              <div>
                                <strong>
                                  {
                                    device.brand
                                  }{' '}
                                  {
                                    device.model
                                  }
                                </strong>

                                <span>
                                  {
                                    device.storage
                                  }{' '}
                                  ·{' '}
                                  {getOptionalValue(
                                    device.color,
                                    'Cor pendente',
                                  )}
                                </span>
                              </div>
                            </div>

                            <span
                              className={`devices__status devices__status--${device.status.toLowerCase()}`}
                            >
                              {getStatusLabel(
                                device.status,
                              )}
                            </span>
                          </div>

                          <div className="devices__card-info">
                            <div>
                              <span>
                                Condição
                              </span>

                              <strong>
                                {getConditionLabel(
                                  device.condition,
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>IMEI</span>

                              <strong>
                                {getOptionalValue(
                                  device.imei,
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Entrada
                              </span>

                              <strong>
                                {formatDate(
                                  device.entryDate,
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Valor de compra
                              </span>

                              <strong>
                                {formatCurrency(
                                  device.purchasePrice,
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Valor de venda
                              </span>

                              <strong>
                                {formatNullableCurrency(
                                  device.salePrice,
                                )}
                              </strong>
                            </div>
                          </div>

                          <div className="devices__card-actions">
                            <Link
                              to={`/dispositivos/${device.id}`}
                            >
                              <Eye size={18} />

                              Ver detalhes
                            </Link>

                            {canRegisterSale && (
                              <Link
                                to={`/dispositivos/${device.id}/vender`}
                                className="devices__card-action--sell"
                              >
                                <BadgeDollarSign
                                  size={18}
                                />

                                Registrar venda
                              </Link>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                void handleDeleteDevice(
                                  device,
                                )
                              }
                              disabled={
                                isDeleting
                              }
                            >
                              <Trash2
                                size={18}
                              />

                              {isDeleting
                                ? 'Excluindo...'
                                : 'Excluir'}
                            </button>
                          </div>
                        </article>
                      );
                    },
                  )}
                </div>

                <div className="devices__pagination">
                  <span>
                    {meta.total === 0
                      ? 'Nenhum resultado'
                      : `Exibindo ${
                          (meta.page - 1) *
                            meta.pageSize +
                          1
                        }–${Math.min(
                          meta.page *
                            meta.pageSize,
                          meta.total,
                        )} de ${
                          meta.total
                        } resultados`}
                  </span>

                  <div className="devices__pagination-actions">
                    <button
                      type="button"
                      onClick={() =>
                        setPage(
                          (currentPage) =>
                            Math.max(
                              1,
                              currentPage - 1,
                            ),
                        )
                      }
                      disabled={
                        isLoading ||
                        !meta.hasPreviousPage
                      }
                    >
                      Anterior
                    </button>

                    <strong>
                      Página{' '}
                      {meta.totalPages === 0
                        ? 1
                        : meta.page}{' '}
                      de{' '}
                      {meta.totalPages === 0
                        ? 1
                        : meta.totalPages}
                    </strong>

                    <button
                      type="button"
                      onClick={() =>
                        setPage(
                          (currentPage) =>
                            currentPage + 1,
                        )
                      }
                      disabled={
                        isLoading ||
                        !meta.hasNextPage
                      }
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="devices__empty">
                <div className="devices__empty-icon">
                  <Smartphone
                    size={32}
                  />
                </div>

                <h2>
                  Nenhum dispositivo
                  encontrado
                </h2>

                <p>
                  {hasActiveFilters
                    ? 'Nenhum aparelho corresponde aos filtros utilizados.'
                    : 'Cadastre um aparelho para começar a gerenciar o estoque.'}
                </p>

                {!hasActiveFilters && (
                  <Link to="/dispositivos/cadastrar">
                    <Plus size={18} />

                    Cadastrar dispositivo
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}