import type {
  CreateSaleInput,
  Sale,
} from '../types/sale';

import { apiRequest } from './api';

export interface SaleSummary {
  total: number;
  totalRevenue: number;
  totalProfit: number;
}

export interface SaleListResponse {
  data: Sale[];
  meta: SaleSummary;
}

export interface SaleListFilters {
  sellerId?: string;
}

interface CreateSaleResponse {
  message: string;
  data: Sale;
}

interface SaleDetailsResponse {
  data: Sale;
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
  const searchParams =
    new URLSearchParams();

  if (filters.sellerId) {
    searchParams.set(
      'sellerId',
      filters.sellerId,
    );
  }

  const queryString =
    searchParams.toString();

  const endpoint = queryString
    ? `/sales?${queryString}`
    : '/sales';

  return apiRequest<SaleListResponse>(
    endpoint,
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