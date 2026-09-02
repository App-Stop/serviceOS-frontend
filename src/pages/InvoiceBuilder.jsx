import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { InvoiceEditor } from '../components/InvoiceEditor';
import { InvoiceJobPicker } from '../components/invoice/InvoiceJobPicker';
import {
  fetchInvoice,
  addInvoice,
  updateInvoice,
  sendInvoice,
  billToOf,
  blankLineItem,
  isBlankLineItem,
  invoiceTotals,
  statusLabel,
  toDateInput,
  todayInput,
} from '../data/invoices';
import { useCustomers } from '../data/customers';
import { formatAddress } from '../api/customers';
import { getErrorMessage } from '../api/client';
import glow from '../assets/button-glow.svg';
import './InvoiceBuilder.css';

const BackButton = () => (
  <Link className="ghost-button" to="/invoices">
    <ArrowLeft size={18} strokeWidth={2} />
    Back to invoices
  </Link>
);

/**
 * A blank working invoice. The issue date defaults to today because the API
 * refuses anything earlier, and the due date is left for the user — there is
 * no payment-terms default read from settings yet.
 */
const emptyDraft = () => ({
  number: '',
  created: '',
  customerId: null,
  jobIds: [],
  issueDate: todayInput(),
  dueDate: '',
  method: null,
  notes: '',
  items: [blankLineItem()],
});

/** Loads a saved invoice into the builder's working shape. */
const draftFromInvoice = (invoice) => ({
  number: invoice.number,
  created: invoice.created,
  customerId: invoice.customerId,
  jobIds: invoice.jobIds,
  issueDate: toDateInput(invoice.created),
  dueDate: toDateInput(invoice.due),
  method: invoice.method,
  notes: invoice.notes,
  taxLabel: invoice.taxLabel,
  taxRate: invoice.taxRate,
  company: invoice.company,
  issuer: invoice.issuer,
  // The line items the API generated from the jobs are part of this list, so
  // they render and are sent back on save — a PATCH replaces the whole set.
  items: [...invoice.items, blankLineItem()],
});

/**
 * Create or edit an invoice.
 *
 * Creating is a two-part flow the API imposes: an invoice is always born a
 * draft against a customer's jobs, and issuing it is a second call. So "Save
 * as draft" creates and stops, while "Create Invoice" creates and then sends.
 *
 * Editing only ever applies to a draft — the API answers a PATCH to a sent,
 * paid or void invoice with a 409 — and the customer and jobs are fixed at
 * creation, so the picker is replaced by a summary line.
 */
const InvoiceBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const customers = useCustomers();
  const isEditing = Boolean(id);

  const [draft, setDraft] = useState(emptyDraft);
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing) return undefined;

    let cancelled = false;
    setLoading(true);
    fetchInvoice(id)
      .then((invoice) => {
        if (cancelled) return;
        if (!invoice) {
          setError('This invoice no longer exists.');
          return;
        }
        setExisting(invoice);
        setDraft(draftFromInvoice(invoice));
      })
      .catch((cause) => {
        if (!cancelled) setError(getErrorMessage(cause, 'Could not load this invoice.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, isEditing]);

  const update = (patch) => setDraft((previous) => ({ ...previous, ...patch }));

  /* The trailing blank row is a UI affordance, not part of the record. */
  const values = () => ({
    ...draft,
    items: draft.items.filter((item) => !isBlankLineItem(item)),
  });

  /**
   * The summary block. Before an invoice exists there are no server figures
   * to show, so the typed line items are totalled locally — the real subtotal
   * will be higher once the API folds in the jobs' own costs, and the tax
   * rate comes from company settings.
   */
  const totals = existing
    ? { subtotal: existing.subtotal, tax: existing.tax, total: existing.total }
    : invoiceTotals(draft.items);

  const billTo = existing
    ? billToOf(existing)
    : (() => {
        const customer = customers.find(
          (record) => String(record.id) === String(draft.customerId),
        );
        return customer
          ? {
              name: customer.businessName || customer.name,
              phone: customer.phone,
              email: customer.email,
              // The API snapshots the billing address, so preview the same
              // one rather than the service location.
              location: formatAddress(customer.billingAddress) || customer.locations?.[0] || '',
            }
          : null;
      })();

  // An invoice cannot be raised without a customer and at least one job.
  const canCreate = Boolean(draft.customerId) && draft.jobIds.length > 0;
  const isDraft = !existing || existing.apiStatus === 'draft';

  /** Creates or patches, and hands back the saved invoice. */
  const persist = async () => {
    if (existing) return updateInvoice(existing.id, values());
    return addInvoice(values());
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const saved = await persist();
      navigate(saved?.id ? `/invoices/${saved.id}/edit` : '/invoices');
    } catch (cause) {
      setError(getErrorMessage(cause, 'Could not save this invoice.'));
    } finally {
      setSaving(false);
    }
  };

  /** Save, then issue. Sending is what moves a draft to "sent". */
  const handleSend = async () => {
    setSaving(true);
    setError('');
    try {
      const saved = await persist();
      if (saved?.id) {
        await sendInvoice(saved.id);
        navigate(`/invoices/${saved.id}`);
      }
    } catch (cause) {
      setError(getErrorMessage(cause, 'Could not issue this invoice.'));
    } finally {
      setSaving(false);
    }
  };

  const topbarActions = (
    <div className="invoice-builder__actions">
      <span className={`invoice-chip invoice-chip--${existing?.status ?? 'draft'}`}>
        {statusLabel(existing?.status ?? 'draft')}
      </span>

      <button
        type="button"
        className="ghost-button"
        disabled={saving || !canCreate || !isDraft}
        onClick={handleSave}
      >
        <Save size={18} strokeWidth={2} />
        Save as draft
      </button>

      <button
        type="button"
        className="cta-button"
        disabled={saving || !canCreate || !isDraft}
        onClick={handleSend}
      >
        <img className="cta-button__glow" src={glow} alt="" aria-hidden="true" />
        <Send size={18} strokeWidth={2} />
        <span className="cta-button__label">
          {existing ? 'Send Invoice' : 'Create Invoice'}
        </span>
      </button>
    </div>
  );

  return (
    <AppShell topbarLead={<BackButton />} topbarActions={topbarActions}>
      <div className="app-shell__content invoice-builder__content">
        {error && <p className="invoice-builder__error">{error}</p>}

        {loading ? (
          <p className="invoice-builder__loading">Loading invoice…</p>
        ) : (
          <>
            {existing ? (
              <p className="invoice-builder__locked">
                Billing <strong>{billTo?.name}</strong> for {existing.jobIds.length}{' '}
                {existing.jobIds.length === 1 ? 'job' : 'jobs'}. The customer and jobs
                on an invoice can’t be changed after it is created.
              </p>
            ) : (
              <InvoiceJobPicker
                customerId={draft.customerId}
                jobIds={draft.jobIds}
                onChange={update}
              />
            )}

            <InvoiceEditor
              draft={draft}
              onChange={update}
              totals={totals}
              billTo={billTo}
            />
          </>
        )}
      </div>
    </AppShell>
  );
};

export default InvoiceBuilder;
