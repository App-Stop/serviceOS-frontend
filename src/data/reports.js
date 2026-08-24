import { useSyncExternalStore } from 'react';

const STORAGE_REPORTS_KEY = 'serviceos.reports.v3';

/* The chart holds a full 90 day series so the card's range dropdown has
   something to slice. The trailing three days have not happened yet and are
   rendered as muted placeholders; the eleven real days before them carry the
   exact values from the Figma so the default 14 day view matches it. */
const SERIES_DAYS = 90;
const UPCOMING_DAYS = 3;
const SERIES_END = new Date(2026, 7, 13); // Aug 13, 2026 — last upcoming day

const DESIGNED_TAIL = [
  { jobs: 14, revenue: 1020 },
  { jobs: 6, revenue: 375 },
  { jobs: 10, revenue: 770 },
  { jobs: 11, revenue: 700 },
  { jobs: 11, revenue: 900 },
  { jobs: 14, revenue: 540 },
  { jobs: 11, revenue: 560 },
  { jobs: 11, revenue: 500 },
  { jobs: 14, revenue: 800 },
  { jobs: 8, revenue: 300 },
  { jobs: 15, revenue: 1000 },
];

const formatDay = (date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const buildChartSeries = () => {
  const points = [];

  for (let offset = SERIES_DAYS - 1; offset >= 0; offset -= 1) {
    const date = new Date(SERIES_END);
    date.setDate(date.getDate() - offset);

    /* Deterministic filler so the longer ranges look like real history
       instead of re-rendering differently on every mount. */
    const index = SERIES_DAYS - 1 - offset;
    const wave = Math.sin(index * 0.7) + Math.sin(index * 0.23);

    points.push({
      date: formatDay(date),
      jobs: Math.max(1, Math.round(8 + wave * 3.5)),
      revenue: Math.max(120, Math.round(760 + wave * 260)),
    });
  }

  const tailStart = points.length - UPCOMING_DAYS - DESIGNED_TAIL.length;
  DESIGNED_TAIL.forEach((values, index) => {
    Object.assign(points[tailStart + index], values);
  });

  for (let index = points.length - UPCOMING_DAYS; index < points.length; index += 1) {
    Object.assign(points[index], { jobs: 0, revenue: 0, upcoming: true });
  }

  return points;
};

export const SEED_REPORTS = {
  metrics: {
    revenueCollected: '$7,695',
    revenueTrend: '13%',
    outstanding: '$3,444',
    unpaidCount: 5,
    profitMargin: '65%',
    avgRevenuePerJob: '$144.23',
    avgRevenueTrend: '2.5%',
  },
  chartData: buildChartSeries(),
  topEarningJobs: [
    {
      title: 'Maplewood Community Center Renovation',
      assignee: 'Jason K.',
      amount: '$3,123',
      date: 'Aug 13, 2026',
      time: '1:00 PM',
    },
    {
      title: 'Riverside Park Playground Upgrade',
      assignee: 'Emily R.',
      amount: '$4,567',
      date: 'Aug 13, 2026',
      time: '1:00 PM',
    },
    {
      title: 'Downtown Library Expansion',
      assignee: 'Michael T.',
      amount: '$3,123',
      date: 'Aug 13, 2026',
      time: '1:00 PM',
    },
    {
      title: 'Northside Community Art Fair',
      assignee: 'Sarah L.',
      amount: '$1,234',
      date: 'Aug 13, 2026',
      time: '1:00 PM',
    },
  ],
  topEarningCustomers: [
    { name: 'Mickael Larry', invoices: 3, amount: '$3,123', jobs: 2 },
    { name: 'Sophia Chang', invoices: 5, amount: '$4,567', jobs: 3 },
    { name: 'MJ Styles', invoices: 3, amount: '$3,123', jobs: 2 },
    { name: 'Liam Johnson', invoices: 2, amount: '$1,234', jobs: 1 },
  ],
  invoicePipeline: [
    { status: 'paid', label: 'Paid', count: 32, amount: '$2,454' },
    { status: 'sent', label: 'Sent', count: 6, amount: '$983' },
    { status: 'overdue', label: 'Overdue', count: 2, amount: '$341' },
    { status: 'draft', label: 'Draft', count: 1, amount: '$133' },
  ],
  recentInvoices: [
    {
      customer: 'JJ Thompson',
      created: 'Aug 12, 2026',
      createdTime: '1:00 PM',
      due: 'Aug 12, 2026',
      dueTime: '1:00 PM',
      status: 'paid',
      amount: '$5,0213',
    },
    {
      customer: 'Samantha Lee',
      created: 'Aug 13, 2026',
      createdTime: '1:00 PM',
      due: 'Aug 13, 2026',
      dueTime: '1:00 PM',
      status: 'draft',
      amount: '$8,3450',
    },
    {
      customer: 'Jessica Taylor',
      created: 'Aug 13, 2026',
      createdTime: '1:00 PM',
      due: 'Aug 13, 2026',
      dueTime: '1:00 PM',
      status: 'sent',
      amount: '$6,1245',
    },
    {
      customer: 'David Wilson',
      created: 'Aug 14, 2026',
      createdTime: '1:00 PM',
      due: 'Aug 14, 2026',
      dueTime: '1:00 PM',
      status: 'overdue',
      amount: '$7,2378',
    },
    {
      customer: 'Robert Anderson',
      created: 'Aug 14, 2026',
      createdTime: '1:00 PM',
      due: 'Aug 14, 2026',
      dueTime: '1:00 PM',
      status: 'paid',
      amount: '$13,8901',
    },
  ],
};

const readStore = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

let reportsData = readStore(STORAGE_REPORTS_KEY, SEED_REPORTS);
const listeners = new Set();

const notify = () => listeners.forEach((cb) => cb());
const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const useReportsData = () =>
  useSyncExternalStore(subscribe, () => reportsData, () => reportsData);
