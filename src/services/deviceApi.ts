import type {
  Device,
  DeviceCondition,
  DeviceStatus,
} from '../types/device';

import { apiRequest } from './api';

export interface CreateDeviceInput {
  brand: string;
  model: string;
  storage: string;
  color: string;
  imei: string;
  batteryHealth?: number;
  condition: Device['condition'];
  purchasePrice: number;
  salePrice: number;
  supplier?: string;
  entryDate: string;
  status: Device['status'];
  notes?: string;
}

export type UpdateDeviceInput =
  Partial<CreateDeviceInput>;

export interface DeviceListFilters {
  page?: number;
  search?: string;
  status?: DeviceStatus;
  condition?: DeviceCondition;
  startDate?: string;
  endDate?: string;
}

export interface DeviceListMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface DeviceListResponse {
  data: Device[];
  meta: DeviceListMeta;

  filters: {
    page: number;
    search?: string;
    status?: DeviceStatus;
    condition?: DeviceCondition;
    startDate?: string;
    endDate?: string;
  };
}

interface DeviceResponse {
  message: string;
  data: Device;
}

interface DeviceDetailsResponse {
  data: Device;
}

function createQueryString(
  filters: DeviceListFilters,
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

  if (filters.status) {
    searchParams.set(
      'status',
      filters.status,
    );
  }

  if (filters.condition) {
    searchParams.set(
      'condition',
      filters.condition,
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


export async function listDevicesPage(
  filters: DeviceListFilters = {},
): Promise<DeviceListResponse> {
  return apiRequest<DeviceListResponse>(
    `/devices${createQueryString(
      filters,
    )}`,
  );
}
export async function listAllDevices(
  filters: DeviceListFilters = {},
): Promise<Device[]> {
  const firstPage =
    await listDevicesPage({
      ...filters,
      page: 1,
    });

  if (
    firstPage.meta.totalPages <= 1
  ) {
    return firstPage.data;
  }

  const remainingPages =
    await Promise.all(
      Array.from(
        {
          length:
            firstPage.meta
              .totalPages - 1,
        },
        (_, index) =>
          listDevicesPage({
            ...filters,
            page: index + 2,
          }),
      ),
    );

  return [
    ...firstPage.data,

    ...remainingPages.flatMap(
      (response) =>
        response.data,
    ),
  ];
}

export async function listDevices(): Promise<
  Device[]
> {
  const firstPage =
    await listDevicesPage({
      page: 1,
    });

  if (
    firstPage.meta.totalPages <= 1
  ) {
    return firstPage.data;
  }

  const remainingPages =
    await Promise.all(
      Array.from(
        {
          length:
            firstPage.meta.totalPages -
            1,
        },
        (_, index) =>
          listDevicesPage({
            page: index + 2,
          }),
      ),
    );

  return [
    ...firstPage.data,

    ...remainingPages.flatMap(
      (response) =>
        response.data,
    ),
  ];
}

export async function createDevice(
  data: CreateDeviceInput,
): Promise<Device> {
  const response =
    await apiRequest<DeviceResponse>(
      '/devices',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    );

  return response.data;
}

export async function getDeviceById(
  deviceId: string,
): Promise<Device> {
  const response =
    await apiRequest<DeviceDetailsResponse>(
      `/devices/${deviceId}`,
    );

  return response.data;
}

export async function updateDevice(
  deviceId: string,
  data: UpdateDeviceInput,
): Promise<Device> {
  const response =
    await apiRequest<DeviceResponse>(
      `/devices/${deviceId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    );

  return response.data;
}

export async function deleteDevice(
  deviceId: string,
): Promise<void> {
  await apiRequest<void>(
    `/devices/${deviceId}`,
    {
      method: 'DELETE',
    },
  );
}