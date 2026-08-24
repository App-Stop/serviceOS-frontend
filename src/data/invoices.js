/**
 * Prototype invoice store.
 *
 * Same shape as the customer and job stores: records live in memory, are
 * mirrored to localStorage so edits survive a refresh, and every change
 * notifies subscribers. Swap the mutators for API calls once a database is
 * wired up — the hooks and their call sites stay the same.
 */

import { useSyncExternalStore } from 'react';
import { useCustomers } from './customers';

const STORAGE_KEY = 'serviceos.invoices.v1';

/** Sales tax the Figma invoice applies to every subtotal. */
export const TAX_RATE = 0.0625;

/* ── Status vocabulary ─────────────────────────────────── */

export const INVOICE_STATUSES = [
  { id: 'draft', label: 'Draft' },
  { id: 'sent', label: 'Sent' },
  { id: 'paid', label: 'Paid' },
  { id: 'overdue', label: 'Overdue' },
];

/** Toolbar tabs, in the order the design lists them. */
export const INVOICE_TABS = [
  { id: 'all', label: 'All' },
  ...INVOICE_STATUSES,
];

export const INVOICE_SORTS = [
  { id: 'newest', label: 'Newest first' },
  { id: 'amount-asc', label: 'Amount Low-High' },
  { id: 'amount-desc', label: 'Amount High-Low' },
  { id: 'client-asc', label: 'Client A-Z' },
  { id: 'client-desc', label: 'Client Z-A' },
];

/** Line item units offered by the description row's dropdown. */
export const LINE_UNITS = ['Item', 'Job', 'Hour', 'Day', 'Visit'];

export const PAYMENT_METHODS = ['Stripe', 'Bank Transfer', 'Cash', 'Card'];

export const statusLabel = (id) =>
  INVOICE_STATUSES.find((status) => status.id === id)?.label ?? id;

/** The business the invoices are issued from — the "FROM" block. */
export const ISSUER = {
  name: 'Service OS',
  address: '100 Innovation Drive, Suite 400, Austin, TX 78701',
  contact: '(555) 000-0000 · hello@serviceos.io',
  owner: 'John Doe',
  phone: '(555) 201-1001',
  email: 'm.johnson@gmail.com',
  location: 'New York, NY',
};

/* ── Seed data (from the Figma invoices table) ─────────── */

const line = (description, unit, qty, price) => ({
  id: `${description}-${qty}-${price}`,
  description,
  unit,
  qty,
  price,
});

const toolsAndPlumbing = [line('Tools cost', 'Item', 2, 20), line('Plumbing Service', 'Job', 1, 80)];

