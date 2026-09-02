import React, { useMemo } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import {
  PAYMENT_METHODS,
  blankLineItem,
  formatMoney,
  isBlankLineItem,
  todayInput,
} from '../data/invoices';
import { useIssuer } from '../data/profile';
import { BrandMark } from './invoice/InvoiceMasthead';
import { LineTypeDropdown } from './invoice/LineTypeDropdown';
import { FilterDropdown } from './FilterDropdown';
import './InvoiceDocument.css';
import './InvoiceEditor.css';

/**
 * Underlined date line. The API refuses an issue or due date in the past, so
 * both inputs are floored at today rather than letting the request fail.
 */
const DateField = ({ label, value, min, onChange }) => (
  <div className="invoice-doc__field">
    <span className="invoice-doc__label">{label}</span>
    <div className="invoice-doc__line invoice-editor__date">
      <input
        type="date"
        className="invoice-editor__date-native"
        value={value ?? ''}
        min={min}
        onChange={(event) => onChange(event.target.value)}
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
 * `draft` is the working invoice and `onChange` receives a patch to merge.
 * `totals` is what to print in the summary block — the builder passes the
 * server's own figures once an invoice exists, and a local preview before
 * that, since the tax rate is per-invoice and set by the API.
 *
 * The recipient is chosen upstream in the job picker, not typed here: the API
 * raises an invoice against a customer's jobs, and neither the customer nor
 * the jobs can be changed after creation.
 *
 * The column beside the description is the line's `type` — the API's own
 * per-line field — rather than the prototype's free-text "unit", which had
 * nowhere to persist to and would have vanished on the next read.
 */
export const InvoiceEditor = ({ draft, onChange, totals, billTo }) => {
  const settingsIssuer = useIssuer();
  const issuer = draft?.company || draft?.issuer || settingsIssuer;
  const today = todayInput();

  const methodOptions = useMemo(
    () => [
      { id: '', label: 'Not specified' },
      ...PAYMENT_METHODS.map((method) => ({
        id: method.id,
        label: method.label,
      })),
    ],
    [],
  );

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

  const { subtotal, tax, total } = totals;
  const taxLabel = draft.taxRate
    ? `${draft.taxLabel ?? 'Tax'} (${Number(draft.taxRate)}%)`
    : draft.taxLabel ?? 'Tax';

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
            {/* Numbering is the API's — a not-yet-created invoice has none. */}
            <span className="invoice-doc__number">{draft.number || 'New invoice'}</span>
            {draft.created && (
              <span className="invoice-doc__ref-caption">Created: {draft.created}</span>
            )}
          </div>
        </header>

        <div className="invoice-doc__grid">
          <div className="invoice-doc__field">
            <span className="invoice-doc__label">From</span>
            <span className="invoice-doc__line">
              <span className="invoice-doc__line-value">{issuer.name}</span>
            </span>
            <div className="invoice-doc__contact">
              <span>{issuer.contact}</span>
              <span>{issuer.address}</span>
            </div>
          </div>

          <div className="invoice-doc__field">
            <span className="invoice-doc__label">Bill to</span>
            <span className="invoice-doc__line">
              <span className="invoice-doc__line-value">
                {billTo?.name || 'No customer selected'}
              </span>
            </span>
            {billTo && (
              <div className="invoice-doc__contact">
                <span>{billTo.phone}</span>
                <span>{billTo.email}</span>
                <span>{billTo.location}</span>
              </div>
            )}
          </div>
        </div>

        <div className="invoice-doc__grid">
          <DateField
            label="Issue date"
            value={draft.issueDate}
            min={today}
            onChange={(issueDate) => onChange({ issueDate })}
          />
          <DateField
            label="Due date"
            value={draft.dueDate}
            /* The API also refuses a due date before the issue date. */
            min={draft.issueDate || today}
            onChange={(dueDate) => onChange({ dueDate })}
          />
        </div>
      </div>

      <div className="invoice-doc__items">
        <div className="invoice-doc__items-head invoice-doc__items-head--filled">
          <span className="invoice-doc__cell--description">Description</span>
          <span className="invoice-doc__cell">Type</span>
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

            {/* The API's only per-line classifier: 'service' for billable
                work, 'tool' for equipment and materials. */}
            <span className="invoice-doc__cell invoice-editor__underline">
              <LineTypeDropdown
                value={item.type}
                onChange={(type) => setItem(index, { type })}
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
                {formatMoney(Number(item.qty || 0) * Number(item.price || 0))}
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
          <div className="w-full max-w-[260px]">
            <FilterDropdown
              label="Not specified"
              value={draft.method ?? ''}
              options={methodOptions}
              onChange={(methodId) => onChange({ method: methodId || null })}
              fullWidth
              align="left"
            />
          </div>
          {/* No payment is ever collected here — this only records how the
              invoice is expected to be settled. */}
          <span className="invoice-doc__method-hint">
            Recorded on the invoice. No payment is taken.
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
