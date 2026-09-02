import api, { unwrap, unwrapList } from './client';
import { formatAddress } from './customers';

/** `GET /jobs` caps `limit` at 100 (ListJobsValidator). */
const MAX_PAGE_SIZE = 100;

/**
 * The API's status and priority enums. The store's `JOB_STATUSES` /
 * `JOB_PRIORITIES` use exactly these ids, so a value passes between the
 * screens, the query string and the request body untranslated.
 *
 * Note `on-site` is on the Job model but is NOT in the update validator's
 * enum, so a job can never be moved into it through the API — the lifecycle
 * the UI offers is the five reachable stages.
 */
export const JOB_STATUS_IDS = [
  'scheduled',
  'dispatched',
  'en-route',
  'in-progress',
  'completed',
  'cancelled',
];

export const JOB_PRIORITY_IDS = ['normal', 'high', 'emergency'];

/* ── Dates ─────────────────────────────────────────────── */

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** "Aug 24, 2026" — the date format every screen in the store reads. */
const toStoreDate = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

/** "9:00 AM" — the companion time format. */
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

/** "24 Aug, 2026 9:00 AM" — the created-at label. */
const toStoreDateTime = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getDate()} ${MONTHS[date.getMonth()]}, ${date.getFullYear()} ${toStoreTime(iso)}`;
};

/** "2h 30m" from a minute count — the API's `totalTimeMinutes`. */
export const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return '0h';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}m`;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

/**
 * `datetime-local` gives a wall-clock string with no zone. The API reads a
 * zone-less string as UTC (see utc-date.helper), so the local value is
 * converted to a real instant and sent as a full ISO timestamp.
 */
export const toApiInstant = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(String(value ?? '').trim());
  if (!match) return null;
  const [, year, month, day, hours, minutes] = match.map(Number);
  return new Date(year, month - 1, day, hours, minutes).toISOString();
};

/** The reverse, for loading a job's window back into the form. */
export const toDateTimeLocal = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

/* ── Reading ───────────────────────────────────────────── */

/**
 * A `GET /jobs` row mapped onto the shape the jobs board, schedule and
 * dashboard already read. Fields the list projection doesn't carry
 * (description, location, job type) stay empty until the detail endpoint
 * fills them in.
 */
export const jobFromApi = (job) => {
  if (!job) return null;

  const assignee = job.assignee ?? null;

  return {
    id: job._id,
    jobIdNumber: job.jobIdNumber ?? null,
    title: job.title ?? '',
    customer: job.customerName ?? '',

    date: toStoreDate(job.scheduledStart),
    time: toStoreTime(job.scheduledStart),
    scheduledStart: job.scheduledStart ?? null,
    scheduledEnd: job.scheduledEnd ?? null,

    technician: assignee?.name ?? '',
    assigneeType: assignee?.type ?? null,
    assigneeId: assignee?.id ?? null,
    crewColor: assignee?.crewColor ?? null,

    status: job.status ?? 'scheduled',
    priority: job.priority ?? 'normal',
    progress: job.progress ?? 0,

    budgetTotal: job.budget ?? 0,
    budgetSpent: job.laborCostTotal ?? 0,
    revenue: job.revenue ?? 0,
    totalTime: formatDuration(job.totalTimeMinutes),

    // `statusHistory` is the lifecycle timeline; the strip reads `steps` as
    // a status → label map, with "Upcoming" for a stage not yet reached.
    steps: Object.fromEntries(
      (job.statusHistory ?? []).map((entry) => [
        entry.status,
        entry.reached ? toStoreDateTime(entry.at) || '—' : 'Upcoming',
      ]),
    ),

    // No endpoint backs per-step notes, so the strip's note button has
    // nothing to read; kept as an empty map so it renders "Add Note".
    notes: {},
    type: '',
    location: '',
    description: '',
  };
};

/** Reads a `recentActivity` row into the feed entry the screens render. */
const activityFromApi = (entry) => ({
  id: entry._id,
  type: entry.type ?? null,
  fromStatus: entry.fromStatus ?? null,
  toStatus: entry.toStatus ?? null,
  actor: entry.actor?.fullName ?? 'Someone',
  note: entry.note ?? '',
  createdAt: entry.createdAt ?? null,
});

