/**
 * Customer store.
 *
 * In demo mode this holds the seeded prototype records in memory (mirrored to
 * localStorage so edits survive a refresh). In live mode the same collection
 * is served by `/customers` and every read and write goes to the API — the
 * store just caches it in the shape the screens already read, so no call site
 * has to know which mode it is rendering.
 */

import { useSyncExternalStore } from 'react';
import { isLiveMode } from '../appMode';
import {
  createCustomerApi,
  emptyAddress,
  formatAddress,
  getCustomerApi,
  listCustomersApi,
  listCustomersPageApi,
  removeCustomerApi,
  updateCustomerApi,
} from '../api/customers';

export { emptyAddress, formatAddress } from '../api/customers';

const STORAGE_KEY = 'serviceos.customers.v1';

/* ── Sample job history / activity ─────────────────────── */

const jobTemplate = [
  { id: 'j1', title: 'Maplewood Community Center Renovation', assignee: 'Jason K.', date: 'Aug 13, 2026', time: '1:00 PM', status: 'Scheduled' },
  { id: 'j2', title: 'Riverside Park Playground Upgrade', assignee: 'Emily R.', date: 'Sep 15, 2026', time: '10:30 AM' },
  { id: 'j3', title: 'Downtown Library Expansion', assignee: 'Michael T.', date: 'Oct 22, 2026', time: '2:00 PM' },
  { id: 'j4', title: 'Northside Community Art Fair', assignee: 'Sarah L.', date: 'Nov 5, 2026', time: '11:00 AM' },
  { id: 'j5', title: 'Eastside Neighborhood Cleanup', assignee: 'David H.', date: 'Dec 12, 2026', time: '9:00 AM' },
  { id: 'j6', title: 'Westlake Music Festival', assignee: 'Laura K.', date: 'Jan 14, 2027', time: '4:00 PM' },
  { id: 'j7', title: 'Citywide Sports Day', assignee: 'James W.', date: 'Feb 20, 2027', time: '1:00 PM' },
  { id: 'j8', title: 'Annual Food Drive', assignee: 'Nina S.', date: 'Mar 18, 2027', time: '10:00 AM' },
];

const activityTemplate = [
  { id: 'a1', verb: 'changed', target: 'AC Ductwork Repair', connector: 'to', chip: { label: 'Scheduled', variant: 'danger' }, time: '10m ago' },
  { id: 'a2', verb: 'completed', target: 'Electrical Inspection', time: '5m ago' },
  { id: 'a3', verb: 'assigned', target: 'Roof Leak Fix', connector: 'to', chip: { label: 'Patrik S.', variant: 'neutral', avatar: 'patrik' }, time: '15m ago' },
  { id: 'a4', verb: 'updated', target: 'HVAC Repair', connector: 'status to', chip: { label: 'On Site', variant: 'info' }, time: '5m ago' },
];

/** Shortened display name used in the activity feed, e.g. "Michael J.". */
const shortName = (name) => {
  const [first, last = ''] = name.split(' ');
  return last ? `${first} ${last[0]}.` : first;
};

const withRelations = (customer) => ({
  ...customer,
  jobs: jobTemplate.slice(0, Math.max(2, Math.min(jobTemplate.length, customer.jobsCount))),
  activity: activityTemplate.map((entry) => ({ ...entry, actor: shortName(customer.name) })),
});

/* ── Seed data (from the Figma customer table) ─────────── */

