import {
  BadgeDollarSign,
  CalendarDays,
  CircleDollarSign,
  PackageCheck,
  Percent,
  Printer,
  RotateCcw,
  Search,
  Smartphone,
  Truck,
  Users,
} from 'lucide-react';
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useState,
} from 'react';
import { Link } from 'react-router-dom';

import { ApiError } from '../../services/api';
import {
  getCommissionsReport,
  getDevicesReport,
  getSalesReport,
} from '../../services/reportApi';
import { listSellers } from '../../services/userApi';
import type { Device } from '../../types/device';
import type {
  CommissionReportSale,
  CommissionsReportFilters,
  CommissionsReportMeta,
  CommissionSellerSummary,
  DevicesReportFilters,
  DevicesReportMeta,
  PaginationMeta,
  SalesReportFilters,
  SalesReportMeta,
} from '../../types/report';
import type {
  CommissionType,
  PaymentMethod,
  Sale,
  SalePayment,
} from '../../types/sale';
import type { Seller } from '../../types/user';
import { formatCurrency } from '../../utils/currency';

import './styles.scss';

type ReportTab =
  | 'sales'
  | 'devices'
  | 'commissions';


function getCurrentDate() {
  const currentDate = new Date();

  const timezoneOffset =
    currentDate.getTimezoneOffset() *
    60_000;

  return new Date(
    currentDate.getTime() -
      timezoneOffset,
  )
    .toISOString()
    .split('T')[0];
}

const currentDate =
  getCurrentDate();

const initialSalesFilters: SalesReportFilters = {
  page: 1,
  startDate: currentDate,
  endDate: currentDate,
  imei: '',
  customerName: '',
  deviceName: '',
  sellerId: '',
  paymentMethod: undefined,
};

/*
 * A tabela e os indicadores do período
 * iniciam usando a data atual.
 *
 * Os cards Dispositivos, Pendentes e
 * Disponíveis continuam mostrando os
 * totais gerais enviados pelo backend.
 */
const initialDevicesFilters: DevicesReportFilters = {
  page: 1,
  startDate: currentDate,
  endDate: currentDate,
  imei: '',
  supplier: '',
  deviceName: '',
  status: undefined,
};

const initialCommissionsFilters:
  CommissionsReportFilters = {
    page: 1,
    startDate: currentDate,
    endDate: currentDate,
    sellerId: '',
  };

const initialSalesMeta: SalesReportMeta = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
  totalGrossRevenue: 0,
  totalDiscount: 0,
  totalRevenue: 0,
  totalCost: 0,
  totalCommission: 0,
  totalProfit: 0,
  totalProfitAfterCommission: 0,
  averageTicket: 0,
};

const initialDevicesMeta: DevicesReportMeta = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalDevices: 0,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
  pending: 0,
  available: 0,
  reserved: 0,
  sold: 0,
  totalPurchaseValue: 0,
  totalSaleValue: 0,
  potentialProfit: 0,
};

const initialCommissionsMeta:
  CommissionsReportMeta = {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
    totalSales: 0,
    commissionedSales: 0,
    totalSellers: 0,
    totalGrossRevenue: 0,
    totalDiscount: 0,
    totalNetRevenue: 0,
    totalCost: 0,
    totalCommission: 0,
    totalProfitBeforeCommission: 0,
    totalProfitAfterCommission: 0,
    averageTicket: 0,
    averageCommission: 0,
  };

