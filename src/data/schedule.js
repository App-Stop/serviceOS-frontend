/**
 * Schedule derivations.
 *
 * The schedule owns no store of its own — it is a read-only view over the job
 * and team stores. Swapping those seeds for API responses is enough to make
 * every view below live, so nothing here needs to change when the backend
 * lands. Only pure date helpers and read hooks belong in this file.
 */

import { useMemo } from 'react';
import { useJobs } from './jobs';
import { useTeamMembers, useCrews } from './team';

/* ── View vocabulary ───────────────────────────────────── */

export const SCHEDULE_VIEWS = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
];

/**
 * Legend entries, in the order the design lists them. The colour itself lives
 * in CSS (`.schedule-dot--<id>`) so the palette stays defined in one place.
 */
export const SCHEDULE_STATUSES = [
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'dispatched', label: 'Dispatched' },
  { id: 'enroute', label: 'En Route' },
  { id: 'onsite', label: 'On Site' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

/* ── Date primitives ───────────────────────────────────── */

export const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Weeks start on Monday, as they do in the design. */
export const WEEKDAY_NAMES = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
];

export const WEEKDAY_ABBREVIATIONS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const MONTH_INDEX = MONTH_LABELS.reduce((index, label, position) => {
  index[label.toLowerCase()] = position;
  return index;
}, {});

/** Untimed jobs sort after every timed one. */
const NO_TIME = Number.MAX_SAFE_INTEGER;

/** Parses the store's "Aug 12, 2026" into a local midnight Date. */
export const parseJobDate = (value) => {
  const match = /^([A-Za-z]{3})[a-z]*\s+(\d{1,2}),?\s+(\d{4})$/.exec(
    String(value ?? '').trim(),
  );
  if (!match) return null;

  const month = MONTH_INDEX[match[1].toLowerCase()];
  if (month === undefined) return null;

  return new Date(Number(match[3]), month, Number(match[2]));
};

/** Parses the store's "1:00 PM" into minutes past midnight, for sorting. */
export const parseJobTime = (value) => {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(value ?? '').trim());
  if (!match) return NO_TIME;

  const hour = (Number(match[1]) % 12) + (/pm/i.test(match[3]) ? 12 : 0);
  return hour * 60 + Number(match[2]);
};

export const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Stable YYYY-MM-DD key, used to bucket jobs by day. */
export const toISODate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;

export const addDays = (date, amount) => {
  const next = startOfDay(date);
  next.setDate(next.getDate() + amount);
  return next;
};

export const addMonths = (date, amount) => {
  const next = startOfDay(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + amount);
  return next;
};

/** Monday of the week containing `date`. */
export const startOfWeek = (date) => {
  const start = startOfDay(date);
  const weekday = (start.getDay() + 6) % 7; // Sunday (0) becomes 6
  return addDays(start, -weekday);
};

export const isSameDay = (a, b) =>
  Boolean(a && b) &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/* ── Labels ────────────────────────────────────────────── */

export const formatShortDate = (date) =>
  `${MONTH_LABELS[date.getMonth()]} ${date.getDate()}`;

export const formatLongDate = (date) =>
  `${MONTH_LABELS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

export const formatWeekdayName = (date) => WEEKDAY_NAMES[(date.getDay() + 6) % 7];

export const formatMonthTitle = (date) =>
  `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;

export const formatWeekTitle = (weekStart) => {
  const weekEnd = addDays(weekStart, 6);
  return `${formatShortDate(weekStart)} — ${formatShortDate(weekEnd)}, ${weekEnd.getFullYear()}`;
};

export const formatDayTitle = (date, today) => {
  const label = `${formatWeekdayName(date)} ${formatShortDate(date)}`;
  return isSameDay(date, today) ? `Today, ${label}` : label;
};

/** Column heading in the week view — "Mon, Today" on the current day. */
export const formatColumnHeading = (date, today) =>
  isSameDay(date, today)
    ? `${formatWeekdayName(date).slice(0, 3)}, Today`
    : formatWeekdayName(date);

