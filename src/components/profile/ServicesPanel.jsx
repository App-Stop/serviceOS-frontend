import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { FilterDropdown } from '../FilterDropdown';
import { ConfirmDialog } from './ConfirmDialog';
import {
  useServices,
  useServicesLoaded,
  addServiceItem,
  updateServiceItem,
  removeServiceItem,
  EST_TIME_OPTIONS,
} from '../../data';
import { getErrorMessage } from '../../api/client';
import glow from '../../assets/button-glow.svg';

const DEFAULT_EST_TIME = '1h';

/**
 * Job types & services.
 *
 * Rows are edited locally and saved one at a time: a name commits on blur, a
 * duration commits as soon as it's picked. A row added here has no id until it
 * has been given a name, since a service can't be created without one — so an
 * empty new row is simply dropped rather than saved.
 */
export const ServicesPanel = () => {
  const services = useServices();
  const loaded = useServicesLoaded();

  const [rows, setRows] = useState(services);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [serviceToDelete, setServiceToDelete] = useState(null);

  // The store is the source of truth; drafts only live between edits.
  useEffect(() => {
    setRows((prev) => {
      const drafts = prev.filter((row) => !row.id);
      return [...services, ...drafts];
    });
  }, [services]);

  const patchRow = (key, patch) =>
    setRows((prev) =>
      prev.map((row) => ((row.id ?? row.key) === key ? { ...row, ...patch } : row)),
    );

  const dropRow = (key) =>
    setRows((prev) => prev.filter((row) => (row.id ?? row.key) !== key));

  const run = async (key, action) => {
    setBusyId(key);
    setError('');
    try {
      await action();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save your services.'));
    } finally {
      setBusyId(null);
    }
  };

  /** Commits a row once it has a name — creating it the first time. */
  const commitRow = (row) => {
    const key = row.id ?? row.key;
    const name = row.name.trim();
    const stored = services.find((s) => s.id === row.id);

    if (!row.id) {
      if (!name) return;
      return run(key, async () => {
        await addServiceItem({ name, estTime: row.estTime || DEFAULT_EST_TIME });
        dropRow(key);
      });
    }

    if (!name) {
      // A cleared name can't be saved; put the stored one back.
      patchRow(key, { name: stored?.name ?? '' });
      return;
    }

    if (stored && stored.name === name && stored.estTime === row.estTime) return;

    return run(key, () =>
      updateServiceItem(row.id, { name, estTime: row.estTime }),
    );
  };

  const handleEstTimeChange = (row, estTime) => {
    const key = row.id ?? row.key;
    patchRow(key, { estTime });
    // A saved row persists the new duration straight away; an unsaved one
    // waits until it has a name.
    if (row.id) {
      run(key, () => updateServiceItem(row.id, { name: row.name, estTime }));
    }
  };

  const handleRemove = (row) => {
    const key = row.id ?? row.key;
    if (!row.id) {
      dropRow(key);
      return;
    }
    setServiceToDelete(row);
  };

  const confirmDeleteService = () => {
    if (!serviceToDelete) return;
    const row = serviceToDelete;
    const key = row.id ?? row.key;
    setServiceToDelete(null);
    run(key, () => removeServiceItem(row.id));
  };

  const handleAdd = () =>
    setRows((prev) => [
      ...prev,
      { id: null, key: `new-${Date.now()}`, name: '', estTime: DEFAULT_EST_TIME },
    ]);

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex flex-col gap-1 items-start w-full">
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
          Job Types & Services
        </h1>
        <p className="text-sm font-normal text-black-200">
          Manage service categories, color identifiers, and standard dispatch durations
        </p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-[30px] p-6 flex flex-col gap-[30px] items-end justify-center w-full">
        <div className="flex flex-col gap-1 items-start w-full">
          <h2 className="text-base font-medium text-neutral-900">
            Services ({services.length})
          </h2>
          <p className="text-xs font-normal text-black-200">
            Job types appear in dispatch dropdowns and calendar scheduling
          </p>
        </div>

        {error && (
          <p
            className="w-full rounded-[12px] border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="flex flex-col gap-5 items-center justify-center w-full">
          {!loaded && (
            <p className="w-full py-2 text-center text-sm text-black-200">
              Loading your services…
            </p>
          )}

          {loaded && rows.length === 0 && (
            <p className="w-full py-2 text-center text-sm text-black-200">
              No services yet. Add the types of work your team handles.
            </p>
          )}

          {rows.map((service, index) => {
            const key = service.id ?? service.key;
            const busy = busyId === key;

            return (
              <div key={key} className="flex gap-2.5 items-end w-full">
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  {index === 0 && (
                    <label className="text-sm font-medium text-neutral-900 whitespace-nowrap">
                      Service Name*
                    </label>
                  )}
                  <input
                    type="text"
                    className="w-full h-11 px-[14px] py-2.5 rounded-[30px] bg-white border border-neutral-200 text-sm font-normal text-neutral-900 outline-none focus:border-neutral-900 transition-colors disabled:opacity-60"
                    placeholder="Service Name"
                    value={service.name}
                    disabled={busy}
                    onChange={(e) => patchRow(key, { name: e.target.value })}
                    onBlur={() => commitRow(service)}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  />
                </div>

                <div className="flex flex-col gap-1.5 w-[160px] shrink-0">
                  {index === 0 && (
                    <label className="text-sm font-medium text-neutral-900 whitespace-nowrap">
                      Est. Time*
                    </label>
                  )}
                  <FilterDropdown
                    label="Est. Time"
                    value={service.estTime}
                    options={EST_TIME_OPTIONS}
                    onChange={(timeId) => handleEstTimeChange(service, timeId)}
                    fullWidth
                  />
                </div>

                <button
                  type="button"
                  className="flex items-center justify-center size-11 rounded-full border border-neutral-200 text-black-200 hover:text-neutral-900 hover:bg-neutral-100 transition-colors shrink-0 disabled:opacity-60"
                  onClick={() => handleRemove(service)}
                  disabled={busy}
                  title="Remove Service"
                  aria-label="Remove Service"
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>
            );
          })}

          <div className="flex justify-center w-full pt-2">
            <button type="button" className="cta-button" onClick={handleAdd}>
              <img className="cta-button__glow" src={glow} alt="" aria-hidden="true" />
              <Plus size={20} strokeWidth={2} />
              <span className="cta-button__label">Add Service</span>
            </button>
          </div>
        </div>
      </div>

      {serviceToDelete && (
        <ConfirmDialog
          title="Remove Service"
          description={`Are you sure you want to remove "${serviceToDelete.name || 'this service'}"? This action cannot be undone.`}
          confirmLabel="Remove"
          cancelLabel="Cancel"
          onConfirm={confirmDeleteService}
          onCancel={() => setServiceToDelete(null)}
        />
      )}
    </div>
  );
};
