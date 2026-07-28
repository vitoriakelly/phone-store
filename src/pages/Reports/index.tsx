import {
  BadgeDollarSign,
  CalendarDays,
  CircleDollarSign,
  PackageCheck,
  Printer,
  RotateCcw,
  Search,
  Smartphone,
  Truck,
} from 'lucide-react';
import {
  type FormEvent,
  useEffect,
  useState,
} from 'react';
import { Link } from 'react-router-dom';

import { ApiError } from '../../services/api';
import {
  getDevicesReport,
  getSalesReport,
} from '../../services/reportApi';
import type { Device } from '../../types/device';
import type {
  DevicesReportFilters,
  DevicesReportMeta,
  SalesReportFilters,
  SalesReportMeta,
} from '../../types/report';
import type {
  PaymentMethod,
  Sale,
} from '../../types/sale';
import { formatCurrency } from '../../utils/currency';

import './styles.scss';

type ReportTab = 'sales' | 'devices';

const initialSalesFilters: SalesReportFilters = {
  startDate: '',
  endDate: '',
  imei: '',
  customerName: '',
  deviceName: '',
};

const initialDevicesFilters: DevicesReportFilters = {
  startDate: '',
  endDate: '',
  imei: '',
  supplier: '',
  deviceName: '',
  status: undefined,
};

const initialSalesMeta: SalesReportMeta = {
  total: 0,
  totalRevenue: 0,
  totalCost: 0,
  totalProfit: 0,
  averageTicket: 0,
};

const initialDevicesMeta: DevicesReportMeta = {
  total: 0,
  available: 0,
  reserved: 0,
  sold: 0,
  totalPurchaseValue: 0,
  totalSaleValue: 0,
  potentialProfit: 0,
};

const dateFormatter = new Intl.DateTimeFormat(
  'pt-BR',
);

function formatDate(
  value: string | null | undefined,
) {
  if (!value) {
    return 'Não informado';
  }

  const dateMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})/,
  );

  let parsedDate: Date;

  if (dateMatch) {
    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);

    parsedDate = new Date(
      year,
      month - 1,
      day,
      12,
    );
  } else {
    parsedDate = new Date(value);
  }

  if (
    Number.isNaN(parsedDate.getTime())
  ) {
    return 'Data inválida';
  }

  return dateFormatter.format(parsedDate);
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

function getDeviceStatusLabel(
  status: Device['status'],
) {
  const labels: Record<
    Device['status'],
    string
  > = {
    DISPONIVEL: 'Disponível',
    RESERVADO: 'Reservado',
    VENDIDO: 'Vendido',
  };

  return labels[status];
}

function getDeviceConditionLabel(
  condition: Device['condition'],
) {
  const labels: Record<
    Device['condition'],
    string
  > = {
    NOVO: 'Novo',
    SEMINOVO: 'Seminovo',
    USADO: 'Usado',
  };

  return labels[condition];
}

