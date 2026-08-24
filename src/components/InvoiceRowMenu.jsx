import React, { useCallback, useRef, useState } from 'react';
import { CircleCheck, Ellipsis, Pencil, Printer, Trash2 } from 'lucide-react';
import { Popover } from './Popover';
import './InvoiceRowMenu.css';

/**
 * The "…" row menu on the invoices table. Mark as paid is hidden once the
 * invoice is already settled, so the menu never offers a no-op.
 */
export const InvoiceRowMenu = ({ invoice, onEdit, onMarkPaid, onPrint, onDelete }) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const dismiss = useCallback(() => setOpen(false), []);

  const run = (action) => {
    action?.(invoice);
    setOpen(false);
  };

  return (
    <div className="row-menu" ref={anchorRef}>
      <button
        type="button"
        className="row-menu__trigger"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${invoice.number}`}
      >
        <Ellipsis size={20} strokeWidth={2} />
      </button>

      {open && (
        <Popover anchorRef={anchorRef} align="right" onDismiss={dismiss}>
          <div className="row-menu__list" role="menu">
            {invoice.status === 'draft' && (
              <button
                type="button"
                role="menuitem"
                className="row-menu__option"
                onClick={() => run(onEdit)}
              >
                <Pencil size={20} strokeWidth={2} />
                Edit invoice
              </button>
            )}
            {invoice.status !== 'paid' && (
              <button
                type="button"
                role="menuitem"
                className="row-menu__option"
                onClick={() => run(onMarkPaid)}
              >
                <CircleCheck size={20} strokeWidth={2} />
                Mark as paid
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              className="row-menu__option"
              onClick={() => run(onPrint)}
            >
              <Printer size={20} strokeWidth={2} />
              Print Receipt
            </button>
            <button
              type="button"
              role="menuitem"
              className="row-menu__option row-menu__option--danger"
              onClick={() => run(onDelete)}
            >
              <Trash2 size={20} strokeWidth={2} />
              Delete
            </button>
          </div>
        </Popover>
      )}
    </div>
  );
};
