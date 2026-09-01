import api from './client';

export const signInApi = async (email) => {
  const response = await api.post('/auth/sign-in', { email });
  return response.data;
};

export const verifyOtpApi = async (email, otp) => {
  const response = await api.post('/auth/verify-otp', { email, otp });
  return response.data;
};

/** The signed-in user as stored by VerifyOtp, or null when signed out. */
export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user')) ?? null;
  } catch {
    return null;
  }
};

/**
 * Onboarding completion is flipped server-side when the company profile is
 * saved, but the stored copy of the user is only refreshed at sign-in — so it
 * is mirrored here to keep the route guard from bouncing back to the wizard.
 */
export const markOnboardingCompleted = () => {
  const user = getStoredUser();
  if (!user) return;
  localStorage.setItem(
    'user',
    JSON.stringify({ ...user, isOnboardingCompleted: true }),
  );
};

export default api;
