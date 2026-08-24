import React, { useMemo, useState } from 'react';
import { Star, Users, Clock } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { FilterDropdown } from '../components/FilterDropdown';
import { ReviewMetricCard } from '../components/reviews/ReviewMetricCard';
import { RatingDistributionCard } from '../components/reviews/RatingDistributionCard';
import { TopTechniciansCard } from '../components/reviews/TopTechniciansCard';
import { ReviewsListCard } from '../components/reviews/ReviewsListCard';
import { useReviews } from '../data';
import './Reviews.css';

const RATING_FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: '5', label: '5' },
  { id: '4', label: '4' },
  { id: '3', label: '3' },
  { id: '2', label: '2' },
  { id: '1', label: '1' },
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Sort: Newest' },
  { id: 'highest', label: 'Sort: Highest' },
  { id: 'lowest', label: 'Sort: Lowest' },
];

const Reviews = () => {
  const reviews = useReviews();

  const [activeStarFilter, setActiveStarFilter] = useState('all');
  const [distTimeFilter, setDistTimeFilter] = useState('all_time');
  const [techTimeFilter, setTechTimeFilter] = useState('all_time');
  const [listTimeFilter, setListTimeFilter] = useState('all_time');
  const [sortBy, setSortBy] = useState('newest');

  const filteredReviews = useMemo(() => {
    let result = [...reviews];

    if (activeStarFilter !== 'all') {
      const starNum = Number(activeStarFilter);
      result = result.filter((r) => r.rating === starNum);
    }

    if (sortBy === 'highest') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'lowest') {
      result.sort((a, b) => a.rating - b.rating);
    }

    return result;
  }, [reviews, activeStarFilter, sortBy]);

  return (
    <AppShell>
      <div className="app-shell__content reviews__content">
        <div className="page-title">
          <h1 className="page-title__heading">Reviews</h1>
          <p className="page-title__subheading">Customer reviews and ratings</p>
        </div>

        <div className="reviews__metrics">
          <ReviewMetricCard
            icon={Star}
            value="4.8"
            valueExtra={<Star className="reviews__star-icon" size={26} />}
            label="Avg. Rating"
          />

          <ReviewMetricCard
            icon={Users}
            value={reviews.length + 28}
            label="Total Reviews (23 customers)"
          />

          <ReviewMetricCard
            icon={Clock}
            value="~15min"
            label="Response Time"
          />
        </div>

        <div className="reviews__analytics">
          <RatingDistributionCard
            timeFilter={distTimeFilter}
            onTimeFilterChange={setDistTimeFilter}
          />

          <TopTechniciansCard
            timeFilter={techTimeFilter}
            onTimeFilterChange={setTechTimeFilter}
          />
        </div>

        <div className="reviews__toolbar">
          <div className="reviews__rating-filters">
            {RATING_FILTER_OPTIONS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`pill-button pill-button--lg${
                  activeStarFilter === tab.id ? ' pill-button--selected' : ''
                }`}
                onClick={() => setActiveStarFilter(tab.id)}
              >
                <span className="pill-button__text flex items-center gap-1">
                  {tab.label}
                  {tab.id !== 'all' && (
                    <Star className="size-4 text-yellow-500 fill-yellow-500" />
                  )}
                </span>
              </button>
            ))}
          </div>

          <FilterDropdown
            label="Sort"
            value={sortBy}
            options={SORT_OPTIONS}
            onChange={(id) => setSortBy(id)}
          />
        </div>

        <ReviewsListCard
          reviews={filteredReviews}
          timeFilter={listTimeFilter}
          onTimeFilterChange={setListTimeFilter}
        />
      </div>
    </AppShell>
  );
};

export default Reviews;