/** `GET /jobs/:id` — every list field plus the detail-only ones. */
export const jobDetailFromApi = (job) => {
  if (!job) return null;

  const base = jobFromApi(job);
  const customer = job.customer ?? null;

  return {
    ...base,
    description: job.description ?? '',
    location: formatAddress(job.siteAddress),
    siteAddress: job.siteAddress ?? null,
    type: job.jobType?.name ?? '',
    jobTypeId: job.jobType?._id ?? null,
    customerId: customer?._id ?? null,

    // Exactly one of these is populated, depending on who holds the job.
    technicianDetails: job.technician ?? null,
    crew: job.crew ?? null,

    activity: (job.recentActivity ?? []).map(activityFromApi),
    createdBy: '',
    createdAt: toStoreDateTime(job.createdAt),
  };
};

/* ── Writing ───────────────────────────────────────────── */

const trimmed = (value) => String(value ?? '').trim();

const siteAddressToApi = (address) => {
  if (!address) return undefined;
  const payload = {};
  for (const key of ['line1', 'city', 'state', 'zip']) {
    const value = trimmed(address[key]);
    if (value) payload[key] = value;
  }
  return Object.keys(payload).length ? payload : undefined;
};

/**
 * `CreateJobValidator` / `UpdateJobValidator` are both `.strict()`, and the
 * assignment fields carry rules of their own: `scheduledStart` and
 * `scheduledEnd` must arrive together, `assigneeType` and `assigneeId` must
 * arrive together, and an assignee may only be given alongside a schedule. So
 * a half-filled schedule is dropped rather than sent and rejected.
 */
const jobToApi = (form, { isUpdate = false } = {}) => {
  const payload = {};

  const title = trimmed(form.title);
  if (title) payload.title = title;

  if (form.customerId) payload.customerId = form.customerId;
  if (form.jobTypeId) payload.jobTypeId = form.jobTypeId;

  const description = trimmed(form.description);
  if (description) payload.description = description;

  const siteAddress = siteAddressToApi(form.siteAddress);
  if (siteAddress) payload.siteAddress = siteAddress;

  if (form.priority) payload.priority = form.priority;
  // Status only moves through the dedicated endpoints, never on a form save —
  // the API rejects a backward transition and a create starts at "scheduled".
  if (isUpdate && form.status) payload.status = form.status;

  // Budget and revenue are figures a job accrues, not things it is created
  // with, so they are only ever written by an update.
  if (isUpdate) {
    if (form.budget !== undefined && form.budget !== '') {
      payload.budget = Number(form.budget) || 0;
    }
    if (form.revenue !== undefined && form.revenue !== '') {
      payload.revenue = Number(form.revenue) || 0;
    }
  }

  const start = form.scheduledStart ?? null;
  const end = form.scheduledEnd ?? null;
  if (start && end) {
    payload.scheduledStart = start;
    payload.scheduledEnd = end;

    if (form.assigneeType && form.assigneeId) {
      payload.assigneeType = form.assigneeType;
      payload.assigneeId = form.assigneeId;
    }
  }

  return payload;
};

export const listJobsPageApi = async ({
  page = 1,
  limit = 20,
  search,
  status,
  priority,
  technicianId,
  crewId,
  dateFrom,
  dateTo,
} = {}) => {
  const params = { page, limit: Math.min(limit, MAX_PAGE_SIZE) };
  if (search?.trim()) params.search = search.trim();
  if (status && status !== 'all') params.status = status;
  if (priority && priority !== 'all') params.priority = priority;
  if (technicianId) params.technicianId = technicianId;
  if (crewId) params.crewId = crewId;
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;

  const response = await api.get('/jobs', { params });

  return {
    items: unwrapList(response).map(jobFromApi),
    pagination: response?.data?.pagination ?? {
      page,
      limit,
      totalCount: 0,
      totalPages: 0,
    },
  };
};

/** Every job, for the schedule grid and the dashboard rollups. */
export const listJobsApi = async () => {
  const first = await listJobsPageApi({ page: 1, limit: MAX_PAGE_SIZE });
  const { totalPages = 1 } = first.pagination;

  if (totalPages <= 1) return first.items;

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      listJobsPageApi({ page: i + 2, limit: MAX_PAGE_SIZE }),
    ),
  );

  return rest.reduce((all, next) => all.concat(next.items), first.items);
};

