import React from 'react';
import { Check } from 'lucide-react';
import { ToggleSwitch } from './ToggleSwitch';
import { FilterDropdown } from '../FilterDropdown';
import { useSettingsDraft } from '../../data';
import glow from '../../assets/button-glow.svg';

const CURRENCY_OPTIONS = [
  { id: 'USD ($)', label: 'USD ($)' },
  { id: 'EUR (€)', label: 'EUR (€)' },
  { id: 'GBP (£)', label: 'GBP (£)' },
  { id: 'CAD ($)', label: 'CAD ($)' },
  { id: 'AUD ($)', label: 'AUD ($)' },
];

export const InvoicingPanel = () => {
  const { draft, setField, save, reset, dirty } = useSettingsDraft('invoicing');

  const handlePaymentMethodToggle = (key) => {
    setField('paymentMethods', {
      ...draft.paymentMethods,
      [key]: !draft.paymentMethods?.[key],
    });
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex items-center justify-between w-full">
        <div className="flex flex-col gap-1 items-start">
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            Invoicing & Tax
          </h1>
          <p className="text-sm font-normal text-black-200">
            Configure tax calculation rules, billing currency, and accepted payment methods
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="ghost-button"
            disabled={!dirty}
            onClick={reset}
          >
            Reset
          </button>
          <button
            type="button"
            className="cta-button"
            disabled={!dirty}
            onClick={save}
          >
            <img className="cta-button__glow" src={glow} alt="" aria-hidden="true" />
            <span className="cta-button__label">Save</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-[30px] p-6 flex flex-col gap-6 w-full">
        <div className="flex flex-col gap-1 items-start w-full">
          <h2 className="text-base font-medium text-neutral-900">
            Tax Configuration
          </h2>
          <p className="text-xs font-normal text-black-200">
            Automatically apply tax calculations to invoice line items
          </p>
        </div>

        <div className="flex flex-col gap-5 w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col gap-0.5 items-start">
              <span className="text-sm font-medium text-neutral-900">
                Enable sales tax on invoices
              </span>
              <span className="text-xs font-normal text-black-200">
                Toggle whether tax rate is calculated on invoices by default
              </span>
            </div>
            <ToggleSwitch
              checked={Boolean(draft.enableSalesTax)}
              onChange={(val) => setField('enableSalesTax', val)}
            />
          </div>

          <div className="grid grid-cols-2 gap-5 w-full">
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-medium text-neutral-900">
                Tax Label
              </label>
              <input
                type="text"
                className="w-full h-11 px-[14px] py-2.5 rounded-[30px] bg-white border border-neutral-200 text-sm font-normal text-neutral-900 outline-none focus:border-neutral-900 transition-colors"
                placeholder="e.g. Sales Tax"
                value={draft.taxLabel ?? ''}
                onChange={(e) => setField('taxLabel', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-medium text-neutral-900">
                Tax Rate (%)
              </label>
              <input
                type="text"
                className="w-full h-11 px-[14px] py-2.5 rounded-[30px] bg-white border border-neutral-200 text-sm font-normal text-neutral-900 outline-none focus:border-neutral-900 transition-colors"
                placeholder="e.g. 6.25"
                value={draft.taxRate ?? ''}
                onChange={(e) => setField('taxRate', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-[30px] p-6 flex flex-col gap-6 w-full">
        <div className="flex flex-col gap-1 items-start w-full">
          <h2 className="text-base font-medium text-neutral-900">
            Currency & Payment Options
          </h2>
          <p className="text-xs font-normal text-black-200">
            Set your default currency and configure accepted payment methods
          </p>
        </div>

        <div className="flex flex-col gap-5 w-full">
          <div className="grid grid-cols-2 gap-5 w-full">
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-medium text-neutral-900">
                Billing Currency
              </label>
              <FilterDropdown
                label="Billing Currency"
                value={draft.currency || 'USD ($)'}
                options={CURRENCY_OPTIONS}
                onChange={(val) => setField('currency', val)}
                fullWidth
              />
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-medium text-neutral-900">
                Invoice Number Prefix
              </label>
              <input
                type="text"
                className="w-full h-11 px-[14px] py-2.5 rounded-[30px] bg-white border border-neutral-200 text-sm font-normal text-neutral-900 outline-none focus:border-neutral-900 transition-colors"
                placeholder="INV-"
                value={draft.invoicePrefix ?? ''}
                onChange={(e) => setField('invoicePrefix', e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3.5 w-full pt-1">
            <label className="text-sm font-medium text-neutral-900">
              Accepted Payment Methods
            </label>

            <button
              type="button"
              className="flex items-center gap-2.5 cursor-pointer text-left w-fit bg-transparent border-0 outline-none"
              onClick={() => handlePaymentMethodToggle('cards')}
            >
              <div
                className={`size-5 rounded-md flex items-center justify-center border transition-colors ${
                  draft.paymentMethods?.cards
                    ? 'bg-neutral-900 border-neutral-900 text-white'
                    : 'bg-white border-neutral-200'
                }`}
              >
                {draft.paymentMethods?.cards && <Check size={14} strokeWidth={2.5} />}
              </div>
              <span className="text-sm font-normal text-neutral-900">
                Credit / Debit Cards (via Stripe Online Checkout)
              </span>
            </button>

            <button
              type="button"
              className="flex items-center gap-2.5 cursor-pointer text-left w-fit bg-transparent border-0 outline-none"
              onClick={() => handlePaymentMethodToggle('ach')}
            >
              <div
                className={`size-5 rounded-md flex items-center justify-center border transition-colors ${
                  draft.paymentMethods?.ach
                    ? 'bg-neutral-900 border-neutral-900 text-white'
                    : 'bg-white border-neutral-200'
                }`}
              >
                {draft.paymentMethods?.ach && <Check size={14} strokeWidth={2.5} />}
              </div>
              <span className="text-sm font-normal text-neutral-900">
                ACH / Direct Bank Transfer
              </span>
            </button>

            <button
              type="button"
              className="flex items-center gap-2.5 cursor-pointer text-left w-fit bg-transparent border-0 outline-none"
              onClick={() => handlePaymentMethodToggle('cash')}
            >
              <div
                className={`size-5 rounded-md flex items-center justify-center border transition-colors ${
                  draft.paymentMethods?.cash
                    ? 'bg-neutral-900 border-neutral-900 text-white'
                    : 'bg-white border-neutral-200'
                }`}
              >
                {draft.paymentMethods?.cash && <Check size={14} strokeWidth={2.5} />}
              </div>
              <span className="text-sm font-normal text-neutral-900">
                Cash on Site
              </span>
            </button>

            <button
              type="button"
              className="flex items-center gap-2.5 cursor-pointer text-left w-fit bg-transparent border-0 outline-none"
              onClick={() => handlePaymentMethodToggle('check')}
            >
              <div
                className={`size-5 rounded-md flex items-center justify-center border transition-colors ${
                  draft.paymentMethods?.check
                    ? 'bg-neutral-900 border-neutral-900 text-white'
                    : 'bg-white border-neutral-200'
                }`}
              >
                {draft.paymentMethods?.check && <Check size={14} strokeWidth={2.5} />}
              </div>
              <span className="text-sm font-normal text-neutral-900">
                Paper Check
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
