import React, { useCallback, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Popover } from '../Popover';
import './LineTypeDropdown.css';

/**
 * The line item's `type`, as the API's `lineItemSchema` enumerates it.
 *
 * This is the old "Unit" control, repointed at the one per-line field the
 * backend actually stores. `service` is billable work, `tool` is equipment or
 * materials — the same split the API uses when it generates line items from a
 * job's labour cost and its recorded tool costs.
 *
 * Compact by design: it lives inside a table cell, so the trigger is plain
 * text with a caret. The menu is portalled through `Popover` so it floats
 * over the rows below instead of being stacked under them — the invoice
 * paper's blocks carry their own `z-index`, which a locally positioned menu
 * would lose to.
 */
const TYPE_OPTIONS = [
  { id: 'service', label: 'Service' },
  { id: 'tool', label: 'Tool' },
];

export const lineTypeLabel = (id) =>
  TYPE_OPTIONS.find((option) => option.id === id)?.label ?? 'Service';

export const LineTypeDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const dismiss = useCallback(() => setOpen(false), []);

  // Anything unrecognised reads as "service", which is what the API defaults
  // an unspecified type to.
  const selected = value === 'tool' ? 'tool' : 'service';

  return (
    <div className="line-type" ref={anchorRef}>
      <button
        type="button"
        className="line-type__trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Line item type"
      >
        <span>{lineTypeLabel(selected)}</span>
        <ChevronDown size={14} strokeWidth={2} className="line-type__caret" />
      </button>

      {open && (
        <Popover anchorRef={anchorRef} align="left" onDismiss={dismiss}>
          <div className="line-type__menu" role="listbox" aria-label="Select line item type">
            {TYPE_OPTIONS.map((option) => {
              const isSelected = option.id === selected;

              return (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`line-type__option${
                    isSelected ? ' line-type__option--selected' : ''
                  }`}
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                >
                  <span>{option.label}</span>
                  {isSelected && (
                    <Check size={18} strokeWidth={2} className="line-type__check" />
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
