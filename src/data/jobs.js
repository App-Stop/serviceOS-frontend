/**
 * Prototype job store.
 *
 * Mirrors the shape of the customer store: records live in memory, are
 * mirrored to localStorage so edits survive a refresh, and every change
 * notifies subscribers. Swap the mutators for API calls once a database is
 * wired up — the hooks and their call sites stay the same.
 */

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'serviceos.jobs.v3';

/* ── Status + priority vocabulary ──────────────────────── */

export const JOB_STATUSES = [
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'dispatched', label: 'Dispatched' },
  { id: 'enroute', label: 'Enroute' },
  { id: 'onsite', label: 'On Site' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export const JOB_PRIORITIES = [
  { id: 'urgent', label: 'Urgent Priority' },
  { id: 'high', label: 'High Priority' },
  { id: 'normal', label: 'Normal Priority' },
];

/** Trades the job form offers. Stored on the job as a plain label. */
export const JOB_TYPES = [
  { id: 'HVAC Service', label: 'HVAC Service' },
  { id: 'Heating', label: 'Heating' },
  { id: 'Plumbing', label: 'Plumbing' },
  { id: 'Electrical', label: 'Electrical' },
  { id: 'Roofing', label: 'Roofing' },
  { id: 'General Repair', label: 'General Repair' },
];

/** Ordered lifecycle shown as the progress timeline. Cancelled sits outside it. */
export const JOB_TIMELINE = [
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'dispatched', label: 'Dispatched' },
  { id: 'enroute', label: 'En Route' },
  { id: 'onsite', label: 'On Site' },
  { id: 'completed', label: 'Completed' },
];

export const statusLabel = (id) =>
  JOB_STATUSES.find((status) => status.id === id)?.label ?? id;

export const priorityLabel = (id) =>
  JOB_PRIORITIES.find((priority) => priority.id === id)?.label ?? id;

/* ── Activity feed ─────────────────────────────────────── */

/** Who the prototype acts as. Swap for the signed-in user once auth is real. */
export const CURRENT_USER = 'John Doe (Me)';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Newest-first feed, capped so the card never grows unbounded. */
const ACTIVITY_LIMIT = 12;

/** "Just now" / "10m ago" / "3h ago" / "2d ago" from a timestamp. */
export const relativeTime = (at) => {
  const delta = Date.now() - at;
  if (delta < MINUTE) return 'Just now';
  if (delta < HOUR) return `${Math.floor(delta / MINUTE)}m ago`;
  if (delta < DAY) return `${Math.floor(delta / HOUR)}h ago`;
  return `${Math.floor(delta / DAY)}d ago`;
};

/** Live entries carry a timestamp; seeded ones carry a fixed label. */
export const activityTime = (entry) =>
  typeof entry.at === 'number' ? relativeTime(entry.at) : entry.time ?? '';

/** Shortened display name used in the activity feed, e.g. "Michael J.". */
const shortName = (name) => {
  const [first, last = ''] = name.replace(' (Me)', '').split(' ');
  return last ? `${first} ${last[0]}.` : first;
};

/**
 * Seeds a job's feed from its own record — creation plus each lifecycle step
 * it has already passed — so no two jobs share the same canned history.
 */
const seedActivity = (job) => {
  const steps = job.steps ?? {};
  const entries = JOB_TIMELINE.filter((step) => steps[step.id] && steps[step.id] !== 'Upcoming')
    .map((step) => ({
      id: `seed-${step.id}`,
      actor: shortName(job.technician || job.createdBy || CURRENT_USER),
      verb: 'moved',
      target: job.title,
      connector: 'to',
      chip: { label: step.label, variant: step.id },
      time: steps[step.id],
    }))
    .reverse();

  return [
    ...entries,
    {
      id: 'seed-created',
      actor: shortName(job.createdBy || CURRENT_USER),
      verb: 'created',
      target: job.title || 'this job',
      ...(job.createdAt ? { time: job.createdAt } : { at: Date.now() }),
    },
  ];
};

const withRelations = (job) => ({
  ...job,
  activity: job.activity ?? seedActivity(job),
});

/* ── Seed dates ────────────────────────────────────────── */

/**
 * Seed jobs are positioned relative to the day the prototype is opened, so the
 * schedule always has work around "today" instead of drifting into the past.
 * `day` is an offset in days and step values that look like a time are stamped
 * onto that day. All of this disappears once the API supplies real timestamps.
 */

