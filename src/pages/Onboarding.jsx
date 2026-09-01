import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Onboarding.css';
import { StepBusiness } from './onboarding/StepBusiness';
import { StepWorkStyle } from './onboarding/StepWorkStyle';
import { StepTeam } from './onboarding/StepTeam';
import { StepCrews } from './onboarding/StepCrews';
import { StepServices } from './onboarding/StepServices';
import { StepReview } from './onboarding/StepReview';
import { getStoredUser, markOnboardingCompleted } from '../api/auth';
import { APP_MODE, setAppMode } from '../appMode';
import { companyToForm, getCompanyProfileApi, onboardCompanyApi } from '../api/company';
import { getErrorMessage } from '../api/client';

const initialData = {
  company: '',
  phone: '',
  email: '',
  serviceArea: '',
  address: '',
  industry: '',
  teamSize: '',
  workStyle: 'solo',
};

const Onboarding = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(initialData);
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (patch) => setData((prev) => ({ ...prev, ...patch }));

  // Prefill from an already-saved profile so re-entering the wizard (or
  // refreshing mid-flow) doesn't ask for the business details a second time.
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login', { replace: true });
      return;
    }

    getCompanyProfileApi()
      .then((company) => {
        const form = companyToForm(company);
        if (form) setData((prev) => ({ ...prev, ...form }));
      })
      .catch(() => {
        // A missing/failed prefill just means starting from a blank form.
      });
  }, [navigate]);

  // The crew step only applies when the company works in crews.
  const flow = useMemo(
    () => [
      'business',
      'workStyle',
      'team',
      ...(data.workStyle === 'crew' ? ['crews'] : []),
      'services',
      'review',
    ],
    [data.workStyle],
  );

  const step = flow[Math.min(index, flow.length - 1)];
  const onBack = () => {
    setError('');
    setIndex((i) => Math.max(0, i - 1));
  };
  const onNext = () => {
    setError('');
    setIndex((i) => Math.min(flow.length - 1, i + 1));
  };

  /**
   * The company profile has to be saved before the team step: user creation
   * resolves its tenant scope from the Company document, so a technician added
   * without one would be stored unscoped and never show up again. That makes
   * the work-style step — which supplies `teamWorkChoice` — the commit point
   * for steps 1 and 2 together.
   */
  const submitCompany = async () => {
    setSaving(true);
    setError('');
    try {
      await onboardCompanyApi(data);
      // Saving the profile is what completes onboarding server-side, and it is
      // also the point the app is committed to live data.
      markOnboardingCompleted();
      setAppMode(APP_MODE.LIVE);
      onNext();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save your business details.'));
    } finally {
      setSaving(false);
    }
  };

  const owner = getStoredUser();
  const props = { data, update, onBack, onNext, saving, error };

  switch (step) {
    case 'workStyle':
      return <StepWorkStyle {...props} onNext={submitCompany} />;
    case 'team':
      return <StepTeam {...props} owner={owner} />;
    case 'crews':
      return <StepCrews {...props} owner={owner} />;
    case 'services':
      return <StepServices {...props} />;
    case 'review':
      return <StepReview {...props} onNext={() => navigate('/dashboard')} />;
    default:
      return <StepBusiness {...props} />;
  }
};

export default Onboarding;
