import React from 'react';
import { Plus } from 'lucide-react';
import { ScheduleJobCard } from './ScheduleJobCard';
import { crewColor, initials } from '../../data';

/**
 * Dispatch board for a single day: one column per technician or crew carrying
 * work. The assignee is the column heading, so the cards omit it. Whoever is
 * free that day is listed in the Unassigned Roster panel instead.
 */
export const DayView = ({ roster = [], onAssignJob }) => {
  if (roster.length === 0) {
    return (
      <p className="schedule-empty">
        Nobody is working on this day yet — open the Unassigned Roster to hand
        someone a job.
      </p>
    );
  }

  return (
    <div className="schedule-day">
      {roster.map((column) => (
        <section className="schedule-day__column" key={column.key}>
          <header className="schedule-day__heading">
            <span
              className={`avatar-initials avatar-initials--sm schedule-day__avatar${
                column.kind === 'crew' ? ' schedule-day__avatar--crew' : ''
              }`}
              /* Crews carry a colour *name* ("pink"), not a hex value. */
              style={
                column.crewColor ? { background: crewColor(column.crewColor) } : undefined
              }
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
              <ScheduleJobCard
                job={job}
                key={job.assignmentId ?? job.id}
                showAssignee={false}
                draggable
              />
            ))}

            {column.jobs.length === 0 && <p className="schedule-week__empty">No jobs</p>}
          </div>
        </section>
      ))}
    </div>
  );
};
