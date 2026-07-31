import {
  ArrowLeft,
  AtSign,
  BadgeDollarSign,
  CalendarDays,
  CreditCard,
  Hash,
  MapPin,
  Phone,
  Printer,
  Repeat2,
  Smartphone,
  UserRound,
  WalletCards,
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
  SalePayment,
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
    TROCA_DISPOSITIVO:
      'Troca de dispositivo',
    OUTRO: 'Outro',
  };

  return labels[paymentMethod];
}

function getConditionLabel(
  condition:
    | 'NOVO'
    | 'SEMINOVO'
    | 'USADO',
) {
  const labels = {
    NOVO: 'Novo',
    SEMINOVO: 'Seminovo',
    USADO: 'Usado',
  };

  return labels[condition];
}

function getPaymentDescription(
  payment: SalePayment,
) {
  const method =
    getPaymentMethodLabel(
      payment.method,
    );

  if (
    payment.method ===
      'CARTAO_CREDITO' &&
    payment.installments
  ) {
    return `${method} em ${payment.installments}x`;
  }

  return method;
}

function getCustomerAddress(
  sale: Sale,
) {
  const streetLine = [
    sale.customerStreet,
    sale.customerAddressNumber,
  ]
    .filter(Boolean)
    .join(', ');

  const locationLine = [
    sale.customerNeighborhood,
    sale.customerCity,
  ]
    .filter(Boolean)
    .join(' — ');

  const addressParts = [
    streetLine,
    locationLine,
    sale.customerZipCode
      ? `CEP ${sale.customerZipCode}`
      : '',
  ].filter(Boolean);

  if (addressParts.length === 0) {
    return 'Não informado';
  }

  return addressParts.join(' · ');
}

