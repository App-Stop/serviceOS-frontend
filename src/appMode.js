import { useSyncExternalStore } from 'react';

/**
 * The app runs in one of two modes, chosen on the welcome screen:
 *
 * - `live`  — the signed-in company's own data, read from the API. Reaching it
 *             means completing onboarding first, since nothing is scoped to a
 *             company until its profile exists.
 * - `demo`  — the seeded prototype dataset in `src/data`, so the product can be
 *             explored before committing to setting anything up.
 *
 * The choice is persisted, so a refresh or a later sign-in lands back in the
 * same mode rather than re-asking.
 */
export const APP_MODE = {
  LIVE: 'live',
  DEMO: 'demo',
};

const STORAGE_KEY = 'serviceos.mode.v1';

const read = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === APP_MODE.LIVE || stored === APP_MODE.DEMO ? stored : null;
  } catch {
    return null;
  }
};

let mode = read();

const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener());
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** The active mode, or null when the welcome fork hasn't been answered yet. */
export const getAppMode = () => mode;

export const isDemoMode = () => mode === APP_MODE.DEMO;
export const isLiveMode = () => mode === APP_MODE.LIVE;

export const setAppMode = (next) => {
  if (mode === next) return;
  mode = next;
  try {
    if (next) window.localStorage.setItem(STORAGE_KEY, next);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors — the mode still holds for this session.
  }
  notify();
};

export const clearAppMode = () => setAppMode(null);

export const useAppMode = () =>
  useSyncExternalStore(subscribe, () => mode, () => mode);
