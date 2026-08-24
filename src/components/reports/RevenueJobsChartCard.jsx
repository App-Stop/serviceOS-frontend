import React, { useMemo, useState } from 'react';
import { FilterDropdown } from '../FilterDropdown';

const TIME_OPTIONS = [
  { id: '14days', label: 'Last 14 days' },
  { id: '30days', label: 'Last 30 days' },
  { id: '90days', label: 'Last 90 days' },
];

/* How many trailing days of the series each option shows. */
const RANGE_DAYS = {
  '14days': 14,
  '30days': 30,
  '90days': 90,
};

/* Longer ranges have far more columns than the axis can label, so labels are
   thinned to roughly this many, always keeping the most recent day. */
const MAX_AXIS_LABELS = 14;

/* Plot geometry, in px — mirrors the Figma frame so the bars, the revenue
   line and the gridlines all land on the same baseline. */
const PLOT_HEIGHT = 162;
const MAX_BAR_HEIGHT = 142;
const LINE_TOP_INSET = 20;
const GRIDLINES = 5;

/**
 * Builds a smooth (monotone-ish cubic) path through evenly spaced points so
 * the revenue line curves the way it does in the design rather than kinking.
 */
const buildLinePath = (points) => {
  if (points.length < 2) return '';
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) / 2;
    path += ` C ${midX} ${current.y}, ${midX} ${next.y}, ${next.x} ${next.y}`;
  }
  return path;
};

export const RevenueJobsChartCard = ({
  chartData = [],
  timeFilter,
  onTimeFilterChange,
}) => {
  const [hovered, setHovered] = useState(null);

  const rangeDays = RANGE_DAYS[timeFilter] ?? RANGE_DAYS['14days'];
  const visibleData = useMemo(
    () => chartData.slice(-rangeDays),
    [chartData, rangeDays],
  );

  /* Clear the tooltip when the range changes — the hovered index no longer
     points at the same day. */
  const handleRangeChange = (range) => {
    setHovered(null);
    onTimeFilterChange(range);
  };

  const labelStep = Math.ceil(visibleData.length / MAX_AXIS_LABELS);

  const maxJobs = Math.max(...visibleData.map((point) => point.jobs), 1);
  const maxRevenue = Math.max(...visibleData.map((point) => point.revenue), 1);

  /* x is a percentage of the plot width so the line stays glued to the bar
     columns at any container size; y stays in px against PLOT_HEIGHT. */
  const columnWidth = visibleData.length ? 100 / visibleData.length : 0;
  const linePoints = visibleData.map((point, index) => ({
    x: columnWidth * (index + 0.5),
    y:
      PLOT_HEIGHT -
      (point.revenue / maxRevenue) * (PLOT_HEIGHT - LINE_TOP_INSET) -
      LINE_TOP_INSET / 2,
  }));

  const activePoint = hovered === null ? null : visibleData[hovered];

  return (
    <div className="reports__card">
      <div className="reports__card-header">
        <h2 className="reports__card-title">Revenue &amp; Jobs</h2>

        <div className="reports__chart-tools">
          <div className="reports__legend">
            <span className="reports__legend-item">
              <span className="reports__legend-dot" />
              Job Completed
            </span>
            <span className="reports__legend-item">
              <span className="reports__legend-line" />
              Revenue
            </span>
          </div>

          <FilterDropdown
            label="Last 14 days"
            value={timeFilter}
            options={TIME_OPTIONS}
            onChange={handleRangeChange}
          />
        </div>
      </div>

      <div className="reports__chart">
        <div className="reports__chart-plot" style={{ height: PLOT_HEIGHT }}>
          {Array.from({ length: GRIDLINES }).map((_, index) => (
            <span
              key={index}
              className="reports__chart-gridline"
              style={{ top: `${(index / (GRIDLINES - 1)) * 100}%` }}
            />
          ))}

          <div className="reports__chart-bars">
            {visibleData.map((point, index) => (
              <button
                type="button"
                key={point.date}
                className={`reports__chart-column${
                  hovered === index ? ' reports__chart-column--active' : ''
                }`}
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(index)}
                onBlur={() => setHovered(null)}
                aria-label={`${point.date}: ${point.jobs} jobs, $${point.revenue}`}
              >
                <span
                  className={`reports__chart-bar${
                    point.upcoming ? ' reports__chart-bar--upcoming' : ''
                  }`}
                  style={{
                    height: point.upcoming
                      ? 14
                      : Math.max((point.jobs / maxJobs) * MAX_BAR_HEIGHT, 14),
                  }}
                />
              </button>
            ))}
          </div>

          <svg
            className="reports__chart-line"
            viewBox={`0 0 100 ${PLOT_HEIGHT}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d={buildLinePath(linePoints)}
              fill="none"
              stroke="var(--color-green)"
              strokeWidth="2"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {linePoints.map((linePoint, index) => (
            <span
              key={visibleData[index].date}
              className={`reports__chart-node${
                visibleData[index].upcoming ? ' reports__chart-node--upcoming' : ''
              }`}
              style={{ left: `${linePoint.x}%`, top: linePoint.y }}
            />
          ))}

          {activePoint && !activePoint.upcoming && (
            <div
              className="reports__chart-tooltip"
              style={{
                left: `${linePoints[hovered].x}%`,
                top: linePoints[hovered].y - 16,
              }}
            >
              <span className="reports__chart-tooltip-value">
                +${activePoint.revenue.toLocaleString()}
              </span>
              <span className="reports__chart-tooltip-label">
                {activePoint.jobs} Jobs
              </span>
            </div>
          )}
        </div>

        <div className="reports__chart-axis">
          {visibleData.map((point, index) => (
            <span
              key={point.date}
              className={`reports__chart-axis-label${
                point.upcoming ? ' reports__chart-axis-label--upcoming' : ''
              }`}
            >
              {(visibleData.length - 1 - index) % labelStep === 0 ? point.date : ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
