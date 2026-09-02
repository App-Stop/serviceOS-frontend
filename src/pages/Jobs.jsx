import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  ArrowUpRight,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { JobStatusChip, JobPriorityBadge } from '../components/JobStatusChip';
import { JobTimeline } from '../components/JobTimeline';
import { JobFormModal } from '../components/JobFormModal';
import { FilterDropdown } from '../components/FilterDropdown';
import { ConfirmDialog } from '../components/profile/ConfirmDialog';
import { Pagination } from '../components/Pagination';
import {
  fetchJob,
  fetchJobsPage,
  addJob,
  updateJob,
  setJobStatus,
  setJobPriority,
  removeJob,
  formatBudget,
} from '../data/jobs';
import { initials, formatCurrency } from '../data/customers';
import { getErrorMessage } from '../api/client';
import glow from '../assets/button-glow.svg';
import './Jobs.css';

/* Filter option lists, matching the Figma dropdowns. The status dot colours
   come straight from the design; each id is the API's own status spelling. */

const ranges = [
  { id: 'all', label: 'All time', days: null },
  { id: 'week', label: 'This Week', days: 7 },
  { id: 'month', label: 'This Month', days: 31 },
  { id: 'quarter', label: 'Last 3 month', days: 92 },
  { id: 'year', label: 'This year', days: 366 },
];

const statusFilters = [
  { id: 'all', label: 'All' },
  { id: 'scheduled', label: 'Scheduled', dot: '#f96c00' },
  { id: 'dispatched', label: 'Dispatched', dot: '#903bff' },
  { id: 'en-route', label: 'En Route', dot: '#edba00' },
  { id: 'in-progress', label: 'In Progress', dot: '#0095ff' },
  { id: 'completed', label: 'Completed', dot: '#00c064' },
  { id: 'cancelled', label: 'Cancelled', dot: '#f30000' },
];

const DAY = 24 * 60 * 60 * 1000;

/**
 * The API windows on `createdAt` with `dateFrom` / `dateTo`, so a range is
 * expressed as a start instant N days back from now. "All time" sends nothing.
 */
const rangeToDateFrom = (range) => {
  const days = ranges.find((option) => option.id === range)?.days ?? null;
  return days ? new Date(Date.now() - days * DAY).toISOString() : undefined;
};

