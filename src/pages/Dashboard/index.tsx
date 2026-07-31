import {
  AlertCircle,
  BadgeDollarSign,
  CalendarDays,
  CircleDollarSign,
  PackageCheck,
  RotateCcw,
  Smartphone,
} from 'lucide-react';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link } from 'react-router-dom';

import { SummaryCard } from '../../components/SummaryCard';
import { ApiError } from '../../services/api';
import { getDashboard } from '../../services/dashboardApi';
import type {
  DashboardRecentDevice,
  DashboardRecentSale,
  DashboardResponse,
  DashboardSalePayment,
} from '../../types/dashboard';
import { formatCurrency } from '../../utils/currency';

import './styles.scss';

type PeriodFilter =
  | 'TODOS'
  | 'HOJE'
  | 'SEMANA'
  | 'MES'
  | 'ANO'
  | 'PERSONALIZADO';

interface DatePeriod {
  startDate: string;
  endDate: string;
}

type DashboardPaymentMethod =
  DashboardSalePayment['method'];

function getStatusLabel(
  status: DashboardRecentDevice['status'],
) {
  const labels: Record<
    DashboardRecentDevice['status'],
    string
  > = {
    PENDENTE_INFORMACOES: 'Pendente de informações',
    DISPONIVEL: 'Disponível',
    RESERVADO: 'Reservado',
    VENDIDO: 'Vendido',
  };

  return labels[status];
}

function getConditionLabel(
  condition: DashboardRecentDevice['condition'],
) {
  const labels: Record<
    DashboardRecentDevice['condition'],
    string
  > = {
    NOVO: 'Novo',
    SEMINOVO: 'Seminovo',
    USADO: 'Usado',
  };

  return labels[condition];
}

function getPaymentMethodLabel(
  paymentMethod: DashboardPaymentMethod,
) {
  const labels: Record<
    DashboardPaymentMethod,
    string
  > = {
    PIX: 'Pix',
    DINHEIRO: 'Dinheiro',
    CARTAO_CREDITO: 'Cartão de crédito',
    CARTAO_DEBITO: 'Cartão de débito',
    TRANSFERENCIA: 'Transferência',
    TROCA_DISPOSITIVO: 'Troca de dispositivo',
    OUTRO: 'Outro',
  };

  return labels[paymentMethod];
}

function getSalePayments(
  sale: DashboardRecentSale,
): DashboardSalePayment[] {
  if (sale.payments?.length > 0) {
    return sale.payments;
  }

  return [
    {
      id: `legacy-${sale.id}`,
      saleId: sale.id,
      method: sale.paymentMethod,
      amount: sale.salePrice,
      installments: null,
      createdAt: sale.createdAt,
      updatedAt: sale.updatedAt,
    },
  ];
}

function getPaymentDescription(
  payment: DashboardSalePayment,
) {
  const label = getPaymentMethodLabel(payment.method);

  if (
    payment.method === 'CARTAO_CREDITO' &&
    payment.installments
  ) {
    return `${label} em ${payment.installments}x`;
  }

  return label;
}

function getPaymentSummary(
  sale: DashboardRecentSale,
) {
  const descriptions = getSalePayments(sale).map(
    getPaymentDescription,
  );

  if (descriptions.length === 1) {
    return descriptions[0];
  }

  if (descriptions.length === 2) {
    return descriptions.join(' + ');
  }

  return `${descriptions.slice(0, 2).join(' + ')} +${descriptions.length - 2
    }`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR').format(
    new Date(`${date.slice(0, 10)}T12:00:00`),
  );
}

function formatNullableCurrency(value: number | null) {
  if (value === null) {
    return 'Pendente';
  }

  return formatCurrency(value);
}

