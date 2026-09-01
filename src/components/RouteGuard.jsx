import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { APP_MODE, useAppMode } from '../appMode';
import { getStoredUser } from '../api/auth';

const hasSession = () => Boolean(localStorage.getItem('token'));

/** Signed-in-only routes that don't belong to either data mode (onboarding). */
export const RequireSession = ({ children }) => {
  const location = useLocation();

  if (!hasSession()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

/**
 * The product screens. Which dataset they render depends on the mode picked on
 * the welcome screen, and each mode has its own entry requirement:
 *
 * - no mode chosen yet → back to the welcome fork
 * - `live` before onboarding finished → into the wizard, because nothing is
 *   scoped to a company until its profile exists
 * - `demo` → straight through, nothing to set up
 */
export const RequireApp = ({ children }) => {
  const mode = useAppMode();
  const location = useLocation();

  if (!hasSession()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!mode) {
    return <Navigate to="/welcome" replace />;
  }

  if (mode === APP_MODE.LIVE && !getStoredUser()?.isOnboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};
