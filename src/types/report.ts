import type { Device } from './device';
import type { Sale } from './sale';

export interface SalesReportFilters {
  startDate?: string;
  endDate?: string;
  imei?: string;
  customerName?: string;
  deviceName?: string;
}

export interface SalesReportMeta {
  total: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
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