import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Wallet, DollarSign, Clock, Pencil, Send } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { JobTimeline } from '../components/JobTimeline';
import { JobPriorityBadge } from '../components/JobStatusChip';
import { priorityIcons } from '../components/jobIcons';
import { JobFormModal } from '../components/JobFormModal';
import {
  useJob,
  updateJob,
  setJobPriority,
  formatBudget,
  priorityLabel,
  JOB_TIMELINE,
} from '../data/jobs';
import { initials, formatCurrency } from '../data/customers';
import david from '../assets/avatars/david.png';
import mike from '../assets/avatars/mike.png';
import emily from '../assets/avatars/emily.png';
import sara from '../assets/avatars/sara.png';
import './JobDetail.css';

const photos = { david, mike, emily, sara };
const activityPhotos = [mike, emily, sara];

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

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const job = useJob(id);
  const [editing, setEditing] = useState(false);

  if (!job) {
    return (
      <AppShell topbarLead={<BackButton />}>
        <div className="app-shell__content">
          <div className="job-detail__missing">
            <h1 className="page-title__heading">Job not found</h1>
            <p className="page-title__subheading">
              This record may have been removed from the prototype store.
            </p>
            <button type="button" className="ghost-button" onClick={() => navigate('/jobs')}>
              Back to Jobs
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const PriorityIcon = priorityIcons[job.priority];
  const advance = nextStep(job.status);

  return (
    <AppShell topbarLead={<BackButton />}>
      <div className="app-shell__content">
        <div className="job-detail__header">
          <div className="job-detail__identity">
            <h1 className="page-title__heading">{job.title}</h1>
            <div className="job-detail__meta">
              <span className="job-detail__customer">
                <span className="avatar-initials avatar-initials--sm">
                  {initials(job.customer)}
                </span>
                {job.customer}
              </span>
              <span className={`priority-pill priority-badge--${job.priority}`}>
                <PriorityIcon size={20} strokeWidth={2} />
                {priorityLabel(job.priority)}
              </span>
            </div>
          </div>

          <button type="button" className="ghost-button" onClick={() => setEditing(true)}>
            <Pencil size={20} strokeWidth={2} />
            Edit Job
          </button>
        </div>

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
              image={photos[job.technicianPhoto] ?? mike}
              value={job.technician}
              label="Technician"
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
                  onClick={() => updateJob(job.id, { status: advance.id })}
                  className="!w-auto px-4 py-2 text-xs"
                >
                  Mark {advance.label}
                </Button>
              ) : (
                <JobPriorityBadge
                  priority={job.priority}
                  onChange={(next) => setJobPriority(job.id, next)}
                />
              )}
            </div>

            <JobTimeline
              job={job}
              variant="detail"
              onAddNote={(step) => {
                const note = window.prompt('Note for this step', job.notes?.[step] ?? '');
                if (note !== null) {
                  updateJob(job.id, { notes: { ...job.notes, [step]: note } });
                }
              }}
            />
          </div>

          <div className="job-detail__row">
            {/* Recent activity */}
            <div className="card card--fill">
              <div className="card__header card__header--tall">
                <span className="card__title">Recent Activity</span>
              </div>
              <div className="activity__list">
                {job.activity.map((entry) => (
                  <div key={entry.id} className="activity__item">
                    <span className="avatar-initials avatar-initials--lg">
                      {initials(entry.actor)}
                    </span>
                    <div className="activity__body">
                      <div className="activity__line">
                        <span className="activity__actor">{entry.actor}</span>
                        <span className="activity__verb">{entry.verb}</span>
                        <span className="activity__target">{entry.target}</span>
                        {entry.connector && (
                          <span className="activity__verb">{entry.connector}</span>
                        )}
                        {entry.chip && (
                          <span className={`status-chip status-chip--${entry.chip.variant}`}>
                            {entry.chip.label}
                          </span>
                        )}
                      </div>
                      {entry.photos && (
                        <span className="job-detail__photos">
                          {activityPhotos.slice(0, entry.photos).map((photo, index) => (
                            <img key={index} className="job-detail__photo" src={photo} alt="" />
                          ))}
                        </span>
                      )}
                      <span className="activity__time">{entry.time}</span>
                    </div>
                  </div>
                ))}
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
                    <span className="field-list__label">Created by</span>
                    <span className="job-detail__person">
                      <img className="job-detail__person-avatar" src={david} alt="" />
                      {job.createdBy}
                    </span>
                  </div>
                  <div className="field-list__item">
                    <span className="field-list__label">Customer</span>
                    <span className="job-detail__person">
                      <span className="avatar-initials avatar-initials--sm job-detail__person-avatar">
                        {initials(job.customer)}
                      </span>
                      {job.customer}
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
                    <span className="field-list__value">#J{job.id}</span>
                  </div>
                </div>

                <div className="field-list__row">
                  <div className="field-list__item">
                    <span className="field-list__label">Assigned To</span>
                    <span className="job-detail__person">
                      <img
                        className="job-detail__person-avatar"
                        src={photos[job.technicianPhoto] ?? mike}
                        alt=""
                      />
                      {job.technician}
                    </span>
                  </div>
                  <div className="field-list__item">
                    <span className="field-list__label">Date Created</span>
                    <span className="field-list__value">{job.createdAt || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <JobFormModal
          job={job}
          onClose={() => setEditing(false)}
          onSave={(values) => {
            updateJob(job.id, values);
            setEditing(false);
          }}
        />
      )}
    </AppShell>
  );
};

export default JobDetail;
