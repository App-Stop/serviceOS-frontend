import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { FilterDropdown } from './FilterDropdown';
import { useJobs, initials, fetchUnassignedDailyJobs } from '../data';
import { getErrorMessage } from '../api/client';
import glow from '../assets/button-glow.svg';
import './FormModal.css';

export const AssignJobModal = ({ member, date, onAssign, onClose }) => {
  const allJobs = useJobs();
  const [unassignedJobs, setUnassignedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    fetchUnassignedDailyJobs(date)
      .then((rows) => {
        if (cancelled) return;
        setUnassignedJobs(rows);
        if (rows.length > 0) {
          setSelectedJobId(String(rows[0].id || rows[0].jobId));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Could not load unassigned jobs.'));
          const fallback = allJobs.filter((j) => !j.technician);
          setUnassignedJobs(fallback);
          if (fallback.length > 0) {
            setSelectedJobId(String(fallback[0].id));
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [date, allJobs]);

  const jobOptions = useMemo(
    () =>
      unassignedJobs.map((job) => ({
        id: String(job.id || job.jobId),
        label:
          job.customerName || job.customer
            ? `${job.title} — ${job.customerName || job.customer}`
            : job.title,
      })),
    [unassignedJobs],
  );

  const selectedJob = unassignedJobs.find(
    (j) => String(j.id || j.jobId) === selectedJobId,
  ) || unassignedJobs[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedJob) return;

    onAssign?.({
      memberId: member.id,
      job: selectedJob,
    });
    onClose();
  };

  return (
    <div
      className="form-modal__overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="form-modal max-w-[440px] rounded-[30px] p-4 flex flex-col gap-5 bg-white shadow-modal-low"
        role="dialog"
        aria-modal="true"
        aria-label="Assign Job"
      >
        <div className="flex items-center justify-between w-full h-8">
          <h2 className="text-base font-semibold text-neutral-900">Assign Job</h2>
          <button
            type="button"
            className="flex items-center justify-center size-8 rounded-full text-black-200 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-col gap-2.5 items-start w-full">
          <div className="flex items-center justify-center size-[60px] rounded-full bg-neutral-200 text-2xl font-semibold text-black-200">
            {initials(member?.name || 'JJ')}
          </div>
          <div className="flex flex-col gap-0.5 items-start">
            <h3 className="text-xl font-semibold text-neutral-900">
              {member?.name || 'JJ Thompson'}
            </h3>
            <p className="text-sm font-normal text-black-200">
              {member?.role || 'Technician'} • {member?.crew || 'Solo'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-medium text-neutral-900">
              Select Job to assign*
            </label>

            {loading ? (
              <p className="text-xs text-black-200">Loading unassigned jobs…</p>
            ) : error ? (
              <p className="text-xs text-red-600">{error}</p>
            ) : unassignedJobs.length === 0 ? (
              <p className="text-xs text-black-200">
                No unassigned jobs found for this date.
              </p>
            ) : (
              <FilterDropdown
                label="Select a job"
                value={selectedJobId}
                options={jobOptions}
                onChange={(id) => setSelectedJobId(id)}
                fullWidth
              />
            )}
          </div>

          <div className="flex items-center justify-end gap-3 w-full pt-2">
            <button type="button" className="ghost-button" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="cta-button"
              disabled={loading || !selectedJobId || unassignedJobs.length === 0}
            >
              <img className="cta-button__glow" src={glow} alt="" aria-hidden="true" />
              <span className="cta-button__label">Assign Job</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
