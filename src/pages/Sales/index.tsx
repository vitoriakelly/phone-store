import {
  BadgeDollarSign,
  CalendarDays,
  Eye,
  RotateCcw,
  Search,
  Smartphone,
  UserRound,
} from 'lucide-react';
import {
  useEffect,
  useState,
} from 'react';
import { Link } from 'react-router-dom';

import { ApiError } from '../../services/api';
import {
  listSales,
  type SaleSummary,
} from '../../services/saleApi';
import { listSellers } from '../../services/userApi';
import type {
  DeviceCondition,
} from '../../types/device';
import type {
  PaymentMethod,
  Sale,
  SalePayment,
} from '../../types/sale';
import type { Seller } from '../../types/user';
import { formatCurrency } from '../../utils/currency';

import './styles.scss';

type PaymentFilter =
  | 'TODOS'
  | PaymentMethod;

type ConditionFilter =
  | 'TODOS'
  | DeviceCondition;

const initialSummary: SaleSummary = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
  totalRevenue: 0,
  totalProfit: 0,
  totalCommission: 0,
  totalProfitAfterCommission: 0,
  averageTicket: 0,
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat(
    'pt-BR',
  ).format(
    new Date(`${date}T12:00:00`),
  );
}


function getConditionLabel(
  condition:
    | DeviceCondition
    | null,
) {
  if (!condition) {
    return 'Não informado';
  }

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

function getPaymentMethodLabel(
  paymentMethod: PaymentMethod,
) {
  const labels: Record<
    PaymentMethod,
    string
  > = {
    PIX: 'Pix',
    DINHEIRO: 'Dinheiro',
    CARTAO_CREDITO:
      'Cartão de crédito',
    CARTAO_DEBITO:
      'Cartão de débito',
    TRANSFERENCIA:
      'Transferência',
    TROCA_DISPOSITIVO:
      'Troca de dispositivo',
    OUTRO: 'Outro',
  };

  return labels[paymentMethod];
}

function getSalePayments(
  sale: Sale,
): SalePayment[] {
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
  payment: SalePayment,
) {
  const label =
    getPaymentMethodLabel(
      payment.method,
    );

  if (
    payment.method ===
      'CARTAO_CREDITO' &&
    payment.installments
  ) {
    return `${label} em ${payment.installments}x`;
  }

  return label;
}

function getPaymentSummary(
  sale: Sale,
) {
  const payments =
    getSalePayments(sale);

  const descriptions =
    payments.map(
      getPaymentDescription,
    );

  if (descriptions.length === 1) {
    return descriptions[0];
  }

  if (descriptions.length === 2) {
    return descriptions.join(' + ');
  }

  return `${descriptions
    .slice(0, 2)
    .join(' + ')} +${
    descriptions.length - 2
  }`;
}

function getPaymentTitle(
  sale: Sale,
) {
  return getSalePayments(sale)
    .map(
      (payment) =>
        `${getPaymentDescription(
          payment,
        )}: ${formatCurrency(
          payment.amount,
        )}`,
    )
    .join(' | ');
}


export function Sales() {
  const [sales, setSales] =
    useState<Sale[]>([]);

  const [sellers, setSellers] =
    useState<Seller[]>([]);

  const [
    sellerFilter,
    setSellerFilter,
  ] = useState('TODOS');

  const [
    isLoadingSellers,
    setIsLoadingSellers,
  ] = useState(true);

  const [
    sellersLoadError,
    setSellersLoadError,
  ] = useState('');

  const [summary, setSummary] =
    useState<SaleSummary>(
      initialSummary,
    );

  const [search, setSearch] =
    useState('');

  const [
    paymentFilter,
    setPaymentFilter,
  ] = useState<PaymentFilter>(
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

  const [page, setPage] =
    useState(1);

  const [isLoading, setIsLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState('');

  const isDateRangeInvalid =
    startDate !== '' &&
    endDate !== '' &&
    startDate > endDate;

  const hasActiveFilters =
    search.trim() !== '' ||
    paymentFilter !== 'TODOS' ||
    sellerFilter !== 'TODOS' ||
    conditionFilter !== 'TODOS' ||
    startDate !== '' ||
    endDate !== '';

  useEffect(() => {
    let isMounted = true;

    if (isDateRangeInvalid) {
      setSales([]);
      setSummary(initialSummary);
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
              await listSales({
                page,

                search:
                  search.trim() ||
                  undefined,

                paymentMethod:
                  paymentFilter ===
                  'TODOS'
                    ? undefined
                    : paymentFilter,

                sellerId:
                  sellerFilter ===
                  'TODOS'
                    ? undefined
                    : sellerFilter,

                deviceCondition:
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

            setSales(response.data);
            setSummary(response.meta);
          } catch (error) {
            if (!isMounted) {
              return;
            }

            setSales([]);
            setSummary(initialSummary);

            if (
              error instanceof ApiError
            ) {
              setLoadError(
                error.message,
              );
            } else {
              setLoadError(
                'Não foi possível carregar as vendas. Verifique se a API está funcionando.',
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
    paymentFilter,
    sellerFilter,
    conditionFilter,
    startDate,
    endDate,
    isDateRangeInvalid,
  ]);

  useEffect(() => {
    let isMounted = true;

    async function loadSellers() {
      setIsLoadingSellers(true);
      setSellersLoadError('');

      try {
        const response =
          await listSellers();

        if (!isMounted) {
          return;
        }

        setSellers(response);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setSellers([]);

        if (error instanceof ApiError) {
          setSellersLoadError(
            error.message,
          );
        } else {
          setSellersLoadError(
            'Não foi possível carregar os vendedores.',
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingSellers(false);
        }
      }
    }

    void loadSellers();

    return () => {
      isMounted = false;
    };
  }, []);


  function handleClearFilters() {
    setPage(1);
    setSearch('');
    setPaymentFilter('TODOS');
    setSellerFilter('TODOS');
    setConditionFilter('TODOS');
    setStartDate('');
    setEndDate('');
  }

  return (
    <main className="sales">
      <section className="sales__heading">
        <div>
          <h1>Vendas</h1>

          <p>
            Consulte as vendas realizadas
            e os valores recebidos.
          </p>
        </div>
      </section>

      <section className="sales__summary">
        <article className="sales__summary-card">
          <div className="sales__summary-icon">
            <BadgeDollarSign
              size={23}
            />
          </div>

          <div>
            <span>
              Vendas encontradas
            </span>

            <strong>
              {isLoading
                ? '—'
                : summary.total}
            </strong>
          </div>
        </article>

        <article className="sales__summary-card">
          <div className="sales__summary-icon">
            <CalendarDays
              size={23}
            />
          </div>

          <div>
            <span>Faturamento</span>

            <strong>
              {isLoading
                ? '—'
                : formatCurrency(
                    summary.totalRevenue,
                  )}
            </strong>
          </div>
        </article>

        <article className="sales__summary-card">
          <div className="sales__summary-icon">
            <BadgeDollarSign
              size={23}
            />
          </div>

          <div>
            <span>Lucro total</span>

            <strong>
              {isLoading
                ? '—'
                : formatCurrency(
                    summary.totalProfit,
                  )}
            </strong>
          </div>
        </article>
      </section>

      <section className="sales__content">
        <div className="sales__filters">
          <div className="sales__search">
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
              placeholder="Pesquisar cliente, vendedor, aparelho, IMEI, telefone, cidade ou rede social"
              aria-label="Pesquisar vendas"
              disabled={isLoading}
            />
          </div>

          <select
            value={paymentFilter}
            onChange={(event) => {
              setPage(1);
              setPaymentFilter(
                event.target
                  .value as PaymentFilter,
              );
            }}
            aria-label="Filtrar por forma de pagamento"
            disabled={isLoading}
          >
            <option value="TODOS">
              Todas as formas de pagamento
            </option>

            <option value="PIX">
              Pix
            </option>

            <option value="DINHEIRO">
              Dinheiro
            </option>

            <option value="CARTAO_CREDITO">
              Cartão de crédito
            </option>

            <option value="CARTAO_DEBITO">
              Cartão de débito
            </option>

            <option value="TRANSFERENCIA">
              Transferência
            </option>

            <option value="TROCA_DISPOSITIVO">
              Troca de dispositivo
            </option>

            <option value="OUTRO">
              Outro
            </option>
          </select>

          <select
            value={sellerFilter}
            onChange={(event) => {
              setPage(1);
              setSellerFilter(
                event.target.value,
              );
            }}
            aria-label="Filtrar por vendedor"
            disabled={
              isLoading ||
              isLoadingSellers
            }
          >
            <option value="TODOS">
              {isLoadingSellers
                ? 'Carregando vendedores...'
                : 'Todos os vendedores'}
            </option>

            {sellers.map((seller) => (
              <option
                key={seller.id}
                value={seller.id}
              >
                {seller.name}
                {' · '}
                {seller.role === 'MASTER'
                  ? 'Master'
                  : 'Funcionário'}
              </option>
            ))}
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
            aria-label="Filtrar por condição do dispositivo"
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

          <div className="sales__date-filter">
            <CalendarDays size={18} />

            <label htmlFor="saleStartDate">
              De
            </label>

            <input
              id="saleStartDate"
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => {
                setPage(1);
                setStartDate(
                  event.target.value,
                );
              }}
              aria-label="Data inicial da venda"
              disabled={isLoading}
            />
          </div>

          <div className="sales__date-filter">
            <CalendarDays size={18} />

            <label htmlFor="saleEndDate">
              Até
            </label>

            <input
              id="saleEndDate"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => {
                setPage(1);
                setEndDate(
                  event.target.value,
                );
              }}
              aria-label="Data final da venda"
              disabled={isLoading}
            />
          </div>

          <button
            type="button"
            className="sales__clear-filters"
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
            className="sales__filter-error"
            role="alert"
          >
            A data inicial não pode ser
            posterior à data final.
          </div>
        )}

        {sellersLoadError && (
          <div
            className="sales__filter-error"
            role="alert"
          >
            {sellersLoadError}
          </div>
        )}

        {loadError && (
          <div
            className="sales__load-error"
            role="alert"
          >
            {loadError}
          </div>
        )}

        {isLoading ? (
          <div className="sales__loading">
            <BadgeDollarSign
              size={28}
            />

            <span>
              Carregando vendas...
            </span>
          </div>
        ) : loadError ? null : sales.length >
          0 ? (
          <>
            <div className="sales__table-container">
              <table className="sales__table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Vendedor</th>
                    <th>Dispositivo</th>
                    <th>Condição</th>
                    <th>Data</th>
                    <th>Pagamentos</th>
                    <th>Valor</th>
                    <th>Lucro</th>
                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {sales.map(
                    (sale) => {
                      const profit =
                        sale.salePrice -
                        sale.purchasePrice;

                      return (
                        <tr
                          key={sale.id}
                        >
                          <td>
                            <div className="sales__person">
                              <div className="sales__item-icon">
                                <UserRound
                                  size={18}
                                />
                              </div>

                              <div>
                                <strong>
                                  {
                                    sale.customerName
                                  }
                                </strong>

                                <span>
                                  {sale.customerPhone ||
                                    'Telefone não informado'}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <div className="sales__seller">
                              <strong>
                                {sale.sellerName ||
                                  'Não informado'}
                              </strong>

                              <span>
                                {sale.sellerId
                                  ? 'Responsável pela venda'
                                  : 'Venda sem vendedor vinculado'}
                              </span>
                            </div>
                          </td>

                          <td>
                            <div className="sales__device">
                              <strong>
                                {
                                  sale.deviceBrand
                                }{' '}
                                {
                                  sale.deviceModel
                                }
                              </strong>

                              <span>
                                IMEI{' '}
                                {
                                  sale.deviceImei
                                }
                              </span>
                            </div>
                          </td>

                          <td>
                            <span
                              className={`sales__condition sales__condition--${
                                sale.deviceCondition
                                  ? sale.deviceCondition.toLowerCase()
                                  : 'nao-informado'
                              }`}
                            >
                              {getConditionLabel(
                                sale.deviceCondition,
                              )}
                            </span>
                          </td>

                          <td>
                            {formatDate(
                              sale.soldAt,
                            )}
                          </td>

                          <td>
                            <span
                              className="sales__payment"
                              title={getPaymentTitle(
                                sale,
                              )}
                            >
                              {getPaymentSummary(
                                sale,
                              )}
                            </span>
                          </td>

                          <td>
                            <strong className="sales__value">
                              {formatCurrency(
                                sale.salePrice,
                              )}
                            </strong>
                          </td>

                          <td>
                            <strong className="sales__profit">
                              {formatCurrency(
                                profit,
                              )}
                            </strong>
                          </td>

                          <td>
                            <Link
                              to={`/vendas/${sale.id}`}
                              className="sales__details"
                              title="Visualizar venda"
                              aria-label={`Visualizar venda de ${sale.customerName}`}
                            >
                              <Eye size={18} />
                            </Link>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>

            <div className="sales__mobile-list">
              {sales.map(
                (sale) => {
                  const profit =
                    sale.salePrice -
                    sale.purchasePrice;

                  return (
                    <article
                      key={sale.id}
                      className="sales__card"
                    >
                      <div className="sales__card-header">
                        <div className="sales__person">
                          <div className="sales__item-icon">
                            <UserRound
                              size={18}
                            />
                          </div>

                          <div>
                            <strong>
                              {
                                sale.customerName
                              }
                            </strong>

                            <span>
                              {sale.customerPhone ||
                                'Sem telefone'}
                            </span>
                          </div>
                        </div>

                        <span
                          className="sales__payment"
                          title={getPaymentTitle(
                            sale,
                          )}
                        >
                          {getPaymentSummary(
                            sale,
                          )}
                        </span>
                      </div>

                      <div className="sales__card-device">
                        <Smartphone
                          size={19}
                        />

                        <div>
                          <strong>
                            {
                              sale.deviceBrand
                            }{' '}
                            {
                              sale.deviceModel
                            }
                          </strong>

                          <span>
                            IMEI{' '}
                            {
                              sale.deviceImei
                            }
                          </span>
                        </div>
                      </div>

                      <div className="sales__card-info">
                        <div>
                          <span>
                            Condição
                          </span>

                          <strong>
                            {getConditionLabel(
                              sale.deviceCondition,
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>Vendedor</span>

                          <strong>
                            {sale.sellerName ||
                              'Não informado'}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Data da venda
                          </span>

                          <strong>
                            {formatDate(
                              sale.soldAt,
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Formas de pagamento
                          </span>

                          <strong>
                            {
                              getSalePayments(
                                sale,
                              ).length
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            Valor vendido
                          </span>

                          <strong>
                            {formatCurrency(
                              sale.salePrice,
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>Lucro</span>

                          <strong className="sales__profit">
                            {formatCurrency(
                              profit,
                            )}
                          </strong>
                        </div>
                      </div>

                      <Link
                        to={`/vendas/${sale.id}`}
                        className="sales__card-details"
                      >
                        <Eye size={18} />

                        Ver detalhes da venda
                      </Link>
                    </article>
                  );
                },
              )}
            </div>

            <div className="sales__pagination">
              <span>
                {summary.total === 0
                  ? 'Nenhum resultado'
                  : `Exibindo ${
                      (summary.page - 1) *
                        summary.pageSize +
                      1
                    }–${Math.min(
                      summary.page *
                        summary.pageSize,
                      summary.total,
                    )} de ${
                      summary.total
                    } resultados`}
              </span>

              <div className="sales__pagination-actions">
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
                    !summary.hasPreviousPage
                  }
                >
                  Anterior
                </button>

                <strong>
                  Página{' '}
                  {summary.totalPages === 0
                    ? 1
                    : summary.page}{' '}
                  de{' '}
                  {summary.totalPages === 0
                    ? 1
                    : summary.totalPages}
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
                    !summary.hasNextPage
                  }
                >
                  Próxima
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="sales__empty">
            <div className="sales__empty-icon">
              <BadgeDollarSign
                size={32}
              />
            </div>

            <h2>
              Nenhuma venda encontrada
            </h2>

            <p>
              {hasActiveFilters
                ? 'Nenhuma venda corresponde aos filtros utilizados.'
                : 'As vendas registradas aparecerão nesta página.'}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}