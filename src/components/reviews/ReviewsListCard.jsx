import React from 'react';
import { FilterDropdown } from '../FilterDropdown';
import { ReviewItem } from './ReviewItem';

const TIME_OPTIONS = [
  { id: 'all_time', label: 'All time' },
  { id: 'this_month', label: 'This month' },
  { id: 'this_year', label: 'This year' },
];

export const ReviewsListCard = ({
  reviews,
  timeFilter,
  onTimeFilterChange,
}) => {
  return (
    <div className="reviews__card">
      <div className="reviews__card-header">
        <h2 className="reviews__card-title">All Reviews</h2>
        <FilterDropdown
          label="All time"
          value={timeFilter}
          options={TIME_OPTIONS}
          onChange={onTimeFilterChange}
        />
      </div>

      <div className="reviews__list">
        {reviews.map((review) => (
          <ReviewItem key={review.id} review={review} />
        ))}

        {reviews.length === 0 && (
          <div className="reviews__empty">
            No reviews found for this rating filter.
          </div>
        )}
      </div>
    </div>
  );
};
