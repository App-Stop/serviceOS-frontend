import React from 'react';
import mike from '../assets/avatars/mike.png';

const jobs = [
  { id: 1, title: 'Maplewood Community Center Renovation', assignee: 'Jason K.', date: 'Aug 13, 2026', time: '1:00 PM' },
  { id: 2, title: 'Riverside Park Playground Upgrade', assignee: 'Emily R.', date: 'Sep 15, 2026', time: '10:30 AM' },
  { id: 3, title: 'Downtown Library Expansion', assignee: 'Michael T.', date: 'Oct 22, 2026', time: '2:00 PM' },
  { id: 4, title: 'Northside Community Art Fair', assignee: 'Sarah L.', date: 'Nov 5, 2026', time: '11:00 AM' },
];

export const UpcomingJobs = () => {
  return (
    <div className="card card--fill">
      <div className="card__header">
        <span className="card__title">Upcoming Jobs</span>
        <button type="button" className="pill-button">
          <span className="pill-button__text">View All</span>
        </button>
      </div>
      <div className="list-rows">
        {jobs.map((job) => (
          <div key={job.id} className="list-row">
            <div className="list-row__lead">
              <span className="list-row__primary">{job.title}</span>
              <span className="list-row__assignee">
                <img className="chip__avatar" src={mike} alt="" />
                <span className="list-row__secondary">{job.assignee}</span>
              </span>
            </div>
            <div className="list-row__trail">
              <span className="list-row__primary">{job.date}</span>
              <span className="list-row__secondary">{job.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
