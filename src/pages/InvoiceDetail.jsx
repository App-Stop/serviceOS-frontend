import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { InvoiceDocument } from '../components/InvoiceDocument';
import { useInvoice, statusLabel } from '../data/invoices';
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
  const invoice = useInvoice(id);

  if (!invoice) {
    return (
      <AppShell topbarLead={<BackButton />}>
        <div className="app-shell__content">
          <div className="invoice-detail__missing">
            <h1 className="page-title__heading">Invoice not found</h1>
            <p className="page-title__subheading">
              This record may have been removed from the prototype store.
            </p>
            <button type="button" className="ghost-button" onClick={() => navigate('/invoices')}>
              Back to invoices
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const topbarActions =
    invoice.status === 'draft' ? (
      <button
        type="button"
        className="ghost-button"
        onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
      >
        <Pencil size={18} strokeWidth={2} />
        Edit Invoice
      </button>
    ) : null;

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

        <InvoiceDocument invoice={invoice} />
      </div>
    </AppShell>
  );
};

export default InvoiceDetail;
