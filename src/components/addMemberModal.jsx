import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign } from 'lucide-react';
import { InputGroup } from './InputGroup';
import { FilterDropdown } from './FilterDropdown';
import { useCrews } from '../data';
import { MEMBER_ROLE_OPTIONS } from '../api/users';
import { getErrorMessage } from '../api/client';

const CREW_COLOR_MAP = {
  pink: '#ff1fad',
  green: '#00c064',
  cyan: '#00c9c6',
  blue: '#0095ff',
  violet: '#903bff',
  orange: '#f96c00',
  red: '#f30000',
  yellow: '#edba00',
};

const emptyMember = { name: '', phone: '', email: '', role: 'Technician', rate: '', crew: '' };

// Mirrors the API's `^\+?[0-9]{7,14}$` rule, so an unsendable number is caught
// here rather than coming back as a 422 from the save.
const PHONE_PATTERN = /^\+?[0-9]{7,14}$/;
const normalizePhone = (value = '') => {
  const trimmed = String(value).trim();
  const digits = trimmed.replace(/[^0-9]/g, '');
  return trimmed.startsWith('+') ? `+${digits}` : digits;
};

/**
 * Add / edit a team member. Rendered as an overlay dialog from the onboarding
 * wizard or Team page.
 *
 * `roleOptions` / `crewOptions` let a caller narrow the choices further; both
 * default to every role the API defines and the crews already loaded.
 *
 * `loadMember` re-reads the record when the dialog opens, so an edit starts
 * from the server's current values rather than whatever the list held when it
 * was last fetched.
 */
export const AddMemberModal = ({
  member,
  crews = [],
  roleOptions,
  crewOptions: crewOptionsProp,
  requireContact = false,
  saving = false,
  error = '',
  loadMember,
  onSave,
  onClose,
}) => {
  const storeCrews = useCrews();
  const availableCrews = crews.length > 0 ? crews : storeCrews;

  const [form, setForm] = useState(() => ({ ...emptyMember, ...member }));
  const [loading, setLoading] = useState(Boolean(loadMember));
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!loadMember) return undefined;

    let cancelled = false;
    setLoading(true);

    loadMember()
      .then((fresh) => {
        // Falls back to the row that opened the dialog if the read fails, so
        // the form is never left blank.
        if (!cancelled && fresh) setForm((prev) => ({ ...prev, ...fresh }));
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
  }, [loadMember]);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const roles = roleOptions ?? MEMBER_ROLE_OPTIONS;
  const rate = Number(form.rate);

  // Email and role are set at creation and are not part of the update payload
  // (see `updateMemberApi`), so an edit locks them and skips their validation.
  const isEdit = Boolean(member?.id);

  const phoneOk = !requireContact || PHONE_PATTERN.test(normalizePhone(form.phone));
  const emailOk = isEdit || !requireContact || /^\S+@\S+\.\S+$/.test(form.email.trim());

  const canSave = Boolean(
    form.name.trim().length >= 2 &&
      form.role &&
      Number.isFinite(rate) &&
      rate >= 1 &&
      phoneOk &&
      emailOk &&
      !saving &&
      !loading,
  );

  const crewOptions = useMemo(
    () =>
      crewOptionsProp ?? [
        { id: '', label: 'No crew' },
        ...availableCrews.map((c) => ({
          id: c.name,
          label: c.name,
          dot: CREW_COLOR_MAP[c.color] || c.color || '#6A6A6A',
        })),
      ],
    [availableCrews, crewOptionsProp],
  );

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const onKeyDown = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="onb-overlay" role="dialog" aria-modal="true" aria-label="Add Member" onClick={handleBackdrop}>
      <div className="onb-modal">
        <div className="onb-modal-header">
          <h2 className="onb-modal-title">{member?.id ? 'Edit Member' : 'Add Member'}</h2>
        </div>

        <div className="onb-modal-body">
          {(error || loadError) && (
            <p className="onb-error" role="alert">
              {error || loadError}
            </p>
          )}

          {loading && (
            <p className="onb-loading">Loading the latest details…</p>
          )}

          <InputGroup
            label="Full Name"
            placeholder="John Doe"
            value={form.name}
            disabled={loading}
            onChange={(e) => update({ name: e.target.value })}
          />

          <InputGroup
            label="Phone Number"
            type="tel"
            placeholder="(555) 000-0000"
            value={form.phone}
            disabled={loading}
            onChange={(e) => update({ phone: e.target.value })}
          />

          {/* Email is the account identity and is not updatable once created. */}
          <InputGroup
            label="Email Address"
            type="email"
            placeholder="name@serviceos.com"
            value={form.email}
            disabled={isEdit || loading}
            onChange={(e) => update({ email: e.target.value })}
          />

          <div className="onb-modal-row">
            <div className="input-group">
              <span className="field-label">Role*</span>
              {/* Role is fixed at creation and not part of the update. */}
              <FilterDropdown
                label="Select a role"
                value={form.role}
                options={roles}
                onChange={(role) => update({ role })}
                disabled={isEdit || loading}
                fullWidth
              />
            </div>

            <div className="input-group">
              <span className="field-label">Hourly Rate*</span>
              <div className="onb-input-affix">
                <DollarSign className="onb-input-affix-icon" strokeWidth={2} />
                <input
                  className="field-input"
                  type="number"
                  min="0"
                  placeholder="25"
                  value={form.rate}
                  disabled={loading}
                  onChange={(e) => update({ rate: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="input-group">
            <span className="field-label">Assign to Crew</span>
            <FilterDropdown
              label="No crew"
              value={form.crew}
              options={crewOptions}
              onChange={(crew) => update({ crew })}
              disabled={loading}
              fullWidth
            />
          </div>
        </div>

        <div className="onb-modal-footer">
          <button type="button" className="onb-nav-btn" disabled={saving} onClick={onClose}>
            <span className="px-[var(--spacing-xxs)]">Cancel</span>
          </button>

          <button
            type="button"
            className="onb-nav-primary onb-nav-primary-auto"
            disabled={!canSave}
            onClick={() => onSave(form)}
          >
            <span className="onb-glow" />
            <span className="relative px-[var(--spacing-xxs)]">
              {saving ? 'Saving…' : member?.id ? 'Save' : 'Add'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;
