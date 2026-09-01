/**
 * Prototype team store.
 *
 * Manages team members and crews in memory (mirrored to localStorage so edits
 * survive a refresh) and notifies subscribers on every change.
 */

import { useSyncExternalStore } from 'react';
import { isLiveMode } from '../appMode';
import {
  createMemberApi,
  listMembersApi,
  listMembersPageApi,
  removeMemberApi,
  updateMemberApi,
} from '../api/users';
import {
  createCrewApi,
  listCrewsApi,
  removeCrewApi,
  setMemberCrewApi,
  updateCrewApi,
} from '../api/crews';

const STORAGE_MEMBERS_KEY = 'serviceos.team_members.v1';
const STORAGE_CREWS_KEY = 'serviceos.crews.v1';

export const SEED_MEMBERS = [
  {
    id: 1,
    name: 'JJ Thompson',
    phone: '(555) 201-1001',
    role: 'Crew Lead',
    email: 'jj.thompson@gmail.com',
    crew: 'North Crew',
    status: 'assigned',
    activeJobs: 2,
    jobsCompleted: 47,
    rating: '4.8',
    revenueGenerated: '$7,695',
    jobHistory: [
      { id: 'jh1', title: 'Maplewood Community Center Renovation', status: 'scheduled', statusVariant: 'danger', assignee: 'Jason K.', date: 'Aug 13, 2026', time: '1:00 PM' },
      { id: 'jh2', title: 'Riverside Park Playground Upgrade', assignee: 'Emily R.', date: 'Sep 15, 2026', time: '10:30 AM' },
      { id: 'jh3', title: 'Downtown Library Expansion', assignee: 'Michael T.', date: 'Oct 22, 2026', time: '2:00 PM' },
      { id: 'jh4', title: 'Northside Community Art Fair', assignee: 'Sarah L.', date: 'Nov 5, 2026', time: '11:00 AM' },
      { id: 'jh5', title: 'Eastside Neighborhood Cleanup', assignee: 'David H.', date: 'Dec 12, 2026', time: '9:00 AM' },
      { id: 'jh6', title: 'Westlake Music Festival', assignee: 'Laura K.', date: 'Jan 14, 2027', time: '4:00 PM' },
    ],
    recentActivity: [
      { id: 'ra1', type: 'in', title: 'Clocked in at 10:00 AM', time: '10m ago' },
      { id: 'ra2', type: 'out', title: 'Clocked out at 12:00 PM', time: '10m ago' },
      { id: 'ra3', type: 'check', title: 'Completed Job “Maplewood Community Center Renovation”', time: '10m ago' },
    ],
  },
  {
    id: 2,
    name: 'Samantha Lee',
    phone: '(555) 387-4522',
    role: 'Technician',
    email: 'samantha.lee@outlook.com',
    crew: 'Solo',
    status: 'unassigned',
    activeJobs: 1,
    jobsCompleted: 18,
    rating: '4.6',
    revenueGenerated: '$3,420',
    jobHistory: [
      { id: 'jh1', title: 'Furnace Installation', status: 'onsite', statusVariant: 'info', assignee: 'Mike R.', date: 'Aug 13, 2026', time: '1:00 PM' },
      { id: 'jh2', title: 'Boiler Repair', assignee: 'John D.', date: 'Sep 02, 2026', time: '9:00 AM' },
    ],
    recentActivity: [
      { id: 'ra1', type: 'in', title: 'Clocked in at 8:30 AM', time: '2h ago' },
      { id: 'ra2', type: 'check', title: 'Started Job “Furnace Installation”', time: '1h ago' },
    ],
  },
  {
    id: 3,
    name: 'Jessica Taylor',
    phone: '(555) 614-8903',
    role: 'Technician',
    email: 'j.taylor@icloud.com',
    crew: 'Solo',
    status: 'assigned',
    activeJobs: 3,
    jobsCompleted: 34,
    rating: '4.9',
    revenueGenerated: '$5,890',
    jobHistory: [
      { id: 'jh1', title: 'Plumbing Leak Fix', status: 'completed', statusVariant: 'success', assignee: 'Tom B.', date: 'Aug 13, 2026', time: '10:00 AM' },
    ],
    recentActivity: [
      { id: 'ra1', type: 'check', title: 'Completed Job “Plumbing Leak Fix”', time: '3h ago' },
    ],
  },
  {
    id: 4,
    name: 'David Wilson',
    phone: '(555) 729-3364',
    role: 'Technician',
    email: 'david.wilson@yahoo.com',
    crew: 'North Crew',
    status: 'assigned',
    activeJobs: 2,
    jobsCompleted: 29,
    rating: '4.7',
    revenueGenerated: '$4,500',
    jobHistory: [],
    recentActivity: [],
  },
  {
    id: 5,
    name: 'Robert Anderson',
    phone: '(555) 445-6617',
    role: 'Technician',
    email: 'r.anderson@gmail.com',
    crew: 'Solo',
    status: 'assigned',
    activeJobs: 1,
    jobsCompleted: 15,
    rating: '4.5',
    revenueGenerated: '$2,300',
    jobHistory: [],
    recentActivity: [],
  },
  {
    id: 6,
    name: 'Emily Davis',
    phone: '(555) 892-7748',
    role: 'Technician',
    email: 'emily.davis@hotmail.com',
    crew: 'Solo',
    status: 'assigned',
    activeJobs: 2,
    jobsCompleted: 22,
    rating: '4.8',
    revenueGenerated: '$3,950',
    jobHistory: [],
    recentActivity: [],
  },
  {
    id: 7,
    name: 'Carlos Mendez',
    phone: '(555) 103-5529',
    role: 'Crew Lead',
    email: 'carlos.mendez@gmail.com',
    crew: 'Solo',
    status: 'assigned',
    activeJobs: 3,
    jobsCompleted: 51,
    rating: '4.9',
    revenueGenerated: '$8,120',
    jobHistory: [],
    recentActivity: [],
  },
  {
    id: 8,
    name: 'Priya Sharma',
    phone: '(555) 264-9981',
    role: 'Crew Lead',
    email: 'priya.sharma@outlook.com',
    crew: 'West Crew',
    status: 'assigned',
    activeJobs: 4,
    jobsCompleted: 62,
    rating: '5.0',
    revenueGenerated: '$10,400',
    jobHistory: [],
    recentActivity: [],
  },
  {
    id: 9,
    name: 'Olivia Martinez',
    phone: '(555) 718-3346',
    role: 'Technician',
    email: 'o.martinez@icloud.com',
    crew: 'Central Crew',
    status: 'assigned',
    activeJobs: 1,
    jobsCompleted: 11,
    rating: '4.4',
    revenueGenerated: '$1,800',
    jobHistory: [],
    recentActivity: [],
  },
  {
    id: 10,
    name: 'James Nakamura',
    phone: '(555) 556-4472',
    role: 'Technician',
    email: 'j.nakamura@company.co',
    crew: 'Central Crew',
    status: 'assigned',
    activeJobs: 2,
    jobsCompleted: 38,
    rating: '4.8',
    revenueGenerated: '$6,100',
    jobHistory: [],
    recentActivity: [],
  },
  {
    id: 11,
    name: "Sarah O'Brien",
    phone: '(555) 831-2205',
    role: 'Technician',
    email: 'sobrien@protonmail.com',
    crew: 'Solo',
    status: 'assigned',
    activeJobs: 1,
    jobsCompleted: 19,
    rating: '4.6',
    revenueGenerated: '$3,100',
    jobHistory: [],
    recentActivity: [],
  },
  {
    id: 12,
    name: 'Marcus Chen',
    phone: '(555) 942-6638',
    role: 'Technician',
    email: 'marcus.chen@gmail.com',
    crew: 'Solo',
    status: 'assigned',
    activeJobs: 2,
    jobsCompleted: 27,
    rating: '4.7',
    revenueGenerated: '$4,200',
    jobHistory: [],
    recentActivity: [],
  },
];

