import {
  BadgeDollarSign,
  CalendarDays,
  Search,
  Smartphone,
  UserRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { getSales } from '../../services/saleStorage';
import type {
  PaymentMethod,
  Sale,
} from '../../types/sale';
import { formatCurrency } from '../../utils/currency';

import './styles.scss';

type PaymentFilter = 'TODOS' | PaymentMethod;

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR').format(
    new Date(`${date}T12:00:00`),
  );
}

function getPaymentMethodLabel(
  paymentMethod: PaymentMethod,
) {
  const labels: Record<PaymentMethod, string> = {
    PIX: 'Pix',
    DINHEIRO: 'Dinheiro',
    CARTAO_CREDITO: 'Cartão de crédito',
    CARTAO_DEBITO: 'Cartão de débito',
    TRANSFERENCIA: 'Transferência',
    OUTRO: 'Outro',
  };

  return labels[paymentMethod];
}

export function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] =
    useState<PaymentFilter>('TODOS');

  useEffect(() => {
    setSales(getSales());
  }, []);

  const filteredSales = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return [...sales]
      .filter((sale) => {
        const searchableContent = [
          sale.customerName,
          sale.customerPhone,
          sale.deviceBrand,
          sale.deviceModel,
          sale.deviceImei,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        const matchesSearch =
          normalizedSearch === '' ||
          searchableContent.includes(normalizedSearch);

        const matchesPayment =
          paymentFilter === 'TODOS' ||
          sale.paymentMethod === paymentFilter;

        return matchesSearch && matchesPayment;
      })
      .sort((firstSale, secondSale) => {
        return (
          new Date(secondSale.createdAt).getTime() -
          new Date(firstSale.createdAt).getTime()
        );
      });
  }, [sales, search, paymentFilter]);

  const totalRevenue = filteredSales.reduce(
    (total, sale) => total + sale.salePrice,
    0,
  );

  const totalProfit = filteredSales.reduce(
    (total, sale) =>
      total + (sale.salePrice - sale.purchasePrice),
    0,
  );

  return (
    <main className="sales">
      <section className="sales__heading">
        <div>
          <h1>Vendas</h1>

          <p>
            Consulte as vendas realizadas e os valores
            recebidos.
          </p>
        </div>
      </section>

      <section className="sales__summary">
        <article className="sales__summary-card">
          <div className="sales__summary-icon">
            <BadgeDollarSign size={23} />
          </div>

          <div>
            <span>Vendas encontradas</span>
            <strong>{filteredSales.length}</strong>
          </div>
        </article>

        <article className="sales__summary-card">
          <div className="sales__summary-icon">
            <CalendarDays size={23} />
          </div>

          <div>
            <span>Faturamento</span>
            <strong>{formatCurrency(totalRevenue)}</strong>
          </div>
        </article>

        <article className="sales__summary-card">
          <div className="sales__summary-icon">
            <BadgeDollarSign size={23} />
          </div>

          <div>
            <span>Lucro total</span>
            <strong>{formatCurrency(totalProfit)}</strong>
          </div>
        </article>
      </section>

      <section className="sales__content">
        <div className="sales__filters">
          <div className="sales__search">
            <Search size={19} />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Pesquisar cliente, aparelho ou IMEI"
              aria-label="Pesquisar vendas"
            />
          </div>

          <select
            value={paymentFilter}
            onChange={(event) =>
              setPaymentFilter(
                event.target.value as PaymentFilter,
              )
            }
            aria-label="Filtrar por forma de pagamento"
          >
            <option value="TODOS">
              Todas as formas de pagamento
            </option>

            <option value="PIX">Pix</option>
            <option value="DINHEIRO">Dinheiro</option>

            <option value="CARTAO_CREDITO">
              Cartão de crédito
            </option>

            <option value="CARTAO_DEBITO">
              Cartão de débito
            </option>

            <option value="TRANSFERENCIA">
              Transferência
            </option>

            <option value="OUTRO">Outro</option>
          </select>
        </div>

        {filteredSales.length > 0 ? (
          <>
            <div className="sales__table-container">
              <table className="sales__table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Dispositivo</th>
                    <th>Data</th>
                    <th>Pagamento</th>
                    <th>Valor</th>
                    <th>Lucro</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSales.map((sale) => {
                    const profit =
                      sale.salePrice -
                      sale.purchasePrice;

                    return (
                      <tr key={sale.id}>
                        <td>
                          <div className="sales__person">
                            <div className="sales__item-icon">
                              <UserRound size={18} />
                            </div>

                            <div>
                              <strong>
                                {sale.customerName}
                              </strong>

                              <span>
                                {sale.customerPhone ||
                                  'Telefone não informado'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="sales__device">
                            <strong>
                              {sale.deviceBrand}{' '}
                              {sale.deviceModel}
                            </strong>

                            <span>
                              IMEI {sale.deviceImei}
                            </span>
                          </div>
                        </td>

                        <td>
                          {formatDate(sale.soldAt)}
                        </td>

                        <td>
                          <span className="sales__payment">
                            {getPaymentMethodLabel(
                              sale.paymentMethod,
                            )}
                          </span>
                        </td>

                        <td>
                          <strong className="sales__value">
                            {formatCurrency(
                              sale.salePrice,
                            )}
                          </strong>
                        </td>

                        <td>
                          <strong className="sales__profit">
                            {formatCurrency(profit)}
                          </strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="sales__mobile-list">
              {filteredSales.map((sale) => {
                const profit =
                  sale.salePrice -
                  sale.purchasePrice;

                return (
                  <article
                    key={sale.id}
                    className="sales__card"
                  >
                    <div className="sales__card-header">
                      <div className="sales__person">
                        <div className="sales__item-icon">
                          <UserRound size={18} />
                        </div>

                        <div>
                          <strong>
                            {sale.customerName}
                          </strong>

                          <span>
                            {sale.customerPhone ||
                              'Sem telefone'}
                          </span>
                        </div>
                      </div>

                      <span className="sales__payment">
                        {getPaymentMethodLabel(
                          sale.paymentMethod,
                        )}
                      </span>
                    </div>

                    <div className="sales__card-device">
                      <Smartphone size={19} />

                      <div>
                        <strong>
                          {sale.deviceBrand}{' '}
                          {sale.deviceModel}
                        </strong>

                        <span>
                          IMEI {sale.deviceImei}
                        </span>
                      </div>
                    </div>

                    <div className="sales__card-info">
                      <div>
                        <span>Data da venda</span>
                        <strong>
                          {formatDate(sale.soldAt)}
                        </strong>
                      </div>

                      <div>
                        <span>Valor vendido</span>
                        <strong>
                          {formatCurrency(
                            sale.salePrice,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Lucro</span>
                        <strong className="sales__profit">
                          {formatCurrency(profit)}
                        </strong>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <div className="sales__empty">
            <div className="sales__empty-icon">
              <BadgeDollarSign size={32} />
            </div>

            <h2>Nenhuma venda encontrada</h2>

            <p>
              As vendas registradas aparecerão nesta
              página.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}