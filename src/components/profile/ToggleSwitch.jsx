import React from 'react';

/** 44×26 pill toggle from the Figma component set. */
export const ToggleSwitch = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    className={`toggle-switch${checked ? ' toggle-switch--on' : ''}`}
    onClick={() => onChange(!checked)}
  >
    <span className="toggle-switch__knob" />
  </button>
);

/**
 * Title + description on the left, a control on the right — the layout the
 * design reuses for the timezone toggle and both Danger Zone actions.
 */
export const SettingsRow = ({ title, description, tone, children }) => (
  <div className="settings-row">
    <div className="settings-row__body">
      <p className={`settings-row__title${tone ? ` settings-row__title--${tone}` : ''}`}>
        {title}
      </p>
      <p className="settings-row__description">{description}</p>
    </div>
    {children}
  </div>
);
