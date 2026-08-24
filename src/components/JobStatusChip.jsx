import React, { useCallback, useRef, useState } from 'react';
import { ChevronDown, Minus } from 'lucide-react';
import { JOB_STATUSES, JOB_PRIORITIES, statusLabel } from '../data/jobs';
import { priorityIcons } from './jobIcons';
import { Popover } from './Popover';
import './JobStatusChip.css';

/** Status pill that opens a menu to move the job to another status. */
export const JobStatusChip = ({ status, onChange }) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const dismiss = useCallback(() => setOpen(false), []);

  return (
    <div className="status-menu" ref={anchorRef}>
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
        <Popover anchorRef={anchorRef} onDismiss={dismiss}>
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
        </Popover>
      )}
    </div>
  );
};

/** Priority badge that opens a menu to change the job's priority. */
export const JobPriorityBadge = ({ priority, onChange }) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const Icon = priorityIcons[priority] ?? Minus;
  const dismiss = useCallback(() => setOpen(false), []);

  return (
    <div className="status-menu status-menu--priority" ref={anchorRef}>
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
        <Popover anchorRef={anchorRef} align="right" onDismiss={dismiss}>
          <ul className="status-menu__list" role="listbox">
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
        </Popover>
      )}
    </div>
  );
};
