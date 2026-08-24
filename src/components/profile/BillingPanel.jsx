import React, { useState } from 'react';
import { Clock, Zap, Users, Building, Check, FileDown } from 'lucide-react';
import glow from '../../assets/button-glow.svg';

export const BillingPanel = () => {
  const [billingCycle, setBillingCycle] = useState('yearly'); // 'monthly' | 'yearly'

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex flex-col gap-1 items-start w-full">
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
          Billing & Subscription
        </h1>
        <p className="text-sm font-normal text-black-200">
          Manage your subscription, invoices, and payment method
        </p>
      </div>

      {/* Card 1: Current Plan */}
      <div className="bg-white border border-neutral-200 rounded-[30px] p-6 flex flex-col gap-6 w-full">
        <div className="flex items-start justify-between w-full">
          <div className="flex flex-col gap-1 items-start">
            <h2 className="text-base font-medium text-neutral-900">
              Current Plan
            </h2>
            <p className="text-xs font-normal text-black-200">
              Your active workspace subscription details
            </p>
          </div>
          <span className="text-base font-medium text-neutral-900">
            Free
          </span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-[30px] p-3 flex items-center justify-between w-full">
          <div className="flex items-center gap-3.5">
            <div className="size-9 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-900 shrink-0">
              <Clock size={18} strokeWidth={2} />
            </div>
            <div className="flex flex-col gap-0.5 items-start">
              <span className="text-sm font-medium text-neutral-900">
                12 days
              </span>
              <span className="text-xs font-normal text-black-200">
                Trial days remaining
              </span>
            </div>
          </div>

          <button type="button" className="cta-button">
            <img className="cta-button__glow" src={glow} alt="" aria-hidden="true" />
            <Zap size={16} strokeWidth={2.5} className="shrink-0" />
            <span className="cta-button__label">Upgrade to PRO</span>
          </button>
        </div>
      </div>

      {/* Card 2: Plans */}
      <div className="bg-white border border-neutral-200 rounded-[30px] p-6 flex flex-col gap-6 w-full">
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col gap-1 items-start">
            <h2 className="text-base font-medium text-neutral-900">
              Plans
            </h2>
            <p className="text-xs font-normal text-black-200">
              Upgrade or downgrade your workspace plan anytime.
            </p>
          </div>

          <div className="bg-neutral-100 border border-neutral-200 p-1 rounded-full flex items-center gap-1">
            <button
              type="button"
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-black-200 hover:text-neutral-900'
              }`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-black-200 hover:text-neutral-900'
              }`}
              onClick={() => setBillingCycle('yearly')}
            >
              <span>Yearly</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600 text-[10px] font-semibold">
                50% OFF
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {/* Small Business */}
          <div className="relative bg-white border-2 border-neutral-900 rounded-[30px] pt-6 pb-4 px-4 flex flex-col gap-5 justify-between">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg uppercase tracking-wider">
              RECOMMENDED
            </div>

            <div className="flex flex-col gap-4 items-start w-full">
              <div className="size-9 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-900 shrink-0">
                <Users size={18} strokeWidth={2} />
              </div>

              <div className="flex flex-col gap-1 items-start">
                <h3 className="text-base font-semibold text-neutral-900">
                  Small Business
                </h3>
                <p className="text-xs font-normal text-black-200">
                  For growing service businesses & multi-tech crews
                </p>
              </div>

              <div className="flex flex-col gap-1 items-start">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-semibold text-neutral-900">
                    {billingCycle === 'yearly' ? '$80' : '$160'}
                  </span>
                  {billingCycle === 'yearly' && (
                    <>
                      <span className="text-xs text-black-200 line-through">
                        $160
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600 text-xs font-normal">
                        50% OFF
                      </span>
                    </>
                  )}
                </div>
                <span className="text-xs font-normal text-black-200">/month</span>
                <span className="text-xs font-normal text-neutral-900">
                  {billingCycle === 'yearly' ? 'Billed $828/yr' : 'Billed monthly'}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 items-start w-full pt-1">
                <div className="flex items-center gap-2.5">
                  <Check size={16} className="text-neutral-900 shrink-0" />
                  <span className="text-xs font-normal text-neutral-900">
                    Up to 5 Technicians included
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={16} className="text-neutral-900 shrink-0" />
                  <span className="text-xs font-normal text-neutral-900">
                    Crew management & leads
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={16} className="text-neutral-900 shrink-0" />
                  <span className="text-xs font-normal text-neutral-900">
                    Automated SMS & Email alerts
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={16} className="text-neutral-900 shrink-0" />
                  <span className="text-xs font-normal text-neutral-900">
                    Drag-and-drop calendar dispatch
                  </span>
                </div>
              </div>
            </div>

            <button type="button" className="cta-button w-full">
              <img className="cta-button__glow" src={glow} alt="" aria-hidden="true" />
              <span className="cta-button__label">
                Choose Plan {billingCycle === 'yearly' ? '- 50% OFF' : ''}
              </span>
            </button>
          </div>

          {/* Enterprise */}
          <div className="bg-white border border-neutral-200 rounded-[30px] pt-6 pb-4 px-4 flex flex-col gap-5 justify-between">
            <div className="flex flex-col gap-4 items-start w-full">
              <div className="size-9 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-900 shrink-0">
                <Building size={18} strokeWidth={2} />
              </div>

              <div className="flex flex-col gap-1 items-start">
                <h3 className="text-base font-semibold text-neutral-900">
                  Enterprise
                </h3>
                <p className="text-xs font-normal text-black-200">
                  For established operations needing maximum capacity
                </p>
              </div>

              <div className="flex flex-col gap-1 items-start">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-semibold text-neutral-900">
                    {billingCycle === 'yearly' ? '$199' : '$399'}
                  </span>
                  {billingCycle === 'yearly' && (
                    <>
                      <span className="text-xs text-black-200 line-through">
                        $399
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600 text-xs font-normal">
                        50% OFF
                      </span>
                    </>
                  )}
                </div>
                <span className="text-xs font-normal text-black-200">/month</span>
                <span className="text-xs font-normal text-neutral-900">
                  {billingCycle === 'yearly' ? 'Billed $1788/yr' : 'Billed monthly'}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 items-start w-full pt-1">
                <div className="flex items-center gap-2.5">
                  <Check size={16} className="text-neutral-900 shrink-0" />
                  <span className="text-xs font-normal text-neutral-900">
                    Up to 5 Technicians included
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={16} className="text-neutral-900 shrink-0" />
                  <span className="text-xs font-normal text-neutral-900">
                    Crew management & leads
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={16} className="text-neutral-900 shrink-0" />
                  <span className="text-xs font-normal text-neutral-900">
                    Automated SMS & Email alerts
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check size={16} className="text-neutral-900 shrink-0" />
                  <span className="text-xs font-normal text-neutral-900">
                    Drag-and-drop calendar dispatch
                  </span>
                </div>
              </div>
            </div>

            <button type="button" className="ghost-button w-full">
              Choose Plan {billingCycle === 'yearly' ? '- 50% OFF' : ''}
            </button>
          </div>
        </div>
      </div>

      {/* Card 3: Billing history */}
      <div className="bg-white border border-neutral-200 rounded-[30px] p-6 flex flex-col gap-6 w-full">
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col gap-1 items-start">
            <h2 className="text-base font-medium text-neutral-900">
              Billing history
            </h2>
            <p className="text-xs font-normal text-black-200">
              Your active workspace subscription details
            </p>
          </div>

          <button type="button" className="ghost-button">
            <FileDown size={18} strokeWidth={2} />
            Export to PDF
          </button>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 text-xs font-medium text-black-200">
                <th className="py-3 px-4 font-medium">Due</th>
                <th className="py-3 px-4 font-medium">Plan</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-neutral-200 hover:bg-neutral-50 transition-colors">
                <td className="py-4 px-4 font-medium text-neutral-900">
                  Aug 12, 2026
                </td>
                <td className="py-4 px-4 font-medium text-neutral-900">
                  Small Business
                </td>
                <td className="py-4 px-4">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium inline-block">
                    Paid
                  </span>
                </td>
                <td className="py-4 px-4 font-medium text-neutral-900">
                  $5,021
                </td>
              </tr>
              <tr className="border-b border-neutral-200 hover:bg-neutral-50 transition-colors">
                <td className="py-4 px-4 font-medium text-neutral-900">
                  Aug 12, 2026
                </td>
                <td className="py-4 px-4 font-medium text-neutral-900">
                  Small Business
                </td>
                <td className="py-4 px-4">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium inline-block">
                    Paid
                  </span>
                </td>
                <td className="py-4 px-4 font-medium text-neutral-900">
                  $8,345
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
