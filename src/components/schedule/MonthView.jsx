import React, { useState } from 'react';
import { WEEKDAY_ABBREVIATIONS, formatLongDate, isSameDay } from '../../data/schedule';

/** How many job titles the hover card lists before it stops. */
const PREVIEW_LIMIT = 3;

/**
 * Month grid. Each day shows a dot per status present and a job count;
 * hovering previews the day and selecting one opens it in the day view.
 * `cells` is the full six-row grid, already bucketed by the schedule screen.
 */
export const MonthView = ({ cells = [], today, onSelectDay }) => {
  const [previewed, setPreviewed] = useState(null);

  return (
    <div className="schedule-month">
      <div className="schedule-month__weekdays">
        {WEEKDAY_ABBREVIATIONS.map((weekday) => (
          <span className="schedule-month__weekday" key={weekday}>
            {weekday}
          </span>
        ))}
      </div>

      <div className="schedule-month__grid">
        {cells.map((cell) => (
          <div className="schedule-month__slot" key={cell.iso}>
            <button
              type="button"
              className={`schedule-month__cell${
                cell.inMonth ? '' : ' schedule-month__cell--outside'
              }${isSameDay(cell.date, today) ? ' schedule-month__cell--today' : ''}`}
              onClick={() => onSelectDay(cell.date)}
              onMouseEnter={() => setPreviewed(cell.iso)}
              onMouseLeave={() => setPreviewed(null)}
              onFocus={() => setPreviewed(cell.iso)}
              onBlur={() => setPreviewed(null)}
            >
              <span className="schedule-month__cell-top">
                <span className="schedule-month__day">{cell.date.getDate()}</span>

                <span className="schedule-month__dots">
                  {cell.statuses.map((status) => (
                    <span
                      className={`schedule-month__dot schedule-dot--${status}`}
                      key={status}
                    />
                  ))}
                </span>
              </span>

              {cell.inMonth && cell.jobs.length > 0 && (
                <span className="schedule-month__count">
                  <strong>{cell.jobs.length}</strong> Jobs
                </span>
              )}
            </button>

            {previewed === cell.iso && cell.jobs.length > 0 && (
              <div className="schedule-month__preview">
                <p className="schedule-month__preview-date">{formatLongDate(cell.date)}</p>
                <p className="schedule-month__preview-count">{cell.jobs.length} Jobs</p>

                <ul className="schedule-month__preview-list">
                  {cell.jobs.slice(0, PREVIEW_LIMIT).map((job) => (
                    <li key={job.assignmentId ?? job.id}>{job.title}</li>
                  ))}
                </ul>

                {cell.jobs.length > PREVIEW_LIMIT && (
                  <p className="schedule-month__preview-more">
                    +{cell.jobs.length - PREVIEW_LIMIT} more
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
