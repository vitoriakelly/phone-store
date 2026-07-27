export type DeviceStatus =
  | 'DISPONIVEL'
  | 'RESERVADO'
  | 'VENDIDO';

export type DeviceCondition =
  | 'NOVO'
  | 'SEMINOVO'
  | 'USADO';

export interface Device {
  id: string;
  brand: string;
  model: string;
  storage: string;
  color: string;
  imei: string;
  batteryHealth?: number | null;
  condition: DeviceCondition;
  purchasePrice: number;
  salePrice: number;
  supplier?: string | null;
  entryDate: string;
  status: DeviceStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
}