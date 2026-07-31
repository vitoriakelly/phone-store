import type {
  Device,
  DeviceCondition,
} from './device';
import type {
  CommissionType,
  PaymentMethod,
  Sale,
} from './sale';

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface SalesReportFilters {
  page?: number;
  startDate?: string;
  endDate?: string;
  imei?: string;
  customerName?: string;
  deviceName?: string;
  sellerId?: string;
  paymentMethod?: PaymentMethod;
}

export interface SalesReportMeta
  extends PaginationMeta {
  totalGrossRevenue: number;
  totalDiscount: number;
  totalRevenue: number;
  totalCost: number;
  totalCommission: number;
  totalProfit: number;
  totalProfitAfterCommission: number;
  averageTicket: number;
}

export interface SalesReportResponse {
  data: Sale[];
  meta: SalesReportMeta;
  filters: SalesReportFilters;
}

export interface DevicesReportFilters {
  page?: number;
  startDate?: string;
  endDate?: string;
  imei?: string;
  supplier?: string;
  deviceName?: string;
  status?: Device['status'];
}

export interface DevicesReportMeta
  extends PaginationMeta {
  /*
   * Indicadores gerais do estoque,
   * independentes dos filtros.
   */
  totalDevices: number;
  pending: number;
  available: number;
  reserved: number;
  sold: number;
  totalPurchaseValue: number;
  totalSaleValue: number;
  potentialProfit: number;
}

export interface DevicesReportResponse {
  data: Device[];
  meta: DevicesReportMeta;
  filters: DevicesReportFilters;
}

export interface CommissionsReportFilters {
  page?: number;
  startDate?: string;
  endDate?: string;
  sellerId?: string;
}

export interface CommissionReportSale {
  id: string;

  sellerId: string | null;
  sellerName: string;

  deviceBrand: string;
  deviceModel: string;
  deviceImei: string;
  deviceCondition:
    DeviceCondition | null;

  customerName: string;
  soldAt: string;

  grossSalePrice: number;
  discountAmount: number;
  salePrice: number;
  purchasePrice: number;

  commissionType:
    CommissionType | null;
  commissionValue: number | null;
  commissionAmount: number;

  profitBeforeCommission: number;
  profitAfterCommission: number;
}

export interface CommissionSellerSummary {
  sellerId: string | null;
  sellerName: string;

  totalSales: number;
  commissionedSales: number;

  grossRevenue: number;
  totalDiscount: number;
  netRevenue: number;
  totalCost: number;
  totalCommission: number;

  profitBeforeCommission: number;
  profitAfterCommission: number;

  averageTicket: number;
  averageCommission: number;
}

export interface CommissionsReportMeta
  extends PaginationMeta {
  totalSales: number;
  commissionedSales: number;
  totalSellers: number;

  totalGrossRevenue: number;
  totalDiscount: number;
  totalNetRevenue: number;
  totalCost: number;
  totalCommission: number;

  totalProfitBeforeCommission: number;
  totalProfitAfterCommission: number;

  averageTicket: number;
  averageCommission: number;
}

export interface CommissionsReportResponse {
  data: CommissionReportSale[];
  sellers: CommissionSellerSummary[];
  meta: CommissionsReportMeta;
  filters: CommissionsReportFilters;
}