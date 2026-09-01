/**
 * Shared shape conversions between the wizard's UI state and the API payloads.
 */

/**
 * `User.phone` is validated as `^\+?[0-9]{7,14}$` and `Company.phone` is stored
 * as a Number, so any display formatting the inputs allow — spaces, parens,
 * dashes — has to come off before the value is sent.
 */
export const normalizePhone = (value = '') => {
  const trimmed = String(value).trim();
  const digits = trimmed.replace(/[^0-9]/g, '');
  return trimmed.startsWith('+') ? `+${digits}` : digits;
};

export const isValidPhone = (value) => /^\+?[0-9]{7,14}$/.test(normalizePhone(value));

/** The wizard's two work styles, as the `teamWorkChoice` enum spells them. */
export const TEAM_WORK_CHOICE = {
  solo: 'Solo-technicians',
  crew: 'Technicians + Crew',
};

/** Service durations, paired with the minutes the API stores them as. */
export const DURATION_OPTIONS = [
  { label: '0.5h', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '1.5h', minutes: 90 },
  { label: '2h', minutes: 120 },
  { label: '2.5h', minutes: 150 },
  { label: '3h', minutes: 180 },
  { label: '4h', minutes: 240 },
  { label: '5h', minutes: 300 },
  { label: '6h', minutes: 360 },
  { label: '8h', minutes: 480 },
];

export const minutesToLabel = (minutes) =>
  DURATION_OPTIONS.find((option) => option.minutes === minutes)?.label ?? '';

export const labelToMinutes = (label) =>
  DURATION_OPTIONS.find((option) => option.label === label)?.minutes ?? 0;
