import React, { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { JobFormModal } from '../components/JobFormModal';
import { AssignJobModal } from '../components/AssignJobModal';
import { ScheduleToolbar } from '../components/schedule/ScheduleToolbar';
import { ScheduleLegend } from '../components/schedule/ScheduleLegend';
import { UnassignedJobsPanel } from '../components/schedule/UnassignedJobsPanel';
import { UnassignedRosterPanel } from '../components/schedule/UnassignedRosterPanel';
import { WeekView } from '../components/schedule/WeekView';
import { DayView } from '../components/schedule/DayView';
import { MonthView } from '../components/schedule/MonthView';
import { addJob, assignJob, updateJob } from '../data/jobs';
import { getErrorMessage } from '../api/client';
import {
  addDays,
  addMonths,
  formatDayTitle,
  formatLongDate,
  formatMonthTitle,
  formatWeekTitle,
  startOfDay,
  startOfWeek,
  useScheduleView,
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

  const [view, setView] = useState('week');
  const [anchor, setAnchor] = useState(today);
  const [panelOpen, setPanelOpen] = useState(false);

  /* Prefill for the job modal — null while it is closed. An entry carrying an
     `id` edits that job, anything else creates a new one. */
  const [draftJob, setDraftJob] = useState(null);
  const [savingJob, setSavingJob] = useState(false);
  const [jobError, setJobError] = useState('');
  const [assignMember, setAssignMember] = useState(null);

  /**
   * One read for whichever window the current view is showing — the API does
   * the day bucketing, so the board never holds more than the range it draws.
   */
  const { columns, cells, roster, unassignedRoster, unassignedJobs, loading, error, reload } =
    useScheduleView({ view, anchor });

  /* The day view dispatches people, so its panel lists whoever is free that
     day; the week and month views list the jobs nobody is on. */
  const showsRoster = view === 'day';
  const panelCount = showsRoster ? unassignedRoster.length : unassignedJobs.length;

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

  /* From the jobs panel: the job is known, so the form opens on it. */
  const openJobForAssign = (job) => {
    setPanelOpen(false);
    setDraftJob(job);
  };

  /* From the roster panel: the person is known, so the job picker opens. */
  const assignToColumn = (column) => {
    setPanelOpen(false);
    setAssignMember(column);
  };

  const handleSaveJob = async (job) => {
    setSavingJob(true);
    setJobError('');
    try {
      if (job.id) await updateJob(job.id, job);
      else await addJob(job);
      setDraftJob(null);
      await reload();
    } catch (err) {
      setJobError(getErrorMessage(err, 'Could not save this job.'));
    } finally {
      setSavingJob(false);
    }
  };

  /**
   * Hands the picked job to the roster member. This only changes who is on the
   * job — its schedule is copied from what it already has, so the window stays
   * the single source of the job's time.
   */
  const handleMemberJobAssigned = async ({ job }) => {
    const column = assignMember;
    setAssignMember(null);
    if (!job?.id || !column) return;

    setJobError('');
    try {
      await assignJob(job.id, {
        assigneeType: column.assigneeType,
        assigneeId: column.assigneeId,
        name: column.name,
      });
      await reload();
    } catch (err) {
      setJobError(getErrorMessage(err, 'Could not assign this job.'));
    }
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
            {showsRoster ? 'Unassigned Roster' : 'Unassigned Jobs'} ({panelCount})
          </button>
        </ScheduleToolbar>

        {/* A failed assign closes its dialog before reporting, so the reason —
            an unscheduled job, a double-booked technician — is shown here. */}
        {(error || jobError) && !draftJob && (
          <p className="schedule__error" role="alert">
            {error || jobError}
          </p>
        )}

        {loading && <p className="schedule-empty">Loading the schedule…</p>}

        {!loading && view === 'week' && (
          <WeekView
            columns={columns}
            today={today}
            onCreateJob={(date) => setDraftJob({ date: formatLongDate(date) })}
          />
        )}

        {!loading && view === 'day' && (
          <DayView roster={roster} onAssignJob={setAssignMember} />
        )}

        {!loading && view === 'month' && (
          <MonthView cells={cells} today={today} onSelectDay={openDay} />
        )}
      </div>

      {panelOpen &&
        (showsRoster ? (
          <UnassignedRosterPanel
            roster={unassignedRoster}
            onAssign={assignToColumn}
            onClose={() => setPanelOpen(false)}
          />
        ) : (
          <UnassignedJobsPanel
            jobs={unassignedJobs}
            onAssign={openJobForAssign}
            onClose={() => setPanelOpen(false)}
          />
        ))}

      {draftJob && (
        <JobFormModal
          job={draftJob}
          saving={savingJob}
          error={jobError}
          onSave={handleSaveJob}
          onClose={() => {
            setDraftJob(null);
            setJobError('');
          }}
        />
      )}

      {assignMember && (
        <AssignJobModal
          member={assignMember}
          date={anchor}
          onAssign={handleMemberJobAssigned}
          onClose={() => setAssignMember(null)}
        />
      )}
    </AppShell>
  );
};

export default Schedule;
