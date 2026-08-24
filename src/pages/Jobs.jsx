import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Pencil,
  ArrowUpRight,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { JobStatusChip, JobPriorityBadge } from '../components/JobStatusChip';
import { JobTimeline } from '../components/JobTimeline';
import { JobFormModal } from '../components/JobFormModal';
import { FilterDropdown } from '../components/FilterDropdown';
import {
  useJobs,
  addJob,
  updateJob,
  setJobStatus,
  setJobPriority,
  formatBudget,
} from '../data/jobs';
import { initials, formatCurrency } from '../data/customers';
import david from '../assets/avatars/david.png';
import glow from '../assets/button-glow.svg';
import './Jobs.css';

const photos = { david };

/* Filter option lists, matching the Figma dropdowns. The status dot colours
   come straight from the design; each entry maps to a status id in the store. */

const ranges = [
  { id: 'week', label: 'This Week', days: 7 },
  { id: 'month', label: 'This Month', days: 31 },
  { id: 'quarter', label: 'Last 3 month', days: 92 },
  { id: 'year', label: 'This year', days: 366 },
  { id: 'custom', label: 'Custom', days: Infinity },
];

const statusFilters = [
  { id: 'all', label: 'All' },
  { id: 'scheduled', label: 'Scheduled', dot: '#f96c00' },
  { id: 'dispatched', label: 'Dispatched', dot: '#903bff' },
  { id: 'enroute', label: 'En Route', dot: '#edba00' },
  { id: 'onsite', label: 'In Progress', dot: '#0095ff' },
  { id: 'completed', label: 'Completed', dot: '#00c064' },
  { id: 'cancelled', label: 'Cancelled', dot: '#f30000' },
];

const parseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const DAY = 24 * 60 * 60 * 1000;

/**
 * Windows the list by schedule date. The seeded jobs are all dated in the
 * future, so the window is measured from the earliest job on file rather than
 * from today — that keeps every option meaningful against the sample data.
 */
const withinRange = (job, range, anchor) => {
  const span = ranges.find((option) => option.id === range)?.days ?? Infinity;
  if (span === Infinity || !anchor) return true;
  const date = parseDate(job.date);
  return date ? (date - anchor) / DAY <= span : true;
};

const Jobs = () => {
  const navigate = useNavigate();
  const jobs = useJobs();
  const [query, setQuery] = useState('');
  const [range, setRange] = useState('week');
  const [status, setStatus] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const anchor = jobs
      .map((job) => parseDate(job.date))
      .filter(Boolean)
      .sort((a, b) => a - b)[0];

    return jobs.filter((job) => {
      const matchesStatus = status === 'all' || job.status === status;
      const matchesTerm =
        !term ||
        job.title.toLowerCase().includes(term) ||
        job.customer.toLowerCase().includes(term) ||
        job.technician.toLowerCase().includes(term);
      return matchesStatus && matchesTerm && withinRange(job, range, anchor);
    });
  }, [jobs, query, status, range]);

  return (
    <AppShell>
      <div className="app-shell__content">
        <div className="page-title">
          <h1 className="page-title__heading">Jobs</h1>
          <p className="page-title__subheading">{jobs.length} Total Jobs</p>
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

            <button type="button" className="cta-button" onClick={() => setFormOpen(true)}>
              <img className="cta-button__glow" src={glow} alt="" aria-hidden="true" />
              <Plus size={20} strokeWidth={2} />
              <span className="cta-button__label">New Job</span>
            </button>
          </div>

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
                {visible.map((job, index) => {
                  const expanded = expandedId === job.id;
                  return (
                    <React.Fragment key={job.id}>
                      <tr
                        className={`jobs__row${expanded ? ' jobs__row--expanded' : ''}`}
                        onClick={() => setExpandedId(expanded ? null : job.id)}
                      >
                        <td>{index + 1}</td>
                        <td>
                          <span className="jobs__title">{job.title}</span>
                        </td>
                        <td>
                          <span className="jobs__person">
                            <span className="avatar-initials avatar-initials--sm">
                              {initials(job.customer)}
                            </span>
                            <span className="jobs__person-name">{job.customer}</span>
                          </span>
                        </td>
                        <td>
                          <span className="jobs__schedule">
                            {job.date}
                            <span className="jobs__schedule-time">{job.time}</span>
                          </span>
                        </td>
                        <td>
                          <span className="jobs__person">
                            {job.technicianPhoto ? (
                              <img
                                className="jobs__avatar"
                                src={photos[job.technicianPhoto]}
                                alt=""
                              />
                            ) : (
                              <span className="avatar-initials avatar-initials--sm">
                                {initials(job.technician)}
                              </span>
                            )}
                            <span className="jobs__person-name">{job.technician}</span>
                          </span>
                        </td>
                        <td onClick={(event) => event.stopPropagation()}>
                          <JobStatusChip
                            status={job.status}
                            onChange={(next) => setJobStatus(job.id, next)}
                          />
                        </td>
                        <td onClick={(event) => event.stopPropagation()}>
                          <span className="jobs__priority-cell">
                            <JobPriorityBadge
                              priority={job.priority}
                              onChange={(next) => setJobPriority(job.id, next)}
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
                                    onClick={() => setEditing(job)}
                                  >
                                    <Pencil size={20} strokeWidth={2} />
                                    Edit Job
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

                {visible.length === 0 && (
                  <tr>
                    <td className="jobs__empty" colSpan={7}>
                      No jobs match this view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {formOpen && (
        <JobFormModal
          onClose={() => setFormOpen(false)}
          onSave={(values) => {
            const created = addJob(values);
            setFormOpen(false);
            navigate(`/jobs/${created.id}`);
          }}
        />
      )}

      {editing && (
        <JobFormModal
          job={editing}
          onClose={() => setEditing(null)}
          onSave={(values) => {
            updateJob(editing.id, values);
            setEditing(null);
          }}
        />
      )}
    </AppShell>
  );
};

export default Jobs;
