import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  BadgeDollarSign,
  Smartphone,
} from 'lucide-react';
import { useEffect, useState } from 'react';
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
import {
  getDeviceById,
  updateDeviceStatus,
} from '../../services/deviceStorage';
import { saveSale } from '../../services/saleStorage';
import type { Device } from '../../types/device';
import type { Sale } from '../../types/sale';
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

  const {
    register,
    reset,
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
    if (!id) {
      setIsLoading(false);
      return;
    }

    const storedDevice = getDeviceById(id);

    if (!storedDevice) {
      setIsLoading(false);
      return;
    }

    setDevice(storedDevice);

    reset({
      customerName: '',
      customerPhone: '',
      salePrice: storedDevice.salePrice,
      paymentMethod: 'PIX',
      soldAt: getCurrentDate(),
      notes: '',
    });

    setIsLoading(false);
  }, [id, reset]);

  function handleRegisterSale(
    data: SaleFormData,
  ) {
    if (!device) {
      return;
    }

    const sale: Sale = {
      id: crypto.randomUUID(),
      deviceId: device.id,
      deviceBrand: device.brand,
      deviceModel: device.model,
      deviceImei: device.imei,
      purchasePrice: device.purchasePrice,
      salePrice: data.salePrice,
      customerName: data.customerName,
      customerPhone:
        data.customerPhone || undefined,
      paymentMethod: data.paymentMethod,
      soldAt: data.soldAt,
      notes: data.notes || undefined,
      createdAt: new Date().toISOString(),
    };

    saveSale(sale);

    updateDeviceStatus(
      device.id,
      'VENDIDO',
    );

    navigate('/dispositivos', {
      state: {
        successMessage:
          'Venda registrada com sucesso.',
      },
    });
  }

  if (isLoading) {
    return (
      <main className="register-sale">
        <p>Carregando dispositivo...</p>
      </main>
    );
  }

  if (!device) {
    return (
      <main className="register-sale">
        <section className="register-sale__not-found">
          <Smartphone size={36} />

          <h1>Dispositivo não encontrado</h1>

          <p>
            O aparelho não existe ou foi excluído.
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
            Este aparelho já está marcado como
            vendido.
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
            Informe os dados da venda e do
            cliente.
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
            {device.storage} · {device.color} ·
            IMEI {device.imei}
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
              Identificação da pessoa que comprou
              o aparelho.
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
                  {
                    errors.customerPhone
                      .message
                  }
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
                <option value="PIX">Pix</option>

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

        <section className="register-sale__section">
          <div className="register-sale__section-heading">
            <h2>Observações</h2>

            <p>
              Informações adicionais sobre a
              venda.
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