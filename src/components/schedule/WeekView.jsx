import React from 'react';
import { Plus } from 'lucide-react';
import { ScheduleJobCard } from './ScheduleJobCard';
import {
  formatColumnHeading,
  formatShortDate,
  isSameDay,
  useWeekColumns,
} from '../../data/schedule';

/** Day-by-day board for one Monday-to-Sunday week. */
export const WeekView = ({ weekStart, today, onCreateJob }) => {
  const columns = useWeekColumns(weekStart);

  return (
    <div className="schedule-week">
      {columns.map((column) => (
        <section
          className={`schedule-week__column${
            isSameDay(column.date, today) ? ' schedule-week__column--today' : ''
          }`}
          key={column.iso}
        >
          <header className="schedule-week__heading">
            <h3 className="schedule-week__weekday">
              {formatColumnHeading(column.date, today)}
            </h3>
            <p className="schedule-week__date">{formatShortDate(column.date)}</p>
          </header>

          <button
            type="button"
            className="schedule-week__create"
            onClick={() => onCreateJob(column.date)}
          >
            <Plus size={20} strokeWidth={2} />
            Create Job
          </button>

          <hr className="schedule-week__divider" />

          <div className="schedule-week__jobs">
            {column.jobs.map((job) => (
              <ScheduleJobCard job={job} key={job.id} draggable />
            ))}

            {column.jobs.length === 0 && (
              <p className="schedule-week__empty">No jobs</p>
            )}
          </div>
        </section>
      ))}
    </div>
  );
};
