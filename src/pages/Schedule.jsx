import React, { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { JobFormModal } from '../components/JobFormModal';
import { AssignJobModal } from '../components/AssignJobModal';
import { ScheduleToolbar } from '../components/schedule/ScheduleToolbar';
import { ScheduleLegend } from '../components/schedule/ScheduleLegend';
import { UnassignedJobsPanel } from '../components/schedule/UnassignedJobsPanel';
import { WeekView } from '../components/schedule/WeekView';
import { DayView } from '../components/schedule/DayView';
import { MonthView } from '../components/schedule/MonthView';
import { addJob, updateJob } from '../data/jobs';
import {
  addDays,
  addMonths,
  formatDayTitle,
  formatLongDate,
  formatMonthTitle,
  formatWeekTitle,
  startOfDay,
  startOfWeek,
  useUnassignedJobs,
} from '../data/schedule';
import './Schedule.css';

/** How far each arrow moves, per view. */
const STEP = {
  day: (anchor, direction) => addDays(anchor, direction),
  week: (anchor, direction) => addDays(anchor, direction * 7),
  month: (anchor, direction) => addMonths(anchor, direction),
};

const Schedule = () => {
  const today = startOfDay(new Date());
  const unassignedJobs = useUnassignedJobs();

  const [view, setView] = useState('week');
  const [anchor, setAnchor] = useState(today);
  const [panelOpen, setPanelOpen] = useState(false);

  /* Prefill for the job modal — null while it is closed. An entry carrying an
     `id` edits that job, anything else creates a new one. */
  const [draftJob, setDraftJob] = useState(null);
  const [assignMember, setAssignMember] = useState(null);

  const weekStart = startOfWeek(anchor);

  const title = {
    day: formatDayTitle(anchor, today),
    week: formatWeekTitle(weekStart),
    month: formatMonthTitle(anchor),
  }[view];

  const step = (direction) => setAnchor((current) => STEP[view](current, direction));

  const openDay = (date) => {
    setAnchor(date);
    setView('day');
  };

  const assignJob = (job) => {
    setPanelOpen(false);
    setDraftJob(job);
  };

  const handleSaveJob = (job) => {
    if (job.id) updateJob(job.id, job);
    else addJob(job);
    setDraftJob(null);
  };

  const handleMemberJobAssigned = ({ job }) => {
    if (job?.id && assignMember) {
      /* Jobs name their assignee in `technician`, crew or solo alike. */
      updateJob(job.id, {
        technician: assignMember.name,
        date: formatLongDate(anchor),
      });
    }
    setAssignMember(null);
  };

  return (
    <AppShell>
      <div className="app-shell__content schedule__content">
        <div className="schedule__header">
          <div className="page-title">
            <h1 className="page-title__heading">Schedule</h1>
            <p className="page-title__subheading">Manage and dispatch jobs</p>
          </div>

          <ScheduleLegend />
        </div>

        <ScheduleToolbar
          view={view}
          onViewChange={setView}
          title={title}
          onPrevious={() => step(-1)}
          onNext={() => step(1)}
          onToday={() => setAnchor(today)}
        >
          <button
            type="button"
            className="schedule-toolbar__unassigned"
            onClick={() => setPanelOpen(true)}
          >
            {view === 'day' ? 'Unassigned Roster' : 'Unassigned Jobs'} (
            {unassignedJobs.length})
          </button>
        </ScheduleToolbar>

        {view === 'week' && (
          <WeekView
            weekStart={weekStart}
            today={today}
            onCreateJob={(date) => setDraftJob({ date: formatLongDate(date) })}
          />
        )}

        {view === 'day' && (
          <DayView
            date={anchor}
            onAssignJob={(column) =>
              setAssignMember({
                id: column.id,
                name: column.name,
                role: column.role || (column.kind === 'crew' ? 'Crew' : 'Technician'),
                crew: column.crew || column.name,
              })
            }
          />
        )}

        {view === 'month' && (
          <MonthView anchor={anchor} today={today} onSelectDay={openDay} />
        )}
      </div>

      {panelOpen && (
        <UnassignedJobsPanel
          jobs={unassignedJobs}
          onAssign={assignJob}
          onClose={() => setPanelOpen(false)}
        />
      )}

      {draftJob && (
        <JobFormModal
          job={draftJob}
          onSave={handleSaveJob}
          onClose={() => setDraftJob(null)}
        />
      )}

      {assignMember && (
        <AssignJobModal
          member={assignMember}
          onAssign={handleMemberJobAssigned}
          onClose={() => setAssignMember(null)}
        />
      )}
    </AppShell>
  );
};

export default Schedule;
