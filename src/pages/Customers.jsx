import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { CustomerFormModal } from '../components/CustomerFormModal';
import { useCustomers, addCustomer, initials, formatCurrency } from '../data/customers';
import glow from '../assets/button-glow.svg';
import './Customers.css';

const filters = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'archived', label: 'Archived' },
];

const Customers = () => {
  const navigate = useNavigate();
  const customers = useCustomers();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesFilter = filter === 'all' || customer.status === filter;
      const matchesTerm =
        !term ||
        customer.name.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        customer.phone.toLowerCase().includes(term);
      return matchesFilter && matchesTerm;
    });
  }, [customers, query, filter]);

  const activeCount = customers.filter((customer) => customer.status === 'active').length;

  return (
    <AppShell>
      <div className="app-shell__content">
        <div className="page-title">
          <h1 className="page-title__heading">Customers</h1>
          <p className="page-title__subheading">{activeCount} active customers</p>
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

              <div className="customers__filters">
                {filters.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    className={`pill-button pill-button--lg${
                      filter === id ? ' pill-button--selected' : ''
                    }`}
                    onClick={() => setFilter(id)}
                    aria-pressed={filter === id}
                  >
                    <span className="pill-button__text">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button type="button" className="cta-button" onClick={() => setFormOpen(true)}>
              <img className="cta-button__glow" src={glow} alt="" aria-hidden="true" />
              <Plus size={20} strokeWidth={2} />
              <span className="cta-button__label">New Customer</span>
            </button>
          </div>

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
                </tr>
              </thead>
              <tbody>
                {visible.map((customer, index) => (
                  <tr
                    key={customer.id}
                    className="customers__row"
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    <td>{index + 1}</td>
                    <td>
                      <span className="customers__cell-name">
                        <span className="avatar-initials avatar-initials--sm">
                          {initials(customer.name)}
                        </span>
                        <span className="customers__name">{customer.name}</span>
                      </span>
                    </td>
                    <td>{customer.phone}</td>
                    <td>
                      <span className="customers__cell-truncate">{customer.email}</span>
                    </td>
                    <td>{customer.locations.length}</td>
                    <td>{customer.jobsCount}</td>
                    <td>{formatCurrency(customer.totalBilled)}</td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td className="customers__empty" colSpan={7}>
                      No customers match this view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {formOpen && (
        <CustomerFormModal
          onClose={() => setFormOpen(false)}
          onSave={(values) => {
            const created = addCustomer(values);
            setFormOpen(false);
            navigate(`/customers/${created.id}`);
          }}
        />
      )}
    </AppShell>
  );
};

export default Customers;
