import { z } from 'zod';

const datePattern =
  /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string) {
  if (!datePattern.test(value)) {
    return false;
  }

  return !Number.isNaN(
    Date.parse(
      `${value}T00:00:00.000Z`,
    ),
  );
}

const optionalTextSchema = (
  maximumLength: number,
  message: string,
) =>
  z
    .string()
    .trim()
    .max(maximumLength, message)
    .optional();

const tradeInDeviceSchema = z.object({
  brand: z
    .string()
    .trim()
    .max(
      80,
      'A marca deve possuir no máximo 80 caracteres.',
    )
    .optional(),

  model: z
    .string()
    .trim()
    .max(
      120,
      'O modelo deve possuir no máximo 120 caracteres.',
    )
    .optional(),

  storage: z
    .string()
    .trim()
    .max(
      30,
      'O armazenamento deve possuir no máximo 30 caracteres.',
    )
    .optional(),

  color: z
    .string()
    .trim()
    .max(
      50,
      'A cor deve possuir no máximo 50 caracteres.',
    )
    .optional(),

  imei: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === '' ||
        /^\d{15}$/.test(value),
      'O IMEI deve possuir exatamente 15 números.',
    )
    .optional(),

  batteryHealth: z
    .number({
      message:
        'A saúde da bateria deve ser um número.',
    })
    .int(
      'A saúde da bateria deve ser um número inteiro.',
    )
    .min(
      0,
      'A saúde da bateria não pode ser menor que 0%.',
    )
    .max(
      100,
      'A saúde da bateria não pode ser maior que 100%.',
    )
    .optional(),

  condition: z
    .enum([
      'NOVO',
      'SEMINOVO',
      'USADO',
    ])
    .optional(),

  purchasePrice: z
    .number({
      message:
        'O valor de compra deve ser um número.',
    })
    .positive(
      'O valor de compra deve ser maior que zero.',
    )
    .optional(),

  salePrice: z
    .number({
      message:
        'O valor de venda deve ser um número.',
    })
    .positive(
      'O valor de venda deve ser maior que zero.',
    )
    .optional(),

  entryDate: z
    .string()
    .refine(
      (value) =>
        value === '' ||
        isValidDate(value),
      'Informe uma data de entrada válida.',
    )
    .optional(),

  notes: optionalTextSchema(
    2000,
    'As observações devem possuir no máximo 2000 caracteres.',
  ),
});

export const saleSchema = z
  .object({
    customerName: z
      .string()
      .trim()
      .min(
        3,
        'Informe o nome do cliente.',
      )
      .max(
        160,
        'O nome deve possuir no máximo 160 caracteres.',
      ),

    customerPhone: optionalTextSchema(
      30,
      'O telefone deve possuir no máximo 30 caracteres.',
    ),

    customerZipCode: z
      .string()
      .trim()
      .regex(
        /^\d{5}-?\d{3}$/,
        'Informe um CEP válido.',
      ),

    customerStreet: z
      .string()
      .trim()
      .min(
        2,
        'Informe a rua do cliente.',
      )
      .max(
        180,
        'A rua deve possuir no máximo 180 caracteres.',
      ),

    customerNeighborhood: z
      .string()
      .trim()
      .min(
        2,
        'Informe o bairro do cliente.',
      )
      .max(
        120,
        'O bairro deve possuir no máximo 120 caracteres.',
      ),

    customerCity: z
      .string()
      .trim()
      .min(
        2,
        'Informe a cidade do cliente.',
      )
      .max(
        120,
        'A cidade deve possuir no máximo 120 caracteres.',
      ),

    customerAddressNumber: z
      .string()
      .trim()
      .min(
        1,
        'Informe o número do endereço.',
      )
      .max(
        30,
        'O número deve possuir no máximo 30 caracteres.',
      ),

    customerSocialNetwork: z
      .string()
      .trim()
      .min(
        2,
        'Informe uma rede social do cliente.',
      )
      .max(
        160,
        'A rede social deve possuir no máximo 160 caracteres.',
      ),

    salePrice: z
      .number({
        message:
          'Informe o valor da venda.',
      })
      .positive(
        'O valor da venda deve ser maior que zero.',
      ),

    paymentMethod: z.enum([
      'PIX',
      'DINHEIRO',
      'CARTAO_CREDITO',
      'CARTAO_DEBITO',
      'TRANSFERENCIA',
      'TROCA_DISPOSITIVO',
      'OUTRO',
    ]),

    soldAt: z
      .string()
      .min(
        1,
        'Informe a data da venda.',
      )
      .refine(
        isValidDate,
        'Informe uma data de venda válida.',
      ),

    notes: optionalTextSchema(
      2000,
      'As observações devem possuir no máximo 2000 caracteres.',
    ),

    tradeInDevice:
      tradeInDeviceSchema.optional(),
  })
  .superRefine((data, context) => {
    if (
      data.paymentMethod !==
      'TROCA_DISPOSITIVO'
    ) {
      return;
    }

    const tradeInDevice =
      data.tradeInDevice;

    if (!tradeInDevice) {
      context.addIssue({
        code: 'custom',
        path: ['tradeInDevice'],
        message:
          'Informe os dados do dispositivo recebido na troca.',
      });

      return;
    }

    if (!tradeInDevice.brand?.trim()) {
      context.addIssue({
        code: 'custom',
        path: [
          'tradeInDevice',
          'brand',
        ],
        message:
          'Informe a marca do dispositivo recebido.',
      });
    }

    if (!tradeInDevice.model?.trim()) {
      context.addIssue({
        code: 'custom',
        path: [
          'tradeInDevice',
          'model',
        ],
        message:
          'Informe o modelo do dispositivo recebido.',
      });
    }

    if (
      !tradeInDevice.storage?.trim()
    ) {
      context.addIssue({
        code: 'custom',
        path: [
          'tradeInDevice',
          'storage',
        ],
        message:
          'Informe o armazenamento do dispositivo recebido.',
      });
    }

    if (
      tradeInDevice.batteryHealth ===
      undefined
    ) {
      context.addIssue({
        code: 'custom',
        path: [
          'tradeInDevice',
          'batteryHealth',
        ],
        message:
          'Informe a saúde da bateria.',
      });
    }

    if (!tradeInDevice.condition) {
      context.addIssue({
        code: 'custom',
        path: [
          'tradeInDevice',
          'condition',
        ],
        message:
          'Informe a condição do dispositivo recebido.',
      });
    }

    if (
      tradeInDevice.purchasePrice ===
      undefined
    ) {
      context.addIssue({
        code: 'custom',
        path: [
          'tradeInDevice',
          'purchasePrice',
        ],
        message:
          'Informe o valor de compra do dispositivo recebido.',
      });
    }

    if (
      !tradeInDevice.entryDate ||
      !isValidDate(
        tradeInDevice.entryDate,
      )
    ) {
      context.addIssue({
        code: 'custom',
        path: [
          'tradeInDevice',
          'entryDate',
        ],
        message:
          'Informe a data de entrada do dispositivo recebido.',
      });
    }

    if (
      tradeInDevice.salePrice !==
        undefined &&
      tradeInDevice.purchasePrice !==
        undefined &&
      tradeInDevice.salePrice <
        tradeInDevice.purchasePrice
    ) {
      context.addIssue({
        code: 'custom',
        path: [
          'tradeInDevice',
          'salePrice',
        ],
        message:
          'O valor de venda não pode ser menor que o valor de compra.',
      });
    }
  });

export type SaleFormData = z.infer<
  typeof saleSchema
>;