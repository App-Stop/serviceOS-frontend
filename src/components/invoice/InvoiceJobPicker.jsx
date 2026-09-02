import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, TriangleAlert, X } from 'lucide-react';
import { useCustomers } from '../../data/customers';
import { fetchCustomerJobs } from '../../data/jobs';
import { formatMoney } from '../../data/invoices';
import { getErrorMessage } from '../../api/client';
import './InvoiceJobPicker.css';

/**
 * Searchable customer picker component with real-time text filtering.
 */
const CustomerSearchSelect = ({ customerId, customers, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);
  const searchInputRef = useRef(null);

  const sortedCustomers = useMemo(
    () =>
      [...customers].sort((a, b) => {
        const nameA = a.businessName || a.name || '';
        const nameB = b.businessName || b.name || '';
        return nameA.localeCompare(nameB);
      }),
    [customers],
  );

  const selectedCustomer = useMemo(
    () => customers.find((c) => String(c.id) === String(customerId)),
    [customers, customerId],
  );

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sortedCustomers;
    return sortedCustomers.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const bName = (c.businessName || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      return name.includes(query) || bName.includes(query) || email.includes(query);
    });
  }, [sortedCustomers, search]);

  useEffect(() => {
    if (!open) {
      setSearch('');
      return undefined;
    }
    const timer = setTimeout(() => searchInputRef.current?.focus(), 50);

    const onPointerDown = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className={`customer-select relative w-full ${open ? 'z-50' : ''}`} ref={ref}>
      <button
        type="button"
        className="flex items-center justify-between w-full h-11 px-[14px] py-2.5 rounded-[30px] bg-neutral-50 border border-neutral-200 text-sm font-normal text-neutral-900 transition-colors hover:bg-neutral-100 cursor-pointer"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={`truncate ${
            selectedCustomer ? 'font-medium text-neutral-900' : 'text-black-200'
          }`}
        >
          {selectedCustomer
            ? selectedCustomer.businessName || selectedCustomer.name
            : 'Select a customer…'}
        </span>
        <ChevronDown className="shrink-0 ml-2 text-neutral-900" size={18} strokeWidth={2} />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 right-0 mt-2 p-2 rounded-[24px] bg-neutral-50 border border-neutral-200 shadow-xl z-50 flex flex-col gap-2"
          role="listbox"
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white border border-neutral-200">
            <Search size={16} className="text-black-200 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-black-200 outline-none"
              placeholder="Search customer name or business…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="text-black-200 hover:text-neutral-900 shrink-0 p-0.5"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1 overflow-y-auto max-h-56 pr-1">
            {filteredCustomers.length === 0 ? (
              <div className="px-3 py-3 text-center text-xs text-black-200">
                No matching customers found
              </div>
            ) : (
              filteredCustomers.map((customer) => {
                const isSelected = String(customer.id) === String(customerId);
                const displayName = customer.businessName || customer.name;
                return (
                  <button
                    key={customer.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-colors w-full cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-200/70 font-semibold text-neutral-900'
                        : 'text-neutral-900 hover:bg-neutral-100'
                    }`}
                    onClick={() => {
                      onChange(customer.id);
                      setOpen(false);
                    }}
                  >
                    <span className="truncate">{displayName}</span>
                    {isSelected && <Check size={18} className="shrink-0 text-neutral-900 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Picks the customer and the jobs an invoice is raised against.
 *
 * This step exists because the API builds the invoice from work already done:
 * `POST /invoices` requires a customer and at least one job id, and derives a
 * service line item per job from its labour cost plus a tool line item per
 * recorded equipment cost. Anything typed into the editor below is appended
 * to those, not a replacement for them.
 *
 * Neither choice can be changed afterwards — the update endpoint accepts
 * neither `customerId` nor `jobIds` — so this whole block disappears once the
 * invoice exists.
 *
 * Note: nothing records whether a job has already been billed, so jobs that
 * are already on another invoice still appear here and the API will accept
 * them again. Filter them out once the backend marks them.
 */
export const InvoiceJobPicker = ({ customerId, jobIds, onChange }) => {
  const customers = useCustomers();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    if (!customerId) {
      setJobs([]);
      return undefined;
    }

    setLoading(true);
    setError('');
    fetchCustomerJobs(customerId)
      .then((rows) => {
        if (!cancelled) setJobs(rows);
      })
      .catch((cause) => {
        if (!cancelled) setError(getErrorMessage(cause, 'Could not load this customer’s jobs.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  const toggleJob = (id) => {
    const key = String(id);
    const selected = jobIds.map(String);
    onChange({
      jobIds: selected.includes(key)
        ? selected.filter((value) => value !== key)
        : [...selected, key],
    });
  };

  return (
    <section className="job-picker">
      <header className="job-picker__header">
        <h2 className="job-picker__title">Bill for work</h2>
        <p className="job-picker__subtitle">
          Pick the customer and the jobs this invoice covers.
        </p>
      </header>

      <div className="job-picker__field">
        <span className="job-picker__label">Customer</span>
        <CustomerSearchSelect
          customerId={customerId}
          customers={customers}
          onChange={(val) => onChange({ customerId: val || null, jobIds: [] })}
        />
      </div>

      {customerId && (
        <div className="job-picker__jobs">
          <span className="job-picker__label">
            Jobs {jobIds.length > 0 && `(${jobIds.length} selected)`}
          </span>

          {loading && <p className="job-picker__hint">Loading jobs…</p>}
          {error && <p className="job-picker__error">{error}</p>}

          {!loading && !error && jobs.length === 0 && (
            <p className="job-picker__hint">
              This customer has no jobs yet. An invoice has to be raised against at
              least one job.
            </p>
          )}

          {jobs.map((job) => {
            const selected = jobIds.map(String).includes(String(job.id));
            return (
              <button
                key={job.id}
                type="button"
                className={`job-picker__job${selected ? ' job-picker__job--selected' : ''}`}
                onClick={() => toggleJob(job.id)}
                aria-pressed={selected}
              >
                <span className="job-picker__check">
                  {selected && <Check size={14} strokeWidth={3} />}
                </span>
                <span className="job-picker__job-body">
                  <span className="job-picker__job-title">{job.title}</span>
                  <span className="job-picker__job-meta">
                    {[job.date, job.type].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <span className="job-picker__job-cost">{formatMoney(job.budgetSpent)}</span>
              </button>
            );
          })}

          {jobs.length > 0 && (
            <p className="job-picker__note">
              <TriangleAlert size={14} strokeWidth={2} />
              Jobs already billed on another invoice aren’t marked yet, so check
              before selecting.
            </p>
          )}
        </div>
      )}
    </section>
  );
};
