import { useSyncExternalStore } from 'react';

const STORAGE_SERVICES_KEY = 'serviceos.services.v1';

export const SEED_SERVICES = [
  { id: 's1', name: 'Deep Clean', estTime: '3h' },
  { id: 's2', name: 'Regular Clean', estTime: '1.5h' },
  { id: 's3', name: 'Move-out Clean', estTime: '2h' },
];

export const EST_TIME_OPTIONS = [
  { id: '0.5h', label: '0.5h' },
  { id: '1h', label: '1h' },
  { id: '1.5h', label: '1.5h' },
  { id: '2h', label: '2h' },
  { id: '2.5h', label: '2.5h' },
  { id: '3h', label: '3h' },
  { id: '4h', label: '4h' },
  { id: '5h', label: '5h' },
  { id: '6h', label: '6h' },
  { id: '8h', label: '8h' },
];

const readStore = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
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

let servicesList = readStore(STORAGE_SERVICES_KEY, SEED_SERVICES);
const listeners = new Set();

const notify = () => listeners.forEach((cb) => cb());
const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

const commitServices = (next) => {
  servicesList = next;
  writeStore(STORAGE_SERVICES_KEY, servicesList);
  notify();
};

export const useServices = () =>
  useSyncExternalStore(subscribe, () => servicesList, () => servicesList);

export const updateServicesList = (newList) => {
  commitServices(newList);
};

export const addServiceItem = (service) => {
  const item = {
    id: `s-${Date.now()}`,
    name: service.name || '',
    estTime: service.estTime || '1h',
  };
  commitServices([...servicesList, item]);
  return item;
};

export const removeServiceItem = (id) => {
  commitServices(servicesList.filter((s) => s.id !== id));
};