const seed = [
  { id: 1, number: 'INV-0001', customer: 'JJ Thompson', customerId: null, billTo: { phone: '(555) 201-1001', email: 'jj.thompson@gmail.com', location: 'Texas, US' }, created: 'Aug 12, 2026', createdTime: '1:00 PM', due: 'Aug 12, 2026', dueTime: '1:00 PM', status: 'paid', method: 'Stripe', notes: 'Thank you for your business!', items: toolsAndPlumbing },
  { id: 2, number: 'INV-0002', customer: 'Samantha Lee', customerId: 2, created: 'Aug 13, 2026', createdTime: '1:00 PM', due: 'Aug 13, 2026', dueTime: '1:00 PM', status: 'draft', method: 'Stripe', notes: '', items: [line('Furnace Installation', 'Job', 1, 780)] },
  { id: 3, number: 'INV-0003', customer: 'Jessica Taylor', customerId: 3, created: 'Aug 13, 2026', createdTime: '1:00 PM', due: 'Aug 13, 2026', dueTime: '1:00 PM', status: 'sent', method: 'Bank Transfer', notes: 'Thank you for your business!', items: [line('Leak Diagnosis', 'Visit', 1, 120), line('Pipe Replacement', 'Job', 1, 460)] },
  { id: 4, number: 'INV-0004', customer: 'David Wilson', customerId: 4, created: 'Aug 14, 2026', createdTime: '1:00 PM', due: 'Aug 14, 2026', dueTime: '1:00 PM', status: 'overdue', method: 'Stripe', notes: 'Payment is past due — please settle at your earliest convenience.', items: [line('Panel Upgrade', 'Job', 1, 640), line('Permit Fee', 'Item', 1, 90)] },
  { id: 5, number: 'INV-0005', customer: 'Robert Anderson', customerId: 5, created: 'Aug 14, 2026', createdTime: '1:00 PM', due: 'Aug 14, 2026', dueTime: '1:00 PM', status: 'paid', method: 'Card', notes: 'Thank you for your business!', items: [line('Roof Inspection', 'Visit', 1, 180)] },
  { id: 6, number: 'INV-0006', customer: 'Emily Davis', customerId: 6, created: 'Aug 15, 2026', createdTime: '1:00 PM', due: 'Aug 15, 2026', dueTime: '1:00 PM', status: 'paid', method: 'Stripe', notes: 'Thank you for your business!', items: [line('Tankless Heater', 'Item', 1, 1240), line('Installation', 'Hour', 4, 65)] },
  { id: 7, number: 'INV-0007', customer: 'Carlos Mendez', customerId: 7, created: 'Aug 15, 2026', createdTime: '1:00 PM', due: 'Aug 15, 2026', dueTime: '1:00 PM', status: 'paid', method: 'Cash', notes: '', items: [line('Rooftop Tune-up', 'Job', 2, 210)] },
  { id: 8, number: 'INV-0008', customer: 'Priya Sharma', customerId: 8, created: 'Aug 16, 2026', createdTime: '1:00 PM', due: 'Aug 16, 2026', dueTime: '1:00 PM', status: 'sent', method: 'Bank Transfer', notes: 'Net 30 payment terms.', items: [line('Garage Door Opener', 'Item', 1, 320), line('Labour', 'Hour', 3, 60)] },
  { id: 9, number: 'INV-0009', customer: 'Olivia Martinez', customerId: 9, created: 'Aug 16, 2026', createdTime: '1:00 PM', due: 'Aug 16, 2026', dueTime: '1:00 PM', status: 'sent', method: 'Stripe', notes: '', items: [line('Septic Pump-out', 'Job', 1, 390)] },
  { id: 10, number: 'INV-0010', customer: 'James Nakamura', customerId: 10, created: 'Aug 17, 2026', createdTime: '1:00 PM', due: 'Aug 17, 2026', dueTime: '1:00 PM', status: 'sent', method: 'Stripe', notes: 'Send a copy to the office manager.', items: [line('Window Unit', 'Item', 6, 410), line('Removal & Disposal', 'Job', 1, 220)] },
  { id: 11, number: 'INV-0011', customer: "Sarah O'Brien", customerId: 11, created: 'Aug 18, 2026', createdTime: '1:00 PM', due: 'Aug 18, 2026', dueTime: '1:00 PM', status: 'sent', method: 'Card', notes: '', items: [line('Boiler Service', 'Job', 1, 340)] },
  { id: 12, number: 'INV-0012', customer: 'Marcus Chen', customerId: 12, created: 'Aug 18, 2026', createdTime: '1:00 PM', due: 'Aug 18, 2026', dueTime: '1:00 PM', status: 'sent', method: 'Stripe', notes: 'Thank you for your business!', items: [line('Drain Cleaning', 'Visit', 2, 145)] },
  { id: 13, number: 'INV-0013', customer: 'Michael Johnson', customerId: 1, created: 'Aug 19, 2026', createdTime: '1:00 PM', due: 'Aug 19, 2026', dueTime: '1:00 PM', status: 'sent', method: 'Stripe', notes: '', items: [line('Duct Sealing', 'Job', 1, 520)] },
  { id: 14, number: 'INV-0014', customer: 'Samantha Lee', customerId: 2, created: 'Aug 19, 2026', createdTime: '1:00 PM', due: 'Aug 19, 2026', dueTime: '1:00 PM', status: 'sent', method: 'Bank Transfer', notes: '', items: [line('Thermostat', 'Item', 2, 130), line('Setup', 'Hour', 1, 60)] },
  { id: 15, number: 'INV-0015', customer: 'Jessica Taylor', customerId: 3, created: 'Aug 20, 2026', createdTime: '1:00 PM', due: 'Aug 20, 2026', dueTime: '1:00 PM', status: 'sent', method: 'Stripe', notes: '', items: [line('Emergency Callout', 'Visit', 1, 175)] },
  { id: 16, number: 'INV-0016', customer: 'David Wilson', customerId: 4, created: 'Aug 20, 2026', createdTime: '1:00 PM', due: 'Aug 20, 2026', dueTime: '1:00 PM', status: 'sent', method: 'Stripe', notes: '', items: [line('Outlet Rewiring', 'Item', 8, 45)] },
  { id: 17, number: 'INV-0017', customer: 'Emily Davis', customerId: 6, created: 'Aug 21, 2026', createdTime: '1:00 PM', due: 'Aug 21, 2026', dueTime: '1:00 PM', status: 'sent', method: 'Card', notes: '', items: [line('Water Softener', 'Item', 1, 690)] },
  { id: 18, number: 'INV-0018', customer: 'Carlos Mendez', customerId: 7, created: 'Aug 21, 2026', createdTime: '1:00 PM', due: 'Aug 21, 2026', dueTime: '1:00 PM', status: 'sent', method: 'Stripe', notes: '', items: [line('Filter Replacement', 'Item', 4, 35), line('Service Call', 'Visit', 1, 90)] },
  { id: 19, number: 'INV-0019', customer: 'Priya Sharma', customerId: 8, created: 'Aug 22, 2026', createdTime: '1:00 PM', due: 'Aug 22, 2026', dueTime: '1:00 PM', status: 'sent', method: 'Bank Transfer', notes: '', items: [line('Quarterly Maintenance', 'Job', 1, 880)] },
  { id: 20, number: 'INV-0020', customer: 'James Nakamura', customerId: 10, created: 'Aug 22, 2026', createdTime: '1:00 PM', due: 'Aug 22, 2026', dueTime: '1:00 PM', status: 'sent', method: 'Stripe', notes: '', items: [line('Skylight Reseal', 'Job', 1, 430)] },
  { id: 21, number: 'INV-0021', customer: 'Marcus Chen', customerId: 12, created: 'Aug 23, 2026', createdTime: '1:00 PM', due: 'Aug 23, 2026', dueTime: '1:00 PM', status: 'draft', method: 'Stripe', notes: '', items: [line('Sump Pump', 'Item', 1, 260)] },
  { id: 22, number: 'INV-0022', customer: 'Olivia Martinez', customerId: 9, created: 'Aug 23, 2026', createdTime: '1:00 PM', due: 'Aug 23, 2026', dueTime: '1:00 PM', status: 'sent', method: 'Stripe', notes: '', items: [line('Backflow Test', 'Visit', 1, 150)] },
];

