import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const ReportMetricCard = ({
  icon: Icon,
  value,
  label,
  trend,
  trendPositive = true,
}) => {
  return (
    <div className="reports__metric-card">
      <div className="reports__metric-icon">
        <Icon size={24} strokeWidth={2} />
      </div>
      <div className="reports__metric-body">
        <div className="reports__metric-value-row">
          <span className="reports__metric-value">{value}</span>
          {trend && (
            <span
              className={`chip ${
                trendPositive ? 'chip--success' : 'chip--danger'
              } flex items-center gap-0.5 text-xs px-2 py-0.5`}
            >
              {trendPositive ? (
                <ArrowUpRight size={14} strokeWidth={2.5} />
              ) : (
                <ArrowDownRight size={14} strokeWidth={2.5} />
              )}
              {trend}
            </span>
          )}
        </div>
        <span className="reports__metric-label">{label}</span>
      </div>
    </div>
  );
};
