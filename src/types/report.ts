import type {
  Device,
  DeviceCondition,
} from './device';
import type {
  CommissionType,
  Sale,
} from './sale';

export interface SalesReportFilters {
  startDate?: string;
  endDate?: string;
  imei?: string;
  customerName?: string;
  deviceName?: string;
  sellerId?: string;
}

export interface SalesReportMeta {
  total: number;
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
  startDate?: string;
  endDate?: string;
  imei?: string;
  supplier?: string;
  deviceName?: string;
  status?: Device['status'];
}

export interface DevicesReportMeta {
  total: number;
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
  deviceCondition: DeviceCondition | null;

  customerName: string;
  soldAt: string;

  grossSalePrice: number;
  discountAmount: number;
  salePrice: number;
  purchasePrice: number;

  commissionType: CommissionType | null;
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

export interface CommissionsReportMeta {
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