const SEED_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const TIME_PATTERN = /^\d{1,2}:\d{2}\s*(AM|PM)$/i;

const seedDay = (offset) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
};

/** "Aug 24, 2026" — the format every date field in the store uses. */
const seedDate = (offset) => {
  const date = seedDay(offset);
  return `${SEED_MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

/** "24 Aug, 2026 9:00 AM" — the format the created-at label uses. */
const seedCreatedAt = (offset, time) => {
  const date = seedDay(offset);
  return `${date.getDate()} ${SEED_MONTHS[date.getMonth()]}, ${date.getFullYear()} ${time}`;
};

/** Bare times land on the job's own day; anything else ("Upcoming") passes through. */
const expandSteps = (steps, day) =>
  Object.fromEntries(
    Object.entries(steps).map(([id, value]) => [
      id,
      TIME_PATTERN.test(value) ? `${seedDate(day)} ${value}` : value,
    ]),
  );

const withSchedule = ({ day, createdDay = day - 1, createdTime = '9:00 AM', steps = {}, ...job }) => ({
  ...job,
  date: seedDate(day),
  createdBy: CURRENT_USER,
  createdAt: seedCreatedAt(createdDay, createdTime),
  steps: expandSteps(steps, day),
});

/* ── Seed data (from the Figma jobs table) ─────────────── */

const seed = [
  { id: 1, day: -4, title: 'AC Ductwork Repair', customer: 'Michael Johnson', customerId: 1, time: '9:00 AM', technician: 'JJ Thompson', technicianPhoto: 'david', status: 'completed', priority: 'high', progress: 100, budgetSpent: 8200, budgetTotal: 9000, revenue: 8200, totalTime: '2h', type: 'HVAC Service', location: '142 Maple Street, Austin, TX 78701', description: 'Ductwork leaking in attic. Energy audit recommended repair.', steps: { scheduled: '8:00 AM', dispatched: '8:30 AM', enroute: '8:45 AM', onsite: '9:00 AM', completed: '11:00 AM' }, notes: { dispatched: 'Please store all the gear in the van', onsite: 'Make sure customer is home' } },
  { id: 2, day: -3, title: 'Furnace Installation', customer: 'Samantha Lee', customerId: 2, time: '1:00 PM', technician: 'Samantha Lee', status: 'completed', priority: 'normal', progress: 100, budgetSpent: 4100, budgetTotal: 6000, revenue: 4100, totalTime: '4h', type: 'Heating', location: '88 Rosewood Ave, Seattle, WA 98101', description: 'Replace the aging furnace unit in the basement.', steps: { scheduled: '9:00 AM', dispatched: '11:00 AM', enroute: '12:20 PM', onsite: '1:00 PM', completed: '5:00 PM' } },
  { id: 3, day: -2, title: 'Plumbing Leak Fix', customer: 'Jessica Taylor', customerId: 3, time: '10:00 AM', technician: 'Jessica Taylor', status: 'completed', priority: 'urgent', progress: 100, budgetSpent: 900, budgetTotal: 900, revenue: 900, totalTime: '1h', type: 'Plumbing', location: '9 Larkspur Court, Denver, CO 80202', description: 'Burst pipe under the kitchen sink.', steps: { scheduled: '8:00 AM', dispatched: '9:00 AM', enroute: '9:30 AM', onsite: '10:00 AM', completed: '11:00 AM' } },
  { id: 4, day: -1, title: 'Electrical Panel Upgrade', customer: 'David Wilson', customerId: 4, time: '11:30 AM', technician: 'David Wilson', status: 'cancelled', priority: 'normal', progress: 0, budgetSpent: 0, budgetTotal: 7000, revenue: 0, totalTime: '0h', type: 'Electrical', location: '221 Birch Lane, Chicago, IL 60601', description: 'Upgrade the main panel to 200 amp service.', steps: { scheduled: '9:00 AM' } },
  { id: 5, day: -1, title: 'Roof Inspection', customer: 'Robert Anderson', customerId: 5, time: '2:00 PM', technician: 'Marcus Chen', status: 'completed', priority: 'normal', progress: 100, budgetSpent: 500, budgetTotal: 500, revenue: 500, totalTime: '1h', type: 'Roofing', location: '17 Cactus Way, Phoenix, AZ 85004', description: 'Annual roof condition inspection.', steps: { scheduled: '1:00 PM', dispatched: '1:30 PM', enroute: '1:45 PM', onsite: '2:00 PM', completed: '3:00 PM' } },

  /* Today — one job in each live status, so the board shows the full legend. */
  { id: 6, day: 0, title: 'Water Heater Replacement', customer: 'Emily Davis', customerId: 6, time: '8:00 AM', technician: 'Emily Davis', status: 'completed', priority: 'high', progress: 100, budgetSpent: 3200, budgetTotal: 3200, revenue: 3200, totalTime: '3h', type: 'Plumbing', location: '404 Palm Drive, Miami, FL 33101', description: 'Swap the 40 gallon tank for a tankless unit.', steps: { scheduled: '7:30 AM', dispatched: '7:45 AM', enroute: '7:50 AM', onsite: '8:00 AM', completed: '11:00 AM' } },
  { id: 7, day: 0, title: 'HVAC Maintenance', customer: 'Carlos Mendez', customerId: 7, time: '10:00 AM', technician: 'Carlos Mendez', status: 'onsite', priority: 'high', progress: 60, budgetSpent: 700, budgetTotal: 1200, revenue: 0, totalTime: '1h', type: 'HVAC Service', location: '66 Ocean View, San Diego, CA 92101', description: 'Seasonal tune-up on two rooftop units.', steps: { scheduled: '9:00 AM', dispatched: '9:20 AM', enroute: '9:40 AM', onsite: '10:00 AM' } },
  { id: 8, day: 0, title: 'Garage Door Repair', customer: 'Priya Sharma', customerId: 8, time: '12:30 PM', technician: 'Priya Sharma', status: 'enroute', priority: 'normal', progress: 40, budgetSpent: 200, budgetTotal: 800, revenue: 0, totalTime: '0h', type: 'General Repair', location: '12 Hilltop Road, Austin, TX 78702', description: 'Opener motor is stalling halfway.', steps: { scheduled: '11:00 AM', dispatched: '12:00 PM', enroute: '12:30 PM' } },
  { id: 9, day: 0, title: 'Septic Tank Service', customer: 'Olivia Martinez', customerId: 9, time: '2:00 PM', technician: 'North Crew', status: 'dispatched', priority: 'normal', progress: 20, budgetSpent: 0, budgetTotal: 1500, revenue: 0, totalTime: '0h', type: 'Plumbing', location: '5 Cedar Bend, Portland, OR 97201', description: 'Routine pump-out and inspection.', steps: { scheduled: '1:00 PM', dispatched: '1:30 PM' } },
  { id: 10, day: 0, title: 'Window Replacement', customer: 'James Nakamura', customerId: 10, time: '4:00 PM', technician: 'James Nakamura', status: 'scheduled', priority: 'normal', progress: 0, budgetSpent: 0, budgetTotal: 5400, revenue: 0, totalTime: '0h', type: 'General Repair', location: '77 Alder Street, San Jose, CA 95101', description: 'Replace six single-pane windows on the north face.', steps: { scheduled: '4:00 PM', dispatched: 'Upcoming' } },
  { id: 11, day: 0, title: 'Thermostat Installation', customer: 'Michael Johnson', customerId: 1, time: '5:15 PM', technician: '', status: 'scheduled', priority: 'urgent', progress: 0, budgetSpent: 0, budgetTotal: 450, revenue: 0, totalTime: '0h', type: 'HVAC Service', location: '142 Maple Street, Austin, TX 78701', description: 'Smart thermostat swap in the main hallway.', steps: { scheduled: '5:15 PM', dispatched: 'Upcoming' } },

  /* The rest of this week. */
  { id: 12, day: 1, title: 'Boiler Servicing', customer: "Sarah O'Brien", customerId: 11, time: '10:30 AM', technician: "Sarah O'Brien", status: 'scheduled', priority: 'normal', progress: 0, budgetSpent: 0, budgetTotal: 1100, revenue: 0, totalTime: '0h', type: 'Heating', location: '30 Beacon Hill, Boston, MA 02108', description: 'Annual service on the building boiler.', steps: { scheduled: '10:30 AM', dispatched: 'Upcoming' } },
  { id: 13, day: 1, title: 'Drain Cleaning', customer: 'Marcus Chen', customerId: 12, time: '2:00 PM', technician: 'Marcus Chen', status: 'scheduled', priority: 'normal', progress: 0, budgetSpent: 0, budgetTotal: 600, revenue: 0, totalTime: '0h', type: 'Plumbing', location: '19 Kent Avenue, Brooklyn, NY 11211', description: 'Slow drainage across both bathrooms.', steps: { scheduled: '2:00 PM', dispatched: 'Upcoming' } },
  { id: 14, day: 1, title: 'Ceiling Fan Install', customer: 'Priya Sharma', customerId: 8, time: '4:30 PM', technician: 'West Crew', status: 'scheduled', priority: 'normal', progress: 0, budgetSpent: 0, budgetTotal: 380, revenue: 0, totalTime: '0h', type: 'Electrical', location: '12 Hilltop Road, Austin, TX 78702', description: 'Two fans in the upstairs bedrooms.', steps: { scheduled: '4:30 PM', dispatched: 'Upcoming' } },
  { id: 15, day: 2, title: 'Sump Pump Replacement', customer: 'David Wilson', customerId: 4, time: '9:00 AM', technician: 'David Wilson', status: 'scheduled', priority: 'high', progress: 0, budgetSpent: 0, budgetTotal: 1450, revenue: 0, totalTime: '0h', type: 'Plumbing', location: '221 Birch Lane, Chicago, IL 60601', description: 'Basement pump is cycling constantly.', steps: { scheduled: '9:00 AM', dispatched: 'Upcoming' } },
  { id: 16, day: 2, title: 'Gutter Cleaning', customer: 'James Nakamura', customerId: 10, time: '1:00 PM', technician: '', status: 'scheduled', priority: 'normal', progress: 0, budgetSpent: 0, budgetTotal: 320, revenue: 0, totalTime: '0h', type: 'Roofing', location: '77 Alder Street, San Jose, CA 95101', description: 'Full clear-out before the rainy season.', steps: { scheduled: '1:00 PM', dispatched: 'Upcoming' } },
  { id: 17, day: 3, title: 'Dishwasher Hookup', customer: 'Emily Davis', customerId: 6, time: '11:00 AM', technician: 'Emily Davis', status: 'scheduled', priority: 'normal', progress: 0, budgetSpent: 0, budgetTotal: 275, revenue: 0, totalTime: '0h', type: 'Plumbing', location: '404 Palm Drive, Miami, FL 33101', description: 'Connect the new unit and test for leaks.', steps: { scheduled: '11:00 AM', dispatched: 'Upcoming' } },
  { id: 18, day: 3, title: 'Attic Insulation', customer: 'Carlos Mendez', customerId: 7, time: '3:00 PM', technician: 'Carlos Mendez', status: 'scheduled', priority: 'normal', progress: 0, budgetSpent: 0, budgetTotal: 2600, revenue: 0, totalTime: '0h', type: 'General Repair', location: '66 Ocean View, San Diego, CA 92101', description: 'Top up the blown-in insulation to R-49.', steps: { scheduled: '3:00 PM', dispatched: 'Upcoming' } },
  { id: 19, day: 4, title: 'Circuit Breaker Repair', customer: 'Jessica Taylor', customerId: 3, time: '8:30 AM', technician: 'Jessica Taylor', status: 'scheduled', priority: 'urgent', progress: 0, budgetSpent: 0, budgetTotal: 890, revenue: 0, totalTime: '0h', type: 'Electrical', location: '9 Larkspur Court, Denver, CO 80202', description: 'Kitchen circuit trips under load.', steps: { scheduled: '8:30 AM', dispatched: 'Upcoming' } },
  { id: 20, day: 4, title: 'AC Coil Cleaning', customer: 'Michael Johnson', customerId: 1, time: '1:30 PM', technician: 'East Crew', status: 'scheduled', priority: 'normal', progress: 0, budgetSpent: 0, budgetTotal: 540, revenue: 0, totalTime: '0h', type: 'HVAC Service', location: '142 Maple Street, Austin, TX 78701', description: 'Condenser coils are heavily fouled.', steps: { scheduled: '1:30 PM', dispatched: 'Upcoming' } },
  { id: 21, day: 5, title: 'Water Softener Service', customer: 'Samantha Lee', customerId: 2, time: '10:00 AM', technician: 'Samantha Lee', status: 'scheduled', priority: 'normal', progress: 0, budgetSpent: 0, budgetTotal: 410, revenue: 0, totalTime: '0h', type: 'Plumbing', location: '88 Rosewood Ave, Seattle, WA 98101', description: 'Resin bed replacement and salt top-up.', steps: { scheduled: '10:00 AM', dispatched: 'Upcoming' } },
  { id: 22, day: 6, title: 'Furnace Filter Swap', customer: 'Olivia Martinez', customerId: 9, time: '12:00 PM', technician: 'Olivia Martinez', status: 'scheduled', priority: 'normal', progress: 0, budgetSpent: 0, budgetTotal: 160, revenue: 0, totalTime: '0h', type: 'Heating', location: '5 Cedar Bend, Portland, OR 97201', description: 'Quarterly filter change on both units.', steps: { scheduled: '12:00 PM', dispatched: 'Upcoming' } },

  /* Next fortnight, so the month view has spread. */
  { id: 23, day: 8, title: 'Pipe Insulation', customer: 'Marcus Chen', customerId: 12, time: '9:30 AM', technician: 'Central Crew', status: 'scheduled', priority: 'normal', progress: 0, budgetSpent: 0, budgetTotal: 720, revenue: 0, totalTime: '0h', type: 'Plumbing', location: '19 Kent Avenue, Brooklyn, NY 11211', description: 'Lag the exposed runs in the crawlspace.', steps: { scheduled: '9:30 AM', dispatched: 'Upcoming' } },
  { id: 24, day: 9, title: 'Smoke Alarm Audit', customer: 'Priya Sharma', customerId: 8, time: '11:00 AM', technician: 'Priya Sharma', status: 'scheduled', priority: 'high', progress: 0, budgetSpent: 0, budgetTotal: 340, revenue: 0, totalTime: '0h', type: 'Electrical', location: '12 Hilltop Road, Austin, TX 78702', description: 'Test and re-certify every alarm on site.', steps: { scheduled: '11:00 AM', dispatched: 'Upcoming' } },
  { id: 25, day: 11, title: 'Heat Pump Tune-Up', customer: 'David Wilson', customerId: 4, time: '2:30 PM', technician: '', status: 'scheduled', priority: 'normal', progress: 0, budgetSpent: 0, budgetTotal: 980, revenue: 0, totalTime: '0h', type: 'HVAC Service', location: '221 Birch Lane, Chicago, IL 60601', description: 'Pre-winter service on the outdoor unit.', steps: { scheduled: '2:30 PM', dispatched: 'Upcoming' } },
  { id: 26, day: 13, title: 'Shower Valve Replacement', customer: 'Emily Davis', customerId: 6, time: '10:00 AM', technician: 'South Crew', status: 'scheduled', priority: 'normal', progress: 0, budgetSpent: 0, budgetTotal: 620, revenue: 0, totalTime: '0h', type: 'Plumbing', location: '404 Palm Drive, Miami, FL 33101', description: 'Mixing valve is seized in the main bath.', steps: { scheduled: '10:00 AM', dispatched: 'Upcoming' } },
  { id: 27, day: 16, title: 'Exhaust Fan Install', customer: 'James Nakamura', customerId: 10, time: '1:00 PM', technician: '', status: 'scheduled', priority: 'normal', progress: 0, budgetSpent: 0, budgetTotal: 430, revenue: 0, totalTime: '0h', type: 'Electrical', location: '77 Alder Street, San Jose, CA 95101', description: 'Vent the upstairs bathroom to the soffit.', steps: { scheduled: '1:00 PM', dispatched: 'Upcoming' } },
].map(withSchedule).map(withRelations);

/* ── Store ─────────────────────────────────────────────── */

const read = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : seed;
  } catch {
    return seed;
  }
};

let jobs = read();
const listeners = new Set();

const commit = (next) => {
  jobs = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch {
    // Storage unavailable (private mode / quota) — in-memory state still works.
  }
  listeners.forEach((listener) => listener());
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => jobs;

/* ── Mutators ──────────────────────────────────────────── */

export const addJob = (input) => {
  const id = jobs.reduce((max, job) => Math.max(max, job.id), 0) + 1;
  const job = withRelations({
    id,
    title: '',
    customer: '',
    date: '',
    time: '',
    technician: '',
    status: 'scheduled',
    priority: 'normal',
    progress: 0,
    budgetSpent: 0,
    budgetTotal: 0,
    revenue: 0,
    totalTime: '0h',
    type: '',
    location: '',
    description: '',
    createdBy: 'John Doe (Me)',
    createdAt: '',
    steps: {},
    notes: {},
    ...input,
  });
  commit([...jobs, job]);
  return job;
};

/* ── Activity logging ──────────────────────────────────── */

let activitySeq = 0;

/** Prepends an entry to a job's feed. Returns the updated job. */
const withActivity = (job, entry) => ({
  ...job,
  activity: [
    { id: `live-${Date.now()}-${(activitySeq += 1)}`, at: Date.now(), ...entry },
    ...(job.activity ?? []),
  ].slice(0, ACTIVITY_LIMIT),
});

/** Fields worth naming individually; anything else folds into "updated details". */
const FIELD_LABELS = {
  title: 'title',
  description: 'description',
  location: 'location',
  type: 'type',
  date: 'date',
  time: 'time',
  budgetTotal: 'budget',
  budgetSpent: 'budget',
  revenue: 'revenue',
  progress: 'progress',
};

/**
 * Turns a patch into feed entries by diffing it against the previous record —
 * so every mutator in the app produces activity without extra call sites.
 */
const describeChanges = (before, patch, actor) => {
  const entries = [];
  const title = patch.title ?? before.title;

  if (patch.status && patch.status !== before.status) {
    entries.push({
      actor,
      verb: 'changed',
      target: title,
      connector: 'to',
      chip: { label: statusLabel(patch.status), variant: patch.status },
    });
  }

  if (patch.priority && patch.priority !== before.priority) {
    entries.push({
      actor,
      verb: 'set',
      target: title,
      connector: 'priority to',
      chip: { label: priorityLabel(patch.priority), variant: patch.priority },
    });
  }

  if (patch.technician && patch.technician !== before.technician) {
    entries.push({ actor, verb: 'assigned', target: title, connector: `to ${patch.technician}` });
  }

  if (patch.notes) {
    const changed = Object.keys(patch.notes).filter(
      (step) => patch.notes[step] && patch.notes[step] !== before.notes?.[step],
    );
    changed.forEach((step) => {
      const label = JOB_TIMELINE.find((item) => item.id === step)?.label ?? step;
      entries.push({ actor, verb: 'added a note on', target: label });
    });
  }

  const fields = Object.keys(patch)
    .filter((key) => FIELD_LABELS[key] && patch[key] !== before[key])
    .map((key) => FIELD_LABELS[key]);
  const unique = [...new Set(fields)];
  if (unique.length) {
    entries.push({
      actor,
      verb: 'updated',
      target: title,
      connector: unique.length > 2 ? 'details' : unique.join(' and '),
    });
  }

  return entries;
};

/**
 * Applies a patch and records what changed. Pass `actor` when the change comes
 * from someone other than the signed-in user.
 */
export const updateJob = (id, patch, actor = shortName(CURRENT_USER)) => {
  commit(
    jobs.map((job) => {
      if (job.id !== id) return job;
      const next = { ...job, ...patch };
      return describeChanges(job, patch, actor).reduce(withActivity, next);
    }),
  );
};

/** Escape hatch for events the diff can't see — photo uploads, messages, etc. */
export const logJobActivity = (id, entry) => {
  commit(jobs.map((job) => (job.id === id ? withActivity(job, entry) : job)));
};

export const setJobStatus = (id, status) => updateJob(id, { status });

export const setJobPriority = (id, priority) => updateJob(id, { priority });

export const removeJob = (id) => {
  commit(jobs.filter((job) => job.id !== id));
};

/** Restores the seed records — handy while clicking around the prototype. */
export const resetJobs = () => commit(seed);

/* ── Hooks ─────────────────────────────────────────────── */

export const useJobs = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

export const useJob = (id) => useJobs().find((job) => job.id === Number(id));

/* ── Helpers ───────────────────────────────────────────── */

/** "$8.2k/9k" — the compact budget pair the design uses. */
export const formatBudget = (spent, total) => {
  const compact = (value) =>
    value >= 1000 ? `${Number((value / 1000).toFixed(1))}k` : `${value}`;
  return `$${compact(spent)}/${compact(total)}`;
};
