/**
 * Schedule derivations.
 *
 * In demo mode the schedule owns no store — it is a read-only view over the
 * seeded job and team stores, bucketed by day here.
 *
 * In live mode it reads `GET /jobs/schedule` and `GET /jobs/schedule/roster`,
 * which do that bucketing server-side over a date window. `useScheduleView`
 * below is the single entry point that serves whichever mode is active, so the
 * board's components take their data as props and never know the difference.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useJobsSnapshot } from './jobs';
import { useTeamMembersSnapshot, useCrewsSnapshot } from './team';
import { isLiveMode } from '../appMode';
import { fetchScheduleWindowApi, getScheduleRosterApi } from '../api/schedule';
import { getErrorMessage } from '../api/client';

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
  { id: 'en-route', label: 'En Route' },
  { id: 'in-progress', label: 'In Progress' },
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

/* ── The board's view model ────────────────────────────── */

/** Days each view needs, and where its window starts. */
const viewWindow = (view, anchor) => {
  if (view === 'week') return { from: startOfWeek(anchor), days: 7 };
  // The month grid is always six Monday-first rows, so it reaches past the
  // month on both ends and needs the whole 42-cell span covered.
  if (view === 'month') return { from: buildMonthGrid(anchor)[0].date, days: 42 };
  return { from: startOfDay(anchor), days: 1 };
};

/** One dot per distinct status present that day, in legend order. */
const statusesOf = (jobs) =>
  SCHEDULE_STATUSES.map((status) => status.id).filter((id) =>
    jobs.some((job) => job.status === id),
  );

const emptyView = {
  columns: [],
  cells: [],
  roster: [],
  unassignedRoster: [],
  unassignedJobs: [],
};

/**
 * Everything the schedule screen renders for the current view and anchor:
 * week columns, month cells, the day's dispatch roster, whoever is free that
 * day, and the jobs in the window with nobody on them.
 *
 * Live mode asks the API for exactly that window — one request for a week,
 * two for a month grid, and a second roster request on the day view. Demo mode
 * derives the same shapes from the seeded store. `reload` re-reads after a
 * write so the board reflects an assignment straight away.
 */
export const useScheduleView = ({ view, anchor }) => {
  const live = isLiveMode();
  const { from, days } = viewWindow(view, anchor);

  // Dates are fresh objects every render; the key is what the effect watches.
  const fromKey = toISODate(from);

  const [remote, setRemote] = useState({
    byDay: new Map(),
    roster: [],
    unassignedRoster: [],
    unassignedJobs: [],
  });
  const [loading, setLoading] = useState(live);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!live) return;

    setLoading(true);
    setError('');
    try {
      const [board, roster] = await Promise.all([
        fetchScheduleWindowApi({ from, days }),
        // Only the day view is laid out per assignee; the other views would
        // discard the roster, so it isn't fetched for them.
        view === 'day'
          ? getScheduleRosterApi({ range: 'daily', date: from })
          : Promise.resolve(null),
      ]);

      setRemote({
        byDay: board.byDay,
        unassignedJobs: board.unassignedJobs,
        // The board columns are the people carrying work; everyone free that
        // day is listed in the side panel instead, where a job is handed over.
        roster: roster?.roster ?? [],
        unassignedRoster: roster?.unassignedRoster ?? [],
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load the schedule.'));
    } finally {
      setLoading(false);
    }
    // `from` is rebuilt each render, so the day it represents is the dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, view, fromKey, days]);

  useEffect(() => {
    load();
  }, [load]);

  /* ── Demo mode ──────────────────────────────────────── */

  // Demo mode reads the seeded store; live mode never touches it, so the
  // snapshot hook is used to avoid pulling the whole job table down here.
  const jobs = useJobsSnapshot();
  const members = useTeamMembersSnapshot();
  const crews = useCrewsSnapshot();

  const localByDay = useMemo(() => {
    if (live) return new Map();

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
  }, [live, jobs]);

  return useMemo(() => {
    if (live && loading && remote.byDay.size === 0) {
      return { ...emptyView, loading: true, error, reload: load };
    }

    const byDay = live ? remote.byDay : localByDay;
    const jobsOn = (date) => byDay.get(toISODate(date)) ?? [];

    const columns =
      view === 'week'
        ? buildWeekDays(startOfWeek(anchor)).map((date) => ({
            date,
            iso: toISODate(date),
            jobs: jobsOn(date),
          }))
        : [];

    const cells =
      view === 'month'
        ? buildMonthGrid(anchor).map(({ date, inMonth }) => {
            const dayJobs = jobsOn(date);
            return {
              date,
              iso: toISODate(date),
              inMonth,
              jobs: dayJobs,
              statuses: statusesOf(dayJobs),
            };
          })
        : [];

    let roster = [];
    let unassignedRoster = [];
    if (view === 'day') {
      if (live) {
        roster = remote.roster;
        unassignedRoster = remote.unassignedRoster;
      } else {
        // The demo store names its assignee rather than referencing one, so
        // the columns are matched back to the roster by name.
        const dayJobs = jobsOn(anchor);
        const assigned = new Map();
        dayJobs.forEach((job) => {
          const name = job.technician?.trim();
          if (!name) return;
          const bucket = assigned.get(name);
          if (bucket) bucket.push(job);
          else assigned.set(name, [job]);
        });

        const toColumn = (entity, kind) => ({
          key: `${kind}-${entity.id}`,
          kind,
          assigneeType: kind === 'crew' ? 'crew' : 'technician',
          assigneeId: entity.id,
          name: entity.name,
          role: kind === 'crew' ? 'Crew' : (entity.role ?? 'Technician'),
          crew: kind === 'crew' ? entity.name : (entity.crew ?? 'Solo'),
          crewColor: entity.color ?? null,
          jobs: assigned.get(entity.name) ?? [],
        });

        const columnsForDay = [
          ...members.map((member) => toColumn(member, 'member')),
          ...crews.map((crew) => toColumn(crew, 'crew')),
        ];

        // Same split the API makes: on the board if they are carrying work,
        // in the side panel if they are free.
        roster = columnsForDay.filter((column) => column.jobs.length > 0);
        unassignedRoster = columnsForDay.filter((column) => column.jobs.length === 0);
      }
    }

    const unassignedJobs = live
      ? remote.unassignedJobs
      : jobs.filter((job) => !job.technician?.trim());

    return {
      columns,
      cells,
      roster,
      unassignedRoster,
      unassignedJobs,
      loading,
      error,
      reload: load,
    };
  }, [live, loading, error, load, remote, localByDay, view, anchor, jobs, members, crews]);
};
