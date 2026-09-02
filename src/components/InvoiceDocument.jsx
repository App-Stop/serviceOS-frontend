import React from 'react';
import { billToOf, formatMoney, lineTotal, paymentMethodLabel } from '../data/invoices';
import { useIssuer, useInvoiceLayout } from '../data/profile';
import { InvoiceMasthead } from './invoice/InvoiceMasthead';
import { lineTypeLabel } from './invoice/LineTypeDropdown';
import stripeLogo from '../assets/stripe.svg';
import './InvoiceDocument.css';

/**
 * The finished invoice as the customer sees it — the read-only twin of
 * `InvoiceEditor`. Paid invoices get the diagonal watermark from the design.
 *
 * Everything printed here is the invoice's own record rather than a live
 * lookup: the recipient is the snapshot taken when it was issued, and the
 * totals and tax rate are the server's. That is what keeps an old invoice
 * reading correctly after the customer or the tax settings change.
 *
 * The one exception is the issuing company. The API doesn't put it on the
 * invoice yet, so the "FROM" side falls back to the Branding and Business
 * Info settings — meaning it always shows the company as it is *now*.
 * `invoice.issuer` is preferred as soon as the field appears.
 */
export const InvoiceDocument = ({ invoice }) => {
  const billTo = billToOf(invoice);
  const settingsIssuer = useIssuer();
  const layout = useInvoiceLayout();

  const issuer = invoice.company || invoice.issuer || settingsIssuer;

  const paid = invoice.status === 'paid';
  const taxLabel = invoice.taxRate
    ? `${invoice.taxLabel ?? 'Tax'} (${Number(invoice.taxRate)}%)`
    : invoice.taxLabel ?? 'Tax';

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
          <span className="invoice-doc__cell">Type</span>
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
              <span className="invoice-doc__text invoice-doc__text--center">
                {lineTypeLabel(item.type)}
              </span>
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
            {invoice.method === 'stripe' && (
              <img className="invoice-doc__method-logo" src={stripeLogo} alt="" />
            )}
            {paymentMethodLabel(invoice.method) || '—'}
          </span>
        </div>

        <div className="invoice-doc__totals">
          <div className="invoice-doc__total-row">
            <span className="invoice-doc__total-label">Subtotal</span>
            <span className="invoice-doc__total-value">{formatMoney(invoice.subtotal)}</span>
          </div>
          <div className="invoice-doc__total-row">
            <span className="invoice-doc__total-label">{taxLabel}</span>
            <span className="invoice-doc__total-value">{formatMoney(invoice.tax)}</span>
          </div>
          <span className="invoice-doc__rule" />
          <div className="invoice-doc__total-row invoice-doc__total-row--grand">
            <span>Total</span>
            <span>{formatMoney(invoice.total)}</span>
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
