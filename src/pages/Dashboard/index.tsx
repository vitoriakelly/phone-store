import {
  BadgeDollarSign,
  CircleDollarSign,
  PackageCheck,
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
import { listDevices } from '../../services/deviceApi';
import {
  listSales,
  type SaleSummary,
} from '../../services/saleApi';
import type { Device } from '../../types/device';
import type {
  PaymentMethod,
  Sale,
} from '../../types/sale';
import { formatCurrency } from '../../utils/currency';

import './styles.scss';

const initialSaleSummary: SaleSummary = {
  total: 0,
  totalRevenue: 0,
  totalProfit: 0,
};

function getStatusLabel(status: Device['status']) {
  const labels: Record<Device['status'], string> = {
    DISPONIVEL: 'Disponível',
    RESERVADO: 'Reservado',
    VENDIDO: 'Vendido',
  };

  return labels[status];
}

function getConditionLabel(
  condition: Device['condition'],
) {
  const labels: Record<Device['condition'], string> = {
    NOVO: 'Novo',
    SEMINOVO: 'Seminovo',
    USADO: 'Usado',
  };

  return labels[condition];
}

function getPaymentMethodLabel(
  paymentMethod: PaymentMethod,
) {
  const labels: Record<PaymentMethod, string> = {
    PIX: 'Pix',
    DINHEIRO: 'Dinheiro',
    CARTAO_CREDITO: 'Cartão de crédito',
    CARTAO_DEBITO: 'Cartão de débito',
    TRANSFERENCIA: 'Transferência',
    OUTRO: 'Outro',
  };

  return labels[paymentMethod];
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR').format(
    new Date(`${date}T12:00:00`),
  );
}

