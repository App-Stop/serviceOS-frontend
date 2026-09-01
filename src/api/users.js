import api, { unwrap, unwrapList } from './client';
import { normalizePhone } from './format';

/**
 * Team members are always created as `technician`. The API's role enum also
 * accepts `crew-lead`, but a crew's lead is only ever promoted from an
 * existing technician when the crew is created — a user saved directly as
 * `crew-lead` can never be chosen to lead one.
 */
export const MEMBER_ROLE = 'technician';

/**
 * The only roles that exist. `User.role` is an enum of exactly these three —
 * `company` is the account owner, who is never listed as a team member — so
 * nothing in the UI should offer any other.
 */
export const ROLE_LABEL = {
  technician: 'Technician',
  'crew-lead': 'Crew Lead',
  company: 'Admin',
};

/** Roles a team member can hold, as the member modals list them. */
export const MEMBER_ROLE_OPTIONS = [
  { id: ROLE_LABEL.technician, label: ROLE_LABEL.technician },
  { id: ROLE_LABEL['crew-lead'], label: ROLE_LABEL['crew-lead'] },
];

/** Every role, owner included, for the account settings picker. */
export const ALL_ROLE_LABELS = [
  ROLE_LABEL.company,
  ROLE_LABEL['crew-lead'],
  ROLE_LABEL.technician,
];

const memberFromApi = (user) => ({
  id: user._id,
  name: user.fullName ?? '',
  email: user.email ?? '',
  phone: user.phone == null ? '' : String(user.phone),
  role: user.role ?? MEMBER_ROLE,
  roleLabel: ROLE_LABEL[user.role] ?? user.role,
  rate: user.hourlyRate == null ? '' : String(user.hourlyRate),
  crew: user.assignToCrew ? String(user.assignToCrew) : '',
});

/**
 * Crew membership is deliberately absent here.
 *
 * The user endpoints write only the user half of that relationship — they set
 * `assignToCrew` but never add the person to the crew's `members` array — so a
 * crew assigned this way shows on the member but not on the crew. Membership
 * goes through the crew endpoints instead (see `setMemberCrewApi`), which
 * maintain both sides.
 */
const memberToApi = (form) => ({
  fullName: form.name.trim(),
  phone: normalizePhone(form.phone),
  email: form.email.trim(),
  role: MEMBER_ROLE,
  hourlyRate: Number(form.rate),
});

/** The API caps `limit` at 100 per page. */
export const MAX_PAGE_SIZE = 100;

/**
 * One page of the company roster, with the API's `{ page, limit, totalCount,
 * totalPages }` block alongside it. The caller (the company owner) is already
 * excluded server-side.
 *
 * `search` matches on name and email only — the API doesn't index phone or
 * crew, so a search for those has to be done over a loaded page instead.
 */
export const listMembersPageApi = async ({
  page = 1,
  limit = 20,
  search,
  sortByName,
} = {}) => {
  const params = { page, limit: Math.min(limit, MAX_PAGE_SIZE) };
  if (search?.trim()) params.search = search.trim();
  if (sortByName) params.sortByName = sortByName;

  const response = await api.get('/users/get', { params });

  return {
    items: unwrapList(response).map(memberFromApi),
    pagination: response?.data?.pagination ?? {
      page,
      limit,
      totalCount: 0,
      totalPages: 0,
    },
  };
};

/**
 * The whole roster, for the places that need every name rather than a page —
 * crew rosters, the member detail lookup, the global search.
 */
export const listMembersApi = async () => {
  const first = await listMembersPageApi({ page: 1, limit: MAX_PAGE_SIZE });
  const { totalPages = 1 } = first.pagination;

  if (totalPages <= 1) return first.items;

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      listMembersPageApi({ page: i + 2, limit: MAX_PAGE_SIZE }),
    ),
  );

  return rest.reduce((all, next) => all.concat(next.items), first.items);
};

/** One member, straight from the server — used to open an edit form fresh. */
export const getMemberApi = async (id) => {
  const response = await api.get(`/users/${id}`);
  return memberFromApi(unwrap(response));
};

export const createMemberApi = async (form) => {
  const response = await api.post('/users/create', memberToApi(form));
  return memberFromApi(unwrap(response));
};

/**
 * Update takes the same fields minus email, which the API treats as immutable,
 * and minus crew membership — see the note on `memberToApi`.
 */
export const updateMemberApi = async (id, form) => {
  const payload = {
    fullName: form.name.trim(),
    phone: normalizePhone(form.phone),
    hourlyRate: Number(form.rate),
  };

  const response = await api.patch(`/users/${id}`, payload);
  return memberFromApi(unwrap(response));
};

export const removeMemberApi = async (id) => {
  await api.delete(`/users/${id}/soft-delete`);
};
