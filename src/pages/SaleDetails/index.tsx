import {
  ArrowLeft,
  BadgeDollarSign,
  CalendarDays,
  CreditCard,
  Hash,
  Phone,
  Printer,
  Smartphone,
  UserRound,
} from 'lucide-react';
import {
  useEffect,
  useState,
} from 'react';
import {
  Link,
  useParams,
} from 'react-router-dom';

import { ApiError } from '../../services/api';
import { getSaleById } from '../../services/saleApi';
import type {
  PaymentMethod,
  Sale,
} from '../../types/sale';
import { formatCurrency } from '../../utils/currency';

import './styles.scss';

function formatDate(date: string) {
  return new Intl.DateTimeFormat(
    'pt-BR',
  ).format(
    new Date(`${date}T12:00:00`),
  );
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      dateStyle: 'short',
      timeStyle: 'short',
    },
  ).format(new Date(date));
}

function getPaymentMethodLabel(
  paymentMethod: PaymentMethod,
) {
  const labels: Record<
    PaymentMethod,
    string
  > = {
    PIX: 'Pix',
    DINHEIRO: 'Dinheiro',
    CARTAO_CREDITO:
      'Cartão de crédito',
    CARTAO_DEBITO:
      'Cartão de débito',
    TRANSFERENCIA:
      'Transferência',
    OUTRO: 'Outro',
  };

  return labels[paymentMethod];
}

