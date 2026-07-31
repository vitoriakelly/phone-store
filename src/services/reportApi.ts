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
    string | number | undefined
  >,
) {
  const queryParams =
    new URLSearchParams();

  Object.entries(filters).forEach(
    ([key, value]) => {
      if (
        value === undefined ||
        value === ''
      ) {
        return;
      }

      queryParams.set(
        key,
        String(value).trim(),
      );
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
      page: filters.page ?? 1,
      startDate: filters.startDate,
      endDate: filters.endDate,
      imei: filters.imei,
      customerName:
        filters.customerName,
      deviceName: filters.deviceName,
      sellerId: filters.sellerId,
      paymentMethod:
        filters.paymentMethod,
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
      page: filters.page ?? 1,
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
      page: filters.page ?? 1,
      startDate: filters.startDate,
      endDate: filters.endDate,
      sellerId: filters.sellerId,
    });

  return apiRequest<CommissionsReportResponse>(
    `/reports/commissions${queryString}`,
  );
}