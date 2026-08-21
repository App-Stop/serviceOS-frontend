import React, { useEffect, useState } from 'react';
import { InputGroup } from './InputGroup';
import './FormModal.css';

const emptyCustomer = {
  name: '',
  phone: '',
  email: '',
  locations: [],
  notes: '',
};

/**
 * Create / edit a customer. Used by the customers list ("New Customer") and
 * by the customer detail screen's Edit action, which is why it takes a
 * partial record and hands the patch back through `onSave`.
 */
export const CustomerFormModal = ({ customer, onSave, onClose }) => {
  const [form, setForm] = useState(() => ({ ...emptyCustomer, ...customer }));

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const canSave = Boolean(form.name.trim());

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
      name: form.name.trim(),
      locations: form.locations.filter(Boolean),
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
        className="form-modal"
        role="dialog"
        aria-modal="true"
        aria-label={customer?.id ? 'Edit customer' : 'New customer'}
        onSubmit={handleSubmit}
      >
        <div className="form-modal__header">
          <h2 className="form-modal__title">
            {customer?.id ? 'Edit Customer' : 'New Customer'}
          </h2>
          <p className="form-modal__subtitle">
            {customer?.id
              ? 'Update the contact details on file.'
              : 'Add a customer to start booking jobs.'}
          </p>
        </div>

        <div className="form-modal__body">
          <InputGroup
            label="Full Name"
            placeholder="Michael Johnson"
            value={form.name}
            onChange={(event) => update({ name: event.target.value })}
            required
          />

          <div className="form-modal__row">
            <InputGroup
              label="Phone"
              type="tel"
              placeholder="(555) 000-0000"
              value={form.phone}
              onChange={(event) => update({ phone: event.target.value })}
            />
            <InputGroup
              label="Email"
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={(event) => update({ email: event.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="field-label" htmlFor="customer-locations">
              Locations
            </label>
            <input
              id="customer-locations"
              className="field-input"
              placeholder="New York, NY; Austin, TX"
              value={form.locations.join('; ')}
              onChange={(event) =>
                update({ locations: event.target.value.split(';').map((part) => part.trim()) })
              }
            />
            <span className="form-modal__hint">Separate multiple locations with a semicolon.</span>
          </div>

          <InputGroup
            label="Notes"
            placeholder="I prefer morning appointments"
            value={form.notes}
            onChange={(event) => update({ notes: event.target.value })}
          />
        </div>

        <div className="form-modal__actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={!canSave}>
            {customer?.id ? 'Save Changes' : 'Add Customer'}
          </button>
        </div>
      </form>
    </div>
  );
};
