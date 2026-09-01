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

// `Company.phone` is stored as a number, so the field is kept to digits with an
// optional leading "+" rather than accepting display formatting that can't be
// sent as-is.
const sanitizePhone = (value) => {
  const digits = value.replace(/[^0-9]/g, '').slice(0, 14);
  return value.trimStart().startsWith('+') ? `+${digits}` : digits;
};

export const StepBusiness = ({ data, update, onNext }) => {
  // Every one of these is required by the onboarding endpoint — including the
  // address, industry and team size, which the layout doesn't mark with a star.
  const canContinue = Boolean(
    data.company.trim().length >= 2 &&
      data.phone &&
      data.serviceArea.trim() &&
      data.address.trim() &&
      data.industry &&
      data.teamSize,
  );

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
            inputMode="tel"
            value={data.phone}
            onChange={(e) => update({ phone: sanitizePhone(e.target.value) })}
          />
        </div>

        <div className="onb-row">
          <InputGroup
            label="Email"
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
          required
          placeholder="Enter your business’s address"
          value={data.address}
          onChange={(e) => update({ address: e.target.value })}
        />

        <div className="input-group">
          <span className="field-label">Industry*</span>
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
          <span className="field-label">Team Size*</span>
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
