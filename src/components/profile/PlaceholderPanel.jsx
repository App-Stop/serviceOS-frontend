import React from 'react';
import { SettingsCard } from './SettingsCard';
import { SettingsHeader } from './SettingsHeader';
import { settingsIcons } from './settingsIcons';

/**
 * Stand-in for the settings sections that are listed in the nav but not yet
 * designed, so selecting them still lands somewhere coherent.
 */
export const PlaceholderPanel = ({ section, heading }) => {
  const Icon = settingsIcons[section.icon];

  return (
    <>
      <SettingsHeader title={heading.title} subtitle={heading.subtitle} />

      <SettingsCard className="settings-card--empty">
        <span className="settings-empty__icon">{Icon && <Icon size={24} strokeWidth={2} />}</span>
        <p className="settings-empty__title">{section.label} settings are on the way</p>
        <p className="settings-empty__description">
          This section is not part of the current release. Everything you configure in
          Account, Branding and Business Info applies across the workspace today.
        </p>
      </SettingsCard>
    </>
  );
};
