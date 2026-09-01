import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { AddMemberModal } from '../components/addMemberModal';
import { CreateCrewModal } from '../components/createCrewModal';
import { ConfirmDialog } from '../components/profile/ConfirmDialog';
import { Pagination } from '../components/Pagination';
import {
  useTeamMembers,
  useCrews,
  useTeamLoaded,
  fetchMembersPage,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  addCrew,
  updateCrew,
  removeCrew,
  crewColor,
} from '../data/team';
import { initials } from '../data/customers';
import { isLiveMode } from '../appMode';
import { getErrorMessage } from '../api/client';
import { MEMBER_ROLE_OPTIONS, getMemberApi } from '../api/users';
import glow from '../assets/button-glow.svg';
import './Team.css';

/**
 * Live mode only ever creates technicians — a crew lead is promoted when a
 * crew is built around them, and the API refuses to promote anyone who isn't
 * currently a technician. An existing lead still shows their own role while
 * being edited.
 */
const [TECHNICIAN_OPTION, CREW_LEAD_OPTION] = MEMBER_ROLE_OPTIONS;

const getCrewColor = (crewName, crewsList) => {
  const found = crewsList.find(
    (c) => c.name.toLowerCase().trim() === crewName.toLowerCase().trim(),
  );
  return crewColor(found?.color);
};

