import React from 'react';
import {
  ISSUER,
  TAX_RATE,
  invoiceTotals,
  lineTotal,
  formatMoney,
  useBillTo,
} from '../data/invoices';
import stripeLogo from '../assets/stripe.svg';
import './InvoiceDocument.css';

/** Percentage label for the tax row, e.g. "Sales Tax (6.25%)". */
const taxLabel = `Sales Tax (${(TAX_RATE * 100).toFixed(2).replace(/\.?0+$/, '')}%)`;

/**
 * The finished invoice as the customer sees it — the read-only twin of
 * `InvoiceEditor`. Paid invoices get the diagonal watermark from the design.
 */
export const InvoiceDocument = ({ invoice }) => {
  const billTo = useBillTo(invoice);
  const { subtotal, tax, total } = invoiceTotals(invoice.items);
  const paid = invoice.status === 'paid';

  return (
    <article className="invoice-doc">
      {paid && <span className="invoice-doc__watermark">Paid</span>}

      <div className="invoice-doc__section">
        <header className="invoice-doc__masthead">
          <div className="invoice-doc__brand">
            <span className="invoice-doc__brand-mark">{ISSUER.name[0]}</span>
            <div className="invoice-doc__brand-body">
              <span className="invoice-doc__brand-name">{ISSUER.name}</span>
              <span className="invoice-doc__brand-line">{ISSUER.address}</span>
              <span className="invoice-doc__brand-line">{ISSUER.contact}</span>
            </div>
          </div>

          <div className="invoice-doc__ref">
            <span className="invoice-doc__number">{invoice.number}</span>
            <span className="invoice-doc__ref-caption">Set {invoice.created}</span>
          </div>
        </header>

        <div className="invoice-doc__field invoice-doc__field--narrow">
          <span className="invoice-doc__label">Bill to</span>
          <span className="invoice-doc__line">
            <span className="invoice-doc__line-value">{billTo.name}</span>
          </span>
          <div className="invoice-doc__contact">
            <span>{billTo.phone}</span>
            <span>{billTo.email}</span>
            <span>{billTo.location}</span>
          </div>
        </div>
      </div>

      <div className="invoice-doc__items">
        <div className="invoice-doc__items-head">
          <span className="invoice-doc__cell--description">Description</span>
          <span className="invoice-doc__cell">Unit</span>
          <span className="invoice-doc__cell">Qty</span>
          <span className="invoice-doc__cell">Price</span>
          <span className="invoice-doc__cell">Total</span>
        </div>

        {invoice.items.map((item) => (
          <div className="invoice-doc__row" key={item.id}>
            <span className="invoice-doc__cell--description">
              <span className="invoice-doc__text">{item.description}</span>
            </span>
            <span className="invoice-doc__cell">
              <span className="invoice-doc__text invoice-doc__text--center">{item.unit}</span>
            </span>
            <span className="invoice-doc__cell">
              <span className="invoice-doc__text invoice-doc__text--center">{item.qty}</span>
            </span>
            <span className="invoice-doc__cell">
              <span className="invoice-doc__text invoice-doc__text--center">
                {formatMoney(item.price)}
              </span>
            </span>
            <span className="invoice-doc__cell">
              <span className="invoice-doc__text invoice-doc__text--center">
                {formatMoney(lineTotal(item))}
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className="invoice-doc__summary">
        <div className="invoice-doc__method">
          <span className="invoice-doc__method-label">{paid ? 'Paid Via' : 'Payment Method'}</span>
          <span className="invoice-doc__method-value">
            {invoice.method === 'Stripe' && (
              <img className="invoice-doc__method-logo" src={stripeLogo} alt="" />
            )}
            {invoice.method}
          </span>
        </div>

        <div className="invoice-doc__totals">
          <div className="invoice-doc__total-row">
            <span className="invoice-doc__total-label">Subtotal</span>
            <span className="invoice-doc__total-value">{formatMoney(subtotal)}</span>
          </div>
          <div className="invoice-doc__total-row">
            <span className="invoice-doc__total-label">{taxLabel}</span>
            <span className="invoice-doc__total-value">{formatMoney(tax)}</span>
          </div>
          <span className="invoice-doc__rule" />
          <div className="invoice-doc__total-row invoice-doc__total-row--grand">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
        </div>
      </div>

      <span className="invoice-doc__rule" />

      <div className="invoice-doc__section">
        <div className="invoice-doc__field">
          <span className="invoice-doc__label">Notes</span>
          <span className="invoice-doc__line">
            <span className="invoice-doc__line-value invoice-doc__line-value--regular">
              {invoice.notes}
            </span>
          </span>
        </div>
      </div>
    </article>
  );
};
