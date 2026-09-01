import api, { unwrap, unwrapList } from './client';

/**
 * Swatch names offered by the crew modal. The API stores whatever string it
 * is given, but enforces one colour per crew within a company, so a colour
 * already taken has to be locked out in the picker.
 */
export const CREW_COLORS = [
  'pink',
  'violent',
  'green',
  'cyan',
  'red',
  'orange',
  'blue',
  'yellow',
  'maroon',
];

const idOf = (value) =>
  value && typeof value === 'object' ? String(value._id) : value ? String(value) : '';

const nameOf = (value) =>
  value && typeof value === 'object' ? (value.fullName ?? '') : '';

const crewFromApi = (crew) => {
  const members = Array.isArray(crew.members) ? crew.members : [];

  return {
    id: crew._id,
    name: crew.crewName ?? '',
    color: crew.crewColor ?? 'pink',
    lead: idOf(crew.crewLead),
    leadName: nameOf(crew.crewLead),
    members: members.map(idOf).filter(Boolean),
    memberNames: members.map(nameOf).filter(Boolean),
  };
};

const crewToApi = (form) => {
  const payload = {
    crewName: form.name.trim(),
    members: form.members ?? [],
    crewColor: form.color,
  };

  // `crewLead` is validated as an ObjectId or null — an empty string, which a
  // leaderless crew carries in the form, is neither.
  if (form.lead) payload.crewLead = form.lead;
  return payload;
};

export const listCrewsApi = async () => {
  const response = await api.get('/crews/');
  return unwrapList(response).map(crewFromApi);
};

export const createCrewApi = async (form) => {
  const response = await api.post('/crews/', crewToApi(form));
  return crewFromApi(unwrap(response));
};

export const updateCrewApi = async (id, form) => {
  const response = await api.patch(`/crews/${id}`, crewToApi(form));
  return crewFromApi(unwrap(response));
};

export const removeCrewApi = async (id) => {
  await api.delete(`/crews/${id}`);
};

export const getCrewApi = async (id) => {
  const response = await api.get(`/crews/${id}`);
  return crewFromApi(unwrap(response));
};

/** Pulls one member out of a crew, clearing their `assignToCrew` with it. */
export const removeCrewMemberApi = async (crewId, memberId) => {
  await api.delete(`/crews/${crewId}/members/${memberId}`);
};

/** Removes the crew's lead, demoting them back to technician. */
export const removeCrewLeadApi = async (crewId) => {
  await api.delete(`/crews/${crewId}/lead-or-member`, {
    data: { removeCrewLead: true },
  });
};

/**
 * Adds someone to a crew's member list. The crew is re-read first because the
 * update endpoint takes the whole `members` array, not a delta.
 */
export const addCrewMemberApi = async (crewId, memberId) => {
  const crew = await getCrewApi(crewId);
  if (crew.lead === memberId || crew.members.includes(memberId)) return crew;

  return updateCrewApi(crewId, {
    ...crew,
    members: [...crew.members, memberId],
  });
};

/**
 * Moves someone between crews (either end may be empty).
 *
 * This exists because the user endpoints only write `assignToCrew` and leave
 * the crew's own `members` array untouched, which leaves the two halves of the
 * relationship disagreeing. Going through the crew endpoints keeps them in
 * step: the crew update re-points `assignToCrew` and pulls the person off any
 * other crew, and the member/lead removals clear it again.
 *
 * `wasLeadOfPrevious` picks the right removal, since a crew's lead isn't in
 * its own `members` array and the member removal would 404 on them.
 */
export const setMemberCrewApi = async ({
  memberId,
  fromCrewId,
  toCrewId,
  wasLeadOfPrevious = false,
}) => {
  if (fromCrewId === toCrewId) return;

  if (fromCrewId) {
    if (wasLeadOfPrevious) {
      await removeCrewLeadApi(fromCrewId);
    } else {
      await removeCrewMemberApi(fromCrewId, memberId);
    }
  }

  // Adding to the new crew also clears any crew the person still belonged to.
  if (toCrewId) await addCrewMemberApi(toCrewId, memberId);
};
