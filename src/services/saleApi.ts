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

export async function listSales(): Promise<SaleListResponse> {
  return apiRequest<SaleListResponse>(
    '/sales',
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