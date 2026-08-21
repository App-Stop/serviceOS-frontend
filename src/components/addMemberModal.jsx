import React, { useEffect, useState } from 'react';
import { DollarSign } from 'lucide-react';
import { InputGroup } from './InputGroup';
import { Select } from './onboarding/WizardControls';

const ROLES = ['Admin', 'Dispatcher', 'Technician'];

const emptyMember = { name: '', phone: '', email: '', role: 'Technician', rate: '', crew: '' };

/**
 * Add / edit a team member. Rendered as an overlay dialog from the onboarding
 * wizard; `member` prefills the form when editing an existing invitee.
 */
export const AddMemberModal = ({ member, crews = [], onSave, onClose }) => {
  // Mounted fresh per open (keyed by member id at the call site), so the
  // incoming member is a safe one-time initializer.
  const [form, setForm] = useState(() => ({ ...emptyMember, ...member }));

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const canSave = Boolean(form.name && form.role && form.rate);

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
              <Select
                placeholder="Select a role"
                options={ROLES}
                value={form.role}
                onChange={(e) => update({ role: e.target.value })}
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

          {crews.length > 0 && (
            <div className="input-group">
              <span className="field-label">Assign to Crew</span>
              <Select
                placeholder="No crew"
                options={crews.map((crew) => crew.name || 'Untitled crew')}
                value={form.crew}
                onChange={(e) => update({ crew: e.target.value })}
              />
            </div>
          )}
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
