import { useSyncExternalStore } from 'react';

const STORAGE_REVIEWS_KEY = 'serviceos.reviews.v1';

export const SEED_REVIEWS = [
  {
    id: 'r1',
    customerName: 'JJ Thompson',
    customerTenure: 'Customer since 2024',
    rating: 5,
    date: '27 Jun 2026',
    title: 'Absolutely Amazing!',
    comment: 'The technicians did a wonderful job. Fast, clean, and extremely professional!',
  },
  {
    id: 'r2',
    customerName: 'Maria Gonzalez',
    customerTenure: 'Customer since 2021',
    rating: 5,
    date: '15 Jul 2026',
    title: 'Fantastic Experience!',
    comment: 'The service exceeded my expectations. Arrived right on time and fixed our furnace leak.',
  },
  {
    id: 'r3',
    customerName: 'David Lee',
    customerTenure: 'Customer since 2022',
    rating: 5,
    date: '10 Aug 2026',
    title: 'Highly Satisfied!',
    comment: 'Quick response and great service for our emergency plumbing issue.',
  },
  {
    id: 'r4',
    customerName: 'Aisha Patel',
    customerTenure: 'Customer since 2023',
    rating: 5,
    date: '22 Sep 2026',
    title: 'Will Recommend!',
    comment: 'The staff were friendly and professional throughout the entire installation process.',
  },
  {
    id: 'r5',
    customerName: 'Robert Anderson',
    customerTenure: 'Customer since 2025',
    rating: 4,
    date: '02 Oct 2026',
    title: 'Great Overall Service',
    comment: 'Technician was knowledgeable. Very satisfied with the roof assessment.',
  },
  {
    id: 'r6',
    customerName: 'Samantha Lee',
    customerTenure: 'Customer since 2023',
    rating: 3,
    date: '14 Nov 2026',
    title: 'Decent Service',
    comment: 'Job was completed well, though technician arrived slightly behind schedule.',
  },
];

export const RATING_DISTRIBUTION = [
  { stars: 5, label: '5 Star', percentage: 70 },
  { stars: 4, label: '4 Star', percentage: 13 },
  { stars: 3, label: '3 Star', percentage: 6 },
  { stars: 2, label: '2 Star', percentage: 4 },
  { stars: 1, label: '1 Star', percentage: 7 },
];

export const TOP_TECHNICIANS = [
  { name: 'James Wilson', score: 100, percentage: 100 },
  { name: 'Lisa Rodriguez', score: 97, percentage: 97 },
  { name: 'Mike Johnson', score: 95, percentage: 95 },
  { name: 'Johnathan L.', score: 90, percentage: 90 },
  { name: 'Mikael Sova', score: 87, percentage: 87 },
];

const readStore = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const writeStore = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
};

let reviews = readStore(STORAGE_REVIEWS_KEY, SEED_REVIEWS);
const listeners = new Set();

const notify = () => listeners.forEach((cb) => cb());
const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

const commitReviews = (next) => {
  reviews = next;
  writeStore(STORAGE_REVIEWS_KEY, reviews);
  notify();
};

export const useReviews = () =>
  useSyncExternalStore(subscribe, () => reviews, () => reviews);

export const addReview = (newReview) => {
  const item = {
    id: `r-${Date.now()}`,
    customerName: newReview.customerName || 'Anonymous Customer',
    customerTenure: 'Customer since 2026',
    rating: Number(newReview.rating) || 5,
    date: new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    title: newReview.title || 'Great Service!',
    comment: newReview.comment || '',
  };
  commitReviews([item, ...reviews]);
  return item;
};
