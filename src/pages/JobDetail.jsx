import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Wallet, DollarSign, Clock, Pencil, Send, Trash2, User } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { JobTimeline } from '../components/JobTimeline';
import { JobPriorityBadge } from '../components/JobStatusChip';
import { priorityIcons } from '../components/jobIcons';
import { JobFormModal } from '../components/JobFormModal';
import { ConfirmDialog } from '../components/profile/ConfirmDialog';
import {
  fetchJob,
  updateJob,
  setJobStatus,
  setJobPriority,
  removeJob,
  formatBudget,
  statusLabel,
  priorityLabel,
  JOB_TIMELINE,
} from '../data/jobs';
import { initials, formatCurrency } from '../data/customers';
import { getErrorMessage } from '../api/client';
import './JobDetail.css';

const BackButton = () => (
  <Link className="ghost-button" to="/jobs">
    <ArrowLeft size={20} strokeWidth={2} />
    Back to Jobs
  </Link>
);

/** Label for the button that advances the job to the next lifecycle step. */
const nextStep = (status) => {
  const index = JOB_TIMELINE.findIndex((step) => step.id === status);
  return index > -1 && index < JOB_TIMELINE.length - 1 ? JOB_TIMELINE[index + 1] : null;
};

/** Reads a `recentActivity` row as a sentence the feed can show. */
const activitySentence = (entry) => {
  switch (entry.type) {
    case 'job-created':
      return { verb: 'created this job', chip: null };
    case 'status-changed':
      return { verb: 'moved it to', chip: entry.toStatus };
    case 'assignment-created':
      return { verb: 'scheduled an assignment', chip: null };
    case 'assignment-updated':
      return { verb: 'updated the assignment to', chip: entry.toStatus };
    case 'assignment-cancelled':
      return { verb: 'cancelled the assignment', chip: null };
    case 'clock-in':
      return { verb: 'clocked in', chip: null };
    case 'clock-out':
      return { verb: 'clocked out', chip: null };
    default:
      // The seeded demo feed carries its own phrasing rather than a type.
      return {
        verb: [entry.verb, entry.target, entry.connector].filter(Boolean).join(' '),
        chip: entry.chip?.variant ?? null,
        chipLabel: entry.chip?.label ?? null,
      };
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

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      setJob(await fetchJob(id));
    } catch (error) {
      setJob(null);
      setPageError(getErrorMessage(error, 'Could not load this job.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Re-render once a minute so the activity feed's relative times stay honest.
  const [, tick] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => tick((n) => n + 1), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const loadEditing = useCallback(() => fetchJob(id), [id]);

  const handleSave = async (values) => {
    setSaving(true);
    setModalError('');
    try {
      await updateJob(id, values);
      setEditing(false);
      await load();
    } catch (error) {
      setModalError(getErrorMessage(error, 'Could not save this job.'));
    } finally {
      setSaving(false);
    }
  };

  /**
   * The API enforces the lifecycle — forward only, no leaving a finished or
   * cancelled job — so a refused move comes back as a message rather than a
   * silent no-op.
   */
  const handleStatus = async (next) => {
    setPageError('');
    try {
      await setJobStatus(id, next);
      await load();
    } catch (error) {
      setPageError(getErrorMessage(error, 'Could not change this job’s status.'));
    }
  };

  const handlePriority = async (next) => {
    setPageError('');
    try {
      await setJobPriority(id, next);
      await load();
    } catch (error) {
      setPageError(getErrorMessage(error, 'Could not change this job’s priority.'));
    }
  };

  const handleDelete = async () => {
    setConfirmDelete(false);
    try {
      await removeJob(id);
      navigate('/jobs');
    } catch (error) {
      setPageError(getErrorMessage(error, 'Could not cancel this job.'));
    }
  };

  if (loading && !job) {
    return (
      <AppShell topbarLead={<BackButton />}>
        <div className="app-shell__content">
          <div className="job-detail__missing">
            <h1 className="page-title__heading">Loading…</h1>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!job) {
    return (
      <AppShell topbarLead={<BackButton />}>
        <div className="app-shell__content">
          <div className="job-detail__missing">
            <h1 className="page-title__heading">Job not found</h1>
            <p className="page-title__subheading">
              {pageError || 'This job may have been cancelled.'}
            </p>
            <button type="button" className="ghost-button" onClick={() => navigate('/jobs')}>
              Back to Jobs
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const PriorityIcon = priorityIcons[job.priority] ?? priorityIcons.normal;
  const advance = nextStep(job.status);
  const assignee = job.technician || job.crew?.crewName || '';

  return (
    <AppShell topbarLead={<BackButton />}>
      <div className="app-shell__content">
        <div className="job-detail__header">
          <div className="job-detail__identity">
            <h1 className="page-title__heading">{job.title}</h1>
            <div className="job-detail__meta">
              {job.customer && (
                <span className="job-detail__customer">
                  <span className="avatar-initials avatar-initials--sm">
                    {initials(job.customer)}
                  </span>
                  {job.customer}
                </span>
              )}
              <span className={`priority-pill priority-badge--${job.priority}`}>
                <PriorityIcon size={20} strokeWidth={2} />
                {priorityLabel(job.priority)}
              </span>
              <span className={`status-chip status-chip--${job.status}`}>
                {statusLabel(job.status)}
              </span>
            </div>
          </div>

          <div className="job-detail__header-actions">
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                setModalError('');
                setEditing(true);
              }}
            >
              <Pencil size={20} strokeWidth={2} />
              Edit Job
            </button>
            <button
              type="button"
              className="ghost-button job-detail__danger"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={20} strokeWidth={2} />
              Cancel Job
            </button>
          </div>
        </div>

        {pageError && (
          <p className="job-detail__error" role="alert">
            {pageError}
          </p>
        )}

        <div className="job-detail__grid">
          <div className="job-detail__row job-detail__row--stats">
            <StatCard
              icon={Wallet}
              value={formatBudget(job.budgetSpent, job.budgetTotal)}
              label="Budget Left"
            />
            <StatCard icon={DollarSign} value={formatCurrency(job.revenue)} label="Revenue" />
            <StatCard icon={Clock} value={job.totalTime} label="Total Time" />
            <StatCard
              icon={User}
              value={assignee || 'Unassigned'}
              label={job.crew ? 'Crew' : 'Technician'}
            />
          </div>

          {/* Progress + lifecycle */}
          <div className="card card--fill w-full">
            <div className="card__header card__header--tall">
              <div className="job-detail__progress-head">
                <span className="card__title">Progress</span>
                <span className="job-detail__progress-meter">
                  <span
                    className="progress-bar"
                    style={{ '--progress-value': `${job.progress}%` }}
                  >
                    <span className="progress-bar__fill" />
                  </span>
                  <span className="job-detail__progress-value">{job.progress}%</span>
                </span>
              </div>

              {advance ? (
                <Button
                  type="button"
                  variant="primary"
                  icon={<Send size={16} strokeWidth={2} />}
                  onClick={() => handleStatus(advance.id)}
                  className="!w-auto px-4 py-2 text-xs"
                >
                  Mark {advance.label}
                </Button>
              ) : (
                <JobPriorityBadge priority={job.priority} onChange={handlePriority} />
              )}
            </div>

            {/* Per-step notes have no endpoint behind them, so the strip is
                read-only here — the timeline comes from the API's history. */}
            <JobTimeline job={job} variant="row" />
          </div>

          <div className="job-detail__row">
            {/* Recent activity */}
            <div className="card card--fill">
              <div className="card__header card__header--tall">
                <span className="card__title">Recent Activity</span>
              </div>
              <div className="activity__list">
                {(job.activity ?? []).map((entry) => {
                  const { verb, chip, chipLabel } = activitySentence(entry);

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
                            <span className={`status-chip status-chip--${chip}`}>
                              {chipLabel ?? statusLabel(chip)}
                            </span>
                          )}
                        </div>
                        {entry.note && (
                          <span className="activity__verb">{entry.note}</span>
                        )}
                        <span className="activity__time">
                          {relativeTime(entry.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {(job.activity ?? []).length === 0 && (
                  <p className="job-detail__empty">No activity on this job yet.</p>
                )}
              </div>
            </div>

            {/* Job information */}
            <div className="card card--fill">
              <div className="card__header card__header--tall">
                <span className="card__title">Job Information</span>
              </div>

              <div className="field-list">
                <div className="field-list__row">
                  <div className="field-list__item">
                    <span className="field-list__label">Description</span>
                    <span className="field-list__value">{job.description || '—'}</span>
                  </div>
                </div>

                <div className="field-list__row">
                  <div className="field-list__item">
                    <span className="field-list__label">Job Location</span>
                    <span className="field-list__value">{job.location || '—'}</span>
                  </div>
                </div>

                <div className="field-list__row">
                  <div className="field-list__item">
                    <span className="field-list__label">Customer</span>
                    <span className="job-detail__person">
                      {job.customer ? (
                        <>
                          <span className="avatar-initials avatar-initials--sm job-detail__person-avatar">
                            {initials(job.customer)}
                          </span>
                          {job.customer}
                        </>
                      ) : (
                        '—'
                      )}
                    </span>
                  </div>
                  <div className="field-list__item">
                    <span className="field-list__label">Scheduled</span>
                    <span className="field-list__value">
                      {job.date ? `${job.date} ${job.time}` : 'Unscheduled'}
                    </span>
                  </div>
                </div>

                <div className="field-list__row">
                  <div className="field-list__item">
                    <span className="field-list__label">Type</span>
                    <span className="field-list__value">{job.type || '—'}</span>
                  </div>
                  <div className="field-list__item">
                    <span className="field-list__label">Job ID</span>
                    <span className="field-list__value">
                      {job.jobIdNumber ? `#${job.jobIdNumber}` : '—'}
                    </span>
                  </div>
                </div>

                <div className="field-list__row">
                  <div className="field-list__item">
                    <span className="field-list__label">
                      {job.crew ? 'Assigned Crew' : 'Assigned To'}
                    </span>
                    <span className="job-detail__person">
                      {assignee ? (
                        <>
                          <span className="avatar-initials avatar-initials--sm job-detail__person-avatar">
                            {initials(assignee)}
                          </span>
                          {assignee}
                        </>
                      ) : (
                        'Unassigned'
                      )}
                    </span>
                  </div>
                  <div className="field-list__item">
                    <span className="field-list__label">Date Created</span>
                    <span className="field-list__value">{job.createdAt || '—'}</span>
                  </div>
                </div>

                {job.crew?.members?.length > 0 && (
                  <div className="field-list__row">
                    <div className="field-list__item">
                      <span className="field-list__label">Crew Members</span>
                      <span className="field-list__values">
                        {job.crew.members.map((member) => (
                          <span key={member._id} className="field-list__value">
                            {member.fullName}
                          </span>
                        ))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <JobFormModal
          job={job}
          saving={saving}
          error={modalError}
          loadJob={loadEditing}
          onClose={() => {
            setEditing(false);
            setModalError('');
          }}
          onSave={handleSave}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Cancel job"
          description={`“${job.title}” will be cancelled and taken off the board. Its time entries and invoices stay on record.`}
          confirmLabel="Cancel Job"
          cancelLabel="Keep Job"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
        />
      )}
    </AppShell>
  );
};

export default JobDetail;
