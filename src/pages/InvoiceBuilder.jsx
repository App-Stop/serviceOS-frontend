import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { InvoiceEditor } from '../components/InvoiceEditor';
import {
  useInvoice,
  addInvoice,
  updateInvoice,
  nextInvoiceNumber,
  blankLineItem,
  isBlankLineItem,
  statusLabel,
} from '../data/invoices';
import glow from '../assets/button-glow.svg';
import './InvoiceBuilder.css';

const BackButton = () => (
  <Link className="ghost-button" to="/invoices">
    <ArrowLeft size={18} strokeWidth={2} />
    Back to invoices
  </Link>
);

/** Today in the invoice's display format, used as the default issue date. */
const today = () =>
  new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const emptyInvoice = () => ({
  number: nextInvoiceNumber(),
  customer: '',
  customerId: null,
  created: today(),
  createdTime: '1:00 PM',
  due: '',
  dueTime: '1:00 PM',
  status: 'draft',
  method: 'Stripe',
  notes: '',
  items: [blankLineItem()],
});

/**
 * Create or edit an invoice. The working copy lives in local state so the
 * store only sees finished records — "Save" keeps it a draft, "Create Invoice"
 * marks it sent and opens the finished document.
 */
const InvoiceBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const existing = useInvoice(id);
  const [draft, setDraft] = useState(() =>
    existing ? { ...existing, items: [...existing.items, blankLineItem()] } : emptyInvoice(),
  );

  const update = (patch) => setDraft((previous) => ({ ...previous, ...patch }));

  /* The trailing blank row is a UI affordance, not part of the record. */
  const clean = (status) => ({
    ...draft,
    status,
    items: draft.items.filter((item) => !isBlankLineItem(item)),
  });

  const canCreate = Boolean(draft.customer.trim()) && draft.items.some((item) => !isBlankLineItem(item));

  const persist = (status) => {
    const values = clean(status);
    if (existing) {
      updateInvoice(existing.id, values);
      return existing.id;
    }
    return addInvoice(values).id;
  };

  const topbarActions = (
    <div className="invoice-builder__actions">
      <span className={`invoice-chip invoice-chip--${draft.status}`}>
        {statusLabel(draft.status)}
      </span>

      <button
        type="button"
        className="ghost-button"
        /* Keeps whatever status the invoice already has — saving an issued
           invoice should not knock it back to a draft. */
        onClick={() => {
          persist(draft.status);
          navigate('/invoices');
        }}
      >
        <Save size={18} strokeWidth={2} />
        Save
      </button>

      <button
        type="button"
        className="cta-button"
        disabled={!canCreate}
        onClick={() => navigate(`/invoices/${persist('sent')}`)}
      >
        <img className="cta-button__glow" src={glow} alt="" aria-hidden="true" />
        <span className="cta-button__label">Create Invoice</span>
      </button>
    </div>
  );

  return (
    <AppShell topbarLead={<BackButton />} topbarActions={topbarActions}>
      <div className="app-shell__content invoice-builder__content">
        <InvoiceEditor draft={draft} onChange={update} />
      </div>
    </AppShell>
  );
};

export default InvoiceBuilder;