export const getJobApi = async (id) => {
  const response = await api.get(`/jobs/${id}`);
  return jobDetailFromApi(unwrap(response));
};

export const createJobApi = async (form) => {
  const response = await api.post('/jobs', jobToApi(form));
  // The create response is the plain job transformer, not the list projection,
  // so only its id is reliable here — callers re-read for the rest.
  return { id: unwrap(response)?._id ?? null };
};

export const updateJobApi = async (id, form) => {
  const response = await api.patch(`/jobs/${id}`, jobToApi(form, { isUpdate: true }));
  return { id: unwrap(response)?._id ?? id };
};

/**
 * Status has its own endpoint. The API enforces the lifecycle: a job only
 * moves forward, can be cancelled from any live state, and cannot leave a
 * terminal one — so a rejected move comes back as a 400 to surface.
 */
export const setJobStatusApi = async (id, status) => {
  const response = await api.patch(`/jobs/${id}/status`, { status });
  return { id: unwrap(response)?._id ?? id };
};

/** Priority is an ordinary field, so it goes through the job update. */
export const setJobPriorityApi = async (id, priority) => {
  const response = await api.patch(`/jobs/${id}`, { priority });
  return { id: unwrap(response)?._id ?? id };
};

/**
 * Hands an already-scheduled job to a technician or crew.
 *
 * `POST /jobs/assign` takes only the job and the assignee — it copies the
 * window from the job's current assignment, so the schedule stays untouched
 * and this is the right call for a pure reassignment. The body is `.strict()`,
 * so nothing else may be sent.
 *
 * The job must already have an assignment to copy from; one that was never
 * scheduled comes back as a 400 asking for a schedule first.
 */
export const assignJobApi = async (jobId, { assigneeType, assigneeId }) => {
  const response = await api.post('/jobs/assign', {
    jobId,
    assigneeType,
    assigneeId,
  });
  return { id: unwrap(response)?._id ?? jobId };
};

/**
 * Soft delete — the job is flagged `isDeleted` and any live assignment on it
 * is cancelled, so its attendance and invoice history stays intact.
 */
export const removeJobApi = async (id) => {
  await api.delete(`/jobs/${id}`);
};

/**
 * Every job for one customer, newest first. Unpaginated and unfiltered — the
 * endpoint takes no query at all, so the caller narrows the list itself.
 *
 * This is what the invoice builder's job picker reads. Nothing on a job says
 * whether it has already been billed, so the picker cannot hide jobs that are
 * on an existing invoice, and the API does not refuse a repeat — a job can be
 * invoiced more than once for now. When the backend adds the `invoiced` flag,
 * pass it through here as a param and drop the note on the picker.
 */
export const listCustomerJobsApi = async (customerId) => {
  const response = await api.get(`/jobs/customer/${customerId}`);
  return unwrapList(response).map(jobFromApi);
};

/**
 * Unassigned jobs for a specific date (GET /jobs/unassigned-daily?date=YYYY-MM-DD).
 */
export const fetchUnassignedDailyJobsApi = async (dateStr) => {
  const params = {};
  if (dateStr) params.date = dateStr;
  const response = await api.get('/jobs/unassigned-daily', { params });
  const payload = unwrap(response) ?? {};
  const rawJobs = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.jobs)
    ? payload.jobs
    : [];

  return rawJobs.map((item) => ({
    id: item.jobId || item.assignmentId || item._id,
    jobId: item.jobId || item.assignmentId || item._id,
    assignmentId: item.assignmentId ?? null,
    jobIdNumber: item.jobIdNumber ?? null,
    title: item.title || (item.jobIdNumber ? `Job #${item.jobIdNumber}` : 'Unassigned Job'),
    customerName: item.customerName || '',
    customer: item.customerName || '',
    status: item.status || 'scheduled',
    priority: item.priority || 'normal',
    scheduledStart: item.scheduledStart ?? null,
    scheduledEnd: item.scheduledEnd ?? null,
    assignee: item.assignee ?? null,
  }));
};
