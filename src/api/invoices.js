/**
 * `/invoices` adapter.
 *
 * Maps the API's invoice documents onto the shape the invoice screens already
 * read, and the screens' form state back onto the request bodies. Both the
 * create and the update validators are `.strict()`, so nothing may be sent
 * that isn't in the list below.
 *
 * Things the API does NOT do yet, and where this file works around them:
 *
 * - No `search` on `GET /invoices` — the term is applied to the fetched page
 *   on the client (see `matchesInvoice`). Move it into `params` once the
 *   backend takes it.
 * - No per-status counts, so the toolbar tabs can't be labelled "Draft (3)".
 * - Nothing ages a `sent` invoice into `overdue`, so it is derived here from
 *   `dueDate` (see `withDerivedStatus`).
 * - No issuer/company block on the response, so the "From" side of the
 *   document still comes from the local profile store. `invoice.issuer` is
 *   read through when the field appears.
 * - Line items have no `unit`, so the editor's unit column has nowhere to
 *   persist to and is not rendered.
 */

import api, { unwrap } from './client';

/** `GET /invoices` caps `limit` at 100 (ListInvoicesValidator). */
const MAX_PAGE_SIZE = 100;

/* ── Vocabulary ────────────────────────────────────────── */

/** The API's status enum, in lifecycle order. `void` is the delete path. */
export const INVOICE_STATUS_IDS = ['draft', 'sent', 'paid', 'overdue', 'void'];

/** `sort` as the API spells it — the screens use these ids verbatim. */
export const INVOICE_SORT_IDS = [
  'newest',
  'amount_asc',
  'amount_desc',
  'client_asc',
  'client_desc',
];

/**
 * The payment methods the API accepts. "Card" from the prototype has no
 * counterpart in the enum, so it is dropped; `check` and `paypal` are new.
 * Which of these a company actually offers lives in company settings under
 * `invoicing.acceptedPaymentMethods` — not wired up yet.
 */
export const PAYMENT_METHODS = [
  { id: 'stripe', label: 'Stripe' },
  { id: 'ach', label: 'Bank Transfer' },
  { id: 'cash', label: 'Cash' },
  { id: 'check', label: 'Check' },
  { id: 'paypal', label: 'PayPal' },
];

export const paymentMethodLabel = (id) =>
  PAYMENT_METHODS.find((method) => method.id === id)?.label ?? id ?? '';

/* ── Dates ─────────────────────────────────────────────── */

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** "Aug 24, 2026" — the date format the invoice screens read. */
export const toStoreDate = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

/** "9:00 AM" — the companion time, shown under the date in the table. */
export const toStoreTime = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/** "Aug 24, 2026" -> "2026-08-24", the value an `<input type="date">` wants. */
export const toDateInput = (label) => {
  if (!label) return '';
  const date = new Date(label);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/** Today as `yyyy-mm-dd`, for the date inputs' `min` — the API refuses the past. */
export const todayInput = () => toDateInput(new Date());

/**
 * `yyyy-mm-dd` -> an ISO instant at local midday.
 *
 * The API compares issue/due dates against its own start-of-today, so a bare
 * date sent as UTC midnight can land in "yesterday" for a server running west
 * of UTC. Midday keeps the intended day whichever side of the line it is on.
 */
export const toApiDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? '').trim());
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  return new Date(year, month - 1, day, 12, 0, 0).toISOString();
};

/* ── Invoice numbers ───────────────────────────────────── */

/**
 * `invoiceNumber` is a plain per-company counter; the "INV-" style label is
 * ours. The prefix is configurable under
 * `settings.invoicing.invoiceNumberPrefix`, which isn't read yet — hence the
 * default.
 */
export const formatInvoiceNumber = (value, prefix = 'INV-') =>
  value == null ? '' : `${prefix}${String(value).padStart(4, '0')}`;

/* ── Reading ───────────────────────────────────────────── */

const lineItemFromApi = (item, index) => ({
  id: `line-${index}`,
  type: item.type ?? 'service',
  description: item.description ?? '',
  qty: item.quantity ?? 1,
  price: item.unitPrice ?? 0,
  amount: item.amount ?? 0,
});

/**
 * Nothing on the server ages an unpaid invoice past its due date, so an
 * overdue invoice still reports itself as `sent`. Derived here so the Overdue
 * tab isn't permanently empty. Drop this once the backend runs the pass.
 */
const withDerivedStatus = (status, dueISO) => {
  if (status !== 'sent' || !dueISO) return status;
  const due = new Date(dueISO);
  if (Number.isNaN(due.getTime())) return status;
  const endOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate(), 23, 59, 59);
  return endOfDue.getTime() < Date.now() ? 'overdue' : status;
};

