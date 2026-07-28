export type PaymentMethod =
  | 'PIX'
  | 'DINHEIRO'
  | 'CARTAO_CREDITO'
  | 'CARTAO_DEBITO'
  | 'TRANSFERENCIA'
  | 'OUTRO';

export interface Sale {
  id: string;
  deviceId: string;
  deviceBrand: string;
  deviceModel: string;
  deviceImei: string;
  purchasePrice: number;
  salePrice: number;
  customerName: string;
  customerPhone?: string | null;
  paymentMethod: PaymentMethod;
  soldAt: string;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
}