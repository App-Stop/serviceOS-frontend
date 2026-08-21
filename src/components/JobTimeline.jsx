import React from 'react';
import { CalendarCheck2, Send, MapPinned, MapPinCheck, Check, NotebookPen, StickyNote } from 'lucide-react';
import { JOB_TIMELINE } from '../data/jobs';

const stepIcons = {
  scheduled: CalendarCheck2,
  dispatched: Send,
  enroute: MapPinned,
  onsite: MapPinCheck,
  completed: Check,
};

/** Index of the job's current status within the lifecycle, -1 when cancelled. */
const currentIndex = (status) => JOB_TIMELINE.findIndex((step) => step.id === status);

/**
 * Lifecycle strip shown on both the expanded jobs row (`variant="row"`) and
 * the job detail screen (`variant="detail"`, which stacks a note button under
 * each step).
 */
export const JobTimeline = ({ job, variant = 'row', onAddNote }) => {
  const activeIndex = currentIndex(job.status);

  return (
    <div className={`timeline timeline--${variant}`}>
      {JOB_TIMELINE.map((step, index) => {
        const Icon = stepIcons[step.id];
        const isCurrent = index === activeIndex;
        const isDone = activeIndex > -1 && index < activeIndex;
        const note = job.notes?.[step.id];

        return (
          <React.Fragment key={step.id}>
            {index > 0 && <span className="timeline__connector" aria-hidden="true" />}

            <div className="timeline__group">
              <div
                className={`timeline__step${isDone ? ' timeline__step--done' : ''}${
                  isCurrent ? ' timeline__step--current' : ''
                }`}
              >
                <span className={`timeline__icon${isDone ? ' timeline__icon--done' : ''}`}>
                  <Icon size={20} strokeWidth={2} />
                </span>
                <span className="timeline__body">
                  <span className="timeline__label">{step.label}</span>
                  <span className="timeline__time">{job.steps?.[step.id] ?? '-'}</span>
                </span>
              </div>

              {variant === 'detail' && (
                <button
                  type="button"
                  className="pill-button timeline__note"
                  onClick={() => onAddNote?.(step.id)}
                >
                  {note ? (
                    <StickyNote size={16} strokeWidth={2} />
                  ) : (
                    <NotebookPen size={16} strokeWidth={2} />
                  )}
                  <span className="pill-button__text timeline__note-text">
                    {note || 'Add Note'}
                  </span>
                </button>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
