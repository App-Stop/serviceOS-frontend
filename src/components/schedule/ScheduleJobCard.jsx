import React from 'react';
import { Link } from 'react-router-dom';
import { GripVertical } from 'lucide-react';
import { initials } from '../../data';

/**
 * A single job on the board. The coloured rail across the top encodes the job
 * status; `showAssignee` is off in the day view, where the column already says
 * who the job belongs to.
 */
export const ScheduleJobCard = ({ job, showAssignee = true, draggable = false }) => (
  <Link className="schedule-job" to={`/jobs/${job.id}`}>
    <span className={`schedule-job__rail schedule-dot--${job.status}`} aria-hidden="true" />

    <span className="schedule-job__top">
      <span className="schedule-job__time">{job.time}</span>
      {draggable && (
        <GripVertical className="schedule-job__grip" size={14} strokeWidth={2} aria-hidden="true" />
      )}
    </span>

    <span className="schedule-job__body">
      <span className="schedule-job__title">{job.title}</span>

      {showAssignee && job.technician && (
        <span className="schedule-job__assignee">
          <span className="avatar-initials schedule-job__avatar">
            {initials(job.technician)}
          </span>
          {job.technician}
        </span>
      )}
    </span>
  </Link>
);
