/**
 * Invoice store.
 *
 * Mirrors the job and customer stores: in demo mode the seeded records live in
 * memory and are mirrored to localStorage; in live mode the same collection is
 * served by `/invoices` and every read and write goes to the API. Either way
 * the store hands out one shape, so the table, the builder and the document
 * don't have to know which mode they're rendering.
 *
 * The live side is shaped by two facts about the API worth knowing here:
 *
 * - An invoice is raised against **jobs**, not typed from scratch. `create`
 *   takes a customer and at least one job id and derives the service and tool
 *   line items itself; anything typed in the builder is appended to those.
 * - Totals, tax and the invoice number are **server-owned**. Nothing in this
 *   file recomputes them for a live invoice — `invoiceTotals` exists for the
 *   demo dataset and for the builder's running preview before a save.
 */

import { useSyncExternalStore } from 'react';
import { isLiveMode } from '../appMode';
import {
  createInvoiceApi,
  fetchInvoicePdfApi,
  getInvoiceApi,
  listInvoicesApi,
  listInvoicesPageApi,
  payInvoiceApi,
  sendInvoiceApi,
  updateInvoiceApi,
  voidInvoiceApi,
} from '../api/invoices';

export {
  PAYMENT_METHODS,
  paymentMethodLabel,
  formatInvoiceNumber,
  toDateInput,
  todayInput,
} from '../api/invoices';

const STORAGE_KEY = 'serviceos.invoices.v2';

/**
 * Sales tax for the demo dataset only. A live invoice carries its own
 * `taxRate` / `taxLabel`, defaulted from the company's invoicing settings at
 * creation time — read those off the invoice, never this constant.
 */
export const TAX_RATE = 0.0625;

/* ── Arithmetic ────────────────────────────────────────── */

/*
 * Declared up here because the demo seed is normalised at module load, below,
 * and would otherwise reach these before they are initialised.
 */

/**
 * Line totals, subtotal, tax and grand total.
 *
 * This is the builder's running preview and the demo dataset's arithmetic. A
 * saved live invoice carries the server's own figures — read `subtotal`,
 * `tax` and `total` off it rather than recomputing them here, since the tax
 * rate is per-invoice and the API may have added line items of its own.
 */
export const invoiceTotals = (items = []) => {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0),
    0,
  );
  const tax = subtotal * TAX_RATE;
  return { subtotal, tax, total: subtotal + tax };
};

/** The grand total, preferring the server's figure when there is one. */
export const invoiceTotal = (invoice) =>
  invoice?.total ?? invoiceTotals(invoice?.items).total;

export const lineTotal = (item) =>
  item?.amount ?? Number(item?.qty || 0) * Number(item?.price || 0);

/* ── Status vocabulary ─────────────────────────────────── */

export const INVOICE_STATUSES = [
  { id: 'draft', label: 'Draft' },
  { id: 'sent', label: 'Sent' },
  { id: 'paid', label: 'Paid' },
  { id: 'overdue', label: 'Overdue' },
];

/**
 * Toolbar tabs. `void` is deliberately not one: voiding is how an invoice is
 * deleted, so a voided record is hidden rather than browsable.
 */
export const INVOICE_TABS = [
  { id: 'all', label: 'All' },
  ...INVOICE_STATUSES,
  { id: 'void', label: 'Void' },
];

/** Sort ids are the API's own spelling, so they pass straight through. */
export const INVOICE_SORTS = [
  { id: 'newest', label: 'Newest first' },
  { id: 'amount_asc', label: 'Amount Low-High' },
  { id: 'amount_desc', label: 'Amount High-Low' },
  { id: 'client_asc', label: 'Client A-Z' },
  { id: 'client_desc', label: 'Client Z-A' },
];

export const statusLabel = (id) =>
  INVOICE_STATUSES.find((status) => status.id === id)?.label ??
  (id === 'void' ? 'Void' : id);

/**
 * Fallback issuer for the document's "FROM" block. The API doesn't put the
 * company on the invoice yet, so a live invoice falls back to the profile
 * store (`useIssuer`) and this only backs the demo dataset.
 */
