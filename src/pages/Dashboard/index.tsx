import {
  CircleDollarSign,
  Clock3,
  PackageCheck,
  Smartphone,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { SummaryCard } from '../../components/SummaryCard';
import type { Device } from '../../types/device';
import { formatCurrency } from '../../utils/currency';

import './styles.scss';

const devices: Device[] = [
  {
    id: '1',
    brand: 'Apple',
    model: 'iPhone 14 Pro',
    storage: '256 GB',
    color: 'Preto',
    imei: '351234567890123',
    condition: 'SEMINOVO',
    purchasePrice: 4200,
    salePrice: 5199,
    entryDate: '2026-07-17',
    status: 'DISPONIVEL',
  },
  {
    id: '2',
    brand: 'Samsung',
    model: 'Galaxy S23',
    storage: '128 GB',
    color: 'Verde',
    imei: '351234567890124',
    condition: 'SEMINOVO',
    purchasePrice: 2300,
    salePrice: 2999,
    entryDate: '2026-07-16',
    status: 'RESERVADO',
  },
  {
    id: '3',
    brand: 'Motorola',
    model: 'Edge 40',
    storage: '256 GB',
    color: 'Azul',
    imei: '351234567890125',
    condition: 'NOVO',
    purchasePrice: 1800,
    salePrice: 2399,
    entryDate: '2026-07-15',
    status: 'VENDIDO',
  },
  {
    id: '4',
    brand: 'Xiaomi',
    model: 'Redmi Note 13',
    storage: '256 GB',
    color: 'Branco',
    imei: '351234567890126',
    condition: 'NOVO',
    purchasePrice: 1200,
    salePrice: 1699,
    entryDate: '2026-07-14',
    status: 'DISPONIVEL',
  },
];

function getStatusLabel(status: Device['status']) {
  const labels = {
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

export function Dashboard() {
  const availableDevices = devices.filter(
    (device) => device.status === 'DISPONIVEL',
  );

  const soldDevices = devices.filter(
    (device) => device.status === 'VENDIDO',
  );

  const reservedDevices = devices.filter(
    (device) => device.status === 'RESERVADO',
  );

  const inventoryValue = availableDevices.reduce(
    (total, device) => total + device.salePrice,
    0,
  );

  return (
    <main className="dashboard">
      <section className="dashboard__heading">
        <div>
          <h1>Dashboard</h1>
          <p>Acompanhe o estoque e as movimentações da loja.</p>
        </div>

        <Link
          to="/dispositivos/cadastrar"
          className="dashboard__new-device"
        >
          Cadastrar dispositivo
        </Link>
      </section>

      <section className="dashboard__summary">
        <SummaryCard
          title="Total de aparelhos"
          value={devices.length}
          description="Todos os dispositivos cadastrados"
          icon={Smartphone}
          variant="blue"
        />

        <SummaryCard
          title="Disponíveis"
          value={availableDevices.length}
          description="Aparelhos disponíveis para venda"
          icon={PackageCheck}
          variant="green"
        />

        <SummaryCard
          title="Reservados"
          value={reservedDevices.length}
          description="Aparelhos aguardando conclusão"
          icon={Clock3}
          variant="yellow"
        />

        <SummaryCard
          title="Valor do estoque"
          value={formatCurrency(inventoryValue)}
          description={`${soldDevices.length} aparelho vendido`}
          icon={CircleDollarSign}
          variant="purple"
        />
      </section>

      <section className="dashboard__recent">
        <div className="dashboard__section-header">
          <div>
            <h2>Últimos dispositivos</h2>
            <p>Aparelhos adicionados recentemente ao estoque.</p>
          </div>

          <Link to="/dispositivos">Ver todos</Link>
        </div>

        <div className="dashboard__table-container">
          <table className="dashboard__table">
            <thead>
              <tr>
                <th>Dispositivo</th>
                <th>Armazenamento</th>
                <th>Entrada</th>
                <th>Valor</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {devices.map((device) => (
                <tr key={device.id}>
                  <td>
                    <div className="dashboard__device">
                      <div className="dashboard__device-icon">
                        <Smartphone size={20} />
                      </div>

                      <div>
                        <strong>
                          {device.brand} {device.model}
                        </strong>
                        <span>
                          {device.color} · {device.condition}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>{device.storage}</td>
                  <td>{formatDate(device.entryDate)}</td>
                  <td>{formatCurrency(device.salePrice)}</td>

                  <td>
                    <span
                      className={`dashboard__status dashboard__status--${device.status.toLowerCase()}`}
                    >
                      {getStatusLabel(device.status)}
                    </span>
                  </td>

                  <td>
                    <Link
                      to={`/dispositivos/${device.id}`}
                      className="dashboard__details"
                    >
                      Detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="dashboard__mobile-list">
          {devices.map((device) => (
            <article
              key={device.id}
              className="dashboard__mobile-card"
            >
              <div className="dashboard__mobile-top">
                <div className="dashboard__device">
                  <div className="dashboard__device-icon">
                    <Smartphone size={20} />
                  </div>

                  <div>
                    <strong>
                      {device.brand} {device.model}
                    </strong>
                    <span>
                      {device.storage} · {device.color}
                    </span>
                  </div>
                </div>

                <span
                  className={`dashboard__status dashboard__status--${device.status.toLowerCase()}`}
                >
                  {getStatusLabel(device.status)}
                </span>
              </div>

              <div className="dashboard__mobile-info">
                <div>
                  <span>Entrada</span>
                  <strong>{formatDate(device.entryDate)}</strong>
                </div>

                <div>
                  <span>Valor</span>
                  <strong>{formatCurrency(device.salePrice)}</strong>
                </div>
              </div>

              <Link
                to={`/dispositivos/${device.id}`}
                className="dashboard__mobile-details"
              >
                Ver detalhes
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}