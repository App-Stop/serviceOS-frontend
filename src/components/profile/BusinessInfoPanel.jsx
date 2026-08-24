import React from 'react';
import { SettingsCard } from './SettingsCard';
import { SettingsField, SettingsFieldRow } from './SettingsField';
import { SettingsHeader, SaveActions } from './SettingsHeader';
import { OptionCardGroup } from './OptionCardGroup';
import { ChipPicker } from './ChipPicker';
import {
  DISPATCH_MODELS,
  INDUSTRY_CATEGORIES,
  SERVICE_AREA_OPTIONS,
  SECTION_HEADINGS,
  useSettingsDraft,
} from '../../data';

/** Business Info tab — company profile plus dispatch model and industry. */
export const BusinessInfoPanel = () => {
  const { draft, setField, save, reset, dirty } = useSettingsDraft('business');
  const heading = SECTION_HEADINGS.business;

  return (
    <>
      <SettingsHeader title={heading.title} subtitle={heading.subtitle}>
        <SaveActions dirty={dirty} onReset={reset} onSave={save} />
      </SettingsHeader>

      <SettingsCard
        title="Company Profile"
        description="Official company information printed on estimates, invoices, and job receipts"
      >
        <SettingsFieldRow>
          <SettingsField
            label="Company Name"
            value={draft.companyName}
            onChange={(value) => setField('companyName', value)}
          />
          <SettingsField
            label="Support Email"
            type="email"
            value={draft.supportEmail}
            onChange={(value) => setField('supportEmail', value)}
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
            label="Service Area / Coverage Radius"
            type="select"
            options={SERVICE_AREA_OPTIONS}
            value={draft.serviceArea}
            onChange={(value) => setField('serviceArea', value)}
          />
        </SettingsFieldRow>

        <SettingsField
          label="Headquarters Physical Address"
          value={draft.address}
          onChange={(value) => setField('address', value)}
        />
      </SettingsCard>

      <SettingsCard
        title="Dispatch & Operating Model"
        description="Control how jobs are scheduled and dispatched across your organization"
      >
        <OptionCardGroup
          label="Dispatch and operating model"
          options={DISPATCH_MODELS}
          value={draft.dispatchModel}
          onChange={(value) => setField('dispatchModel', value)}
        />

        <div className="settings-group">
          <p className="settings-field__label">Primary Industry Category</p>
          <ChipPicker
            label="Primary industry category"
            options={INDUSTRY_CATEGORIES}
            value={draft.industry}
            onChange={(value) => setField('industry', value)}
          />
        </div>
      </SettingsCard>
    </>
  );
};
