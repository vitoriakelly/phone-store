export type DeviceStatus = 'DISPONIVEL' | 'RESERVADO' | 'VENDIDO';

export type DeviceCondition = 'NOVO' | 'SEMINOVO' | 'USADO';

export interface Device {
  id: string;
  brand: string;
  model: string;
  storage: string;
  color: string;
  imei: string;
  batteryHealth?: number;
  condition: DeviceCondition;
  purchasePrice: number;
  salePrice: number;
  supplier?: string;
  entryDate: string;
  status: DeviceStatus;
  notes?: string;
  createdAt: string;
}