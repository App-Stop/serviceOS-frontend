import React from 'react';
import {
  TAX_RATE,
  invoiceTotals,
  lineTotal,
  formatMoney,
  useBillTo,
} from '../data/invoices';
import { useIssuer, useInvoiceLayout } from '../data/profile';
import { InvoiceMasthead } from './invoice/InvoiceMasthead';
import stripeLogo from '../assets/stripe.svg';
import './InvoiceDocument.css';

/** Percentage label for the tax row, e.g. "Sales Tax (6.25%)". */
const taxLabel = `Sales Tax (${(TAX_RATE * 100).toFixed(2).replace(/\.?0+$/, '')}%)`;

/**
 * The finished invoice as the customer sees it — the read-only twin of
 * `InvoiceEditor`. Paid invoices get the diagonal watermark from the design.
 *
 * The header treatment and the company details both come from the Branding
 * and Business Info settings, so changing either re-renders every invoice.
 */
export const InvoiceDocument = ({ invoice }) => {
  const billTo = useBillTo(invoice);
  const issuer = useIssuer();
  const layout = useInvoiceLayout();
  const { subtotal, tax, total } = invoiceTotals(invoice.items);
  const paid = invoice.status === 'paid';

  return (
    <article className={`invoice-doc invoice-doc--${layout}`}>
      {paid && <span className="invoice-doc__watermark">Paid</span>}

      <InvoiceMasthead
        layout={layout}
        issuer={issuer}
        number={invoice.number}
        created={invoice.created}
      />

      <div className="invoice-doc__section">
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