export const ISSUER = {
  name: 'Service OS',
  address: '100 Innovation Drive, Suite 400, Austin, TX 78701',
  contact: '(555) 000-0000 · hello@serviceos.io',
  owner: 'John Doe',
  phone: '(555) 201-1001',
  email: 'm.johnson@gmail.com',
  location: 'New York, NY',
};

/* ── Seed data (demo mode only) ────────────────────────── */

const line = (description, qty, price) => ({
  id: `${description}-${qty}-${price}`,
  type: 'service',
  description,
  qty,
  price,
  amount: qty * price,
});

const toolsAndPlumbing = [line('Tools cost', 2, 20), line('Plumbing Service', 1, 80)];

const seed = [
  { id: 1, number: 'INV-0001', customer: 'JJ Thompson', customerId: null, billTo: { name: 'JJ Thompson', phone: '(555) 201-1001', email: 'jj.thompson@gmail.com', address: null }, created: 'Aug 12, 2026', createdTime: '1:00 PM', due: 'Aug 12, 2026', dueTime: '1:00 PM', status: 'paid', method: 'stripe', notes: 'Thank you for your business!', items: toolsAndPlumbing },
  { id: 2, number: 'INV-0002', customer: 'Samantha Lee', customerId: 2, created: 'Aug 13, 2026', createdTime: '1:00 PM', due: 'Aug 13, 2026', dueTime: '1:00 PM', status: 'draft', method: 'stripe', notes: '', items: [line('Furnace Installation', 1, 780)] },
  { id: 3, number: 'INV-0003', customer: 'Jessica Taylor', customerId: 3, created: 'Aug 13, 2026', createdTime: '1:00 PM', due: 'Aug 13, 2026', dueTime: '1:00 PM', status: 'sent', method: 'ach', notes: 'Thank you for your business!', items: [line('Leak Diagnosis', 1, 120), line('Pipe Replacement', 1, 460)] },
  { id: 4, number: 'INV-0004', customer: 'David Wilson', customerId: 4, created: 'Aug 14, 2026', createdTime: '1:00 PM', due: 'Aug 14, 2026', dueTime: '1:00 PM', status: 'overdue', method: 'stripe', notes: 'Payment is past due — please settle at your earliest convenience.', items: [line('Panel Upgrade', 1, 640), line('Permit Fee', 1, 90)] },
  { id: 5, number: 'INV-0005', customer: 'Robert Anderson', customerId: 5, created: 'Aug 14, 2026', createdTime: '1:00 PM', due: 'Aug 14, 2026', dueTime: '1:00 PM', status: 'paid', method: 'check', notes: 'Thank you for your business!', items: [line('Roof Inspection', 1, 180)] },
  { id: 6, number: 'INV-0006', customer: 'Emily Davis', customerId: 6, created: 'Aug 15, 2026', createdTime: '1:00 PM', due: 'Aug 15, 2026', dueTime: '1:00 PM', status: 'paid', method: 'stripe', notes: 'Thank you for your business!', items: [line('Tankless Heater', 1, 1240), line('Installation', 4, 65)] },
  { id: 7, number: 'INV-0007', customer: 'Carlos Mendez', customerId: 7, created: 'Aug 15, 2026', createdTime: '1:00 PM', due: 'Aug 15, 2026', dueTime: '1:00 PM', status: 'paid', method: 'cash', notes: '', items: [line('Rooftop Tune-up', 2, 210)] },
  { id: 8, number: 'INV-0008', customer: 'Priya Sharma', customerId: 8, created: 'Aug 16, 2026', createdTime: '1:00 PM', due: 'Aug 16, 2026', dueTime: '1:00 PM', status: 'sent', method: 'ach', notes: 'Net 30 payment terms.', items: [line('Garage Door Opener', 1, 320), line('Labour', 3, 60)] },
  { id: 9, number: 'INV-0009', customer: 'Olivia Martinez', customerId: 9, created: 'Aug 16, 2026', createdTime: '1:00 PM', due: 'Aug 16, 2026', dueTime: '1:00 PM', status: 'sent', method: 'stripe', notes: '', items: [line('Septic Pump-out', 1, 390)] },
  { id: 10, number: 'INV-0010', customer: 'James Nakamura', customerId: 10, created: 'Aug 17, 2026', createdTime: '1:00 PM', due: 'Aug 17, 2026', dueTime: '1:00 PM', status: 'sent', method: 'stripe', notes: 'Send a copy to the office manager.', items: [line('Window Unit', 6, 410), line('Removal & Disposal', 1, 220)] },
  { id: 11, number: 'INV-0011', customer: "Sarah O'Brien", customerId: 11, created: 'Aug 18, 2026', createdTime: '1:00 PM', due: 'Aug 18, 2026', dueTime: '1:00 PM', status: 'sent', method: 'check', notes: '', items: [line('Boiler Service', 1, 340)] },
  { id: 12, number: 'INV-0012', customer: 'Marcus Chen', customerId: 12, created: 'Aug 18, 2026', createdTime: '1:00 PM', due: 'Aug 18, 2026', dueTime: '1:00 PM', status: 'sent', method: 'stripe', notes: 'Thank you for your business!', items: [line('Drain Cleaning', 2, 145)] },
  { id: 13, number: 'INV-0013', customer: 'Michael Johnson', customerId: 1, created: 'Aug 19, 2026', createdTime: '1:00 PM', due: 'Aug 19, 2026', dueTime: '1:00 PM', status: 'sent', method: 'stripe', notes: '', items: [line('Duct Sealing', 1, 520)] },
  { id: 14, number: 'INV-0014', customer: 'Samantha Lee', customerId: 2, created: 'Aug 19, 2026', createdTime: '1:00 PM', due: 'Aug 19, 2026', dueTime: '1:00 PM', status: 'sent', method: 'ach', notes: '', items: [line('Thermostat', 2, 130), line('Setup', 1, 60)] },
  { id: 15, number: 'INV-0015', customer: 'Jessica Taylor', customerId: 3, created: 'Aug 20, 2026', createdTime: '1:00 PM', due: 'Aug 20, 2026', dueTime: '1:00 PM', status: 'sent', method: 'stripe', notes: '', items: [line('Emergency Callout', 1, 175)] },
  { id: 16, number: 'INV-0016', customer: 'David Wilson', customerId: 4, created: 'Aug 20, 2026', createdTime: '1:00 PM', due: 'Aug 20, 2026', dueTime: '1:00 PM', status: 'sent', method: 'stripe', notes: '', items: [line('Outlet Rewiring', 8, 45)] },
  { id: 17, number: 'INV-0017', customer: 'Emily Davis', customerId: 6, created: 'Aug 21, 2026', createdTime: '1:00 PM', due: 'Aug 21, 2026', dueTime: '1:00 PM', status: 'sent', method: 'check', notes: '', items: [line('Water Softener', 1, 690)] },
  { id: 18, number: 'INV-0018', customer: 'Carlos Mendez', customerId: 7, created: 'Aug 21, 2026', createdTime: '1:00 PM', due: 'Aug 21, 2026', dueTime: '1:00 PM', status: 'sent', method: 'stripe', notes: '', items: [line('Filter Replacement', 4, 35), line('Service Call', 1, 90)] },
  { id: 19, number: 'INV-0019', customer: 'Priya Sharma', customerId: 8, created: 'Aug 22, 2026', createdTime: '1:00 PM', due: 'Aug 22, 2026', dueTime: '1:00 PM', status: 'sent', method: 'ach', notes: '', items: [line('Quarterly Maintenance', 1, 880)] },
  { id: 20, number: 'INV-0020', customer: 'James Nakamura', customerId: 10, created: 'Aug 22, 2026', createdTime: '1:00 PM', due: 'Aug 22, 2026', dueTime: '1:00 PM', status: 'sent', method: 'stripe', notes: '', items: [line('Skylight Reseal', 1, 430)] },
  { id: 21, number: 'INV-0021', customer: 'Marcus Chen', customerId: 12, created: 'Aug 23, 2026', createdTime: '1:00 PM', due: 'Aug 23, 2026', dueTime: '1:00 PM', status: 'draft', method: 'stripe', notes: '', items: [line('Sump Pump', 1, 260)] },
  { id: 22, number: 'INV-0022', customer: 'Olivia Martinez', customerId: 9, created: 'Aug 23, 2026', createdTime: '1:00 PM', due: 'Aug 23, 2026', dueTime: '1:00 PM', status: 'sent', method: 'stripe', notes: '', items: [line('Backflow Test', 1, 150)] },
];

