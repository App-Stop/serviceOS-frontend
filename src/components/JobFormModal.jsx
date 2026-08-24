import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { FilterDropdown } from './FilterDropdown';
import { AssigneeDropdown } from './AssigneeDropdown';
import { JOB_PRIORITIES, JOB_TYPES } from '../data/jobs';
import { useCustomers } from '../data/customers';
import { fromDateTimeInput, toDateTimeInput } from '../data/schedule';
import glow from '../assets/button-glow.svg';
import './FormModal.css';

const emptyJob = {
  title: '',
  customer: '',
  technician: '',
  date: '',
  time: '',
  type: '',
  location: '',
  description: '',
  status: 'scheduled',
  priority: 'normal',
};

/** The description hint the design shows under the field. */
const MAX_WORDS = 50;

const countWords = (value) => value.trim().split(/\s+/).filter(Boolean).length;

export const JobFormModal = ({ job, onSave, onClose }) => {
  const customers = useCustomers();
  const [form, setForm] = useState(() => ({ ...emptyJob, ...job }));

  /* The store keeps date and time apart; the form edits them as one field. */
  const [scheduledAt, setScheduledAt] = useState(() =>
    toDateTimeInput(form.date, form.time),
  );

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const isEditing = Boolean(job?.id);

  /* Every field the design marks with an asterisk. */
  const canSave = Boolean(
    form.title.trim() && form.type && form.customer && form.technician && scheduledAt,
  );

  const customerOptions = useMemo(
    () => customers.map((customer) => ({ id: customer.name, label: customer.name })),
    [customers],
  );

  const typeOptions = useMemo(() => JOB_TYPES.map(({ id, label }) => ({ id, label })), []);

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

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSave) return;

    onSave({
      ...form,
      ...fromDateTimeInput(scheduledAt),
      title: form.title.trim(),
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
        className="form-modal form-modal--wide"
        role="dialog"
        aria-modal="true"
        aria-label={isEditing ? 'Edit job' : 'Create job'}
        onSubmit={handleSubmit}
      >
        <div className="form-modal__header">
          <h2 className="form-modal__title">{isEditing ? 'Edit Job' : 'Create Job'}</h2>
        </div>

        <div className="form-modal__body">
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
                onChange={(event) => update({ title: event.target.value })}
              />
            </div>

            <div className="input-group">
              <span className="field-label">Job Type*</span>
              <FilterDropdown
                label="Select job type"
                value={form.type}
                options={typeOptions}
                onChange={(type) => update({ type })}
                fullWidth
              />
            </div>
          </div>

          <div className="form-modal__row">
            <div className="input-group">
              <span className="field-label">Customer*</span>
              <FilterDropdown
                label="Select customer"
                value={form.customer}
                options={customerOptions}
                onChange={(customer) => update({ customer })}
                fullWidth
              />
            </div>

            <div className="input-group">
              <span className="field-label">Assigned To*</span>
              <AssigneeDropdown
                value={form.technician}
                onChange={(technician) => update({ technician })}
              />
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
              onChange={(event) => update({ location: event.target.value })}
            />
          </div>

          <div className="form-modal__row">
            <div className="input-group">
              <label className="field-label" htmlFor="job-scheduled-at">
                Schedule Date &amp; Time*
              </label>
              <div className="form-modal__datetime">
                <input
                  id="job-scheduled-at"
                  type="datetime-local"
                  className="field-input"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
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
              <span className="field-label">Priority</span>
              <FilterDropdown
                label="Set priority level"
                value={form.priority}
                options={priorityOptions}
                onChange={(priority) => update({ priority })}
                fullWidth
              />
            </div>
          </div>
        </div>

        <div className="form-modal__actions">
          <button type="button" className="ghost-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="cta-button" disabled={!canSave}>
            <img className="cta-button__glow" src={glow} alt="" aria-hidden="true" />
            {isEditing ? 'Save Changes' : 'Create Job'}
          </button>
        </div>
      </form>
    </div>
  );
};
