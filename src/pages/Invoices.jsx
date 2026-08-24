import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Download, ReceiptText, Clock, FileText } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { StatCard } from '../components/StatCard';
import { FilterDropdown } from '../components/FilterDropdown';
import { InvoiceRowMenu } from '../components/InvoiceRowMenu';
import {
  useInvoices,
  setInvoiceStatus,
  removeInvoice,
  invoiceTotal,
  formatMoney,
  countByStatus,
  statusLabel,
  INVOICE_TABS,
  INVOICE_SORTS,
} from '../data/invoices';
import { initials } from '../data/customers';
import glow from '../assets/button-glow.svg';
import './Invoices.css';

const parseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

/** Comparators for the "Sort" dropdown, keyed by the sort option id. */
const comparators = {
  newest: (a, b) => parseDate(b.created) - parseDate(a.created),
  'amount-asc': (a, b) => invoiceTotal(a) - invoiceTotal(b),
  'amount-desc': (a, b) => invoiceTotal(b) - invoiceTotal(a),
  'client-asc': (a, b) => a.customer.localeCompare(b.customer),
  'client-desc': (a, b) => b.customer.localeCompare(a.customer),
};

const Invoices = () => {
  const navigate = useNavigate();
  const invoices = useInvoices();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [sort, setSort] = useState('newest');

  /* Headline figures above the table — all derived from the store. */
  const stats = useMemo(() => {
    const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
    const pending = invoices.filter((invoice) => invoice.status !== 'paid');
    const pendingValue = pending.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
    const outstanding = invoices
      .filter((invoice) => invoice.status === 'overdue')
      .reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
    const sent = invoices.filter((invoice) => invoice.status !== 'draft').length;
    return { totalInvoiced, pending, pendingValue, outstanding, sent };
  }, [invoices]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return invoices
      .filter((invoice) => {
        const matchesTab = tab === 'all' || invoice.status === tab;
        const matchesTerm =
          !term ||
          invoice.number.toLowerCase().includes(term) ||
          invoice.customer.toLowerCase().includes(term);
        return matchesTab && matchesTerm;
      })
      .sort(comparators[sort]);
  }, [invoices, query, tab, sort]);

  return (
    <AppShell>
      <div className="app-shell__content">
        <div className="invoices__heading">
          <div className="page-title">
            <h1 className="page-title__heading">Invoices</h1>
            <p className="page-title__subheading">
              {formatMoney(stats.outstanding)} outstanding
            </p>
          </div>

          <button
            type="button"
            className="cta-button"
            onClick={() => navigate('/invoices/new')}
          >
            <img className="cta-button__glow" src={glow} alt="" aria-hidden="true" />
            <Plus size={20} strokeWidth={2} />
            <span className="cta-button__label">New Invoice</span>
          </button>
        </div>

        <div className="invoices__stats">
          <StatCard
            icon={ReceiptText}
            value={formatMoney(Math.round(stats.totalInvoiced))}
            label="Total Invoiced"
          />
          <StatCard
            icon={Clock}
            value={formatMoney(Math.round(stats.pendingValue))}
            label={`Pending (${stats.pending.length})`}
          />
          <StatCard icon={FileText} value={stats.sent} label="Sent this month" />
        </div>

        <div className="invoices__body">
          <div className="invoices__toolbar">
            <div className="invoices__toolbar-lead">
              <div className="invoices__search">
                <Search className="invoices__search-icon" size={22} strokeWidth={2} />
                <input
                  type="text"
                  className="invoices__search-input"
                  placeholder="Search invoice..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label="Search invoices"
                />
              </div>

              <div className="invoices__tabs">
                {INVOICE_TABS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`pill-button pill-button--lg${
                      option.id === tab ? ' pill-button--selected' : ''
                    }`}
                    onClick={() => setTab(option.id)}
                    aria-pressed={option.id === tab}
                  >
                    <span className="pill-button__text">
                      {option.label} ({countByStatus(invoices, option.id)})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <FilterDropdown
              label="Sort"
              value={sort}
              options={INVOICE_SORTS}
              onChange={setSort}
            />
          </div>

          <div className="invoices__table-wrap">
            <table className="invoices__table">
              <colgroup>
                <col className="invoices__col--number" />
                <col className="invoices__col--customer" />
                <col className="invoices__col--created" />
                <col className="invoices__col--due" />
                <col className="invoices__col--amount" />
                <col className="invoices__col--status" />
                <col className="invoices__col--actions" />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">Invoice #</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Created</th>
                  <th scope="col">Due</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Status</th>
                  {/* Figma labels this column "Priority"; it holds the row actions. */}
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((invoice, index) => (
                  <tr
                    className="invoices__row"
                    key={invoice.id}
                    onClick={() =>
                      navigate(
                        invoice.status === 'draft'
                          ? `/invoices/${invoice.id}/edit`
                          : `/invoices/${invoice.id}`,
                      )
                    }
                  >
                    <td>{index + 1}</td>
                    <td>
                      <span className="invoices__person">
                        <span className="avatar-initials avatar-initials--sm">
                          {initials(invoice.customer)}
                        </span>
                        <span className="invoices__person-name">{invoice.customer}</span>
                      </span>
                    </td>
                    <td>
                      <span className="invoices__stamp">
                        {invoice.created}
                        <span className="invoices__stamp-time">{invoice.createdTime}</span>
                      </span>
                    </td>
                    <td>
                      <span className="invoices__stamp">
                        {invoice.due}
                        <span className="invoices__stamp-time">{invoice.dueTime}</span>
                      </span>
                    </td>
                    <td>{formatMoney(invoiceTotal(invoice))}</td>
                    <td>
                      <span className={`invoice-chip invoice-chip--${invoice.status}`}>
                        {statusLabel(invoice.status)}
                      </span>
                    </td>
                    <td onClick={(event) => event.stopPropagation()}>
                      <span className="invoices__actions">
                        <InvoiceRowMenu
                          invoice={invoice}
                          onEdit={() => navigate(`/invoices/${invoice.id}/edit`)}
                          onMarkPaid={() => setInvoiceStatus(invoice.id, 'paid')}
                          onPrint={() => window.print()}
                          onDelete={() => removeInvoice(invoice.id)}
                        />
                        <button
                          type="button"
                          className="invoices__download"
                          onClick={() => window.print()}
                          aria-label={`Download ${invoice.number}`}
                        >
                          <Download size={20} strokeWidth={2} />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}

                {visible.length === 0 && (
                  <tr>
                    <td className="invoices__empty" colSpan={7}>
                      No invoices match this view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Invoices;
