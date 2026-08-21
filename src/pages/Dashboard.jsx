import React from 'react';
import { BriefcaseBusiness, DollarSign, ReceiptText, UserStar } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { StatCard } from '../components/StatCard';
import { RecentActivity } from '../components/RecentActivity';
import { QuickAction } from '../components/QuickAction';
import { JobsChart } from '../components/JobsChart';
import { UpcomingJobs } from '../components/UpcomingJobs';
import { NewCustomers } from '../components/NewCustomers';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <AppShell>
      <div className="app-shell__content">
        <div className="page-title">
          <h1 className="page-title__heading">Good evening, John</h1>
          <p className="page-title__subheading">Here’s what happening today</p>
        </div>

        <div className="dashboard__grid">
          <div className="dashboard__row dashboard__row--stats">
            <StatCard icon={BriefcaseBusiness} value="13" label="Active Jobs" />
            <StatCard icon={DollarSign} value="$7,695" label="Revenue this month" trend="13%" />
            <StatCard icon={ReceiptText} value="4" label="Open Invoices" />
            <StatCard icon={UserStar} value="4.8" label="Avg. Rating (123 reviews)" showStar />
          </div>

          <div className="dashboard__row">
            <RecentActivity />
            <div className="dashboard__aside">
              <QuickAction />
              <JobsChart />
            </div>
          </div>

          <div className="dashboard__row">
            <UpcomingJobs />
            <NewCustomers />
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Dashboard;
