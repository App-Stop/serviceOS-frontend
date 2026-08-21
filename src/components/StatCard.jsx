import React from 'react';
import { ArrowUp, Star } from 'lucide-react';

/** `image` swaps the icon bubble for a photo, as on the job detail technician card. */
export const StatCard = ({ icon: Icon, image, value, label, trend, showStar = false }) => {
  return (
    <div className="card card--fill">
      {image ? (
        <img className="stat-card__photo" src={image} alt="" />
      ) : (
        <span className="stat-card__icon">
          <Icon size={24} strokeWidth={2} />
        </span>
      )}
      <div className="stat-card__body">
        <div className={`stat-card__value-row${showStar ? ' stat-card__value-row--tight' : ''}`}>
          <span className="stat-card__value">{value}</span>
          {trend && (
            <span className="stat-card__trend">
              <ArrowUp size={12} strokeWidth={2.5} />
              {trend}
            </span>
          )}
          {showStar && <Star className="stat-card__star" size={26} strokeWidth={0} />}
        </div>
        <span className="stat-card__label">{label}</span>
      </div>
    </div>
  );
};