export const companyFromApi = (company) => {
  if (!company) return null;
  const addressParts = [company.address, company.serviceArea].filter(Boolean);
  const contactParts = [company.phone, company.email].filter(Boolean);
  return {
    name: company.name ?? '',
    address: addressParts.join(', '),
    serviceArea: company.serviceArea ?? '',
    phone: company.phone ?? '',
    email: company.email ?? '',
    contact: contactParts.join(' · '),
    logo: company.logoUrl ?? company.logoFileId ?? null,
    logoFileId: company.logoFileId ?? null,
  };
};

/**
 * Normalises an API invoice object onto the internal store shape.
 */
const invoiceFromApi = (invoice) => {
  if (!invoice) return null;

  const snapshot = invoice.customer ?? {};

  return {
    id: invoice._id,
    invoiceNumber: invoice.invoiceNumber ?? null,
    number: formatInvoiceNumber(invoice.invoiceNumber),

    customerId: invoice.customerId ?? null,
    customer: snapshot.businessName || snapshot.name || '',
    // The API snapshots the recipient onto the invoice, so the document
    // renders the details as they were when it was issued.
    billTo: {
      name: snapshot.businessName || snapshot.name || '',
      phone: snapshot.phone ?? '',
      email: snapshot.email ?? '',
      address: snapshot.billingAddress ?? null,
    },

    // Not populated by the API — the ids are all that come back.
    jobIds: invoice.jobIds ?? [],

    issueDate: invoice.issueDate ?? null,
    dueDate: invoice.dueDate ?? null,
    created: toStoreDate(invoice.issueDate),
    createdTime: toStoreTime(invoice.issueDate),
    due: toStoreDate(invoice.dueDate),
    dueTime: toStoreTime(invoice.dueDate),

    items: (invoice.lineItems ?? []).map(lineItemFromApi),

    // Totals are computed server-side; the screens display, never recompute.
    subtotal: invoice.subtotal ?? 0,
    taxLabel: invoice.taxLabel ?? 'Tax',
    taxRate: invoice.taxRate ?? 0,
    tax: invoice.taxAmount ?? 0,
    total: invoice.total ?? 0,
    currency: invoice.currency ?? 'USD',

    status: withDerivedStatus(invoice.status ?? 'draft', invoice.dueDate),
    // What the server actually holds, for the guards that care — only a real
    // `draft` may be edited or voided.
    apiStatus: invoice.status ?? 'draft',

    method: invoice.paymentMethod ?? null,
    notes: invoice.note ?? '',

    company: companyFromApi(invoice.company),
    issuer: companyFromApi(invoice.company) ?? (invoice.issuer ? {
      name: invoice.issuer.companyName ?? invoice.issuer.name ?? '',
      address: invoice.issuer.businessAddress ?? invoice.issuer.address ?? '',
      contact: [invoice.issuer.phone, invoice.issuer.email].filter(Boolean).join(' · '),
      phone: invoice.issuer.phone ?? '',
      email: invoice.issuer.email ?? '',
      logo: invoice.issuer.logoUrl ?? null,
    } : null),

    sentAt: invoice.sentAt ?? null,
    paidAt: invoice.paidAt ?? null,
    createdAt: invoice.createdAt ?? null,
  };
};

/* ── Writing ───────────────────────────────────────────── */

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

/**
 * A line item as `lineItemSchema` wants it. `amount` is mandatory and the
 * validator re-checks that it equals `quantity × unitPrice` to within a cent,
 * so it is always computed here rather than carried from the form.
 */
const lineItemToApi = (item) => {
  const quantity = Number(item.qty) || 0;
  const unitPrice = round2(item.price);
  return {
    type: item.type === 'tool' ? 'tool' : 'service',
    description: String(item.description ?? '').trim(),
    quantity,
    unitPrice,
    amount: round2(quantity * unitPrice),
  };
};

/**
 * `CreateInvoiceValidator` requires `customerId` and at least one job id — an
 * invoice is raised against work, not typed from scratch. The API then builds
 * a `service` line item per job from its labour cost, plus a `tool` item per
 * recorded equipment cost, and appends whatever is passed here.
 */
const createToApi = (form) => {
  const payload = {
    customerId: form.customerId,
    jobIds: form.jobIds ?? [],
  };

  const issueDate = toApiDate(form.issueDate);
  if (issueDate) payload.issueDate = issueDate;

  const dueDate = toApiDate(form.dueDate);
  if (dueDate) payload.dueDate = dueDate;

  const items = (form.items ?? []).map(lineItemToApi).filter((item) => item.amount > 0);
  if (items.length) payload.lineItems = items;

  if (form.method) payload.paymentMethod = form.method;

  const note = String(form.notes ?? '').trim();
  if (note) payload.note = note;

  return payload;
};

/**
 * `UpdateInvoiceValidator` is draft-only and a narrower field set — the
 * customer and the jobs an invoice was raised against cannot be changed.
 */