const Team = () => {
  const navigate = useNavigate();
  const members = useTeamMembers();
  const crews = useCrews();
  const loaded = useTeamLoaded();
  const live = isLiveMode();

  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'crews'
  const [query, setQuery] = useState('');

  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const [crewModalOpen, setCrewModalOpen] = useState(false);
  const [editingCrew, setEditingCrew] = useState(null);

  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [pageError, setPageError] = useState('');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [memberPage, setMemberPage] = useState({
    items: [],
    pagination: { page: 1, limit: 20, totalCount: 0, totalPages: 0 },
  });
  const [pageLoading, setPageLoading] = useState(true);

  // Typing shouldn't fire a request per keystroke against the API.
  const [search, setSearch] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setSearch(query), 300);
    return () => clearTimeout(id);
  }, [query]);

  // A narrower result set can leave the current page past the end.
  useEffect(() => {
    setPage(1);
  }, [search, limit, activeTab]);

  /**
   * The members table is paged by the API (`GET /users/get` takes page/limit
   * and answers with the totals); the demo store pages the same shape locally.
   * Crew names are resolved from the loaded crews, so the page is re-read when
   * those change.
   */
  const loadMembers = useCallback(async () => {
    setPageLoading(true);
    try {
      setMemberPage(await fetchMembersPage({ page, limit, search }));
    } catch (error) {
      setPageError(getErrorMessage(error, 'Could not load your team.'));
    } finally {
      setPageLoading(false);
    }
  }, [page, limit, search, crews]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const pagedMembers = memberPage.items;
  const memberPagination = memberPage.pagination;

  const filteredCrews = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return crews;
    return crews.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.lead.toLowerCase().includes(term) ||
        c.members.some((m) => m.toLowerCase().includes(term)),
    );
  }, [crews, query]);

  // `GET /crews/` has no page/limit — it returns the whole list — so the crews
  // tab is paged here, over what's already loaded.
  const { pagedCrews, crewPagination } = useMemo(() => {
    const totalCount = filteredCrews.length;
    const start = (page - 1) * limit;

    return {
      pagedCrews: filteredCrews.slice(start, start + limit),
      crewPagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 0,
      },
    };
  }, [filteredCrews, page, limit]);

  // Deleting the last row of the last page would otherwise strand the table
  // past the end of the list.
  const activePagination =
    activeTab === 'members' ? memberPagination : crewPagination;

  useEffect(() => {
    const { totalPages } = activePagination;
    if (totalPages > 0 && page > totalPages) setPage(totalPages);
  }, [activePagination, page]);

  // Saves go through the store, which writes to the API in live mode, so the
  // dialog stays open on failure with the reason shown inside it.
  const handleSaveMember = async (formData) => {
    setSaving(true);
    setModalError('');
    try {
      if (editingMember) {
        await updateTeamMember(editingMember.id, formData);
      } else {
        await addTeamMember(formData);
      }
      setMemberModalOpen(false);
      setEditingMember(null);
      await loadMembers();
    } catch (error) {
      setModalError(getErrorMessage(error, 'Could not save this member.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCrew = async (formData) => {
    setSaving(true);
    setModalError('');
    try {
      if (editingCrew) {
        await updateCrew(editingCrew.id, formData);
      } else {
        await addCrew(formData);
      }
      setCrewModalOpen(false);
      setEditingCrew(null);
    } catch (error) {
      setModalError(getErrorMessage(error, 'Could not save this crew.'));
    } finally {
      setSaving(false);
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'member'|'crew', item: object }

  const handleDeleteMember = (member) => {
    setDeleteConfirm({ type: 'member', item: member });
  };

  const confirmDeleteMember = async (member) => {
    setDeleteConfirm(null);
    setPageError('');
    try {
      await removeTeamMember(member.id);
      await loadMembers();
    } catch (error) {
      setPageError(getErrorMessage(error, 'Could not remove this member.'));
    }
  };

  const handleDeleteCrew = (crew) => {
    setDeleteConfirm({ type: 'crew', item: crew });
  };

  const confirmDeleteCrew = async (crew) => {
    setDeleteConfirm(null);
    setPageError('');
    try {
      await removeCrew(crew.id);
    } catch (error) {
      setPageError(getErrorMessage(error, 'Could not delete this crew.'));
    }
  };

  const closeMemberModal = () => {
    setMemberModalOpen(false);
    setEditingMember(null);
    setModalError('');
  };

  const closeCrewModal = () => {
    setCrewModalOpen(false);
    setEditingCrew(null);
    setModalError('');
  };

  /**
   * Someone leads or belongs to exactly one crew, so only the unassigned are
   * offered — plus whoever is already on the crew being edited.
   */
  const rosterNames = useMemo(() => {
    if (!live) return members.map((m) => m.name);

    const current = new Set(
      editingCrew ? [editingCrew.lead, ...(editingCrew.members ?? [])] : [],
    );

    return members
      .filter((m) => !m.crew || m.crew === 'Solo' || current.has(m.name))
      .map((m) => m.name);
  }, [live, members, editingCrew]);

  const takenColors = useMemo(
    () => crews.filter((c) => c.id !== editingCrew?.id).map((c) => c.color),
    [crews, editingCrew],
  );

  /**
   * Opens the edit form on the server's current values rather than the row the
   * table happens to be holding. The record comes back with a crew id, which is
   * mapped to the name the form binds to.
   */
  const loadEditingMember = useCallback(async () => {
    const fresh = await getMemberApi(editingMember.id);

    return {
      ...fresh,
      role: fresh.roleLabel,
      crew: crews.find((crew) => crew.id === fresh.crew)?.name ?? 'Solo',
    };
  }, [editingMember, crews]);

  const roleOptions = useMemo(() => {
    if (!live) return undefined;
    return editingMember?.role === CREW_LEAD_OPTION.id
      ? [TECHNICIAN_OPTION, CREW_LEAD_OPTION]
      : [TECHNICIAN_OPTION];
  }, [live, editingMember]);

  return (
    <AppShell>
      <div className="app-shell__content">
        <div className="page-title">
          <h1 className="page-title__heading">Team</h1>
          <p className="page-title__subheading">
            {activeTab === 'members'
              ? `${memberPagination.totalCount} team members`
              : `${crews.length} crews`}
          </p>
        </div>

        <div className="team__body">
          <div className="team__toolbar">
            <div className="team__toolbar-lead">
              <div className="team__search">
                <Search className="team__search-icon" size={22} strokeWidth={2} />
                <input
                  type="text"
                  className="team__search-input"
                  placeholder={
                    activeTab === 'members' ? 'Search team...' : 'Search crews...'
                  }
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search team"
                />
              </div>

              <div className="team__tabs">
                <button
                  type="button"
                  className={`pill-button pill-button--lg${
                    activeTab === 'members' ? ' pill-button--selected' : ''
                  }`}
                  onClick={() => setActiveTab('members')}
                  aria-pressed={activeTab === 'members'}
                >
                  <span className="pill-button__text">Members</span>
                </button>
                <button
                  type="button"
                  className={`pill-button pill-button--lg${
                    activeTab === 'crews' ? ' pill-button--selected' : ''
                  }`}
                  onClick={() => setActiveTab('crews')}
                  aria-pressed={activeTab === 'crews'}
                >
                  <span className="pill-button__text">Crews</span>
                </button>
              </div>
            </div>

            {activeTab === 'members' ? (
              <button
                type="button"
                className="cta-button"
                onClick={() => {
                  setEditingMember(null);
                  setMemberModalOpen(true);
                }}
              >
                <img className="cta-button__glow" src={glow} alt="" aria-hidden="true" />
                <Plus size={20} strokeWidth={2} />
                <span className="cta-button__label">Add Member</span>
              </button>
            ) : (
              <button
                type="button"
                className="cta-button"
                onClick={() => {
                  setEditingCrew(null);
                  setCrewModalOpen(true);
                }}
              >
                <img className="cta-button__glow" src={glow} alt="" aria-hidden="true" />
                <Plus size={20} strokeWidth={2} />
                <span className="cta-button__label">Add Crew</span>
              </button>
            )}
          </div>

          {pageError && (
            <p className="team__error" role="alert">
              {pageError}
            </p>
          )}

          <div className="team__table-wrap">
            {activeTab === 'members' ? (
              <table className="team__table">
                <colgroup>
                  <col className="team__col--id" />
                  <col className="team__col--name" />
                  <col className="team__col--phone" />
                  <col className="team__col--role" />
                  <col className="team__col--email" />
                  <col className="team__col--crew" />
                  <col className="team__col--status" />
                  <col className="team__col--actions" />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Name</th>
                    <th scope="col">Phone</th>
                    <th scope="col">Role</th>
                    <th scope="col">Email</th>
                    <th scope="col">Crew</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagedMembers.map((member, index) => (
                    <tr
                      className="team__row cursor-pointer"
                      key={member.id}
                      onClick={() => navigate(`/team/${member.id}`)}
                    >
                      <td>{(page - 1) * limit + index + 1}</td>
                      <td>
                        <span className="team__person">
                          <span className="avatar-initials avatar-initials--sm">
                            {initials(member.name)}
                          </span>
                          <span className="team__person-name">{member.name}</span>
                        </span>
                      </td>
                      <td>{member.phone || '-'}</td>
                      <td>{member.role}</td>
                      <td>{member.email || '-'}</td>
                      <td>
                        {member.crew && member.crew !== 'Solo' ? (
                          <span className="team__crew-badge">
                            <span
                              className="team__crew-dot"
                              style={{
                                backgroundColor: getCrewColor(member.crew, crews),
                              }}
                            />
                            {member.crew}
                          </span>
                        ) : (
                          <span className="text-black-200">Solo</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`team__status-chip team__status-chip--${
                            member.status === 'assigned' ? 'assigned' : 'unassigned'
                          }`}
                        >
                          {member.status === 'assigned' ? 'Assigned' : 'Unassigned'}
                        </span>
                      </td>
                      <td onClick={(event) => event.stopPropagation()}>
                        <div className="team__actions">
                          <button
                            type="button"
                            className="team__action-btn"
                            onClick={() => {
                              setEditingMember(member);
                              setMemberModalOpen(true);
                            }}
                            aria-label={`Edit ${member.name}`}
                          >
                            <Pencil size={16} strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            className="team__action-btn team__action-btn--danger"
                            onClick={() => handleDeleteMember(member)}
                            aria-label={`Delete ${member.name}`}
                          >
                            <Trash2 size={16} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {pagedMembers.length === 0 && (
                    <tr>
                      <td className="team__empty" colSpan={8}>
                        {pageLoading
                          ? 'Loading your team…'
                          : query.trim()
                            ? 'No team members match your search.'
                            : 'No team members yet. Add your first one to get started.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="team__table">
                <colgroup>
                  <col className="team__col--id" />
                  <col className="team__col--name" />
                  <col className="team__col--lead" />
                  <col className="team__col--job" />
                  <col className="team__col--members" />
                  <col className="team__col--status" />
                  <col className="team__col--actions" />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Crew Name</th>
                    <th scope="col">Crew Lead</th>
                    <th scope="col">Assigned Job</th>
                    <th scope="col">Members</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagedCrews.map((crew, index) => (
                    <tr className="team__row" key={crew.id}>
                      <td>{(page - 1) * limit + index + 1}</td>
                      <td>
                        <span className="team__crew-badge">
                          <span
                            className="team__crew-dot"
                            style={{
                              backgroundColor:
                                crewColor(crew.color),
                            }}
                          />
                          {crew.name}
                        </span>
                      </td>
                      <td>
                        {crew.lead ? (
                          <span className="team__person">
                            <span className="avatar-initials avatar-initials--sm">
                              {initials(crew.lead)}
                            </span>
                            <span className="team__person-name">{crew.lead}</span>
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>{crew.assignedJob || '-'}</td>
                      <td>{crew.membersCount ?? crew.members?.length ?? 0}</td>
                      <td>
                        <span
                          className={`team__status-chip team__status-chip--${
                            crew.status === 'assigned' || crew.lead
                              ? 'assigned'
                              : 'unassigned'
                          }`}
                        >
                          {crew.status === 'assigned' || crew.lead
                            ? 'Assigned'
                            : 'Unassigned'}
                        </span>
                      </td>
                      <td>
                        <div className="team__actions">
                          <button
                            type="button"
                            className="team__action-btn"
                            onClick={() => {
                              setEditingCrew(crew);
                              setCrewModalOpen(true);
                            }}
                            aria-label={`Edit ${crew.name}`}
                          >
                            <Pencil size={16} strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            className="team__action-btn team__action-btn--danger"
                            onClick={() => handleDeleteCrew(crew)}
                            aria-label={`Delete ${crew.name}`}
                          >
                            <Trash2 size={16} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {pagedCrews.length === 0 && (
                    <tr>
                      <td className="team__empty" colSpan={7}>
                        {!loaded
                          ? 'Loading your crews…'
                          : query.trim()
                            ? 'No crews match your search.'
                            : 'No crews yet. Create one to group your technicians.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          <Pagination
            {...activePagination}
            page={page}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
            disabled={activeTab === 'members' && pageLoading}
          />
        </div>
      </div>

      {memberModalOpen && (
        <AddMemberModal
          key={editingMember ? editingMember.id : 'new-member'}
          member={editingMember}
          crews={crews}
          roleOptions={roleOptions}
          loadMember={live && editingMember ? loadEditingMember : undefined}
          requireContact={live}
          saving={saving}
          error={modalError}
          onSave={handleSaveMember}
          onClose={closeMemberModal}
        />
      )}

      {crewModalOpen && (
        <CreateCrewModal
          key={editingCrew ? editingCrew.id : 'new-crew'}
          crew={editingCrew}
          roster={rosterNames}
          takenColors={takenColors}
          saving={saving}
          error={modalError}
          onSave={handleSaveCrew}
          onClose={closeCrewModal}
        />
      )}

      {deleteConfirm?.type === 'member' && (
        <ConfirmDialog
          title="Remove Team Member"
          description={`Are you sure you want to remove ${deleteConfirm.item.name} from your team? This action cannot be undone.`}
          confirmLabel="Remove Member"
          cancelLabel="Cancel"
          onConfirm={() => confirmDeleteMember(deleteConfirm.item)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {deleteConfirm?.type === 'crew' && (
        <ConfirmDialog
          title="Delete Crew"
          description={`Are you sure you want to delete ${deleteConfirm.item.name || 'this crew'}? This action cannot be undone.`}
          confirmLabel="Delete Crew"
          cancelLabel="Cancel"
          onConfirm={() => confirmDeleteCrew(deleteConfirm.item)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </AppShell>
  );
};

export default Team;