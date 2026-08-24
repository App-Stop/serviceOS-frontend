/**
 * Prototype profile & settings store.
 *
 * Holds the three settings groups shown on the Profile screen (account,
 * branding, business) in memory, mirrored to localStorage so edits survive a
 * refresh, and notifies subscribers on every change.
 *
 * Panels edit a *draft* copy via `useSettingsDraft` and only commit on Save,
 * which is what makes the Reset / Save pair in the Figma meaningful.
 */

import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';

const STORAGE_PROFILE_KEY = 'serviceos.profile.v1';

/* ── Settings navigation ─────────────────────────────────── */

export const SETTINGS_SECTIONS = [
  { id: 'account', label: 'Account', icon: 'circle-user-round' },
  { id: 'branding', label: 'Branding', icon: 'palette' },
  { id: 'business', label: 'Business Info', icon: 'warehouse' },
  { id: 'services', label: 'Services', icon: 'tool-case' },
  { id: 'invoicing', label: 'Invoicing & Tax', icon: 'receipt-text' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'integrations', label: 'Integrations', icon: 'unplug', badge: 3 },
  { id: 'import', label: 'Import', icon: 'import' },
  { id: 'billing', label: 'Billing', icon: 'credit-card' },
];

/* Page heading copy, keyed by section so the header stays data driven. */
export const SECTION_HEADINGS = {
  account: { title: 'Account', subtitle: 'Manage your personal account' },
  branding: {
    title: 'Branding',
    subtitle: 'Customize your logo, colors, document styling, and invoice templates',
  },
  business: {
    title: 'Business Info',
    subtitle: 'Configure company details, operating model, and service territory',
  },
  services: { title: 'Services', subtitle: 'Manage the service catalog offered to customers' },
  invoicing: { title: 'Invoicing & Tax', subtitle: 'Numbering, tax rates, and payment collection' },
  notifications: { title: 'Notifications', subtitle: 'Choose what you get notified about' },
  integrations: { title: 'Integrations', subtitle: 'Connect ServiceOS to the tools you already use' },
  import: { title: 'Import', subtitle: 'Bring customers, jobs, and invoices in from a spreadsheet' },
  billing: { title: 'Billing', subtitle: 'Manage your subscription, seats, and payment method' },
};

/* ── Field options ───────────────────────────────────────── */

export const ROLE_OPTIONS = [
  'Super Admin (Owner)',
  'Admin',
  'Dispatcher',
  'Lead Technician',
  'Technician',
];

export const TIME_ZONE_OPTIONS = [
  'US & Canada (UTC-06:00)',
  'Pacific Time (UTC-08:00)',
  'Mountain Time (UTC-07:00)',
  'Eastern Time (UTC-05:00)',
  'UTC (UTC+00:00)',
];

export const TIME_FORMAT_OPTIONS = ['12-hour', '24-hour'];

export const SERVICE_AREA_OPTIONS = ['10mi', '20mi', '30mi', '50mi', '100mi', 'Statewide'];

export const PAYMENT_TERM_OPTIONS = [
  'Due on Receipt',
  'Net 7 (7 Days)',
  'Net 15 (15 Days)',
  'Net 30 (30 Days)',
  'Net 60 (60 Days)',
];

/* Wireframe descriptors for the invoice layout thumbnails. Each preview is
   composed from these primitives rather than a bitmap so it re-themes with
   the rest of the UI. */
export const INVOICE_LAYOUTS = [
  {
    id: 'left-aligned',
    name: 'Left Aligned',
    description: 'Modern left-header with balance',
    preview: 'left',
  },
  {
    id: 'bold-header',
    name: 'Bold Header',
    description: 'Prominent company header',
    preview: 'bold',
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Standard clean corporate format',
    preview: 'classic',
  },
  {
    id: 'centered',
    name: 'Centered',
    description: 'Symmetrical logo & center-aligned info',
    preview: 'centered',
  },
];

export const INVOICE_THEMES = [
  { id: 'default', label: 'Default', color: '#ffffff' },
  { id: 'pink', label: 'Pink', color: '#ff1fad' },
  { id: 'violet', label: 'Violet', color: '#903bff' },
  { id: 'green', label: 'Green', color: '#00c064' },
  { id: 'cyan', label: 'Cyan', color: '#00c9c6' },
  { id: 'red', label: 'Red', color: '#f30000' },
  { id: 'orange', label: 'Orange', color: '#f96c00' },
  { id: 'blue', label: 'Blue', color: '#0095ff' },
  { id: 'yellow', label: 'Yellow', color: '#edba00' },
];

export const DISPATCH_MODELS = [
  {
    id: 'solo',
    icon: 'user-round',
    name: 'Solo Technicians',
    description:
      'Assign jobs directly to individual technicians. Best for smaller teams where everyone works independently.',
  },
  {
    id: 'crew',
    icon: 'users-round',
    name: 'Technicians + Crew',
    description:
      'Organize technicians into crews with a lead. Assign jobs to entire crews. Great for larger teams or paired work.',
  },
];

export const INDUSTRY_CATEGORIES = [
  { id: 'plumbing', label: 'Plumbing', icon: 'wrench' },
  { id: 'electrical', label: 'Electrical', icon: 'zap' },
  { id: 'hvac', label: 'HVAC', icon: 'thermometer-snowflake' },
  { id: 'cleaning', label: 'Cleaning', icon: 'brush-cleaning' },
  { id: 'landscaping', label: 'Landscaping', icon: 'tree-deciduous' },
  { id: 'construction', label: 'Construction', icon: 'construction' },
  { id: 'other', label: 'Other' },
];