export function Dashboard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const [saleSummary, setSaleSummary] =
    useState<SaleSummary>(initialSaleSummary);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      setLoadError('');

      try {
        const [
          devicesResponse,
          salesResponse,
        ] = await Promise.all([
          listDevices(),
          listSales(),
        ]);

        if (!isMounted) {
          return;
        }

        setDevices(devicesResponse);
        setSales(salesResponse.data);
        setSaleSummary(salesResponse.meta);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setDevices([]);
        setSales([]);
        setSaleSummary(initialSaleSummary);

        if (error instanceof ApiError) {
          setLoadError(error.message);
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
  }, []);

  const availableDevices = useMemo(
    () =>
      devices.filter(
        (device) =>
          device.status === 'DISPONIVEL',
      ),
    [devices],
  );

  const reservedDevices = useMemo(
    () =>
      devices.filter(
        (device) =>
          device.status === 'RESERVADO',
      ),
    [devices],
  );

  const soldDevices = useMemo(
    () =>
      devices.filter(
        (device) =>
          device.status === 'VENDIDO',
      ),
    [devices],
  );

  const inventoryValue = useMemo(
    () =>
      devices
        .filter(
          (device) =>
            device.status !== 'VENDIDO',
        )
        .reduce(
          (total, device) =>
            total + device.salePrice,
          0,
        ),
    [devices],
  );

  const recentDevices = useMemo(
    () =>
      [...devices]
        .sort(
          (
            firstDevice,
            secondDevice,
          ) => {
            const firstDate = new Date(
              firstDevice.createdAt ||
                firstDevice.entryDate,
            ).getTime();

            const secondDate = new Date(
              secondDevice.createdAt ||
                secondDevice.entryDate,
            ).getTime();

            return secondDate - firstDate;
          },
        )
        .slice(0, 5),
    [devices],
  );

  const recentSales = useMemo(
    () =>
      [...sales]
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
        )
        .slice(0, 5),
    [sales],
  );

  const averageTicket =
    saleSummary.total > 0
      ? saleSummary.totalRevenue /
        saleSummary.total
      : 0;

  return (
    <main className="dashboard">
      <section className="dashboard__heading">
        <div>
          <h1>Dashboard</h1>

          <p>
            Acompanhe o estoque e as movimentações
            da loja.
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
          <section className="dashboard__summary">
            <SummaryCard
              title="Total de aparelhos"
              value={devices.length}
              description={`${availableDevices.length} disponíveis e ${reservedDevices.length} reservados`}
              icon={Smartphone}
              variant="blue"
            />

            <SummaryCard
              title="Disponíveis"
              value={availableDevices.length}
              description="Aparelhos disponíveis para venda"
              icon={PackageCheck}
              variant="green"
            />

            <SummaryCard
              title="Aparelhos vendidos"
              value={soldDevices.length}
              description={`${saleSummary.total} vendas registradas`}
              icon={BadgeDollarSign}
              variant="yellow"
            />

            <SummaryCard
              title="Valor do estoque"
              value={formatCurrency(inventoryValue)}
              description="Valor potencial dos aparelhos não vendidos"
              icon={CircleDollarSign}
              variant="purple"
            />
          </section>

          <section className="dashboard__financial">
            <article className="dashboard__financial-card">
              <span>Faturamento total</span>

              <strong>
                {formatCurrency(
                  saleSummary.totalRevenue,
                )}
              </strong>

              <small>
                Soma dos valores finais das vendas
              </small>
            </article>

            <article className="dashboard__financial-card">
              <span>Lucro total</span>

              <strong>
                {formatCurrency(
                  saleSummary.totalProfit,
                )}
              </strong>

              <small>
                Diferença entre vendas e compras
              </small>
            </article>

            <article className="dashboard__financial-card">
              <span>Ticket médio</span>

              <strong>
                {formatCurrency(averageTicket)}
              </strong>

              <small>
                Valor médio por venda registrada
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
                      {recentDevices.map(
                        (device) => (
                          <tr key={device.id}>
                            <td>
                              <div className="dashboard__device">
                                <div className="dashboard__device-icon">
                                  <Smartphone
                                    size={20}
                                  />
                                </div>

                                <div>
                                  <strong>
                                    {device.brand}{' '}
                                    {device.model}
                                  </strong>

                                  <span>
                                    {device.color} ·{' '}
                                    {getConditionLabel(
                                      device.condition,
                                    )}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td>
                              {device.storage}
                            </td>

                            <td>
                              {formatDate(
                                device.entryDate,
                              )}
                            </td>

                            <td>
                              {formatCurrency(
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
                        ),
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="dashboard__mobile-list">
                  {recentDevices.map(
                    (device) => (
                      <article
                        key={device.id}
                        className="dashboard__mobile-card"
                      >
                        <div className="dashboard__mobile-top">
                          <div className="dashboard__device">
                            <div className="dashboard__device-icon">
                              <Smartphone
                                size={20}
                              />
                            </div>

                            <div>
                              <strong>
                                {device.brand}{' '}
                                {device.model}
                              </strong>

                              <span>
                                {device.storage} ·{' '}
                                {device.color}
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
                              {formatCurrency(
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
                    ),
                  )}
                </div>
              </>
            ) : (
              <div className="dashboard__empty">
                <Smartphone size={31} />

                <h3>
                  Nenhum dispositivo cadastrado
                </h3>

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
                <h2>Vendas recentes</h2>

                <p>
                  Últimas vendas registradas no
                  sistema.
                </p>
              </div>

              <Link to="/vendas">
                Ver vendas
              </Link>
            </div>

            {recentSales.length > 0 ? (
              <div className="dashboard__sales-list">
                {recentSales.map((sale) => {
                  const profit =
                    sale.salePrice -
                    sale.purchasePrice;

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
                            {formatDate(
                              sale.soldAt,
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>Pagamento</span>

                          <strong>
                            {getPaymentMethodLabel(
                              sale.paymentMethod,
                            )}
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
                            {formatCurrency(
                              profit,
                            )}
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

                <h3>
                  Nenhuma venda registrada
                </h3>

                <p>
                  As vendas realizadas aparecerão
                  nesta área.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}