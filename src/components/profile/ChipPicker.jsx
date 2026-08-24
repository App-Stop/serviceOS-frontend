import React from 'react';
import { settingsIcons } from './settingsIcons';

/** Wrapping row of pick-one pills, e.g. the primary industry category. */
export const ChipPicker = ({ options, value, onChange, label }) => (
  <div className="chip-picker" role="radiogroup" aria-label={label}>
    {options.map((option) => {
      const Icon = option.icon ? settingsIcons[option.icon] : null;
      const selected = option.id === value;

      return (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={selected}
          className={`pill-button pill-button--lg${
            selected ? ' pill-button--selected' : ''
          } chip-picker__chip`}
          onClick={() => onChange(option.id)}
        >
          {Icon && <Icon size={20} strokeWidth={2} />}
          <span className="pill-button__text">{option.label}</span>
        </button>
      );
    })}
  </div>
);
