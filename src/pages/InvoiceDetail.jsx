import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CircleCheck, Download, Pencil, Send } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { InvoiceDocument } from '../components/InvoiceDocument';
import {
  fetchInvoice,
  sendInvoice,
  payInvoice,
  downloadInvoicePdf,
  statusLabel,
} from '../data/invoices';
import { getErrorMessage } from '../api/client';
import './InvoiceDetail.css';

const BackButton = () => (
  <Link className="ghost-button" to="/invoices">
    <ArrowLeft size={18} strokeWidth={2} />
    Back to invoices
  </Link>
);

/** Read-only view of a finished invoice, as the customer receives it. */
const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setInvoice(await fetchInvoice(id));
    } catch (cause) {
      setError(getErrorMessage(cause, 'Could not load this invoice.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  /** Wraps an action so a rejection surfaces instead of silently failing. */
  const run = async (action, fallback) => {
    setBusy(true);
    setError('');
    try {
      await action();
      await load();
    } catch (cause) {
      setError(getErrorMessage(cause, fallback));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <AppShell topbarLead={<BackButton />}>
        <div className="app-shell__content">
          <p className="invoice-detail__loading">Loading invoice…</p>
        </div>
      </AppShell>
    );
  }

  if (!invoice) {
    return (
      <AppShell topbarLead={<BackButton />}>
        <div className="app-shell__content">
          <div className="invoice-detail__missing">
            <h1 className="page-title__heading">Invoice not found</h1>
            <p className="page-title__subheading">
              {error || 'This invoice may have been removed.'}
            </p>
            <button type="button" className="ghost-button" onClick={() => navigate('/invoices')}>
              Back to invoices
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const isDraft = invoice.apiStatus === 'draft';

  const topbarActions = (
    <div className="invoice-detail__actions">
      {/* Only a draft may be edited — the API answers a PATCH to anything
          else with a 409. */}
      {isDraft && (
        <button
          type="button"
          className="ghost-button"
          onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
        >
          <Pencil size={18} strokeWidth={2} />
          Edit Invoice
        </button>
      )}

      {isDraft && (
        <button
          type="button"
          className="ghost-button"
          disabled={busy}
          onClick={() => run(() => sendInvoice(invoice.id), 'Could not issue this invoice.')}
        >
          <Send size={18} strokeWidth={2} />
          Send Invoice
        </button>
      )}

      {/* Manual mark-as-paid only. No payment is collected — there is no
          payment processing on either side yet. */}
      {invoice.apiStatus !== 'paid' && invoice.apiStatus !== 'void' && (
        <button
          type="button"
          className="ghost-button"
          disabled={busy}
          onClick={() =>
            run(
              () => payInvoice(invoice.id, invoice.method ?? undefined),
              'Could not mark this invoice as paid.',
            )
          }
        >
          <CircleCheck size={18} strokeWidth={2} />
          Mark as Paid
        </button>
      )}

      <button
        type="button"
        className="ghost-button"
        disabled={busy}
        onClick={() =>
          run(() => downloadInvoicePdf(invoice), 'Could not download this invoice.')
        }
      >
        <Download size={18} strokeWidth={2} />
        Download PDF
      </button>
    </div>
  );

  return (
    <AppShell topbarLead={<BackButton />} topbarActions={topbarActions}>
      <div className="app-shell__content invoice-detail__content">
        <div className="page-title invoice-detail__title">
          <h1 className="page-title__heading">{invoice.number}</h1>
          <div className="invoice-detail__meta">
            <span className="page-title__subheading">{invoice.customer}</span>
            <span className={`invoice-chip invoice-chip--lg invoice-chip--${invoice.status}`}>
              {statusLabel(invoice.status)}
            </span>
          </div>
        </div>

        {error && <p className="invoice-detail__error">{error}</p>}

        <InvoiceDocument invoice={invoice} />
      </div>
    </AppShell>
  );
};

export default InvoiceDetail;
