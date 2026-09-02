import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, DollarSign } from 'lucide-react';
import { FilterDropdown } from './FilterDropdown';
import { AssigneeDropdown } from './AssigneeDropdown';
import {
  JOB_PRIORITIES,
  JOB_TYPES,
  formatDuration,
  toApiInstant,
  toDateTimeLocal,
} from '../data/jobs';
import { useCustomers } from '../data/customers';
import { useServices } from '../data/services';
import { fromDateTimeInput, toDateTimeInput } from '../data/schedule';
import { isLiveMode } from '../appMode';
import { getErrorMessage } from '../api/client';
import glow from '../assets/button-glow.svg';
import './FormModal.css';

const emptyJob = {
  title: '',
  customer: '',
  customerId: '',
  technician: '',
  assigneeType: '',
  assigneeId: '',
  date: '',
  time: '',
  type: '',
  jobTypeId: '',
  location: '',
  description: '',
  status: 'scheduled',
  priority: 'normal',
  budget: '',
  revenue: '',
};

/** The description hint the design shows under the field. */
const MAX_WORDS = 50;

const countWords = (value) => value.trim().split(/\s+/).filter(Boolean).length;

/** Where the end field lands when a start is picked and no end is set yet. */
const DEFAULT_DURATION_HOURS = 2;

const addHours = (localValue, hours) => {
  const iso = toApiInstant(localValue);
  if (!iso) return '';
  return toDateTimeLocal(new Date(new Date(iso).getTime() + hours * 3600_000).toISOString());
};

/** Minutes between two `datetime-local` values, or null if either is unusable. */
const durationMinutes = (start, end) => {
  const from = toApiInstant(start);
  const to = toApiInstant(end);
  if (!from || !to) return null;

  const minutes = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60_000);
  return minutes > 0 ? minutes : null;
};

/**
 * The API stores a job's address as `{ line1, city, state, zip }`, but the
 * form has always taken one free-text line. It is sent as `line1` and read
 * back the same way — splitting a typed address into fields would be guesswork.
 */
const locationToAddress = (location) => {
  const line1 = String(location ?? '').trim();
  return line1 ? { line1 } : undefined;
};

/**
 * The store exposes a job's budget as `budgetTotal` (paired with the spend);
 * the API field, and this form's input, is a plain `budget`.
 */
const toFormShape = (job) => {
  if (!job) return {};
  return {
    ...job,
    budget: job.budget ?? (job.budgetTotal ? String(job.budgetTotal) : ''),
    revenue: job.revenue ? String(job.revenue) : '',
  };
};