function getCommissionLabel(
  sale: Sale,
) {
  if (
    !sale.commissionType ||
    sale.commissionValue === null
  ) {
    return 'Comissão';
  }

  if (
    sale.commissionType ===
    'PERCENTAGE'
  ) {
    return `Comissão (${sale.commissionValue}%)`;
  }

  return 'Comissão fixa';
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
            Aguarde enquanto buscamos os
            dados da venda.
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

  const grossSalePrice =
    sale.grossSalePrice ??
    sale.salePrice +
      (sale.discountAmount ?? 0);

  const discountAmount =
    sale.discountAmount ?? 0;

  const commissionAmount =
    sale.commissionAmount ?? 0;

  const profitBeforeCommission =
    sale.salePrice -
    sale.purchasePrice;

  const profitAfterCommission =
    profitBeforeCommission -
    commissionAmount;

  /*
   * Compatibilidade com vendas antigas.
   * Após a migration, normalmente todas
   * as vendas já possuirão payments.
   */
  const payments: SalePayment[] =
    sale.payments?.length > 0
      ? sale.payments
      : [
          {
            id: 'legacy-payment',
            saleId: sale.id,
            method:
              sale.paymentMethod,
            amount: sale.salePrice,
            installments: null,
            createdAt:
              sale.createdAt,
            updatedAt:
              sale.updatedAt,
          },
        ];

  const totalReceived =
    payments.reduce(
      (total, payment) =>
        total + payment.amount,
      0,
    );

  const paymentDifference =
    sale.salePrice -
    totalReceived;

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
              <BadgeDollarSign
                size={27}
              />
            </div>

            <div>
              <h1>Detalhes da venda</h1>

              <p>
                Venda realizada em{' '}
                {formatDate(
                  sale.soldAt,
                )}
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
              Informações do comprador
            </h2>

            <p>
              Dados informados no momento
              da venda.
            </p>
          </div>

          <div className="sale-details__information-grid">
            <article className="sale-details__information">
              <UserRound size={20} />

              <div>
                <span>
                  Nome do comprador
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

            <article className="sale-details__information">
              <AtSign size={20} />

              <div>
                <span>Rede social</span>

                <strong>
                  {sale.customerSocialNetwork ||
                    'Não informada'}
                </strong>
              </div>
            </article>

            <article className="sale-details__information">
              <MapPin size={20} />

              <div>
                <span>Endereço</span>

                <strong>
                  {getCustomerAddress(
                    sale,
                  )}
                </strong>
              </div>
            </article>
          </div>
        </section>

        <section className="sale-details__section">
          <div className="sale-details__section-heading">
            <h2>
              Dispositivo vendido
            </h2>

            <p>
              Aparelho relacionado a esta
              venda.
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
            <h2>
              Informações da venda
            </h2>

            <p>
              Data, valores e resultado da
              negociação.
            </p>
          </div>

          <div className="sale-details__information-grid">
            <article className="sale-details__information">
              <CalendarDays size={20} />

              <div>
                <span>Data da venda</span>

                <strong>
                  {formatDate(
                    sale.soldAt,
                  )}
                </strong>
              </div>
            </article>

            <article className="sale-details__information">
              <WalletCards size={20} />

              <div>
                <span>
                  Formas de pagamento
                </span>

                <strong>
                  {payments.length}{' '}
                  {payments.length === 1
                    ? 'pagamento'
                    : 'pagamentos'}
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
                Valor bruto da venda
              </span>

              <strong>
                {formatCurrency(
                  grossSalePrice,
                )}
              </strong>
            </article>

            <article className="sale-details__price-card">
              <span>Desconto</span>

              <strong>
                {discountAmount > 0
                  ? `- ${formatCurrency(
                      discountAmount,
                    )}`
                  : formatCurrency(0)}
              </strong>
            </article>

            <article className="sale-details__price-card">
              <span>
                Valor líquido da venda
              </span>

              <strong>
                {formatCurrency(
                  sale.salePrice,
                )}
              </strong>
            </article>

            <article className="sale-details__price-card">
              <span>
                {getCommissionLabel(
                  sale,
                )}
              </span>

              <strong>
                {commissionAmount > 0
                  ? formatCurrency(
                      commissionAmount,
                    )
                  : 'Sem comissão'}
              </strong>
            </article>

            <article className="sale-details__price-card">
              <span>
                Lucro antes da comissão
              </span>

              <strong>
                {formatCurrency(
                  profitBeforeCommission,
                )}
              </strong>
            </article>

            <article className="sale-details__price-card">
              <span>
                Lucro após comissão
              </span>

              <strong>
                {formatCurrency(
                  profitAfterCommission,
                )}
              </strong>
            </article>
          </div>
        </section>

        <section className="sale-details__section">
          <div className="sale-details__section-heading">
            <h2>
              Pagamentos recebidos
            </h2>

            <p>
              Composição completa do valor
              recebido na venda.
            </p>
          </div>

          <div className="sale-details__information-grid">
            {payments.map(
              (payment, index) => (
                <article
                  key={payment.id}
                  className="sale-details__information"
                >
                  <CreditCard size={20} />

                  <div>
                    <span>
                      Pagamento{' '}
                      {index + 1}
                    </span>

                    <strong>
                      {getPaymentDescription(
                        payment,
                      )}
                    </strong>

                    <span>
                      {formatCurrency(
                        payment.amount,
                      )}
                    </span>
                  </div>
                </article>
              ),
            )}
          </div>

          <div className="sale-details__price-grid">
            <article className="sale-details__price-card">
              <span>Total da venda</span>

              <strong>
                {formatCurrency(
                  sale.salePrice,
                )}
              </strong>
            </article>

            <article className="sale-details__price-card">
              <span>Total recebido</span>

              <strong>
                {formatCurrency(
                  totalReceived,
                )}
              </strong>
            </article>

            <article className="sale-details__price-card">
              <span>
                Conferência
              </span>

              <strong>
                {Math.abs(
                  paymentDifference,
                ) < 0.01
                  ? 'Pagamento completo'
                  : paymentDifference > 0
                    ? `Faltam ${formatCurrency(
                        paymentDifference,
                      )}`
                    : `Excedente de ${formatCurrency(
                        Math.abs(
                          paymentDifference,
                        ),
                      )}`}
              </strong>
            </article>
          </div>
        </section>

        {sale.tradeInDevice && (
          <section className="sale-details__section">
            <div className="sale-details__section-heading">
              <h2>
                Dispositivo recebido na
                troca
              </h2>

              <p>
                Aparelho recebido como parte
                do pagamento desta venda.
              </p>
            </div>

            <div className="sale-details__information-grid">
              <article className="sale-details__information">
                <Repeat2 size={20} />

                <div>
                  <span>Dispositivo</span>

                  <strong>
                    {
                      sale.tradeInDevice
                        .brand
                    }{' '}
                    {
                      sale.tradeInDevice
                        .model
                    }
                  </strong>
                </div>
              </article>

              <article className="sale-details__information">
                <Smartphone size={20} />

                <div>
                  <span>
                    Armazenamento
                  </span>

                  <strong>
                    {
                      sale.tradeInDevice
                        .storage
                    }
                  </strong>
                </div>
              </article>

              <article className="sale-details__information">
                <Hash size={20} />

                <div>
                  <span>IMEI</span>

                  <strong>
                    {sale.tradeInDevice
                      .imei ||
                      'Pendente'}
                  </strong>
                </div>
              </article>

              <article className="sale-details__information">
                <CreditCard size={20} />

                <div>
                  <span>
                    Valor considerado
                  </span>

                  <strong>
                    {formatCurrency(
                      sale.tradeInDevice
                        .purchasePrice,
                    )}
                  </strong>
                </div>
              </article>

              <article className="sale-details__information">
                <Smartphone size={20} />

                <div>
                  <span>Condição</span>

                  <strong>
                    {getConditionLabel(
                      sale.tradeInDevice
                        .condition,
                    )}
                  </strong>
                </div>
              </article>

              <article className="sale-details__information">
                <CalendarDays size={20} />

                <div>
                  <span>
                    Data de entrada
                  </span>

                  <strong>
                    {formatDate(
                      sale.tradeInDevice
                        .entryDate,
                    )}
                  </strong>
                </div>
              </article>
            </div>

            <Link
              to={`/dispositivos/${sale.tradeInDevice.id}`}
              className="sale-details__device-link"
            >
              Visualizar dispositivo recebido
            </Link>
          </section>
        )}

        <section className="sale-details__section">
          <div className="sale-details__section-heading">
            <h2>Observações</h2>

            <p>
              Informações adicionais da
              negociação.
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