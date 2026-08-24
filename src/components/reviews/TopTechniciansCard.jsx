import React from 'react';
import { FilterDropdown } from '../FilterDropdown';
import { TOP_TECHNICIANS } from '../../data';

const TIME_OPTIONS = [
  { id: 'all_time', label: 'All time' },
  { id: 'this_month', label: 'This month' },
  { id: 'this_year', label: 'This year' },
];

export const TopTechniciansCard = ({ timeFilter, onTimeFilterChange }) => {
  return (
    <div className="reviews__card">
      <div className="reviews__card-header">
        <h2 className="reviews__card-title">Top 5 Technicians</h2>
        <FilterDropdown
          label="All time"
          value={timeFilter}
          options={TIME_OPTIONS}
          onChange={onTimeFilterChange}
        />
      </div>

      <div className="reviews__dist-list">
        {TOP_TECHNICIANS.map((tech) => (
          <div key={tech.name} className="reviews__dist-row">
            <span className="reviews__tech-label">{tech.name}</span>
            <div className="reviews__dist-bar-wrap">
              <div
                className="reviews__dist-bar-fill"
                style={{ width: `${tech.percentage}%` }}
              />
            </div>
            <span className="reviews__dist-percent">{tech.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
