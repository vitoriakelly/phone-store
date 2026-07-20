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

import {
  deleteDevice,
  getDeviceById,
  updateDeviceStatus,
} from '../../services/deviceStorage';
import type {
  Device,
  DeviceStatus,
} from '../../types/device';
import { formatCurrency } from '../../utils/currency';

import './styles.scss';

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR').format(
    new Date(`${date}T12:00:00`),
  );
}

function getStatusLabel(status: DeviceStatus) {
  const labels: Record<DeviceStatus, string> = {
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

export function DeviceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [device, setDevice] =
    useState<Device | null>(null);

  const [selectedStatus, setSelectedStatus] =
    useState<DeviceStatus>('DISPONIVEL');

  const [successMessage, setSuccessMessage] =
    useState('');

  useEffect(() => {
    if (!id) {
      return;
    }

    const storedDevice = getDeviceById(id);

    if (!storedDevice) {
      return;
    }

    setDevice(storedDevice);
    setSelectedStatus(storedDevice.status);
  }, [id]);

  function handleUpdateStatus() {
    if (!id || !device) {
      return;
    }

    const updatedDevice = updateDeviceStatus(
      id,
      selectedStatus,
    );

    if (!updatedDevice) {
      return;
    }

    setDevice(updatedDevice);
    setSuccessMessage(
      'Status atualizado com sucesso.',
    );

    window.setTimeout(() => {
      setSuccessMessage('');
    }, 3500);
  }

  function handleDeleteDevice() {
    if (!device) {
      return;
    }

    const shouldDelete = window.confirm(
      `Deseja realmente excluir ${device.brand} ${device.model}?`,
    );

    if (!shouldDelete) {
      return;
    }

    deleteDevice(device.id);

    navigate('/dispositivos', {
      state: {
        successMessage:
          'Dispositivo excluído com sucesso.',
      },
    });
  }

  if (!device) {
    return (
      <main className="device-details">
        <section className="device-details__not-found">
          <div className="device-details__not-found-icon">
            <Smartphone size={34} />
          </div>

          <h1>Dispositivo não encontrado</h1>

          <p>
            O aparelho solicitado não existe ou foi
            excluído.
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
    device.salePrice - device.purchasePrice;

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
                {device.brand} {device.model}
              </h1>

              <p>
                {device.storage} · {device.color}
              </p>
            </div>
          </div>
        </div>

        <div className="device-details__heading-actions">
          {device.status !== 'VENDIDO' && (
            <Link
              to={`/dispositivos/${device.id}/vender`}
              className="device-details__sell"
            >
              <BadgeDollarSign size={17} />
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
            {getStatusLabel(device.status)}
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
              <h2>Informações do dispositivo</h2>

              <p>
                Dados de identificação e características
                do aparelho.
              </p>
            </div>

            <div className="device-details__information-grid">
              <article className="device-details__information">
                <Factory size={20} />

                <div>
                  <span>Marca</span>
                  <strong>{device.brand}</strong>
                </div>
              </article>

              <article className="device-details__information">
                <Smartphone size={20} />

                <div>
                  <span>Modelo</span>
                  <strong>{device.model}</strong>
                </div>
              </article>

              <article className="device-details__information">
                <HardDrive size={20} />

                <div>
                  <span>Armazenamento</span>
                  <strong>{device.storage}</strong>
                </div>
              </article>

              <article className="device-details__information">
                <Palette size={20} />

                <div>
                  <span>Cor</span>
                  <strong>{device.color}</strong>
                </div>
              </article>

              <article className="device-details__information">
                <Hash size={20} />

                <div>
                  <span>IMEI</span>
                  <strong>{device.imei}</strong>
                </div>
              </article>

              <article className="device-details__information">
                <ShieldCheck size={20} />

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
                <BatteryCharging size={20} />

                <div>
                  <span>Saúde da bateria</span>
                  <strong>
                    {device.batteryHealth !== undefined
                      ? `${device.batteryHealth}%`
                      : 'Não informada'}
                  </strong>
                </div>
              </article>

              <article className="device-details__information">
                <CalendarDays size={20} />

                <div>
                  <span>Data de entrada</span>
                  <strong>
                    {formatDate(device.entryDate)}
                  </strong>
                </div>
              </article>
            </div>
          </section>

          <section className="device-details__section">
            <div className="device-details__section-heading">
              <h2>Informações comerciais</h2>

              <p>
                Valores de aquisição e venda do aparelho.
              </p>
            </div>

            <div className="device-details__price-grid">
              <article className="device-details__price-card">
                <span>Valor de compra</span>

                <strong>
                  {formatCurrency(
                    device.purchasePrice,
                  )}
                </strong>
              </article>

              <article className="device-details__price-card">
                <span>Valor de venda</span>

                <strong>
                  {formatCurrency(device.salePrice)}
                </strong>
              </article>

              <article className="device-details__price-card">
                <span>Lucro estimado</span>

                <strong>
                  {formatCurrency(profit)}
                </strong>
              </article>
            </div>

            <div className="device-details__supplier">
              <CircleDollarSign size={20} />

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
                Informações adicionais registradas no
                cadastro.
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
              Atualize a situação atual do aparelho.
            </p>

            <label htmlFor="deviceStatus">
              Status do dispositivo
            </label>

            <select
              id="deviceStatus"
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(
                  event.target.value as DeviceStatus,
                )
              }
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

            <button
              type="button"
              onClick={handleUpdateStatus}
              disabled={
                selectedStatus === device.status
              }
            >
              <Save size={18} />
              Salvar status
            </button>
          </section>

          <section className="device-details__danger-card">
            <h2>Excluir dispositivo</h2>

            <p>
              Esta ação removerá o cadastro
              permanentemente.
            </p>

            <button
              type="button"
              onClick={handleDeleteDevice}
            >
              <Trash2 size={18} />
              Excluir dispositivo
            </button>
          </section>
        </aside>
      </section>
    </main>
  );
}