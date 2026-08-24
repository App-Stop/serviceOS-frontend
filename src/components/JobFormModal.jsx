import React, { useEffect, useMemo, useState } from 'react';
import { InputGroup } from './InputGroup';
import { FilterDropdown } from './FilterDropdown';
import { JOB_STATUSES, JOB_PRIORITIES } from '../data/jobs';
import { useCustomers } from '../data/customers';
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

export const JobFormModal = ({ job, onSave, onClose }) => {
  const customers = useCustomers();
  const [form, setForm] = useState(() => ({ ...emptyJob, ...job }));

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const canSave = Boolean(form.title.trim() && form.customer);

  const customerOptions = useMemo(
    () => customers.map((c) => ({ id: c.name, label: c.name })),
    [customers],
  );

  const statusOptions = useMemo(
    () => JOB_STATUSES.map((s) => ({ id: s.id, label: s.label, dot: s.dot })),
    [],
  );

  const priorityOptions = useMemo(
    () => JOB_PRIORITIES.map((p) => ({ id: p.id, label: p.label })),
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
    onSave({ ...form, title: form.title.trim() });
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
        className="form-modal"
        role="dialog"
        aria-modal="true"
        aria-label={job?.id ? 'Edit job' : 'New job'}
        onSubmit={handleSubmit}
      >
        <div className="form-modal__header">
          <h2 className="form-modal__title">{job?.id ? 'Edit Job' : 'New Job'}</h2>
          <p className="form-modal__subtitle">
            {job?.id ? 'Update the job details.' : 'Book a job for one of your customers.'}
          </p>
        </div>

        <div className="form-modal__body">
          <InputGroup
            label="Job Title"
            placeholder="AC Ductwork Repair"
            value={form.title}
            onChange={(event) => update({ title: event.target.value })}
            required
          />

          <div className="form-modal__row">
            <div className="input-group">
              <label className="field-label">Customer*</label>
              <FilterDropdown
                label="Select a customer"
                value={form.customer}
                options={customerOptions}
                onChange={(customer) => update({ customer })}
                fullWidth
              />
            </div>

            <InputGroup
              label="Technician"
              placeholder="James Wilson"
              value={form.technician}
              onChange={(event) => update({ technician: event.target.value })}
            />
          </div>

          <div className="form-modal__row">
            <InputGroup
              label="Schedule Date"
              placeholder="Aug 12, 2026"
              value={form.date}
              onChange={(event) => update({ date: event.target.value })}
            />
            <InputGroup
              label="Time"
              placeholder="1:00 PM"
              value={form.time}
              onChange={(event) => update({ time: event.target.value })}
            />
          </div>

          <div className="form-modal__row">
            <div className="input-group">
              <label className="field-label">Status</label>
              <FilterDropdown
                label="Select status"
                value={form.status}
                options={statusOptions}
                onChange={(status) => update({ status })}
                fullWidth
              />
            </div>

            <div className="input-group">
              <label className="field-label">Priority</label>
              <FilterDropdown
                label="Select priority"
                value={form.priority}
                options={priorityOptions}
                onChange={(priority) => update({ priority })}
                fullWidth
              />
            </div>
          </div>

          <InputGroup
            label="Type"
            placeholder="HVAC Service"
            value={form.type}
            onChange={(event) => update({ type: event.target.value })}
          />

          <InputGroup
            label="Job Location"
            placeholder="142 Maple Street, Austin, TX 78701"
            value={form.location}
            onChange={(event) => update({ location: event.target.value })}
          />

          <InputGroup
            label="Description"
            placeholder="Ductwork leaking in attic."
            value={form.description}
            onChange={(event) => update({ description: event.target.value })}
          />
        </div>

        <div className="form-modal__actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={!canSave}>
            {job?.id ? 'Save Changes' : 'Create Job'}
          </button>
        </div>
      </form>
    </div>
  );
};
