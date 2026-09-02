import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Popover } from './Popover';
import './FilterDropdown.css';

/**
 * Toolbar filter dropdown: a rounded pill trigger over a floating option
 * list. Options may carry a `dot` colour, as the job status filter does.
 *
 * The menu is portalled into `document.body` via `Popover` rather than
 * absolutely positioned inside the trigger. Anchoring it locally meant every
 * new placement had to out-stack whatever came after it in the document — on
 * the invoice paper, whose blocks carry their own `z-index`, the menu ended
 * up painted under the notes field. Portalling sidesteps stacking contexts
 * and clipping ancestors entirely.
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
  const [triggerWidth, setTriggerWidth] = useState(null);
  const ref = useRef(null);

  // A dropdown that goes disabled while open shouldn't keep its menu up.
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  // A full-width menu matches its trigger; the portal has no parent to
  // inherit a width from, so it is measured when the menu opens.
  useLayoutEffect(() => {
    if (open) setTriggerWidth(ref.current?.offsetWidth ?? null);
  }, [open]);

  const selected = options.find((option) => option.id === value);

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

      {/* Popover owns dismissal — outside click and Escape — and keeps the
          panel pinned to the trigger through scrolls and resizes. */}
      {open && !disabled && (
        <Popover
          anchorRef={ref}
          align={align === 'left' ? 'left' : 'right'}
          onDismiss={() => setOpen(false)}
        >
          <div
            className={`filter-dropdown__menu${fullWidth ? ' filter-dropdown__menu--full' : ''}`}
            style={fullWidth && triggerWidth ? { width: `${triggerWidth}px` } : undefined}
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
        </Popover>
      )}
    </div>
  );
};
