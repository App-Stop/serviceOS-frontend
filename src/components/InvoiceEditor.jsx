import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, X } from 'lucide-react';
import { UnitDropdown } from './UnitDropdown';
import { useCustomers } from '../data/customers';
import {
  ISSUER,
  LINE_UNITS,
  PAYMENT_METHODS,
  TAX_RATE,
  blankLineItem,
  formatMoney,
  invoiceTotals,
  isBlankLineItem,
  lineTotal,
} from '../data/invoices';
import { useIssuer } from '../data/profile';
import { BrandMark } from './invoice/InvoiceMasthead';
import './InvoiceDocument.css';
import './InvoiceEditor.css';

const taxLabel = `Sales Tax (${(TAX_RATE * 100).toFixed(2).replace(/\.?0+$/, '')}%)`;

/** "Aug 13, 2026" — the date format the invoice prints. */
const formatDate = (iso) => {
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/** Turns "Aug 13, 2026" back into the `yyyy-mm-dd` a date input expects. */
const toIsoDate = (label) => {
  const date = new Date(label);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

/**
 * Underlined date line. A transparent native date input covers the row so the
 * browser's own picker does the work, while the formatted label shows through.
 */
const DateField = ({ label, value, onChange }) => (
  <div className="invoice-doc__field">
    <span className="invoice-doc__label">{label}</span>
    <div className="invoice-doc__line invoice-editor__date">
      <span className="invoice-doc__line-value invoice-doc__line-value--regular">
        {value || 'Pick a date'}
      </span>
      <Calendar className="invoice-doc__line-icon" size={20} strokeWidth={2} />
      <input
        type="date"
        className="invoice-editor__date-input"
        value={toIsoDate(value)}
        onChange={(event) => onChange(formatDate(event.target.value))}
        aria-label={label}
      />
    </div>
  </div>
);

/** Up / down chevrons that nudge a numeric line item field. */
const Stepper = ({ label, onStep }) => (
  <span className="invoice-editor__stepper">
    <button
      type="button"
      className="invoice-editor__stepper-button"
      onClick={() => onStep(1)}
      aria-label={`Increase ${label}`}
    >
      <ChevronUp size={12} strokeWidth={2.5} />
    </button>
    <button
      type="button"
      className="invoice-editor__stepper-button"
      onClick={() => onStep(-1)}
      aria-label={`Decrease ${label}`}
    >
      <ChevronDown size={12} strokeWidth={2.5} />
    </button>
  </span>
);

/**
 * The editable invoice paper used by the builder screen. It renders the same
 * `invoice-doc` layout as `InvoiceDocument`, with inputs in place of text and
 * a trailing blank line item that turns into a real row once it is filled in.
 *
 * `draft` is the working invoice; `onChange` receives a patch to merge.
 */
export const InvoiceEditor = ({ draft, onChange }) => {
  const customers = useCustomers();
  const issuer = useIssuer();
  const [suggesting, setSuggesting] = useState(false);
  const { subtotal, tax, total } = invoiceTotals(draft.items);

  /* The last row is always empty; editing it appends the next empty row. */
  const setItem = (index, patch) => {
    const items = draft.items.map((item, position) =>
      position === index ? { ...item, ...patch } : item,
    );
    const last = items[items.length - 1];
    onChange({ items: last && isBlankLineItem(last) ? items : [...items, blankLineItem()] });
  };

  const removeItem = (index) => {
    const items = draft.items.filter((_, position) => position !== index);
    const last = items[items.length - 1];
    onChange({ items: last && isBlankLineItem(last) ? items : [...items, blankLineItem()] });
  };

  const selected = customers.find((customer) => customer.id === draft.customerId);
  const matches = customers
    .filter((customer) =>
      customer.name.toLowerCase().includes(draft.customer.trim().toLowerCase()),
    )
    .slice(0, 5);

  return (
    <article className="invoice-doc">
      <div className="invoice-doc__section">
        <header className="invoice-doc__masthead">
          <div className="invoice-doc__brand">
            <BrandMark issuer={issuer} />
            <div className="invoice-doc__brand-body">
              <span className="invoice-doc__brand-name">{issuer.name}</span>
              <span className="invoice-doc__brand-line">{issuer.address}</span>
              <span className="invoice-doc__brand-line">{issuer.contact}</span>
            </div>
          </div>

          <div className="invoice-doc__ref">
            <span className="invoice-doc__number">{draft.number}</span>
            <span className="invoice-doc__ref-caption">Created: {draft.created}</span>
          </div>
        </header>

        <div className="invoice-doc__grid">
          <div className="invoice-doc__field">
            <span className="invoice-doc__label">From</span>
            <span className="invoice-doc__line">
              <span className="invoice-doc__line-value">{ISSUER.owner}</span>
            </span>
            <div className="invoice-doc__contact">
              <span>{ISSUER.phone}</span>
              <span>{ISSUER.email}</span>
              <span>{ISSUER.location}</span>
            </div>
          </div>

          <div className="invoice-doc__field invoice-editor__bill-to">
            <span className="invoice-doc__label">Bill to</span>
            <span className="invoice-doc__line">
              <input
                type="text"
                className="invoice-doc__line-value"
                placeholder="Search or enter name..."
                value={draft.customer}
                onChange={(event) => {
                  onChange({ customer: event.target.value, customerId: null });
                  setSuggesting(true);
                }}
                onFocus={() => setSuggesting(true)}
                onBlur={() => setSuggesting(false)}
                aria-label="Bill to"
              />
            </span>

            {suggesting && matches.length > 0 && (
              <ul className="invoice-editor__suggestions" role="listbox" aria-label="Customers">
                {matches.map((customer) => (
                  <li key={customer.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={customer.id === draft.customerId}
                      className="invoice-editor__suggestion"
                      /* Fires before the input's blur closes the list. */
                      onMouseDown={() => {
                        onChange({ customer: customer.name, customerId: customer.id });
                        setSuggesting(false);
                      }}
                    >
                      {customer.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {selected && (
              <div className="invoice-doc__contact">
                <span>{selected.phone}</span>
                <span>{selected.email}</span>
                <span>{selected.locations[0]}</span>
              </div>
            )}
          </div>
        </div>

        <div className="invoice-doc__grid">
          <DateField
            label="Issue date"
            value={draft.created}
            onChange={(created) => onChange({ created })}
          />
          <DateField label="Due date" value={draft.due} onChange={(due) => onChange({ due })} />
        </div>
      </div>

      <div className="invoice-doc__items">
        <div className="invoice-doc__items-head invoice-doc__items-head--filled">
          <span className="invoice-doc__cell--description">Description</span>
          <span className="invoice-doc__cell">Unit</span>
          <span className="invoice-doc__cell">Qty</span>
          <span className="invoice-doc__cell">Price</span>
          <span className="invoice-doc__cell">Total</span>
          <span className="invoice-editor__remove-slot" />
        </div>

        {draft.items.map((item, index) => (
          <div className="invoice-doc__row" key={item.id}>
            <span className="invoice-doc__cell--description invoice-editor__underline">
              <input
                type="text"
                className="invoice-doc__text"
                placeholder="Add description"
                value={item.description}
                onChange={(event) => setItem(index, { description: event.target.value })}
                aria-label="Description"
              />
            </span>

            <span className="invoice-doc__cell invoice-editor__underline flex justify-center">
              <UnitDropdown
                value={item.unit}
                onChange={(unit) => setItem(index, { unit })}
              />
            </span>

            <span className="invoice-doc__cell invoice-editor__underline">
              <input
                type="number"
                min="0"
                className="invoice-doc__text invoice-doc__text--center"
                value={item.qty}
                onChange={(event) => setItem(index, { qty: Number(event.target.value) })}
                aria-label="Quantity"
              />
              <Stepper
                label="quantity"
                onStep={(delta) => setItem(index, { qty: Math.max(0, Number(item.qty) + delta) })}
              />
            </span>

            <span className="invoice-doc__cell invoice-editor__underline">
              <span className="invoice-editor__amount">
                <span className="invoice-editor__prefix">$</span>
                <input
                  type="number"
                  min="0"
                  className="invoice-doc__text invoice-editor__price"
                  value={item.price}
                  onChange={(event) => setItem(index, { price: Number(event.target.value) })}
                  aria-label="Price"
                />
              </span>
              <Stepper
                label="price"
                onStep={(delta) =>
                  setItem(index, { price: Math.max(0, Number(item.price) + delta) })
                }
              />
            </span>

            <span className="invoice-doc__cell invoice-editor__underline">
              <span className="invoice-doc__text invoice-doc__text--center">
                {formatMoney(lineTotal(item))}
              </span>
            </span>

            <span className="invoice-editor__remove-slot">
              {index > 0 && (
                <button
                  type="button"
                  className="invoice-editor__remove"
                  onClick={() => removeItem(index)}
                  aria-label={`Remove line ${index + 1}`}
                >
                  <X size={18} strokeWidth={2} />
                </button>
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="invoice-doc__summary">
        <div className="invoice-doc__method">
          <span className="invoice-doc__method-label">Payment Method</span>
          <div className="invoice-editor__method-select">
            <select
              className="invoice-editor__method-input"
              value={draft.method}
              onChange={(event) => onChange({ method: event.target.value })}
              aria-label="Payment method"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            <ChevronDown className="invoice-editor__caret" size={20} strokeWidth={2} />
          </div>
          <span className="invoice-doc__method-hint">QR code will appear on saved invoice</span>
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
            <input
              type="text"
              className="invoice-doc__line-value invoice-doc__line-value--regular"
              placeholder="Write a note for customer"
              value={draft.notes}
              onChange={(event) => onChange({ notes: event.target.value })}
              aria-label="Notes"
            />
          </span>
        </div>
      </div>
    </article>
  );
};
