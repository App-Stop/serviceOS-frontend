import React, { useState } from 'react';
import { Pencil, Plus, Trash2, UsersRound } from 'lucide-react';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { AddMemberModal } from '../../components/addMemberModal';
import {
  DarkPillButton,
  MutedPillButton,
  WizardFooter,
} from '../../components/onboarding/WizardControls';

let nextId = 1;

export const StepTeam = ({ data, update, onBack, onNext }) => {
  const { members, crews } = data;
  // null = closed, {} = adding, {id,...} = editing that member
  const [draft, setDraft] = useState(null);

  const saveMember = (form) => {
    update({
      members: form.id
        ? members.map((m) => (m.id === form.id ? form : m))
        : [...members, { ...form, id: `m${nextId++}` }],
    });
    setDraft(null);
  };

  const removeMember = (id) => update({ members: members.filter((m) => m.id !== id) });

  return (
    <OnboardingShell
      step={3}
      title="Invite your team"
      subtitle="Add the people who will use ServiceOS. You can always invite more later."
    >
      <div className="onb-body-center">
        <div className="onb-panel">
          <span className="onb-panel-strong">John Smith (You)</span>
          <span>Admin</span>
        </div>

        {members.length === 0 ? (
          <div className="onb-body-center">
            <div className="onb-empty">
              <UsersRound className="size-[60px]" strokeWidth={2} />
              <span className="onb-empty-title">No members yet</span>
              <span className="onb-empty-text">Click below to invite your team members</span>
            </div>
            <DarkPillButton icon={Plus} onClick={() => setDraft({})}>
              Add Members
            </DarkPillButton>
          </div>
        ) : (
          <>
            <div className="onb-list">
              <span className="onb-list-label">Invited ({members.length})</span>

              {members.map((member, index) => (
                <React.Fragment key={member.id}>
                  {index > 0 && <span className="onb-divider" />}
                  <div className="onb-list-row">
                    <div className="onb-list-row-main">
                      <span className="onb-list-row-title">{member.name}</span>
                      <span className="onb-list-row-meta">{member.role}</span>
                    </div>
                    <div className="onb-list-actions">
                      <button
                        type="button"
                        className="onb-icon-btn"
                        aria-label={`Remove ${member.name}`}
                        onClick={() => removeMember(member.id)}
                      >
                        <Trash2 className="size-[16px]" strokeWidth={2} />
                      </button>
                      <button
                        type="button"
                        className="onb-btn-xs"
                        onClick={() => setDraft(member)}
                      >
                        <Pencil className="size-[16px] shrink-0" strokeWidth={2} />
                        <span className="px-[var(--spacing-xxs)]">Edit</span>
                      </button>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>

            <MutedPillButton icon={Plus} onClick={() => setDraft({})}>
              Add Member
            </MutedPillButton>
          </>
        )}
      </div>

      <WizardFooter
        onBack={onBack}
        onNext={onNext}
        skipLabel="I’ll do this later"
        canContinue={members.length > 0}
      />

      {draft && (
        <AddMemberModal
          key={draft.id ?? 'new'}
          member={draft}
          crews={crews}
          onSave={saveMember}
          onClose={() => setDraft(null)}
        />
      )}
    </OnboardingShell>
  );
};
