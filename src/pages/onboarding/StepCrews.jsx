import React, { useState } from 'react';
import { Pencil, Plus, Trash2, UsersRound } from 'lucide-react';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { CreateCrewModal } from '../../components/createCrewModal';
import {
  DarkPillButton,
  MutedPillButton,
  WizardFooter,
} from '../../components/onboarding/WizardControls';

const ACCENT_CLASS = {
  pink: 'bg-pink',
  violent: 'bg-violent',
  green: 'bg-green',
  cyan: 'bg-cyan',
  red: 'bg-red',
  orange: 'bg-orange',
  blue: 'bg-blue',
  yellow: 'bg-yellow',
  maroon: 'bg-maroon',
};

let nextId = 1;

export const StepCrews = ({ data, update, onBack, onNext }) => {
  const { crews, members } = data;
  // null = closed, {} = creating, {id,...} = editing that crew
  const [draft, setDraft] = useState(null);

  const roster = ['John Smith', ...members.map((m) => m.name).filter(Boolean)];

  const saveCrew = (form) => {
    update({
      crews: form.id
        ? crews.map((c) => (c.id === form.id ? form : c))
        : [...crews, { ...form, id: `c${nextId++}` }],
    });
    setDraft(null);
  };

  const removeCrew = (id) => update({ crews: crews.filter((c) => c.id !== id) });

  return (
    <OnboardingShell
      step={3}
      title="Setup your crew"
      subtitle="Group your technicians into crews. Assign jobs by crew."
    >
      <div className="onb-body-center">
        {crews.length === 0 ? (
          <>
            <div className="onb-empty">
              <div className="flex items-center justify-center gap-[10px]">
                <UsersRound className="size-[30px]" strokeWidth={2} />
                <UsersRound className="size-[60px]" strokeWidth={2} />
                <UsersRound className="size-[30px]" strokeWidth={2} />
              </div>
              <span className="onb-empty-title">No crews yet</span>
              <span className="onb-empty-text">Click below to create your first crew</span>
            </div>
            <DarkPillButton icon={Plus} onClick={() => setDraft({})}>
              Create Crew
            </DarkPillButton>
          </>
        ) : (
          <>
            {crews.map((crew) => (
              <div key={crew.id} className="onb-crew-card">
                <span className={`onb-crew-accent ${ACCENT_CLASS[crew.color] ?? 'bg-pink'}`} />
                <div className="onb-list-row-main">
                  <span className="onb-crew-name">{crew.name || 'Untitled crew'}</span>
                  <span className="onb-crew-meta">
                    {[crew.lead, ...crew.members].filter(Boolean).join(', ')}
                  </span>
                </div>
                <button
                  type="button"
                  className="onb-icon-btn"
                  aria-label={`Remove ${crew.name || 'crew'}`}
                  onClick={() => removeCrew(crew.id)}
                >
                  <Trash2 className="size-[16px]" strokeWidth={2} />
                </button>
                <button type="button" className="onb-btn-xs" onClick={() => setDraft(crew)}>
                  <Pencil className="size-[16px] shrink-0" strokeWidth={2} />
                  <span className="px-[var(--spacing-xxs)]">Edit</span>
                </button>
              </div>
            ))}

            <MutedPillButton icon={Plus} onClick={() => setDraft({})}>
              Create Another Crew
            </MutedPillButton>
          </>
        )}
      </div>

      <WizardFooter
        onBack={onBack}
        onNext={onNext}
        skipLabel="I’ll do this later"
        canContinue={crews.length > 0}
      />

      {draft && (
        <CreateCrewModal
          key={draft.id ?? 'new'}
          crew={draft}
          roster={roster}
          onSave={saveCrew}
          onClose={() => setDraft(null)}
        />
      )}
    </OnboardingShell>
  );
};
