import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Save,
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
  deviceSchema,
  type DeviceFormData,
} from '../../schemas/deviceSchema';
import { ApiError } from '../../services/api';
import {
  getDeviceById,
  updateDevice,
} from '../../services/deviceApi';
import type { Device } from '../../types/device';

import '../CreateDevice/styles.scss';

export function EditDevice() {
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
    handleSubmit,
    reset,
    setError,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
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
          brand: apiDevice.brand,
          model: apiDevice.model,
          storage: apiDevice.storage,
          color: apiDevice.color,
          imei: apiDevice.imei,
          batteryHealth:
            apiDevice.batteryHealth ?? undefined,
          condition: apiDevice.condition,
          purchasePrice:
            apiDevice.purchasePrice,
          salePrice: apiDevice.salePrice,
          supplier:
            apiDevice.supplier ?? '',
          entryDate: apiDevice.entryDate,
          status: apiDevice.status,
          notes: apiDevice.notes ?? '',
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

  async function handleEditDevice(
    data: DeviceFormData,
  ) {
    if (!id || !device) {
      return;
    }

    setSubmitError('');

    try {
      const updatedDevice =
        await updateDevice(id, {
          brand: data.brand,
          model: data.model,
          storage: data.storage,
          color: data.color,
          imei: data.imei,
          batteryHealth:
            data.batteryHealth,
          condition: data.condition,
          purchasePrice:
            data.purchasePrice,
          salePrice: data.salePrice,
          supplier:
            data.supplier || undefined,
          entryDate: data.entryDate,
          status: data.status,
          notes:
            data.notes || undefined,
        });

      setDevice(updatedDevice);

      navigate(
        `/dispositivos/${updatedDevice.id}`,
        {
          state: {
            successMessage:
              'Dispositivo atualizado com sucesso.',
          },
        },
      );
    } catch (error) {
      if (error instanceof ApiError) {
        const imeiError =
          error.errors?.imei?.[0];

        if (
          imeiError ||
          (error.status === 409 &&
            error.message
              .toLowerCase()
              .includes('imei'))
        ) {
          setError('imei', {
            type: 'server',
            message:
              imeiError ?? error.message,
          });

          return;
        }

        setSubmitError(error.message);
        return;
      }

      console.error(
        'Erro ao atualizar dispositivo:',
        error,
      );

      setSubmitError(
        'Não foi possível atualizar o dispositivo. Verifique a conexão com a API.',
      );
    }
  }

  if (isLoading) {
    return (
      <main className="create-device">
        <section className="create-device__section">
          <div className="create-device__heading-icon">
            <Smartphone size={28} />
          </div>

          <h1>Carregando dispositivo...</h1>

          <p>
            Aguarde enquanto buscamos os dados do
            aparelho.
          </p>
        </section>
      </main>
    );
  }

  if (notFound || !device) {
    return (
      <main className="create-device">
        <section className="create-device__section">
          <h1>Dispositivo não encontrado</h1>

          <p>
            {loadError ||
              'O aparelho não existe ou foi excluído.'}
          </p>

          <Link
            to="/dispositivos"
            className="create-device__back"
          >
            <ArrowLeft size={18} />
            Voltar para dispositivos
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="create-device">
      <section className="create-device__heading">
        <div>
          <Link
            to={`/dispositivos/${device.id}`}
            className="create-device__back"
          >
            <ArrowLeft size={18} />
            Voltar para os detalhes
          </Link>

          <h1>Editar dispositivo</h1>

          <p>
            Atualize as informações do aparelho.
          </p>
        </div>

        <div className="create-device__heading-icon">
          <Smartphone size={28} />
        </div>
      </section>

      <form
        className="create-device__form"
        onSubmit={handleSubmit(
          handleEditDevice,
        )}
        noValidate
      >
        <section className="create-device__section">
          <div className="create-device__section-heading">
            <h2>Informações do aparelho</h2>

            <p>
              Dados de identificação do dispositivo.
            </p>
          </div>

          <div className="create-device__grid">
            <div className="create-device__field">
              <label htmlFor="brand">
                Marca *
              </label>

              <input
                id="brand"
                type="text"
                placeholder="Ex.: Apple"
                {...register('brand')}
              />

              {errors.brand && (
                <span className="create-device__error">
                  {errors.brand.message}
                </span>
              )}
            </div>

            <div className="create-device__field">
              <label htmlFor="model">
                Modelo *
              </label>

              <input
                id="model"
                type="text"
                placeholder="Ex.: iPhone 14 Pro"
                {...register('model')}
              />

              {errors.model && (
                <span className="create-device__error">
                  {errors.model.message}
                </span>
              )}
            </div>

            <div className="create-device__field">
              <label htmlFor="storage">
                Armazenamento *
              </label>

              <select
                id="storage"
                {...register('storage')}
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

              {errors.storage && (
                <span className="create-device__error">
                  {errors.storage.message}
                </span>
              )}
            </div>

            <div className="create-device__field">
              <label htmlFor="color">
                Cor *
              </label>

              <input
                id="color"
                type="text"
                placeholder="Ex.: Preto"
                {...register('color')}
              />

              {errors.color && (
                <span className="create-device__error">
                  {errors.color.message}
                </span>
              )}
            </div>

            <div className="create-device__field">
              <label htmlFor="imei">
                IMEI *
              </label>

              <input
                id="imei"
                type="text"
                inputMode="numeric"
                maxLength={15}
                placeholder="Digite os 15 números"
                {...register('imei', {
                  onChange: (event) => {
                    event.target.value =
                      event.target.value.replace(
                        /\D/g,
                        '',
                      );
                  },
                })}
              />

              {errors.imei && (
                <span className="create-device__error">
                  {errors.imei.message}
                </span>
              )}
            </div>

            <div className="create-device__field">
              <label htmlFor="batteryHealth">
                Saúde da bateria
              </label>

              <div className="create-device__input-suffix">
                <input
                  id="batteryHealth"
                  type="number"
                  min="0"
                  max="100"
                  {...register(
                    'batteryHealth',
                    {
                      setValueAs: (value) =>
                        value === ''
                          ? undefined
                          : Number(value),
                    },
                  )}
                />

                <span>%</span>
              </div>

              {errors.batteryHealth && (
                <span className="create-device__error">
                  {
                    errors.batteryHealth
                      .message
                  }
                </span>
              )}
            </div>

            <div className="create-device__field">
              <label htmlFor="condition">
                Condição *
              </label>

              <select
                id="condition"
                {...register('condition')}
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

              {errors.condition && (
                <span className="create-device__error">
                  {errors.condition.message}
                </span>
              )}
            </div>

            <div className="create-device__field">
              <label htmlFor="status">
                Status *
              </label>

              <select
                id="status"
                {...register('status')}
              >
                <option value="DISPONIVEL">
                  Disponível
                </option>

                <option value="RESERVADO">
                  Reservado
                </option>

                <option value="VENDIDO">
                  Vendido
                </option>
              </select>

              {errors.status && (
                <span className="create-device__error">
                  {errors.status.message}
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="create-device__section">
          <div className="create-device__section-heading">
            <h2>Entrada e valores</h2>

            <p>
              Informações comerciais do aparelho.
            </p>
          </div>

          <div className="create-device__grid">
            <div className="create-device__field">
              <label htmlFor="purchasePrice">
                Valor de compra *
              </label>

              <div className="create-device__input-prefix">
                <span>R$</span>

                <input
                  id="purchasePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register(
                    'purchasePrice',
                    {
                      valueAsNumber: true,
                    },
                  )}
                />
              </div>

              {errors.purchasePrice && (
                <span className="create-device__error">
                  {
                    errors.purchasePrice
                      .message
                  }
                </span>
              )}
            </div>

            <div className="create-device__field">
              <label htmlFor="salePrice">
                Valor de venda *
              </label>

              <div className="create-device__input-prefix">
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
                <span className="create-device__error">
                  {errors.salePrice.message}
                </span>
              )}
            </div>

            <div className="create-device__field">
              <label htmlFor="entryDate">
                Data de entrada *
              </label>

              <input
                id="entryDate"
                type="date"
                {...register('entryDate')}
              />

              {errors.entryDate && (
                <span className="create-device__error">
                  {errors.entryDate.message}
                </span>
              )}
            </div>

            <div className="create-device__field">
              <label htmlFor="supplier">
                Fornecedor
              </label>

              <input
                id="supplier"
                type="text"
                placeholder="Nome do fornecedor"
                {...register('supplier')}
              />

              {errors.supplier && (
                <span className="create-device__error">
                  {errors.supplier.message}
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="create-device__section">
          <div className="create-device__section-heading">
            <h2>Observações</h2>

            <p>
              Informações adicionais sobre o aparelho.
            </p>
          </div>

          <div className="create-device__field">
            <label htmlFor="notes">
              Observações
            </label>

            <textarea
              id="notes"
              rows={5}
              {...register('notes')}
            />

            {errors.notes && (
              <span className="create-device__error">
                {errors.notes.message}
              </span>
            )}
          </div>
        </section>

        {submitError && (
          <div
            className="create-device__submit-error"
            role="alert"
          >
            {submitError}
          </div>
        )}

        <footer className="create-device__actions">
          <Link
            to={`/dispositivos/${device.id}`}
            className="create-device__cancel"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            className="create-device__submit"
            disabled={isSubmitting}
          >
            <Save size={19} />

            {isSubmitting
              ? 'Salvando...'
              : 'Salvar alterações'}
          </button>
        </footer>
      </form>
    </main>
  );
}