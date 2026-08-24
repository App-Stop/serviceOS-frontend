import React from 'react';
import { UserRound, FileDown } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import { SettingsField, SettingsFieldRow } from './SettingsField';
import { SettingsHeader, SaveActions } from './SettingsHeader';
import { ImageUpload } from './ImageUpload';
import { ToggleSwitch, SettingsRow } from './ToggleSwitch';
import {
  ROLE_OPTIONS,
  TIME_ZONE_OPTIONS,
  TIME_FORMAT_OPTIONS,
  SECTION_HEADINGS,
  useSettingsDraft,
} from '../../data';

/**
 * Account tab — personal details, regional display preferences, the data
 * export action and the destructive workspace actions.
 *
 * The Reset / Save pair lives inside the Personal Information card here (as
 * designed), so the page header carries no actions on this tab.
 */
export const AccountPanel = ({ onExport, onResetData, onDeleteAccount }) => {
  const { draft, setField, save, reset, dirty } = useSettingsDraft('account');
  const heading = SECTION_HEADINGS.account;

  return (
    <>
      <SettingsHeader title={heading.title} subtitle={heading.subtitle} />

      <SettingsCard
        title="Personal Information"
        description="Your profile details visible across the app and to team members"
      >
        <ImageUpload
          value={draft.photo}
          onChange={(value) => setField('photo', value)}
          icon={UserRound}
          buttonLabel="Upload Profile Photo"
          alt={draft.fullName}
        />

        <SettingsFieldRow>
          <SettingsField
            label="Full Name"
            value={draft.fullName}
            onChange={(value) => setField('fullName', value)}
          />
          <SettingsField
            label="Email"
            type="email"
            value={draft.email}
            onChange={(value) => setField('email', value)}
            hint="Primary sign-in and notification email"
          />
        </SettingsFieldRow>

        <SettingsFieldRow>
          <SettingsField
            label="Phone"
            type="tel"
            value={draft.phone}
            onChange={(value) => setField('phone', value)}
          />
          <SettingsField
            label="Role"
            type="select"
            options={ROLE_OPTIONS}
            value={draft.role}
            onChange={(value) => setField('role', value)}
          />
        </SettingsFieldRow>

        <SaveActions dirty={dirty} onReset={reset} onSave={save} />
      </SettingsCard>

      <SettingsCard
        title="Display Timezone & Regional"
        description="Used for job due times, calendar dispatch lanes, and client messaging timestamps"
      >
        <SettingsRow
          title="Use workspace timezone"
          description="Inherit from company headquarters (Central Time - Austin, TX)"
        >
          <ToggleSwitch
            checked={draft.useWorkspaceTimezone}
            onChange={(value) => setField('useWorkspaceTimezone', value)}
            label="Use workspace timezone"
          />
        </SettingsRow>

        <SettingsFieldRow>
          <SettingsField
            label="Time Zone"
            type="select"
            options={TIME_ZONE_OPTIONS}
            value={draft.timeZone}
            onChange={(value) => setField('timeZone', value)}
          />
          <SettingsField
            label="Time Format"
            type="select"
            options={TIME_FORMAT_OPTIONS}
            value={draft.timeFormat}
            onChange={(value) => setField('timeFormat', value)}
          />
        </SettingsFieldRow>
      </SettingsCard>

      <SettingsCard className="settings-card--split">
        <div className="settings-card__header">
          <h2 className="settings-card__title">Data Export & Backup</h2>
          <p className="settings-card__description">
            Download a complete copy of your ServiceOS business records (GDPR &amp; Data
            Portability). Export all customers, jobs, invoices, notes, and team data as a
            JSON file.
          </p>
        </div>

        <button type="button" className="ghost-button" onClick={onExport}>
          <FileDown size={18} strokeWidth={2} />
          <span>Export to CSV</span>
        </button>
      </SettingsCard>

      <SettingsCard
        variant="danger"
        title="Danger Zone"
        description="Irreversible workspace actions. Proceed with caution."
      >
        <SettingsRow
          title="Reset all data"
          description="Revert workspace to the original dataset and wipe edits."
          tone="danger"
        >
          <button type="button" className="danger-button" onClick={onResetData}>
            Reset Data
          </button>
        </SettingsRow>

        <SettingsRow
          title="Delete account"
          description="Permanently delete your account and all associated data."
          tone="danger"
        >
          <button type="button" className="danger-button" onClick={onDeleteAccount}>
            Delete Account
          </button>
        </SettingsRow>
      </SettingsCard>
    </>
  );
};
