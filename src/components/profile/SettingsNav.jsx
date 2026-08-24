import React from 'react';
import { settingsIcons } from './settingsIcons';

/**
 * Left rail of the Profile screen. Purely presentational — the page owns the
 * active section so the URL / panel stay in one place.
 */
export const SettingsNav = ({ sections, activeId, onSelect }) => {
  return (
    <nav className="settings-nav" aria-label="Settings sections">
      {sections.map(({ id, label, icon, badge }) => {
        const Icon = settingsIcons[icon];
        const active = id === activeId;

        return (
          <button
            key={id}
            type="button"
            aria-current={active ? 'page' : undefined}
            className={`settings-nav__link${active ? ' settings-nav__link--active' : ''}`}
            onClick={() => onSelect(id)}
          >
            <span className="settings-nav__lead">
              {Icon && <Icon size={16} strokeWidth={2} />}
              <span className="settings-nav__label">{label}</span>
            </span>
            {badge ? <span className="settings-nav__badge">{badge}</span> : null}
          </button>
        );
      })}
    </nav>
  );
};
