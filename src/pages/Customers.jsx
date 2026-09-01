import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { CustomerFormModal } from '../components/CustomerFormModal';
import { ConfirmDialog } from '../components/profile/ConfirmDialog';
import { Pagination } from '../components/Pagination';
import {
  addCustomer,
  fetchCustomer,
  fetchCustomersPage,
  removeCustomer,
  updateCustomer,
  initials,
  formatCurrency,
} from '../data/customers';
import { getErrorMessage } from '../api/client';
import glow from '../assets/button-glow.svg';
import './Customers.css';

const Customers = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [customerPage, setCustomerPage] = useState({
    items: [],
    pagination: { page: 1, limit: 20, totalCount: 0, totalPages: 0 },
  });
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [deleting, setDeleting] = useState(null);

  // Typing shouldn't fire a request per keystroke against the API.
  const [search, setSearch] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setSearch(query), 300);
    return () => clearTimeout(id);
  }, [query]);

  // A narrower result set can leave the current page past the end.
  useEffect(() => {
    setPage(1);
  }, [search, limit]);

  /**
   * The table is paged by the API (`GET /customers` takes page/limit/search
   * and answers with the totals); the demo store pages the same shape locally,
   * so the controls behave identically in both modes.
   */
  const loadCustomers = useCallback(async () => {
    setPageLoading(true);
    setPageError('');
    try {
      setCustomerPage(await fetchCustomersPage({ page, limit, search }));
    } catch (error) {
      setPageError(getErrorMessage(error, 'Could not load your customers.'));
    } finally {
      setPageLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const { items: customers, pagination } = customerPage;

  // Deleting the last row of the last page would otherwise strand the table
  // past the end of the list.
  useEffect(() => {
    const { totalPages } = pagination;
    if (totalPages > 0 && page > totalPages) setPage(totalPages);
  }, [pagination, page]);

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setModalError('');
  };

  // Saves go through the store, which writes to the API in live mode, so the
  // dialog stays open on failure with the reason shown inside it.
  const handleSave = async (values) => {
    setSaving(true);
    setModalError('');
    try {
      if (editing) {
        await updateCustomer(editing.id, values);
        closeForm();
        await loadCustomers();
      } else {
        const created = await addCustomer(values);
        closeForm();
        if (created?.id) navigate(`/customers/${created.id}`);
        else await loadCustomers();
      }
    } catch (error) {
      setModalError(getErrorMessage(error, 'Could not save this customer.'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async (customer) => {
    setDeleting(null);
    setPageError('');
    try {
      await removeCustomer(customer.id);
      await loadCustomers();
    } catch (error) {
      setPageError(getErrorMessage(error, 'Could not remove this customer.'));
    }
  };

  /**
   * Opens the edit form on the server's current values rather than the row the
   * table happens to be holding.
   */
  const loadEditing = useCallback(
    () => fetchCustomer(editing.id),
    [editing],
  );

  return (
    <AppShell>
      <div className="app-shell__content">
        <div className="page-title">
          <h1 className="page-title__heading">Customers</h1>
          <p className="page-title__subheading">
            {pagination.totalCount === 1
              ? '1 customer'
              : `${pagination.totalCount} customers`}
          </p>
        </div>

        <div className="customers__body">
          <div className="customers__toolbar">
            <div className="customers__toolbar-lead">
              <div className="customers__search">
                <Search className="customers__search-icon" size={22} strokeWidth={2} />
                <input
                  type="text"
                  className="customers__search-input"
                  placeholder="Search customers..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label="Search customers"
                />
              </div>
            </div>

            <button
              type="button"
              className="cta-button"
              onClick={() => {
                setEditing(null);
                setModalError('');
                setFormOpen(true);
              }}
            >
              <img className="cta-button__glow" src={glow} alt="" aria-hidden="true" />
              <Plus size={20} strokeWidth={2} />
              <span className="cta-button__label">New Customer</span>
            </button>
          </div>

          {pageError && (
            <p className="customers__error" role="alert">
              {pageError}
            </p>
          )}

          <div className="customers__table-wrap">
            <table className="customers__table">
              <colgroup>
                <col className="customers__col--id" />
                <col className="customers__col--name" />
                <col className="customers__col--phone" />
                <col className="customers__col--email" />
                <col className="customers__col--locations" />
                <col className="customers__col--jobs" />
                <col className="customers__col--billed" />
                <col className="customers__col--actions" />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Name</th>
                  <th scope="col">Phone</th>
                  <th scope="col">Email</th>
                  <th scope="col">Locations</th>
                  <th scope="col">Jobs</th>
                  <th scope="col">Total Billed</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, index) => {
                  const label = customer.name || customer.businessName || '—';

                  return (
                    <tr
                      key={customer.id}
                      className="customers__row"
                      onClick={() => navigate(`/customers/${customer.id}`)}
                    >
                      <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                      <td>
                        <span className="customers__cell-name">
                          <span className="avatar-initials avatar-initials--sm">
                            {initials(label)}
                          </span>
                          <span className="customers__name">{label}</span>
                        </span>
                      </td>
                      <td>{customer.phone || '—'}</td>
                      <td>
                        <span className="customers__cell-truncate">
                          {customer.email || '—'}
                        </span>
                      </td>
                      <td>{customer.locations.length}</td>
                      <td>{customer.jobsCount}</td>
                      <td>{formatCurrency(customer.totalBilled)}</td>
                      <td onClick={(event) => event.stopPropagation()}>
                        <div className="customers__actions">
                          <button
                            type="button"
                            className="customers__action-btn"
                            onClick={() => {
                              setEditing(customer);
                              setModalError('');
                              setFormOpen(true);
                            }}
                            aria-label={`Edit ${label}`}
                          >
                            <Pencil size={16} strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            className="customers__action-btn customers__action-btn--danger"
                            onClick={() => setDeleting(customer)}
                            aria-label={`Delete ${label}`}
                          >
                            <Trash2 size={16} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {customers.length === 0 && (
                  <tr>
                    <td className="customers__empty" colSpan={8}>
                      {pageLoading
                        ? 'Loading your customers…'
                        : query.trim()
                          ? 'No customers match your search.'
                          : 'No customers yet. Add your first one to get started.'}
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

      {formOpen && (
        <CustomerFormModal
          customer={editing ?? undefined}
          saving={saving}
          error={modalError}
          loadCustomer={editing ? loadEditing : undefined}
          onClose={closeForm}
          onSave={handleSave}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete customer"
          description={`${
            deleting.name || deleting.businessName || 'This customer'
          } will be removed from your customer list. Their jobs and invoices stay on record.`}
          confirmLabel="Delete"
          onCancel={() => setDeleting(null)}
          onConfirm={() => confirmDelete(deleting)}
        />
      )}
    </AppShell>
  );
};

export default Customers;
