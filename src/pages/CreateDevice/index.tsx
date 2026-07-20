import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Smartphone } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import {
  deviceSchema,
  type DeviceFormData,
} from '../../schemas/deviceSchema';
import {
  deviceExistsByImei,
  saveDevice,
} from '../../services/deviceStorage';
import type { Device } from '../../types/device';

import './styles.scss';

function getCurrentDate() {
  const date = new Date();
  const timezoneOffset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - timezoneOffset)
    .toISOString()
    .split('T')[0];
}

export function CreateDevice() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      brand: '',
      model: '',
      storage: '',
      color: '',
      imei: '',
      batteryHealth: undefined,
      condition: 'SEMINOVO',
      purchasePrice: undefined,
      salePrice: undefined,
      supplier: '',
      entryDate: getCurrentDate(),
      status: 'DISPONIVEL',
      notes: '',
    },
  });

  function handleCreateDevice(data: DeviceFormData) {
    if (deviceExistsByImei(data.imei)) {
      setError('imei', {
        type: 'manual',
        message: 'Já existe um dispositivo cadastrado com este IMEI.',
      });

      return;
    }

    const device: Device = {
      id: crypto.randomUUID(),
      brand: data.brand,
      model: data.model,
      storage: data.storage,
      color: data.color,
      imei: data.imei,
      batteryHealth: data.batteryHealth,
      condition: data.condition,
      purchasePrice: data.purchasePrice,
      salePrice: data.salePrice,
      supplier: data.supplier || undefined,
      entryDate: data.entryDate,
      status: data.status,
      notes: data.notes || undefined,
      createdAt: new Date().toISOString(),
    };

    saveDevice(device);

    navigate('/dispositivos', {
      state: {
        successMessage: 'Dispositivo cadastrado com sucesso.',
      },
    });
  }

  return (
    <main className="create-device">
      <section className="create-device__heading">
        <div>
          <Link
            to="/dispositivos"
            className="create-device__back"
          >
            <ArrowLeft size={18} />
            Voltar para dispositivos
          </Link>

          <h1>Cadastrar dispositivo</h1>

          <p>
            Preencha as informações do aparelho que está entrando
            na loja.
          </p>
        </div>

        <div className="create-device__heading-icon">
          <Smartphone size={28} />
        </div>
      </section>

      <form
        className="create-device__form"
        onSubmit={handleSubmit(handleCreateDevice)}
        noValidate
      >
        <section className="create-device__section">
          <div className="create-device__section-heading">
            <h2>Informações do aparelho</h2>
            <p>Dados de identificação do dispositivo.</p>
          </div>

          <div className="create-device__grid">
            <div className="create-device__field">
              <label htmlFor="brand">Marca *</label>

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
              <label htmlFor="model">Modelo *</label>

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
              <label htmlFor="storage">Armazenamento *</label>

              <select id="storage" {...register('storage')}>
                <option value="">Selecione</option>
                <option value="32 GB">32 GB</option>
                <option value="64 GB">64 GB</option>
                <option value="128 GB">128 GB</option>
                <option value="256 GB">256 GB</option>
                <option value="512 GB">512 GB</option>
                <option value="1 TB">1 TB</option>
              </select>

              {errors.storage && (
                <span className="create-device__error">
                  {errors.storage.message}
                </span>
              )}
            </div>

            <div className="create-device__field">
              <label htmlFor="color">Cor *</label>

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
              <label htmlFor="imei">IMEI *</label>

              <input
                id="imei"
                type="text"
                inputMode="numeric"
                maxLength={15}
                placeholder="Digite os 15 números"
                {...register('imei', {
                  onChange: (event) => {
                    event.target.value = event.target.value.replace(
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
                  placeholder="Ex.: 89"
                  {...register('batteryHealth', {
                    setValueAs: (value) =>
                      value === '' ? undefined : Number(value),
                  })}
                />

                <span>%</span>
              </div>

              {errors.batteryHealth && (
                <span className="create-device__error">
                  {errors.batteryHealth.message}
                </span>
              )}
            </div>

            <div className="create-device__field">
              <label htmlFor="condition">Condição *</label>

              <select
                id="condition"
                {...register('condition')}
              >
                <option value="NOVO">Novo</option>
                <option value="SEMINOVO">Seminovo</option>
                <option value="USADO">Usado</option>
              </select>

              {errors.condition && (
                <span className="create-device__error">
                  {errors.condition.message}
                </span>
              )}
            </div>

            <div className="create-device__field">
              <label htmlFor="status">Status inicial *</label>

              <select id="status" {...register('status')}>
                <option value="DISPONIVEL">Disponível</option>
                <option value="RESERVADO">Reservado</option>
                <option value="VENDIDO">Vendido</option>
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
              Informações comerciais e de entrada no estoque.
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
                  placeholder="0,00"
                  {...register('purchasePrice', {
                    valueAsNumber: true,
                  })}
                />
              </div>

              {errors.purchasePrice && (
                <span className="create-device__error">
                  {errors.purchasePrice.message}
                </span>
              )}
            </div>

            <div className="create-device__field">
              <label htmlFor="salePrice">Valor de venda *</label>

              <div className="create-device__input-prefix">
                <span>R$</span>

                <input
                  id="salePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
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
              <label htmlFor="entryDate">Data de entrada *</label>

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
              <label htmlFor="supplier">Fornecedor</label>

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
              Registre detalhes adicionais sobre o dispositivo.
            </p>
          </div>

          <div className="create-device__field">
            <label htmlFor="notes">Observações</label>

            <textarea
              id="notes"
              rows={5}
              placeholder="Ex.: Aparelho com caixa, carregador e nota fiscal."
              {...register('notes')}
            />

            {errors.notes && (
              <span className="create-device__error">
                {errors.notes.message}
              </span>
            )}
          </div>
        </section>

        <footer className="create-device__actions">
          <Link
            to="/dispositivos"
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
              : 'Cadastrar dispositivo'}
          </button>
        </footer>
      </form>
    </main>
  );
}