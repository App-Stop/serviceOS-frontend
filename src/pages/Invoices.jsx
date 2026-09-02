import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Download, ReceiptText, Clock, FileText } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { StatCard } from '../components/StatCard';
import { FilterDropdown } from '../components/FilterDropdown';
import { InvoiceRowMenu } from '../components/InvoiceRowMenu';
import { Pagination } from '../components/Pagination';
import { ConfirmDialog } from '../components/profile/ConfirmDialog';
import {
  fetchInvoicesPage,
  payInvoice,
  removeInvoice,
  downloadInvoicePdf,
  useInvoiceTabCounts,
  formatMoney,
  statusLabel,
  INVOICE_TABS,
  INVOICE_SORTS,
} from '../data/invoices';
import { initials } from '../data/customers';
import { getErrorMessage } from '../api/client';
import glow from '../assets/button-glow.svg';
import './Invoices.css';

const Invoices = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [invoicePage, setInvoicePage] = useState({
    items: [],
    summary: {
      totalInvoiceAmount: 0,
      pendingCount: 0,
      pendingAmount: 0,
      sentThisMonth: 0,
    },
    statusCounts: null,
    pagination: { page: 1, limit: 20, totalCount: 0, totalPages: 0 },
  });
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [voiding, setVoiding] = useState(null);

  const demoTabCounts = useInvoiceTabCounts();

  // Typing shouldn't fire a request per keystroke against the API.
  const [search, setSearch] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setSearch(query), 300);
    return () => clearTimeout(id);
  }, [query]);

  // A narrower result set can leave the current page past the end.
  useEffect(() => {
    setPage(1);
  }, [search, tab, sort, limit]);

  const loadInvoices = useCallback(async () => {
    setPageLoading(true);
    setPageError('');
    try {
      setInvoicePage(await fetchInvoicesPage({ page, limit, search, status: tab, sort }));
    } catch (error) {
      setPageError(getErrorMessage(error, 'Could not load your invoices.'));
    } finally {
      setPageLoading(false);
    }
  }, [page, limit, search, tab, sort]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const { items: invoices, summary, statusCounts: pageStatusCounts, pagination } = invoicePage;
  const tabCounts = pageStatusCounts ?? demoTabCounts;

  // Voiding the last row of the last page would otherwise strand the table.
  useEffect(() => {
    const { totalPages } = pagination;
    if (totalPages > 0 && page > totalPages) setPage(totalPages);
  }, [pagination, page]);

  /**
   * Manual mark-as-paid. Nothing is charged — no payment processing exists on
   * either side yet, this only records the invoice as settled.
   */
  const handleMarkPaid = async (invoice) => {
    setPageError('');
    try {
      await payInvoice(invoice.id, invoice.method ?? undefined);
      await loadInvoices();
    } catch (error) {
      setPageError(getErrorMessage(error, 'Could not mark this invoice as paid.'));
    }
  };

  const handleDownload = async (invoice) => {
    setPageError('');
    try {
      await downloadInvoicePdf(invoice);
    } catch (error) {
      setPageError(getErrorMessage(error, 'Could not download this invoice.'));
    }
  };

  /** The API's delete is a soft void, and it only accepts a draft. */
  const confirmVoid = async (invoice) => {
    setVoiding(null);
    setPageError('');
    try {
      await removeInvoice(invoice.id);
      await loadInvoices();
    } catch (error) {
      setPageError(getErrorMessage(error, 'Could not void this invoice.'));
    }
  };

  return (
    <AppShell>
      <div className="app-shell__content">
        <div className="invoices__heading">
          <div className="page-title">
            <h1 className="page-title__heading">Invoices</h1>
            {/* The API reports pending (sent + overdue) but no overdue-only
                total, so the subtitle tracks the pending figure. */}
            <p className="page-title__subheading">
              {formatMoney(summary.pendingAmount)} outstanding
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
            value={formatMoney(Math.round(summary.totalInvoiceAmount))}
            label="Total Invoiced"
          />
          <StatCard
            icon={Clock}
            value={formatMoney(Math.round(summary.pendingAmount))}
            label={`Pending (${summary.pendingCount})`}
          />
          <StatCard icon={FileText} value={summary.sentThisMonth} label="Sent this month" />
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
                      {option.label}
                      {tabCounts && tabCounts[option.id] !== undefined ? ` (${tabCounts[option.id]})` : ''}
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

          {pageError && <p className="invoices__error">{pageError}</p>}

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
                {invoices.map((invoice) => (
                  <tr
                    className="invoices__row"
                    key={invoice.id}
                    onClick={() =>
                      navigate(
                        // Only a draft is editable — the API refuses a PATCH
                        // to anything else.
                        invoice.apiStatus === 'draft'
                          ? `/invoices/${invoice.id}/edit`
                          : `/invoices/${invoice.id}`,
                      )
                    }
                  >
                    <td>{invoice.number}</td>
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
                        {invoice.due || '—'}
                        <span className="invoices__stamp-time">{invoice.dueTime}</span>
                      </span>
                    </td>
                    <td>{formatMoney(invoice.total)}</td>
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
                          onMarkPaid={handleMarkPaid}
                          onDownload={handleDownload}
                          onVoid={setVoiding}
                        />
                        <button
                          type="button"
                          className="invoices__download"
                          onClick={() => handleDownload(invoice)}
                          aria-label={`Download ${invoice.number}`}
                        >
                          <Download size={20} strokeWidth={2} />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}

                {invoices.length === 0 && (
                  <tr>
                    <td className="invoices__empty" colSpan={7}>
                      {pageLoading ? 'Loading invoices…' : 'No invoices match this view.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            page={pagination.page}
            limit={pagination.limit}
            totalCount={pagination.totalCount}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            onLimitChange={setLimit}
            disabled={pageLoading}
          />
        </div>
      </div>

      {voiding && (
        <ConfirmDialog
          title="Void this invoice?"
          description={`${voiding.number} will be marked void and taken off the list. It stays on record and cannot be reinstated.`}
          confirmLabel="Void invoice"
          onConfirm={() => confirmVoid(voiding)}
          onCancel={() => setVoiding(null)}
        />
      )}
    </AppShell>
  );
};

export default Invoices;
