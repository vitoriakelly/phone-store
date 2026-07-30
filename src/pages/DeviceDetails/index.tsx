import {
  ArrowLeft,
  BadgeDollarSign,
  BatteryCharging,
  CalendarDays,
  CircleDollarSign,
  Factory,
  HardDrive,
  Hash,
  Palette,
  Pencil,
  Save,
  ShieldCheck,
  Smartphone,
  Trash2,
} from 'lucide-react';
import {
  useEffect,
  useState,
} from 'react';
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';

import { ApiError } from '../../services/api';
import {
  deleteDevice,
  getDeviceById,
  updateDevice,
} from '../../services/deviceApi';
import type {
  Device,
  DeviceStatus,
} from '../../types/device';
import { formatCurrency } from '../../utils/currency';

import './styles.scss';

function formatDate(date: string) {
  return new Intl.DateTimeFormat(
    'pt-BR',
  ).format(
    new Date(`${date}T12:00:00`),
  );
}

function getStatusLabel(
  status: DeviceStatus,
) {
  const labels: Record<
    DeviceStatus,
    string
  > = {
    PENDENTE_INFORMACOES:
      'Pendente de informações',
    DISPONIVEL: 'Disponível',
    RESERVADO: 'Reservado',
    VENDIDO: 'Vendido',
  };

  return labels[status];
}

function getConditionLabel(
  condition: Device['condition'],
) {
  const labels: Record<
    Device['condition'],
    string
  > = {
    NOVO: 'Novo',
    SEMINOVO: 'Seminovo',
    USADO: 'Usado',
  };

  return labels[condition];
}

function formatNullableCurrency(
  value: number | null,
) {
  if (value === null) {
    return 'Pendente';
  }

  return formatCurrency(value);
}