const seed = [
  { id: 1, name: 'Michael Johnson', phone: '(555) 201-1001', email: 'm.johnson@gmail.com', locations: ['New York, NY', 'Austin, TX', 'Portland, OR'], jobsCount: 12, totalBilled: 2341, status: 'active', since: 2024, notes: 'I prefer morning appointments', activeJobs: 1, invoices: 4, rating: 4.8 },
  { id: 2, name: 'Samantha Lee', phone: '(555) 387-4522', email: 'samantha.lee@outlook.com', locations: ['Seattle, WA'], jobsCount: 4, totalBilled: 780, status: 'active', since: 2024, notes: 'Gate code is 4417', activeJobs: 1, invoices: 2, rating: 4.6 },
  { id: 3, name: 'Jessica Taylor', phone: '(555) 614-8903', email: 'j.taylor@icloud.com', locations: ['Denver, CO', 'Boulder, CO'], jobsCount: 7, totalBilled: 1365, status: 'active', since: 2023, notes: 'Call before arriving', activeJobs: 2, invoices: 3, rating: 4.9 },
  { id: 4, name: 'David Wilson', phone: '(555) 729-3364', email: 'david.wilson@yahoo.com', locations: ['Chicago, IL', 'Evanston, IL', 'Naperville, IL', 'Aurora, IL'], jobsCount: 18, totalBilled: 3510, status: 'active', since: 2022, notes: 'Invoices go to accounts payable', activeJobs: 3, invoices: 9, rating: 4.5 },
  { id: 5, name: 'Robert Anderson', phone: '(555) 445-6617', email: 'r.anderson@gmail.com', locations: ['Phoenix, AZ'], jobsCount: 3, totalBilled: 585, status: 'archived', since: 2023, notes: '', activeJobs: 0, invoices: 1, rating: 4.2 },
  { id: 6, name: 'Emily Davis', phone: '(555) 892-7748', email: 'emily.davis@hotmail.com', locations: ['Miami, FL', 'Tampa, FL'], jobsCount: 9, totalBilled: 1755, status: 'active', since: 2024, notes: 'Dog on the property', activeJobs: 1, invoices: 4, rating: 4.7 },
  { id: 7, name: 'Carlos Mendez', phone: '(555) 103-5529', email: 'carlos.mendez@gmail.com', locations: ['San Diego, CA', 'Irvine, CA'], jobsCount: 6, totalBilled: 1170, status: 'active', since: 2023, notes: 'Prefers weekend visits', activeJobs: 1, invoices: 3, rating: 4.4 },
  { id: 8, name: 'Priya Sharma', phone: '(555) 264-9981', email: 'priya.sharma@outlook.com', locations: ['Austin, TX', 'Dallas, TX', 'Houston, TX', 'Plano, TX', 'Waco, TX'], jobsCount: 22, totalBilled: 4290, status: 'active', since: 2021, notes: 'Net 30 payment terms', activeJobs: 4, invoices: 11, rating: 5.0 },
  { id: 9, name: 'Olivia Martinez', phone: '(555) 718-3346', email: 'o.martinez@icloud.com', locations: ['Portland, OR'], jobsCount: 2, totalBilled: 390, status: 'archived', since: 2025, notes: '', activeJobs: 0, invoices: 1, rating: 4.0 },
  { id: 10, name: 'James Nakamura', phone: '(555) 556-4472', email: 'j.nakamura@company.co', locations: ['San Jose, CA', 'Oakland, CA', 'Fremont, CA'], jobsCount: 14, totalBilled: 2730, status: 'active', since: 2022, notes: 'Send reports to the office manager', activeJobs: 2, invoices: 7, rating: 4.8 },
  { id: 11, name: "Sarah O'Brien", phone: '(555) 831-2205', email: 'sobrien@protonmail.com', locations: ['Boston, MA'], jobsCount: 5, totalBilled: 975, status: 'active', since: 2024, notes: 'Buzzer is broken — call on arrival', activeJobs: 1, invoices: 2, rating: 4.6 },
  { id: 12, name: 'Marcus Chen', phone: '(555) 942-6638', email: 'marcus.chen@gmail.com', locations: ['Brooklyn, NY', 'Queens, NY'], jobsCount: 11, totalBilled: 2145, status: 'active', since: 2023, notes: 'Parking available in the rear lot', activeJobs: 2, invoices: 5, rating: 4.7 },
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

// Live mode starts empty and fills from the API; demo mode starts seeded.
let customers = isLiveMode() ? [] : read();
const listeners = new Set();

const notify = () => listeners.forEach((listener) => listener());

const commit = (next) => {
  customers = next;
  try {
    // Only the demo dataset is mirrored to storage; live data belongs to the API.
    if (!isLiveMode()) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
    }
  } catch {
    // Storage unavailable (private mode / quota) — in-memory state still works.
  }
  notify();
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => customers;

/* ── Live mode ─────────────────────────────────────────── */

let hydrating = null;
// Demo data is present from the first render; live data arrives over the wire.
let loaded = !isLiveMode();

/** Replaces the store contents with the company's own customers. */
const refreshFromApi = async () => {
  customers = await listCustomersApi();
  loaded = true;
  notify();
};

/**
 * Kicked off from the read hooks so a live screen loads its data by being
 * rendered, the same way the demo store is simply already there. The in-flight
 * promise is shared, so mounting several customer screens fetches once.
 */
const ensureLiveData = () => {
  if (!isLiveMode() || hydrating) return;
  hydrating = refreshFromApi().catch(() => {
    // Leaves the list empty; the next mount retries.
    hydrating = null;
  });
};

/** Re-reads after a write, so the cached list matches what the API stored. */
const reloadLive = () => refreshFromApi().catch(() => {});

/** Fields the demo dataset can be searched on, matching the API's `$or`. */
const matchesCustomer = (customer, term) =>
  customer.name.toLowerCase().includes(term) ||
  customer.email.toLowerCase().includes(term) ||
  customer.phone.toLowerCase().includes(term);

/**
 * One page of customers for the table. Live mode asks the API, which does the
 * searching, counting and slicing; demo mode pages the seeded array the same
 * way so the table has one set of controls in both modes.
 */
export const fetchCustomersPage = async ({ page = 1, limit = 20, search = '' } = {}) => {
  if (isLiveMode()) return listCustomersPageApi({ page, limit, search });

  const term = search.trim().toLowerCase();
  const matched = term
    ? customers.filter((customer) => matchesCustomer(customer, term))
    : customers;

  const totalCount = matched.length;
  const start = (page - 1) * limit;

  return {
    items: matched.slice(start, start + limit),
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 0,
    },
  };
};

