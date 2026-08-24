import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { AddMemberModal } from '../components/addMemberModal';
import { CreateCrewModal } from '../components/createCrewModal';
import {
  useTeamMembers,
  useCrews,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  addCrew,
  updateCrew,
  removeCrew,
  crewColor,
} from '../data/team';
import { initials } from '../data/customers';
import glow from '../assets/button-glow.svg';
import './Team.css';

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

  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'crews'
  const [query, setQuery] = useState('');

  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const [crewModalOpen, setCrewModalOpen] = useState(false);
  const [editingCrew, setEditingCrew] = useState(null);

  const filteredMembers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.role.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        m.phone.includes(term) ||
        m.crew.toLowerCase().includes(term),
    );
  }, [members, query]);

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

  const handleSaveMember = (formData) => {
    if (editingMember) {
      updateTeamMember(editingMember.id, formData);
    } else {
      addTeamMember(formData);
    }
    setMemberModalOpen(false);
    setEditingMember(null);
  };

  const handleSaveCrew = (formData) => {
    if (editingCrew) {
      updateCrew(editingCrew.id, formData);
    } else {
      addCrew(formData);
    }
    setCrewModalOpen(false);
    setEditingCrew(null);
  };

  const rosterNames = useMemo(() => members.map((m) => m.name), [members]);

  return (
    <AppShell>
      <div className="app-shell__content">
        <div className="page-title">
          <h1 className="page-title__heading">Team</h1>
          <p className="page-title__subheading">
            {activeTab === 'members'
              ? `${members.length} team members`
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
                  {filteredMembers.map((member, index) => (
                    <tr
                      className="team__row cursor-pointer"
                      key={member.id}
                      onClick={() => navigate(`/team/${member.id}`)}
                    >
                      <td>{index + 1}</td>
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
                            onClick={() => removeTeamMember(member.id)}
                            aria-label={`Delete ${member.name}`}
                          >
                            <Trash2 size={16} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredMembers.length === 0 && (
                    <tr>
                      <td className="team__empty" colSpan={8}>
                        No team members match your search.
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
                  {filteredCrews.map((crew, index) => (
                    <tr className="team__row" key={crew.id}>
                      <td>{index + 1}</td>
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
                            onClick={() => removeCrew(crew.id)}
                            aria-label={`Delete ${crew.name}`}
                          >
                            <Trash2 size={16} strokeWidth={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredCrews.length === 0 && (
                    <tr>
                      <td className="team__empty" colSpan={7}>
                        No crews match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {memberModalOpen && (
        <AddMemberModal
          key={editingMember ? editingMember.id : 'new-member'}
          member={editingMember}
          crews={crews}
          onSave={handleSaveMember}
          onClose={() => {
            setMemberModalOpen(false);
            setEditingMember(null);
          }}
        />
      )}

      {crewModalOpen && (
        <CreateCrewModal
          key={editingCrew ? editingCrew.id : 'new-crew'}
          crew={editingCrew}
          roster={rosterNames}
          onSave={handleSaveCrew}
          onClose={() => {
            setCrewModalOpen(false);
            setEditingCrew(null);
          }}
        />
      )}
    </AppShell>
  );
};

export default Team;