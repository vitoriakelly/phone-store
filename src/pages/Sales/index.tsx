import {
  BadgeDollarSign,
  CalendarDays,
  Eye,
  Search,
  Smartphone,
  UserRound,
} from 'lucide-react';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link } from 'react-router-dom';

import { ApiError } from '../../services/api';
import {
  listSales,
  type SaleSummary,
} from '../../services/saleApi';
import type {
  PaymentMethod,
  Sale,
} from '../../types/sale';
import { formatCurrency } from '../../utils/currency';

import './styles.scss';

type PaymentFilter =
  | 'TODOS'
  | PaymentMethod;

const initialSummary: SaleSummary = {
  total: 0,
  totalRevenue: 0,
  totalProfit: 0,
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat(
    'pt-BR',
  ).format(
    new Date(`${date}T12:00:00`),
  );
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
    OUTRO: 'Outro',
  };

  return labels[paymentMethod];
}

export function Sales() {
  const [sales, setSales] =
    useState<Sale[]>([]);

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

  const [isLoading, setIsLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadSales() {
      setIsLoading(true);
      setLoadError('');

      try {
        const response =
          await listSales();

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

        if (error instanceof ApiError) {
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
    }

    void loadSales();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredSales =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return [...sales]
        .filter((sale) => {
          const searchableContent =
            [
              sale.customerName,
              sale.customerPhone,
              sale.deviceBrand,
              sale.deviceModel,
              sale.deviceImei,
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase();

          const matchesSearch =
            normalizedSearch === '' ||
            searchableContent.includes(
              normalizedSearch,
            );

          const matchesPayment =
            paymentFilter ===
              'TODOS' ||
            sale.paymentMethod ===
              paymentFilter;

          return (
            matchesSearch &&
            matchesPayment
          );
        })
        .sort(
          (
            firstSale,
            secondSale,
          ) =>
            new Date(
              secondSale.createdAt,
            ).getTime() -
            new Date(
              firstSale.createdAt,
            ).getTime(),
        );
    }, [
      sales,
      search,
      paymentFilter,
    ]);

  const filteredRevenue =
    filteredSales.reduce(
      (total, sale) =>
        total + sale.salePrice,
      0,
    );

  const filteredProfit =
    filteredSales.reduce(
      (total, sale) =>
        total +
        (sale.salePrice -
          sale.purchasePrice),
      0,
    );

  const hasActiveFilters =
    search.trim() !== '' ||
    paymentFilter !== 'TODOS';

  const displayedTotal =
    hasActiveFilters
      ? filteredSales.length
      : summary.total;

  const displayedRevenue =
    hasActiveFilters
      ? filteredRevenue
      : summary.totalRevenue;

  const displayedProfit =
    hasActiveFilters
      ? filteredProfit
      : summary.totalProfit;

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
                : displayedTotal}
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
                    displayedRevenue,
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
                    displayedProfit,
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
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Pesquisar cliente, aparelho ou IMEI"
              aria-label="Pesquisar vendas"
              disabled={isLoading}
            />
          </div>

          <select
            value={paymentFilter}
            onChange={(event) =>
              setPaymentFilter(
                event.target
                  .value as PaymentFilter,
              )
            }
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

            <option value="OUTRO">
              Outro
            </option>
          </select>
        </div>

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
        ) : loadError ? null : filteredSales.length >
          0 ? (
          <>
            <div className="sales__table-container">
              <table className="sales__table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Dispositivo</th>
                    <th>Data</th>
                    <th>Pagamento</th>
                    <th>Valor</th>
                    <th>Lucro</th>
                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSales.map(
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
                            {formatDate(
                              sale.soldAt,
                            )}
                          </td>

                          <td>
                            <span className="sales__payment">
                              {getPaymentMethodLabel(
                                sale.paymentMethod,
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
                              <Eye
                                size={18}
                              />
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
              {filteredSales.map(
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

                        <span className="sales__payment">
                          {getPaymentMethodLabel(
                            sale.paymentMethod,
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
                            Valor vendido
                          </span>

                          <strong>
                            {formatCurrency(
                              sale.salePrice,
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Lucro
                          </span>

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