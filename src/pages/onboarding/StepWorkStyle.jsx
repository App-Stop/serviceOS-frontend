import React from 'react';
import { Check, Lightbulb, UserRound, UsersRound } from 'lucide-react';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { OptionCard, WizardFooter } from '../../components/onboarding/WizardControls';

export const StepWorkStyle = ({ data, update, onBack, onNext }) => (
  <OnboardingShell
    step={2}
    title="How does your team work?"
    subtitle="Choose how you want to organize and assign work."
  >
    <div className="onb-body">
      <OptionCard
        icon={UserRound}
        checkIcon={Check}
        title="Solo Technicians"
        description="Assign jobs directly to individual technicians. Best for smaller teams where everyone works independently."
        selected={data.workStyle === 'solo'}
        onClick={() => update({ workStyle: 'solo' })}
      />

      <OptionCard
        icon={UsersRound}
        checkIcon={Check}
        title="Technicians + Crew"
        description="Organize technicians into crews with a lead. Assign jobs to entire crews. Great for larger teams or paired work."
        selected={data.workStyle === 'crew'}
        onClick={() => update({ workStyle: 'crew' })}
      />

      <div className="onb-panel">
        <Lightbulb className="size-[20px] shrink-0" strokeWidth={2} />
        <p className="min-w-px flex-1">
          <span className="font-semibold text-neutral-900">Tip:</span> You can always create crews
          later from the Team page, even if you start with solo mode. Crews can be created anytime a
          job needs more than one person.
        </p>
      </div>
    </div>

    <WizardFooter onBack={onBack} onNext={onNext} />
  </OnboardingShell>
);
