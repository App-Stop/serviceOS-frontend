import React from 'react';
import { Check } from 'lucide-react';
import { ToggleSwitch } from './ToggleSwitch';
import { useSettingsDraft } from '../../data';
import glow from '../../assets/button-glow.svg';

const CUSTOMER_COMMUNICATION_TOGGLES = [
  {
    key: 'appointmentConfirmation',
    title: 'Appointment Confirmation',
    subtitle: 'Sent when a job is booked',
  },
  {
    key: 'reminder24h',
    title: '24-Hour Reminder',
    subtitle: 'Sent 24 hours before appointment',
  },
  {
    key: 'reminder1h',
    title: '1-Hour Reminder',
    subtitle: 'Sent 1 hour before appointment',
  },
  {
    key: 'techEnRoute',
    title: 'Technician En Route',
    subtitle: 'Sent when tech starts driving',
  },
  {
    key: 'jobCompleted',
    title: 'Job Completed',
    subtitle: 'Sent when job is marked complete',
  },
  {
    key: 'feedbackRequest',
    title: 'Feedback Request',
    subtitle: 'Sent after job completion delay',
  },
];

const USER_ALERT_ROWS = [
  { key: 'jobAlerts', label: 'Job Alerts' },
  { key: 'newCustomer', label: 'New Customer' },
  { key: 'newInvoice', label: 'New Invoice' },
  { key: 'teamUpdates', label: 'Team Updates' },
];

export const NotificationsPanel = () => {
  const { draft, setField, save, reset, dirty } = useSettingsDraft('notifications');

  const handleToggleChange = (key, value) => {
    setField(key, value);
  };

  const handleUserAlertToggle = (rowKey, channelKey) => {
    const currentRows = draft.userAlerts || {};
    const currentRow = currentRows[rowKey] || { push: true, email: true };
    const updatedRow = {
      ...currentRow,
      [channelKey]: !currentRow[channelKey],
    };

    setField('userAlerts', {
      ...currentRows,
      [rowKey]: updatedRow,
    });
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex items-center justify-between w-full">
        <div className="flex flex-col gap-1 items-start">
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            Notifications
          </h1>
          <p className="text-sm font-normal text-black-200">
            Configure automated customer SMS, emails, and dispatch alerts
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
            Automated Customer Communications
          </h2>
          <p className="text-xs font-normal text-black-200">
            Enable or disable automated notifications sent throughout the job lifecycle
          </p>
        </div>

        <div className="flex flex-col gap-5 w-full">
          {CUSTOMER_COMMUNICATION_TOGGLES.map(({ key, title, subtitle }) => (
            <div key={key} className="flex items-center justify-between w-full">
              <div className="flex flex-col gap-0.5 items-start">
                <span className="text-sm font-medium text-neutral-900">
                  {title}
                </span>
                <span className="text-xs font-normal text-black-200">
                  {subtitle}
                </span>
              </div>
              <ToggleSwitch
                checked={Boolean(draft[key])}
                onChange={(val) => handleToggleChange(key, val)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-[30px] p-6 flex flex-col gap-6 w-full">
        <div className="flex flex-col gap-1 items-start w-full">
          <h2 className="text-base font-medium text-neutral-900">
            Notifications for you
          </h2>
          <p className="text-xs font-normal text-black-200">
            Receive job, customer or invoice alerts via email or in app.
          </p>
        </div>

        <div className="flex items-end justify-between w-full">
          <div className="flex flex-col gap-4 flex-1 min-w-0">
            {USER_ALERT_ROWS.map((row) => (
              <div key={row.key} className="h-6 flex items-center">
                <span className="text-sm font-medium text-neutral-900 truncate">
                  {row.label}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-[40px] items-start shrink-0">
            <div className="flex flex-col gap-4 items-center w-24">
              <span className="text-sm font-medium text-neutral-900 whitespace-nowrap">
                In-App Push
              </span>
              {USER_ALERT_ROWS.map((row) => {
                const isChecked = draft.userAlerts?.[row.key]?.push ?? true;
                return (
                  <button
                    key={row.key}
                    type="button"
                    className={`size-5 rounded-md flex items-center justify-center border transition-colors ${
                      isChecked
                        ? 'bg-neutral-900 border-neutral-900 text-white'
                        : 'bg-white border-neutral-200'
                    }`}
                    onClick={() => handleUserAlertToggle(row.key, 'push')}
                    aria-label={`In-App Push for ${row.label}`}
                  >
                    {isChecked && <Check size={14} strokeWidth={2.5} />}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-4 items-center w-20">
              <span className="text-sm font-medium text-neutral-900 whitespace-nowrap">
                Email
              </span>
              {USER_ALERT_ROWS.map((row) => {
                const isChecked = draft.userAlerts?.[row.key]?.email ?? true;
                return (
                  <button
                    key={row.key}
                    type="button"
                    className={`size-5 rounded-md flex items-center justify-center border transition-colors ${
                      isChecked
                        ? 'bg-neutral-900 border-neutral-900 text-white'
                        : 'bg-white border-neutral-200'
                    }`}
                    onClick={() => handleUserAlertToggle(row.key, 'email')}
                    aria-label={`Email alert for ${row.label}`}
                  >
                    {isChecked && <Check size={14} strokeWidth={2.5} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
