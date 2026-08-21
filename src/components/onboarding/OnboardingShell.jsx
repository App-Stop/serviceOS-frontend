import React from 'react';
import bgFadeDark from '../../assets/bgFadeDark.svg';

export const TOTAL_STEPS = 5;

const ProgressSteps = ({ current }) => (
  <div className="onb-progress">
    {Array.from({ length: TOTAL_STEPS }, (_, i) => (
      <span
        key={i}
        className={`onb-progress-dot ${i < current ? 'onb-progress-dot-active' : ''}`}
      />
    ))}
  </div>
);

/**
 * Dark onboarding canvas + centered white wizard card.
 * `step` is the 1-based progress index shown by the five dots.
 */
export const OnboardingShell = ({ step, title, subtitle, children }) => (
  <div className="onb-screen">
    <img src={bgFadeDark} alt="" className="onb-bg" />

    <div className="onb-logo">
      <span className="onb-logo-text">ServiceOS</span>
    </div>

    <div className="onb-stage">
      <div className="onb-card">
        <ProgressSteps current={step} />

        <div className="onb-header">
          <h1 className="onb-title">{title}</h1>
          <p className="onb-subtitle">{subtitle}</p>
        </div>

        {children}
      </div>
    </div>
  </div>
);