function escapeHtml(
  value:
    | string
    | number
    | null
    | undefined,
) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function Reports() {
  const [activeTab, setActiveTab] =
    useState<ReportTab>('sales');

  const [salesFilters, setSalesFilters] =
    useState<SalesReportFilters>(
      initialSalesFilters,
    );

  const [
    devicesFilters,
    setDevicesFilters,
  ] = useState<DevicesReportFilters>(
    initialDevicesFilters,
  );

  const [sales, setSales] =
    useState<Sale[]>([]);

  const [devices, setDevices] =
    useState<Device[]>([]);

  const [salesMeta, setSalesMeta] =
    useState<SalesReportMeta>(
      initialSalesMeta,
    );

  const [devicesMeta, setDevicesMeta] =
    useState<DevicesReportMeta>(
      initialDevicesMeta,
    );

  const [isLoading, setIsLoading] =
    useState(false);

  const [loadError, setLoadError] =
    useState('');

  async function loadSalesReport(
    filters: SalesReportFilters,
  ) {
    setIsLoading(true);
    setLoadError('');

    try {
      const response =
        await getSalesReport(filters);

      setSales(response.data);
      setSalesMeta(response.meta);
    } catch (error) {
      setSales([]);
      setSalesMeta(initialSalesMeta);

      if (error instanceof ApiError) {
        setLoadError(error.message);
      } else {
        setLoadError(
          'Não foi possível carregar o relatório de vendas.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function loadDevicesReport(
    filters: DevicesReportFilters,
  ) {
    setIsLoading(true);
    setLoadError('');

    try {
      const response =
        await getDevicesReport(filters);

      setDevices(response.data);
      setDevicesMeta(response.meta);
    } catch (error) {
      setDevices([]);
      setDevicesMeta(
        initialDevicesMeta,
      );

      if (error instanceof ApiError) {
        setLoadError(error.message);
      } else {
        setLoadError(
          'Não foi possível carregar o relatório de dispositivos.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSalesReport(
      initialSalesFilters,
    );
  }, []);

  function handleTabChange(
    tab: ReportTab,
  ) {
    setActiveTab(tab);
    setLoadError('');

    if (
      tab === 'devices' &&
      devices.length === 0
    ) {
      void loadDevicesReport(
        devicesFilters,
      );
    }
  }

  function handleSalesSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    void loadSalesReport(
      salesFilters,
    );
  }

  function handleDevicesSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    void loadDevicesReport(
      devicesFilters,
    );
  }

  function handleClearSalesFilters() {
    setSalesFilters(
      initialSalesFilters,
    );

    void loadSalesReport(
      initialSalesFilters,
    );
  }

  function handleClearDevicesFilters() {
    setDevicesFilters(
      initialDevicesFilters,
    );

    void loadDevicesReport(
      initialDevicesFilters,
    );
  }

  function handlePrintReport() {
    const isSalesReport =
      activeTab === 'sales';

    const hasNoData =
      isSalesReport
        ? sales.length === 0
        : devices.length === 0;

    if (hasNoData) {
      setLoadError(
        'Não existem registros para imprimir.',
      );

      return;
    }

    const printWindow = window.open(
      'about:blank',
      '_blank',
      'width=1200,height=800',
    );

    if (!printWindow) {
      setLoadError(
        'Não foi possível abrir a impressão. Verifique se o navegador está bloqueando pop-ups.',
      );

      return;
    }

    const generatedAt =
      new Intl.DateTimeFormat(
        'pt-BR',
        {
          dateStyle: 'short',
          timeStyle: 'short',
        },
      ).format(new Date());

    const reportTitle =
      isSalesReport
        ? 'Relatório de vendas'
        : 'Relatório de dispositivos';

    const summaryHtml =
      isSalesReport
        ? `
          <section class="summary">
            <article>
              <span>Vendas encontradas</span>
              <strong>
                ${salesMeta.total}
              </strong>
            </article>

            <article>
              <span>Faturamento</span>
              <strong>
                ${escapeHtml(
                  formatCurrency(
                    salesMeta.totalRevenue,
                  ),
                )}
              </strong>
            </article>

            <article>
              <span>Custo total</span>
              <strong>
                ${escapeHtml(
                  formatCurrency(
                    salesMeta.totalCost,
                  ),
                )}
              </strong>
            </article>

            <article>
              <span>Lucro total</span>
              <strong>
                ${escapeHtml(
                  formatCurrency(
                    salesMeta.totalProfit,
                  ),
                )}
              </strong>
            </article>

            <article>
              <span>Ticket médio</span>
              <strong>
                ${escapeHtml(
                  formatCurrency(
                    salesMeta.averageTicket,
                  ),
                )}
              </strong>
            </article>
          </section>
        `
        : `
          <section class="summary">
            <article>
              <span>
                Dispositivos encontrados
              </span>

              <strong>
                ${devicesMeta.total}
              </strong>
            </article>

            <article>
              <span>Disponíveis</span>

              <strong>
                ${devicesMeta.available}
              </strong>
            </article>

            <article>
              <span>Reservados</span>

              <strong>
                ${devicesMeta.reserved}
              </strong>
            </article>

            <article>
              <span>Vendidos</span>

              <strong>
                ${devicesMeta.sold}
              </strong>
            </article>

            <article>
              <span>Valor de compra</span>

              <strong>
                ${escapeHtml(
                  formatCurrency(
                    devicesMeta
                      .totalPurchaseValue,
                  ),
                )}
              </strong>
            </article>

            <article>
              <span>Valor potencial</span>

              <strong>
                ${escapeHtml(
                  formatCurrency(
                    devicesMeta
                      .totalSaleValue,
                  ),
                )}
              </strong>
            </article>

            <article>
              <span>Lucro potencial</span>

              <strong>
                ${escapeHtml(
                  formatCurrency(
                    devicesMeta
                      .potentialProfit,
                  ),
                )}
              </strong>
            </article>
          </section>
        `;

    const tableRows =
      isSalesReport
        ? sales
            .map((sale) => {
              const profit =
                sale.salePrice -
                sale.purchasePrice;

              return `
                <tr>
                  <td>
                    ${escapeHtml(
                      formatDate(
                        sale.soldAt,
                      ),
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      `${sale.deviceBrand} ${sale.deviceModel}`,
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      sale.deviceImei,
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      sale.customerName,
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      getPaymentMethodLabel(
                        sale.paymentMethod,
                      ),
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      formatCurrency(
                        sale.purchasePrice,
                      ),
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      formatCurrency(
                        sale.salePrice,
                      ),
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      formatCurrency(
                        profit,
                      ),
                    )}
                  </td>
                </tr>
              `;
            })
            .join('')
        : devices
            .map(
              (device) => `
                <tr>
                  <td>
                    ${escapeHtml(
                      formatDate(
                        device.entryDate,
                      ),
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      `${device.brand} ${device.model}`,
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      device.storage,
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      device.imei,
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      device.supplier ||
                        'Não informado',
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      getDeviceConditionLabel(
                        device.condition,
                      ),
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      getDeviceStatusLabel(
                        device.status,
                      ),
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      formatCurrency(
                        device.purchasePrice,
                      ),
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      formatCurrency(
                        device.salePrice,
                      ),
                    )}
                  </td>
                </tr>
              `,
            )
            .join('');

    const tableHeader =
      isSalesReport
        ? `
          <tr>
            <th>Data</th>
            <th>Dispositivo</th>
            <th>IMEI</th>
            <th>Comprador</th>
            <th>Pagamento</th>
            <th>Compra</th>
            <th>Venda</th>
            <th>Lucro</th>
          </tr>
        `
        : `
          <tr>
            <th>Entrada</th>
            <th>Dispositivo</th>
            <th>Armazenamento</th>
            <th>IMEI</th>
            <th>Fornecedor</th>
            <th>Condição</th>
            <th>Status</th>
            <th>Compra</th>
            <th>Venda</th>
          </tr>
        `;

    const printHtml = `
      <!DOCTYPE html>

      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1"
          />

          <title>
            ${escapeHtml(reportTitle)}
          </title>

          <style>
            @page {
              size: A4 landscape;
              margin: 12mm;
            }

            * {
              box-sizing: border-box;
            }

            html,
            body {
              margin: 0;
              padding: 0;

              color: #111827;
              background: #ffffff;

              font-family:
                Arial,
                Helvetica,
                sans-serif;
            }

            body {
              padding: 4px;
            }

            header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 24px;

              margin-bottom: 20px;
              padding-bottom: 14px;

              border-bottom: 2px solid
                #111827;
            }

            h1 {
              margin: 0 0 6px;
              font-size: 24px;
            }

            header p {
              margin: 0;

              color: #4b5563;
              font-size: 12px;
            }

            .store {
              text-align: right;
            }

            .store strong {
              display: block;

              margin-bottom: 4px;
              font-size: 16px;
            }

            .summary {
              display: grid;
              grid-template-columns:
                repeat(
                  4,
                  minmax(0, 1fr)
                );
              gap: 10px;

              margin-bottom: 22px;
            }

            .summary article {
              display: flex;
              flex-direction: column;
              gap: 6px;

              padding: 12px;

              border: 1px solid
                #d1d5db;
              border-radius: 8px;

              break-inside: avoid;
            }

            .summary span {
              color: #6b7280;
              font-size: 11px;
            }

            .summary strong {
              font-size: 16px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            thead {
              display: table-header-group;
            }

            tr {
              break-inside: avoid;
            }

            th,
            td {
              padding: 7px;

              border: 1px solid
                #d1d5db;

              font-size: 9px;
              text-align: left;
              vertical-align: middle;
            }

            th {
              background: #f3f4f6;

              font-size: 8px;
              text-transform: uppercase;
            }

            footer {
              margin-top: 18px;
              padding-top: 10px;

              border-top: 1px solid
                #d1d5db;

              color: #6b7280;
              font-size: 10px;
              text-align: center;
            }

            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust:
                  exact;
              }
            }
          </style>
        </head>

        <body>
          <header>
            <div>
              <h1>
                ${escapeHtml(
                  reportTitle,
                )}
              </h1>

              <p>
                Dados obtidos de acordo
                com os filtros aplicados
                no sistema.
              </p>
            </div>

            <div class="store">
              <strong>
                Phone Store
              </strong>

              <p>
                Emitido em
                ${escapeHtml(generatedAt)}
              </p>
            </div>
          </header>

          ${summaryHtml}

          <table>
            <thead>
              ${tableHeader}
            </thead>

            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <footer>
            Phone Store — Relatório
            gerado pelo sistema de
            gerenciamento
          </footer>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(
      printHtml,
    );
    printWindow.document.close();

    const openPrintDialog = () => {
      printWindow.focus();
      printWindow.print();
    };

    printWindow.onafterprint = () => {
      printWindow.close();
    };

    window.setTimeout(
      openPrintDialog,
      600,
    );
  }

  return (
    <main className="reports">
      <section className="reports__heading">
        <div>
          <h1>Relatórios</h1>

          <p>
            Consulte vendas e dispositivos usando
            filtros específicos.
          </p>
        </div>
      </section>

      <section className="reports__tabs">
        <button
          type="button"
          className={
            activeTab === 'sales'
              ? 'reports__tab reports__tab--active'
              : 'reports__tab'
          }
          onClick={() =>
            handleTabChange('sales')
          }
        >
          <BadgeDollarSign size={19} />
          Relatório de vendas
        </button>

        <button
          type="button"
          className={
            activeTab === 'devices'
              ? 'reports__tab reports__tab--active'
              : 'reports__tab'
          }
          onClick={() =>
            handleTabChange('devices')
          }
        >
          <Smartphone size={19} />
          Relatório de dispositivos
        </button>
      </section>

      {loadError && (
        <div
          className="reports__error"
          role="alert"
        >
          {loadError}
        </div>
      )}

      {activeTab === 'sales' ? (
        <>
          <section className="reports__filter-card">
            <div className="reports__section-heading">
              <div>
                <h2>
                  Filtros de vendas
                </h2>

                <p>
                  Pesquise por período,
                  comprador, IMEI ou
                  dispositivo.
                </p>
              </div>

              <CalendarDays size={22} />
            </div>

            <form
              className="reports__filters"
              onSubmit={
                handleSalesSubmit
              }
            >
              <label>
                <span>Data inicial</span>

                <input
                  type="date"
                  value={
                    salesFilters.startDate ??
                    ''
                  }
                  onChange={(event) =>
                    setSalesFilters(
                      (current) => ({
                        ...current,
                        startDate:
                          event.target
                            .value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                <span>Data final</span>

                <input
                  type="date"
                  value={
                    salesFilters.endDate ??
                    ''
                  }
                  onChange={(event) =>
                    setSalesFilters(
                      (current) => ({
                        ...current,
                        endDate:
                          event.target
                            .value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                <span>IMEI</span>

                <input
                  type="text"
                  placeholder="Digite o IMEI"
                  value={
                    salesFilters.imei ??
                    ''
                  }
                  onChange={(event) =>
                    setSalesFilters(
                      (current) => ({
                        ...current,
                        imei:
                          event.target
                            .value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                <span>
                  Nome do comprador
                </span>

                <input
                  type="text"
                  placeholder="Digite o nome"
                  value={
                    salesFilters
                      .customerName ??
                    ''
                  }
                  onChange={(event) =>
                    setSalesFilters(
                      (current) => ({
                        ...current,
                        customerName:
                          event.target
                            .value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                <span>
                  Nome do dispositivo
                </span>

                <input
                  type="text"
                  placeholder="Marca ou modelo"
                  value={
                    salesFilters
                      .deviceName ??
                    ''
                  }
                  onChange={(event) =>
                    setSalesFilters(
                      (current) => ({
                        ...current,
                        deviceName:
                          event.target
                            .value,
                      }),
                    )
                  }
                />
              </label>

              <div className="reports__filter-actions">
                <button
                  type="button"
                  className="reports__clear"
                  onClick={
                    handleClearSalesFilters
                  }
                >
                  <RotateCcw size={17} />
                  Limpar
                </button>

                <button
                  type="submit"
                  className="reports__search"
                  disabled={isLoading}
                >
                  <Search size={17} />

                  {isLoading
                    ? 'Pesquisando...'
                    : 'Pesquisar'}
                </button>
              </div>
            </form>
          </section>

          <section className="reports__summary">
            <article className="reports__summary-card">
              <BadgeDollarSign
                size={22}
              />

              <div>
                <span>
                  Vendas encontradas
                </span>

                <strong>
                  {salesMeta.total}
                </strong>
              </div>
            </article>

            <article className="reports__summary-card">
              <CircleDollarSign
                size={22}
              />

              <div>
                <span>Faturamento</span>

                <strong>
                  {formatCurrency(
                    salesMeta
                      .totalRevenue,
                  )}
                </strong>
              </div>
            </article>

            <article className="reports__summary-card">
              <PackageCheck size={22} />

              <div>
                <span>Lucro</span>

                <strong>
                  {formatCurrency(
                    salesMeta
                      .totalProfit,
                  )}
                </strong>
              </div>
            </article>

            <article className="reports__summary-card">
              <CircleDollarSign
                size={22}
              />

              <div>
                <span>Ticket médio</span>

                <strong>
                  {formatCurrency(
                    salesMeta
                      .averageTicket,
                  )}
                </strong>
              </div>
            </article>
          </section>

          <section className="reports__results">
            <div className="reports__section-heading">
              <div>
                <h2>
                  Resultado das vendas
                </h2>

                <p>
                  Registros encontrados
                  de acordo com os filtros
                  informados.
                </p>
              </div>

              <button
                type="button"
                className="reports__print"
                onClick={
                  handlePrintReport
                }
                disabled={
                  isLoading ||
                  sales.length === 0
                }
                aria-label="Imprimir relatório de vendas"
                title="Imprimir relatório"
              >
                <Printer size={19} />
              </button>
            </div>

            {isLoading ? (
              <div className="reports__state">
                Carregando vendas...
              </div>
            ) : sales.length > 0 ? (
              <div className="reports__table-container">
                <table className="reports__table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Dispositivo</th>
                      <th>IMEI</th>
                      <th>Comprador</th>
                      <th>Pagamento</th>
                      <th>Valor</th>
                      <th>Lucro</th>
                      <th />
                    </tr>
                  </thead>

                  <tbody>
                    {sales.map(
                      (sale) => {
                        const profit =
                          sale.salePrice -
                          sale.purchasePrice;

                        return (
                          <tr key={sale.id}>
                            <td>
                              {formatDate(
                                sale.soldAt,
                              )}
                            </td>

                            <td>
                              <strong>
                                {
                                  sale.deviceBrand
                                }{' '}
                                {
                                  sale.deviceModel
                                }
                              </strong>
                            </td>

                            <td>
                              {
                                sale.deviceImei
                              }
                            </td>

                            <td>
                              {
                                sale.customerName
                              }
                            </td>

                            <td>
                              {getPaymentMethodLabel(
                                sale.paymentMethod,
                              )}
                            </td>

                            <td>
                              {formatCurrency(
                                sale.salePrice,
                              )}
                            </td>

                            <td>
                              {formatCurrency(
                                profit,
                              )}
                            </td>

                            <td>
                              <Link
                                to={`/vendas/${sale.id}`}
                              >
                                Detalhes
                              </Link>
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="reports__state">
                Nenhuma venda encontrada.
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          <section className="reports__filter-card">
            <div className="reports__section-heading">
              <div>
                <h2>
                  Filtros de dispositivos
                </h2>

                <p>
                  Pesquise por período,
                  IMEI, fornecedor,
                  dispositivo ou status.
                </p>
              </div>

              <Truck size={22} />
            </div>

            <form
              className="reports__filters"
              onSubmit={
                handleDevicesSubmit
              }
            >
              <label>
                <span>Data inicial</span>

                <input
                  type="date"
                  value={
                    devicesFilters
                      .startDate ??
                    ''
                  }
                  onChange={(event) =>
                    setDevicesFilters(
                      (current) => ({
                        ...current,
                        startDate:
                          event.target
                            .value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                <span>Data final</span>

                <input
                  type="date"
                  value={
                    devicesFilters
                      .endDate ??
                    ''
                  }
                  onChange={(event) =>
                    setDevicesFilters(
                      (current) => ({
                        ...current,
                        endDate:
                          event.target
                            .value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                <span>IMEI</span>

                <input
                  type="text"
                  placeholder="Digite o IMEI"
                  value={
                    devicesFilters.imei ??
                    ''
                  }
                  onChange={(event) =>
                    setDevicesFilters(
                      (current) => ({
                        ...current,
                        imei:
                          event.target
                            .value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                <span>Fornecedor</span>

                <input
                  type="text"
                  placeholder="Nome do fornecedor"
                  value={
                    devicesFilters
                      .supplier ??
                    ''
                  }
                  onChange={(event) =>
                    setDevicesFilters(
                      (current) => ({
                        ...current,
                        supplier:
                          event.target
                            .value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                <span>
                  Nome do dispositivo
                </span>

                <input
                  type="text"
                  placeholder="Marca ou modelo"
                  value={
                    devicesFilters
                      .deviceName ??
                    ''
                  }
                  onChange={(event) =>
                    setDevicesFilters(
                      (current) => ({
                        ...current,
                        deviceName:
                          event.target
                            .value,
                      }),
                    )
                  }
                />
              </label>

              <label>
                <span>Status</span>

                <select
                  value={
                    devicesFilters.status ??
                    ''
                  }
                  onChange={(event) =>
                    setDevicesFilters(
                      (current) => ({
                        ...current,

                        status:
                          event.target.value
                            ? (event
                                .target
                                .value as Device['status'])
                            : undefined,
                      }),
                    )
                  }
                >
                  <option value="">
                    Todos
                  </option>

                  <option value="DISPONIVEL">
                    Disponível
                  </option>

                  <option value="RESERVADO">
                    Reservado
                  </option>

                  <option value="VENDIDO">
                    Vendido
                  </option>
                </select>
              </label>

              <div className="reports__filter-actions">
                <button
                  type="button"
                  className="reports__clear"
                  onClick={
                    handleClearDevicesFilters
                  }
                >
                  <RotateCcw size={17} />
                  Limpar
                </button>

                <button
                  type="submit"
                  className="reports__search"
                  disabled={isLoading}
                >
                  <Search size={17} />

                  {isLoading
                    ? 'Pesquisando...'
                    : 'Pesquisar'}
                </button>
              </div>
            </form>
          </section>

          <section className="reports__summary">
            <article className="reports__summary-card">
              <Smartphone size={22} />

              <div>
                <span>
                  Dispositivos encontrados
                </span>

                <strong>
                  {devicesMeta.total}
                </strong>
              </div>
            </article>

            <article className="reports__summary-card">
              <PackageCheck size={22} />

              <div>
                <span>Disponíveis</span>

                <strong>
                  {
                    devicesMeta.available
                  }
                </strong>
              </div>
            </article>

            <article className="reports__summary-card">
              <BadgeDollarSign
                size={22}
              />

              <div>
                <span>Vendidos</span>

                <strong>
                  {devicesMeta.sold}
                </strong>
              </div>
            </article>

            <article className="reports__summary-card">
              <CircleDollarSign
                size={22}
              />

              <div>
                <span>
                  Valor potencial
                </span>

                <strong>
                  {formatCurrency(
                    devicesMeta
                      .totalSaleValue,
                  )}
                </strong>
              </div>
            </article>
          </section>

          <section className="reports__results">
            <div className="reports__section-heading">
              <div>
                <h2>
                  Resultado dos dispositivos
                </h2>

                <p>
                  Registros encontrados
                  de acordo com os filtros
                  informados.
                </p>
              </div>

              <button
                type="button"
                className="reports__print"
                onClick={
                  handlePrintReport
                }
                disabled={
                  isLoading ||
                  devices.length === 0
                }
                aria-label="Imprimir relatório de dispositivos"
                title="Imprimir relatório"
              >
                <Printer size={19} />
              </button>
            </div>

            {isLoading ? (
              <div className="reports__state">
                Carregando dispositivos...
              </div>
            ) : devices.length > 0 ? (
              <div className="reports__table-container">
                <table className="reports__table">
                  <thead>
                    <tr>
                      <th>Entrada</th>
                      <th>Dispositivo</th>
                      <th>IMEI</th>
                      <th>Fornecedor</th>
                      <th>Condição</th>
                      <th>Status</th>
                      <th>Valor</th>
                      <th />
                    </tr>
                  </thead>

                  <tbody>
                    {devices.map(
                      (device) => (
                        <tr
                          key={
                            device.id
                          }
                        >
                          <td>
                            {formatDate(
                              device.entryDate,
                            )}
                          </td>

                          <td>
                            <strong>
                              {
                                device.brand
                              }{' '}
                              {
                                device.model
                              }
                            </strong>
                          </td>

                          <td>
                            {device.imei}
                          </td>

                          <td>
                            {device.supplier ||
                              'Não informado'}
                          </td>

                          <td>
                            {getDeviceConditionLabel(
                              device.condition,
                            )}
                          </td>

                          <td>
                            <span
                              className={`reports__status reports__status--${device.status.toLowerCase()}`}
                            >
                              {getDeviceStatusLabel(
                                device.status,
                              )}
                            </span>
                          </td>

                          <td>
                            {formatCurrency(
                              device.salePrice,
                            )}
                          </td>

                          <td>
                            <Link
                              to={`/dispositivos/${device.id}`}
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
            ) : (
              <div className="reports__state">
                Nenhum dispositivo encontrado.
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}