/**
 * Gives a demo record the derived fields a live one arrives with, so both
 * modes hand the screens the same object.
 */
const withTotals = (invoice) => {
  const { subtotal, tax, total } = invoiceTotals(invoice.items);
  return {
    taxLabel: 'Sales Tax',
    taxRate: TAX_RATE * 100,
    currency: 'USD',
    jobIds: [],
    issuer: null,
    billTo: invoice.billTo ?? null,
    ...invoice,
    subtotal,
    tax,
    total,
    // Set after the spread so it tracks a status change rather than carrying
    // a stale value in from storage. Demo mode stores no derived "overdue",
    // so the two are always the same here.
    apiStatus: invoice.status,
  };
};

/* ── Store ─────────────────────────────────────────────── */

const read = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return (stored ? JSON.parse(stored) : seed).map(withTotals);
  } catch {
    return seed.map(withTotals);
  }
};

// Live mode starts empty and fills from the API; demo mode starts seeded.
let invoices = isLiveMode() ? [] : read();
const listeners = new Set();

const notify = () => listeners.forEach((listener) => listener());

const commit = (next) => {
  invoices = next;
  try {
    // Only the demo dataset is mirrored to storage; live data belongs to the API.
    if (!isLiveMode()) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
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

const getSnapshot = () => invoices;

/* ── Live mode ─────────────────────────────────────────── */

let hydrating = null;
// Demo data is present from the first render; live data arrives over the wire.
let loaded = !isLiveMode();

const refreshFromApi = async () => {
  invoices = await listInvoicesApi();
  loaded = true;
  notify();
};

/**
 * Kicked off from the read hooks so a live screen loads its data by being
 * rendered. The in-flight promise is shared, so mounting several invoice
 * screens fetches once.
 */
const ensureLiveData = () => {
  if (!isLiveMode() || hydrating) return;
  hydrating = refreshFromApi().catch(() => {
    // Leaves the list empty; the next mount retries.
    hydrating = null;
  });
};

/** Re-reads after a write, since the API owns totals, numbering and status. */
const reloadLive = () => refreshFromApi().catch(() => {});

/* ── Reading ───────────────────────────────────────────── */

const parseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

/** Demo-mode comparators, matching what the API's `sort` values do. */
const comparators = {
  newest: (a, b) => parseDate(b.created) - parseDate(a.created),
  amount_asc: (a, b) => invoiceTotal(a) - invoiceTotal(b),
  amount_desc: (a, b) => invoiceTotal(b) - invoiceTotal(a),
  client_asc: (a, b) => a.customer.localeCompare(b.customer),
  client_desc: (a, b) => b.customer.localeCompare(a.customer),
};

const matchesInvoice = (invoice, term) =>
  invoice.number.toLowerCase().includes(term) ||
  invoice.customer.toLowerCase().includes(term);

/**
 * One page of invoices for the table, plus the headline figures above it.
 *
 * Live mode asks the API, which does the status filtering, sorting, counting
 * and slicing and returns the summary; demo mode applies the same operations
 * locally so the controls behave identically.
 *
 * Two caveats carried over from `api/invoices.js`, both waiting on backend
 * work: the search term only narrows the page already fetched, and `overdue`
 * is derived from the due date rather than stored.
 */
export const fetchInvoicesPage = async ({
  page = 1,
  limit = 20,
  search = '',
  status = 'all',
  sort = 'newest',
} = {}) => {
  if (isLiveMode()) {
    return listInvoicesPageApi({ page, limit, search, status, sort });
  }

  const term = search.trim().toLowerCase();
  const matched = invoices
    .filter((invoice) => {
      if (status !== 'void' && invoice.status === 'void') return false;
      if (status !== 'all' && invoice.status !== status) return false;
      if (term && !matchesInvoice(invoice, term)) return false;
      return true;
    })
    .sort(comparators[sort] ?? comparators.newest);

  const totalCount = matched.length;
  const start = (page - 1) * limit;

  const live = invoices.filter((invoice) => invoice.status !== 'void');
  const pending = live.filter(
    (invoice) => invoice.status === 'sent' || invoice.status === 'overdue',
  );

  const statusCounts = {
    all: live.length,
    draft: countByStatus(invoices, 'draft'),
    sent: countByStatus(invoices, 'sent'),
    paid: countByStatus(invoices, 'paid'),
    overdue: countByStatus(invoices, 'overdue'),
    void: countByStatus(invoices, 'void'),
  };

  return {
    items: matched.slice(start, start + limit),
    summary: {
      totalInvoiceAmount: live.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0),
      pendingCount: pending.length,
      pendingAmount: pending.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0),
      sentThisMonth: live.filter((invoice) => invoice.status !== 'draft').length,
    },
    statusCounts,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 0,
    },
  };
};

