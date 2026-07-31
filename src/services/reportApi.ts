import type {
  CommissionPaymentStatus,
  CommissionsReportFilters,
  CommissionsReportResponse,
  DevicesReportFilters,
  DevicesReportResponse,
  SalesReportFilters,
  SalesReportResponse,
} from '../types/report';

import { apiRequest } from './api';

interface UpdateCommissionPaymentStatusResponse {
  message: string;

  data: {
    id: string;

    commissionPaymentStatus:
      CommissionPaymentStatus;

    commissionPaidAt:
      string | null;
  };
}

/*
 * O React StrictMode executa os effects duas
 * vezes no ambiente de desenvolvimento.
 *
 * Este Map reaproveita uma requisição GET que
 * já esteja em andamento para o mesmo endpoint,
 * evitando chamadas HTTP duplicadas.
 */
const inFlightReportRequests =
  new Map<string, Promise<unknown>>();

function requestReportOnce<T>(
  endpoint: string,
): Promise<T> {
  const currentRequest =
    inFlightReportRequests.get(
      endpoint,
    ) as Promise<T> | undefined;

  if (currentRequest) {
    return currentRequest;
  }

  const request =
    apiRequest<T>(endpoint).finally(
      () => {
        inFlightReportRequests.delete(
          endpoint,
        );
      },
    );

  inFlightReportRequests.set(
    endpoint,
    request,
  );

  return request;
}

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

  const endpoint =
    `/reports/sales${queryString}`;

  return requestReportOnce<SalesReportResponse>(
    endpoint,
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

  const endpoint =
    `/reports/devices${queryString}`;

  return requestReportOnce<DevicesReportResponse>(
    endpoint,
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

  const endpoint =
    `/reports/commissions${queryString}`;

  return requestReportOnce<CommissionsReportResponse>(
    endpoint,
  );
}

export async function updateCommissionPaymentStatus(
  saleId: string,
  status: CommissionPaymentStatus,
) {
  const response =
    await apiRequest<UpdateCommissionPaymentStatusResponse>(
      `/sales/${saleId}/commission-status`,
      {
        method: 'PATCH',

        body: JSON.stringify({
          status,
        }),
      },
    );

  return response.data;
}