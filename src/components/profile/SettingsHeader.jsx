import React from 'react';
import glow from '../../assets/button-glow.svg';

/** Panel heading. Actions sit inline on the right when supplied. */
export const SettingsHeader = ({ title, subtitle, children }) => (
  <header className="settings-header">
    <div className="page-title settings-header__title">
      <h1 className="settings-header__heading">{title}</h1>
      <p className="page-title__subheading">{subtitle}</p>
    </div>
    {children}
  </header>
);

/**
 * The Reset / Save pair. Both stay disabled until the draft actually differs
 * from what's stored, which keeps the Save affordance honest.
 */
export const SaveActions = ({ dirty, onReset, onSave }) => (
  <div className="settings-actions">
    <button
      type="button"
      className="ghost-button settings-actions__reset"
      onClick={onReset}
      disabled={!dirty}
    >
      Reset
    </button>
    <button
      type="button"
      className="cta-button cta-button--sm"
      onClick={onSave}
      disabled={!dirty}
    >
      <img className="cta-button__glow" src={glow} alt="" aria-hidden="true" />
      <span>Save</span>
    </button>
  </div>
);
