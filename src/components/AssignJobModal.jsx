import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { FilterDropdown } from './FilterDropdown';
import { useJobs, initials, setJobStatus } from '../data';
import glow from '../assets/button-glow.svg';
import './FormModal.css';

export const AssignJobModal = ({ member, onAssign, onClose }) => {
  const jobs = useJobs();

  const [selectedJobId, setSelectedJobId] = useState(
    jobs[0]?.id ? String(jobs[0].id) : '',
  );

  const jobOptions = useMemo(
    () =>
      jobs.map((job) => ({
        id: String(job.id),
        label: job.title,
      })),
    [jobs],
  );

  const selectedJob = jobs.find((j) => String(j.id) === selectedJobId) || jobs[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedJob) return;

    // Assign job to member and dispatch event/callback
    if (selectedJob.id) {
      setJobStatus(selectedJob.id, selectedJob.status || 'scheduled');
    }

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
            <FilterDropdown
              label="Select a job"
              value={selectedJobId}
              options={jobOptions}
              onChange={(id) => setSelectedJobId(id)}
              fullWidth
            />
          </div>

          <div className="flex items-center justify-end gap-3 w-full pt-2">
            <button type="button" className="ghost-button" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="cta-button"
              disabled={!selectedJobId}
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
