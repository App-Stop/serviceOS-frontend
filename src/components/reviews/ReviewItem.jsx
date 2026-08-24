import React from 'react';
import { Star } from 'lucide-react';

export const ReviewItem = ({ review }) => {
  return (
    <div className="reviews__item">
      <div className="reviews__item-meta">
        <div className="reviews__stars-row">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={18}
              className={
                i < review.rating
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-neutral-300'
              }
            />
          ))}
        </div>
        <span className="reviews__item-date">{review.date}</span>
      </div>

      <div className="reviews__item-body">
        <h3 className="reviews__item-title">{review.title}</h3>
        <p className="reviews__item-comment">{review.comment}</p>
      </div>

      <div className="reviews__item-customer">
        <span className="reviews__customer-name">{review.customerName}</span>
        <span className="reviews__customer-tenure">{review.customerTenure}</span>
      </div>
    </div>
  );
};