const dateFormatter =
  new Intl.DateTimeFormat('pt-BR');

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
    parsedDate = new Date(
      Number(dateMatch[1]),
      Number(dateMatch[2]) - 1,
      Number(dateMatch[3]),
      12,
    );
  } else {
    parsedDate = new Date(value);
  }

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return 'Data inválida';
  }

  return dateFormatter.format(
    parsedDate,
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
  const descriptions =
    getSalePayments(sale).map(
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


function getDeviceStatusLabel(
  status: Device['status'],
) {
  const labels: Record<
    Device['status'],
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

function getCommissionTypeLabel(
  type: CommissionType | null,
) {
  if (type === 'PERCENTAGE') {
    return 'Porcentagem';
  }

  if (type === 'FIXED') {
    return 'Valor fixo';
  }

  return 'Sem comissão';
}

function getCommissionRule(
  sale: {
    commissionType:
      CommissionType | null;
    commissionValue: number | null;
  },
) {
  if (
    sale.commissionType ===
      'PERCENTAGE' &&
    sale.commissionValue !== null
  ) {
    return `${sale.commissionValue}%`;
  }

  if (
    sale.commissionType ===
      'FIXED' &&
    sale.commissionValue !== null
  ) {
    return `Fixo: ${formatCurrency(
      sale.commissionValue,
    )}`;
  }

  return 'Sem comissão';
}

function formatNullableCurrency(
  value: number | null,
) {
  if (value === null) {
    return 'Pendente';
  }

  return formatCurrency(value);
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

  const [
    commissionsFilters,
    setCommissionsFilters,
  ] =
    useState<CommissionsReportFilters>(
      initialCommissionsFilters,
    );


  const [sales, setSales] =
    useState<Sale[]>([]);

  const [devices, setDevices] =
    useState<Device[]>([]);

  const [
    commissionSales,
    setCommissionSales,
  ] = useState<
    CommissionReportSale[]
  >([]);

  const [
    commissionSellers,
    setCommissionSellers,
  ] = useState<
    CommissionSellerSummary[]
  >([]);

  const [sellers, setSellers] =
    useState<Seller[]>([]);

  const [salesMeta, setSalesMeta] =
    useState<SalesReportMeta>(
      initialSalesMeta,
    );

  const [devicesMeta, setDevicesMeta] =
    useState<DevicesReportMeta>(
      initialDevicesMeta,
    );

  const [
    commissionsMeta,
    setCommissionsMeta,
  ] = useState<CommissionsReportMeta>(
    initialCommissionsMeta,
  );

  const [isLoading, setIsLoading] =
    useState(false);

  const [
    isLoadingSellers,
    setIsLoadingSellers,
  ] = useState(true);

  const [loadError, setLoadError] =
    useState('');

  const [
    hasLoadedDevices,
    setHasLoadedDevices,
  ] = useState(false);

  const [
    hasLoadedCommissions,
    setHasLoadedCommissions,
  ] = useState(false);

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

      setLoadError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível carregar o relatório de vendas.',
      );
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
      setHasLoadedDevices(true);
    } catch (error) {
      setDevices([]);
      setDevicesMeta(
        initialDevicesMeta,
      );

      setLoadError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível carregar o relatório de dispositivos.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loadCommissionsReport(
    filters:
      CommissionsReportFilters,
  ) {
    setIsLoading(true);
    setLoadError('');

    try {
      const response =
        await getCommissionsReport(
          filters,
        );

      setCommissionSales(
        response.data,
      );

      setCommissionSellers(
        response.sellers,
      );

      setCommissionsMeta(
        response.meta,
      );

      setHasLoadedCommissions(true);
    } catch (error) {
      setCommissionSales([]);
      setCommissionSellers([]);

      setCommissionsMeta(
        initialCommissionsMeta,
      );

      setLoadError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível carregar o relatório de comissões.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSalesReport(
      initialSalesFilters,
    );

    let isMounted = true;

    async function loadSellers() {
      setIsLoadingSellers(true);

      try {
        const response =
          await listSellers();

        if (isMounted) {
          setSellers(response);
        }
      } catch {
        if (isMounted) {
          setSellers([]);
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

  function handleTabChange(
    tab: ReportTab,
  ) {
    setActiveTab(tab);
    setLoadError('');

    if (
      tab === 'devices' &&
      !hasLoadedDevices
    ) {
      void loadDevicesReport(
        devicesFilters,
      );
    }

    if (
      tab === 'commissions' &&
      !hasLoadedCommissions
    ) {
      void loadCommissionsReport(
        commissionsFilters,
      );
    }
  }

  function handleSalesSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const nextFilters = {
      ...salesFilters,
      page: 1,
    };

    setSalesFilters(nextFilters);
    void loadSalesReport(nextFilters);
  }

  function handleDevicesSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const nextFilters = {
      ...devicesFilters,
      page: 1,
    };

    setDevicesFilters(nextFilters);
    void loadDevicesReport(nextFilters);
  }

  function handleCommissionsSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const nextFilters = {
      ...commissionsFilters,
      page: 1,
    };

    setCommissionsFilters(nextFilters);
    void loadCommissionsReport(nextFilters);
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

  function handleClearCommissionsFilters() {
    setCommissionsFilters(
      initialCommissionsFilters,
    );

    void loadCommissionsReport(
      initialCommissionsFilters,
    );
  }

  /*
   * Os filtros e a paginação são aplicados
   * pelo backend. A tela recebe somente os
   * 10 registros da página atual.
   */
  const filteredSales = sales;
  const displayedSalesMeta = salesMeta;

  function handleSalesPageChange(
    page: number,
  ) {
    const nextFilters = {
      ...salesFilters,
      page,
    };

    setSalesFilters(nextFilters);
    void loadSalesReport(nextFilters);
  }

  function handleDevicesPageChange(
    page: number,
  ) {
    const nextFilters = {
      ...devicesFilters,
      page,
    };

    setDevicesFilters(nextFilters);
    void loadDevicesReport(nextFilters);
  }

  function handleCommissionsPageChange(
    page: number,
  ) {
    const nextFilters = {
      ...commissionsFilters,
      page,
    };

    setCommissionsFilters(nextFilters);
    void loadCommissionsReport(
      nextFilters,
    );
  }

  function handlePrintReport() {
    const generatedAt =
      new Intl.DateTimeFormat(
        'pt-BR',
        {
          dateStyle: 'short',
          timeStyle: 'short',
        },
      ).format(new Date());

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

    let reportTitle = '';
    let summaryHtml = '';
    let tablesHtml = '';

    if (activeTab === 'sales') {
      if (filteredSales.length === 0) {
        printWindow.close();

        setLoadError(
          'Não existem vendas para imprimir.',
        );

        return;
      }

      reportTitle =
        'Relatório de vendas';

      summaryHtml = `
        <section class="summary">
          <article><span>Vendas</span><strong>${displayedSalesMeta.total}</strong></article>
          <article><span>Valor bruto</span><strong>${escapeHtml(formatCurrency(displayedSalesMeta.totalGrossRevenue))}</strong></article>
          <article><span>Descontos</span><strong>${escapeHtml(formatCurrency(displayedSalesMeta.totalDiscount))}</strong></article>
          <article><span>Faturamento líquido</span><strong>${escapeHtml(formatCurrency(displayedSalesMeta.totalRevenue))}</strong></article>
          <article><span>Comissões</span><strong>${escapeHtml(formatCurrency(displayedSalesMeta.totalCommission))}</strong></article>
          <article><span>Lucro após comissão</span><strong>${escapeHtml(formatCurrency(displayedSalesMeta.totalProfitAfterCommission))}</strong></article>
        </section>
      `;

      const rows = filteredSales
        .map(
          (sale) => `
            <tr>
              <td>${escapeHtml(formatDate(sale.soldAt))}</td>
              <td>${escapeHtml(sale.sellerName)}</td>
              <td>${escapeHtml(`${sale.deviceBrand} ${sale.deviceModel}`)}</td>
              <td>${escapeHtml(sale.customerName)}</td>
              <td>${escapeHtml(formatCurrency(sale.grossSalePrice))}</td>
              <td>${escapeHtml(formatCurrency(sale.discountAmount))}</td>
              <td>${escapeHtml(formatCurrency(sale.salePrice))}</td>
              <td>${escapeHtml(formatCurrency(sale.commissionAmount))}</td>
              <td>${escapeHtml(formatCurrency(sale.salePrice - sale.purchasePrice - sale.commissionAmount))}</td>
            </tr>
          `,
        )
        .join('');

      tablesHtml = `
        <h2>Vendas</h2>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Vendedor</th>
              <th>Dispositivo</th>
              <th>Comprador</th>
              <th>Bruto</th>
              <th>Desconto</th>
              <th>Líquido</th>
              <th>Comissão</th>
              <th>Lucro final</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    }

    if (activeTab === 'devices') {
      if (devices.length === 0) {
        printWindow.close();

        setLoadError(
          'Não existem dispositivos para imprimir.',
        );

        return;
      }

      reportTitle =
        'Relatório de dispositivos';

      summaryHtml = `
        <section class="summary">
          <article><span>Dispositivos</span><strong>${devicesMeta.totalDevices}</strong></article>
          <article><span>Pendentes</span><strong>${devicesMeta.pending}</strong></article>
          <article><span>Disponíveis</span><strong>${devicesMeta.available}</strong></article>
          <article><span>Reservados</span><strong>${devicesMeta.reserved}</strong></article>
          <article><span>Vendidos</span><strong>${devicesMeta.sold}</strong></article>
          <article><span>Lucro potencial</span><strong>${escapeHtml(formatCurrency(devicesMeta.potentialProfit))}</strong></article>
        </section>
      `;

      const rows = devices
        .map(
          (device) => `
            <tr>
              <td>${escapeHtml(formatDate(device.entryDate))}</td>
              <td>${escapeHtml(`${device.brand} ${device.model}`)}</td>
              <td>${escapeHtml(device.storage)}</td>
              <td>${escapeHtml(device.imei || 'Não informado')}</td>
              <td>${escapeHtml(device.supplier || 'Não informado')}</td>
              <td>${escapeHtml(getDeviceConditionLabel(device.condition))}</td>
              <td>${escapeHtml(getDeviceStatusLabel(device.status))}</td>
              <td>${escapeHtml(formatCurrency(device.purchasePrice))}</td>
              <td>${escapeHtml(formatNullableCurrency(device.salePrice))}</td>
            </tr>
          `,
        )
        .join('');

      tablesHtml = `
        <h2>Dispositivos</h2>
        <table>
          <thead>
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
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    }

    if (activeTab === 'commissions') {
      if (commissionSales.length === 0) {
        printWindow.close();

        setLoadError(
          'Não existem comissões para imprimir.',
        );

        return;
      }

      reportTitle =
        'Relatório de comissões';

      summaryHtml = `
        <section class="summary">
          <article><span>Vendas</span><strong>${commissionsMeta.totalSales}</strong></article>
          <article><span>Vendas com comissão</span><strong>${commissionsMeta.commissionedSales}</strong></article>
          <article><span>Vendedores</span><strong>${commissionsMeta.totalSellers}</strong></article>
          <article><span>Faturamento líquido</span><strong>${escapeHtml(formatCurrency(commissionsMeta.totalNetRevenue))}</strong></article>
          <article><span>Comissões</span><strong>${escapeHtml(formatCurrency(commissionsMeta.totalCommission))}</strong></article>
          <article><span>Lucro após comissão</span><strong>${escapeHtml(formatCurrency(commissionsMeta.totalProfitAfterCommission))}</strong></article>
        </section>
      `;

      const sellerRows =
        commissionSellers
          .map(
            (seller) => `
              <tr>
                <td>${escapeHtml(seller.sellerName)}</td>
                <td>${seller.totalSales}</td>
                <td>${seller.commissionedSales}</td>
                <td>${escapeHtml(formatCurrency(seller.netRevenue))}</td>
                <td>${escapeHtml(formatCurrency(seller.totalDiscount))}</td>
                <td>${escapeHtml(formatCurrency(seller.totalCommission))}</td>
                <td>${escapeHtml(formatCurrency(seller.profitAfterCommission))}</td>
              </tr>
            `,
          )
          .join('');

      const saleRows =
        commissionSales
          .map(
            (sale) => `
              <tr>
                <td>${escapeHtml(formatDate(sale.soldAt))}</td>
                <td>${escapeHtml(sale.sellerName)}</td>
                <td>${escapeHtml(`${sale.deviceBrand} ${sale.deviceModel}`)}</td>
                <td>${escapeHtml(sale.customerName)}</td>
                <td>${escapeHtml(formatCurrency(sale.salePrice))}</td>
                <td>${escapeHtml(getCommissionRule(sale))}</td>
                <td>${escapeHtml(formatCurrency(sale.commissionAmount))}</td>
                <td>${escapeHtml(formatCurrency(sale.profitAfterCommission))}</td>
              </tr>
            `,
          )
          .join('');

      tablesHtml = `
        <h2>Resumo por vendedor</h2>
        <table>
          <thead>
            <tr>
              <th>Vendedor</th>
              <th>Vendas</th>
              <th>Comissionadas</th>
              <th>Faturamento líquido</th>
              <th>Descontos</th>
              <th>Comissão</th>
              <th>Lucro final</th>
            </tr>
          </thead>
          <tbody>${sellerRows}</tbody>
        </table>

        <h2 class="second-title">Detalhamento das vendas</h2>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Vendedor</th>
              <th>Dispositivo</th>
              <th>Comprador</th>
              <th>Valor líquido</th>
              <th>Regra</th>
              <th>Comissão</th>
              <th>Lucro final</th>
            </tr>
          </thead>
          <tbody>${saleRows}</tbody>
        </table>
      `;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <title>${escapeHtml(reportTitle)}</title>

          <style>
            @page {
              size: A4 landscape;
              margin: 12mm;
            }

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              color: #111827;
              font-family: Arial, Helvetica, sans-serif;
            }

            header {
              display: flex;
              justify-content: space-between;
              gap: 20px;
              margin-bottom: 18px;
              padding-bottom: 12px;
              border-bottom: 2px solid #111827;
            }

            h1 {
              margin: 0 0 5px;
              font-size: 23px;
            }

            h2 {
              margin: 0 0 10px;
              font-size: 16px;
            }

            .second-title {
              margin-top: 22px;
            }

            header p {
              margin: 0;
              color: #4b5563;
              font-size: 11px;
            }

            .store {
              text-align: right;
            }

            .summary {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 8px;
              margin-bottom: 18px;
            }

            .summary article {
              display: flex;
              flex-direction: column;
              gap: 5px;
              padding: 10px;
              border: 1px solid #d1d5db;
              border-radius: 6px;
            }

            .summary span {
              color: #6b7280;
              font-size: 10px;
            }

            .summary strong {
              font-size: 14px;
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
              padding: 6px;
              border: 1px solid #d1d5db;
              font-size: 8px;
              text-align: left;
            }

            th {
              background: #f3f4f6;
              text-transform: uppercase;
            }

            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>

        <body>
          <header>
            <div>
              <h1>${escapeHtml(reportTitle)}</h1>
              <p>Dados obtidos conforme os filtros aplicados.</p>
            </div>

            <div class="store">
              <strong>Phone Store</strong>
              <p>Emitido em ${escapeHtml(generatedAt)}</p>
            </div>
          </header>

          ${summaryHtml}
          ${tablesHtml}
        </body>
      </html>
    `);

    printWindow.document.close();

    window.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);

    printWindow.onafterprint = () => {
      printWindow.close();
    };
  }

  return (
    <main className="reports">
      <section className="reports__heading">
        <div>
          <h1>Relatórios</h1>

          <p>
            Consulte vendas,
            dispositivos e comissões.
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
          Vendas
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
          Dispositivos
        </button>

        <button
          type="button"
          className={
            activeTab ===
            'commissions'
              ? 'reports__tab reports__tab--active'
              : 'reports__tab'
          }
          onClick={() =>
            handleTabChange(
              'commissions',
            )
          }
        >
          <Percent size={19} />
          Comissões
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

      {activeTab === 'sales' && (
        <>
          <section className="reports__filter-card">
            <div className="reports__section-heading">
              <div>
                <h2>
                  Filtros de vendas
                </h2>

                <p>
                  Pesquise por período,
                  comprador, vendedor,
                  dispositivo ou pagamento.
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
                <span>Vendedor</span>

                <select
                  value={
                    salesFilters.sellerId ??
                    ''
                  }
                  disabled={
                    isLoadingSellers
                  }
                  onChange={(event) =>
                    setSalesFilters(
                      (current) => ({
                        ...current,
                        sellerId:
                          event.target
                            .value,
                      }),
                    )
                  }
                >
                  <option value="">
                    Todos os vendedores
                  </option>

                  {sellers.map(
                    (seller) => (
                      <option
                        key={seller.id}
                        value={seller.id}
                      >
                        {seller.name}
                      </option>
                    ),
                  )}
                </select>
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
                <span>Comprador</span>

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
                <span>Dispositivo</span>

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

              <label>
                <span>Pagamento</span>

                <select
                  value={
                    salesFilters
                      .paymentMethod ?? ''
                  }
                  onChange={(event) =>
                    setSalesFilters(
                      (current) => ({
                        ...current,

                        paymentMethod:
                          event.target.value
                            ? (event
                                .target
                                .value as PaymentMethod)
                            : undefined,
                      }),
                    )
                  }
                >
                  <option value="">
                    Todas as formas
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
            <SummaryCard
              icon={
                <BadgeDollarSign
                  size={22}
                />
              }
              label="Vendas"
              value={String(
                displayedSalesMeta.total,
              )}
            />

            <SummaryCard
              icon={
                <CircleDollarSign
                  size={22}
                />
              }
              label="Faturamento líquido"
              value={formatCurrency(
                displayedSalesMeta
                  .totalRevenue,
              )}
            />

            <SummaryCard
              icon={
                <CircleDollarSign
                  size={22}
                />
              }
              label="Descontos"
              value={formatCurrency(
                displayedSalesMeta
                  .totalDiscount,
              )}
            />

            <SummaryCard
              icon={<Percent size={22} />}
              label="Comissões"
              value={formatCurrency(
                displayedSalesMeta
                  .totalCommission,
              )}
            />

            <SummaryCard
              icon={
                <PackageCheck
                  size={22}
                />
              }
              label="Lucro após comissão"
              value={formatCurrency(
                displayedSalesMeta
                  .totalProfitAfterCommission,
              )}
            />

            <SummaryCard
              icon={
                <CircleDollarSign
                  size={22}
                />
              }
              label="Ticket médio"
              value={formatCurrency(
                displayedSalesMeta
                  .averageTicket,
              )}
            />
          </section>

          <ReportResultsHeader
            title="Resultado das vendas"
            description="Vendas encontradas conforme os filtros."
            onPrint={handlePrintReport}
            disabled={
              isLoading ||
              filteredSales.length === 0
            }
          />

          <section className="reports__results reports__results--table-only">
            {isLoading ? (
              <ReportState text="Carregando vendas..." />
            ) : filteredSales.length >
              0 ? (
              <div className="reports__table-container">
                <table className="reports__table reports__table--sales">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Vendedor</th>
                      <th>Dispositivo</th>
                      <th>Comprador</th>
                      <th>Pagamento</th>
                      <th>Bruto</th>
                      <th>Desconto</th>
                      <th>Líquido</th>
                      <th>Comissão</th>
                      <th>Lucro final</th>
                      <th />
                    </tr>
                  </thead>

                  <tbody>
                    {filteredSales.map(
                      (sale) => (
                        <tr key={sale.id}>
                          <td>
                            {formatDate(
                              sale.soldAt,
                            )}
                          </td>

                          <td>
                            {sale.sellerName}
                          </td>

                          <td>
                            <strong>
                              {sale.deviceBrand}{' '}
                              {sale.deviceModel}
                            </strong>
                          </td>

                          <td>
                            {sale.customerName}
                          </td>

                          <td>
                            {getPaymentSummary(
                              sale,
                            )}
                          </td>

                          <td>
                            {formatCurrency(
                              sale.grossSalePrice,
                            )}
                          </td>

                          <td>
                            {formatCurrency(
                              sale.discountAmount,
                            )}
                          </td>

                          <td>
                            {formatCurrency(
                              sale.salePrice,
                            )}
                          </td>

                          <td>
                            {formatCurrency(
                              sale.commissionAmount,
                            )}
                          </td>

                          <td>
                            {formatCurrency(
                              sale.salePrice -
                                sale.purchasePrice -
                                sale.commissionAmount,
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
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <ReportState text="Nenhuma venda encontrada." />
            )}

            {!isLoading &&
              salesMeta.total > 0 && (
                <ReportPagination
                  meta={salesMeta}
                  onPageChange={
                    handleSalesPageChange
                  }
                />
              )}
          </section>
        </>
      )}

      {activeTab === 'devices' && (
        <>
          <section className="reports__filter-card">
            <div className="reports__section-heading">
              <div>
                <h2>
                  Filtros de dispositivos
                </h2>

                <p>
                  Dispositivos, pendentes
                  e disponíveis são totais
                  gerais. A tabela e os
                  demais indicadores
                  respeitam os filtros.
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
                <span>Dispositivo</span>

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
                  <option value="PENDENTE_INFORMACOES">
                    Pendente
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
            <SummaryCard
              icon={
                <Smartphone size={22} />
              }
              label="Dispositivos"
              value={String(
                devicesMeta.totalDevices,
              )}
            />

            <SummaryCard
              icon={
                <Smartphone size={22} />
              }
              label="Pendentes"
              value={String(
                devicesMeta.pending,
              )}
            />

            <SummaryCard
              icon={
                <PackageCheck
                  size={22}
                />
              }
              label="Disponíveis"
              value={String(
                devicesMeta.available,
              )}
            />

            <SummaryCard
              icon={
                <BadgeDollarSign
                  size={22}
                />
              }
              label="Vendidos"
              value={String(
                devicesMeta.sold,
              )}
            />

            <SummaryCard
              icon={
                <CircleDollarSign
                  size={22}
                />
              }
              label="Valor potencial"
              value={formatCurrency(
                devicesMeta
                  .totalSaleValue,
              )}
            />

            <SummaryCard
              icon={
                <CircleDollarSign
                  size={22}
                />
              }
              label="Lucro potencial"
              value={formatCurrency(
                devicesMeta
                  .potentialProfit,
              )}
            />
          </section>

          <ReportResultsHeader
            title="Resultado dos dispositivos"
            description="Dispositivos encontrados conforme os filtros."
            onPrint={handlePrintReport}
            disabled={
              isLoading ||
              devices.length === 0
            }
          />

          <section className="reports__results reports__results--table-only">
            {isLoading ? (
              <ReportState text="Carregando dispositivos..." />
            ) : devices.length > 0 ? (
              <div className="reports__table-container">
                <table className="reports__table reports__table--devices">
                  <thead>
                    <tr>
                      <th>Entrada</th>
                      <th>Dispositivo</th>
                      <th>IMEI</th>
                      <th>Fornecedor</th>
                      <th>Condição</th>
                      <th>Status</th>
                      <th>Compra</th>
                      <th>Venda</th>
                      <th />
                    </tr>
                  </thead>

                  <tbody>
                    {devices.map(
                      (device) => (
                        <tr key={device.id}>
                          <td>
                            {formatDate(
                              device.entryDate,
                            )}
                          </td>

                          <td>
                            <strong>
                              {device.brand}{' '}
                              {device.model}
                            </strong>
                          </td>

                          <td>
                            {device.imei ||
                              'Não informado'}
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
                              device.purchasePrice,
                            )}
                          </td>

                          <td>
                            {formatNullableCurrency(
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
              <ReportState text="Nenhum dispositivo encontrado." />
            )}

            {!isLoading &&
              devicesMeta.total > 0 && (
                <ReportPagination
                  meta={devicesMeta}
                  onPageChange={
                    handleDevicesPageChange
                  }
                />
              )}
          </section>
        </>
      )}

      {activeTab ===
        'commissions' && (
        <>
          <section className="reports__filter-card">
            <div className="reports__section-heading">
              <div>
                <h2>
                  Filtros de comissões
                </h2>

                <p>
                  Consulte as comissões
                  por período e vendedor.
                </p>
              </div>

              <Percent size={22} />
            </div>

            <form
              className="reports__filters reports__filters--commissions"
              onSubmit={
                handleCommissionsSubmit
              }
            >
              <label>
                <span>Data inicial</span>

                <input
                  type="date"
                  value={
                    commissionsFilters
                      .startDate ?? ''
                  }
                  onChange={(event) =>
                    setCommissionsFilters(
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
                    commissionsFilters
                      .endDate ?? ''
                  }
                  onChange={(event) =>
                    setCommissionsFilters(
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
                <span>Vendedor</span>

                <select
                  value={
                    commissionsFilters
                      .sellerId ?? ''
                  }
                  disabled={
                    isLoadingSellers
                  }
                  onChange={(event) =>
                    setCommissionsFilters(
                      (current) => ({
                        ...current,
                        sellerId:
                          event.target
                            .value,
                      }),
                    )
                  }
                >
                  <option value="">
                    Todos os vendedores
                  </option>

                  {sellers.map(
                    (seller) => (
                      <option
                        key={seller.id}
                        value={seller.id}
                      >
                        {seller.name}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <div className="reports__filter-actions">
                <button
                  type="button"
                  className="reports__clear"
                  onClick={
                    handleClearCommissionsFilters
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
            <SummaryCard
              icon={
                <BadgeDollarSign
                  size={22}
                />
              }
              label="Vendas"
              value={String(
                commissionsMeta
                  .totalSales,
              )}
            />

            <SummaryCard
              icon={<Percent size={22} />}
              label="Vendas com comissão"
              value={String(
                commissionsMeta
                  .commissionedSales,
              )}
            />

            <SummaryCard
              icon={<Users size={22} />}
              label="Vendedores"
              value={String(
                commissionsMeta
                  .totalSellers,
              )}
            />

            <SummaryCard
              icon={
                <CircleDollarSign
                  size={22}
                />
              }
              label="Faturamento líquido"
              value={formatCurrency(
                commissionsMeta
                  .totalNetRevenue,
              )}
            />

            <SummaryCard
              icon={
                <CircleDollarSign
                  size={22}
                />
              }
              label="Descontos"
              value={formatCurrency(
                commissionsMeta
                  .totalDiscount,
              )}
            />

            <SummaryCard
              icon={<Percent size={22} />}
              label="Comissões"
              value={formatCurrency(
                commissionsMeta
                  .totalCommission,
              )}
            />

            <SummaryCard
              icon={
                <PackageCheck
                  size={22}
                />
              }
              label="Lucro após comissão"
              value={formatCurrency(
                commissionsMeta
                  .totalProfitAfterCommission,
              )}
            />

            <SummaryCard
              icon={
                <CircleDollarSign
                  size={22}
                />
              }
              label="Comissão média"
              value={formatCurrency(
                commissionsMeta
                  .averageCommission,
              )}
            />
          </section>

          <section className="reports__results">
            <div className="reports__section-heading">
              <div>
                <h2>
                  Resumo por vendedor
                </h2>

                <p>
                  Totais consolidados de
                  cada funcionário.
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
                  commissionSales.length ===
                    0
                }
                aria-label="Imprimir relatório de comissões"
                title="Imprimir relatório"
              >
                <Printer size={19} />
              </button>
            </div>

            {isLoading ? (
              <ReportState text="Carregando comissões..." />
            ) : commissionSellers.length >
              0 ? (
              <div className="reports__table-container">
                <table className="reports__table reports__table--commission-summary">
                  <thead>
                    <tr>
                      <th>Vendedor</th>
                      <th>Vendas</th>
                      <th>Comissionadas</th>
                      <th>Faturamento líquido</th>
                      <th>Descontos</th>
                      <th>Comissão</th>
                      <th>Comissão média</th>
                      <th>Lucro final</th>
                    </tr>
                  </thead>

                  <tbody>
                    {commissionSellers.map(
                      (seller) => (
                        <tr
                          key={
                            seller.sellerId ??
                            seller.sellerName
                          }
                        >
                          <td>
                            <strong>
                              {seller.sellerName}
                            </strong>
                          </td>

                          <td>
                            {seller.totalSales}
                          </td>

                          <td>
                            {
                              seller.commissionedSales
                            }
                          </td>

                          <td>
                            {formatCurrency(
                              seller.netRevenue,
                            )}
                          </td>

                          <td>
                            {formatCurrency(
                              seller.totalDiscount,
                            )}
                          </td>

                          <td>
                            <strong className="reports__commission-value">
                              {formatCurrency(
                                seller.totalCommission,
                              )}
                            </strong>
                          </td>

                          <td>
                            {formatCurrency(
                              seller.averageCommission,
                            )}
                          </td>

                          <td>
                            {formatCurrency(
                              seller.profitAfterCommission,
                            )}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <ReportState text="Nenhuma comissão encontrada." />
            )}
          </section>

          <section className="reports__results">
            <div className="reports__section-heading">
              <div>
                <h2>
                  Detalhamento das
                  comissões
                </h2>

                <p>
                  Vendas usadas no cálculo
                  de cada comissão.
                </p>
              </div>
            </div>

            {isLoading ? (
              <ReportState text="Carregando vendas..." />
            ) : commissionSales.length >
              0 ? (
              <div className="reports__table-container">
                <table className="reports__table reports__table--commission-details">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Vendedor</th>
                      <th>Dispositivo</th>
                      <th>Comprador</th>
                      <th>Bruto</th>
                      <th>Desconto</th>
                      <th>Líquido</th>
                      <th>Tipo</th>
                      <th>Regra</th>
                      <th>Comissão</th>
                      <th>Lucro final</th>
                      <th />
                    </tr>
                  </thead>

                  <tbody>
                    {commissionSales.map(
                      (sale) => (
                        <tr key={sale.id}>
                          <td>
                            {formatDate(
                              sale.soldAt,
                            )}
                          </td>

                          <td>
                            {sale.sellerName}
                          </td>

                          <td>
                            <strong>
                              {sale.deviceBrand}{' '}
                              {sale.deviceModel}
                            </strong>
                          </td>

                          <td>
                            {sale.customerName}
                          </td>

                          <td>
                            {formatCurrency(
                              sale.grossSalePrice,
                            )}
                          </td>

                          <td>
                            {formatCurrency(
                              sale.discountAmount,
                            )}
                          </td>

                          <td>
                            {formatCurrency(
                              sale.salePrice,
                            )}
                          </td>

                          <td>
                            {getCommissionTypeLabel(
                              sale.commissionType,
                            )}
                          </td>

                          <td>
                            {getCommissionRule(
                              sale,
                            )}
                          </td>

                          <td>
                            <strong className="reports__commission-value">
                              {formatCurrency(
                                sale.commissionAmount,
                              )}
                            </strong>
                          </td>

                          <td>
                            {formatCurrency(
                              sale.profitAfterCommission,
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
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <ReportState text="Nenhuma venda com comissão encontrada." />
            )}

            {!isLoading &&
              commissionsMeta.total > 0 && (
                <ReportPagination
                  meta={
                    commissionsMeta
                  }
                  onPageChange={
                    handleCommissionsPageChange
                  }
                />
              )}
          </section>
        </>
      )}
    </main>
  );
}

interface SummaryCardProps {
  icon: ReactNode;
  label: string;
  value: string;
}

function SummaryCard({
  icon,
  label,
  value,
}: SummaryCardProps) {
  return (
    <article className="reports__summary-card">
      {icon}

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

interface ReportResultsHeaderProps {
  title: string;
  description: string;
  onPrint: () => void;
  disabled: boolean;
}

function ReportResultsHeader({
  title,
  description,
  onPrint,
  disabled,
}: ReportResultsHeaderProps) {
  return (
    <section className="reports__results reports__results--heading-only">
      <div className="reports__section-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <button
          type="button"
          className="reports__print"
          onClick={onPrint}
          disabled={disabled}
          aria-label={`Imprimir ${title.toLowerCase()}`}
          title="Imprimir relatório"
        >
          <Printer size={19} />
        </button>
      </div>
    </section>
  );
}

interface ReportPaginationProps {
  meta: PaginationMeta;
  onPageChange: (
    page: number,
  ) => void;
}

function ReportPagination({
  meta,
  onPageChange,
}: ReportPaginationProps) {
  const firstResult =
    meta.total === 0
      ? 0
      : (meta.page - 1) *
          meta.pageSize +
        1;

  const lastResult = Math.min(
    meta.page * meta.pageSize,
    meta.total,
  );

  return (
    <nav
      className="reports__pagination"
      aria-label="Paginação do relatório"
    >
      <span>
        Exibindo {firstResult}–
        {lastResult} de {meta.total}{' '}
        resultados
      </span>

      <div>
        <button
          type="button"
          onClick={() =>
            onPageChange(
              meta.page - 1,
            )
          }
          disabled={
            !meta.hasPreviousPage
          }
        >
          Anterior
        </button>

        <strong>
          Página {meta.page} de{' '}
          {Math.max(
            meta.totalPages,
            1,
          )}
        </strong>

        <button
          type="button"
          onClick={() =>
            onPageChange(
              meta.page + 1,
            )
          }
          disabled={
            !meta.hasNextPage
          }
        >
          Próxima
        </button>
      </div>
    </nav>
  );
}

function ReportState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="reports__state">
      {text}
    </div>
  );
}