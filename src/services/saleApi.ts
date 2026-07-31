import type {
  DeviceCondition,
} from '../types/device';
import type {
  CreateSaleInput,
  PaymentMethod,
  Sale,
} from '../types/sale';

import { apiRequest } from './api';

export interface SaleSummary {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;

  totalRevenue: number;
  totalProfit: number;
  totalCommission: number;
  totalProfitAfterCommission: number;
  averageTicket: number;
}

export interface SaleListResponse {
  data: Sale[];
  meta: SaleSummary;

  filters: {
    page: number;
    search?: string;
    paymentMethod?: PaymentMethod;
    sellerId?: string;
    deviceCondition?: DeviceCondition;
    startDate?: string;
    endDate?: string;
  };
}

export interface SaleListFilters {
  page?: number;
  search?: string;
  paymentMethod?: PaymentMethod;
  sellerId?: string;
  deviceCondition?: DeviceCondition;
  startDate?: string;
  endDate?: string;
}

interface CreateSaleResponse {
  message: string;
  data: Sale;
}

interface SaleDetailsResponse {
  data: Sale;
}

function createQueryString(
  filters: SaleListFilters,
) {
  const searchParams =
    new URLSearchParams();

  if (filters.page) {
    searchParams.set(
      'page',
      String(filters.page),
    );
  }

  if (filters.search?.trim()) {
    searchParams.set(
      'search',
      filters.search.trim(),
    );
  }

  if (filters.paymentMethod) {
    searchParams.set(
      'paymentMethod',
      filters.paymentMethod,
    );
  }

  if (filters.sellerId) {
    searchParams.set(
      'sellerId',
      filters.sellerId,
    );
  }

  if (filters.deviceCondition) {
    searchParams.set(
      'deviceCondition',
      filters.deviceCondition,
    );
  }

  if (filters.startDate) {
    searchParams.set(
      'startDate',
      filters.startDate,
    );
  }

  if (filters.endDate) {
    searchParams.set(
      'endDate',
      filters.endDate,
    );
  }

  const queryString =
    searchParams.toString();

  return queryString
    ? `?${queryString}`
    : '';
}

export async function createSale(
  data: CreateSaleInput,
): Promise<Sale> {
  const response =
    await apiRequest<CreateSaleResponse>(
      '/sales',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    );

  return response.data;
}

export async function listSales(
  filters: SaleListFilters = {},
): Promise<SaleListResponse> {
  return apiRequest<SaleListResponse>(
    `/sales${createQueryString(
      filters,
    )}`,
  );
}

export async function getSaleById(
  saleId: string,
): Promise<Sale> {
  const response =
    await apiRequest<SaleDetailsResponse>(
      `/sales/${saleId}`,
    );

  return response.data;
}