import type { Sale } from '../types/sale';

const STORAGE_KEY = '@phone-store:sales';

export function getSales(): Sale[] {
  try {
    const storedSales = localStorage.getItem(STORAGE_KEY);

    if (!storedSales) {
      return [];
    }

    const sales = JSON.parse(storedSales);

    return Array.isArray(sales) ? sales : [];
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    return [];
  }
}

export function getSaleById(
  saleId: string,
): Sale | undefined {
  return getSales().find(
    (sale) => sale.id === saleId,
  );
}

export function saveSale(sale: Sale): void {
  const sales = getSales();

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([...sales, sale]),
  );
}

export function getSaleByDeviceId(
  deviceId: string,
): Sale | undefined {
  return getSales().find(
    (sale) => sale.deviceId === deviceId,
  );
}