/* ── Seed ────────────────────────────────────────────────── */

export const SEED_PROFILE = {
  account: {
    fullName: 'John Smith',
    email: 'johnsmith@summitplumbing.com',
    phone: '(555) 000-0000',
    role: 'Super Admin (Owner)',
    photo: '',
    useWorkspaceTimezone: true,
    timeZone: 'US & Canada (UTC-06:00)',
    timeFormat: '12-hour',
  },
  branding: {
    logo: '',
    headerCover: '',
    invoiceLayout: 'left-aligned',
    invoiceTheme: 'default',
    paymentTerms: 'Net 15 (15 Days)',
    invoiceNote: 'Thank you for choosing ServiceOS for your service needs.',
  },
  business: {
    companyName: 'ServiceOS',
    supportEmail: 'hello@serviceos.io',
    phone: '(555) 000-0000',
    serviceArea: '30mi',
    address: '100 Innovation Drive, Suite 400, Austin, TX 78701',
    dispatchModel: 'crew',
    industry: 'plumbing',
  },
  invoicing: {
    enableSalesTax: true,
    taxLabel: 'Sales Tax',
    taxRate: '6.25',
    currency: 'USD ($)',
    invoicePrefix: 'INV-',
    paymentMethods: {
      cards: true,
      ach: true,
      cash: true,
      check: true,
    },
  },
  notifications: {
    appointmentConfirmation: true,
    reminder24h: false,
    reminder1h: true,
    techEnRoute: true,
    jobCompleted: false,
    feedbackRequest: true,
    userAlerts: {
      jobAlerts: { push: true, email: true },
      newCustomer: { push: true, email: true },
      newInvoice: { push: true, email: true },
      teamUpdates: { push: true, email: true },
    },
  },
  integrations: {
    stripe: false,
    twilio: false,
    googleCalendar: false,
    paypal: false,
    quickbooks: false,
  },
};

/* ── Store ───────────────────────────────────────────────── */

const readStore = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);
    /* Merge section-by-section so a stored copy written before a field was
       added still picks the new default up. */
    return {
      account: { ...fallback.account, ...parsed.account },
      branding: { ...fallback.branding, ...parsed.branding },
      business: { ...fallback.business, ...parsed.business },
      invoicing: { ...fallback.invoicing, ...parsed.invoicing },
      notifications: { ...fallback.notifications, ...parsed.notifications },
      integrations: { ...fallback.integrations, ...parsed.integrations },
    };
  } catch {
    return fallback;
  }
};

const writeStore = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
};

let profile = readStore(STORAGE_PROFILE_KEY, SEED_PROFILE);
const listeners = new Set();

const notify = () => listeners.forEach((cb) => cb());
const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

const commit = (next) => {
  profile = next;
  writeStore(STORAGE_PROFILE_KEY, profile);
  notify();
};

export const useProfile = () =>
  useSyncExternalStore(subscribe, () => profile, () => profile);

export const useProfileSection = (section) => useProfile()[section];

export const updateProfileSection = (section, patch) =>
  commit({ ...profile, [section]: { ...profile[section], ...patch } });

export const resetProfileSection = (section) =>
  commit({ ...profile, [section]: SEED_PROFILE[section] });

export const resetProfile = () => commit(SEED_PROFILE);

/**
 * Identity shown in the sidebar and anywhere the signed-in user is named.
 * Derived from the account section so a rename propagates app wide.
 */
export const useCurrentUser = () => {
  const account = useProfileSection('account');

  return useMemo(
    () => ({
      name: account.fullName,
      /* The sidebar shows the short role, not the parenthetical owner note. */
      role: account.role.replace(/\s*\(.*\)$/, ''),
      email: account.email,
      photo: account.photo,
    }),
    [account],
  );
};

/**
 * Draft editing for one settings section.
 *
 * Returns the working copy plus `save` / `reset`, and a `dirty` flag the
 * panels use to disable Save until something actually changed.
 */
export const useSettingsDraft = (section) => {
  const stored = useProfileSection(section);
  const [draft, setDraft] = useState(stored);
  /* Tracks which stored snapshot the draft was seeded from, so an external
     change (e.g. Reset all data) re-seeds it without clobbering live edits. */
  const [base, setBase] = useState(stored);

  if (base !== stored) {
    setBase(stored);
    setDraft(stored);
  }

  const setField = useCallback(
    (field, value) => setDraft((current) => ({ ...current, [field]: value })),
    [],
  );

  const save = useCallback(() => updateProfileSection(section, draft), [section, draft]);

  const reset = useCallback(() => setDraft(stored), [stored]);

  const dirty = useMemo(
    () => Object.keys(draft).some((key) => draft[key] !== stored[key]),
    [draft, stored],
  );

  return { draft, setField, save, reset, dirty };
};

/* ── Branding applied to generated documents ─────────────── */

/**
 * The company block printed at the top of every invoice, assembled from the
 * Business Info and Branding settings so editing either one re-brands the
 * documents immediately.
 */
export const useIssuer = () => {
  const business = useProfileSection('business');
  const branding = useProfileSection('branding');

  return useMemo(
    () => ({
      name: business.companyName,
      address: business.address,
      contact: [business.phone, business.supportEmail].filter(Boolean).join(' · '),
      logo: branding.logo,
    }),
    [business, branding],
  );
};

/** The invoice document layout chosen under Branding → Invoice Layout. */
export const useInvoiceLayout = () => useProfileSection('branding').invoiceLayout;
