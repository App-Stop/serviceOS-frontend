import { useSyncExternalStore } from 'react';

const STORAGE_MESSAGES_KEY = 'serviceos.communications.messages.v1';
const STORAGE_ALERTS_KEY = 'serviceos.communications.alerts.v1';

export const SEED_MESSAGES = [
  {
    id: 1,
    type: 'sms',
    recipientName: 'JJ Thompson',
    recipientContact: '(555) 201-1014',
    job: 'AC Ductwork Repair',
    subject: 'Duct sealing scheduled for Thursday',
    message: 'Ductwork leaking in attic. Energy audit recommended repair.',
    sentAt: '3 min ago',
    sentOnFull: 'Aug 24, 2026 4:10 PM',
    status: 'sent',
    sentBy: 'Automated',
  },
  {
    id: 2,
    type: 'sms',
    recipientName: 'Samantha Lee',
    recipientContact: '(555) 201-1014',
    job: 'Furnace Installation',
    subject: 'New furnace install — confirm unit size',
    message: 'Please confirm furnace unit size before dispatch tomorrow.',
    sentAt: '1h ago',
    sentOnFull: 'Aug 24, 2026 3:15 PM',
    status: 'pending',
    sentBy: 'John Doe',
  },
  {
    id: 3,
    type: 'email',
    recipientName: 'Jessica Taylor',
    recipientContact: 'maria.garcia@email.com',
    job: 'Plumbing Leak Fix',
    subject: 'Leak found under kitchen sink',
    message: 'Technician completed initial assessment. Invoice attached.',
    sentAt: 'Aug 13, 2026 1:00 PM',
    sentOnFull: 'Aug 13, 2026 1:00 PM',
    status: 'sent',
    sentBy: 'Automated',
  },
  {
    id: 4,
    type: 'sms',
    recipientName: 'David Wilson',
    recipientContact: '(555) 201-1014',
    job: 'Electrical Panel Upgrade',
    subject: 'Panel upgrade ready for inspection',
    message: 'Your electrical panel upgrade is complete and ready for county inspection.',
    sentAt: 'Aug 14, 2026 1:00 PM',
    sentOnFull: 'Aug 14, 2026 1:00 PM',
    status: 'sent',
    sentBy: 'John Doe',
  },
  {
    id: 5,
    type: 'email',
    recipientName: 'Robert Anderson',
    recipientContact: 'jen.martinez@email.com',
    job: 'Roof Inspection',
    subject: 'Roof assessment completed',
    message: 'Roof inspection report is attached for your review.',
    sentAt: 'Aug 14, 2026 1:00 PM',
    sentOnFull: 'Aug 14, 2026 1:00 PM',
    status: 'sent',
    sentBy: 'Automated',
  },
  {
    id: 6,
    type: 'sms',
    recipientName: 'Emily Davis',
    recipientContact: '(555) 201-1014',
    job: 'Water Heater Replacement',
    subject: 'Water heater swap — parts on order',
    message: 'Parts for replacement water heater have been ordered.',
    sentAt: 'Aug 15, 2026 1:00 PM',
    sentOnFull: 'Aug 15, 2026 1:00 PM',
    status: 'sent',
    sentBy: 'John Doe',
  },
  {
    id: 7,
    type: 'sms',
    recipientName: 'Carlos Mendez',
    recipientContact: '(555) 201-1014',
    job: 'HVAC Maintenance',
    subject: 'Annual HVAC tune-up reminder',
    message: 'Reminder: Your annual HVAC maintenance is scheduled for tomorrow morning.',
    sentAt: 'Aug 15, 2026 1:00 PM',
    sentOnFull: 'Aug 15, 2026 1:00 PM',
    status: 'sent',
    sentBy: 'Automated',
  },
  {
    id: 8,
    type: 'email',
    recipientName: 'Priya Sharma',
    recipientContact: 'jen.martinez@email.com',
    job: 'Garage Door Repair',
    subject: 'Garage door spring replacement',
    message: 'Confirmation of completed spring replacement job.',
    sentAt: 'Aug 16, 2026 1:00 PM',
    sentOnFull: 'Aug 16, 2026 1:00 PM',
    status: 'sent',
    sentBy: 'Automated',
  },
  {
    id: 9,
    type: 'email',
    recipientName: "Sarah O'Brien",
    recipientContact: 'jen.martinez@email.com',
    job: 'Septic Tank Service',
    subject: 'Septic pump-out scheduled',
    message: 'Your septic pump-out service is confirmed for Friday at 9 AM.',
    sentAt: 'Aug 16, 2026 1:00 PM',
    sentOnFull: 'Aug 16, 2026 1:00 PM',
    status: 'sent',
    sentBy: 'John Doe',
  },
  {
    id: 10,
    type: 'sms',
    recipientName: 'Marcus Chen',
    recipientContact: '(555) 201-1014',
    job: 'Window Replacement',
    subject: 'Window measurements confirmed',
    message: 'Technician verified window dimensions for replacement order.',
    sentAt: 'Aug 17, 2026 1:00 PM',
    sentOnFull: 'Aug 17, 2026 1:00 PM',
    status: 'sent',
    sentBy: 'Automated',
  },
];

export const SEED_ALERTS = [
  { id: 'dispatched', label: 'Job Dispatched', enabled: true, type: 'sms' },
  { id: 'enroute', label: 'Technician En Route', enabled: true, type: 'sms' },
  { id: 'completed', label: 'Job Completed', enabled: false, type: 'email' },
  { id: 'invoice', label: 'Invoice Issued', enabled: true, type: 'email' },
];

const readStore = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeStore = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota errors
  }
};

let messages = readStore(STORAGE_MESSAGES_KEY, SEED_MESSAGES);
let alerts = readStore(STORAGE_ALERTS_KEY, SEED_ALERTS);

const listeners = new Set();
const notify = () => listeners.forEach((cb) => cb());
const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

const commitMessages = (next) => {
  messages = next;
  writeStore(STORAGE_MESSAGES_KEY, messages);
  notify();
};

const commitAlerts = (next) => {
  alerts = next;
  writeStore(STORAGE_ALERTS_KEY, alerts);
  notify();
};

export const useMessages = () =>
  useSyncExternalStore(subscribe, () => messages, () => messages);

export const useAutoAlerts = () =>
  useSyncExternalStore(subscribe, () => alerts, () => alerts);

export const sendMessage = (input) => {
  const id = messages.reduce((max, m) => Math.max(max, m.id), 0) + 1;
  const newMessage = {
    id,
    type: input.type || 'email',
    recipientName: input.recipientName || 'Customer',
    recipientContact: input.recipientContact || '(555) 000-0000',
    job: input.job || 'Service Request',
    subject: input.subject || 'Service OS Notification',
    message: input.message || '',
    sentAt: 'Just now',
    sentOnFull: new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
    status: 'sent',
    sentBy: 'John Doe',
  };
  commitMessages([newMessage, ...messages]);
  return newMessage;
};

export const toggleAutoAlert = (alertId) => {
  const next = alerts.map((item) =>
    item.id === alertId ? { ...item, enabled: !item.enabled } : item,
  );
  commitAlerts(next);
};
