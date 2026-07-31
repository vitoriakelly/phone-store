import type {
  DashboardFilters,
  DashboardResponse,
} from '../types/dashboard';

import { apiRequest } from './api';

const inFlightRequests =
  new Map<string, Promise<DashboardResponse>>();

function buildQueryString(
  filters: DashboardFilters,
) {
  const searchParams =
    new URLSearchParams();

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

export function getDashboard(
  filters: DashboardFilters = {},
): Promise<DashboardResponse> {
  const queryString =
    buildQueryString(filters);

  const endpoint =
    `/dashboard${queryString}`;

  const existingRequest =
    inFlightRequests.get(endpoint);

  if (existingRequest) {
    return existingRequest;
  }

  const request =
    apiRequest<DashboardResponse>(
      endpoint,
    ).finally(() => {
      inFlightRequests.delete(
        endpoint,
      );
    });

  inFlightRequests.set(
    endpoint,
    request,
  );

  return request;
}