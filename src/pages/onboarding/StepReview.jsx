import React, { useEffect, useState } from 'react';
import { Rocket } from 'lucide-react';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { ErrorBanner, WizardFooter } from '../../components/onboarding/WizardControls';
import { getErrorMessage } from '../../api/client';
import { listMembersApi } from '../../api/users';
import { listCrewsApi } from '../../api/crews';
import { listServiceTypesApi } from '../../api/serviceTypes';

const Tile = ({ label, value, half = false }) => (
  <div className={`onb-summary-tile ${half ? 'onb-summary-tile-half' : ''}`}>
    <span className="onb-summary-label">{label}</span>
    <span className="onb-summary-value">{value}</span>
  </div>
);

export const StepReview = ({ data, onBack, onNext }) => {
  // Counted from what was actually saved rather than from wizard state, so a
  // row that failed to save isn't reported as set up.
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([listMembersApi(), listCrewsApi(), listServiceTypesApi()])
      .then(([members, crews, services]) =>
        setCounts({
          members: members.length + 1, // invited team + the account owner
          crews: crews.length,
          services: services.length,
        }),
      )
      .catch((err) => setError(getErrorMessage(err, 'Could not load your summary.')));
  }, []);

  const value = (key) => (counts ? counts[key] : '—');

  return (
    <OnboardingShell
      step={5}
      title="You’re all set"
      subtitle="Review your setup and launch ServiceOS for your team."
    >
      <div className="onb-summary">
        <div className="onb-summary-row">
          <Tile label="Company" value={data.company || '—'} />
          <Tile label="Industry" value={data.industry || '—'} />
        </div>
        <div className="onb-summary-row">
          <Tile label="Crews" value={value('crews')} />
          <Tile label="Total Members" value={value('members')} />
        </div>
        <div className="onb-summary-row">
          <Tile label="Services" value={value('services')} half />
        </div>
      </div>

      <ErrorBanner>{error}</ErrorBanner>

      <WizardFooter
        onBack={onBack}
        onNext={onNext}
        nextLabel="Launch ServiceOS"
        nextIcon={Rocket}
      />
    </OnboardingShell>
  );
};
