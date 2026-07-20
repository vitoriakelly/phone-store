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
import {
  deviceExistsByImei,
  getDeviceById,
  updateDevice,
} from '../../services/deviceStorage';
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
    if (!id) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    const storedDevice = getDeviceById(id);

    if (!storedDevice) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    setDevice(storedDevice);

    reset({
      brand: storedDevice.brand,
      model: storedDevice.model,
      storage: storedDevice.storage,
      color: storedDevice.color,
      imei: storedDevice.imei,
      batteryHealth:
        storedDevice.batteryHealth,
      condition: storedDevice.condition,
      purchasePrice:
        storedDevice.purchasePrice,
      salePrice: storedDevice.salePrice,
      supplier: storedDevice.supplier ?? '',
      entryDate: storedDevice.entryDate,
      status: storedDevice.status,
      notes: storedDevice.notes ?? '',
    });

    setIsLoading(false);
  }, [id, reset]);

  function handleEditDevice(
    data: DeviceFormData,
  ) {
    if (!id || !device) {
      return;
    }

    if (deviceExistsByImei(data.imei, id)) {
      setError('imei', {
        type: 'manual',
        message:
          'Já existe outro dispositivo cadastrado com este IMEI.',
      });

      return;
    }

    const updatedDevice: Device = {
      ...device,
      ...data,
      supplier:
        data.supplier || undefined,
      notes: data.notes || undefined,
    };

    const result =
      updateDevice(updatedDevice);

    if (!result) {
      return;
    }

    navigate('/dispositivos', {
      state: {
        successMessage:
          'Dispositivo atualizado com sucesso.',
      },
    });
  }

  if (isLoading) {
    return (
      <main className="create-device">
        <p>Carregando dispositivo...</p>
      </main>
    );
  }

  if (notFound || !device) {
    return (
      <main className="create-device">
        <section className="create-device__section">
          <h1>Dispositivo não encontrado</h1>

          <p>
            O aparelho não existe ou foi excluído.
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
          </div>
        </section>

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