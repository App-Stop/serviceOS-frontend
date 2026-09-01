import api, { unwrap } from './client';
import { TEAM_WORK_CHOICE, normalizePhone } from './format';

/**
 * The company profile has to exist before any team member is created: user
 * creation resolves its tenant scope through `Company.findOne({ ownerId })`,
 * so a technician added first would be saved with a null companyId and then
 * be missing from every company-scoped list.
 */
export const onboardCompanyApi = async (data) => {
  const payload = {
    companyName: data.company.trim(),
    phone: normalizePhone(data.phone),
    serviceArea: data.serviceArea.trim(),
    businessAddress: data.address.trim(),
    // Stored as an array even though the wizard picks a single industry.
    industry: [data.industry],
    teamSize: data.teamSize,
    teamWorkChoice: TEAM_WORK_CHOICE[data.workStyle],
  };

  const email = data.email?.trim();
  if (email) payload.email = email;

  const response = await api.post('/company/onboarding', payload);
  return unwrap(response);
};

/** Existing profile for a returning owner, or null if onboarding never ran. */
export const getCompanyProfileApi = async () => {
  try {
    const response = await api.get('/company/me');
    return unwrap(response)?.company ?? null;
  } catch (error) {
    if (error?.response?.status === 404) return null;
    throw error;
  }
};

/** API company doc back into the wizard's step-1/2 field names. */
export const companyToForm = (company) => {
  if (!company) return null;

  const workStyle =
    company.teamWorkChoice === TEAM_WORK_CHOICE.crew ? 'crew' : 'solo';

  return {
    company: company.companyName ?? '',
    phone: company.phone == null ? '' : String(company.phone),
    email: company.email ?? '',
    serviceArea: company.serviceArea ?? '',
    address: company.businessAddress ?? '',
    industry: company.industry?.[0] ?? '',
    teamSize: company.teamSize ?? '',
    workStyle,
  };
};
