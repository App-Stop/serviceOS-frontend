import React, { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, UsersRound } from 'lucide-react';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { CreateCrewModal } from '../../components/createCrewModal';
import {
  DarkPillButton,
  ErrorBanner,
  MutedPillButton,
  WizardFooter,
} from '../../components/onboarding/WizardControls';
import { getErrorMessage } from '../../api/client';
import { createCrewApi, listCrewsApi, removeCrewApi, updateCrewApi } from '../../api/crews';
import { listMembersApi } from '../../api/users';

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

export const StepCrews = ({ onBack, onNext }) => {
  const [crews, setCrews] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // null = closed, {} = creating, {id,...} = editing that crew
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [nextCrews, nextMembers] = await Promise.all([
        listCrewsApi(),
        listMembersApi(),
      ]);
      setCrews(nextCrews);
      setMembers(nextMembers);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your crews.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveCrew = async (form) => {
    setSaving(true);
    setModalError('');
    try {
      if (form.id) {
        await updateCrewApi(form.id, form);
      } else {
        await createCrewApi(form);
      }
      // Creating a crew promotes its lead and re-points every member's
      // `assignToCrew`, so the roster is refetched rather than patched.
      await load();
      setDraft(null);
    } catch (err) {
      setModalError(getErrorMessage(err, 'Could not save this crew.'));
    } finally {
      setSaving(false);
    }
  };

  const removeCrew = async (id) => {
    setError('');
    try {
      await removeCrewApi(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not remove this crew.'));
    }
  };

  /**
   * A person belongs to exactly one crew, so only the unassigned are offered —
   * plus whoever is already on the crew being edited. The company owner is
   * never a candidate: a crew lead is promoted from a technician, and the
   * owner's `company` role can't be promoted.
   */
  const roster = members
    .filter((member) => !member.crew || member.crew === draft?.id)
    .map((member) => ({ id: member.id, label: member.name }));

  const takenColors = crews
    .filter((crew) => crew.id !== draft?.id)
    .map((crew) => crew.color);

  return (
    <OnboardingShell
      step={3}
      title="Setup your crew"
      subtitle="Group your technicians into crews. Assign jobs by crew."
    >
      <div className="onb-body-center">
        <ErrorBanner>{error}</ErrorBanner>

        {loading ? (
          <p className="onb-loading">Loading your crews…</p>
        ) : crews.length === 0 ? (
          <>
            <div className="onb-empty">
              <div className="flex items-center justify-center gap-[10px]">
                <UsersRound className="size-[30px]" strokeWidth={2} />
                <UsersRound className="size-[60px]" strokeWidth={2} />
                <UsersRound className="size-[30px]" strokeWidth={2} />
              </div>
              <span className="onb-empty-title">No crews yet</span>
              <span className="onb-empty-text">
                {members.length === 0
                  ? 'Add team members first — a crew needs a lead.'
                  : 'Click below to create your first crew'}
              </span>
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
                    {[crew.leadName, ...crew.memberNames].filter(Boolean).join(', ')}
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
          takenColors={takenColors}
          saving={saving}
          error={modalError}
          onSave={saveCrew}
          onClose={() => {
            setDraft(null);
            setModalError('');
          }}
        />
      )}
    </OnboardingShell>
  );
};
