import React from 'react';
import {
  BrushCleaning,
  Construction,
  ThermometerSnowflake,
  TreeDeciduous,
  Wrench,
  Zap,
} from 'lucide-react';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { InputGroup } from '../../components/InputGroup';
import { Chip, WizardFooter } from '../../components/onboarding/WizardControls';

const INDUSTRIES = [
  { label: 'Plumbing', icon: Wrench },
  { label: 'Electrical', icon: Zap },
  { label: 'HVAC', icon: ThermometerSnowflake },
  { label: 'Cleaning', icon: BrushCleaning },
  { label: 'Landscaping', icon: TreeDeciduous },
  { label: 'Construction', icon: Construction },
  { label: 'Other' },
];

const TEAM_SIZES = ['2-5', '6-15', '16-50', '50+'];

export const StepBusiness = ({ data, update, onNext }) => {
  const canContinue = Boolean(data.company && data.phone && data.email && data.serviceArea);

  return (
    <OnboardingShell
      step={1}
      title="Set up your business"
      subtitle="Tell us about your company so we can personalize your experience."
    >
      <div className="onb-body">
        <div className="onb-row">
          <InputGroup
            label="Company Name"
            required
            placeholder="e.g. Acme Services LLC"
            value={data.company}
            onChange={(e) => update({ company: e.target.value })}
          />
          <InputGroup
            label="Phone"
            required
            type="tel"
            placeholder="(555) 000-0000"
            value={data.phone}
            onChange={(e) => update({ phone: e.target.value })}
          />
        </div>

        <div className="onb-row">
          <InputGroup
            label="Email"
            required
            type="email"
            placeholder="name@company.com"
            value={data.email}
            onChange={(e) => update({ email: e.target.value })}
          />
          <InputGroup
            label="Service Area"
            required
            placeholder="e.g. Los Angeles, CA"
            value={data.serviceArea}
            onChange={(e) => update({ serviceArea: e.target.value })}
          />
        </div>

        <InputGroup
          label="Business Address"
          placeholder="Enter your business’s address"
          value={data.address}
          onChange={(e) => update({ address: e.target.value })}
        />

        <div className="input-group">
          <span className="field-label">Industry</span>
          <div className="onb-chip-group">
            {INDUSTRIES.map(({ label, icon }) => (
              <Chip
                key={label}
                icon={icon}
                label={label}
                selected={data.industry === label}
                onClick={() => update({ industry: label })}
              />
            ))}
          </div>
        </div>

        <div className="input-group">
          <span className="field-label">Team Size</span>
          <div className="onb-chip-group">
            {TEAM_SIZES.map((size) => (
              <Chip
                key={size}
                label={size}
                selected={data.teamSize === size}
                onClick={() => update({ teamSize: size })}
              />
            ))}
          </div>
        </div>
      </div>

      <WizardFooter onNext={onNext} canContinue={canContinue} />
    </OnboardingShell>
  );
};
