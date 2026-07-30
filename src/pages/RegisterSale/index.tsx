import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  BadgeDollarSign,
  MapPin,
  Plus,
  Repeat2,
  Smartphone,
  Trash2,
  UserRound,
  WalletCards,
} from 'lucide-react';
import {
  useEffect,
  useState,
} from 'react';
import {
  type FieldPath,
  useFieldArray,
  useForm,
} from 'react-hook-form';
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';

import {
  saleSchema,
  type SaleFormData,
} from '../../schemas/saleSchema';
import { ApiError } from '../../services/api';
import { getDeviceById } from '../../services/deviceApi';
import { createSale } from '../../services/saleApi';
import { listSellers } from '../../services/userApi';
import type { Device } from '../../types/device';
import type {
  CommissionType,
  PaymentMethod,
  TradeInDeviceInput,
} from '../../types/sale';
import type { Seller } from '../../types/user';
import { formatCurrency } from '../../utils/currency';

import './styles.scss';

function getCurrentDate() {
  const currentDate = new Date();

  const timezoneOffset =
    currentDate.getTimezoneOffset() * 60_000;

  return new Date(
    currentDate.getTime() - timezoneOffset,
  )
    .toISOString()
    .split('T')[0];
}

function convertToCents(value: number) {
  return Math.round(value * 100);
}

function getNumericValue(
  value: number | undefined,
) {
  if (
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return 0;
  }

  return value;
}

function buildTradeInDevice(
  data: SaleFormData,
): TradeInDeviceInput | undefined {
  const hasTradePayment =
    data.payments.some(
      (payment) =>
        payment.method ===
        'TROCA_DISPOSITIVO',
    );

  if (!hasTradePayment) {
    return undefined;
  }

  const tradeInDevice =
    data.tradeInDevice;

  if (
    !tradeInDevice?.brand ||
    !tradeInDevice.model ||
    !tradeInDevice.storage ||
    tradeInDevice.batteryHealth ===
      undefined ||
    !tradeInDevice.condition ||
    tradeInDevice.purchasePrice ===
      undefined ||
    !tradeInDevice.entryDate
  ) {
    return undefined;
  }

  return {
    brand: tradeInDevice.brand.trim(),
    model: tradeInDevice.model.trim(),
    storage:
      tradeInDevice.storage.trim(),

    color:
      tradeInDevice.color?.trim() ||
      undefined,

    imei:
      tradeInDevice.imei?.trim() ||
      undefined,

    batteryHealth:
      tradeInDevice.batteryHealth,

    condition:
      tradeInDevice.condition,

    purchasePrice:
      tradeInDevice.purchasePrice,

    salePrice:
      tradeInDevice.salePrice,

    entryDate:
      tradeInDevice.entryDate,

    notes:
      tradeInDevice.notes?.trim() ||
      undefined,
  };
}

