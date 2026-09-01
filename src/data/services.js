import { useSyncExternalStore } from 'react';
import { isLiveMode } from '../appMode';
import {
  createServiceTypeApi,
  listServiceTypesApi,
  removeServiceTypeApi,
  updateServiceTypeApi,
} from '../api/serviceTypes';
import { DURATION_OPTIONS } from '../api/format';

const STORAGE_SERVICES_KEY = 'serviceos.services.v1';

export const SEED_SERVICES = [
  { id: 's1', name: 'Deep Clean', estTime: '3h' },
  { id: 's2', name: 'Regular Clean', estTime: '1.5h' },
  { id: 's3', name: 'Move-out Clean', estTime: '2h' },
];

// Derived from the API's duration table so a label offered here always has a
// minutes value to be saved as.
export const EST_TIME_OPTIONS = DURATION_OPTIONS.map(({ label }) => ({
  id: label,
  label,
}));

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

// Live mode starts empty and fills from the API; demo mode starts seeded.
let servicesList = isLiveMode() ? [] : readStore(STORAGE_SERVICES_KEY, SEED_SERVICES);
const listeners = new Set();

const notify = () => listeners.forEach((cb) => cb());
const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

const commitServices = (next) => {
  servicesList = next;
  // Only the demo dataset is mirrored to storage; live data belongs to the API.
  if (!isLiveMode()) writeStore(STORAGE_SERVICES_KEY, servicesList);
  notify();
};

/* ── Live mode ─────────────────────────────────────────── */

// The store's `estTime` is the same "1.5h" label the service-type API module
// converts to and from minutes.
const liveShape = (service) => ({
  id: service.id,
  name: service.name,
  estTime: service.duration,
});

let hydrating = null;
// Demo data is present from the first render; live data arrives over the wire.
let loaded = !isLiveMode();

const refreshFromApi = async () => {
  servicesList = (await listServiceTypesApi()).map(liveShape);
  loaded = true;
  notify();
};

const ensureLiveData = () => {
  if (!isLiveMode() || hydrating) return;
  hydrating = refreshFromApi().catch(() => {
    hydrating = null;
  });
};

const reloadLive = () => refreshFromApi().catch(() => {});

export const useServices = () => {
  ensureLiveData();
  return useSyncExternalStore(subscribe, () => servicesList, () => servicesList);
};

/** False until the live list has arrived; always true in demo mode. */
export const useServicesLoaded = () =>
  useSyncExternalStore(subscribe, () => loaded, () => loaded);

export const updateServicesList = (newList) => {
  commitServices(newList);
};

export const addServiceItem = async (service) => {
  if (isLiveMode()) {
    const created = await createServiceTypeApi({
      name: service.name || '',
      duration: service.estTime || '1h',
    });
    await reloadLive();
    return liveShape(created);
  }

  const item = {
    id: `s-${Date.now()}`,
    name: service.name || '',
    estTime: service.estTime || '1h',
  };
  commitServices([...servicesList, item]);
  return item;
};

/** Saves one row. Live mode patches it; demo mode just updates the store. */
export const updateServiceItem = (id, patch) => {
  const current = servicesList.find((s) => s.id === id) ?? {};
  const next = { ...current, ...patch };

  if (isLiveMode()) {
    return updateServiceTypeApi(id, {
      name: next.name,
      duration: next.estTime,
    }).then(reloadLive);
  }

  commitServices(servicesList.map((s) => (s.id === id ? next : s)));
  return Promise.resolve(next);
};

export const removeServiceItem = (id) => {
  if (isLiveMode()) {
    return removeServiceTypeApi(id).then(reloadLive);
  }

  commitServices(servicesList.filter((s) => s.id !== id));
};
