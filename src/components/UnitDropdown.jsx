import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const UNIT_OPTIONS = [
  { id: 'Item', label: 'Item' },
  { id: 'Hourly', label: 'Hourly' },
  { id: 'Job', label: 'Job' },
];

export const UnitDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    // Promote parent row's stacking context so dropdown floats over subsequent rows & elements
    const rowEl = ref.current?.closest('.invoice-doc__row');
    if (rowEl) {
      rowEl.style.zIndex = '100';
      rowEl.style.position = 'relative';
    }

    const onPointerDown = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      if (rowEl) {
        rowEl.style.zIndex = '';
      }
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const displayLabel =
    value === 'Hour' || value === 'Hourly'
      ? 'Hourly'
      : value === 'Job'
      ? 'Job'
      : 'Item';

  return (
    <div
      className="relative inline-block"
      style={{ zIndex: open ? 9999 : undefined }}
      ref={ref}
    >
      <button
        type="button"
        className="flex items-center justify-center gap-1 text-sm font-normal text-neutral-900 cursor-pointer bg-transparent border-0 outline-none hover:text-black transition-colors"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{displayLabel}</span>
        <ChevronDown size={14} strokeWidth={2} className="text-neutral-900 shrink-0" />
      </button>

      {open && (
        <div
          className="absolute left-1/2 -translate-x-1/2 top-full mt-2 p-1 rounded-[24px] bg-white shadow-[0_0_40px_rgba(0,0,0,0.16)] flex flex-col w-[200px]"
          style={{ zIndex: 99999 }}
          role="listbox"
          aria-label="Select Unit"
        >
          {UNIT_OPTIONS.map((opt) => {
            const isSelected =
              displayLabel.toLowerCase() === opt.label.toLowerCase();

            return (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`flex items-center justify-between px-[14px] py-[10px] text-sm font-normal text-neutral-900 text-left transition-colors cursor-pointer w-full ${
                  isSelected
                    ? 'bg-neutral-100 rounded-[20px]'
                    : 'hover:bg-neutral-100 rounded-xl'
                }`}
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <Check size={18} strokeWidth={2} className="text-neutral-900 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