function getDeviceColor(color: string | null) {
  return color || 'Cor pendente';
}

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(
    2,
    '0',
  );
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getPresetPeriod(
  periodFilter: PeriodFilter,
): DatePeriod {
  const today = new Date();

  if (periodFilter === 'TODOS') {
    return {
      startDate: '',
      endDate: '',
    };
  }

  if (periodFilter === 'HOJE') {
    const currentDate = formatDateInput(today);

    return {
      startDate: currentDate,
      endDate: currentDate,
    };
  }

  if (periodFilter === 'SEMANA') {
    const startDate = new Date(today);
    const currentWeekDay = today.getDay();
    const distanceToMonday =
      currentWeekDay === 0 ? -6 : 1 - currentWeekDay;

    startDate.setDate(
      today.getDate() + distanceToMonday,
    );

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    return {
      startDate: formatDateInput(startDate),
      endDate: formatDateInput(endDate),
    };
  }

  if (periodFilter === 'MES') {
    const startDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      1,
    );

    const endDate = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
    );

    return {
      startDate: formatDateInput(startDate),
      endDate: formatDateInput(endDate),
    };
  }

  if (periodFilter === 'ANO') {
    const startDate = new Date(today.getFullYear(), 0, 1);
    const endDate = new Date(today.getFullYear(), 11, 31);

    return {
      startDate: formatDateInput(startDate),
      endDate: formatDateInput(endDate),
    };
  }

  return {
    startDate: '',
    endDate: '',
  };
}

function getPeriodLabel(
  periodFilter: PeriodFilter,
  startDate: string,
  endDate: string,
) {
  if (periodFilter === 'TODOS') {
    return 'Todo o período';
  }

  if (periodFilter === 'HOJE') {
    return 'Hoje';
  }

  if (periodFilter === 'SEMANA') {
    return 'Esta semana';
  }

  if (periodFilter === 'MES') {
    return 'Este mês';
  }

  if (periodFilter === 'ANO') {
    return 'Este ano';
  }

  if (startDate && endDate) {
    return `${formatDate(startDate)} até ${formatDate(
      endDate,
    )}`;
  }

  if (startDate) {
    return `A partir de ${formatDate(startDate)}`;
  }

  if (endDate) {
    return `Até ${formatDate(endDate)}`;
  }

  return 'Período personalizado';
}

