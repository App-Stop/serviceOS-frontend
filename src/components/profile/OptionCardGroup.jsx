import React from 'react';
import { Check } from 'lucide-react';
import { settingsIcons } from './settingsIcons';

/**
 * Large pick-one cards with an icon, title and blurb — the dispatch and
 * operating model selector.
 */
export const OptionCardGroup = ({ options, value, onChange, label }) => (
  <div className="option-cards" role="radiogroup" aria-label={label}>
    {options.map((option) => {
      const Icon = settingsIcons[option.icon];
      const selected = option.id === value;

      return (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={selected}
          className={`option-card${selected ? ' option-card--selected' : ''}`}
          onClick={() => onChange(option.id)}
        >
          <span className="option-card__top">
            <span className="option-card__icon">
              {Icon && <Icon size={24} strokeWidth={2} />}
            </span>
            {selected && (
              <span className="option-card__check">
                <Check size={16} strokeWidth={3} />
              </span>
            )}
          </span>
          <span className="option-card__body">
            <span className="option-card__name">{option.name}</span>
            <span className="option-card__description">{option.description}</span>
          </span>
        </button>
      );
    })}
  </div>
);