export const JobFormModal = ({
  job,
  saving = false,
  error = '',
  loadJob,
  onSave,
  onClose,
}) => {
  const customers = useCustomers();
  const services = useServices();
  const live = isLiveMode();

  const [form, setForm] = useState(() => ({ ...emptyJob, ...toFormShape(job) }));

  /**
   * The job's time window. The store keeps its start as a separate date and
   * time, so a demo record is folded back into one value; the end is the
   * API's own `scheduledEnd`, which the demo store has no equivalent for.
   */
  const [scheduledAt, setScheduledAt] = useState(() =>
    job?.scheduledStart
      ? toDateTimeLocal(job.scheduledStart)
      : toDateTimeInput(job?.date ?? '', job?.time ?? ''),
  );
  const [scheduledEndAt, setScheduledEndAt] = useState(() =>
    job?.scheduledEnd ? toDateTimeLocal(job.scheduledEnd) : '',
  );

  const [loading, setLoading] = useState(Boolean(loadJob));
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!loadJob) return undefined;

    let cancelled = false;
    setLoading(true);

    loadJob()
      .then((fresh) => {
        // Falls back to the row that opened the dialog if the read fails, so
        // the form is never left blank.
        if (cancelled || !fresh) return;

        setForm((prev) => ({ ...prev, ...toFormShape(fresh) }));
        setScheduledAt(
          fresh.scheduledStart
            ? toDateTimeLocal(fresh.scheduledStart)
            : toDateTimeInput(fresh.date ?? '', fresh.time ?? ''),
        );
        setScheduledEndAt(fresh.scheduledEnd ? toDateTimeLocal(fresh.scheduledEnd) : '');
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(getErrorMessage(err, 'Could not load the latest details.'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadJob]);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const isEditing = Boolean(job?.id);

  const customerOptions = useMemo(
    () =>
      customers.map((customer) => ({
        // Live mode assigns by id; the demo store has always keyed on the name.
        id: live ? customer.id : customer.name,
        label: customer.name || customer.businessName || 'Unnamed customer',
      })),
    [customers, live],
  );

  /**
   * Job types are the company's own service types in live mode (their ids go
   * out as `jobTypeId`); the demo store keeps the canned trade list.
   */
  const typeOptions = useMemo(
    () =>
      live
        ? services.map((service) => ({ id: service.id, label: service.name }))
        : JOB_TYPES.map(({ id, label }) => ({ id, label })),
    [live, services],
  );

  const priorityOptions = useMemo(
    () => JOB_PRIORITIES.map(({ id, label }) => ({ id, label })),
    [],
  );

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  /**
   * The scheduled window is the single source of truth for a job's time:
   * its start is the schedule date the board and calendar sort on, and its
   * length is the job's total time. Nothing else on this form sets either, so
   * both ends are required and the window must be a positive span.
   */
  const totalMinutes = durationMinutes(scheduledAt, scheduledEndAt);
  const windowIncomplete = !scheduledAt || !scheduledEndAt;
  const windowInvalid = !windowIncomplete && !totalMinutes;

  const canSave = live
    ? Boolean(form.title.trim().length >= 2) && Boolean(totalMinutes) && !saving && !loading
    : Boolean(
        form.title.trim() &&
          form.type &&
          form.customer &&
          form.technician &&
          totalMinutes,
      );

  const selectedTypeId = live ? form.jobTypeId : form.type;
  const selectedCustomerId = live ? form.customerId : form.customer;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSave) return;

    if (!live) {
      // The demo record's date, time and total time are all read off the same
      // window rather than tracked separately.
      onSave({
        ...form,
        ...fromDateTimeInput(scheduledAt),
        scheduledStart: toApiInstant(scheduledAt),
        scheduledEnd: toApiInstant(scheduledEndAt),
        totalTime: formatDuration(totalMinutes),
        title: form.title.trim(),
      });
      return;
    }

    onSave({
      ...form,
      title: form.title.trim(),
      siteAddress: locationToAddress(form.location),
      // Sent as a pair or not at all, which is what the validator requires.
      scheduledStart: toApiInstant(scheduledAt),
      scheduledEnd: toApiInstant(scheduledEndAt),
    });
  };

  return (
    <div
      className="form-modal__overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        className="form-modal form-modal--wide form-modal--tall"
        role="dialog"
        aria-modal="true"
        aria-label={isEditing ? 'Edit job' : 'Create job'}
        onSubmit={handleSubmit}
      >
        <div className="form-modal__header">
          <h2 className="form-modal__title">{isEditing ? 'Edit Job' : 'Create Job'}</h2>
        </div>

        <div className="form-modal__body">
          {(error || loadError) && (
            <p className="form-modal__error" role="alert">
              {error || loadError}
            </p>
          )}

          {loading && <p className="form-modal__hint">Loading the latest details…</p>}

          <div className="form-modal__row">
            <div className="input-group">
              <label className="field-label" htmlFor="job-title">
                Job Title*
              </label>
              <input
                id="job-title"
                className="field-input"
                placeholder="Enter job title"
                value={form.title}
                disabled={loading}
                onChange={(event) => update({ title: event.target.value })}
              />
            </div>

            <div className="input-group">
              <span className="field-label">Job Type{live ? '' : '*'}</span>
              <FilterDropdown
                label="Select job type"
                value={selectedTypeId}
                options={typeOptions}
                onChange={(id) => {
                  const label = typeOptions.find((option) => option.id === id)?.label ?? '';
                  update(live ? { jobTypeId: id, type: label } : { type: id });
                }}
                disabled={loading}
                fullWidth
              />
            </div>
          </div>

          <div className="form-modal__row">
            <div className="input-group">
              <span className="field-label">Customer{live ? '' : '*'}</span>
              <FilterDropdown
                label="Select customer"
                value={selectedCustomerId}
                options={customerOptions}
                onChange={(id) => {
                  const label = customerOptions.find((option) => option.id === id)?.label ?? '';
                  update(live ? { customerId: id, customer: label } : { customer: id });
                }}
                disabled={loading}
                fullWidth
              />
            </div>

            <div className="input-group">
              <span className="field-label">Assigned To{live ? '' : '*'}</span>
              <AssigneeDropdown
                value={form.technician}
                onChange={(technician) => update({ technician })}
                onSelectAssignee={(assignee) =>
                  update({
                    assigneeType: assignee?.type ?? '',
                    assigneeId: assignee?.id ?? '',
                  })
                }
              />
              {live && !totalMinutes && (
                <span className="form-modal__hint">
                  Set the start and end times first — a job can only be assigned
                  once it has a window.
                </span>
              )}
            </div>
          </div>

          <div className="input-group">
            <label className="field-label" htmlFor="job-description">
              Description
            </label>
            <textarea
              id="job-description"
              className="form-modal__textarea"
              placeholder="Provide a brief description of the job"
              value={form.description}
              disabled={loading}
              onChange={(event) => update({ description: event.target.value })}
              rows={3}
            />
            <p
              className={`form-modal__hint${
                countWords(form.description) > MAX_WORDS ? ' form-modal__hint--over' : ''
              }`}
            >
              Max {MAX_WORDS} words
            </p>
          </div>

          <div className="input-group">
            <label className="field-label" htmlFor="job-location">
              Job Location
            </label>
            <input
              id="job-location"
              className="field-input"
              placeholder="142 Maple Street, Austin, TX 78701"
              value={form.location}
              disabled={loading}
              onChange={(event) => update({ location: event.target.value })}
            />
          </div>

          <div className="form-modal__row">
            <div className="input-group">
              <label className="field-label" htmlFor="job-scheduled-at">
                Starts*
              </label>
              <div className="form-modal__datetime">
                <input
                  id="job-scheduled-at"
                  type="datetime-local"
                  className="field-input"
                  value={scheduledAt}
                  disabled={loading}
                  onChange={(event) => {
                    const start = event.target.value;
                    setScheduledAt(start);
                    // Picking a start with no end yet offers a default block,
                    // so the common case is one click rather than two.
                    if (start && !scheduledEndAt) {
                      setScheduledEndAt(addHours(start, DEFAULT_DURATION_HOURS));
                    }
                  }}
                />
                <CalendarDays
                  className="form-modal__datetime-icon"
                  size={20}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="field-label" htmlFor="job-scheduled-end-at">
                Ends*
              </label>
              <div className="form-modal__datetime">
                <input
                  id="job-scheduled-end-at"
                  type="datetime-local"
                  className="field-input"
                  value={scheduledEndAt}
                  min={scheduledAt || undefined}
                  disabled={loading}
                  onChange={(event) => setScheduledEndAt(event.target.value)}
                />
                <CalendarDays
                  className="form-modal__datetime-icon"
                  size={20}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          {/* Total time is read off the window rather than asked for. */}
          <p
            className={`form-modal__hint${
              windowInvalid ? ' form-modal__hint--over' : ''
            }`}
          >
            {windowInvalid
              ? 'The end time has to be after the start time.'
              : windowIncomplete
                ? 'Both a start and an end time are required — the job’s total time is measured between them.'
                : `Total time: ${formatDuration(totalMinutes)}`}
          </p>

          <div className="form-modal__row">
            <div className="input-group">
              <span className="field-label">Priority</span>
              <FilterDropdown
                label="Set priority level"
                value={form.priority}
                options={priorityOptions}
                onChange={(priority) => update({ priority })}
                disabled={loading}
                fullWidth
              />
            </div>
          </div>

          {/* A new job has nothing to budget or bill against yet — both are
              figures the job accrues, so they only appear once it exists. */}
          {live && isEditing && (
            <div className="form-modal__row">
              <div className="input-group">
                <span className="field-label">Budget</span>
                <div className="onb-input-affix">
                  <DollarSign className="onb-input-affix-icon" strokeWidth={2} />
                  <input
                    className="field-input"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.budget}
                    disabled={loading}
                    onChange={(event) => update({ budget: event.target.value })}
                  />
                </div>
              </div>

              <div className="input-group">
                <span className="field-label">Revenue</span>
                <div className="onb-input-affix">
                  <DollarSign className="onb-input-affix-icon" strokeWidth={2} />
                  <input
                    className="field-input"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.revenue}
                    disabled={loading}
                    onChange={(event) => update({ revenue: event.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="form-modal__actions">
          <button type="button" className="ghost-button" disabled={saving} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="cta-button" disabled={!canSave}>
            <img className="cta-button__glow" src={glow} alt="" aria-hidden="true" />
            {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Job'}
          </button>
        </div>
      </form>
    </div>
  );
};
