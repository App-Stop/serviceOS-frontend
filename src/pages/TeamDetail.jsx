import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Hammer,
  BriefcaseBusiness,
  UserStar,
  Star,
  DollarSign,
  Pencil,
  LogIn,
  LogOut,
  Check,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { AddMemberModal } from '../components/addMemberModal';
import { useTeamMember, useCrews, updateTeamMember } from '../data/team';
import { initials } from '../data/customers';
import glow from '../assets/button-glow.svg';
import './TeamDetail.css';

const BackButton = () => (
  <Link className="ghost-button" to="/team">
    <ArrowLeft size={18} strokeWidth={2} />
    Back to Teams
  </Link>
);

const defaultJobHistory = [
  {
    id: 'jh1',
    title: 'Maplewood Community Center Renovation',
    status: 'scheduled',
    statusVariant: 'danger',
    assignee: 'Jason K.',
    date: 'Aug 13, 2026',
    time: '1:00 PM',
  },
  {
    id: 'jh2',
    title: 'Riverside Park Playground Upgrade',
    assignee: 'Emily R.',
    date: 'Sep 15, 2026',
    time: '10:30 AM',
  },
  {
    id: 'jh3',
    title: 'Downtown Library Expansion',
    assignee: 'Michael T.',
    date: 'Oct 22, 2026',
    time: '2:00 PM',
  },
  {
    id: 'jh4',
    title: 'Northside Community Art Fair',
    assignee: 'Sarah L.',
    date: 'Nov 5, 2026',
    time: '11:00 AM',
  },
  {
    id: 'jh5',
    title: 'Eastside Neighborhood Cleanup',
    assignee: 'David H.',
    date: 'Dec 12, 2026',
    time: '9:00 AM',
  },
  {
    id: 'jh6',
    title: 'Westlake Music Festival',
    assignee: 'Laura K.',
    date: 'Jan 14, 2027',
    time: '4:00 PM',
  },
];

const defaultActivity = [
  { id: 'ra1', type: 'in', title: 'Clocked in at 10:00 AM', time: '10m ago' },
  { id: 'ra2', type: 'out', title: 'Clocked out at 12:00 PM', time: '10m ago' },
  {
    id: 'ra3',
    type: 'check',
    title: 'Completed Job “Maplewood Community Center Renovation”',
    time: '10m ago',
  },
];

const TeamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const member = useTeamMember(id);
  const crews = useCrews();

  const [editModalOpen, setEditModalOpen] = useState(false);

  if (!member) {
    return (
      <AppShell topbarLead={<BackButton />}>
        <div className="app-shell__content">
          <div className="team-detail__missing">
            <h1 className="page-title__heading">Team member not found</h1>
            <p className="page-title__subheading">
              This record may have been removed or does not exist.
            </p>
            <button
              type="button"
              className="ghost-button"
              onClick={() => navigate('/team')}
            >
              Back to Teams
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const jobHistory = member.jobHistory?.length ? member.jobHistory : defaultJobHistory;
  const recentActivity = member.recentActivity?.length
    ? member.recentActivity
    : defaultActivity;

  const handleSaveMember = (formData) => {
    updateTeamMember(member.id, formData);
    setEditModalOpen(false);
  };

  return (
    <AppShell topbarLead={<BackButton />}>
      <div className="app-shell__content team-detail__content">
        <div className="team-detail__header">
          <div className="team-detail__profile">
            <div className="team-detail__avatar-lg">{initials(member.name)}</div>
            <h1 className="team-detail__name">{member.name}</h1>
            <p className="team-detail__subtitle">
              {member.role} • {member.crew || 'Solo'}
            </p>
          </div>

          <button
            type="button"
            className="cta-button"
            onClick={() => navigate('/jobs')}
          >
            <img className="cta-button__glow" src={glow} alt="" aria-hidden="true" />
            <Plus size={20} strokeWidth={2} />
            <span className="cta-button__label">Assign Job</span>
          </button>
        </div>

        <div className="team-detail__metrics">
          <div className="team-detail__metric-card">
            <div className="team-detail__metric-icon">
              <Hammer size={24} strokeWidth={2} />
            </div>
            <div>
              <div className="team-detail__metric-value">
                {member.activeJobs ?? 2}
              </div>
              <div className="team-detail__metric-label">Active Jobs</div>
            </div>
          </div>

          <div className="team-detail__metric-card">
            <div className="team-detail__metric-icon">
              <BriefcaseBusiness size={24} strokeWidth={2} />
            </div>
            <div>
              <div className="team-detail__metric-value">
                {member.jobsCompleted ?? 47}
              </div>
              <div className="team-detail__metric-label">Jobs Completed</div>
            </div>
          </div>

          <div className="team-detail__metric-card">
            <div className="team-detail__metric-icon">
              <UserStar size={24} strokeWidth={2} />
            </div>
            <div>
              <div className="team-detail__metric-value">
                {member.rating ?? '4.8'}
                <Star
                  size={24}
                  strokeWidth={2}
                  className="fill-yellow-500 text-yellow-500 ml-1"
                />
              </div>
              <div className="team-detail__metric-label">Rated</div>
            </div>
          </div>

          <div className="team-detail__metric-card">
            <div className="team-detail__metric-icon">
              <DollarSign size={24} strokeWidth={2} />
            </div>
            <div>
              <div className="team-detail__metric-value">
                {member.revenueGenerated ?? '$7,695'}
              </div>
              <div className="team-detail__metric-label">Revenue Generated</div>
            </div>
          </div>
        </div>

        <div className="team-detail__grid">
          <div className="team-detail__card">
            <div className="team-detail__card-header">
              <h2 className="team-detail__card-title">Job History</h2>
            </div>
            <div className="team-detail__job-list">
              {jobHistory.map((job) => (
                <div key={job.id} className="team-detail__job-item">
                  <div className="team-detail__job-info">
                    <div className="team-detail__job-title-row">
                      <span className="team-detail__job-title">{job.title}</span>
                      {job.status === 'scheduled' && (
                        <span className="invoice-chip invoice-chip--overdue">
                          Scheduled
                        </span>
                      )}
                      {job.status === 'onsite' && (
                        <span className="invoice-chip invoice-chip--sent">
                          In Progress
                        </span>
                      )}
                      {job.status === 'completed' && (
                        <span className="invoice-chip invoice-chip--paid">
                          Completed
                        </span>
                      )}
                    </div>
                    <div className="team-detail__job-assignee">
                      <span className="avatar-initials avatar-initials--sm shrink-0 size-4 text-[10px]">
                        {initials(job.assignee || member.name)}
                      </span>
                      <span>{job.assignee || member.name}</span>
                    </div>
                  </div>
                  <div className="team-detail__job-date">
                    <span>{job.date}</span>
                    <span className="team-detail__job-time">{job.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="team-detail__card">
              <div className="team-detail__card-header">
                <h2 className="team-detail__card-title">Member Information</h2>
                <button
                  type="button"
                  className="pill-button"
                  onClick={() => setEditModalOpen(true)}
                >
                  <Pencil size={14} strokeWidth={2} />
                  <span className="pill-button__text">Edit</span>
                </button>
              </div>

              <div className="team-detail__info-grid">
                <div className="team-detail__info-field">
                  <span className="team-detail__info-label">Phone</span>
                  <span className="team-detail__info-value">
                    {member.phone || '-'}
                  </span>
                </div>
                <div className="team-detail__info-field">
                  <span className="team-detail__info-label">Email</span>
                  <span className="team-detail__info-value">
                    {member.email || '-'}
                  </span>
                </div>
                <div className="team-detail__info-field">
                  <span className="team-detail__info-label">Role</span>
                  <span className="team-detail__info-value">{member.role}</span>
                </div>
                <div className="team-detail__info-field">
                  <span className="team-detail__info-label">Crew Assigned</span>
                  <span className="team-detail__info-value">
                    {member.crew || 'Solo'}
                  </span>
                </div>
              </div>
            </div>

            <div className="team-detail__card">
              <div className="team-detail__card-header">
                <h2 className="team-detail__card-title">Recent Activity</h2>
              </div>
              <div className="team-detail__activity-list">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="team-detail__activity-item">
                    <div
                      className={`team-detail__activity-icon team-detail__activity-icon--${
                        activity.type === 'in'
                          ? 'in'
                          : activity.type === 'out'
                          ? 'out'
                          : 'check'
                      }`}
                    >
                      {activity.type === 'in' && <LogIn size={20} strokeWidth={2} />}
                      {activity.type === 'out' && <LogOut size={20} strokeWidth={2} />}
                      {activity.type === 'check' && <Check size={20} strokeWidth={2} />}
                    </div>
                    <div className="team-detail__activity-body">
                      <span className="team-detail__activity-text">
                        {activity.title}
                      </span>
                      <span className="team-detail__activity-time">
                        {activity.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {editModalOpen && (
        <AddMemberModal
          key={member.id}
          member={member}
          crews={crews}
          onSave={handleSaveMember}
          onClose={() => setEditModalOpen(false)}
        />
      )}
    </AppShell>
  );
};

export default TeamDetail;
