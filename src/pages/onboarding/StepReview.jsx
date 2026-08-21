import React from 'react';
import { Rocket } from 'lucide-react';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { WizardFooter } from '../../components/onboarding/WizardControls';

const Tile = ({ label, value, half = false }) => (
  <div className={`onb-summary-tile ${half ? 'onb-summary-tile-half' : ''}`}>
    <span className="onb-summary-label">{label}</span>
    <span className="onb-summary-value">{value}</span>
  </div>
);

export const StepReview = ({ data, onBack, onNext }) => {
  const totalMembers = data.members.length + 1; // invited team + the account owner
  const services = data.services.filter((s) => s.name).length;

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
          <Tile label="Crews" value={data.crews.length} />
          <Tile label="Total Members" value={totalMembers} />
        </div>
        <div className="onb-summary-row">
          <Tile label="Services" value={services} half />
        </div>
      </div>

      <WizardFooter
        onBack={onBack}
        onNext={onNext}
        nextLabel="Launch ServiceOS"
        nextIcon={Rocket}
      />
    </OnboardingShell>
  );
};