export function Dashboard() {
  const [
    dashboard,
    setDashboard,
  ] = useState<DashboardResponse | null>(
    null,
  );

  const [
    periodFilter,
    setPeriodFilter,
  ] = useState<PeriodFilter>(
    'HOJE',
  );

  const [customStartDate, setCustomStartDate] =
    useState('');

  const [customEndDate, setCustomEndDate] =
    useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const selectedPeriod =
    useMemo<DatePeriod>(() => {
      if (
        periodFilter ===
        'PERSONALIZADO'
      ) {
        return {
          startDate:
            customStartDate,
          endDate:
            customEndDate,
        };
      }

      return getPresetPeriod(
        periodFilter,
      );
    }, [
      periodFilter,
      customStartDate,
      customEndDate,
    ]);

  const isDateRangeInvalid =
    selectedPeriod.startDate !== '' &&
    selectedPeriod.endDate !== '' &&
    selectedPeriod.startDate >
      selectedPeriod.endDate;

  useEffect(() => {
    let isMounted = true;

    if (isDateRangeInvalid) {
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    async function loadDashboard() {
      setIsLoading(true);
      setLoadError('');

      try {
        const response =
          await getDashboard({
            startDate:
              selectedPeriod.startDate ||
              undefined,

            endDate:
              selectedPeriod.endDate ||
              undefined,
          });

        if (!isMounted) {
          return;
        }

        setDashboard(response);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setDashboard(null);

        if (
          error instanceof ApiError
        ) {
          setLoadError(
            error.message,
          );
        } else {
          setLoadError(
            'Não foi possível carregar o Dashboard. Verifique se a API está funcionando.',
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [
    selectedPeriod.startDate,
    selectedPeriod.endDate,
    isDateRangeInvalid,
  ]);

  const stock =
    dashboard?.stock ?? {
      total: 0,
      pending: 0,
      available: 0,
      reserved: 0,
      sold: 0,
      inventoryValue: 0,
    };

  const salesMetrics =
    dashboard?.sales ?? {
      totalRevenue: 0,
      totalProfit: 0,
      totalCommission: 0,
      totalProfitAfterCommission: 0,
      totalSales: 0,
      averageTicket: 0,
    };

  const recentDevices =
    dashboard?.recentDevices ?? [];

  const recentSales =
    dashboard?.recentSales ?? [];

  const periodLabel = getPeriodLabel(
    periodFilter,
    selectedPeriod.startDate,
    selectedPeriod.endDate,
  );

  function handlePeriodChange(
    nextPeriod: PeriodFilter,
  ) {
    setPeriodFilter(nextPeriod);

    if (nextPeriod !== 'PERSONALIZADO') {
      setCustomStartDate('');
      setCustomEndDate('');
    }
  }

  function handleCustomStartDate(value: string) {
    setPeriodFilter('PERSONALIZADO');
    setCustomStartDate(value);
  }

  function handleCustomEndDate(value: string) {
    setPeriodFilter('PERSONALIZADO');
    setCustomEndDate(value);
  }

  function handleClearPeriod() {
    setPeriodFilter('HOJE');
    setCustomStartDate('');
    setCustomEndDate('');
  }

  return (
    <main className="dashboard">
      <section className="dashboard__heading">
        <div>
          <h1>Dashboard</h1>

          <p>
            Acompanhe o estoque e as movimentações da
            loja.
          </p>
        </div>

        <Link
          to="/dispositivos/cadastrar"
          className="dashboard__new-device"
        >
          Cadastrar dispositivo
        </Link>
      </section>

      {loadError && (
        <div
          className="dashboard__load-error"
          role="alert"
        >
          {loadError}
        </div>
      )}

      {isLoading ? (
        <div className="dashboard__loading">
          <Smartphone size={30} />

          <span>
            Carregando informações do Dashboard...
          </span>
        </div>
      ) : (
        <>
          <section className="dashboard__period">
            <div className="dashboard__period-heading">
              <div>
                <h2>Período das vendas</h2>

                <p>
                  O estoque permanece geral. Os
                  indicadores financeiros seguem o
                  período selecionado.
                </p>
              </div>

              <strong>{periodLabel}</strong>
            </div>

            <div className="dashboard__period-controls">
              <div className="dashboard__period-presets">
                {[
                  ['TODOS', 'Todo período'],
                  ['HOJE', 'Hoje'],
                  ['SEMANA', 'Semana'],
                  ['MES', 'Mês'],
                  ['ANO', 'Ano'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      periodFilter === value
                        ? 'dashboard__period-button dashboard__period-button--active'
                        : 'dashboard__period-button'
                    }
                    onClick={() =>
                      handlePeriodChange(
                        value as PeriodFilter,
                      )
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="dashboard__custom-period">
                <div className="dashboard__date-field">
                  <CalendarDays size={18} />

                  <label htmlFor="dashboardStartDate">
                    De
                  </label>

                  <input
                    id="dashboardStartDate"
                    type="date"
                    value={customStartDate}
                    max={customEndDate || undefined}
                    onChange={(event) =>
                      handleCustomStartDate(
                        event.target.value,
                      )
                    }
                    aria-label="Data inicial do período"
                  />
                </div>

                <div className="dashboard__date-field">
                  <CalendarDays size={18} />

                  <label htmlFor="dashboardEndDate">
                    Até
                  </label>

                  <input
                    id="dashboardEndDate"
                    type="date"
                    value={customEndDate}
                    min={customStartDate || undefined}
                    onChange={(event) =>
                      handleCustomEndDate(
                        event.target.value,
                      )
                    }
                    aria-label="Data final do período"
                  />
                </div>

                <button
                  type="button"
                  className="dashboard__clear-period"
                  onClick={handleClearPeriod}
                  disabled={
                    periodFilter === 'TODOS' &&
                    customStartDate === '' &&
                    customEndDate === ''
                  }
                >
                  <RotateCcw size={17} />
                  Limpar
                </button>
              </div>
            </div>

            {isDateRangeInvalid && (
              <div
                className="dashboard__period-error"
                role="alert"
              >
                A data inicial não pode ser posterior à
                data final.
              </div>
            )}
          </section>

          <section className="dashboard__summary">
            <SummaryCard
              title="Total de aparelhos"
              value={stock.total}
              description={`${stock.available} disponíveis, ${stock.reserved} reservados e ${stock.pending} pendentes`}
              icon={Smartphone}
              variant="blue"
            />

            <SummaryCard
              title="Disponíveis"
              value={stock.available}
              description="Aparelhos liberados para venda"
              icon={PackageCheck}
              variant="green"
            />

            <SummaryCard
              title="Informações pendentes"
              value={stock.pending}
              description="Aparelhos que precisam ser completados"
              icon={AlertCircle}
              variant="yellow"
            />

            <SummaryCard
              title="Valor do estoque"
              value={formatCurrency(
                stock.inventoryValue,
              )}
              description="Considera aparelhos não vendidos com valor definido"
              icon={CircleDollarSign}
              variant="purple"
            />
          </section>

          <section className="dashboard__financial">
            <article className="dashboard__financial-card">
              <span>Faturamento total</span>

              <strong>
                {formatCurrency(
                  salesMetrics.totalRevenue,
                )}
              </strong>

              <small>{periodLabel}</small>
            </article>

            <article className="dashboard__financial-card">
              <span>
                Lucro após comissão
              </span>

              <strong>
                {formatCurrency(
                  salesMetrics
                    .totalProfitAfterCommission,
                )}
              </strong>

              <small>
                Vendas menos compras e
                comissões no período
              </small>
            </article>

            <article className="dashboard__financial-card">
              <span>Ticket médio</span>

              <strong>
                {formatCurrency(
                  salesMetrics.averageTicket,
                )}
              </strong>

              <small>
                Valor médio por venda no período
              </small>
            </article>

            <article className="dashboard__financial-card">
              <span>Aparelhos vendidos</span>

              <strong>
                {salesMetrics.totalSales}
              </strong>

              <small>
                Vendas registradas no período
              </small>
            </article>
          </section>

          <section className="dashboard__recent">
            <div className="dashboard__section-header">
              <div>
                <h2>Últimos dispositivos</h2>

                <p>
                  Aparelhos adicionados recentemente ao
                  estoque.
                </p>
              </div>

              <Link to="/dispositivos">
                Ver todos
              </Link>
            </div>

            {recentDevices.length > 0 ? (
              <>
                <div className="dashboard__table-container">
                  <table className="dashboard__table">
                    <thead>
                      <tr>
                        <th>Dispositivo</th>
                        <th>Armazenamento</th>
                        <th>Entrada</th>
                        <th>Valor</th>
                        <th>Status</th>
                        <th />
                      </tr>
                    </thead>

                    <tbody>
                      {recentDevices.map((device) => (
                        <tr key={device.id}>
                          <td>
                            <div className="dashboard__device">
                              <div className="dashboard__device-icon">
                                <Smartphone size={20} />
                              </div>

                              <div>
                                <strong>
                                  {device.brand}{' '}
                                  {device.model}
                                </strong>

                                <span>
                                  {getDeviceColor(
                                    device.color,
                                  )}{' '}
                                  ·{' '}
                                  {getConditionLabel(
                                    device.condition,
                                  )}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>{device.storage}</td>

                          <td>
                            {formatDate(
                              device.entryDate,
                            )}
                          </td>

                          <td>
                            {formatNullableCurrency(
                              device.salePrice,
                            )}
                          </td>

                          <td>
                            <span
                              className={`dashboard__status dashboard__status--${device.status.toLowerCase()}`}
                            >
                              {getStatusLabel(
                                device.status,
                              )}
                            </span>
                          </td>

                          <td>
                            <Link
                              to={`/dispositivos/${device.id}`}
                              className="dashboard__details"
                            >
                              Detalhes
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="dashboard__mobile-list">
                  {recentDevices.map((device) => (
                    <article
                      key={device.id}
                      className="dashboard__mobile-card"
                    >
                      <div className="dashboard__mobile-top">
                        <div className="dashboard__device">
                          <div className="dashboard__device-icon">
                            <Smartphone size={20} />
                          </div>

                          <div>
                            <strong>
                              {device.brand}{' '}
                              {device.model}
                            </strong>

                            <span>
                              {device.storage} ·{' '}
                              {getDeviceColor(
                                device.color,
                              )}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`dashboard__status dashboard__status--${device.status.toLowerCase()}`}
                        >
                          {getStatusLabel(
                            device.status,
                          )}
                        </span>
                      </div>

                      <div className="dashboard__mobile-info">
                        <div>
                          <span>Entrada</span>

                          <strong>
                            {formatDate(
                              device.entryDate,
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>Valor</span>

                          <strong>
                            {formatNullableCurrency(
                              device.salePrice,
                            )}
                          </strong>
                        </div>
                      </div>

                      <Link
                        to={`/dispositivos/${device.id}`}
                        className="dashboard__mobile-details"
                      >
                        Ver detalhes
                      </Link>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div className="dashboard__empty">
                <Smartphone size={31} />

                <h3>Nenhum dispositivo cadastrado</h3>

                <p>
                  Cadastre o primeiro aparelho para
                  começar a controlar o estoque.
                </p>

                <Link to="/dispositivos/cadastrar">
                  Cadastrar dispositivo
                </Link>
              </div>
            )}
          </section>

          <section className="dashboard__recent">
            <div className="dashboard__section-header">
              <div>
                <h2>Vendas do período</h2>

                <p>
                  Últimas cinco vendas em{' '}
                  {periodLabel.toLowerCase()}.
                </p>
              </div>

              <Link to="/vendas">Ver vendas</Link>
            </div>

            {recentSales.length > 0 ? (
              <div className="dashboard__sales-list">
                {recentSales.map((sale) => {
                  const profit =
                    sale.salePrice -
                    sale.purchasePrice -
                    sale.commissionAmount;

                  return (
                    <article
                      key={sale.id}
                      className="dashboard__sale-card"
                    >
                      <div className="dashboard__sale-main">
                        <div className="dashboard__sale-icon">
                          <BadgeDollarSign
                            size={21}
                          />
                        </div>

                        <div>
                          <strong>
                            {sale.deviceBrand}{' '}
                            {sale.deviceModel}
                          </strong>

                          <span>
                            Vendido para{' '}
                            {sale.customerName}
                          </span>
                        </div>
                      </div>

                      <div className="dashboard__sale-data">
                        <div>
                          <span>Data</span>

                          <strong>
                            {formatDate(sale.soldAt)}
                          </strong>
                        </div>

                        <div>
                          <span>Pagamento</span>

                          <strong>
                            {getPaymentSummary(sale)}
                          </strong>
                        </div>

                        <div>
                          <span>Valor</span>

                          <strong>
                            {formatCurrency(
                              sale.salePrice,
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>Lucro</span>

                          <strong className="dashboard__sale-profit">
                            {formatCurrency(profit)}
                          </strong>
                        </div>
                      </div>

                      <Link
                        to={`/vendas/${sale.id}`}
                        className="dashboard__sale-details"
                      >
                        Ver detalhes
                      </Link>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="dashboard__empty">
                <BadgeDollarSign size={31} />

                <h3>Nenhuma venda no período</h3>

                <p>
                  Altere o período para consultar outras
                  vendas.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}