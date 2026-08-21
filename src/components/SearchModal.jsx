import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  X,
  FileSearchCorner,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  ReceiptText,
  BriefcaseBusiness,
} from 'lucide-react';
import { useCustomers, initials } from '../data/customers';
import './SearchModal.css';

const staticIndex = [
  { id: 'i-1', group: 'Invoices', kind: 'invoice', title: 'INV-001', meta: 'Mason Ray', to: '/invoices' },
  { id: 'i-2', group: 'Invoices', kind: 'invoice', title: 'INV-002', meta: 'Mason Ray', to: '/invoices' },
  { id: 'j-1', group: 'Jobs', kind: 'job', title: 'Maple Wood Park Fix', meta: 'Mason Ray', to: '/jobs' },
  { id: 'j-2', group: 'Jobs', kind: 'job', title: 'Kitchen Pipe Fix', meta: 'Mason Ray', to: '/jobs' },
];

const groupOrder = ['Customers', 'Invoices', 'Jobs'];

const ResultIcon = ({ item }) => {
  if (item.kind === 'invoice') {
    return (
      <span className="search-modal__result-icon search-modal__result-icon--invoice">
        <ReceiptText size={20} strokeWidth={2} />
      </span>
    );
  }
  if (item.kind === 'job') {
    return (
      <span className="search-modal__result-icon search-modal__result-icon--job">
        <BriefcaseBusiness size={20} strokeWidth={2} />
      </span>
    );
  }
  return (
    <span className="search-modal__result-icon search-modal__result-icon--initials">
      {initials(item.title)}
    </span>
  );
};

export const SearchModal = ({ onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  const customers = useCustomers();

  const searchIndex = useMemo(
    () => [
      ...customers.map((customer) => ({
        id: `c-${customer.id}`,
        group: 'Customers',
        kind: 'person',
        title: customer.name,
        meta: customer.email,
        to: `/customers/${customer.id}`,
      })),
      ...staticIndex,
    ],
    [customers],
  );

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return searchIndex.filter(
      (item) =>
        item.title.toLowerCase().includes(term) || item.meta.toLowerCase().includes(term),
    );
  }, [query, searchIndex]);

  const groups = useMemo(
    () =>
      groupOrder
        .map((group) => ({ group, items: results.filter((item) => item.group === group) }))
        .filter(({ items }) => items.length > 0),
    [results],
  );

  useEffect(() => {
    inputRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const flatResults = groups.flatMap(({ items }) => items);

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (flatResults.length ? (index + 1) % flatResults.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) =>
        flatResults.length ? (index - 1 + flatResults.length) % flatResults.length : 0,
      );
    } else if (event.key === 'Enter' && flatResults[activeIndex]) {
      event.preventDefault();
      onSelect?.(flatResults[activeIndex]);
      onClose();
    }
  };

  return (
    <div
      className="search-modal__overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="search-modal" role="dialog" aria-modal="true" aria-label="Search">
        <div className="search-modal__query">
          <div className="search-modal__field">
            <Search className="search-modal__field-icon" size={24} strokeWidth={2} />
            <input
              ref={inputRef}
              type="text"
              className="search-modal__input"
              placeholder="Search customers, jobs, invoices, team, anything..."
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button
            type="button"
            className="search-modal__close"
            onClick={onClose}
            aria-label="Close search"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {groups.length > 0 ? (
          <div className="search-modal__results">
            {groups.map(({ group, items }) => (
              <div key={group} className="search-modal__group">
                <span className="search-modal__group-label">
                  {group === 'Customers' ? group : `${group} (${items.length})`}
                </span>
                {items.map((item) => {
                  const isActive = flatResults[activeIndex]?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`search-modal__result${
                        isActive ? ' search-modal__result--active' : ''
                      }`}
                      onMouseEnter={() => setActiveIndex(flatResults.indexOf(item))}
                      onClick={() => {
                        onSelect?.(item);
                        onClose();
                      }}
                    >
                      <ResultIcon item={item} />
                      <span className="search-modal__result-body">
                        <span className="search-modal__result-title">{item.title}</span>
                        <span className="search-modal__result-meta">{item.meta}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="search-modal__empty">
            <FileSearchCorner className="search-modal__empty-icon" size={60} strokeWidth={2} />
            <span className="search-modal__empty-title">
              {query.trim() ? 'No results found' : 'Search anything'}
            </span>
            <span className="search-modal__empty-text">
              Invoices,  customers, jobs, team, &amp; reports
            </span>
          </div>
        )}

        <div className="search-modal__hints">
          <div className="search-modal__hint">
            <span className="search-modal__keys">
              <span className="search-modal__key">
                <ArrowUp size={12} strokeWidth={2} />
              </span>
              <span className="search-modal__key">
                <ArrowDown size={12} strokeWidth={2} />
              </span>
            </span>
            <span className="search-modal__hint-label">navigate</span>
          </div>
          <div className="search-modal__hint">
            <span className="search-modal__key">
              <CornerDownLeft size={12} strokeWidth={2} />
            </span>
            <span className="search-modal__hint-label">open</span>
          </div>
          <div className="search-modal__hint">
            <span className="search-modal__key">esc</span>
            <span className="search-modal__hint-label">close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
