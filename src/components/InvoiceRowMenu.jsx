import React, { useCallback, useRef, useState } from 'react';
import { CircleCheck, Ellipsis, Download, Pencil, Trash2 } from 'lucide-react';
import { Popover } from './Popover';
import './InvoiceRowMenu.css';

/**
 * The "…" row menu on the invoices table.
 *
 * Which options appear is dictated by what the API will actually accept:
 * only a `draft` may be edited or voided (anything else answers 409), and an
 * invoice that is already paid can't be paid again. `apiStatus` is the stored
 * status rather than the displayed one, since "overdue" is derived on the
 * client and is really a `sent` invoice as far as the server is concerned.
 */
export const InvoiceRowMenu = ({ invoice, onEdit, onMarkPaid, onDownload, onVoid }) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const dismiss = useCallback(() => setOpen(false), []);

  const isDraft = invoice.apiStatus === 'draft';

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
            {isDraft && (
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

            {/* Records the invoice as settled. No payment is taken — there is
                no payment processing behind this yet. */}
            {invoice.apiStatus !== 'paid' && invoice.apiStatus !== 'void' && (
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
              onClick={() => run(onDownload)}
            >
              <Download size={20} strokeWidth={2} />
              Download PDF
            </button>

            {/* The API's delete is a soft void and draft-only, so an issued
                invoice offers no way off the list. */}
            {isDraft && (
              <button
                type="button"
                role="menuitem"
                className="row-menu__option row-menu__option--danger"
                onClick={() => run(onVoid)}
              >
                <Trash2 size={20} strokeWidth={2} />
                Void invoice
              </button>
            )}
          </div>
        </Popover>
      )}
    </div>
  );
};