export function DeviceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [device, setDevice] =
    useState<Device | null>(null);

  const [
    selectedStatus,
    setSelectedStatus,
  ] =
    useState<DeviceStatus>(
      'DISPONIVEL',
    );

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const [loadError, setLoadError] =
    useState('');

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    isUpdatingStatus,
    setIsUpdatingStatus,
  ] = useState(false);

  const [isDeleting, setIsDeleting] =
    useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDevice() {
      if (!id) {
        if (isMounted) {
          setLoadError(
            'O identificador do dispositivo não foi informado.',
          );

          setIsLoading(false);
        }

        return;
      }

      setIsLoading(true);
      setLoadError('');

      try {
        const apiDevice =
          await getDeviceById(id);

        if (!isMounted) {
          return;
        }

        setDevice(apiDevice);

        setSelectedStatus(
          apiDevice.status,
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setDevice(null);

        if (
          error instanceof ApiError &&
          error.status === 404
        ) {
          setLoadError(
            'O aparelho solicitado não existe ou foi excluído.',
          );
        } else if (
          error instanceof ApiError
        ) {
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
  }, [id]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeout =
      window.setTimeout(() => {
        setSuccessMessage('');
      }, 3500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [successMessage]);

  async function handleUpdateStatus() {
    if (
      !id ||
      !device ||
      selectedStatus === device.status
    ) {
      return;
    }

    setIsUpdatingStatus(true);

    try {
      const updatedDevice =
        await updateDevice(id, {
          status: selectedStatus,
        });

      setDevice(updatedDevice);

      setSelectedStatus(
        updatedDevice.status,
      );

      setSuccessMessage(
        'Status atualizado com sucesso.',
      );
    } catch (error) {
      if (error instanceof ApiError) {
        window.alert(error.message);
      } else {
        window.alert(
          'Não foi possível atualizar o status do dispositivo.',
        );
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  async function handleDeleteDevice() {
    if (!device || isDeleting) {
      return;
    }

    const shouldDelete =
      window.confirm(
        `Deseja realmente excluir ${device.brand} ${device.model}?`,
      );

    if (!shouldDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteDevice(device.id);

      navigate('/dispositivos', {
        state: {
          successMessage:
            'Dispositivo excluído com sucesso.',
        },
      });
    } catch (error) {
      if (error instanceof ApiError) {
        window.alert(error.message);
      } else {
        window.alert(
          'Não foi possível excluir o dispositivo.',
        );
      }
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="device-details">
        <section className="device-details__not-found">
          <div className="device-details__not-found-icon">
            <Smartphone size={34} />
          </div>

          <h1>
            Carregando dispositivo...
          </h1>

          <p>
            Aguarde enquanto buscamos as
            informações do aparelho.
          </p>
        </section>
      </main>
    );
  }

  if (!device) {
    return (
      <main className="device-details">
        <section className="device-details__not-found">
          <div className="device-details__not-found-icon">
            <Smartphone size={34} />
          </div>

          <h1>
            Dispositivo não encontrado
          </h1>

          <p>
            {loadError ||
              'O aparelho solicitado não existe ou foi excluído.'}
          </p>

          <Link to="/dispositivos">
            <ArrowLeft size={18} />

            Voltar para dispositivos
          </Link>
        </section>
      </main>
    );
  }

  const profit =
    device.salePrice === null
      ? null
      : device.salePrice -
        device.purchasePrice;

  const canRegisterSale =
    device.status === 'DISPONIVEL' ||
    device.status === 'RESERVADO';

  return (
    <main className="device-details">
      <section className="device-details__heading">
        <div>
          <Link
            to="/dispositivos"
            className="device-details__back"
          >
            <ArrowLeft size={18} />

            Voltar para dispositivos
          </Link>

          <div className="device-details__title">
            <div className="device-details__title-icon">
              <Smartphone size={27} />
            </div>

            <div>
              <h1>
                {device.brand}{' '}
                {device.model}
              </h1>

              <p>
                {device.storage} ·{' '}
                {device.color ||
                  'Cor pendente'}
              </p>
            </div>
          </div>
        </div>

        <div className="device-details__heading-actions">
          {canRegisterSale && (
            <Link
              to={`/dispositivos/${device.id}/vender`}
              className="device-details__sell"
            >
              <BadgeDollarSign
                size={17}
              />

              Registrar venda
            </Link>
          )}

          <Link
            to={`/dispositivos/${device.id}/editar`}
            className="device-details__edit"
          >
            <Pencil size={17} />

            Editar dispositivo
          </Link>

          <span
            className={`device-details__status device-details__status--${device.status.toLowerCase()}`}
          >
            {getStatusLabel(
              device.status,
            )}
          </span>
        </div>
      </section>

      {successMessage && (
        <div
          className="device-details__success"
          role="status"
        >
          {successMessage}
        </div>
      )}

      <section className="device-details__content">
        <div className="device-details__main">
          <section className="device-details__section">
            <div className="device-details__section-heading">
              <h2>
                Informações do dispositivo
              </h2>

              <p>
                Dados de identificação e
                características do
                aparelho.
              </p>
            </div>

            <div className="device-details__information-grid">
              <article className="device-details__information">
                <Factory size={20} />

                <div>
                  <span>Marca</span>

                  <strong>
                    {device.brand}
                  </strong>
                </div>
              </article>

              <article className="device-details__information">
                <Smartphone size={20} />

                <div>
                  <span>Modelo</span>

                  <strong>
                    {device.model}
                  </strong>
                </div>
              </article>

              <article className="device-details__information">
                <HardDrive size={20} />

                <div>
                  <span>
                    Armazenamento
                  </span>

                  <strong>
                    {device.storage}
                  </strong>
                </div>
              </article>

              <article className="device-details__information">
                <Palette size={20} />

                <div>
                  <span>Cor</span>

                  <strong>
                    {device.color ||
                      'Pendente'}
                  </strong>
                </div>
              </article>

              <article className="device-details__information">
                <Hash size={20} />

                <div>
                  <span>IMEI</span>

                  <strong>
                    {device.imei ||
                      'Pendente'}
                  </strong>
                </div>
              </article>

              <article className="device-details__information">
                <ShieldCheck
                  size={20}
                />

                <div>
                  <span>Condição</span>

                  <strong>
                    {getConditionLabel(
                      device.condition,
                    )}
                  </strong>
                </div>
              </article>

              <article className="device-details__information">
                <BatteryCharging
                  size={20}
                />

                <div>
                  <span>
                    Saúde da bateria
                  </span>

                  <strong>
                    {device.batteryHealth !==
                    null
                      ? `${device.batteryHealth}%`
                      : 'Não informada'}
                  </strong>
                </div>
              </article>

              <article className="device-details__information">
                <CalendarDays
                  size={20}
                />

                <div>
                  <span>
                    Data de entrada
                  </span>

                  <strong>
                    {formatDate(
                      device.entryDate,
                    )}
                  </strong>
                </div>
              </article>
            </div>
          </section>

          <section className="device-details__section">
            <div className="device-details__section-heading">
              <h2>
                Informações comerciais
              </h2>

              <p>
                Valores de aquisição e
                venda do aparelho.
              </p>
            </div>

            <div className="device-details__price-grid">
              <article className="device-details__price-card">
                <span>
                  Valor de compra
                </span>

                <strong>
                  {formatCurrency(
                    device.purchasePrice,
                  )}
                </strong>
              </article>

              <article className="device-details__price-card">
                <span>
                  Valor de venda
                </span>

                <strong>
                  {formatNullableCurrency(
                    device.salePrice,
                  )}
                </strong>
              </article>

              <article className="device-details__price-card">
                <span>
                  Lucro estimado
                </span>

                <strong>
                  {profit === null
                    ? 'Pendente'
                    : formatCurrency(
                        profit,
                      )}
                </strong>
              </article>
            </div>

            <div className="device-details__supplier">
              <CircleDollarSign
                size={20}
              />

              <div>
                <span>Fornecedor</span>

                <strong>
                  {device.supplier ||
                    'Não informado'}
                </strong>
              </div>
            </div>
          </section>

          <section className="device-details__section">
            <div className="device-details__section-heading">
              <h2>Observações</h2>

              <p>
                Informações adicionais
                registradas no cadastro.
              </p>
            </div>

            <div className="device-details__notes">
              {device.notes ||
                'Nenhuma observação cadastrada.'}
            </div>
          </section>
        </div>

        <aside className="device-details__sidebar">
          <section className="device-details__status-card">
            <h2>Alterar status</h2>

            <p>
              Atualize a situação atual
              do aparelho.
            </p>

            <label htmlFor="deviceStatus">
              Status do dispositivo
            </label>

            <select
              id="deviceStatus"
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(
                  event.target
                    .value as DeviceStatus,
                )
              }
              disabled={
                isUpdatingStatus
              }
            >
              <option value="PENDENTE_INFORMACOES">
                Pendente de informações
              </option>

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

            <button
              type="button"
              onClick={() =>
                void handleUpdateStatus()
              }
              disabled={
                isUpdatingStatus ||
                selectedStatus ===
                  device.status
              }
            >
              <Save size={18} />

              {isUpdatingStatus
                ? 'Salvando...'
                : 'Salvar status'}
            </button>
          </section>

          <section className="device-details__danger-card">
            <h2>
              Excluir dispositivo
            </h2>

            <p>
              Esta ação removerá o
              cadastro permanentemente.
            </p>

            <button
              type="button"
              onClick={() =>
                void handleDeleteDevice()
              }
              disabled={isDeleting}
            >
              <Trash2 size={18} />

              {isDeleting
                ? 'Excluindo...'
                : 'Excluir dispositivo'}
            </button>
          </section>
        </aside>
      </section>
    </main>
  );
}