/** Minutes past midnight rendered the way the store writes times. */
export const formatClockTime = (hours, minutes) =>
  `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;

/**
 * The store keeps the date and time apart; a `datetime-local` input wants them
 * together. These two convert between the pair and the input's value.
 */
export const toDateTimeInput = (date, time) => {
  const day = parseJobDate(date);
  if (!day) return '';

  const minutes = parseJobTime(time);
  const offset = minutes === NO_TIME ? 0 : minutes;

  return `${toISODate(day)}T${String(Math.floor(offset / 60)).padStart(2, '0')}:${String(
    offset % 60,
  ).padStart(2, '0')}`;
};

export const fromDateTimeInput = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(String(value ?? '').trim());
  if (!match) return { date: '', time: '' };

  const [, year, month, day, hours, minutes] = match.map(Number);

  return {
    date: formatLongDate(new Date(year, month - 1, day)),
    time: formatClockTime(hours, minutes),
  };
};

/* ── Grids ─────────────────────────────────────────────── */

export const buildWeekDays = (weekStart) =>
  Array.from({ length: 7 }, (_, offset) => addDays(weekStart, offset));

/**
 * Six Monday-first rows covering the anchor's month, with the leading and
 * trailing days of the neighbouring months flagged so they can be muted.
 */
export const buildMonthGrid = (anchor) => {
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = startOfWeek(monthStart);

  return Array.from({ length: 42 }, (_, offset) => {
    const date = addDays(gridStart, offset);
    return { date, inMonth: date.getMonth() === monthStart.getMonth() };
  });
};

/* ── Job lookups ───────────────────────────────────────── */

const byTime = (a, b) => parseJobTime(a.time) - parseJobTime(b.time);

/** Every job bucketed by ISO date and sorted by start time within the day. */
export const useJobsByDate = () => {
  const jobs = useJobs();

  return useMemo(() => {
    const buckets = new Map();

    jobs.forEach((job) => {
      const date = parseJobDate(job.date);
      if (!date) return;

      const key = toISODate(date);
      const bucket = buckets.get(key);
      if (bucket) bucket.push(job);
      else buckets.set(key, [job]);
    });

    buckets.forEach((bucket) => bucket.sort(byTime));
    return buckets;
  }, [jobs]);
};

export const useJobsOnDay = (date) => {
  const jobsByDate = useJobsByDate();
  const key = toISODate(date);
  return useMemo(() => jobsByDate.get(key) ?? [], [jobsByDate, key]);
};

export const useWeekColumns = (weekStart) => {
  const jobsByDate = useJobsByDate();

  return useMemo(
    () =>
      buildWeekDays(weekStart).map((date) => ({
        date,
        iso: toISODate(date),
        jobs: jobsByDate.get(toISODate(date)) ?? [],
      })),
    [jobsByDate, weekStart],
  );
};

export const useMonthCells = (anchor) => {
  const jobsByDate = useJobsByDate();

  return useMemo(
    () =>
      buildMonthGrid(anchor).map(({ date, inMonth }) => {
        const jobs = jobsByDate.get(toISODate(date)) ?? [];

        /* One dot per distinct status present that day, legend-ordered. */
        const statuses = SCHEDULE_STATUSES.map((status) => status.id).filter((id) =>
          jobs.some((job) => job.status === id),
        );

        return { date, iso: toISODate(date), inMonth, jobs, statuses };
      }),
    [anchor, jobsByDate],
  );
};

/**
 * The day view's dispatch board: everyone carrying work on `date`, technicians
 * first and then crews. Jobs name their assignee as a plain string today; that
 * becomes an id join once the backend owns the relationship.
 */
export const useDayRoster = (date) => {
  const jobs = useJobsOnDay(date);
  const members = useTeamMembers();
  const crews = useCrews();

  return useMemo(() => {
    const assigned = new Map();

    jobs.forEach((job) => {
      const assignee = job.technician?.trim();
      if (!assignee) return;

      const bucket = assigned.get(assignee);
      if (bucket) bucket.push(job);
      else assigned.set(assignee, [job]);
    });

    const toColumn = (entity, kind) => ({
      id: `${kind}-${entity.id}`,
      name: entity.name,
      kind,
      jobs: assigned.get(entity.name) ?? [],
    });

    return [
      ...members.map((member) => toColumn(member, 'member')),
      ...crews.map((crew) => toColumn(crew, 'crew')),
    ].filter((column) => column.jobs.length > 0);
  }, [crews, jobs, members]);
};

/** Jobs nobody is on yet — surfaced by the toolbar's unassigned button. */
export const useUnassignedJobs = () => {
  const jobs = useJobs();
  return useMemo(() => jobs.filter((job) => !job.technician?.trim()), [jobs]);
};
