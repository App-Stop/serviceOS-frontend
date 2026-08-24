import React from 'react';
import { Star } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import { SettingsField } from './SettingsField';
import { SettingsHeader, SaveActions } from './SettingsHeader';
import { ImageUpload } from './ImageUpload';
import { ImageDropZone } from './ImageDropZone';
import { InvoiceLayoutPicker } from './InvoiceLayoutPicker';
import { ThemePicker } from './ThemePicker';
import {
  INVOICE_LAYOUTS,
  INVOICE_THEMES,
  PAYMENT_TERM_OPTIONS,
  SECTION_HEADINGS,
  useSettingsDraft,
} from '../../data';

/** Branding tab — logo, header cover, invoice layout / theme, default terms. */
export const BrandingPanel = () => {
  const { draft, setField, save, reset, dirty } = useSettingsDraft('branding');
  const heading = SECTION_HEADINGS.branding;

  return (
    <>
      <SettingsHeader title={heading.title} subtitle={heading.subtitle}>
        <SaveActions dirty={dirty} onReset={reset} onSave={save} />
      </SettingsHeader>

      <SettingsCard
        title="Invoice & Document Branding"
        description="Customize your brand identity on invoices, quotes, and customer emails"
      >
        <div className="settings-group">
          <p className="settings-field__label">Business Logo</p>
          <ImageUpload
            value={draft.logo}
            onChange={(value) => setField('logo', value)}
            icon={Star}
            buttonLabel="Upload"
            hint="PNG, JPG or SVG. Max 2MB. Appears on all invoices & emails."
            alt="Business logo"
          />
        </div>

        <div className="settings-group">
          <p className="settings-field__label">Header Cover</p>
          <ImageDropZone
            value={draft.headerCover}
            onChange={(value) => setField('headerCover', value)}
            alt="Invoice header cover"
          />
        </div>
      </SettingsCard>

      <SettingsCard>
        <div className="settings-group">
          <p className="settings-field__label">Invoice Layout</p>
          <InvoiceLayoutPicker
            layouts={INVOICE_LAYOUTS}
            value={draft.invoiceLayout}
            onChange={(value) => setField('invoiceLayout', value)}
          />
        </div>

        <div className="settings-group">
          <p className="settings-field__label">Invoice Theme</p>
          <ThemePicker
            themes={INVOICE_THEMES}
            value={draft.invoiceTheme}
            onChange={(value) => setField('invoiceTheme', value)}
          />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Default Terms & Customer Message"
        description="Pre-filled notes displayed at the footer of every new invoice"
      >
        <div className="settings-field-row settings-field-row--half">
          <SettingsField
            label="Default Payment Terms"
            type="select"
            options={PAYMENT_TERM_OPTIONS}
            value={draft.paymentTerms}
            onChange={(value) => setField('paymentTerms', value)}
          />
        </div>

        <SettingsField
          label="Default Invoice Note"
          type="textarea"
          value={draft.invoiceNote}
          onChange={(value) => setField('invoiceNote', value)}
          hint="Automatically added to every new invoice you create"
        />
      </SettingsCard>
    </>
  );
};
