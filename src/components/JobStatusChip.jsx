import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Minus } from 'lucide-react';
import { JOB_STATUSES, JOB_PRIORITIES, statusLabel } from '../data/jobs';
import { priorityIcons } from './jobIcons';
import './JobStatusChip.css';

/** Closes the menu on an outside click or Escape. */
const useDismiss = (ref, onDismiss) => {
  useEffect(() => {
    const onPointerDown = (event) => {
      if (!ref.current?.contains(event.target)) onDismiss();
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onDismiss();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [ref, onDismiss]);
};

/** Status pill that opens a menu to move the job to another status. */
export const JobStatusChip = ({ status, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useDismiss(ref, () => setOpen(false));

  return (
    <div className="status-menu" ref={ref}>
      <button
        type="button"
        className={`status-chip status-chip--${status}`}
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {statusLabel(status)}
        <ChevronDown size={16} strokeWidth={2} />
      </button>

      {open && (
        <ul className="status-menu__list" role="listbox">
          {JOB_STATUSES.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                className="status-menu__option"
                role="option"
                aria-selected={option.id === status}
                onClick={() => {
                  onChange?.(option.id);
                  setOpen(false);
                }}
              >
                <span className={`status-menu__swatch status-chip--${option.id}`} />
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/** Priority badge that opens a menu to change the job's priority. */
export const JobPriorityBadge = ({ priority, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const Icon = priorityIcons[priority] ?? Minus;
  useDismiss(ref, () => setOpen(false));

  return (
    <div className="status-menu status-menu--priority" ref={ref}>
      <button
        type="button"
        className="status-menu__trigger"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change priority"
      >
        <span className={`priority-badge priority-badge--${priority}`}>
          <Icon size={20} strokeWidth={2} />
        </span>
      </button>

      {open && (
        <ul className="status-menu__list status-menu__list--right" role="listbox">
          {JOB_PRIORITIES.map((option) => {
            const OptionIcon = priorityIcons[option.id];
            return (
              <li key={option.id}>
                <button
                  type="button"
                  className="status-menu__option"
                  role="option"
                  aria-selected={option.id === priority}
                  onClick={() => {
                    onChange?.(option.id);
                    setOpen(false);
                  }}
                >
                  <span className={`priority-badge priority-badge--${option.id}`}>
                    <OptionIcon size={16} strokeWidth={2} />
                  </span>
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
