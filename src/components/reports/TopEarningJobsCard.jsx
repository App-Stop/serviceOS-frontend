import React from 'react';
import { BriefcaseBusiness } from 'lucide-react';
import { initials } from '../../data';

export const TopEarningJobsCard = ({ jobs = [] }) => (
  <div className="reports__card">
    <div className="reports__card-header">
      <h2 className="reports__card-title">Top Earning Jobs</h2>
      <span className="reports__card-icon">
        <BriefcaseBusiness size={20} strokeWidth={2} />
      </span>
    </div>

    <div className="reports__list">
      {jobs.map((job) => (
        <div className="reports__list-row" key={job.title}>
          <div className="reports__list-main">
            <span className="reports__list-title">{job.title}</span>
            <span className="reports__list-meta">
              <span className="avatar-initials reports__list-avatar">
                {initials(job.assignee)}
              </span>
              {job.assignee}
            </span>
          </div>

          <div className="reports__list-side">
            <span className="reports__list-amount">{job.amount}</span>
            <span className="reports__list-meta">
              {job.date} {job.time}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);