export function RegisterSale() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [device, setDevice] =
    useState<Device | null>(null);

  const [sellers, setSellers] =
    useState<Seller[]>([]);

  const [
    isLoadingSellers,
    setIsLoadingSellers,
  ] = useState(true);

  const [
    sellersLoadError,
    setSellersLoadError,
  ] = useState('');

  const [isLoading, setIsLoading] =
    useState(true);

  const [notFound, setNotFound] =
    useState(false);

  const [loadError, setLoadError] =
    useState('');

  const [submitError, setSubmitError] =
    useState('');

  const {
    control,
    register,
    reset,
    setError,
    setValue,
    clearErrors,
    watch,
    handleSubmit,

    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),

    /*
     * Quando a seção de troca for removida
     * da tela, seus campos também deixam
     * de ser enviados.
     */
    shouldUnregister: true,

    defaultValues: {
      sellerId: '',

      customerName: '',
      customerPhone: '',

      customerZipCode: '',
      customerStreet: '',
      customerNeighborhood: '',
      customerCity: '',
      customerAddressNumber: '',
      customerSocialNetwork: '',

      salePrice: undefined,
      discountAmount: 0,
      commissionType: undefined,
      commissionValue: undefined,

      payments: [
        {
          method: 'PIX',
          amount: 0,
          installments: undefined,
        },
      ],

      soldAt: getCurrentDate(),
      notes: '',

      tradeInDevice: {
        brand: '',
        model: '',
        storage: '',
        color: '',
        imei: '',

        batteryHealth:
          undefined,

        condition: 'SEMINOVO',

        purchasePrice:
          undefined,

        salePrice:
          undefined,

        entryDate:
          getCurrentDate(),

        notes: '',
      },
    },
  });

  const {
    fields: paymentFields,
    append: appendPayment,
    remove: removePayment,
  } = useFieldArray({
    control,
    name: 'payments',
  });

  const watchedSalePrice =
    watch('salePrice');

  const watchedDiscountAmount =
    watch('discountAmount');

  const watchedCommissionType =
    watch('commissionType');

  const watchedCommissionValue =
    watch('commissionValue');

  const watchedPayments =
    watch('payments') ?? [];

  const salePrice =
    getNumericValue(
      watchedSalePrice,
    );

  const discountAmount =
    getNumericValue(
      watchedDiscountAmount,
    );

  const finalSalePrice =
    Math.max(
      salePrice -
        discountAmount,
      0,
    );

  const commissionValue =
    getNumericValue(
      watchedCommissionValue,
    );

  const commissionAmount =
    watchedCommissionType ===
      'PERCENTAGE'
      ? finalSalePrice *
        (commissionValue / 100)
      : watchedCommissionType ===
          'FIXED'
        ? commissionValue
        : 0;

  const totalReceived =
    watchedPayments.reduce(
      (total, payment) =>
        total +
        getNumericValue(
          payment?.amount,
        ),
      0,
    );

  const differenceInCents =
    convertToCents(finalSalePrice) -
    convertToCents(totalReceived);

  const remainingValue =
    differenceInCents / 100;

  const hasTradePayment =
    watchedPayments.some(
      (payment) =>
        payment?.method ===
        'TROCA_DISPOSITIVO',
    );

  const tradePaymentIndex =
    watchedPayments.findIndex(
      (payment) =>
        payment?.method ===
        'TROCA_DISPOSITIVO',
    );

  const paymentTotalIsValid =
    finalSalePrice > 0 &&
    totalReceived > 0 &&
    differenceInCents === 0;

  useEffect(() => {
    let isMounted = true;

    async function loadSellers() {
      setIsLoadingSellers(true);
      setSellersLoadError('');

      try {
        const activeSellers =
          await listSellers();

        if (!isMounted) {
          return;
        }

        setSellers(activeSellers);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setSellers([]);

        if (error instanceof ApiError) {
          setSellersLoadError(
            error.message,
          );
        } else {
          setSellersLoadError(
            'Não foi possível carregar os vendedores.',
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingSellers(false);
        }
      }
    }

    void loadSellers();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadDevice() {
      if (!id) {
        if (isMounted) {
          setNotFound(true);

          setLoadError(
            'O identificador do dispositivo não foi informado.',
          );

          setIsLoading(false);
        }

        return;
      }

      setIsLoading(true);
      setNotFound(false);
      setLoadError('');

      try {
        const apiDevice =
          await getDeviceById(id);

        if (!isMounted) {
          return;
        }

        setDevice(apiDevice);

        const announcedPrice =
          apiDevice.salePrice ?? 0;

        reset({
          sellerId: '',

          customerName: '',
          customerPhone: '',

          customerZipCode: '',
          customerStreet: '',
          customerNeighborhood: '',
          customerCity: '',
          customerAddressNumber: '',
          customerSocialNetwork: '',

          salePrice:
            apiDevice.salePrice ??
            undefined,

          discountAmount: 0,
          commissionType: undefined,
          commissionValue: undefined,

          payments: [
            {
              method: 'PIX',
              amount: announcedPrice,
              installments: undefined,
            },
          ],

          soldAt: getCurrentDate(),
          notes: '',

          tradeInDevice: {
            brand: '',
            model: '',
            storage: '',
            color: '',
            imei: '',

            batteryHealth:
              undefined,

            condition: 'SEMINOVO',

            purchasePrice:
              undefined,

            salePrice:
              undefined,

            entryDate:
              getCurrentDate(),

            notes: '',
          },
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setDevice(null);

        if (
          error instanceof ApiError &&
          error.status === 404
        ) {
          setNotFound(true);

          setLoadError(
            'O aparelho não existe ou foi excluído.',
          );

          return;
        }

        if (
          error instanceof ApiError
        ) {
          setLoadError(
            error.message,
          );
        } else {
          setLoadError(
            'Não foi possível carregar o dispositivo. Verifique se a API está funcionando.',
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDevice();

    return () => {
      isMounted = false;
    };
  }, [id, reset]);

  function handleAddPayment() {
    if (paymentFields.length >= 10) {
      setSubmitError(
        'Uma venda pode possuir no máximo 10 pagamentos.',
      );

      return;
    }

    setSubmitError('');

    appendPayment({
      method: 'PIX',
      amount: 0,
      installments: undefined,
    });
  }

  function handleRemovePayment(
    index: number,
  ) {
    if (paymentFields.length === 1) {
      setSubmitError(
        'A venda precisa possuir pelo menos uma forma de pagamento.',
      );

      return;
    }

    const removedPayment =
      watchedPayments[index];

    removePayment(index);
    setSubmitError('');

    if (
      removedPayment?.method ===
      'TROCA_DISPOSITIVO'
    ) {
      setValue(
        'tradeInDevice.purchasePrice',
        undefined,
      );
    }

    clearErrors('payments');
  }

  function handlePaymentMethodChange(
    index: number,
    method: PaymentMethod,
    previousMethod: PaymentMethod,
  ) {
    if (
      method !==
      'CARTAO_CREDITO'
    ) {
      setValue(
        `payments.${index}.installments`,
        undefined,
        {
          shouldValidate: true,
        },
      );
    }

    if (
      method ===
      'TROCA_DISPOSITIVO'
    ) {
      /*
       * O valor da troca é informado no
       * cadastro do aparelho recebido.
       * Aqui apenas inicializamos o
       * pagamento com esse valor.
       */
      const purchasePrice =
        getNumericValue(
          watch(
            'tradeInDevice.purchasePrice',
          ),
        );

      setValue(
        `payments.${index}.amount`,
        purchasePrice,
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );
    }

    if (
      previousMethod ===
        'TROCA_DISPOSITIVO' &&
      method !==
        'TROCA_DISPOSITIVO'
    ) {
      setValue(
        'tradeInDevice.purchasePrice',
        undefined,
        {
          shouldDirty: true,
          shouldValidate: false,
        },
      );
    }

    clearErrors('payments');
  }

  function handleTradeInPurchasePriceChange(
    rawValue: string,
  ) {
    if (tradePaymentIndex < 0) {
      return;
    }

    const parsedValue =
      rawValue === ''
        ? 0
        : Number(rawValue);

    const purchasePrice =
      Number.isFinite(parsedValue)
        ? parsedValue
        : 0;

    /*
     * O aparelho recebido abate este
     * valor do total da nova venda.
     */
    setValue(
      `payments.${tradePaymentIndex}.amount`,
      purchasePrice,
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      },
    );

    clearErrors(
      `payments.${tradePaymentIndex}.amount`,
    );
  }

  async function handleRegisterSale(
    data: SaleFormData,
  ) {
    if (!device) {
      return;
    }

    setSubmitError('');

    const tradeInDevice =
      buildTradeInDevice(data);

    const hasTrade =
      data.payments.some(
        (payment) =>
          payment.method ===
          'TROCA_DISPOSITIVO',
      );

    if (
      hasTrade &&
      !tradeInDevice
    ) {
      setSubmitError(
        'Preencha os dados obrigatórios do dispositivo recebido na troca.',
      );

      return;
    }

    try {
      await createSale({
        deviceId: device.id,
        sellerId: data.sellerId,

        customerName:
          data.customerName.trim(),

        customerPhone:
          data.customerPhone?.trim() ||
          undefined,

        customerZipCode:
          data.customerZipCode.trim(),

        customerStreet:
          data.customerStreet.trim(),

        customerNeighborhood:
          data.customerNeighborhood.trim(),

        customerCity:
          data.customerCity.trim(),

        customerAddressNumber:
          data.customerAddressNumber.trim(),

        customerSocialNetwork:
          data.customerSocialNetwork.trim(),

        salePrice: data.salePrice,

        discountAmount:
          data.discountAmount,

        commissionType:
          data.commissionType,

        commissionValue:
          data.commissionValue,

        payments:
          data.payments.map(
            (payment) => ({
              method:
                payment.method,

              amount:
                payment.amount,

              installments:
                payment.method ===
                'CARTAO_CREDITO'
                  ? payment.installments
                  : undefined,
            }),
          ),

        soldAt: data.soldAt,

        notes:
          data.notes?.trim() ||
          undefined,

        tradeInDevice,
      });

      navigate('/dispositivos', {
        state: {
          successMessage:
            hasTrade
              ? 'Venda registrada e dispositivo recebido adicionado ao estoque.'
              : 'Venda registrada com sucesso.',
        },
      });
    } catch (error) {
      if (
        error instanceof ApiError
      ) {
        const serverErrors =
          error.errors ?? {};

        let hasFieldError = false;

        for (
          const [
            field,
            messages,
          ] of Object.entries(
            serverErrors,
          )
        ) {
          const message =
            messages?.[0];

          if (!message) {
            continue;
          }

          /*
           * Aceita tanto:
           * payments.0.amount
           * quanto:
           * payments[0].amount
           */
          const normalizedField =
            field.replace(
              /\[(\d+)\]/g,
              '.$1',
            );

          hasFieldError = true;

          setError(
            normalizedField as FieldPath<SaleFormData>,
            {
              type: 'server',
              message,
            },
          );
        }

        if (!hasFieldError) {
          setSubmitError(
            error.message,
          );
        }

        return;
      }

      console.error(
        'Erro ao registrar venda:',
        error,
      );

      setSubmitError(
        'Não foi possível registrar a venda. Verifique a conexão com a API.',
      );
    }
  }

  if (isLoading) {
    return (
      <main className="register-sale">
        <section className="register-sale__not-found">
          <Smartphone size={36} />

          <h1>
            Carregando dispositivo...
          </h1>

          <p>
            Aguarde enquanto buscamos os
            dados do aparelho.
          </p>
        </section>
      </main>
    );
  }

  if (!device) {
    return (
      <main className="register-sale">
        <section className="register-sale__not-found">
          <Smartphone size={36} />

          <h1>
            {notFound
              ? 'Dispositivo não encontrado'
              : 'Não foi possível carregar o dispositivo'}
          </h1>

          <p>
            {loadError ||
              'O aparelho não existe ou foi excluído.'}
          </p>

          <Link to="/dispositivos">
            <ArrowLeft size={18} />
            Voltar para dispositivos
          </Link>
        </section>
      </main>
    );
  }

  if (device.status === 'VENDIDO') {
    return (
      <main className="register-sale">
        <section className="register-sale__not-found">
          <BadgeDollarSign size={36} />

          <h1>
            Dispositivo já vendido
          </h1>

          <p>
            Este aparelho já possui uma
            venda registrada.
          </p>

          <Link
            to={`/dispositivos/${device.id}`}
          >
            <ArrowLeft size={18} />
            Voltar para os detalhes
          </Link>
        </section>
      </main>
    );
  }

  if (
    device.status ===
      'PENDENTE_INFORMACOES' ||
    !device.imei ||
    !device.color ||
    device.salePrice === null
  ) {
    return (
      <main className="register-sale">
        <section className="register-sale__not-found">
          <Smartphone size={36} />

          <h1>
            Dispositivo com informações
            pendentes
          </h1>

          <p>
            Preencha a cor, o IMEI e o
            valor de venda antes de
            registrar a venda deste
            aparelho.
          </p>

          <Link
            to={`/dispositivos/${device.id}/editar`}
          >
            <ArrowLeft size={18} />
            Completar cadastro
          </Link>
        </section>
      </main>
    );
  }

  if (
    device.status !== 'DISPONIVEL' &&
    device.status !== 'RESERVADO'
  ) {
    return (
      <main className="register-sale">
        <section className="register-sale__not-found">
          <BadgeDollarSign size={36} />

          <h1>
            Dispositivo indisponível
          </h1>

          <p>
            Este aparelho não está
            disponível para venda.
          </p>

          <Link
            to={`/dispositivos/${device.id}`}
          >
            <ArrowLeft size={18} />
            Voltar para os detalhes
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="register-sale">
      <section className="register-sale__heading">
        <div>
          <Link
            to={`/dispositivos/${device.id}`}
            className="register-sale__back"
          >
            <ArrowLeft size={18} />
            Voltar para os detalhes
          </Link>

          <h1>Registrar venda</h1>

          <p>
            Informe os dados da venda,
            do comprador e dos pagamentos.
          </p>
        </div>

        <div className="register-sale__heading-icon">
          <BadgeDollarSign size={28} />
        </div>
      </section>

      <section className="register-sale__device">
        <div className="register-sale__device-icon">
          <Smartphone size={24} />
        </div>

        <div>
          <span>
            Dispositivo selecionado
          </span>

          <strong>
            {device.brand}{' '}
            {device.model}
          </strong>

          <p>
            {device.storage} ·{' '}
            {device.color} · IMEI{' '}
            {device.imei}
          </p>
        </div>

        <div className="register-sale__suggested-price">
          <span>Valor anunciado</span>

          <strong>
            {formatCurrency(
              device.salePrice,
            )}
          </strong>
        </div>
      </section>

      <form
        className="register-sale__form"
        onSubmit={handleSubmit(
          handleRegisterSale,
        )}
        noValidate
      >
        <section className="register-sale__section">
          <div className="register-sale__section-heading">
            <UserRound size={22} />

            <div>
              <h2>Dados do comprador</h2>

              <p>
                Identificação e contato
                da pessoa que comprou o
                aparelho.
              </p>
            </div>
          </div>

          <div className="register-sale__grid">
            <div className="register-sale__field">
              <label htmlFor="customerName">
                Nome do comprador *
              </label>

              <input
                id="customerName"
                type="text"
                placeholder="Nome completo"
                {...register(
                  'customerName',
                )}
              />

              {errors.customerName && (
                <span className="register-sale__error">
                  {
                    errors.customerName
                      .message
                  }
                </span>
              )}
            </div>

            <div className="register-sale__field">
              <label htmlFor="customerPhone">
                Telefone
              </label>

              <input
                id="customerPhone"
                type="tel"
                placeholder="(88) 99999-9999"
                {...register(
                  'customerPhone',
                )}
              />

              {errors.customerPhone && (
                <span className="register-sale__error">
                  {
                    errors.customerPhone
                      .message
                  }
                </span>
              )}
            </div>

            <div className="register-sale__field">
              <label htmlFor="customerSocialNetwork">
                Rede social *
              </label>

              <input
                id="customerSocialNetwork"
                type="text"
                placeholder="@usuario ou link do perfil"
                {...register(
                  'customerSocialNetwork',
                )}
              />

              {errors.customerSocialNetwork && (
                <span className="register-sale__error">
                  {
                    errors
                      .customerSocialNetwork
                      .message
                  }
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="register-sale__section">
          <div className="register-sale__section-heading">
            <MapPin size={22} />

            <div>
              <h2>
                Endereço do comprador
              </h2>

              <p>
                Endereço informado no
                momento da venda.
              </p>
            </div>
          </div>

          <div className="register-sale__grid">
            <div className="register-sale__field">
              <label htmlFor="customerZipCode">
                CEP *
              </label>

              <input
                id="customerZipCode"
                type="text"
                inputMode="numeric"
                maxLength={9}
                placeholder="00000-000"
                {...register(
                  'customerZipCode',
                  {
                    onChange: (
                      event,
                    ) => {
                      const digits =
                        event.target.value
                          .replace(
                            /\D/g,
                            '',
                          )
                          .slice(0, 8);

                      event.target.value =
                        digits.replace(
                          /^(\d{5})(\d)/,
                          '$1-$2',
                        );
                    },
                  },
                )}
              />

              {errors.customerZipCode && (
                <span className="register-sale__error">
                  {
                    errors
                      .customerZipCode
                      .message
                  }
                </span>
              )}
            </div>

            <div className="register-sale__field">
              <label htmlFor="customerStreet">
                Rua *
              </label>

              <input
                id="customerStreet"
                type="text"
                placeholder="Nome da rua"
                {...register(
                  'customerStreet',
                )}
              />

              {errors.customerStreet && (
                <span className="register-sale__error">
                  {
                    errors.customerStreet
                      .message
                  }
                </span>
              )}
            </div>

            <div className="register-sale__field">
              <label htmlFor="customerAddressNumber">
                Número *
              </label>

              <input
                id="customerAddressNumber"
                type="text"
                placeholder="Ex.: 125 ou S/N"
                {...register(
                  'customerAddressNumber',
                )}
              />

              {errors.customerAddressNumber && (
                <span className="register-sale__error">
                  {
                    errors
                      .customerAddressNumber
                      .message
                  }
                </span>
              )}
            </div>

            <div className="register-sale__field">
              <label htmlFor="customerNeighborhood">
                Bairro *
              </label>

              <input
                id="customerNeighborhood"
                type="text"
                placeholder="Bairro"
                {...register(
                  'customerNeighborhood',
                )}
              />

              {errors.customerNeighborhood && (
                <span className="register-sale__error">
                  {
                    errors
                      .customerNeighborhood
                      .message
                  }
                </span>
              )}
            </div>

            <div className="register-sale__field">
              <label htmlFor="customerCity">
                Cidade *
              </label>

              <input
                id="customerCity"
                type="text"
                placeholder="Cidade"
                {...register(
                  'customerCity',
                )}
              />

              {errors.customerCity && (
                <span className="register-sale__error">
                  {
                    errors.customerCity
                      .message
                  }
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="register-sale__section">
          <div className="register-sale__section-heading">
            <BadgeDollarSign size={22} />

            <div>
              <h2>
                Informações da venda
              </h2>

              <p>
                Vendedor responsável,
                desconto, comissão e data
                da negociação.
              </p>
            </div>
          </div>

          <div className="register-sale__grid">
            <div className="register-sale__field">
              <label htmlFor="sellerId">
                Vendedor *
              </label>

              <select
                id="sellerId"
                disabled={
                  isLoadingSellers ||
                  sellers.length === 0
                }
                {...register('sellerId')}
              >
                <option value="">
                  {isLoadingSellers
                    ? 'Carregando vendedores...'
                    : sellers.length === 0
                      ? 'Nenhum vendedor disponível'
                      : 'Selecione o vendedor'}
                </option>

                {sellers.map((seller) => (
                  <option
                    key={seller.id}
                    value={seller.id}
                  >
                    {seller.name}
                    {' · '}
                    {seller.role === 'MASTER'
                      ? 'Master'
                      : 'Funcionário'}
                  </option>
                ))}
              </select>

              {errors.sellerId && (
                <span className="register-sale__error">
                  {errors.sellerId.message}
                </span>
              )}

              {sellersLoadError && (
                <span className="register-sale__error">
                  {sellersLoadError}
                </span>
              )}
            </div>

            <div className="register-sale__field">
              <label htmlFor="salePrice">
                Valor bruto da venda *
              </label>

              <div className="register-sale__input-prefix">
                <span>R$</span>

                <input
                  id="salePrice"
                  type="number"
                  min="0.01"
                  step="0.01"
                  {...register(
                    'salePrice',
                    {
                      setValueAs: (
                        value,
                      ) =>
                        value === ''
                          ? undefined
                          : Number(value),
                    },
                  )}
                />
              </div>

              {errors.salePrice && (
                <span className="register-sale__error">
                  {
                    errors.salePrice
                      .message
                  }
                </span>
              )}
            </div>

            <div className="register-sale__field">
              <label htmlFor="discountAmount">
                Desconto
              </label>

              <div className="register-sale__input-prefix">
                <span>R$</span>

                <input
                  id="discountAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  {...register(
                    'discountAmount',
                    {
                      setValueAs: (
                        value,
                      ) =>
                        value === ''
                          ? 0
                          : Number(value),
                    },
                  )}
                />
              </div>

              <small>
                Campo opcional. Os
                pagamentos devem totalizar
                o valor final após o
                desconto.
              </small>

              {errors.discountAmount && (
                <span className="register-sale__error">
                  {
                    errors.discountAmount
                      .message
                  }
                </span>
              )}
            </div>

            <div className="register-sale__field">
              <label htmlFor="soldAt">
                Data da venda *
              </label>

              <input
                id="soldAt"
                type="date"
                {...register('soldAt')}
              />

              {errors.soldAt && (
                <span className="register-sale__error">
                  {errors.soldAt.message}
                </span>
              )}
            </div>

            <div className="register-sale__field">
              <label htmlFor="commissionType">
                Tipo de comissão
              </label>

              <select
                id="commissionType"
                {...register(
                  'commissionType',
                  {
                    setValueAs: (
                      value,
                    ) =>
                      value === ''
                        ? undefined
                        : (value as CommissionType),
                  },
                )}
              >
                <option value="">
                  Sem comissão
                </option>

                <option value="PERCENTAGE">
                  Porcentagem
                </option>

                <option value="FIXED">
                  Valor fixo
                </option>
              </select>

              {errors.commissionType && (
                <span className="register-sale__error">
                  {
                    errors.commissionType
                      .message
                  }
                </span>
              )}
            </div>

            {watchedCommissionType && (
              <div className="register-sale__field">
                <label htmlFor="commissionValue">
                  {watchedCommissionType ===
                  'PERCENTAGE'
                    ? 'Percentual da comissão *'
                    : 'Valor fixo da comissão *'}
                </label>

                <div className="register-sale__input-prefix">
                  <span>
                    {watchedCommissionType ===
                    'PERCENTAGE'
                      ? '%'
                      : 'R$'}
                  </span>

                  <input
                    id="commissionValue"
                    type="number"
                    min="0.01"
                    max={
                      watchedCommissionType ===
                      'PERCENTAGE'
                        ? 100
                        : undefined
                    }
                    step="0.01"
                    placeholder={
                      watchedCommissionType ===
                      'PERCENTAGE'
                        ? 'Ex.: 5'
                        : 'Ex.: 150,00'
                    }
                    {...register(
                      'commissionValue',
                      {
                        setValueAs: (
                          value,
                        ) =>
                          value === ''
                            ? undefined
                            : Number(
                                value,
                              ),
                      },
                    )}
                  />
                </div>

                {errors.commissionValue && (
                  <span className="register-sale__error">
                    {
                      errors.commissionValue
                        .message
                    }
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="register-sale__financial-summary">
            <div>
              <span>Valor bruto</span>

              <strong>
                {formatCurrency(
                  salePrice,
                )}
              </strong>
            </div>

            <div>
              <span>Desconto</span>

              <strong>
                {formatCurrency(
                  discountAmount,
                )}
              </strong>
            </div>

            <div>
              <span>Valor final</span>

              <strong>
                {formatCurrency(
                  finalSalePrice,
                )}
              </strong>
            </div>

            <div>
              <span>
                Comissão calculada
              </span>

              <strong>
                {formatCurrency(
                  commissionAmount,
                )}
              </strong>
            </div>
          </div>
        </section>

        <section className="register-sale__section">
          <div className="register-sale__section-heading">
            <WalletCards size={22} />

            <div>
              <h2>Formas de pagamento</h2>

              <p>
                Adicione uma ou mais
                formas de pagamento. Na
                troca, o valor do aparelho
                recebido será abatido do
                total da nova venda.
              </p>
            </div>
          </div>

          {paymentFields.map(
            (paymentField, index) => {
              const currentMethod =
                watchedPayments[index]
                  ?.method ??
                paymentField.method;

              const anotherTradeExists =
                tradePaymentIndex !== -1 &&
                tradePaymentIndex !==
                  index;

              return (
                <div
                  key={paymentField.id}
                  className="register-sale__payment"
                >
                  <div className="register-sale__grid">
                    <div className="register-sale__field">
                      <label
                        htmlFor={`paymentMethod-${index}`}
                      >
                        Forma de pagamento *
                      </label>

                      <select
                        id={`paymentMethod-${index}`}
                        {...register(
                          `payments.${index}.method`,
                          {
                            onChange: (
                              event,
                            ) =>
                              handlePaymentMethodChange(
                                index,
                                event
                                  .target
                                  .value as PaymentMethod,
                                currentMethod,
                              ),
                          },
                        )}
                      >
                        <option value="PIX">
                          Pix
                        </option>

                        <option value="DINHEIRO">
                          Dinheiro
                        </option>

                        <option value="CARTAO_CREDITO">
                          Cartão de crédito
                        </option>

                        <option value="CARTAO_DEBITO">
                          Cartão de débito
                        </option>

                        <option value="TRANSFERENCIA">
                          Transferência
                        </option>

                        <option
                          value="TROCA_DISPOSITIVO"
                          disabled={
                            anotherTradeExists
                          }
                        >
                          Troca de dispositivo
                        </option>

                        <option value="OUTRO">
                          Outro
                        </option>
                      </select>

                      {errors.payments?.[
                        index
                      ]?.method && (
                        <span className="register-sale__error">
                          {
                            errors
                              .payments[
                                index
                              ]?.method
                              ?.message
                          }
                        </span>
                      )}
                    </div>

                    <div className="register-sale__field">
                      <label
                        htmlFor={`paymentAmount-${index}`}
                      >
                        {currentMethod ===
                        'TROCA_DISPOSITIVO'
                          ? 'Valor abatido pela troca *'
                          : 'Valor recebido *'}
                      </label>

                      <div className="register-sale__input-prefix">
                        <span>R$</span>

                        <input
                          id={`paymentAmount-${index}`}
                          type="number"
                          min="0.01"
                          step="0.01"
                          readOnly={
                            currentMethod ===
                            'TROCA_DISPOSITIVO'
                          }
                          {...register(
                            `payments.${index}.amount`,
                            {
                              setValueAs: (
                                value,
                              ) =>
                                value === ''
                                  ? undefined
                                  : Number(
                                      value,
                                    ),
                            },
                          )}
                        />
                      </div>

                      {currentMethod ===
                        'TROCA_DISPOSITIVO' && (
                        <small>
                          Informe o valor no
                          cadastro do dispositivo
                          recebido. Ele será
                          abatido automaticamente
                          do total da venda.
                        </small>
                      )}

                      {errors.payments?.[
                        index
                      ]?.amount && (
                        <span className="register-sale__error">
                          {
                            errors
                              .payments[
                                index
                              ]?.amount
                              ?.message
                          }
                        </span>
                      )}
                    </div>

                    {currentMethod ===
                      'CARTAO_CREDITO' && (
                      <div className="register-sale__field">
                        <label
                          htmlFor={`paymentInstallments-${index}`}
                        >
                          Parcelas *
                        </label>

                        <input
                          id={`paymentInstallments-${index}`}
                          type="number"
                          min="1"
                          max="36"
                          step="1"
                          placeholder="Ex.: 5"
                          {...register(
                            `payments.${index}.installments`,
                            {
                              setValueAs: (
                                value,
                              ) =>
                                value === ''
                                  ? undefined
                                  : Number(
                                      value,
                                    ),
                            },
                          )}
                        />

                        {errors.payments?.[
                          index
                        ]?.installments && (
                          <span className="register-sale__error">
                            {
                              errors
                                .payments[
                                  index
                                ]
                                ?.installments
                                ?.message
                            }
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="register-sale__remove-payment"
                    onClick={() =>
                      handleRemovePayment(
                        index,
                      )
                    }
                    disabled={
                      paymentFields.length ===
                      1
                    }
                  >
                    <Trash2 size={17} />

                    Remover pagamento
                  </button>
                </div>
              );
            },
          )}

          {errors.payments?.root
            ?.message && (
            <span className="register-sale__error">
              {
                errors.payments.root
                  .message
              }
            </span>
          )}

          <button
            type="button"
            className="register-sale__add-payment"
            onClick={
              handleAddPayment
            }
            disabled={
              paymentFields.length >= 10
            }
          >
            <Plus size={18} />

            Adicionar forma de pagamento
          </button>

          <div className="register-sale__payment-summary">
            <div>
              <span>Valor bruto</span>

              <strong>
                {formatCurrency(
                  salePrice,
                )}
              </strong>
            </div>

            <div>
              <span>Valor final</span>

              <strong>
                {formatCurrency(
                  finalSalePrice,
                )}
              </strong>
            </div>

            <div>
              <span>
                Total contabilizado
              </span>

              <strong>
                {formatCurrency(
                  totalReceived,
                )}
              </strong>
            </div>

            <div>
              <span>
                {differenceInCents > 0
                  ? 'Valor restante'
                  : differenceInCents < 0
                    ? 'Valor excedente'
                    : 'Situação'}
              </span>

              <strong>
                {differenceInCents > 0
                  ? formatCurrency(
                      remainingValue,
                    )
                  : differenceInCents < 0
                    ? formatCurrency(
                        Math.abs(
                          remainingValue,
                        ),
                      )
                    : finalSalePrice > 0
                      ? 'Pagamento completo'
                      : 'Informe os valores'}
              </strong>
            </div>
          </div>

          {differenceInCents > 0 && (
            <div
              className="register-sale__submit-error"
              role="status"
            >
              Ainda faltam{' '}
              {formatCurrency(
                remainingValue,
              )}{' '}
              para completar o valor da
              venda.
            </div>
          )}

          {differenceInCents < 0 && (
            <div
              className="register-sale__submit-error"
              role="status"
            >
              Os pagamentos excedem o
              valor da venda em{' '}
              {formatCurrency(
                Math.abs(
                  remainingValue,
                ),
              )}
              .
            </div>
          )}
        </section>

        {hasTradePayment && (
          <section className="register-sale__section">
            <div className="register-sale__section-heading">
              <Repeat2 size={22} />

              <div>
                <h2>
                  Dispositivo recebido na
                  troca
                </h2>

                <p>
                  O aparelho será adicionado
                  ao estoque com status
                  pendente de informações.
                </p>
              </div>
            </div>

            <div className="register-sale__grid">
              <div className="register-sale__field">
                <label htmlFor="tradeInBrand">
                  Marca *
                </label>

                <input
                  id="tradeInBrand"
                  type="text"
                  placeholder="Ex.: Apple"
                  {...register(
                    'tradeInDevice.brand',
                  )}
                />

                {errors.tradeInDevice
                  ?.brand && (
                  <span className="register-sale__error">
                    {
                      errors
                        .tradeInDevice
                        .brand.message
                    }
                  </span>
                )}
              </div>

              <div className="register-sale__field">
                <label htmlFor="tradeInModel">
                  Modelo *
                </label>

                <input
                  id="tradeInModel"
                  type="text"
                  placeholder="Ex.: iPhone 12"
                  {...register(
                    'tradeInDevice.model',
                  )}
                />

                {errors.tradeInDevice
                  ?.model && (
                  <span className="register-sale__error">
                    {
                      errors
                        .tradeInDevice
                        .model.message
                    }
                  </span>
                )}
              </div>

              <div className="register-sale__field">
                <label htmlFor="tradeInStorage">
                  Armazenamento *
                </label>

                <select
                  id="tradeInStorage"
                  {...register(
                    'tradeInDevice.storage',
                  )}
                >
                  <option value="">
                    Selecione
                  </option>

                  <option value="32 GB">
                    32 GB
                  </option>

                  <option value="64 GB">
                    64 GB
                  </option>

                  <option value="128 GB">
                    128 GB
                  </option>

                  <option value="256 GB">
                    256 GB
                  </option>

                  <option value="512 GB">
                    512 GB
                  </option>

                  <option value="1 TB">
                    1 TB
                  </option>
                </select>

                {errors.tradeInDevice
                  ?.storage && (
                  <span className="register-sale__error">
                    {
                      errors
                        .tradeInDevice
                        .storage.message
                    }
                  </span>
                )}
              </div>

              <div className="register-sale__field">
                <label htmlFor="tradeInColor">
                  Cor
                </label>

                <input
                  id="tradeInColor"
                  type="text"
                  placeholder="Pode ser informada depois"
                  {...register(
                    'tradeInDevice.color',
                  )}
                />

                {errors.tradeInDevice
                  ?.color && (
                  <span className="register-sale__error">
                    {
                      errors
                        .tradeInDevice
                        .color.message
                    }
                  </span>
                )}
              </div>

              <div className="register-sale__field">
                <label htmlFor="tradeInImei">
                  IMEI
                </label>

                <input
                  id="tradeInImei"
                  type="text"
                  inputMode="numeric"
                  maxLength={15}
                  placeholder="Pode ser informado depois"
                  {...register(
                    'tradeInDevice.imei',
                    {
                      onChange: (
                        event,
                      ) => {
                        event.target.value =
                          event.target.value.replace(
                            /\D/g,
                            '',
                          );
                      },
                    },
                  )}
                />

                {errors.tradeInDevice
                  ?.imei && (
                  <span className="register-sale__error">
                    {
                      errors
                        .tradeInDevice
                        .imei.message
                    }
                  </span>
                )}
              </div>

              <div className="register-sale__field">
                <label htmlFor="tradeInBatteryHealth">
                  Saúde da bateria *
                </label>

                <div className="register-sale__input-prefix">
                  <input
                    id="tradeInBatteryHealth"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Ex.: 87"
                    {...register(
                      'tradeInDevice.batteryHealth',
                      {
                        setValueAs: (
                          value,
                        ) =>
                          value === ''
                            ? undefined
                            : Number(
                                value,
                              ),
                      },
                    )}
                  />

                  <span>%</span>
                </div>

                {errors.tradeInDevice
                  ?.batteryHealth && (
                  <span className="register-sale__error">
                    {
                      errors
                        .tradeInDevice
                        .batteryHealth
                        .message
                    }
                  </span>
                )}
              </div>

              <div className="register-sale__field">
                <label htmlFor="tradeInCondition">
                  Condição *
                </label>

                <select
                  id="tradeInCondition"
                  {...register(
                    'tradeInDevice.condition',
                  )}
                >
                  <option value="NOVO">
                    Novo
                  </option>

                  <option value="SEMINOVO">
                    Seminovo
                  </option>

                  <option value="USADO">
                    Usado
                  </option>
                </select>

                {errors.tradeInDevice
                  ?.condition && (
                  <span className="register-sale__error">
                    {
                      errors
                        .tradeInDevice
                        .condition.message
                    }
                  </span>
                )}
              </div>

              <div className="register-sale__field">
                <label htmlFor="tradeInPurchasePrice">
                  Valor considerado na
                  troca *
                </label>

                <div className="register-sale__input-prefix">
                  <span>R$</span>

                  <input
                    id="tradeInPurchasePrice"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Ex.: 1200,00"
                    {...register(
                      'tradeInDevice.purchasePrice',
                      {
                        setValueAs: (
                          value,
                        ) =>
                          value === ''
                            ? undefined
                            : Number(
                                value,
                              ),

                        onChange: (
                          event,
                        ) =>
                          handleTradeInPurchasePriceChange(
                            event.target
                              .value,
                          ),
                      },
                    )}
                  />
                </div>

                <small>
                  Informe por quanto o
                  dispositivo foi recebido.
                  Esse valor será descontado
                  automaticamente do valor
                  total da nova venda.
                </small>

                {errors.tradeInDevice
                  ?.purchasePrice && (
                  <span className="register-sale__error">
                    {
                      errors
                        .tradeInDevice
                        .purchasePrice
                        .message
                    }
                  </span>
                )}
              </div>

              <div className="register-sale__field">
                <label htmlFor="tradeInEntryDate">
                  Data de entrada *
                </label>

                <input
                  id="tradeInEntryDate"
                  type="date"
                  {...register(
                    'tradeInDevice.entryDate',
                  )}
                />

                {errors.tradeInDevice
                  ?.entryDate && (
                  <span className="register-sale__error">
                    {
                      errors
                        .tradeInDevice
                        .entryDate.message
                    }
                  </span>
                )}
              </div>

              <div className="register-sale__field">
                <label htmlFor="tradeInSalePrice">
                  Valor futuro de venda
                </label>

                <div className="register-sale__input-prefix">
                  <span>R$</span>

                  <input
                    id="tradeInSalePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Pode ser definido depois"
                    {...register(
                      'tradeInDevice.salePrice',
                      {
                        setValueAs: (
                          value,
                        ) =>
                          value === ''
                            ? undefined
                            : Number(
                                value,
                              ),
                      },
                    )}
                  />
                </div>

                {errors.tradeInDevice
                  ?.salePrice && (
                  <span className="register-sale__error">
                    {
                      errors
                        .tradeInDevice
                        .salePrice.message
                    }
                  </span>
                )}
              </div>
            </div>

            <div className="register-sale__field">
              <label htmlFor="tradeInNotes">
                Observações do dispositivo
              </label>

              <textarea
                id="tradeInNotes"
                rows={4}
                placeholder="Informações sobre estado, defeitos ou acessórios."
                {...register(
                  'tradeInDevice.notes',
                )}
              />

              {errors.tradeInDevice
                ?.notes && (
                <span className="register-sale__error">
                  {
                    errors.tradeInDevice
                      .notes.message
                  }
                </span>
              )}
            </div>
          </section>
        )}

        <section className="register-sale__section">
          <div className="register-sale__section-heading">
            <h2>
              Observações da venda
            </h2>

            <p>
              Informações adicionais sobre
              a negociação.
            </p>
          </div>

          <div className="register-sale__field">
            <label htmlFor="notes">
              Observações
            </label>

            <textarea
              id="notes"
              rows={5}
              placeholder="Ex.: R$ 1.200 em troca, R$ 800 em dinheiro e o restante no cartão."
              {...register('notes')}
            />

            {errors.notes && (
              <span className="register-sale__error">
                {errors.notes.message}
              </span>
            )}
          </div>
        </section>

        {submitError && (
          <div
            className="register-sale__submit-error"
            role="alert"
          >
            {submitError}
          </div>
        )}

        <footer className="register-sale__actions">
          <Link
            to={`/dispositivos/${device.id}`}
            className="register-sale__cancel"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            className="register-sale__submit"
            disabled={
              isSubmitting ||
              isLoadingSellers ||
              sellers.length === 0 ||
              !paymentTotalIsValid
            }
          >
            <BadgeDollarSign size={19} />

            {isSubmitting
              ? 'Registrando...'
              : paymentTotalIsValid
                ? 'Confirmar venda'
                : 'Complete o pagamento'}
          </button>
        </footer>
      </form>
    </main>
  );
}