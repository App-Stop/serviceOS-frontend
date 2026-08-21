import React from 'react';
import { Zap, Plus, UserRoundPlus, ReceiptText, Send } from 'lucide-react';
import glow from '../assets/quick-action-glow.svg';

const actions = [
  { label: 'New Job', icon: Plus },
  { label: 'New Customer', icon: UserRoundPlus },
  { label: 'Create Invoice', icon: ReceiptText },
  { label: 'Compose Message', icon: Send },
];

export const QuickAction = () => {
  return (
    <div className="quick-action">
      <img className="quick-action__glow" src={glow} alt="" aria-hidden="true" />
      <div className="quick-action__header">
        <Zap size={20} strokeWidth={2} />
        <span className="quick-action__title">Quick Action</span>
      </div>
      <div className="quick-action__list">
        {actions.map(({ label, icon: Icon }) => (
          <button key={label} type="button" className="quick-action__button">
            <Icon size={20} strokeWidth={2} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
