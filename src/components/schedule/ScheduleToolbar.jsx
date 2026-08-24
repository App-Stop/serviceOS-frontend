import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { SCHEDULE_VIEWS } from '../../data/schedule';

/**
 * View switch, period stepper and title. The right-hand slot is filled by the
 * caller so each view can put its own action there.
 */
export const ScheduleToolbar = ({
  view,
  onViewChange,
  title,
  onPrevious,
  onNext,
  onToday,
  children,
}) => (
  <div className="schedule-toolbar">
    <div className="schedule-toolbar__main">
      <div className="schedule-toolbar__views">
        {SCHEDULE_VIEWS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`schedule-toolbar__view${
              view === option.id ? ' schedule-toolbar__view--selected' : ''
            }`}
            onClick={() => onViewChange(option.id)}
            aria-pressed={view === option.id}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="schedule-toolbar__stepper">
        <button
          type="button"
          className="schedule-toolbar__step"
          onClick={onPrevious}
          aria-label="Previous period"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>

        <button type="button" className="schedule-toolbar__today" onClick={onToday}>
          Today
        </button>

        <button
          type="button"
          className="schedule-toolbar__step"
          onClick={onNext}
          aria-label="Next period"
        >
          <ArrowRight size={20} strokeWidth={2} />
        </button>
      </div>

      <h2 className="schedule-toolbar__title">{title}</h2>
    </div>

    {children}
  </div>
);