const Jobs = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [range, setRange] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [jobPage, setJobPage] = useState({
    items: [],
    pagination: { page: 1, limit: 20, totalCount: 0, totalPages: 0 },
  });
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const [expandedId, setExpandedId] = useState(null);
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
  }, [search, status, range, limit]);

  /**
   * The board is paged by the API (`GET /jobs` takes search, status, the
   * date window and page/limit, and answers with the totals); the demo store
   * applies the same filters locally so the controls behave identically.
   */
  const loadJobs = useCallback(async () => {
    setPageLoading(true);
    setPageError('');
    try {
      setJobPage(
        await fetchJobsPage({
          page,
          limit,
          search,
          status,
          dateFrom: rangeToDateFrom(range),
        }),
      );
    } catch (error) {
      setPageError(getErrorMessage(error, 'Could not load your jobs.'));
    } finally {
      setPageLoading(false);
    }
  }, [page, limit, search, status, range]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const { items: jobs, pagination } = jobPage;

  // Deleting the last row of the last page would otherwise strand the table.
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
        await updateJob(editing.id, values);
        closeForm();
        await loadJobs();
      } else {
        const created = await addJob(values);
        closeForm();
        if (created?.id) navigate(`/jobs/${created.id}`);
        else await loadJobs();
      }
    } catch (error) {
      setModalError(getErrorMessage(error, 'Could not save this job.'));
    } finally {
      setSaving(false);
    }
  };

  /**
   * Status and priority are written straight from the row. The API refuses a
   * backward move or a change to a finished job, so a rejection is surfaced
   * rather than left as a chip that silently snaps back.
   */
  const handleStatus = async (job, next) => {
    setPageError('');
    try {
      await setJobStatus(job.id, next);
      await loadJobs();
    } catch (error) {
      setPageError(getErrorMessage(error, 'Could not change this job’s status.'));
    }
  };

  const handlePriority = async (job, next) => {
    setPageError('');
    try {
      await setJobPriority(job.id, next);
      await loadJobs();
    } catch (error) {
      setPageError(getErrorMessage(error, 'Could not change this job’s priority.'));
    }
  };

  const confirmDelete = async (job) => {
    setDeleting(null);
    setPageError('');
    try {
      await removeJob(job.id);
      await loadJobs();
    } catch (error) {
      setPageError(getErrorMessage(error, 'Could not cancel this job.'));
    }
  };

  /** Opens the edit form on the server's current values for that job. */
  const loadEditing = useCallback(() => fetchJob(editing.id), [editing]);

  return (
    <AppShell>
      <div className="app-shell__content">
        <div className="page-title">
          <h1 className="page-title__heading">Jobs</h1>
          <p className="page-title__subheading">
            {pagination.totalCount === 1
              ? '1 Total Job'
              : `${pagination.totalCount} Total Jobs`}
          </p>
        </div>

        <div className="jobs__body">
          <div className="jobs__toolbar">
            <div className="jobs__toolbar-lead">
              <div className="jobs__search">
                <Search className="jobs__search-icon" size={22} strokeWidth={2} />
                <input
                  type="text"
                  className="jobs__search-input"
                  placeholder="Search jobs..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label="Search jobs"
                />
              </div>

              <div className="jobs__filters">
                <FilterDropdown
                  label="Date range"
                  value={range}
                  options={ranges}
                  onChange={setRange}
                />
                <FilterDropdown
                  label="Status"
                  value={status}
                  options={statusFilters}
                  onChange={setStatus}
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
              <span className="cta-button__label">New Job</span>
            </button>
          </div>

          {pageError && (
            <p className="jobs__error" role="alert">
              {pageError}
            </p>
          )}

          <div className="jobs__table-wrap">
            <table className="jobs__table">
              <colgroup>
                <col className="jobs__col--id" />
                <col className="jobs__col--job" />
                <col className="jobs__col--customer" />
                <col className="jobs__col--date" />
                <col className="jobs__col--technician" />
                <col className="jobs__col--status" />
                <col className="jobs__col--priority" />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Job</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Schedule Date</th>
                  <th scope="col">Technician</th>
                  <th scope="col">Status</th>
                  <th scope="col">Priority</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const expanded = expandedId === job.id;
                  return (
                    <React.Fragment key={job.id}>
                      <tr
                        className={`jobs__row${expanded ? ' jobs__row--expanded' : ''}`}
                        onClick={() => setExpandedId(expanded ? null : job.id)}
                      >
                        <td>{job.jobIdNumber ? `#${job.jobIdNumber}` : '—'}</td>
                        <td>
                          <span className="jobs__title">{job.title}</span>
                        </td>
                        <td>
                          {job.customer ? (
                            <span className="jobs__person">
                              <span className="avatar-initials avatar-initials--sm">
                                {initials(job.customer)}
                              </span>
                              <span className="jobs__person-name">{job.customer}</span>
                            </span>
                          ) : (
                            <span className="text-black-200">—</span>
                          )}
                        </td>
                        <td>
                          {job.date ? (
                            <span className="jobs__schedule">
                              {job.date}
                              <span className="jobs__schedule-time">{job.time}</span>
                            </span>
                          ) : (
                            <span className="text-black-200">Unscheduled</span>
                          )}
                        </td>
                        <td>
                          {job.technician ? (
                            <span className="jobs__person">
                              <span className="avatar-initials avatar-initials--sm">
                                {initials(job.technician)}
                              </span>
                              <span className="jobs__person-name">{job.technician}</span>
                            </span>
                          ) : (
                            <span className="text-black-200">Unassigned</span>
                          )}
                        </td>
                        <td onClick={(event) => event.stopPropagation()}>
                          <JobStatusChip
                            status={job.status}
                            onChange={(next) => handleStatus(job, next)}
                          />
                        </td>
                        <td onClick={(event) => event.stopPropagation()}>
                          <span className="jobs__priority-cell">
                            <JobPriorityBadge
                              priority={job.priority}
                              onChange={(next) => handlePriority(job, next)}
                            />
                            <button
                              type="button"
                              className="jobs__expand"
                              onClick={() => setExpandedId(expanded ? null : job.id)}
                              aria-label={expanded ? 'Collapse job' : 'Expand job'}
                            >
                              {expanded ? (
                                <ChevronUp size={16} strokeWidth={2} />
                              ) : (
                                <ChevronDown size={16} strokeWidth={2} />
                              )}
                            </button>
                          </span>
                        </td>
                      </tr>

                      {expanded && (
                        <tr>
                          <td className="jobs__expanded-cell" colSpan={7}>
                            <div className="job-panel">
                              <div className="job-panel__summary">
                                <div className="job-panel__metric">
                                  <span className="job-panel__metric-head">
                                    <span className="job-panel__metric-label">Progress</span>
                                    <span className="job-panel__metric-value">
                                      {job.progress}%
                                    </span>
                                  </span>
                                  <span
                                    className="progress-bar"
                                    style={{ '--progress-value': `${job.progress}%` }}
                                  >
                                    <span className="progress-bar__fill" />
                                  </span>
                                </div>

                                <div className="job-panel__metric">
                                  <span className="job-panel__metric-label">
                                    {formatBudget(job.budgetSpent, job.budgetTotal)}
                                  </span>
                                  <span className="job-panel__metric-caption">Budget Left</span>
                                </div>

                                <div className="job-panel__metric">
                                  <span className="job-panel__metric-label">
                                    {formatCurrency(job.revenue)}
                                  </span>
                                  <span className="job-panel__metric-caption">Revenue</span>
                                </div>

                                <div className="job-panel__metric">
                                  <span className="job-panel__metric-label">{job.totalTime}</span>
                                  <span className="job-panel__metric-caption">Total Time</span>
                                </div>

                                <div className="job-panel__actions">
                                  <button
                                    type="button"
                                    className="job-panel__action"
                                    onClick={() => {
                                      setEditing(job);
                                      setModalError('');
                                      setFormOpen(true);
                                    }}
                                  >
                                    <Pencil size={20} strokeWidth={2} />
                                    Edit Job
                                  </button>
                                  <button
                                    type="button"
                                    className="job-panel__action job-panel__action--danger"
                                    onClick={() => setDeleting(job)}
                                  >
                                    <Trash2 size={20} strokeWidth={2} />
                                    Cancel Job
                                  </button>
                                  <button
                                    type="button"
                                    className="job-panel__action"
                                    onClick={() => navigate(`/jobs/${job.id}`)}
                                  >
                                    View Details
                                    <ArrowUpRight size={20} strokeWidth={2} />
                                  </button>
                                </div>
                              </div>

                              <JobTimeline job={job} variant="row" />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}

                {jobs.length === 0 && (
                  <tr>
                    <td className="jobs__empty" colSpan={7}>
                      {pageLoading
                        ? 'Loading your jobs…'
                        : query.trim() || status !== 'all' || range !== 'all'
                          ? 'No jobs match this view.'
                          : 'No jobs yet. Create your first one to get started.'}
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
        <JobFormModal
          job={editing ?? undefined}
          saving={saving}
          error={modalError}
          loadJob={editing ? loadEditing : undefined}
          onClose={closeForm}
          onSave={handleSave}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Cancel job"
          description={`“${deleting.title}” will be cancelled and taken off the board. Its time entries and invoices stay on record.`}
          confirmLabel="Cancel Job"
          cancelLabel="Keep Job"
          onCancel={() => setDeleting(null)}
          onConfirm={() => confirmDelete(deleting)}
        />
      )}
    </AppShell>
  );
};

export default Jobs;
