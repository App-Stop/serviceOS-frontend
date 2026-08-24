import React from 'react';
import { Zap, Plus, UserRoundPlus, ReceiptText, Send } from 'lucide-react';
import glow from '../assets/quick-action-glow.svg';

const actions = [
  { id: 'job', label: 'New Job', icon: Plus },
  { id: 'customer', label: 'New Customer', icon: UserRoundPlus },
  { id: 'invoice', label: 'Create Invoice', icon: ReceiptText },
  { id: 'message', label: 'Compose Message', icon: Send },
];

export const QuickAction = ({ onAction }) => {
  return (
    <div className="quick-action">
      <img className="quick-action__glow" src={glow} alt="" aria-hidden="true" />
      <div className="quick-action__header">
        <Zap size={20} strokeWidth={2} />
        <span className="quick-action__title">Quick Action</span>
      </div>
      <div className="quick-action__list">
        {actions.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className="quick-action__button"
            onClick={() => onAction && onAction(id)}
          >
            <Icon size={20} strokeWidth={2} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
