import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  BadgeDollarSign,
  MapPin,
  Repeat2,
  Smartphone,
  UserRound,
} from 'lucide-react';
import {
  useEffect,
  useState,
} from 'react';
import {
  type FieldPath,
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
import type { Device } from '../../types/device';
import type { TradeInDeviceInput } from '../../types/sale';
import { formatCurrency } from '../../utils/currency';

import './styles.scss';

function getCurrentDate() {
  const currentDate = new Date();

  const timezoneOffset =
    currentDate.getTimezoneOffset() *
    60_000;

  return new Date(
    currentDate.getTime() -
      timezoneOffset,
  )
    .toISOString()
    .split('T')[0];
}

function buildTradeInDevice(
  data: SaleFormData,
): TradeInDeviceInput | undefined {
  if (
    data.paymentMethod !==
    'TROCA_DISPOSITIVO'
  ) {
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
    brand:
      tradeInDevice.brand.trim(),

    model:
      tradeInDevice.model.trim(),

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

  const [isLoading, setIsLoading] =
    useState(true);

  const [notFound, setNotFound] =
    useState(false);

  const [loadError, setLoadError] =
    useState('');

  const [submitError, setSubmitError] =
    useState('');

  const {
    register,
    reset,
    setError,
    watch,
    handleSubmit,

    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),

    defaultValues: {
      customerName: '',
      customerPhone: '',

      customerZipCode: '',
      customerStreet: '',
      customerNeighborhood: '',
      customerCity: '',
      customerAddressNumber: '',
      customerSocialNetwork: '',

      salePrice: undefined,
      paymentMethod: 'PIX',
      soldAt: getCurrentDate(),
      notes: '',

      tradeInDevice: {
        brand: '',
        model: '',
        storage: '',
        color: '',
        imei: '',
        batteryHealth: undefined,
        condition: 'SEMINOVO',
        purchasePrice: undefined,
        salePrice: undefined,
        entryDate: getCurrentDate(),
        notes: '',
      },
    },
  });

  const paymentMethod =
    watch('paymentMethod');

  const isTradeIn =
    paymentMethod ===
    'TROCA_DISPOSITIVO';

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

        reset({
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

          paymentMethod: 'PIX',
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

  async function handleRegisterSale(
    data: SaleFormData,
  ) {
    if (!device) {
      return;
    }

    setSubmitError('');

    const tradeInDevice =
      buildTradeInDevice(data);

    if (
      data.paymentMethod ===
        'TROCA_DISPOSITIVO' &&
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

        paymentMethod:
          data.paymentMethod,

        soldAt: data.soldAt,

        notes:
          data.notes?.trim() ||
          undefined,

        tradeInDevice,
      });

      navigate('/dispositivos', {
        state: {
          successMessage:
            data.paymentMethod ===
            'TROCA_DISPOSITIVO'
              ? 'Venda registrada e dispositivo recebido adicionado ao estoque.'
              : 'Venda registrada com sucesso.',
        },
      });
    } catch (error) {
      if (
        error instanceof ApiError
      ) {
        const formFields: Array<
          FieldPath<SaleFormData>
        > = [
          'customerName',
          'customerPhone',
          'customerZipCode',
          'customerStreet',
          'customerNeighborhood',
          'customerCity',
          'customerAddressNumber',
          'customerSocialNetwork',
          'salePrice',
          'paymentMethod',
          'soldAt',
          'notes',

          'tradeInDevice.brand',
          'tradeInDevice.model',
          'tradeInDevice.storage',
          'tradeInDevice.color',
          'tradeInDevice.imei',
          'tradeInDevice.batteryHealth',
          'tradeInDevice.condition',
          'tradeInDevice.purchasePrice',
          'tradeInDevice.salePrice',
          'tradeInDevice.entryDate',
          'tradeInDevice.notes',
        ];

        let hasFieldError = false;

        for (const field of formFields) {
          const fieldMessage =
            error.errors?.[field]?.[0];

          if (!fieldMessage) {
            continue;
          }

          hasFieldError = true;

          setError(field, {
            type: 'server',
            message: fieldMessage,
          });
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
            do comprador e da negociação.
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
              <h2>
                Dados do comprador
              </h2>

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
                Valor, forma de pagamento
                e data da negociação.
              </p>
            </div>
          </div>

          <div className="register-sale__grid">
            <div className="register-sale__field">
              <label htmlFor="salePrice">
                Valor final da venda *
              </label>

              <div className="register-sale__input-prefix">
                <span>R$</span>

                <input
                  id="salePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register(
                    'salePrice',
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
              <label htmlFor="paymentMethod">
                Forma de pagamento *
              </label>

              <select
                id="paymentMethod"
                {...register(
                  'paymentMethod',
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

                <option value="TROCA_DISPOSITIVO">
                  Troca de dispositivo
                </option>

                <option value="OUTRO">
                  Outro
                </option>
              </select>

              {errors.paymentMethod && (
                <span className="register-sale__error">
                  {
                    errors.paymentMethod
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
          </div>
        </section>

        {isTradeIn && (
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
                  Valor de compra *
                </label>

                <div className="register-sale__input-prefix">
                  <span>R$</span>

                  <input
                    id="tradeInPurchasePrice"
                    type="number"
                    min="0"
                    step="0.01"
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
                      },
                    )}
                  />
                </div>

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
                  Valor de venda
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
            <h2>Observações da venda</h2>

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
              placeholder="Ex.: Pagamento dividido entre Pix e cartão."
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
            disabled={isSubmitting}
          >
            <BadgeDollarSign size={19} />

            {isSubmitting
              ? 'Registrando...'
              : 'Confirmar venda'}
          </button>
        </footer>
      </form>
    </main>
  );
}