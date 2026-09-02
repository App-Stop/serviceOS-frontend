import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useTeamMembers, useCrews, crewColor, initials } from '../data';
import './AssigneeDropdown.css';

/**
 * "Assigned To" picker: a solo/crew switch over the team roster.
 *
 * `onChange` gets the plain name, which is all the demo store keeps. The API
 * assigns by id and needs to know whether it is a technician or a crew, so
 * `onSelectAssignee` reports `{ type, id, name }` alongside it.
 */
export const AssigneeDropdown = ({
  value,
  onChange,
  onSelectAssignee,
  placeholder = 'Select technician',
}) => {
  const members = useTeamMembers();
  const crews = useCrews();

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const isCrew = useMemo(
    () => crews.some((crew) => crew.name === value),
    [crews, value],
  );

  const [tab, setTab] = useState(isCrew ? 'crew' : 'solo');

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

  /* Reopening on a crew assignment should land on the crew tab. */
  const openMenu = () => {
    setTab(isCrew ? 'crew' : 'solo');
    setOpen((wasOpen) => !wasOpen);
  };

  const select = (name, assignee = null) => {
    onChange(name);
    onSelectAssignee?.(assignee);
    setOpen(false);
  };

  return (
    <div className="assignee" ref={ref}>
      <button
        type="button"
        className="assignee__trigger"
        onClick={openMenu}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`assignee__value${value ? '' : ' assignee__value--empty'}`}>
          {value || placeholder}
        </span>
        <ChevronDown className="assignee__caret" size={16} strokeWidth={2} />
      </button>

      {open && (
        <div className="assignee__menu">
          <div className="assignee__tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'solo'}
              className={`assignee__tab${tab === 'solo' ? ' assignee__tab--selected' : ''}`}
              onClick={() => setTab('solo')}
            >
              Solo
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'crew'}
              className={`assignee__tab${tab === 'crew' ? ' assignee__tab--selected' : ''}`}
              onClick={() => setTab('crew')}
            >
              Crew
            </button>
          </div>

          <ul className="assignee__options" role="listbox">
            {tab === 'solo' &&
              members.map((member) => (
                <li key={member.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={member.name === value}
                    className={`assignee__option${
                      member.name === value ? ' assignee__option--selected' : ''
                    }`}
                    onClick={() =>
                      select(member.name, {
                        type: 'technician',
                        id: member.id,
                        name: member.name,
                      })
                    }
                  >
                    <span className="assignee__label">
                      <span className="avatar-initials assignee__avatar">
                        {initials(member.name)}
                      </span>
                      {member.name}
                    </span>
                    {member.name === value && (
                      <Check className="assignee__check" size={20} strokeWidth={2} />
                    )}
                  </button>
                </li>
              ))}

            {tab === 'crew' &&
              crews.map((crew) => (
                <li key={crew.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={crew.name === value}
                    className={`assignee__option${
                      crew.name === value ? ' assignee__option--selected' : ''
                    }`}
                    onClick={() =>
                      select(crew.name, { type: 'crew', id: crew.id, name: crew.name })
                    }
                  >
                    <span className="assignee__label">
                      <span
                        className="assignee__dot"
                        style={{ background: crewColor(crew.color) }}
                      />
                      {crew.name}
                    </span>
                    {crew.name === value && (
                      <Check className="assignee__check" size={20} strokeWidth={2} />
                    )}
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
};
