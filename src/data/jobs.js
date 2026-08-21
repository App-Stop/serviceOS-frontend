/**
 * Prototype job store.
 *
 * Mirrors the shape of the customer store: records live in memory, are
 * mirrored to localStorage so edits survive a refresh, and every change
 * notifies subscribers. Swap the mutators for API calls once a database is
 * wired up — the hooks and their call sites stay the same.
 */

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'serviceos.jobs.v1';

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

/* ── Sample activity ───────────────────────────────────── */

const activityTemplate = [
  { id: 'a1', verb: 'changed', target: 'AC Ductwork Repair', connector: 'to', chip: { label: 'Scheduled', variant: 'scheduled' }, time: '10m ago' },
  { id: 'a2', verb: 'completed', target: 'Electrical Inspection', time: '5m ago' },
  { id: 'a3', actor: 'James Wilson', verb: 'uploaded', target: '3 photos', photos: 3, time: '15m ago' },
  { id: 'a4', verb: 'updated', target: 'HVAC Repair', connector: 'status to', chip: { label: 'On Site', variant: 'onsite' }, time: '5m ago' },
];

/** Shortened display name used in the activity feed, e.g. "Michael J.". */
const shortName = (name) => {
  const [first, last = ''] = name.split(' ');
  return last ? `${first} ${last[0]}.` : first;
};

const withRelations = (job) => ({
  ...job,
  activity: activityTemplate.map((entry) => ({
    ...entry,
    actor: entry.actor ?? shortName(job.customer),
  })),
});

/* ── Seed data (from the Figma jobs table) ─────────────── */

