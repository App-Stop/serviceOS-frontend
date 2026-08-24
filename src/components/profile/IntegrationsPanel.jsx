import React from 'react';
import { Check } from 'lucide-react';
import { useSettingsDraft } from '../../data';
import glow from '../../assets/button-glow.svg';
import stripeLogo from '../../assets/stripe logo.png';
import twilioLogo from '../../assets/twilio-logo.png';
import googleCalendarLogo from '../../assets/google calendar logo.png';
import paypalLogo from '../../assets/paypal logo.png';
import quickbooksLogo from '../../assets/quickbooks logo.png';

const INTEGRATIONS_LIST = [
  {
    key: 'stripe',
    name: 'Stripe',
    description: 'Accept credit card and ACH payments via online invoices',
    logo: stripeLogo,
  },
  {
    key: 'twilio',
    name: 'Twilio SMS',
    description: 'Send dispatch alerts and appointment reminders',
    logo: twilioLogo,
  },
  {
    key: 'googleCalendar',
    name: 'Google Calendar',
    description: 'Two-way sync for technician schedules and availability',
    logo: googleCalendarLogo,
  },
  {
    key: 'paypal',
    name: 'Paypal',
    description: 'Let clients pay with PayPal quickly and securely',
    logo: paypalLogo,
  },
  {
    key: 'quickbooks',
    name: 'QuickBooks',
    description: 'Sync customers, invoices, and payments automatically',
    logo: quickbooksLogo,
  },
];

export const IntegrationsPanel = () => {
  const { draft, setField, save, reset, dirty } = useSettingsDraft('integrations');

  const toggleIntegration = (key) => {
    setField(key, !draft[key]);
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex items-center justify-between w-full">
        <div className="flex flex-col gap-1 items-start">
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            Integrations
          </h1>
          <p className="text-sm font-normal text-black-200">
            Connect your favorite field service tools, payments, accounting, and messaging services
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
            Available Integrations
          </h2>
          <p className="text-xs font-normal text-black-200">
            Expand your workspace capabilities with native third-party connections
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {INTEGRATIONS_LIST.map((item) => {
            const isConnected = Boolean(draft[item.key]);

            return (
              <div
                key={item.key}
                className="bg-white border border-neutral-200 rounded-[20px] p-4 flex flex-col justify-between gap-5 transition-all hover:border-neutral-300"
              >
                <div className="flex flex-col gap-3.5 items-start">
                  <div className="size-10 flex items-center justify-start shrink-0">
                    <img
                      src={item.logo}
                      alt={item.name}
                      className="size-10 object-contain shrink-0"
                    />
                  </div>

                  <div className="flex flex-col gap-1 items-start">
                    <h3 className="text-base font-semibold text-neutral-900">
                      {item.name}
                    </h3>
                    <p className="text-xs font-normal text-black-200 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end w-full">
                  <button
                    type="button"
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border ${
                      isConnected
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-neutral-100 text-neutral-900 border-transparent hover:bg-neutral-200'
                    }`}
                    onClick={() => toggleIntegration(item.key)}
                  >
                    {isConnected ? (
                      <span className="flex items-center gap-1">
                        <Check size={12} strokeWidth={2.5} /> Connected
                      </span>
                    ) : (
                      'Connect'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
