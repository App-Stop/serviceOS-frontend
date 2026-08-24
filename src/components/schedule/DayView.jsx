import React from 'react';
import { Plus } from 'lucide-react';
import { ScheduleJobCard } from './ScheduleJobCard';
import { useDayRoster } from '../../data/schedule';
import { initials } from '../../data';

/**
 * Dispatch board for a single day: one column per technician or crew working
 * that day. The assignee is the column heading, so the cards omit it.
 */
export const DayView = ({ date, onAssignJob }) => {
  const roster = useDayRoster(date);

  if (roster.length === 0) {
    return <p className="schedule-empty">Nobody is scheduled on this day yet.</p>;
  }

  return (
    <div className="schedule-day">
      {roster.map((column) => (
        <section className="schedule-day__column" key={column.id}>
          <header className="schedule-day__heading">
            <span
              className={`avatar-initials avatar-initials--sm schedule-day__avatar${
                column.kind === 'crew' ? ' schedule-day__avatar--crew' : ''
              }`}
            >
              {initials(column.name)}
            </span>
            <h3 className="schedule-day__name">{column.name}</h3>
          </header>

          <button
            type="button"
            className="schedule-day__assign"
            onClick={() => onAssignJob(column)}
          >
            <Plus size={20} strokeWidth={2} />
            Assign Job
          </button>

          <hr className="schedule-day__divider" />

          <div className="schedule-day__jobs">
            {column.jobs.map((job) => (
              <ScheduleJobCard job={job} key={job.id} showAssignee={false} draggable />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
