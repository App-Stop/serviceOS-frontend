import api, { unwrap, unwrapList } from './client';
import { normalizePhone } from './format';

/**
 * `GET /customers` caps `limit` at 100 (ListCustomersValidator), so anything
 * that wants every record has to walk the pages.
 */
const MAX_PAGE_SIZE = 100;

/* ── Addresses ─────────────────────────────────────────── */

/**
 * The API's address shape is `{ line1, city, state, zip }` — there is no
 * `street`, `postalCode` or `country` on `AddressSchema`, and the create
 * validator strips whatever it doesn't name, so those keys would silently
 * vanish. The forms bind to these four fields directly.
 */
export const ADDRESS_FIELDS = ['line1', 'city', 'state', 'zip'];

export const emptyAddress = () => ({ line1: '', city: '', state: '', zip: '' });

const addressFromApi = (address) => ({
  line1: address?.line1 ?? '',
  city: address?.city ?? '',
  state: address?.state ?? '',
  zip: address?.zip ?? '',
});

export const hasAddress = (address) =>
  ADDRESS_FIELDS.some((key) => String(address?.[key] ?? '').trim().length > 0);

/** Drops the blank fields; an address with nothing in it isn't sent at all. */
const addressToApi = (address) => {
  if (!hasAddress(address)) return undefined;

  return ADDRESS_FIELDS.reduce((payload, key) => {
    const value = String(address?.[key] ?? '').trim();
    if (value) payload[key] = value;
    return payload;
  }, {});
};

/** "12 Valley Rd, Plano TX 75024" — the one-line form the screens show. */
export const formatAddress = (address) => {
  if (!address) return '';
  const region = [
    [address.city, address.state].filter(Boolean).join(', '),
    address.zip,
  ]
    .filter(Boolean)
    .join(' ');

  return [address.line1, region].filter(Boolean).join(', ');
};

const locationFromApi = (location) => ({
  id: location?._id ?? null,
  label: location?.label ?? '',
  ...addressFromApi(location),
  isCurrent: Boolean(location?.isCurrent),
  source: location?.source ?? 'serviceLocation',
});

/* ── Customers ─────────────────────────────────────────── */

/**
 * The screens have always read `name`, `jobsCount`, `locations` and friends
 * from the prototype store, so the API record is mapped onto that same shape
 * rather than reshaping every call site.
 *
 * `GET /customers` only rolls up `totalJobs` / `totalBilled`; the rest of the
 * statistics come from `GET /customers/:id` and default to 0 here.
 */
export const customerFromApi = (customer) => {
  if (!customer) return null;

  const serviceLocations = (customer.serviceLocations ?? []).map(locationFromApi);
  const currentLocation = customer.currentLocation
    ? locationFromApi(customer.currentLocation)
    : null;

  // The tables render a plain list of places. The current location leads, and
  // it is skipped in the list below when it is one of the entries there.
  const locations = [
    currentLocation,
    ...serviceLocations.filter((loc) => !loc.isCurrent),
  ]
    .filter(Boolean)
    .map((loc) => formatAddress(loc) || loc.label)
    .filter(Boolean);

  return {
    id: customer._id,
    name: customer.fullName ?? '',
    businessName: customer.businessName ?? '',
    email: customer.email ?? '',
    phone: customer.phone ?? '',
    notes: customer.notes ?? '',

    billingAddress: addressFromApi(customer.billingAddress),
    serviceAddress: addressFromApi(customer.serviceAddress),
    serviceLocations,
    currentLocationId: customer.currentLocationId ?? null,
    currentLocation,

    locations,
    locationsCount: customer.locationsCount ?? serviceLocations.length,

    jobsCount: customer.totalJobs ?? 0,
    activeJobs: customer.activeJobs ?? 0,
    totalBilled: customer.totalBilled ?? 0,
    invoices: customer.totalInvoices ?? 0,
    lifetimeRevenue: customer.lifetimeRevenue ?? 0,
    outstandingBalance: customer.outstandingBalance ?? 0,

    createdAt: customer.createdAt ?? null,
    since: customer.createdAt ? new Date(customer.createdAt).getFullYear() : null,
  };
};

