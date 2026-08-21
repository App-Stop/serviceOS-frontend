import React from 'react';
import { ArrowLeft, ArrowRight, ChevronDown } from 'lucide-react';

/** Pill chip used for industry, team size and role pickers. */
export const Chip = ({ icon: Icon, label, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={`onb-chip ${selected ? 'onb-chip-active' : ''}`}
  >
    {Icon && <Icon className="size-[20px] shrink-0" strokeWidth={2} />}
    {label}
  </button>
);

/** Large selectable card with an icon badge and a check mark when active. */
export const OptionCard = ({ icon: Icon, checkIcon: CheckIcon, title, description, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={`onb-option ${selected ? 'onb-option-active' : ''}`}
  >
    <div className="onb-option-head">
      <span className="onb-option-icon">
        <Icon className="size-[24px]" strokeWidth={2} />
      </span>
      {selected && (
        <span className="onb-option-check">
          <CheckIcon className="size-[16px]" strokeWidth={2} />
        </span>
      )}
    </div>
    <div className="onb-option-text">
      <span className="onb-option-title">{title}</span>
      <span className="onb-option-desc">{description}</span>
    </div>
  </button>
);

/** Dark pill with the radial sheen behind its label. */
export const DarkPillButton = ({ icon: Icon, children, onClick, size = 'sm' }) => (
  <button type="button" onClick={onClick} className="onb-btn-sm onb-btn-sm-dark">
    <span className={size === 'sm' ? 'onb-glow-sm' : 'onb-glow'} />
    {Icon && <Icon className="relative size-[18px] shrink-0" strokeWidth={2} />}
    <span className="relative">{children}</span>
  </button>
);

/** Light grey pill used once a list already has entries. */
export const MutedPillButton = ({ icon: Icon, children, onClick }) => (
  <button type="button" onClick={onClick} className="onb-btn-sm onb-btn-sm-muted">
    {Icon && <Icon className="size-[20px] shrink-0" strokeWidth={2} />}
    {children}
  </button>
);

/** Native select styled as a Figma input, with the chevron affordance. */
export const Select = ({ value, onChange, options, placeholder }) => (
  <div className="onb-select-wrap">
    <select className="onb-select" value={value} onChange={onChange}>
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
    <ChevronDown className="onb-select-chevron" strokeWidth={2} />
  </div>
);

/**
 * Back + forward footer. When `skipLabel` is given and `canContinue` is false the
 * forward action renders as the outlined "I'll do this later" button instead.
 */
export const WizardFooter = ({
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextIcon: NextIcon = ArrowRight,
  skipLabel,
  canContinue = true,
}) => {
  const showSkip = Boolean(skipLabel) && !canContinue;

  return (
    <div className="onb-footer">
      {onBack && (
        <button type="button" onClick={onBack} className="onb-nav-btn">
          <ArrowLeft className="size-[18px] shrink-0" strokeWidth={2} />
          <span className="px-[var(--spacing-xxs)]">Back</span>
        </button>
      )}

      {showSkip ? (
        <button type="button" onClick={onNext} className="onb-nav-btn onb-nav-grow">
          <span className="px-[var(--spacing-xxs)]">{skipLabel}</span>
          <ArrowRight className="size-[18px] shrink-0" strokeWidth={2} />
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className="onb-nav-primary"
        >
          <span className="onb-glow" />
          {NextIcon !== ArrowRight && <NextIcon className="relative size-[20px] shrink-0" strokeWidth={2} />}
          <span className="relative px-[var(--spacing-xxs)]">{nextLabel}</span>
          {NextIcon === ArrowRight && <ArrowRight className="relative size-[20px] shrink-0" strokeWidth={2} />}
        </button>
      )}
    </div>
  );
};
