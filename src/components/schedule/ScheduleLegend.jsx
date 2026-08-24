import React from 'react';
import { SCHEDULE_STATUSES } from '../../data/schedule';

/** Status key shown beside the page title. */
export const ScheduleLegend = () => (
  <ul className="schedule-legend">
    {SCHEDULE_STATUSES.map((status) => (
      <li className="schedule-legend__item" key={status.id}>
        <span className={`schedule-legend__dot schedule-dot--${status.id}`} />
        {status.label}
      </li>
    ))}
  </ul>
);