/* ── Store ─────────────────────────────────────────────── */

const read = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : seed;
  } catch {
    return seed;
  }
};

let invoices = read();
const listeners = new Set();

const commit = (next) => {
  invoices = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  } catch {
    // Storage unavailable (private mode / quota) — in-memory state still works.
  }
  listeners.forEach((listener) => listener());
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => invoices;

/* ── Mutators ──────────────────────────────────────────── */

/** Next free invoice number, e.g. "INV-0023". */
export const nextInvoiceNumber = () => {
  const highest = invoices.reduce((max, invoice) => {
    const digits = Number(invoice.number.replace(/\D/g, ''));
    return Number.isNaN(digits) ? max : Math.max(max, digits);
  }, 0);
  return `INV-${String(highest + 1).padStart(4, '0')}`;
};

export const addInvoice = (input) => {
  const id = invoices.reduce((max, invoice) => Math.max(max, invoice.id), 0) + 1;
  const invoice = {
    id,
    number: nextInvoiceNumber(),
    customer: '',
    customerId: null,
    created: '',
    createdTime: '1:00 PM',
    due: '',
    dueTime: '1:00 PM',
    status: 'draft',
    method: 'Stripe',
    notes: '',
    billTo: null,
    items: [],
    ...input,
  };
  commit([...invoices, invoice]);
  return invoice;
};

export const updateInvoice = (id, patch) => {
  commit(invoices.map((invoice) => (invoice.id === id ? { ...invoice, ...patch } : invoice)));
};

export const setInvoiceStatus = (id, status) => updateInvoice(id, { status });

export const removeInvoice = (id) => {
  commit(invoices.filter((invoice) => invoice.id !== id));
};

/** Restores the seed records — handy while clicking around the prototype. */
export const resetInvoices = () => commit(seed);

/* ── Hooks ─────────────────────────────────────────────── */

export const useInvoices = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

export const useInvoice = (id) =>
  useInvoices().find((invoice) => invoice.id === Number(id));

/**
 * The contact block printed under "BILL TO". Prefers the linked customer
 * record so edits made on the customer screen flow through, and falls back to
 * the details captured on the invoice itself for one-off recipients.
 */
export const useBillTo = (invoice) => {
  const customers = useCustomers();
  if (!invoice) return null;

  const customer = customers.find(
    (record) => record.id === invoice.customerId || record.name === invoice.customer,
  );

  return {
    name: invoice.customer,
    phone: customer?.phone ?? invoice.billTo?.phone ?? '',
    email: customer?.email ?? invoice.billTo?.email ?? '',
    location: customer?.locations?.[0] ?? invoice.billTo?.location ?? '',
  };
};

/* ── Helpers ───────────────────────────────────────────── */

/** Line totals, subtotal, tax and grand total for one invoice. */
export const invoiceTotals = (items = []) => {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0),
    0,
  );
  const tax = subtotal * TAX_RATE;
  return { subtotal, tax, total: subtotal + tax };
};

export const invoiceTotal = (invoice) => invoiceTotals(invoice.items).total;

export const lineTotal = (item) => Number(item.qty || 0) * Number(item.price || 0);

let lineItemId = 0;

/** Fresh empty line item — the builder always keeps one at the end of the list. */
export const blankLineItem = () => ({
  id: `new-${(lineItemId += 1)}`,
  description: '',
  unit: '',
  qty: 0,
  price: 0,
});

export const isBlankLineItem = (item) =>
  !item.description.trim() && !Number(item.qty) && !Number(item.price);

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

/** Count of invoices per tab id, used for the "All (22)" style labels. */
export const countByStatus = (records, statusId) =>
  statusId === 'all'
    ? records.length
    : records.filter((invoice) => invoice.status === statusId).length;
