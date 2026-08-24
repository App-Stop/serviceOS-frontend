import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import './FilterDropdown.css';

/**
 * Toolbar filter dropdown: a rounded pill trigger over a floating option
 * list. Options may carry a `dot` colour, as the job status filter does.
 *
 * `options`: [{ id, label, dot? }]
 */
export const FilterDropdown = ({ label, value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

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

  return (
    <div className="filter-dropdown" ref={ref}>
      <button
        type="button"
        className="filter-dropdown__trigger"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected?.label ?? label}
        <ChevronDown className="filter-dropdown__caret" size={16} strokeWidth={2} />
      </button>

      {open && (
        <div className="filter-dropdown__menu" role="listbox" aria-label={label}>
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