/** One invoice, with its line items and the recipient snapshot. */
export const fetchInvoice = async (id) => {
  if (isLiveMode()) return getInvoiceApi(id);
  return invoices.find((invoice) => String(invoice.id) === String(id)) ?? null;
};

/* ── Mutators ──────────────────────────────────────────── */

/** Next free invoice number for the demo dataset. Live numbering is the API's. */
export const nextInvoiceNumber = () => {
  const highest = invoices.reduce((max, invoice) => {
    const digits = Number(String(invoice.number).replace(/\D/g, ''));
    return Number.isNaN(digits) ? max : Math.max(max, digits);
  }, 0);
  return `INV-${String(highest + 1).padStart(4, '0')}`;
};

/**
 * Creates the invoice. It always lands as a draft — `sendInvoice` is what
 * issues it, and the builder's "Create Invoice" runs the two in sequence.
 */
export const addInvoice = async (input) => {
  if (isLiveMode()) {
    const created = await createInvoiceApi(input);
    await reloadLive();
    return created;
  }

  const id = invoices.reduce((max, invoice) => Math.max(max, invoice.id), 0) + 1;
  const invoice = withTotals({
    id,
    number: nextInvoiceNumber(),
    customer: '',
    customerId: null,
    created: '',
    createdTime: '1:00 PM',
    due: '',
    dueTime: '1:00 PM',
    status: 'draft',
    method: 'stripe',
    notes: '',
    billTo: null,
    items: [],
    ...input,
  });
  commit([...invoices, invoice]);
  return invoice;
};

