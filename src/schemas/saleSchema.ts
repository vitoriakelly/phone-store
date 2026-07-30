import { z } from 'zod';

const paymentMethodSchema = z.enum([
  'PIX',
  'DINHEIRO',
  'CARTAO_CREDITO',
  'CARTAO_DEBITO',
  'TRANSFERENCIA',
  'TROCA_DISPOSITIVO',
  'OUTRO',
]);

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

function convertToCents(
  value: number,
) {
  return Math.round(value * 100);
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

const paymentSchema = z
  .object({
    method: paymentMethodSchema,

    amount: z
      .number({
        message:
          'Informe o valor do pagamento.',
      })
      .positive(
        'O valor do pagamento deve ser maior que zero.',
      ),

    installments: z
      .number({
        message:
          'Informe a quantidade de parcelas.',
      })
      .int(
        'A quantidade de parcelas deve ser um número inteiro.',
      )
      .min(
        1,
        'A quantidade mínima é de 1 parcela.',
      )
      .max(
        36,
        'A quantidade máxima é de 36 parcelas.',
      )
      .optional(),
  })
  .superRefine((payment, context) => {
    const isCreditCard =
      payment.method ===
      'CARTAO_CREDITO';

    if (
      isCreditCard &&
      payment.installments === undefined
    ) {
      context.addIssue({
        code: 'custom',
        path: ['installments'],
        message:
          'Informe a quantidade de parcelas.',
      });
    }

    if (
      !isCreditCard &&
      payment.installments !== undefined
    ) {
      context.addIssue({
        code: 'custom',
        path: ['installments'],
        message:
          'Parcelas são permitidas somente para cartão de crédito.',
      });
    }
  });

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
        'Informe a saúde da bateria.',
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
        'Informe o valor de compra.',
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

    payments: z
      .array(paymentSchema)
      .min(
        1,
        'Adicione pelo menos uma forma de pagamento.',
      )
      .max(
        10,
        'Uma venda pode possuir no máximo 10 pagamentos.',
      ),

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
    const salePriceInCents =
      convertToCents(data.salePrice);

    const paymentsTotalInCents =
      data.payments.reduce(
        (total, payment) =>
          total +
          convertToCents(
            payment.amount,
          ),
        0,
      );

    if (
      paymentsTotalInCents !==
      salePriceInCents
    ) {
      const differenceInCents =
        salePriceInCents -
        paymentsTotalInCents;

      const formattedDifference = (
        Math.abs(differenceInCents) /
        100
      ).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });

      context.addIssue({
        code: 'custom',
        path: ['payments'],
        message:
          differenceInCents > 0
            ? `Ainda faltam ${formattedDifference} para completar o valor da venda.`
            : `Os pagamentos excedem o valor da venda em ${formattedDifference}.`,
      });
    }

    const tradePaymentIndexes =
      data.payments
        .map((payment, index) => ({
          payment,
          index,
        }))
        .filter(
          ({ payment }) =>
            payment.method ===
            'TROCA_DISPOSITIVO',
        );

    if (
      tradePaymentIndexes.length > 1
    ) {
      context.addIssue({
        code: 'custom',
        path: ['payments'],
        message:
          'A venda pode possuir somente um dispositivo recebido na troca.',
      });
    }

    const tradePaymentEntry =
      tradePaymentIndexes[0];

    if (
      tradePaymentEntry &&
      !data.tradeInDevice
    ) {
      context.addIssue({
        code: 'custom',
        path: ['tradeInDevice'],
        message:
          'Informe os dados do dispositivo recebido na troca.',
      });

      return;
    }

    if (
      !tradePaymentEntry &&
      data.tradeInDevice
    ) {
      context.addIssue({
        code: 'custom',
        path: ['tradeInDevice'],
        message:
          'O dispositivo recebido somente pode ser informado quando existir um pagamento por troca.',
      });

      return;
    }

    if (
      !tradePaymentEntry ||
      !data.tradeInDevice
    ) {
      return;
    }

    const tradeInDevice =
      data.tradeInDevice;

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

    if (
      tradeInDevice.purchasePrice !==
      undefined
    ) {
      const tradePaymentInCents =
        convertToCents(
          tradePaymentEntry.payment
            .amount,
        );

      const purchasePriceInCents =
        convertToCents(
          tradeInDevice.purchasePrice,
        );

      if (
        tradePaymentInCents !==
        purchasePriceInCents
      ) {
        context.addIssue({
          code: 'custom',
          path: [
            'payments',
            tradePaymentEntry.index,
            'amount',
          ],
          message:
            'O valor da troca deve ser igual ao valor de compra do dispositivo recebido.',
        });

        context.addIssue({
          code: 'custom',
          path: [
            'tradeInDevice',
            'purchasePrice',
          ],
          message:
            'O valor de compra deve ser igual ao valor informado na troca.',
        });
      }
    }
  });

export type SaleFormData = z.infer<
  typeof saleSchema
>;

export type SalePaymentFormData =
  SaleFormData['payments'][number];