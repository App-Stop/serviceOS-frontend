import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FilterDropdown } from './FilterDropdown';
import './Pagination.css';

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100].map((size) => ({
  id: size,
  label: `${size} / page`,
}));

/**
 * Builds a compact page list with ellipses: always the first and last page,
 * plus a window around the current one — `1 … 4 5 6 … 20`.
 */
const pageItems = (page, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const window = [page - 1, page, page + 1].filter(
    (n) => n > 1 && n < totalPages,
  );

  return [
    1,
    ...(window[0] > 2 ? ['start-gap'] : []),
    ...window,
    ...(window[window.length - 1] < totalPages - 1 ? ['end-gap'] : []),
    totalPages,
  ];
};

/**
 * Table pager: a range summary, per-page size picker, and page controls.
 *
 * `totalCount` and `totalPages` come from the API's pagination block in live
 * mode and from the same shape computed locally in demo mode, so the control
 * behaves identically either way.
 */
export const Pagination = ({
  page,
  limit,
  totalCount,
  totalPages,
  onPageChange,
  onLimitChange,
  disabled = false,
}) => {
  const pages = Math.max(totalPages, 1);
  const first = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const last = Math.min(page * limit, totalCount);

  const go = (next) => {
    if (disabled) return;
    const clamped = Math.min(Math.max(next, 1), pages);
    if (clamped !== page) onPageChange(clamped);
  };

  return (
    <div className="pagination">
      <span className="pagination__summary">
        {totalCount === 0
          ? 'No records'
          : `Showing ${first}–${last} of ${totalCount}`}
      </span>

      <div className="pagination__controls">
        <FilterDropdown
          label={`${limit} / page`}
          value={limit}
          options={PAGE_SIZE_OPTIONS}
          onChange={onLimitChange}
          align="right"
        />

        <div className="pagination__pages">
          <button
            type="button"
            className="pagination__nav"
            onClick={() => go(page - 1)}
            disabled={disabled || page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={18} strokeWidth={2} />
          </button>

          {pageItems(page, pages).map((item) =>
            typeof item === 'number' ? (
              <button
                key={item}
                type="button"
                className={`pagination__page${
                  item === page ? ' pagination__page--active' : ''
                }`}
                onClick={() => go(item)}
                disabled={disabled}
                aria-current={item === page ? 'page' : undefined}
              >
                {item}
              </button>
            ) : (
              <span key={item} className="pagination__gap" aria-hidden="true">
                …
              </span>
            ),
          )}

          <button
            type="button"
            className="pagination__nav"
            onClick={() => go(page + 1)}
            disabled={disabled || page >= pages}
            aria-label="Next page"
          >
            <ChevronRight size={18} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