export function SaleDetails() {
  const { id } = useParams();

  const [sale, setSale] =
    useState<Sale | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadSale() {
      if (!id) {
        if (isMounted) {
          setLoadError(
            'O identificador da venda não foi informado.',
          );

          setIsLoading(false);
        }

        return;
      }

      setIsLoading(true);
      setLoadError('');

      try {
        const apiSale =
          await getSaleById(id);

        if (!isMounted) {
          return;
        }

        setSale(apiSale);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setSale(null);

        if (
          error instanceof ApiError &&
          error.status === 404
        ) {
          setLoadError(
            'O registro solicitado não existe.',
          );
        } else if (
          error instanceof ApiError
        ) {
          setLoadError(error.message);
        } else {
          setLoadError(
            'Não foi possível carregar a venda. Verifique se a API está funcionando.',
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSale();

    return () => {
      isMounted = false;
    };
  }, [id]);

  function handlePrintReceipt() {
    window.print();
  }

  if (isLoading) {
    return (
      <main className="sale-details">
        <section className="sale-details__not-found">
          <div className="sale-details__not-found-icon">
            <BadgeDollarSign size={34} />
          </div>

          <h1>Carregando venda...</h1>

          <p>
            Aguarde enquanto buscamos os dados da venda.
          </p>
        </section>
      </main>
    );
  }

  if (!sale) {
    return (
      <main className="sale-details">
        <section className="sale-details__not-found">
          <div className="sale-details__not-found-icon">
            <BadgeDollarSign size={34} />
          </div>

          <h1>Venda não encontrada</h1>

          <p>
            {loadError ||
              'O registro solicitado não existe.'}
          </p>

          <Link to="/vendas">
            <ArrowLeft size={18} />
            Voltar para vendas
          </Link>
        </section>
      </main>
    );
  }

  const profit =
    sale.salePrice -
    sale.purchasePrice;

  return (
    <main className="sale-details">
      <section className="sale-details__heading">
        <div>
          <Link
            to="/vendas"
            className="sale-details__back"
          >
            <ArrowLeft size={18} />
            Voltar para vendas
          </Link>

          <div className="sale-details__title">
            <div className="sale-details__title-icon">
              <BadgeDollarSign size={27} />
            </div>

            <div>
              <h1>Detalhes da venda</h1>

              <p>
                Venda realizada em{' '}
                {formatDate(sale.soldAt)}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="sale-details__print"
          onClick={handlePrintReceipt}
        >
          <Printer size={18} />
          Imprimir comprovante
        </button>
      </section>

      <section className="sale-details__receipt">
        <header className="sale-details__receipt-header">
          <div>
            <strong>Phone Store</strong>
            <span>
              Comprovante de venda
            </span>
          </div>

          <div className="sale-details__receipt-number">
            <span>
              Identificação da venda
            </span>

            <strong>
              #
              {sale.id
                .slice(0, 8)
                .toUpperCase()}
            </strong>
          </div>
        </header>

        <section className="sale-details__section">
          <div className="sale-details__section-heading">
            <h2>
              Informações do cliente
            </h2>

            <p>
              Dados informados no momento da venda.
            </p>
          </div>

          <div className="sale-details__information-grid">
            <article className="sale-details__information">
              <UserRound size={20} />

              <div>
                <span>
                  Nome do cliente
                </span>

                <strong>
                  {sale.customerName}
                </strong>
              </div>
            </article>

            <article className="sale-details__information">
              <Phone size={20} />

              <div>
                <span>Telefone</span>

                <strong>
                  {sale.customerPhone ||
                    'Não informado'}
                </strong>
              </div>
            </article>
          </div>
        </section>

        <section className="sale-details__section">
          <div className="sale-details__section-heading">
            <h2>Dispositivo vendido</h2>

            <p>
              Aparelho relacionado a esta venda.
            </p>
          </div>

          <div className="sale-details__information-grid">
            <article className="sale-details__information">
              <Smartphone size={20} />

              <div>
                <span>Dispositivo</span>

                <strong>
                  {sale.deviceBrand}{' '}
                  {sale.deviceModel}
                </strong>
              </div>
            </article>

            <article className="sale-details__information">
              <Hash size={20} />

              <div>
                <span>IMEI</span>

                <strong>
                  {sale.deviceImei}
                </strong>
              </div>
            </article>
          </div>

          <Link
            to={`/dispositivos/${sale.deviceId}`}
            className="sale-details__device-link"
          >
            Visualizar dispositivo
          </Link>
        </section>

        <section className="sale-details__section">
          <div className="sale-details__section-heading">
            <h2>Informações da venda</h2>

            <p>
              Valores e forma de pagamento.
            </p>
          </div>

          <div className="sale-details__information-grid">
            <article className="sale-details__information">
              <CalendarDays size={20} />

              <div>
                <span>Data da venda</span>

                <strong>
                  {formatDate(sale.soldAt)}
                </strong>
              </div>
            </article>

            <article className="sale-details__information">
              <CreditCard size={20} />

              <div>
                <span>
                  Forma de pagamento
                </span>

                <strong>
                  {getPaymentMethodLabel(
                    sale.paymentMethod,
                  )}
                </strong>
              </div>
            </article>
          </div>

          <div className="sale-details__price-grid">
            <article className="sale-details__price-card">
              <span>
                Valor de compra
              </span>

              <strong>
                {formatCurrency(
                  sale.purchasePrice,
                )}
              </strong>
            </article>

            <article className="sale-details__price-card">
              <span>
                Valor da venda
              </span>

              <strong>
                {formatCurrency(
                  sale.salePrice,
                )}
              </strong>
            </article>

            <article className="sale-details__price-card">
              <span>
                Lucro obtido
              </span>

              <strong>
                {formatCurrency(profit)}
              </strong>
            </article>
          </div>
        </section>

        <section className="sale-details__section">
          <div className="sale-details__section-heading">
            <h2>Observações</h2>

            <p>
              Informações adicionais da negociação.
            </p>
          </div>

          <div className="sale-details__notes">
            {sale.notes ||
              'Nenhuma observação registrada.'}
          </div>
        </section>

        <footer className="sale-details__receipt-footer">
          <span>
            Registro criado em{' '}
            {formatDateTime(
              sale.createdAt,
            )}
          </span>

          <strong>
            Obrigado pela preferência!
          </strong>
        </footer>
      </section>
    </main>
  );
}