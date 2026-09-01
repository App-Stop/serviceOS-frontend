import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import './FilterDropdown.css';

/**
 * Toolbar filter dropdown: a rounded pill trigger over a floating option
 * list. Options may carry a `dot` colour, as the job status filter does.
 *
 * `options`: [{ id, label, dot? }]
 */
export const FilterDropdown = ({
  label,
  value,
  options,
  onChange,
  fullWidth = false,
  align = 'auto', // 'auto' | 'left' | 'right'
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // A dropdown that goes disabled while open shouldn't keep its menu up.
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const selected = options.find((option) => option.id === value);
  const menuAlignClass =
    align === 'left' ? ' filter-dropdown__menu--left' : ' filter-dropdown__menu--right';

  return (
    <div className={`filter-dropdown${fullWidth ? ' filter-dropdown--full' : ''}`} ref={ref}>
      <button
        type="button"
        className="filter-dropdown__trigger"
        onClick={() => setOpen((isOpen) => !isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="filter-dropdown__label">
          {selected?.dot && (
            <span
              className="filter-dropdown__dot"
              style={{ '--filter-dot-color': selected.dot }}
            />
          )}
          {selected?.label ?? label}
        </span>
        <ChevronDown className="filter-dropdown__caret" size={16} strokeWidth={2} />
      </button>

      {open && !disabled && (
        <div
          className={`filter-dropdown__menu${menuAlignClass}`}
          role="listbox"
          aria-label={label}
        >
          {options.map((option) => {
            const isSelected = option.id === value;
            return (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`filter-dropdown__option${
                  isSelected ? ' filter-dropdown__option--selected' : ''
                }`}
                onClick={() => {
                  onChange(option.id);
                  setOpen(false);
                }}
              >
                <span className="filter-dropdown__label">
                  {option.dot && (
                    <span
                      className="filter-dropdown__dot"
                      style={{ '--filter-dot-color': option.dot }}
                    />
                  )}
                  {option.label}
                </span>
                {isSelected && (
                  <Check className="filter-dropdown__check" size={20} strokeWidth={2} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
