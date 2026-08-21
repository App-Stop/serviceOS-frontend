import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const AXIS = [40, 30, 20, 10, 0];
const MAX = 40;

const FILTER_DATA = {
  'Last 7 days': [
    { day: 'Mon', value: 35 },
    { day: 'Tue', value: 16 },
    { day: 'Wed', value: 25 },
    { day: 'Thu', value: 27, tooltip: '27 Today' },
    { day: 'Fri', value: null },
    { day: 'Sat', value: null },
    { day: 'Sun', value: null },
  ],
  'Last 30 days': [
    { day: 'W1', value: 38 },
    { day: 'W2', value: 29 },
    { day: 'W3', value: 32 },
    { day: 'W4', value: 35, tooltip: '35 This Wk' },
    { day: 'W5', value: null },
    { day: 'W6', value: null },
    { day: 'W7', value: null },
  ],
  'This Month': [
    { day: '1-5', value: 20 },
    { day: '6-10', value: 34 },
    { day: '11-15', value: 28 },
    { day: '16-20', value: 31, tooltip: '31 Active' },
    { day: '21-25', value: null },
    { day: '26-30', value: null },
    { day: '31+', value: null },
  ],
  'This Year': [
    { day: 'Q1', value: 30 },
    { day: 'Q2', value: 38 },
    { day: 'Q3', value: 24 },
    { day: 'Q4', value: 36, tooltip: '36 YTD' },
    { day: 'Q5', value: null },
    { day: 'Q6', value: null },
    { day: 'Q7', value: null },
  ]
};

const OPTIONS = Object.keys(FILTER_DATA);

export const JobsChart = () => {
  const [selectedFilter, setSelectedFilter] = useState('Last 7 days');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const days = FILTER_DATA[selectedFilter] || FILTER_DATA['Last 7 days'];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="card jobs-chart">
      <div className="card__header">
        <span className="card__title">Jobs Completed</span>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            className="pill-button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            <span className="pill-button__text">{selectedFilter}</span>
            <ChevronDown
              size={16}
              strokeWidth={2}
              className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-neutral-200 rounded-2xl shadow-lg py-1.5 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
              {OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setSelectedFilter(option);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-left transition-colors ${
                    selectedFilter === option
                      ? 'text-neutral-900 bg-neutral-100/70 font-semibold'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                >
                  <span>{option}</span>
                  {selectedFilter === option && <Check size={14} className="text-neutral-900" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="jobs-chart__body">
        <div className="jobs-chart__axis">
          {AXIS.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>

        <div className="jobs-chart__plot">
          <div className="jobs-chart__bars">
            <div className="jobs-chart__lines" aria-hidden="true">
              {AXIS.map((tick) => (
                <span key={tick} className="jobs-chart__line" />
              ))}
            </div>
            {days.map(({ day, value, tooltip }) => (
              <div key={day} className="jobs-chart__column">
                {tooltip && <span className="jobs-chart__tooltip">{tooltip}</span>}
                {value === null ? (
                  <span className="jobs-chart__dot" />
                ) : (
                  <span
                    className="jobs-chart__bar"
                    style={{ "--jobs-chart-bar-height": `${(value / MAX) * 100}%` }}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="jobs-chart__dates">
            {days.map(({ day, value }) => (
              <span
                key={day}
                className={`jobs-chart__date${value === null ? ' jobs-chart__date--muted' : ''}`}
              >
                {day}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