/** Draft-only on the API — a sent or paid invoice comes back as a 409. */
export const updateInvoice = async (id, patch) => {
  if (isLiveMode()) {
    const updated = await updateInvoiceApi(id, patch);
    await reloadLive();
    return updated;
  }

  const next = invoices.map((invoice) =>
    invoice.id === id ? withTotals({ ...invoice, ...patch }) : invoice,
  );
  commit(next);
  return next.find((invoice) => invoice.id === id) ?? null;
};

/**
 * Issues the invoice. Nothing is emailed or texted — the endpoint only moves
 * the status to `sent` and stamps `sentAt`.
 */
export const sendInvoice = async (id) => {
  if (isLiveMode()) {
    const sent = await sendInvoiceApi(id);
    await reloadLive();
    return sent;
  }
  return updateInvoice(id, { status: 'sent' });
};

/**
 * Records the invoice as settled. No payment is taken and no processor is
 * involved on either side — this is the manual mark-as-paid only.
 */
export const payInvoice = async (id, method) => {
  if (isLiveMode()) {
    const paid = await payInvoiceApi(id, method);
    await reloadLive();
    return paid;
  }
  return updateInvoice(id, { status: 'paid', ...(method ? { method } : null) });
};

/**
 * Voids the invoice — the API's delete is a soft void and only accepts a
 * draft, so an issued invoice cannot be taken off the books this way.
 */
