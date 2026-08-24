import React, { useState } from 'react';
import { DollarSign, Clock, Percent, HandCoins, Download } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { ReportMetricCard } from '../components/reports/ReportMetricCard';
import { RevenueJobsChartCard } from '../components/reports/RevenueJobsChartCard';
import { TopEarningJobsCard } from '../components/reports/TopEarningJobsCard';
import { TopEarningCustomersCard } from '../components/reports/TopEarningCustomersCard';
import { InvoicePipelineCard } from '../components/reports/InvoicePipelineCard';
import { useReportsData } from '../data';
import './Reports.css';

const TIME_RANGES = [
  { id: '7days', label: '7 days' },
  { id: '30days', label: '30 days' },
  { id: '90days', label: '90 days' },
];

const Reports = () => {
  const reports = useReportsData();
  const [selectedRange, setSelectedRange] = useState('30days');
  const [chartTimeFilter, setChartTimeFilter] = useState('14days');

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,Metric,Value\n' +
      `Revenue Collected,${reports.metrics.revenueCollected}\n` +
      `Outstanding,${reports.metrics.outstanding}\n` +
      `Profit Margin,${reports.metrics.profitMargin}\n` +
      `Avg Revenue Per Job,${reports.metrics.avgRevenuePerJob}\n`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `serviceos_report_${selectedRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell>
      <div className="app-shell__content reports__content">
        <div className="reports__header">
          <div className="page-title">
            <h1 className="page-title__heading">Reports</h1>
            <p className="page-title__subheading">Business performance overview</p>
          </div>

          <div className="reports__actions">
            <div className="reports__range">
              {TIME_RANGES.map((range) => (
                <button
                  key={range.id}
                  type="button"
                  className={`reports__range-option${
                    selectedRange === range.id ? ' reports__range-option--selected' : ''
                  }`}
                  onClick={() => setSelectedRange(range.id)}
                >
                  {range.label}
                </button>
              ))}
            </div>

            <button type="button" className="ghost-button" onClick={handleExportCSV}>
              <Download size={18} strokeWidth={2} />
              <span>Export to CSV</span>
            </button>
          </div>
        </div>

        <div className="reports__metrics">
          <ReportMetricCard
            icon={DollarSign}
            value={reports.metrics.revenueCollected}
            label="Revenue collected"
            trend={reports.metrics.revenueTrend}
            trendPositive
          />

          <ReportMetricCard
            icon={Clock}
            value={reports.metrics.outstanding}
            label={`Outstanding (${reports.metrics.unpaidCount} unpaid invoices)`}
          />

          <ReportMetricCard
            icon={Percent}
            value={reports.metrics.profitMargin}
            label="Profit margin"
          />

          <ReportMetricCard
            icon={HandCoins}
            value={reports.metrics.avgRevenuePerJob}
            label="Avg. Revenue / Job"
            trend={reports.metrics.avgRevenueTrend}
            trendPositive={false}
          />
        </div>

        <RevenueJobsChartCard
          chartData={reports.chartData}
          timeFilter={chartTimeFilter}
          onTimeFilterChange={setChartTimeFilter}
        />

        <div className="reports__grid-2">
          <TopEarningJobsCard jobs={reports.topEarningJobs} />
          <TopEarningCustomersCard customers={reports.topEarningCustomers} />
        </div>

        <InvoicePipelineCard
          pipeline={reports.invoicePipeline}
          recentInvoices={reports.recentInvoices}
        />
      </div>
    </AppShell>
  );
};

export default Reports;
