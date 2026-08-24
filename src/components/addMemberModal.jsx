import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign } from 'lucide-react';
import { InputGroup } from './InputGroup';
import { FilterDropdown } from './FilterDropdown';
import { useCrews } from '../data';

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

const ROLE_OPTIONS = [
  { id: 'Admin', label: 'Admin' },
  { id: 'Dispatcher', label: 'Dispatcher' },
  { id: 'Technician', label: 'Technician' },
  { id: 'Lead Technician', label: 'Lead Technician' },
];

const emptyMember = { name: '', phone: '', email: '', role: 'Technician', rate: '', crew: '' };

/**
 * Add / edit a team member. Rendered as an overlay dialog from the onboarding
 * wizard or Team page.
 */
export const AddMemberModal = ({ member, crews = [], onSave, onClose }) => {
  const storeCrews = useCrews();
  const availableCrews = crews.length > 0 ? crews : storeCrews;

  const [form, setForm] = useState(() => ({ ...emptyMember, ...member }));

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const canSave = Boolean(form.name && form.role && form.rate);

  const crewOptions = useMemo(
    () => [
      { id: '', label: 'No crew' },
      ...availableCrews.map((c) => ({
        id: c.name,
        label: c.name,
        dot: CREW_COLOR_MAP[c.color] || c.color || '#6A6A6A',
      })),
    ],
    [availableCrews],
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
          <InputGroup
            label="Full Name"
            placeholder="John Doe"
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
          />

          <InputGroup
            label="Phone Number"
            type="tel"
            placeholder="(555) 000-0000"
            value={form.phone}
            onChange={(e) => update({ phone: e.target.value })}
          />

          <InputGroup
            label="Email Address"
            type="email"
            placeholder="name@serviceos.com"
            value={form.email}
            onChange={(e) => update({ email: e.target.value })}
          />

          <div className="onb-modal-row">
            <div className="input-group">
              <span className="field-label">Role*</span>
              <FilterDropdown
                label="Select a role"
                value={form.role}
                options={ROLE_OPTIONS}
                onChange={(role) => update({ role })}
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
              fullWidth
            />
          </div>
        </div>

        <div className="onb-modal-footer">
          <button type="button" className="onb-nav-btn" onClick={onClose}>
            <span className="px-[var(--spacing-xxs)]">Cancel</span>
          </button>

          <button
            type="button"
            className="onb-nav-primary onb-nav-primary-auto"
            disabled={!canSave}
            onClick={() => onSave(form)}
          >
            <span className="onb-glow" />
            <span className="relative px-[var(--spacing-xxs)]">{member?.id ? 'Save' : 'Add'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;