export const removeInvoice = async (id) => {
  if (isLiveMode()) {
    await voidInvoiceApi(id);
    await reloadLive();
    return;
  }
  commit(invoices.filter((invoice) => invoice.id !== id));
};

/**
 * Fetches the server-rendered PDF and hands it to the browser. In demo mode
 * there is no document to fetch, so the print dialog stands in.
 */
export const downloadInvoicePdf = async (invoice) => {
  if (!isLiveMode()) {
    window.print();
    return;
  }

  const blob = await fetchInvoicePdfApi(invoice.id);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${invoice.number || 'invoice'}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoked on the next tick so the download has taken the handle.
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

/** Restores the seed records — demo mode only. */
export const resetInvoices = () => {
  if (isLiveMode()) return;
  commit(seed.map(withTotals));
};

/* ── Hooks ─────────────────────────────────────────────── */

/**
 * The whole collection, for the global search index and the dashboard
 * rollups. The invoices table doesn't use this — it pages through
 * `fetchInvoicesPage` instead.
 */
export const useInvoices = () => {
  ensureLiveData();
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};

export const useInvoice = (id) =>
  useInvoices().find((invoice) => String(invoice.id) === String(id));

/**
 * Counts for the toolbar tabs, or `null` when they can't be known.
 *
 * The demo dataset is entirely in hand, so every tab can be labelled. The API
 * returns one page at a time and no per-status counts, so live mode has
 * nothing to count without fetching the whole book — the tabs render
 * unlabelled instead. Point this at the backend's `statusCounts` when it
 * lands.
 */
export const useInvoiceTabCounts = () => {
  const all = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (isLiveMode()) return null;
  return Object.fromEntries(
    INVOICE_TABS.map((tab) => [tab.id, countByStatus(all, tab.id)]),
  );
};

export const useInvoicesLoaded = () =>
  useSyncExternalStore(subscribe, () => loaded, () => loaded);

/**
 * The contact block printed under "BILL TO".
 *
 * A live invoice carries its own recipient snapshot, taken when it was
 * issued, so the document still reads correctly after the customer record is
 * edited — that is preferred over anything looked up now.
 */
export const billToOf = (invoice) => {
  if (!invoice) return null;

  const snapshot = invoice.billTo ?? null;
  const address = snapshot?.address ?? null;
  const location = address
    ? [address.city, address.state].filter(Boolean).join(', ')
    : snapshot?.location ?? '';

  return {
    name: snapshot?.name || invoice.customer || '',
    phone: snapshot?.phone ?? '',
    email: snapshot?.email ?? '',
    location,
    address,
  };
};

/* ── Helpers ───────────────────────────────────────────── */

let lineItemId = 0;

/** Fresh empty line item — the builder always keeps one at the end of the list. */
export const blankLineItem = () => ({
  id: `new-${(lineItemId += 1)}`,
  type: 'service',
  description: '',
  qty: 0,
  price: 0,
});

export const isBlankLineItem = (item) =>
  !String(item.description ?? '').trim() && !Number(item.qty) && !Number(item.price);

/**
 * "$132.50" — drops the decimals on whole amounts, the way the design shows
 * "$120" next to "$12.50".
 */
export const formatMoney = (amount) => {
  const value = Number(amount || 0);
  const decimals = Number.isInteger(value) ? 0 : 2;
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Count of invoices per tab id.
 *
 * Only meaningful over a complete list, which is demo mode: the API returns
 * one page at a time and no per-status counts, so the live table passes
 * `null` and the tabs render unlabelled. Wire this to a `statusCounts` block
 * once the backend provides one.
 */
export const countByStatus = (records, statusId) => {
  if (!records) return null;
  return statusId === 'all'
    ? records.length
    : records.filter((invoice) => invoice.status === statusId).length;
};
