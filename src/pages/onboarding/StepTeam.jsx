import React, { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, UsersRound } from 'lucide-react';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { AddMemberModal } from '../../components/addMemberModal';
import {
  DarkPillButton,
  ErrorBanner,
  MutedPillButton,
  WizardFooter,
} from '../../components/onboarding/WizardControls';
import { getErrorMessage } from '../../api/client';
import {
  MEMBER_ROLE,
  ROLE_LABEL,
  createMemberApi,
  getMemberApi,
  listMembersApi,
  removeMemberApi,
  updateMemberApi,
} from '../../api/users';
import { listCrewsApi, setMemberCrewApi } from '../../api/crews';

const CREW_COLOR_MAP = {
  pink: '#ff1fad',
  violent: '#903bff',
  green: '#00c064',
  cyan: '#00c9c6',
  red: '#f30000',
  orange: '#f96c00',
  blue: '#0095ff',
  yellow: '#edba00',
  maroon: '#7b1f2b',
};

/**
 * Everyone added here is created as a technician. The role enum also accepts
 * `crew-lead`, but a lead is only ever promoted from an existing technician
 * when a crew is created — someone saved directly as a lead could never then
 * be picked to lead one.
 */
const ROLE_OPTIONS = [{ id: MEMBER_ROLE, label: ROLE_LABEL[MEMBER_ROLE] }];

export const StepTeam = ({ owner, onBack, onNext }) => {
  const [members, setMembers] = useState([]);
  const [crews, setCrews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // null = closed, {} = adding, {id,...} = editing that member
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [nextMembers, nextCrews] = await Promise.all([
        listMembersApi(),
        listCrewsApi(),
      ]);
      setMembers(nextMembers);
      setCrews(nextCrews);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your team.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveMember = async (form) => {
    setSaving(true);
    setModalError('');
    try {
      const existing = form.id
        ? await updateMemberApi(form.id, form)
        : await createMemberApi(form);

      // Crew membership is written through the crew endpoints — the user ones
      // set only `assignToCrew`, leaving the crew's own member list behind.
      if ((form.crew ?? '') !== (existing.crew ?? '')) {
        await setMemberCrewApi({
          memberId: existing.id,
          fromCrewId: existing.crew,
          toCrewId: form.crew,
        });
      }

      await load();
      setDraft(null);
    } catch (err) {
      setModalError(getErrorMessage(err, 'Could not save this member.'));
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (id) => {
    setError('');
    // Optimistic: the row disappears immediately and comes back if the
    // delete fails, since a soft-delete has nothing to show in the meantime.
    const previous = members;
    setMembers((prev) => prev.filter((m) => m.id !== id));
    try {
      await removeMemberApi(id);
    } catch (err) {
      setMembers(previous);
      setError(getErrorMessage(err, 'Could not remove this member.'));
    }
  };

  const crewOptions = [
    { id: '', label: 'No crew' },
    ...crews.map((crew) => ({
      id: crew.id,
      label: crew.name,
      dot: CREW_COLOR_MAP[crew.color] ?? '#6A6A6A',
    })),
  ];

  const ownerName = owner?.fullName || owner?.email || 'You';

  return (
    <OnboardingShell
      step={3}
      title="Invite your team"
      subtitle="Add the people who will use ServiceOS. You can always invite more later."
    >
      <div className="onb-body-center">
        <div className="onb-panel">
          <span className="onb-panel-strong">{ownerName} (You)</span>
          <span>Admin</span>
        </div>

        <ErrorBanner>{error}</ErrorBanner>

        {loading ? (
          <p className="onb-loading">Loading your team…</p>
        ) : members.length === 0 ? (
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
                      <span className="onb-list-row-meta">{member.roleLabel}</span>
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
          member={{ role: MEMBER_ROLE, ...draft }}
          roleOptions={ROLE_OPTIONS}
          crewOptions={crewOptions}
          loadMember={draft.id ? () => getMemberApi(draft.id) : undefined}
          requireContact
          saving={saving}
          error={modalError}
          onSave={saveMember}
          onClose={() => {
            setDraft(null);
            setModalError('');
          }}
        />
      )}
    </OnboardingShell>
  );
};
