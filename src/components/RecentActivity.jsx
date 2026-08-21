import React from 'react';
import david from '../assets/avatars/david.png';
import mickael from '../assets/avatars/mickael.png';
import mike from '../assets/avatars/mike.png';
import patrik from '../assets/avatars/patrik.png';
import emily from '../assets/avatars/emily.png';
import sara from '../assets/avatars/sara.png';
import alex from '../assets/avatars/alex.png';

const activities = [
  {
    id: 1,
    avatar: david,
    actor: 'David K.',
    verb: 'changed',
    target: 'AC Ductwork Repair',
    connector: 'to',
    chip: { label: 'Scheduled', variant: 'danger' },
    time: '10m ago',
  },
  {
    id: 2,
    avatar: mickael,
    actor: 'Mickael L.',
    verb: 'completed',
    target: 'Electrical Inspection',
    time: '5m ago',
  },
  {
    id: 3,
    avatar: mike,
    actor: 'Mike T.',
    verb: 'assigned',
    target: 'Roof Leak Fix',
    connector: 'to',
    chip: { label: 'Patrik S.', variant: 'neutral', avatar: patrik },
    time: '15m ago',
  },
  {
    id: 4,
    avatar: emily,
    actor: 'Emily R.',
    verb: 'changed',
    target: 'Plumbing Maintenance',
    connector: 'to',
    chip: { label: 'In Progress', variant: 'success' },
    time: '2m ago',
  },
  {
    id: 5,
    avatar: sara,
    actor: 'Sara P.',
    verb: 'assigned',
    target: 'Window Replacement',
    connector: 'to',
    chip: { label: 'Jason K.', variant: 'neutral', avatar: mike },
    time: '10m ago',
  },
  {
    id: 6,
    avatar: alex,
    actor: 'Alex B.',
    verb: 'updated',
    target: 'HVAC Repair',
    connector: 'status to',
    chip: { label: 'On Site', variant: 'info' },
    time: '5m ago',
  },
];

export const RecentActivity = () => {
  return (
    <div className="card card--fill">
      <div className="card__header">
        <span className="card__title">Recent Activity</span>
      </div>
      <div className="activity__list">
        {activities.map((item) => (
          <div key={item.id} className="activity__item">
            <img className="activity__avatar" src={item.avatar} alt="" />
            <div className="activity__body">
              <div className="activity__line">
                <span className="activity__actor">{item.actor}</span>
                <span className="activity__verb">{item.verb}</span>
                <span className="activity__target">{item.target}</span>
                {item.connector && <span className="activity__verb">{item.connector}</span>}
                {item.chip && (
                  <span className={`chip chip--${item.chip.variant}`}>
                    {item.chip.avatar && (
                      <img className="chip__avatar" src={item.chip.avatar} alt="" />
                    )}
                    {item.chip.label}
                  </span>
                )}
              </div>
              <span className="activity__time">{item.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
