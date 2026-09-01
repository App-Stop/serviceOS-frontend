import React, { useEffect, useState } from 'react';
import { InputGroup } from './InputGroup';
import { emptyAddress, hasAddress } from '../api/customers';
import { getErrorMessage } from '../api/client';
import './FormModal.css';

const emptyCustomer = {
  name: '',
  businessName: '',
  phone: '',
  email: '',
  billingAddress: emptyAddress(),
  serviceAddress: emptyAddress(),
  notes: '',
};

// Mirrors the API's phone rule (`^\+?[1-9]\d{6,14}$` after its own punctuation
// strip), so an unsendable number is caught here rather than as a 422.
const PHONE_PATTERN = /^\+?[1-9]\d{6,14}$/;
const stripPhone = (value = '') =>
  String(value).trim().replace(/(?!^\+)[^\d]/g, '');

const sameAddress = (a, b) =>
  ['line1', 'city', 'state', 'zip'].every(
    (key) => String(a?.[key] ?? '').trim() === String(b?.[key] ?? '').trim(),
  );

/**
 * The four fields `AddressSchema` actually stores. There is no `street`,
 * `postalCode` or `country` on the model, so nothing else is collected — the
 * create validator would strip it on the way in.
 */
const AddressFields = ({ value, onChange, disabled }) => {
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <>
      <InputGroup
        label="Street"
        placeholder="12 Valley Rd"
        value={value.line1}
        disabled={disabled}
        onChange={(event) => set({ line1: event.target.value })}
      />
      <div className="form-modal__row">
        <InputGroup
          label="City"
          placeholder="Plano"
          value={value.city}
          disabled={disabled}
          onChange={(event) => set({ city: event.target.value })}
        />
        <InputGroup
          label="State"
          placeholder="TX"
          value={value.state}
          disabled={disabled}
          onChange={(event) => set({ state: event.target.value })}
        />
        <InputGroup
          label="ZIP"
          placeholder="75024"
          value={value.zip}
          disabled={disabled}
          onChange={(event) => set({ zip: event.target.value })}
        />
      </div>
    </>
  );
};

/**
 * Create / edit a customer. Used by the customers list ("New Customer"), the
 * dashboard quick action, and the customer detail screen's Edit action.
 *
 * `loadCustomer` re-reads the record when the dialog opens, so an edit starts
 * from the server's current values rather than whatever the list was holding.
 * Saving is driven by the caller — `saving` disables the form and `error`
 * keeps the dialog open with the reason shown inside it.
 */
export const CustomerFormModal = ({
  customer,
  saving = false,
  error = '',
  loadCustomer,
  onSave,
  onClose,
}) => {
  const [form, setForm] = useState(() => ({
    ...emptyCustomer,
    ...customer,
    billingAddress: { ...emptyAddress(), ...customer?.billingAddress },
    serviceAddress: { ...emptyAddress(), ...customer?.serviceAddress },
  }));

  // Most customers are served where they are billed, so the service address
  // mirrors the billing one until it's unticked.
  const [mirrorBilling, setMirrorBilling] = useState(() => {
    if (!customer) return true;
    return (
      !hasAddress(customer.serviceAddress) ||
      sameAddress(customer.billingAddress, customer.serviceAddress)
    );
  });

  const [loading, setLoading] = useState(Boolean(loadCustomer));
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!loadCustomer) return undefined;

    let cancelled = false;
    setLoading(true);

    loadCustomer()
      .then((fresh) => {
        // Falls back to the record that opened the dialog if the read fails,
        // so the form is never left blank.
        if (cancelled || !fresh) return;

        setForm((prev) => ({
          ...prev,
          ...fresh,
          billingAddress: { ...emptyAddress(), ...fresh.billingAddress },
          serviceAddress: { ...emptyAddress(), ...fresh.serviceAddress },
        }));
        setMirrorBilling(
          !hasAddress(fresh.serviceAddress) ||
            sameAddress(fresh.billingAddress, fresh.serviceAddress),
        );
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
  }, [loadCustomer]);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // The API needs a full name *or* a business name, and rejects a malformed
  // email or phone — both are optional, so a blank one is fine.
  const hasName = Boolean(form.name.trim() || form.businessName.trim());
  const emailOk = !form.email.trim() || /^\S+@\S+\.\S+$/.test(form.email.trim());
  const phoneOk = !form.phone.trim() || PHONE_PATTERN.test(stripPhone(form.phone));

  const canSave = hasName && emailOk && phoneOk && !saving && !loading;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSave) return;

    onSave({
      ...form,
      name: form.name.trim(),
      businessName: form.businessName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      notes: form.notes.trim(),
      serviceAddress: mirrorBilling ? form.billingAddress : form.serviceAddress,
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
        className="form-modal form-modal--tall"
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
          {(error || loadError) && (
            <p className="form-modal__error" role="alert">
              {error || loadError}
            </p>
          )}

          {loading && <p className="form-modal__hint">Loading the latest details…</p>}

          <div className="form-modal__row">
            <InputGroup
              label="Full Name"
              placeholder="Maria Gomez"
              value={form.name}
              disabled={loading}
              onChange={(event) => update({ name: event.target.value })}
            />
            <InputGroup
              label="Business Name"
              placeholder="Green Valley Landscaping"
              value={form.businessName}
              disabled={loading}
              onChange={(event) => update({ businessName: event.target.value })}
            />
          </div>
          <span className="form-modal__hint">
            A full name or a business name is required — either one will do.
          </span>

          <div className="form-modal__row">
            <InputGroup
              label="Phone"
              type="tel"
              placeholder="+1 555 333 4444"
              value={form.phone}
              disabled={loading}
              onChange={(event) => update({ phone: event.target.value })}
            />
            <InputGroup
              label="Email"
              type="email"
              placeholder="name@example.com"
              value={form.email}
              disabled={loading}
              onChange={(event) => update({ email: event.target.value })}
            />
          </div>

          <div className="form-modal__section">
            <span className="form-modal__section-title">Billing Address</span>
            <AddressFields
              value={form.billingAddress}
              disabled={loading}
              onChange={(billingAddress) => update({ billingAddress })}
            />
          </div>

          <div className="form-modal__section">
            <div className="form-modal__section-head">
              <span className="form-modal__section-title">Service Address</span>
              <label className="form-modal__checkbox">
                <input
                  type="checkbox"
                  checked={mirrorBilling}
                  disabled={loading}
                  onChange={(event) => setMirrorBilling(event.target.checked)}
                />
                Same as billing
              </label>
            </div>

            {!mirrorBilling && (
              <AddressFields
                value={form.serviceAddress}
                disabled={loading}
                onChange={(serviceAddress) => update({ serviceAddress })}
              />
            )}
          </div>

          <InputGroup
            label="Notes"
            placeholder="Prefers morning appointments, gate code 4521."
            value={form.notes}
            disabled={loading}
            onChange={(event) => update({ notes: event.target.value })}
          />
        </div>

        <div className="form-modal__actions">
          <button
            type="button"
            className="btn-secondary"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={!canSave}>
            {saving ? 'Saving…' : customer?.id ? 'Save Changes' : 'Add Customer'}
          </button>
        </div>
      </form>
    </div>
  );
};
