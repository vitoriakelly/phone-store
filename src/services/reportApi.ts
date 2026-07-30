import type {
  CommissionsReportFilters,
  CommissionsReportResponse,
  DevicesReportFilters,
  DevicesReportResponse,
  SalesReportFilters,
  SalesReportResponse,
} from '../types/report';

import { apiRequest } from './api';

function createQueryParams(
  filters: Record<
    string,
    string | undefined
  >,
) {
  const queryParams =
    new URLSearchParams();

  Object.entries(filters).forEach(
    ([key, value]) => {
      const normalizedValue =
        value?.trim();

      if (normalizedValue) {
        queryParams.set(
          key,
          normalizedValue,
        );
      }
    },
  );

  const queryString =
    queryParams.toString();

  return queryString
    ? `?${queryString}`
    : '';
}

export async function getSalesReport(
  filters: SalesReportFilters = {},
): Promise<SalesReportResponse> {
  const queryString =
    createQueryParams({
      startDate: filters.startDate,
      endDate: filters.endDate,
      imei: filters.imei,
      customerName:
        filters.customerName,
      deviceName: filters.deviceName,
      sellerId: filters.sellerId,
    });

  return apiRequest<SalesReportResponse>(
    `/reports/sales${queryString}`,
  );
}

export async function getDevicesReport(
  filters: DevicesReportFilters = {},
): Promise<DevicesReportResponse> {
  const queryString =
    createQueryParams({
      startDate: filters.startDate,
      endDate: filters.endDate,
      imei: filters.imei,
      supplier: filters.supplier,
      deviceName: filters.deviceName,
      status: filters.status,
    });

  return apiRequest<DevicesReportResponse>(
    `/reports/devices${queryString}`,
  );
}

export async function getCommissionsReport(
  filters: CommissionsReportFilters = {},
): Promise<CommissionsReportResponse> {
  const queryString =
    createQueryParams({
      startDate: filters.startDate,
      endDate: filters.endDate,
      sellerId: filters.sellerId,
    });

  return apiRequest<CommissionsReportResponse>(
    `/reports/commissions${queryString}`,
  );
}