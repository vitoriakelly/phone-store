import type { Device } from '../types/device';

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

interface DeviceResponse {
  message: string;
  data: Device;
}

interface DeviceListResponse {
  data: Device[];
  meta: {
    total: number;
  };
}

interface DeviceDetailsResponse {
  data: Device;
}

export async function listDevices(): Promise<Device[]> {
  const response =
    await apiRequest<DeviceListResponse>('/devices');

  return response.data;
}

export async function createDevice(
  data: CreateDeviceInput,
): Promise<Device> {
  const response = await apiRequest<DeviceResponse>(
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
  const response = await apiRequest<DeviceResponse>(
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
  await apiRequest<void>(`/devices/${deviceId}`, {
    method: 'DELETE',
  });
}