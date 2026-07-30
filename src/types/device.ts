export type DeviceStatus =
  | 'PENDENTE_INFORMACOES'
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

  color: string | null;
  imei: string | null;

  batteryHealth: number | null;

  condition: DeviceCondition;

  purchasePrice: number;
  salePrice: number | null;

  supplier: string | null;

  entryDate: string;
  status: DeviceStatus;

  notes: string | null;

  createdAt: string;
  updatedAt: string;
}