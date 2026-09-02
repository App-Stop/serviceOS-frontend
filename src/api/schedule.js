import api, { unwrap } from './client';

/**
 * The schedule board reads `GET /jobs/schedule` and `GET /jobs/schedule/roster`
 * rather than paging the whole job table.
 *
 * Both take `range` (daily / weekly / monthly) and an optional anchor `date`,
 * and both answer with a window that *starts* at the anchor: daily is that one
 * day, weekly is seven days from it, monthly is thirty. They are rolling
 * windows, not calendar weeks or calendar months — the caller anchors them
 * wherever its grid begins.
 *
 * Everything is bucketed on a UTC day basis server-side, so an anchor is sent
 * as a bare `YYYY-MM-DD`, which `utc-date.helper` reads as exact UTC midnight.
 * Sending a full ISO instant would shift the window by a day for anyone west
 * or east far enough of UTC.
 */
export const SCHEDULE_RANGE_DAYS = { daily: 1, weekly: 7, monthly: 30 };

/** The local calendar day as the bare date string the API anchors on. */
export const toApiDay = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;

/** The UTC calendar day a returned bucket belongs to, in the same format. */
const toUtcDayKey = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const toStoreDate = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

const toStoreTime = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * A schedule entry mapped onto the shape the board's cards already read. It is
 * an *assignment* rather than a job, so a job booked twice appears twice —
 * `id` stays the job id so the card still links through to it.
 */
export const scheduleJobFromApi = (entry) => ({
  id: entry.jobId,
  assignmentId: entry.assignmentId ?? null,
  jobIdNumber: entry.jobIdNumber ?? null,
  title: entry.title ?? '',
  customer: entry.customerName ?? '',
  status: entry.status ?? 'scheduled',
  priority: entry.priority ?? 'normal',

  date: toStoreDate(entry.scheduledStart),
  time: toStoreTime(entry.scheduledStart),
  scheduledStart: entry.scheduledStart ?? null,
  scheduledEnd: entry.scheduledEnd ?? null,

  technician: entry.assignee?.name ?? '',
  assigneeType: entry.assignee?.type ?? null,
  assigneeId: entry.assignee?.id ?? null,
  crewColor: entry.assignee?.crewColor ?? null,
});

/** One window of the day-by-day board. */
export const getScheduleApi = async ({ range = 'daily', date } = {}) => {
  const params = { range };
  if (date) params.date = toApiDay(date);

  const data = unwrap(await api.get('/jobs/schedule', { params })) ?? {};

  return {
    range: data.range ?? range,
    startDate: data.startDate ?? null,
    endDate: data.endDate ?? null,
    // Keyed by UTC calendar day so a bucket can be matched to a grid cell
    // without re-deriving the window on this side.
    days: (data.days ?? []).map((day) => ({
      key: toUtcDayKey(day.date),
      date: day.date ?? null,
      weekday: day.weekday ?? '',
      jobs: (day.jobs ?? []).map(scheduleJobFromApi),
    })),
    unassignedJobs: (data.unassignedJobs ?? []).map(scheduleJobFromApi),
  };
};

/** The roster reports a person's actual role rather than flattening it. */
const ROLE_LABELS = { technician: 'Technician', 'crew-lead': 'Crew Lead' };

/**
 * Technicians and crews grouped with what they are carrying in the window,
 * plus everyone free in it. `type` for a person is their actual role
 * ("technician" or "crew-lead"); only a crew reports "crew".
 */
export const getScheduleRosterApi = async ({ range = 'daily', date } = {}) => {
  const params = { range };
  if (date) params.date = toApiDay(date);

  const data = unwrap(await api.get('/jobs/schedule/roster', { params })) ?? {};

  const column = (entry, jobs = []) => {
    const isCrew = entry.type === 'crew';

    return {
      // Unique per column; the raw id is kept separately for assignment writes.
      key: `${isCrew ? 'crew' : 'member'}-${entry.id}`,
      kind: isCrew ? 'crew' : 'member',
      // The assignment endpoints take "technician" or "crew"; a crew-lead is
      // still assigned as a technician.
      assigneeType: isCrew ? 'crew' : 'technician',
      assigneeId: entry.id,
      name: entry.name ?? '',
      role: isCrew ? 'Crew' : (ROLE_LABELS[entry.role] ?? 'Technician'),
      crew: isCrew ? (entry.name ?? '') : 'Solo',
      crewColor: entry.crewColor ?? null,
      jobs,
    };
  };

  return {
    range: data.range ?? range,
    startDate: data.startDate ?? null,
    endDate: data.endDate ?? null,
    roster: (data.roster ?? []).map((entry) =>
      column(entry, (entry.jobs ?? []).map(scheduleJobFromApi)),
    ),
    unassignedRoster: (data.unassignedRoster ?? []).map((entry) => column(entry)),
  };
};

/**
 * Covers `days` whole days from `from` using as few requests as the three
 * ranges allow — a 7-day week is one `weekly` call, a 42-cell month grid is
 * two `monthly` ones. The buckets are merged into a single day-keyed map.
 */
export const fetchScheduleWindowApi = async ({ from, days }) => {
  const windows = [];
  for (let covered = 0; covered < days; ) {
    const remaining = days - covered;
    const range = remaining <= 1 ? 'daily' : remaining <= 7 ? 'weekly' : 'monthly';

    const anchor = new Date(from);
    anchor.setDate(anchor.getDate() + covered);

    windows.push({ range, date: anchor });
    covered += SCHEDULE_RANGE_DAYS[range];
  }

  const responses = await Promise.all(windows.map(getScheduleApi));

  const byDay = new Map();
  const unassigned = new Map();

  for (const response of responses) {
    for (const day of response.days) {
      // Overlapping windows can return the same day twice; last write wins,
      // and both carry identical contents for that day.
      if (day.key) byDay.set(day.key, day.jobs);
    }
    // De-duplicated on the assignment, which is what an entry represents.
    for (const job of response.unassignedJobs) {
      unassigned.set(job.assignmentId ?? job.id, job);
    }
  }

  return { byDay, unassignedJobs: [...unassigned.values()] };
};
