export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
}

export interface DashboardStock {
  total: number;
  pending: number;
  available: number;
  reserved: number;
  sold: number;
  inventoryValue: number;
}

export interface DashboardRecentDevice {
  id: string;
  brand: string;
  model: string;
  storage: string;
  color: string | null;
  condition: 'NOVO' | 'SEMINOVO' | 'USADO';
  salePrice: number | null;
  entryDate: string;
  status:
    | 'PENDENTE_INFORMACOES'
    | 'DISPONIVEL'
    | 'RESERVADO'
    | 'VENDIDO';
  createdAt: string;
}

export interface DashboardSalePayment {
  id: string;
  saleId: string;
  method:
    | 'PIX'
    | 'DINHEIRO'
    | 'CARTAO_CREDITO'
    | 'CARTAO_DEBITO'
    | 'TRANSFERENCIA'
    | 'TROCA_DISPOSITIVO'
    | 'OUTRO';
  amount: number;
  installments: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardRecentSale {
  id: string;
  sellerName: string;
  deviceBrand: string;
  deviceModel: string;
  customerName: string;
  salePrice: number;
  purchasePrice: number;
  commissionAmount: number;
  paymentMethod: DashboardSalePayment['method'];
  payments: DashboardSalePayment[];
  soldAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSalesMetrics {
  totalRevenue: number;
  totalProfit: number;
  totalCommission: number;
  totalProfitAfterCommission: number;
  totalSales: number;
  averageTicket: number;
}

export interface DashboardResponse {
  stock: DashboardStock;
  sales: DashboardSalesMetrics;
  recentDevices: DashboardRecentDevice[];
  recentSales: DashboardRecentSale[];
  filters: DashboardFilters;
}