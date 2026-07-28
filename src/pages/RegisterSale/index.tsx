import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  BadgeDollarSign,
  Smartphone,
} from 'lucide-react';
import {
  useEffect,
  useState,
} from 'react';
import { useForm } from 'react-hook-form';
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
      salePrice: undefined,
      paymentMethod: 'PIX',
      soldAt: getCurrentDate(),
      notes: '',
    },
  });

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
          salePrice: apiDevice.salePrice,
          paymentMethod: 'PIX',
          soldAt: getCurrentDate(),
          notes: '',
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

        if (error instanceof ApiError) {
          setLoadError(error.message);
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

    try {
      await createSale({
        deviceId: device.id,
        customerName: data.customerName,
        customerPhone:
          data.customerPhone || undefined,
        salePrice: data.salePrice,
        paymentMethod: data.paymentMethod,
        soldAt: data.soldAt,
        notes: data.notes || undefined,
      });

      navigate('/dispositivos', {
        state: {
          successMessage:
            'Venda registrada com sucesso.',
        },
      });
    } catch (error) {
      if (error instanceof ApiError) {
        const formFields: Array<
          keyof SaleFormData
        > = [
          'customerName',
          'customerPhone',
          'salePrice',
          'paymentMethod',
          'soldAt',
          'notes',
        ];

        for (const field of formFields) {
          const fieldMessage =
            error.errors?.[field]?.[0];

          if (fieldMessage) {
            setError(field, {
              type: 'server',
              message: fieldMessage,
            });

            return;
          }
        }

        setSubmitError(error.message);
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

          <h1>Carregando dispositivo...</h1>

          <p>
            Aguarde enquanto buscamos os dados do
            aparelho.
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

          <h1>Dispositivo já vendido</h1>

          <p>
            Este aparelho já possui uma venda
            registrada.
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
            Informe os dados da venda e do cliente.
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
          <span>Dispositivo selecionado</span>

          <strong>
            {device.brand} {device.model}
          </strong>

          <p>
            {device.storage} · {device.color} · IMEI{' '}
            {device.imei}
          </p>
        </div>

        <div className="register-sale__suggested-price">
          <span>Valor anunciado</span>

          <strong>
            {formatCurrency(device.salePrice)}
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
            <h2>Dados do cliente</h2>

            <p>
              Identificação da pessoa que comprou o
              aparelho.
            </p>
          </div>

          <div className="register-sale__grid">
            <div className="register-sale__field">
              <label htmlFor="customerName">
                Nome do cliente *
              </label>

              <input
                id="customerName"
                type="text"
                placeholder="Nome completo"
                {...register('customerName')}
              />

              {errors.customerName && (
                <span className="register-sale__error">
                  {errors.customerName.message}
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
                {...register('customerPhone')}
              />

              {errors.customerPhone && (
                <span className="register-sale__error">
                  {errors.customerPhone.message}
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="register-sale__section">
          <div className="register-sale__section-heading">
            <h2>Informações da venda</h2>

            <p>
              Valor, forma de pagamento e data da
              negociação.
            </p>
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
                  {...register('salePrice', {
                    valueAsNumber: true,
                  })}
                />
              </div>

              {errors.salePrice && (
                <span className="register-sale__error">
                  {errors.salePrice.message}
                </span>
              )}
            </div>

            <div className="register-sale__field">
              <label htmlFor="paymentMethod">
                Forma de pagamento *
              </label>

              <select
                id="paymentMethod"
                {...register('paymentMethod')}
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

                <option value="OUTRO">
                  Outro
                </option>
              </select>

              {errors.paymentMethod && (
                <span className="register-sale__error">
                  {errors.paymentMethod.message}
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

        <section className="register-sale__section">
          <div className="register-sale__section-heading">
            <h2>Observações</h2>

            <p>
              Informações adicionais sobre a venda.
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