import React from 'react';

export const ReviewMetricCard = ({ icon: Icon, value, valueExtra, label }) => {
  return (
    <div className="reviews__metric-card">
      <div className="reviews__metric-icon">
        <Icon size={24} strokeWidth={2} />
      </div>
      <div className="reviews__metric-body">
        <div className="reviews__metric-value-row">
          <span>{value}</span>
          {valueExtra}
        </div>
        <span className="reviews__metric-label">{label}</span>
      </div>
    </div>
  );
};
