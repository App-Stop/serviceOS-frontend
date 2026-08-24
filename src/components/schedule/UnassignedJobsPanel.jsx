import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { initials } from '../../data';
import glow from '../../assets/button-glow.svg';

/**
 * Slide-over listing every job without an assignee. Each card links through to
 * the job and offers the assign action, which the caller wires to the job form.
 */
export const UnassignedJobsPanel = ({ jobs = [], onAssign, onClose }) => {
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
        aria-label="Unassigned jobs"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="schedule-panel__header">
          <h2 className="schedule-panel__title">Unassigned Jobs</h2>
          <button
            type="button"
            className="schedule-panel__close"
            onClick={onClose}
            aria-label="Close unassigned jobs"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </header>

        <div className="schedule-panel__list">
          {jobs.map((job) => (
            <article className="schedule-panel__card" key={job.id}>
              <div className="schedule-panel__summary">
                <h3 className="schedule-panel__job">{job.title}</h3>

                <Link className="schedule-panel__customer" to={`/customers/${job.customerId}`}>
                  <span className="avatar-initials schedule-panel__avatar">
                    {initials(job.customer)}
                  </span>
                  {job.customer}
                </Link>

                <p className="schedule-panel__when">
                  {job.date} {job.time}
                </p>
              </div>

              <div className="schedule-panel__actions">
                <Link className="schedule-panel__details" to={`/jobs/${job.id}`}>
                  View Details
                </Link>

                <button
                  type="button"
                  className="cta-button cta-button--sm schedule-panel__assign"
                  onClick={() => onAssign(job)}
                >
                  <img className="cta-button__glow" src={glow} alt="" aria-hidden="true" />
                  <Plus size={18} strokeWidth={2} />
                  Assign
                </button>
              </div>
            </article>
          ))}

          {jobs.length === 0 && (
            <p className="schedule-panel__empty">Every job has an assignee.</p>
          )}
        </div>
      </aside>
    </div>
  );
};
