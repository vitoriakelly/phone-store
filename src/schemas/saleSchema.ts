import { z } from 'zod';

export const saleSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(3, 'Informe o nome do cliente.'),

  customerPhone: z
    .string()
    .trim()
    .optional(),

  salePrice: z
    .number()
    .positive('O valor da venda deve ser maior que zero.'),

  paymentMethod: z.enum([
    'PIX',
    'DINHEIRO',
    'CARTAO_CREDITO',
    'CARTAO_DEBITO',
    'TRANSFERENCIA',
    'OUTRO',
  ]),

  soldAt: z
    .string()
    .min(1, 'Informe a data da venda.'),

  notes: z
    .string()
    .trim()
    .optional(),
});

export type SaleFormData = z.infer<
  typeof saleSchema
>;