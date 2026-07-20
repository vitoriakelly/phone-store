import {
  Eye,
  Plus,
  Search,
  Smartphone,
  Trash2,
} from 'lucide-react';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import {
  deleteDevice,
  getDevices,
} from '../../services/deviceStorage';
import type {
  Device,
  DeviceStatus,
} from '../../types/device';
import { formatCurrency } from '../../utils/currency';

import './styles.scss';

type StatusFilter = 'TODOS' | DeviceStatus;

interface LocationState {
  successMessage?: string;
}

function getStatusLabel(status: DeviceStatus) {
  const labels: Record<DeviceStatus, string> = {
    DISPONIVEL: 'Disponível',
    RESERVADO: 'Reservado',
    VENDIDO: 'Vendido',
  };

  return labels[status];
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR').format(
    new Date(`${date}T12:00:00`),
  );
}

export function Devices() {
  const location = useLocation();
  const navigate = useNavigate();

  const locationState = location.state as LocationState | null;

  const [devices, setDevices] = useState<Device[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('TODOS');
  const [successMessage, setSuccessMessage] = useState(
    locationState?.successMessage ?? '',
  );

  useEffect(() => {
    setDevices(getDevices());
  }, []);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    navigate(location.pathname, {
      replace: true,
      state: null,
    });

    const timeout = window.setTimeout(() => {
      setSuccessMessage('');
    }, 4000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    location.pathname,
    navigate,
    successMessage,
  ]);

  const filteredDevices = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return [...devices]
      .filter((device) => {
        const matchesStatus =
          statusFilter === 'TODOS' ||
          device.status === statusFilter;

        const searchableContent = [
          device.brand,
          device.model,
          device.imei,
          device.color,
          device.storage,
        ]
          .join(' ')
          .toLowerCase();

        const matchesSearch =
          normalizedSearch === '' ||
          searchableContent.includes(normalizedSearch);

        return matchesStatus && matchesSearch;
      })
      .sort((firstDevice, secondDevice) => {
        const firstDate = new Date(
          firstDevice.createdAt ?? firstDevice.entryDate,
        ).getTime();

        const secondDate = new Date(
          secondDevice.createdAt ?? secondDevice.entryDate,
        ).getTime();

        return secondDate - firstDate;
      });
  }, [devices, search, statusFilter]);

  function handleDeleteDevice(device: Device) {
    const shouldDelete = window.confirm(
      `Deseja realmente excluir ${device.brand} ${device.model}?`,
    );

    if (!shouldDelete) {
      return;
    }

    deleteDevice(device.id);

    setDevices((currentDevices) =>
      currentDevices.filter(
        (currentDevice) =>
          currentDevice.id !== device.id,
      ),
    );
  }

  return (
    <main className="devices">
      <section className="devices__heading">
        <div>
          <h1>Dispositivos</h1>

          <p>
            Consulte e gerencie os aparelhos cadastrados.
          </p>
        </div>

        <Link
          to="/dispositivos/cadastrar"
          className="devices__create"
        >
          <Plus size={19} />
          Novo dispositivo
        </Link>
      </section>

      {successMessage && (
        <div
          className="devices__success"
          role="status"
        >
          {successMessage}
        </div>
      )}

      <section className="devices__content">
        <div className="devices__filters">
          <div className="devices__search">
            <Search size={19} />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Pesquisar por marca, modelo, IMEI ou cor"
              aria-label="Pesquisar dispositivos"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as StatusFilter,
              )
            }
            aria-label="Filtrar por status"
          >
            <option value="TODOS">
              Todos os status
            </option>

            <option value="DISPONIVEL">
              Disponíveis
            </option>

            <option value="RESERVADO">
              Reservados
            </option>

            <option value="VENDIDO">
              Vendidos
            </option>
          </select>
        </div>

        <div className="devices__result">
          <strong>
            {filteredDevices.length}{' '}
            {filteredDevices.length === 1
              ? 'dispositivo encontrado'
              : 'dispositivos encontrados'}
          </strong>
        </div>

        {filteredDevices.length > 0 ? (
          <>
            <div className="devices__table-container">
              <table className="devices__table">
                <thead>
                  <tr>
                    <th>Dispositivo</th>
                    <th>IMEI</th>
                    <th>Entrada</th>
                    <th>Compra</th>
                    <th>Venda</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDevices.map((device) => (
                    <tr key={device.id}>
                      <td>
                        <div className="devices__device">
                          <div className="devices__device-icon">
                            <Smartphone size={20} />
                          </div>

                          <div>
                            <strong>
                              {device.brand}{' '}
                              {device.model}
                            </strong>

                            <span>
                              {device.storage} ·{' '}
                              {device.color}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>{device.imei}</td>

                      <td>
                        {formatDate(device.entryDate)}
                      </td>

                      <td>
                        {formatCurrency(
                          device.purchasePrice,
                        )}
                      </td>

                      <td>
                        {formatCurrency(
                          device.salePrice,
                        )}
                      </td>

                      <td>
                        <span
                          className={`devices__status devices__status--${device.status.toLowerCase()}`}
                        >
                          {getStatusLabel(
                            device.status,
                          )}
                        </span>
                      </td>

                      <td>
                        <div className="devices__actions">
                          <Link
                            to={`/dispositivos/${device.id}`}
                            className="devices__action devices__action--view"
                            aria-label={`Visualizar ${device.brand} ${device.model}`}
                            title="Visualizar"
                          >
                            <Eye size={18} />
                          </Link>

                          <button
                            type="button"
                            className="devices__action devices__action--delete"
                            onClick={() =>
                              handleDeleteDevice(device)
                            }
                            aria-label={`Excluir ${device.brand} ${device.model}`}
                            title="Excluir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="devices__mobile-list">
              {filteredDevices.map((device) => (
                <article
                  key={device.id}
                  className="devices__card"
                >
                  <div className="devices__card-header">
                    <div className="devices__device">
                      <div className="devices__device-icon">
                        <Smartphone size={20} />
                      </div>

                      <div>
                        <strong>
                          {device.brand} {device.model}
                        </strong>

                        <span>
                          {device.storage} ·{' '}
                          {device.color}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`devices__status devices__status--${device.status.toLowerCase()}`}
                    >
                      {getStatusLabel(device.status)}
                    </span>
                  </div>

                  <div className="devices__card-info">
                    <div>
                      <span>IMEI</span>
                      <strong>{device.imei}</strong>
                    </div>

                    <div>
                      <span>Entrada</span>
                      <strong>
                        {formatDate(device.entryDate)}
                      </strong>
                    </div>

                    <div>
                      <span>Valor de compra</span>
                      <strong>
                        {formatCurrency(
                          device.purchasePrice,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Valor de venda</span>
                      <strong>
                        {formatCurrency(
                          device.salePrice,
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="devices__card-actions">
                    <Link
                      to={`/dispositivos/${device.id}`}
                    >
                      <Eye size={18} />
                      Ver detalhes
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteDevice(device)
                      }
                    >
                      <Trash2 size={18} />
                      Excluir
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="devices__empty">
            <div className="devices__empty-icon">
              <Smartphone size={32} />
            </div>

            <h2>Nenhum dispositivo encontrado</h2>

            <p>
              Cadastre um aparelho ou altere os filtros
              utilizados.
            </p>

            <Link to="/dispositivos/cadastrar">
              <Plus size={18} />
              Cadastrar dispositivo
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}