const updateToApi = (form) => {
  const payload = {};

  if (form.items !== undefined) {
    payload.lineItems = (form.items ?? [])
      .map(lineItemToApi)
      .filter((item) => item.amount > 0);
  }

  const issueDate = toApiDate(form.issueDate);
  if (issueDate) payload.issueDate = issueDate;

  const dueDate = toApiDate(form.dueDate);
  if (dueDate) payload.dueDate = dueDate;

  if (form.method) payload.paymentMethod = form.method;
  if (form.notes !== undefined) payload.note = String(form.notes ?? '').trim();

  return payload;
};

/* ── Endpoints ─────────────────────────────────────────── */

export const listInvoicesPageApi = async ({
  page = 1,
  limit = 20,
  status,
  customerId,
  sort = 'newest',
  search = '',
  dateFrom,
  dateTo,
} = {}) => {
  const params = { page, limit: Math.min(limit, MAX_PAGE_SIZE), sort };
  if (status && status !== 'all') params.status = status;
  if (customerId) params.customerId = customerId;
  if (dateFrom) params.dateFrom = dateFrom;
  if (dateTo) params.dateTo = dateTo;
  if (search && search.trim()) params.search = search.trim();

  const response = await api.get('/invoices', { params });
  const data = unwrap(response) ?? {};

  const items = (data.invoices ?? []).map(invoiceFromApi);

  return {
    items,
    // Headline figures for the stat cards, computed over the whole filtered
    // set rather than the current page. There is no overdue total in here —
    // the page subtitle uses the pending figure instead.
    summary: {
      totalInvoiceAmount: data.totalInvoiceAmount ?? 0,
      pendingCount: data.pendingInvoices?.count ?? 0,
      pendingAmount: data.pendingInvoices?.totalAmount ?? 0,
      sentThisMonth: data.invoicesSentThisMonth ?? 0,
    },
    statusCounts: data.statusCounts ?? null,
    pagination: response?.data?.pagination ?? {
      page,
      limit,
      totalCount: 0,
      totalPages: 0,
    },
  };
};

/**
 * Every invoice, for the global search index and the dashboard rollups. The
 * list is paged, so this walks the pages; the first response reports how many
 * there are.
 */
export const listInvoicesApi = async () => {
  const first = await listInvoicesPageApi({ page: 1, limit: MAX_PAGE_SIZE });
  const { totalPages = 1 } = first.pagination;

  if (totalPages <= 1) return first.items;

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      listInvoicesPageApi({ page: i + 2, limit: MAX_PAGE_SIZE }),
    ),
  );

  return rest.reduce((all, next) => all.concat(next.items), first.items);
};

/** Every invoice raised against one customer, for the customer detail screen. */
export const listCustomerInvoicesApi = async (customerId, { status } = {}) => {
  const response = await api.get(`/invoices/customer/${customerId}`, {
    params: status && status !== 'all' ? { status } : undefined,
  });
  const data = unwrap(response);
  return (Array.isArray(data) ? data : []).map(invoiceFromApi);
};

export const getInvoiceApi = async (id) => {
  const response = await api.get(`/invoices/${id}`);
  return invoiceFromApi(unwrap(response));
};

/** Always comes back as a `draft` — issuing it is a separate call to send. */
export const createInvoiceApi = async (form) => {
  const response = await api.post('/invoices', createToApi(form));
  return invoiceFromApi(unwrap(response));
};

/** 409s on anything but a draft. */
export const updateInvoiceApi = async (id, form) => {
  const response = await api.patch(`/invoices/${id}`, updateToApi(form));
  return invoiceFromApi(unwrap(response));
};

/**
 * Moves the invoice to `sent`. Despite the name nothing is emailed or texted
 * — the endpoint only stamps the status and `sentAt`.
 */
export const sendInvoiceApi = async (id) => {
  const response = await api.post(`/invoices/${id}/send`);
  return invoiceFromApi(unwrap(response));
};

/**
 * Manual mark-as-paid. There is no payment processing behind this on either
 * side yet — no charge is taken, the invoice is just recorded as settled.
 */
export const payInvoiceApi = async (id, paymentMethod) => {
  const response = await api.post(
    `/invoices/${id}/pay`,
    paymentMethod ? { paymentMethod } : {},
  );
  return invoiceFromApi(unwrap(response));
};

/** `DELETE` is a soft void, and only a draft may be voided. */
export const voidInvoiceApi = async (id) => {
  await api.delete(`/invoices/${id}`);
};

/**
 * `GET /invoices/:id/pdf` streams a real `application/pdf`, so it is fetched
 * as a blob — the auth header rides on the axios instance, which a bare
 * `window.open` of the URL would miss.
 */
export const fetchInvoicePdfApi = async (id) => {
  const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
  return new Blob([response.data], { type: 'application/pdf' });
};
