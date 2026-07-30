import type {
  DeviceCondition,
  DeviceStatus,
} from './device';

export type PaymentMethod =
  | 'PIX'
  | 'DINHEIRO'
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO'
  | 'TRANSFERENCIA'
  | 'TROCA_DISPOSITIVO'
  | 'OUTRO';

export interface TradeInDevice {
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

export interface TradeInDeviceInput {
  brand: string;
  model: string;
  storage: string;
  color?: string | null;
  imei?: string | null;
  batteryHealth: number;
  condition: DeviceCondition;
  purchasePrice: number;
  salePrice?: number | null;
  entryDate: string;
  notes?: string | null;
}

export interface CreateSaleInput {
  deviceId: string;

  customerName: string;
  customerPhone?: string | null;

  customerZipCode: string;
  customerStreet: string;
  customerNeighborhood: string;
  customerCity: string;
  customerAddressNumber: string;
  customerSocialNetwork: string;

  salePrice: number;
  paymentMethod: PaymentMethod;
  soldAt: string;

  notes?: string | null;

  tradeInDevice?: TradeInDeviceInput;
}

export interface Sale {
  id: string;
  deviceId: string;

  tradeInDeviceId: string | null;

  deviceBrand: string;
  deviceModel: string;
  deviceImei: string;

  purchasePrice: number;
  salePrice: number;

  customerName: string;
  customerPhone: string | null;

  customerZipCode: string | null;
  customerStreet: string | null;
  customerNeighborhood: string | null;
  customerCity: string | null;
  customerAddressNumber: string | null;
  customerSocialNetwork: string | null;

  paymentMethod: PaymentMethod;
  soldAt: string;

  notes: string | null;

  tradeInDevice: TradeInDevice | null;

  createdAt: string;
  updatedAt: string;
}