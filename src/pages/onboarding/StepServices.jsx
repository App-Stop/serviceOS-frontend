import React from 'react';
import { Plus, X } from 'lucide-react';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import {
  MutedPillButton,
  Select,
  WizardFooter,
} from '../../components/onboarding/WizardControls';

const DURATIONS = ['0.5h', '1h', '1.5h', '2h', '3h', '4h', '6h', '8h'];

export const StepServices = ({ data, update, onBack, onNext }) => {
  const { services } = data;

  const patchService = (index, patch) =>
    update({ services: services.map((s, i) => (i === index ? { ...s, ...patch } : s)) });

  const addService = () =>
    update({ services: [...services, { name: '', duration: '' }] });

  const removeService = (index) =>
    update({ services: services.filter((_, i) => i !== index) });

  const canContinue = services.some((s) => s.name && s.duration);

  return (
    <OnboardingShell
      step={4}
      title="Configure services"
      subtitle="These are the types of work your team handles."
    >
      <div className="onb-body-center">
        {services.map((service, index) => (
          <div key={index} className="onb-service-row">
            <div className="input-group">
              {index === 0 && <span className="field-label">Service Name*</span>}
              <input
                className="field-input"
                placeholder="e.g. Deep Clean"
                value={service.name}
                onChange={(e) => patchService(index, { name: e.target.value })}
              />
            </div>

            <div className="input-group onb-service-time">
              {index === 0 && <span className="field-label">Est. Time*</span>}
              <Select
                placeholder="Time"
                options={DURATIONS}
                value={service.duration}
                onChange={(e) => patchService(index, { duration: e.target.value })}
              />
            </div>

            <button
              type="button"
              aria-label={`Remove service ${index + 1}`}
              onClick={() => removeService(index)}
              className={`onb-remove-btn ${index === 0 ? 'invisible' : ''}`}
              disabled={index === 0}
            >
              <X className="size-[22px]" strokeWidth={2} />
            </button>
          </div>
        ))}

        <MutedPillButton icon={Plus} onClick={addService}>
          Add Service
        </MutedPillButton>
      </div>

      <WizardFooter onBack={onBack} onNext={onNext} canContinue={canContinue} />
    </OnboardingShell>
  );
};
