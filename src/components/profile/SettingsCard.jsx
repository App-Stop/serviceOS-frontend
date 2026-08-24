import React from 'react';

/**
 * White rounded surface used for every settings group.
 *
 * `title` / `description` render the card heading; `variant="danger"` gives
 * the tinted, red-bordered treatment used by the Danger Zone.
 */
export const SettingsCard = ({ title, description, variant, className = '', children }) => {
  return (
    <section
      className={`settings-card${
        variant ? ` settings-card--${variant}` : ''
      }${className ? ` ${className}` : ''}`}
    >
      {(title || description) && (
        <header className="settings-card__header">
          {title && <h2 className="settings-card__title">{title}</h2>}
          {description && <p className="settings-card__description">{description}</p>}
        </header>
      )}
      {children}
    </section>
  );
};
