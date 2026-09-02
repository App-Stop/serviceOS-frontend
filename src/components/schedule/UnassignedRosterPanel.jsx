import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { crewColor, initials } from '../../data';
import glow from '../../assets/button-glow.svg';

/**
 * The day view's counterpart to the unassigned jobs panel: everyone with
 * nothing booked on the open day. The board only carries columns for people
 * already working, so this is where a job gets handed to someone free.
 */
export const UnassignedRosterPanel = ({ roster = [], onAssign, onClose }) => {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="schedule-panel__overlay" role="presentation" onClick={onClose}>
      <aside
        className="schedule-panel"
        role="dialog"
        aria-label="Unassigned roster"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="schedule-panel__header">
          <h2 className="schedule-panel__title">Unassigned Roster</h2>
          <button
            type="button"
            className="schedule-panel__close"
            onClick={onClose}
            aria-label="Close unassigned roster"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </header>

        <div className="schedule-panel__list">
          {roster.map((column) => (
            <article className="schedule-panel__card" key={column.key}>
              <div className="schedule-panel__summary">
                <h3 className="schedule-panel__job">
                  <span
                    className="avatar-initials schedule-panel__avatar"
                    /* Crews carry a colour *name* ("pink"), not a hex value. */
                    style={
                      column.crewColor
                        ? { background: crewColor(column.crewColor) }
                        : undefined
                    }
                  >
                    {initials(column.name)}
                  </span>
                  {column.name}
                </h3>

                <p className="schedule-panel__when">{column.role}</p>
              </div>

              <div className="schedule-panel__actions">
                {column.kind === 'member' && (
                  <Link className="schedule-panel__details" to={`/team/${column.assigneeId}`}>
                    View Details
                  </Link>
                )}

                <button
                  type="button"
                  className="cta-button cta-button--sm schedule-panel__assign"
                  onClick={() => onAssign(column)}
                >
                  <img className="cta-button__glow" src={glow} alt="" aria-hidden="true" />
                  <Plus size={18} strokeWidth={2} />
                  Assign
                </button>
              </div>
            </article>
          ))}

          {roster.length === 0 && (
            <p className="schedule-panel__empty">Everyone has work on this day.</p>
          )}
        </div>
      </aside>
    </div>
  );
};
