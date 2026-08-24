/**
 * Prototype team store.
 *
 * Manages team members and crews in memory (mirrored to localStorage so edits
 * survive a refresh) and notifies subscribers on every change.
 */

import { useSyncExternalStore } from 'react';

const STORAGE_MEMBERS_KEY = 'serviceos.team_members.v1';
const STORAGE_CREWS_KEY = 'serviceos.crews.v1';

export const SEED_MEMBERS = [
  {
    id: 1,
    name: 'JJ Thompson',
    phone: '(555) 201-1001',
    role: 'Lead Technician',
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
    role: 'Lead Technician',
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
    role: 'Lead Technician',
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

let members = readStore(STORAGE_MEMBERS_KEY, SEED_MEMBERS);
let crews = readStore(STORAGE_CREWS_KEY, SEED_CREWS);

const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => listener());
};

const commitMembers = (next) => {
  members = next;
  try {
    window.localStorage.setItem(STORAGE_MEMBERS_KEY, JSON.stringify(members));
  } catch {
    // Ignore storage errors
  }
  notify();
};

const commitCrews = (next) => {
  crews = next;
  try {
    window.localStorage.setItem(STORAGE_CREWS_KEY, JSON.stringify(crews));
  } catch {
    // Ignore storage errors
  }
  notify();
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/* ── Hooks ─────────────────────────────────────────────── */

export const useTeamMembers = () =>
  useSyncExternalStore(subscribe, () => members, () => members);

export const useTeamMember = (id) =>
  useTeamMembers().find((member) => member.id === Number(id));

export const useCrews = () =>
  useSyncExternalStore(subscribe, () => crews, () => crews);

/* ── Mutators ──────────────────────────────────────────── */

export const addTeamMember = (input) => {
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

export const updateTeamMember = (id, patch) => {
  commitMembers(
    members.map((member) => (member.id === id ? { ...member, ...patch } : member)),
  );
};

export const removeTeamMember = (id) => {
  commitMembers(members.filter((member) => member.id !== id));
};

export const addCrew = (input) => {
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
  commitCrews(crews.map((crew) => (crew.id === id ? { ...crew, ...patch } : crew)));
};

export const removeCrew = (id) => {
  commitCrews(crews.filter((crew) => crew.id !== id));
};
