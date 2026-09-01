import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BriefcaseBusiness,
  DollarSign,
  Pencil,
  ReceiptText,
  Trash2,
  Wallet,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { StatCard } from '../components/StatCard';
import { CustomerFormModal } from '../components/CustomerFormModal';
import { ConfirmDialog } from '../components/profile/ConfirmDialog';
import { Pagination } from '../components/Pagination';
import {
  fetchCustomer,
  removeCustomer,
  updateCustomer,
  initials,
  formatCurrency,
} from '../data/customers';
import { formatAddress } from '../api/customers';
import { getErrorMessage } from '../api/client';
import './CustomerDetail.css';

const BackButton = () => (
  <Link className="ghost-button" to="/customers">
    <ArrowLeft size={20} strokeWidth={2} />
    Back to Customers
  </Link>
);

/** The API's job statuses, spelled as they come back on `jobHistory`. */
const JOB_STATUS_LABELS = {
  scheduled: 'Scheduled',
  dispatched: 'Dispatched',
  'en-route': 'En Route',
  'on-site': 'On Site',
  'in-progress': 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/** Reads a `recentActivity` entry as a sentence the feed can show. */
const activitySentence = (entry) => {
  switch (entry.type) {
    case 'job-created':
      return { verb: 'created a job', chip: null };
    case 'status-changed':
      return {
        verb: 'moved a job to',
        chip: entry.toStatus,
      };
    case 'assignment-created':
      return { verb: 'was assigned to a job', chip: null };
    case 'assignment-updated':
      return { verb: 'updated an assignment to', chip: entry.toStatus };
    case 'assignment-cancelled':
      return { verb: 'cancelled an assignment', chip: null };
    case 'clock-in':
      return { verb: 'clocked in', chip: null };
    case 'clock-out':
      return { verb: 'clocked out', chip: null };
    default:
      // The seeded demo feed carries its own phrasing rather than a type.
      return { verb: entry.verb ?? 'made an update', chip: entry.chipLabel ?? null };
  }
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const relativeTime = (iso) => {
  if (!iso) return '';
  const delta = Date.now() - new Date(iso).getTime();
  if (delta < MINUTE) return 'Just now';
  if (delta < HOUR) return `${Math.floor(delta / MINUTE)}m ago`;
  if (delta < DAY) return `${Math.floor(delta / HOUR)}h ago`;
  return `${Math.floor(delta / DAY)}d ago`;
};

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  // The job history is its own paged list on `GET /customers/:id`.
  const [jobPage, setJobPage] = useState(1);
  const [jobLimit, setJobLimit] = useState(10);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      const record = await fetchCustomer(id, { page: jobPage, limit: jobLimit });
      setCustomer(record);
    } catch (error) {
      setCustomer(null);
      setPageError(getErrorMessage(error, 'Could not load this customer.'));
    } finally {
      setLoading(false);
    }
  }, [id, jobPage, jobLimit]);

  useEffect(() => {
    load();
  }, [load]);

  // Re-opens the edit form on the server's current values.
  const loadEditing = useCallback(() => fetchCustomer(id), [id]);

  const handleSave = async (values) => {
    setSaving(true);
    setModalError('');
    try {
      await updateCustomer(id, values);
      setEditing(false);
      await load();
    } catch (error) {
      setModalError(getErrorMessage(error, 'Could not save this customer.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setConfirmDelete(false);
    try {
      await removeCustomer(id);
      navigate('/customers');
    } catch (error) {
      setPageError(getErrorMessage(error, 'Could not remove this customer.'));
    }
  };

  if (loading && !customer) {
    return (
      <AppShell topbarLead={<BackButton />}>
        <div className="app-shell__content">
          <div className="customer-detail__missing">
            <h1 className="page-title__heading">Loading…</h1>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!customer) {
    return (
      <AppShell topbarLead={<BackButton />}>
        <div className="app-shell__content">
          <div className="customer-detail__missing">
            <h1 className="page-title__heading">Customer not found</h1>
            <p className="page-title__subheading">
              {pageError || 'This customer may have been removed.'}
            </p>
            <button type="button" className="ghost-button" onClick={() => navigate('/customers')}>
              Back to Customers
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const displayName = customer.name || customer.businessName || 'Unnamed customer';
  const jobsPagination = customer.jobsPagination ?? {
    page: jobPage,
    limit: jobLimit,
    totalCount: customer.jobs?.length ?? 0,
    totalPages: 1,
  };

  return (
    <AppShell topbarLead={<BackButton />}>
      <div className="app-shell__content">
        <div className="customer-detail__header">
          <div className="customer-detail__identity">
            <span className="avatar-initials avatar-initials--xl">
              {initials(displayName)}
            </span>
            <h1 className="page-title__heading">{displayName}</h1>
            <p className="page-title__subheading">
              {customer.businessName && customer.name
                ? customer.businessName
                : customer.since
                  ? `Customer since ${customer.since}`
                  : 'Customer'}
            </p>
          </div>

          <div className="customer-detail__header-actions">
            <button
              type="button"
              className="pill-button"
              onClick={() => {
                setModalError('');
                setEditing(true);
              }}
            >
              <Pencil size={16} strokeWidth={2} />
              <span className="pill-button__text">Edit</span>
            </button>
            <button
              type="button"
              className="pill-button pill-button--danger"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={16} strokeWidth={2} />
              <span className="pill-button__text">Delete</span>
            </button>
          </div>
        </div>

        {pageError && (
          <p className="customer-detail__error" role="alert">
            {pageError}
          </p>
        )}

        <div className="customer-detail__grid">
          <div className="customer-detail__row customer-detail__row--stats">
            <StatCard
              icon={DollarSign}
              value={formatCurrency(customer.totalBilled)}
              label="Total Billed"
            />
            <StatCard
              icon={BriefcaseBusiness}
              value={customer.activeJobs}
              label={customer.activeJobs === 1 ? 'Active Job' : 'Active Jobs'}
            />
            <StatCard icon={ReceiptText} value={customer.invoices} label="Total Invoices" />
            <StatCard
              icon={Wallet}
              value={formatCurrency(customer.outstandingBalance)}
              label="Outstanding"
            />
          </div>

          <div className="customer-detail__row">
            {/* Job history */}
            <div className="card card--fill">
              <div className="card__header card__header--tall">
                <span className="customer-detail__section-title">Job History</span>
                <span className="list-row__secondary">
                  {jobsPagination.totalCount === 1
                    ? '1 job'
                    : `${jobsPagination.totalCount} jobs`}
                </span>
              </div>

              <div className="list-rows">
                {customer.jobs.map((job) => (
                  <div
                    key={job.id}
                    className="list-row customer-detail__job"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') navigate(`/jobs/${job.id}`);
                    }}
                  >
                    <div className="list-row__lead">
                      <span className="list-row__title-line">
                        <span className="customer-detail__job-title">{job.title}</span>
                        {job.status && (
                          <span className={`status-chip status-chip--${String(job.status).toLowerCase()}`}>
                            {JOB_STATUS_LABELS[job.status] ?? job.status}
                          </span>
                        )}
                      </span>
                      <span className="list-row__secondary">
                        {formatAddress(job.siteAddress) ||
                          (job.jobIdNumber ? `Job #${job.jobIdNumber}` : '—')}
                      </span>
                    </div>
                    <div className="list-row__trail">
                      <span className="list-row__primary">{formatDate(job.createdAt)}</span>
                    </div>
                  </div>
                ))}

                {customer.jobs.length === 0 && (
                  <p className="customer-detail__empty">
                    No jobs booked for this customer yet.
                  </p>
                )}
              </div>

              {jobsPagination.totalPages > 1 && (
                <Pagination
                  page={jobsPagination.page}
                  limit={jobsPagination.limit}
                  totalCount={jobsPagination.totalCount}
                  totalPages={jobsPagination.totalPages}
                  onPageChange={setJobPage}
                  onLimitChange={setJobLimit}
                  disabled={loading}
                />
              )}
            </div>

            <div className="customer-detail__column">
              {/* Customer information */}
              <div className="card">
                <div className="card__header card__header--tall">
                  <span className="customer-detail__section-title">Customer Information</span>
                  <button
                    type="button"
                    className="pill-button"
                    onClick={() => {
                      setModalError('');
                      setEditing(true);
                    }}
                  >
                    <Pencil size={16} strokeWidth={2} />
                    <span className="pill-button__text">Edit</span>
                  </button>
                </div>

                <div className="field-list">
                  <div className="field-list__row">
                    <div className="field-list__item">
                      <span className="field-list__label">Phone</span>
                      <span className="field-list__value">{customer.phone || '—'}</span>
                    </div>
                    <div className="field-list__item">
                      <span className="field-list__label">Email</span>
                      <span className="field-list__value">{customer.email || '—'}</span>
                    </div>
                  </div>

                  <div className="field-list__row">
                    <div className="field-list__item">
                      <span className="field-list__label">Billing Address</span>
                      <span className="field-list__value">
                        {formatAddress(customer.billingAddress) || '—'}
                      </span>
                    </div>
                    <div className="field-list__item">
                      <span className="field-list__label">Service Address</span>
                      <span className="field-list__value">
                        {formatAddress(customer.currentLocation) ||
                          formatAddress(customer.serviceAddress) ||
                          '—'}
                      </span>
                    </div>
                  </div>

                  <div className="field-list__row">
                    <div className="field-list__item">
                      <span className="field-list__label">
                        {customer.locations.length === 1 ? 'Location' : 'Locations'}
                      </span>
                      <span className="field-list__values">
                        {customer.locations.length > 0 ? (
                          customer.locations.map((location) => (
                            <span key={location} className="field-list__value">
                              {location}
                            </span>
                          ))
                        ) : (
                          <span className="field-list__value">—</span>
                        )}
                      </span>
                    </div>
                    <div className="field-list__item">
                      <span className="field-list__label">Notes</span>
                      <span className="field-list__value">{customer.notes || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent activity */}
              <div className="card customer-detail__column-filler">
                <div className="card__header card__header--tall">
                  <span className="customer-detail__section-title">Recent Activity</span>
                </div>
                <div className="activity__list">
                  {(customer.activity ?? []).map((entry) => {
                    const { verb, chip } = activitySentence(entry);

                    return (
                      <div key={entry.id} className="activity__item">
                        <span className="avatar-initials avatar-initials--lg">
                          {initials(entry.actor)}
                        </span>
                        <div className="activity__body">
                          <div className="activity__line">
                            <span className="activity__actor">{entry.actor}</span>
                            <span className="activity__verb">{verb}</span>
                            {chip && (
                              <span className={`status-chip status-chip--${String(chip).toLowerCase()}`}>
                                {JOB_STATUS_LABELS[chip] ?? chip}
                              </span>
                            )}
                          </div>
                          <span className="activity__time">
                            {entry.createdAt ? relativeTime(entry.createdAt) : entry.time}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {(customer.activity ?? []).length === 0 && (
                    <p className="customer-detail__empty">No activity on record yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <CustomerFormModal
          customer={customer}
          saving={saving}
          error={modalError}
          loadCustomer={loadEditing}
          onClose={() => {
            setEditing(false);
            setModalError('');
          }}
          onSave={handleSave}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete customer"
          description={`${displayName} will be removed from your customer list. Their jobs and invoices stay on record.`}
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
        />
      )}
    </AppShell>
  );
};

export default CustomerDetail;