/** Crew swatches, keyed by the `color` name each crew carries. */
export const CREW_COLORS = {
  pink: '#ff1fad',
  violet: '#903bff',
  green: '#00c064',
  cyan: '#00c9c6',
  red: '#f30000',
  orange: '#f96c00',
  blue: '#0095ff',
  yellow: '#edba00',
  maroon: '#bf0063',
};

export const crewColor = (name) => CREW_COLORS[name] ?? CREW_COLORS.violet;

export const SEED_CREWS = [
  { id: 1, name: 'North Crew', lead: 'JJ Thompson', assignedJob: 'AC Ductwork Repair', color: 'pink', membersCount: 4, members: ['JJ Thompson', 'David Wilson', 'Michael Johnson', 'Tom Bradley'], status: 'assigned' },
  { id: 2, name: 'South Crew', lead: 'Samantha Lee', assignedJob: 'Furnace Installation', color: 'green', membersCount: 4, members: ['Samantha Lee', 'Mike Rivera', 'Jake Morris', 'Lisa Patel'], status: 'unassigned' },
  { id: 3, name: 'East Crew', lead: 'Jessica Taylor', assignedJob: 'Plumbing Leak Fix', color: 'cyan', membersCount: 4, members: ['Jessica Taylor', 'Chris Nguyen', 'Ryan Cooper', 'Nick Lawson'], status: 'assigned' },
  { id: 4, name: 'West Crew', lead: 'Priya Sharma', assignedJob: 'Electrical Panel Upgrade', color: 'blue', membersCount: 3, members: ['Priya Sharma', 'Sara Kim', 'Owen Blake'], status: 'assigned' },
  { id: 5, name: 'Central Crew', lead: 'Olivia Martinez', assignedJob: 'Roof Inspection', color: 'violet', membersCount: 6, members: ['Olivia Martinez', 'James Nakamura', "Sarah O'Brien", 'Marcus Chen', 'Grace Hall', 'John Doe'], status: 'assigned' },
];

