import { z } from 'zod';

export const deviceSchema = z
  .object({
    brand: z
      .string()
      .trim()
      .min(2, 'Informe a marca do dispositivo.'),

    model: z
      .string()
      .trim()
      .min(2, 'Informe o modelo do dispositivo.'),

    storage: z
      .string()
      .trim()
      .min(1, 'Informe o armazenamento.'),

    color: z
      .string()
      .trim()
      .min(2, 'Informe a cor do dispositivo.'),

    imei: z
      .string()
      .trim()
      .regex(/^\d{15}$/, 'O IMEI deve possuir exatamente 15 números.'),

    batteryHealth: z
      .number()
      .min(0, 'A saúde da bateria não pode ser menor que 0%.')
      .max(100, 'A saúde da bateria não pode ser maior que 100%.')
      .optional(),

    condition: z.enum(['NOVO', 'SEMINOVO', 'USADO']),

    purchasePrice: z
      .number()
      .positive('O valor de compra deve ser maior que zero.'),

    salePrice: z
      .number()
      .positive('O valor de venda deve ser maior que zero.'),

    supplier: z.string().trim().optional(),

    entryDate: z
      .string()
      .min(1, 'Informe a data de entrada.'),

    status: z.enum(['DISPONIVEL', 'RESERVADO', 'VENDIDO']),

    notes: z.string().trim().optional(),
  })
  .superRefine((data, context) => {
    if (data.salePrice < data.purchasePrice) {
      context.addIssue({
        code: 'custom',
        path: ['salePrice'],
        message:
          'O valor de venda não pode ser menor que o valor de compra.',
      });
    }
  });

export type DeviceFormData = z.infer<typeof deviceSchema>;