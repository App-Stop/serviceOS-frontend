import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { InputGroup } from './InputGroup';
import { Select } from './onboarding/WizardControls';

/** Crew colours, in the order they appear on the Figma swatch row. */
const CREW_COLORS = [
  'pink',
  'violent',
  'green',
  'cyan',
  'red',
  'orange',
  'blue',
  'yellow',
  'maroon',
];

const SWATCH_CLASS = {
  pink: 'bg-pink',
  violent: 'bg-violent',
  green: 'bg-green',
  cyan: 'bg-cyan',
  red: 'bg-red',
  orange: 'bg-orange',
  blue: 'bg-blue',
  yellow: 'bg-yellow',
  maroon: 'bg-maroon',
};

const emptyCrew = { name: '', lead: '', members: [], color: 'pink' };

/**
 * Create / edit a crew. `roster` is the list of people available to lead or join;
 * `crew` prefills the form when editing.
 */
export const CreateCrewModal = ({ crew, roster = [], onSave, onClose }) => {
  // Mounted fresh per open (keyed by crew id at the call site).
  const [form, setForm] = useState(() => ({ ...emptyCrew, ...crew }));
  const [query, setQuery] = useState('');

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));
  const canSave = Boolean(form.lead);

  const suggestions = roster.filter(
    (name) => !form.members.includes(name) && name.toLowerCase().includes(query.toLowerCase()),
  );

  const addMember = (name) => {
    update({ members: [...form.members, name] });
    setQuery('');
  };

  const removeMember = (name) =>
    update({ members: form.members.filter((m) => m !== name) });

  const handleMemberKeyDown = (e) => {
    if (e.key === 'Enter' && suggestions.length) {
      e.preventDefault();
      addMember(suggestions[0]);
    }
    if (e.key === 'Backspace' && !query && form.members.length) {
      removeMember(form.members[form.members.length - 1]);
    }
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const onKeyDown = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="onb-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Create Crew"
      onClick={handleBackdrop}
    >
      <div className="onb-modal">
        <div className="onb-modal-header">
          <h2 className="onb-modal-title">{crew?.id ? 'Edit Crew' : 'Create Crew'}</h2>
        </div>

        <div className="onb-modal-body">
          <InputGroup
            label="Crew Name"
            placeholder="e.g. John’s Crew"
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
          />

          <div className="input-group">
            <span className="field-label">Crew lead*</span>
            <Select
              placeholder="Select a crew lead"
              options={roster}
              value={form.lead}
              onChange={(e) => update({ lead: e.target.value })}
            />
          </div>

          <div className="input-group">
            <span className="field-label">Crew Members</span>
            <div className="onb-token-field">
              {form.members.map((name) => (
                <span key={name} className="onb-token">
                  <span className="px-[var(--spacing-xxs)]">{name}</span>
                  <button
                    type="button"
                    className="onb-token-remove"
                    aria-label={`Remove ${name}`}
                    onClick={() => removeMember(name)}
                  >
                    <X className="size-[16px]" strokeWidth={2} />
                  </button>
                </span>
              ))}
              <input
                className="onb-token-input"
                placeholder={form.members.length ? '' : 'Add team members'}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleMemberKeyDown}
              />
            </div>

            {query && suggestions.length > 0 && (
              <div className="onb-token-suggestions">
                {suggestions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="onb-token-suggestion"
                    onClick={() => addMember(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="onb-field-block">
            <span className="field-label">Crew Color</span>
            <div className="onb-swatch-group">
              {CREW_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={color}
                  aria-pressed={form.color === color}
                  onClick={() => update({ color })}
                  className={`onb-swatch ${SWATCH_CLASS[color]} ${
                    form.color === color ? 'onb-swatch-active' : ''
                  }`}
                />
              ))}
            </div>
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
            <span className="relative px-[var(--spacing-xxs)]">
              {crew?.id ? 'Update' : 'Create'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCrewModal;