const readStore = (key, fallback) => {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

// Live mode starts empty and fills from the API; demo mode starts seeded.
let members = isLiveMode() ? [] : readStore(STORAGE_MEMBERS_KEY, SEED_MEMBERS);
let crews = isLiveMode() ? [] : readStore(STORAGE_CREWS_KEY, SEED_CREWS);

const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => listener());
};

const commitMembers = (next) => {
  members = next;
  try {
    // Only the demo dataset is mirrored to storage; live data belongs to the API.
    if (!isLiveMode()) {
      window.localStorage.setItem(STORAGE_MEMBERS_KEY, JSON.stringify(members));
    }
  } catch {
    // Ignore storage errors
  }
  notify();
};

const commitCrews = (next) => {
  crews = next;
  try {
    if (!isLiveMode()) {
      window.localStorage.setItem(STORAGE_CREWS_KEY, JSON.stringify(crews));
    }
  } catch {
    // Ignore storage errors
  }
  notify();
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/* ── Live mode ─────────────────────────────────────────── */

/**
 * In live mode the same two collections are served from the API instead of the
 * seed data. They're kept in this store — and in the same shape the screens
 * already read — so the pages don't have to know which mode they're rendering.
 *
 * The per-member job statistics the detail screen shows have no endpoint
 * behind them yet, so they're filled with neutral placeholders rather than
 * left undefined.
 */
const liveMemberShape = (member, crewsById) => ({
  id: member.id,
  name: member.name,
  phone: member.phone,
  email: member.email,
  role: member.roleLabel,
  crew: crewsById.get(member.crew)?.name ?? 'Solo',
  status: member.crew ? 'assigned' : 'unassigned',
  rate: member.rate,
  activeJobs: 0,
  jobsCompleted: 0,
  rating: '—',
  revenueGenerated: '$0',
  jobHistory: [],
});

const liveCrewShape = (crew) => ({
  id: crew.id,
  name: crew.name,
  lead: crew.leadName,
  assignedJob: '-',
  color: crew.color,
  membersCount: crew.memberNames.length + (crew.leadName ? 1 : 0),
  // The lead is counted on the crew but kept out of the member list, which is
  // what the edit dialog binds its member tokens to.
  members: crew.memberNames,
  status: crew.leadName ? 'assigned' : 'unassigned',
});

let hydrating = null;
// Demo data is present from the first render; live data arrives over the wire.
let loaded = !isLiveMode();

/** Replaces the store contents with the company's own team, once. */
const refreshFromApi = async () => {
  const [apiMembers, apiCrews] = await Promise.all([
    listMembersApi(),
    listCrewsApi(),
  ]);

  const crewsById = new Map(apiCrews.map((crew) => [crew.id, crew]));

  members = apiMembers.map((member) => liveMemberShape(member, crewsById));
  crews = apiCrews.map(liveCrewShape);
  loaded = true;
  notify();
};

/**
 * Kicked off from the read hooks so a live screen loads its data by being
 * rendered, the same way the demo store is simply already there. The in-flight
 * promise is shared, so mounting several team screens fetches once.
 */
const ensureLiveData = () => {
  if (!isLiveMode() || hydrating) return;
  hydrating = refreshFromApi().catch(() => {
    // Leaves the list empty; the next mount retries.
    hydrating = null;
  });
};

/** Re-reads after a write, since the API derives roles and crew membership. */
const reloadLive = () => refreshFromApi().catch(() => {});

/** Fields the demo dataset can be searched on, matching the members table. */
const matchesMember = (member, term) =>
  member.name.toLowerCase().includes(term) ||
  member.role.toLowerCase().includes(term) ||
  member.email.toLowerCase().includes(term) ||
  member.phone.includes(term) ||
  member.crew.toLowerCase().includes(term);

/**
 * One page of members for the team table. Live mode asks the API, which does
 * the counting and slicing; demo mode pages the seeded array the same way so
 * the table has one set of controls in both modes.
 */
export const fetchMembersPage = async ({ page = 1, limit = 20, search = '' }) => {
  if (isLiveMode()) {
    const crewsById = new Map(crews.map((crew) => [crew.id, crew]));
    const { items, pagination } = await listMembersPageApi({
      page,
      limit,
      search,
    });

    return {
      // The page carries crew ids; names come from the crews already loaded.
      items: items.map((member) => liveMemberShape(member, crewsById)),
      pagination,
    };
  }

  const term = search.trim().toLowerCase();
  const matched = term
    ? members.filter((member) => matchesMember(member, term))
    : members;

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

/* ── Hooks ─────────────────────────────────────────────── */

export const useTeamMembers = () => {
  ensureLiveData();
  return useSyncExternalStore(subscribe, () => members, () => members);
};

// Ids are numbers in the seed data and ObjectId strings from the API, so the
// route param is matched as text either way.
export const useTeamMember = (id) =>
  useTeamMembers().find((member) => String(member.id) === String(id));

export const useCrews = () => {
  ensureLiveData();
  return useSyncExternalStore(subscribe, () => crews, () => crews);
};

/** False until the live team has arrived; always true in demo mode. */
export const useTeamLoaded = () =>
  useSyncExternalStore(subscribe, () => loaded, () => loaded);

/* ── Mutators ──────────────────────────────────────────── */

// The Team screen identifies crews and people by name, which is all the demo
// store ever needed. The API works in ids, so names are resolved back here
// rather than reshaping every caller.
const crewIdByName = (name) =>
  crews.find((crew) => crew.name === name)?.id ?? '';

const memberIdByName = (name) =>
  members.find((member) => member.name === name)?.id ?? '';

/** True when this person leads the named crew, who sit outside `members`. */
const isLeadOfCrew = (crewName, memberName) =>
  crews.some((crew) => crew.name === crewName && crew.lead === memberName);

export const addTeamMember = async (input) => {
  if (isLiveMode()) {
    const created = await createMemberApi(input);

    // Crew membership is a separate write — the create endpoint would only set
    // the user's side of it.
    const toCrewId = crewIdByName(input.crew);
    if (toCrewId) {
      await setMemberCrewApi({ memberId: created.id, toCrewId });
    }

    return reloadLive();
  }

  const id = members.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const newMember = {
    id,
    name: input.name || '',
    phone: input.phone || '',
    email: input.email || '',
    role: input.role || 'Technician',
    crew: input.crew || 'Solo',
    status: input.crew && input.crew !== 'Solo' ? 'assigned' : (input.status || 'unassigned'),
  };
  commitMembers([...members, newMember]);
  return newMember;
};

export const updateTeamMember = async (id, patch) => {
  if (isLiveMode()) {
    const current = members.find((member) => member.id === id) ?? {};
    const next = { ...current, ...patch };

    await updateMemberApi(id, next);

    // The crew move is its own write, through the crew endpoints, so the crew's
    // `members` array and the user's `assignToCrew` stay in agreement.
    const fromCrewId = crewIdByName(current.crew);
    const toCrewId = crewIdByName(next.crew);

    if (fromCrewId !== toCrewId) {
      await setMemberCrewApi({
        memberId: id,
        fromCrewId,
        toCrewId,
        wasLeadOfPrevious: isLeadOfCrew(current.crew, current.name),
      });
    }

    return reloadLive();
  }

  commitMembers(
    members.map((member) => (member.id === id ? { ...member, ...patch } : member)),
  );
};

export const removeTeamMember = (id) => {
  if (isLiveMode()) {
    return removeMemberApi(id).then(reloadLive);
  }

  commitMembers(members.filter((member) => member.id !== id));
};

export const addCrew = (input) => {
  if (isLiveMode()) {
    return createCrewApi({
      name: input.name,
      color: input.color,
      lead: memberIdByName(input.lead),
      members: (input.members ?? [])
        .filter((name) => name !== input.lead)
        .map(memberIdByName)
        .filter(Boolean),
    }).then(reloadLive);
  }

  const id = crews.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const newCrew = {
    id,
    name: input.name || `Crew ${id}`,
    lead: input.lead || '',
    assignedJob: input.assignedJob || '-',
    color: input.color || 'pink',
    membersCount: input.members?.length || (input.lead ? 1 : 0),
    members: input.members || [],
    status: input.lead ? 'assigned' : 'unassigned',
  };
  commitCrews([...crews, newCrew]);
  return newCrew;
};

export const updateCrew = (id, patch) => {
  if (isLiveMode()) {
    const current = crews.find((crew) => crew.id === id) ?? {};
    const next = { ...current, ...patch };
    return updateCrewApi(id, {
      name: next.name,
      color: next.color,
      lead: memberIdByName(next.lead),
      members: (next.members ?? [])
        .filter((name) => name !== next.lead)
        .map(memberIdByName)
        .filter(Boolean),
    }).then(reloadLive);
  }

  commitCrews(crews.map((crew) => (crew.id === id ? { ...crew, ...patch } : crew)));
};

export const removeCrew = (id) => {
  if (isLiveMode()) {
    return removeCrewApi(id).then(reloadLive);
  }

  commitCrews(crews.filter((crew) => crew.id !== id));
};

/**
 * Restores members and crews to the seeded dataset (Profile → Danger Zone).
 * Demo only — there is nothing to reset a company's real team to.
 */
export const resetTeam = () => {
  if (isLiveMode()) return;
  commitMembers(SEED_MEMBERS);
  commitCrews(SEED_CREWS);
};
