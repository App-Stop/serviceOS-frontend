import React from 'react';
import { Plus, X } from 'lucide-react';
import { FilterDropdown } from '../FilterDropdown';
import {
  useServices,
  updateServicesList,
  addServiceItem,
  removeServiceItem,
  EST_TIME_OPTIONS,
} from '../../data';
import glow from '../../assets/button-glow.svg';

export const ServicesPanel = () => {
  const services = useServices();

  const handleNameChange = (id, newName) => {
    const updated = services.map((s) =>
      s.id === id ? { ...s, name: newName } : s,
    );
    updateServicesList(updated);
  };

  const handleEstTimeChange = (id, newTime) => {
    const updated = services.map((s) =>
      s.id === id ? { ...s, estTime: newTime } : s,
    );
    updateServicesList(updated);
  };

  const handleAdd = () => {
    addServiceItem({ name: '', estTime: '1h' });
  };

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

        <div className="flex flex-col gap-5 items-center justify-center w-full">
          {services.map((service, index) => (
            <div key={service.id} className="flex gap-2.5 items-end w-full">
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                {index === 0 && (
                  <label className="text-sm font-medium text-neutral-900 whitespace-nowrap">
                    Service Name*
                  </label>
                )}
                <input
                  type="text"
                  className="w-full h-11 px-[14px] py-2.5 rounded-[30px] bg-white border border-neutral-200 text-sm font-normal text-neutral-900 outline-none focus:border-neutral-900 transition-colors"
                  placeholder="Service Name"
                  value={service.name}
                  onChange={(e) => handleNameChange(service.id, e.target.value)}
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
                  onChange={(timeId) => handleEstTimeChange(service.id, timeId)}
                  fullWidth
                />
              </div>

              <button
                type="button"
                className="flex items-center justify-center size-11 rounded-full border border-neutral-200 text-black-200 hover:text-neutral-900 hover:bg-neutral-100 transition-colors shrink-0"
                onClick={() => removeServiceItem(service.id)}
                title="Remove Service"
                aria-label="Remove Service"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
          ))}

          <div className="flex justify-center w-full pt-2">
            <button type="button" className="cta-button" onClick={handleAdd}>
              <img className="cta-button__glow" src={glow} alt="" aria-hidden="true" />
              <Plus size={20} strokeWidth={2} />
              <span className="cta-button__label">Add Service</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
