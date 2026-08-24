import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Label + control + optional hint, matching the "Input with label" component
 * in the Figma. Renders a text input, a native select styled as the design's
 * chevron dropdown, or a textarea.
 */
export const SettingsField = ({
  label,
  hint,
  type = 'text',
  value,
  onChange,
  options,
  placeholder,
  rows = 3,
  readOnly = false,
}) => {
  const id = useId();
  const isSelect = type === 'select';
  const isTextarea = type === 'textarea';

  return (
    <div className="settings-field">
      <label className="settings-field__label" htmlFor={id}>
        {label}
      </label>

      {isSelect ? (
        <div className="settings-field__select-wrap">
          <select
            id={id}
            className="settings-field__control settings-field__control--select"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <ChevronDown className="settings-field__chevron" size={16} strokeWidth={2} />
        </div>
      ) : isTextarea ? (
        <textarea
          id={id}
          className="settings-field__control settings-field__control--textarea"
          value={value}
          rows={rows}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          id={id}
          type={type}
          className="settings-field__control"
          value={value}
          placeholder={placeholder}
          readOnly={readOnly}
          onChange={(event) => onChange(event.target.value)}
        />
      )}

      {hint && <p className="settings-field__hint">{hint}</p>}
    </div>
  );
};

/** Side-by-side field pair; collapses to one column on small screens. */
export const SettingsFieldRow = ({ children }) => (
  <div className="settings-field-row">{children}</div>
);