const seed = [
  { id: 1, title: 'AC Ductwork Repair', customer: 'Michael Johnson', customerId: 1, date: 'Aug 12, 2026', time: '1:00 PM', technician: 'JJ Thompson', technicianPhoto: 'david', status: 'scheduled', priority: 'high', progress: 10, budgetSpent: 8200, budgetTotal: 9000, revenue: 400, totalTime: '2h', type: 'HVAC Service', location: '142 Maple Street, Austin, TX 78701', description: 'Ductwork leaking in attic. Energy audit recommended repair.', createdBy: 'John Doe (Me)', createdAt: '12 Aug, 2026 9:00 AM', steps: { scheduled: 'Aug 12, 2026 12:00 AM', dispatched: 'Upcoming' }, notes: { dispatched: 'Please store all the gear in the van', onsite: 'Make sure customer is home' } },
  { id: 2, title: 'Furnace Installation', customer: 'Samantha Lee', customerId: 2, date: 'Aug 13, 2026', time: '1:00 PM', technician: 'Mike Rivera', status: 'onsite', priority: 'normal', progress: 60, budgetSpent: 4100, budgetTotal: 6000, revenue: 1200, totalTime: '4h', type: 'Heating', location: '88 Rosewood Ave, Seattle, WA 98101', description: 'Replace the aging furnace unit in the basement.', createdBy: 'John Doe (Me)', createdAt: '11 Aug, 2026 8:30 AM', steps: { scheduled: 'Aug 13, 2026 9:00 AM', dispatched: 'Aug 13, 2026 11:00 AM', enroute: 'Aug 13, 2026 12:20 PM', onsite: 'Aug 13, 2026 1:00 PM' } },
  { id: 3, title: 'Plumbing Leak Fix', customer: 'Jessica Taylor', customerId: 3, date: 'Aug 13, 2026', time: '1:00 PM', technician: 'Tom Bradley', status: 'completed', priority: 'urgent', progress: 100, budgetSpent: 900, budgetTotal: 900, revenue: 900, totalTime: '1h', type: 'Plumbing', location: '9 Larkspur Court, Denver, CO 80202', description: 'Burst pipe under the kitchen sink.', createdBy: 'John Doe (Me)', createdAt: '13 Aug, 2026 7:15 AM', steps: { scheduled: 'Aug 13, 2026 8:00 AM', dispatched: 'Aug 13, 2026 9:00 AM', enroute: 'Aug 13, 2026 9:30 AM', onsite: 'Aug 13, 2026 10:00 AM', completed: 'Aug 13, 2026 11:00 AM' } },
  { id: 4, title: 'Electrical Panel Upgrade', customer: 'David Wilson', customerId: 4, date: 'Aug 14, 2026', time: '1:00 PM', technician: 'David Wilson', status: 'dispatched', priority: 'normal', progress: 30, budgetSpent: 2100, budgetTotal: 7000, revenue: 0, totalTime: '0h', type: 'Electrical', location: '221 Birch Lane, Chicago, IL 60601', description: 'Upgrade the main panel to 200 amp service.', createdBy: 'John Doe (Me)', createdAt: '10 Aug, 2026 4:45 PM', steps: { scheduled: 'Aug 14, 2026 9:00 AM', dispatched: 'Aug 14, 2026 11:30 AM' } },
  { id: 5, title: 'Roof Inspection', customer: 'Robert Anderson', customerId: 5, date: 'Aug 14, 2026', time: '1:00 PM', technician: 'Chris Nguyen', status: 'cancelled', priority: 'normal', progress: 0, budgetSpent: 0, budgetTotal: 500, revenue: 0, totalTime: '0h', type: 'Roofing', location: '17 Cactus Way, Phoenix, AZ 85004', description: 'Annual roof condition inspection.', createdBy: 'John Doe (Me)', createdAt: '9 Aug, 2026 2:00 PM', steps: { scheduled: 'Aug 14, 2026 10:00 AM' } },
  { id: 6, title: 'Water Heater Replacement', customer: 'Emily Davis', customerId: 6, date: 'Aug 15, 2026', time: '1:00 PM', technician: 'Jake Morris', status: 'enroute', priority: 'high', progress: 45, budgetSpent: 1600, budgetTotal: 3200, revenue: 0, totalTime: '1h', type: 'Plumbing', location: '404 Palm Drive, Miami, FL 33101', description: 'Swap the 40 gallon tank for a tankless unit.', createdBy: 'John Doe (Me)', createdAt: '12 Aug, 2026 10:10 AM', steps: { scheduled: 'Aug 15, 2026 8:00 AM', dispatched: 'Aug 15, 2026 11:00 AM', enroute: 'Aug 15, 2026 12:15 PM' } },
  { id: 7, title: 'HVAC Maintenance', customer: 'Carlos Mendez', customerId: 7, date: 'Aug 15, 2026', time: '1:00 PM', technician: 'Lisa Patel', status: 'scheduled', priority: 'high', progress: 5, budgetSpent: 300, budgetTotal: 1200, revenue: 0, totalTime: '0h', type: 'HVAC Service', location: '66 Ocean View, San Diego, CA 92101', description: 'Seasonal tune-up on two rooftop units.', createdBy: 'John Doe (Me)', createdAt: '12 Aug, 2026 1:00 PM', steps: { scheduled: 'Aug 15, 2026 9:00 AM' } },
  { id: 8, title: 'Garage Door Repair', customer: 'Priya Sharma', customerId: 8, date: 'Aug 16, 2026', time: '1:00 PM', technician: 'Ryan Cooper', status: 'scheduled', priority: 'normal', progress: 0, budgetSpent: 0, budgetTotal: 800, revenue: 0, totalTime: '0h', type: 'General Repair', location: '12 Hilltop Road, Austin, TX 78702', description: 'Opener motor is stalling halfway.', createdBy: 'John Doe (Me)', createdAt: '13 Aug, 2026 9:20 AM', steps: { scheduled: 'Aug 16, 2026 10:00 AM' } },
  { id: 9, title: 'Septic Tank Service', customer: 'Olivia Martinez', customerId: 9, date: 'Aug 16, 2026', time: '1:00 PM', technician: 'Nick Lawson', status: 'scheduled', priority: 'normal', progress: 0, budgetSpent: 0, budgetTotal: 1500, revenue: 0, totalTime: '0h', type: 'Plumbing', location: '5 Cedar Bend, Portland, OR 97201', description: 'Routine pump-out and inspection.', createdBy: 'John Doe (Me)', createdAt: '13 Aug, 2026 11:40 AM', steps: { scheduled: 'Aug 16, 2026 1:00 PM' } },
  { id: 10, title: 'Window Replacement', customer: 'James Nakamura', customerId: 10, date: 'Aug 17, 2026', time: '1:00 PM', technician: 'Sara Kim', status: 'scheduled', priority: 'normal', progress: 0, budgetSpent: 0, budgetTotal: 5400, revenue: 0, totalTime: '0h', type: 'General Repair', location: '77 Alder Street, San Jose, CA 95101', description: 'Replace six single-pane windows on the north face.', createdBy: 'John Doe (Me)', createdAt: '14 Aug, 2026 8:05 AM', steps: { scheduled: 'Aug 17, 2026 9:00 AM' } },
  { id: 11, title: 'Boiler Servicing', customer: "Sarah O'Brien", customerId: 11, date: 'Aug 18, 2026', time: '1:00 PM', technician: 'Owen Blake', status: 'scheduled', priority: 'normal', progress: 0, budgetSpent: 0, budgetTotal: 1100, revenue: 0, totalTime: '0h', type: 'Heating', location: '30 Beacon Hill, Boston, MA 02108', description: 'Annual service on the building boiler.', createdBy: 'John Doe (Me)', createdAt: '14 Aug, 2026 3:30 PM', steps: { scheduled: 'Aug 18, 2026 10:30 AM' } },
  { id: 12, title: 'Drain Cleaning', customer: 'Marcus Chen', customerId: 12, date: 'Aug 18, 2026', time: '1:00 PM', technician: 'Grace Hall', status: 'scheduled', priority: 'normal', progress: 0, budgetSpent: 0, budgetTotal: 600, revenue: 0, totalTime: '0h', type: 'Plumbing', location: '19 Kent Avenue, Brooklyn, NY 11211', description: 'Slow drainage across both bathrooms.', createdBy: 'John Doe (Me)', createdAt: '15 Aug, 2026 9:00 AM', steps: { scheduled: 'Aug 18, 2026 2:00 PM' } },
].map(withRelations);

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

export const updateJob = (id, patch) => {
  commit(jobs.map((job) => (job.id === id ? { ...job, ...patch } : job)));
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