/**
 * `CreateCustomerValidator` is `.strict()`, so only the keys it names may be
 * sent — and an empty optional field is left out rather than sent as `""`,
 * which would fail the email / phone refinements.
 */
const customerToApi = (form) => {
  const payload = {};

  const fullName = String(form.name ?? '').trim();
  const businessName = String(form.businessName ?? '').trim();
  const email = String(form.email ?? '').trim();
  const phone = String(form.phone ?? '').trim();
  const notes = String(form.notes ?? '').trim();

  if (fullName) payload.fullName = fullName;
  if (businessName) payload.businessName = businessName;
  if (email) payload.email = email.toLowerCase();
  if (phone) payload.phone = normalizePhone(phone);
  if (notes) payload.notes = notes;

  const billingAddress = addressToApi(form.billingAddress);
  const serviceAddress = addressToApi(form.serviceAddress);
  if (billingAddress) payload.billingAddress = billingAddress;
  if (serviceAddress) payload.serviceAddress = serviceAddress;

  return payload;
};

export const listCustomersPageApi = async ({
  page = 1,
  limit = 20,
  search,
} = {}) => {
  const params = { page, limit: Math.min(limit, MAX_PAGE_SIZE) };
  if (search?.trim()) params.search = search.trim();

  const response = await api.get('/customers', { params });

  return {
    items: unwrapList(response).map(customerFromApi),
    pagination: response?.data?.pagination ?? {
      page,
      limit,
      totalCount: 0,
      totalPages: 0,
    },
  };
};

/** The whole book, for the pickers that need every name (jobs, invoices). */
export const listCustomersApi = async () => {
  const first = await listCustomersPageApi({ page: 1, limit: MAX_PAGE_SIZE });
  const { totalPages = 1 } = first.pagination;

  if (totalPages <= 1) return first.items;

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      listCustomersPageApi({ page: i + 2, limit: MAX_PAGE_SIZE }),
    ),
  );

  return rest.reduce((all, next) => all.concat(next.items), first.items);
};

/**
 * One customer with everything the detail screen shows: the rolled-up job and
 * invoice statistics, a page of job history, and the recent technician
 * activity across all of their jobs. `page` / `limit` page the job history.
 */
export const getCustomerApi = async (id, { page = 1, limit = 20 } = {}) => {
  const response = await api.get(`/customers/${id}`, {
    params: { page, limit: Math.min(limit, MAX_PAGE_SIZE) },
  });
  const data = unwrap(response);

  return {
    ...customerFromApi(data),
    jobs: (data?.jobHistory ?? []).map((job) => ({
      id: job._id,
      jobIdNumber: job.jobIdNumber ?? null,
      title: job.title ?? 'Untitled job',
      status: job.status ?? null,
      priority: job.priority ?? null,
      siteAddress: job.siteAddress ?? null,
      createdAt: job.createdAt ?? null,
    })),
    jobsPagination: data?.jobHistoryPagination ?? {
      page,
      limit,
      totalCount: 0,
      totalPages: 0,
    },
    activity: (data?.recentActivity ?? []).map((entry) => ({
      id: entry._id,
      type: entry.type ?? null,
      fromStatus: entry.fromStatus ?? null,
      toStatus: entry.toStatus ?? null,
      actor: entry.actor?.fullName ?? 'Someone',
      note: entry.note ?? '',
      createdAt: entry.createdAt ?? null,
    })),
  };
};

export const createCustomerApi = async (form) => {
  const response = await api.post('/customers', customerToApi(form));
  return customerFromApi(unwrap(response));
};

/**
 * `UpdateCustomerValidator` takes the same fields as create (plus the service
 * location operations, which this form doesn't use), so the same mapping works.
 */
export const updateCustomerApi = async (id, form) => {
  const response = await api.patch(`/customers/${id}`, customerToApi(form));
  return customerFromApi(unwrap(response));
};

/** Soft delete — the record is flagged `isDeleted`, not dropped. */
export const removeCustomerApi = async (id) => {
  await api.delete(`/customers/${id}`);
};
