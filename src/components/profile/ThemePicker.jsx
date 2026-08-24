import React from 'react';

/** Row of accent swatches used to tint generated invoice documents. */
export const ThemePicker = ({ themes, value, onChange }) => (
  <div className="theme-picker" role="radiogroup" aria-label="Invoice theme">
    {themes.map((theme) => {
      const selected = theme.id === value;

      return (
        <button
          key={theme.id}
          type="button"
          role="radio"
          aria-checked={selected}
          aria-label={theme.label}
          title={theme.label}
          style={{ backgroundColor: theme.color }}
          className={`theme-picker__swatch${
            selected ? ' theme-picker__swatch--selected' : ''
          }`}
        onClick={() => onChange(theme.id)}
        />
      );
    })}
  </div>
);
