import React from 'react';
import { FilterDropdown } from '../FilterDropdown';
import { RATING_DISTRIBUTION } from '../../data';

const TIME_OPTIONS = [
  { id: 'all_time', label: 'All time' },
  { id: 'this_month', label: 'This month' },
  { id: 'this_year', label: 'This year' },
];

export const RatingDistributionCard = ({ timeFilter, onTimeFilterChange }) => {
  return (
    <div className="reviews__card">
      <div className="reviews__card-header">
        <h2 className="reviews__card-title">Rating Distribution</h2>
        <FilterDropdown
          label="All time"
          value={timeFilter}
          options={TIME_OPTIONS}
          onChange={onTimeFilterChange}
        />
      </div>

      <div className="reviews__dist-list">
        {RATING_DISTRIBUTION.map((item) => (
          <div key={item.stars} className="reviews__dist-row">
            <span className="reviews__dist-label">{item.label}</span>
            <div className="reviews__dist-bar-wrap">
              <div
                className="reviews__dist-bar-fill"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
            <span className="reviews__dist-percent">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