/**
 * One customer with their statistics, job history page and recent activity —
 * what the detail screen and the edit dialog open on. Demo mode answers from
 * the seeded record, which already carries its own sample relations.
 */
export const fetchCustomer = async (id, { page = 1, limit = 20 } = {}) => {
  if (isLiveMode()) return getCustomerApi(id, { page, limit });

  const customer = customers.find((item) => String(item.id) === String(id));
  if (!customer) return null;

  const start = (page - 1) * limit;
  const totalCount = customer.jobs.length;

  return {
    ...customer,
    billingAddress: customer.billingAddress ?? emptyAddress(),
    serviceAddress: customer.serviceAddress ?? emptyAddress(),
    jobs: customer.jobs.slice(start, start + limit),
    // The seeded feed already reads as a sentence; it's reshaped onto the
    // API's entry shape so the detail screen renders one way in both modes.
    activity: customer.activity.map((entry) => ({
      id: entry.id,
      type: null,
      verb: [entry.verb, entry.target, entry.connector].filter(Boolean).join(' '),
      chipLabel: entry.chip?.label ?? null,
      actor: entry.actor,
      createdAt: null,
      time: entry.time ?? '',
    })),
    jobsPagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 0,
    },
  };
};

/* ── Mutators ──────────────────────────────────────────── */

export const addCustomer = async (input) => {
  if (isLiveMode()) {
    const created = await createCustomerApi(input);
    await reloadLive();
    return created;
  }

  const id = customers.reduce((max, customer) => Math.max(max, customer.id), 0) + 1;
  const customer = withRelations({
    id,
    name: '',
    phone: '',
    email: '',
    locations: [],
    jobsCount: 0,
    totalBilled: 0,
    status: 'active',
    since: new Date().getFullYear(),
    notes: '',
    activeJobs: 0,
    invoices: 0,
    rating: 0,
    ...input,
    // The dialog collects structured addresses; the demo table lists places.
    locations: [input.serviceAddress, input.billingAddress]
      .map(formatAddress)
      .filter(Boolean)
      .slice(0, 1),
  });
  commit([...customers, customer]);
  return customer;
};

export const updateCustomer = async (id, patch) => {
  if (isLiveMode()) {
    const updated = await updateCustomerApi(id, patch);
    await reloadLive();
    return updated;
  }

  const next = {
    ...patch,
    locations: [patch.serviceAddress, patch.billingAddress]
      .map(formatAddress)
      .filter(Boolean)
      .slice(0, 1),
  };

  commit(
    customers.map((customer) =>
      String(customer.id) === String(id) ? { ...customer, ...next } : customer,
    ),
  );
};

export const removeCustomer = async (id) => {
  if (isLiveMode()) {
    await removeCustomerApi(id);
    return reloadLive();
  }

  commit(customers.filter((customer) => String(customer.id) !== String(id)));
};

/**
 * Restores the seed records — handy while clicking around the prototype.
 * Demo only; there is nothing to reset a company's real customers to.
 */
export const resetCustomers = () => {
  if (isLiveMode()) return;
  commit(seed);
};

/* ── Hooks ─────────────────────────────────────────────── */

export const useCustomers = () => {
  ensureLiveData();
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};

// Ids are numbers in the seed data and ObjectId strings from the API, so the
// route param is matched as text either way.
export const useCustomer = (id) =>
  useCustomers().find((customer) => String(customer.id) === String(id));

/** False until the live customer list has arrived; always true in demo mode. */
export const useCustomersLoaded = () =>
  useSyncExternalStore(subscribe, () => loaded, () => loaded);

/* ── Helpers ───────────────────────────────────────────── */

export const initials = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

export const formatCurrency = (amount) => `$${Number(amount || 0).toLocaleString('en-US')}`;
