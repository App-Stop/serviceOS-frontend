import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BriefcaseBusiness, DollarSign, ReceiptText, UserStar } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { StatCard } from '../components/StatCard';
import { RecentActivity } from '../components/RecentActivity';
import { QuickAction } from '../components/QuickAction';
import { JobsChart } from '../components/JobsChart';
import { UpcomingJobs } from '../components/UpcomingJobs';
import { NewCustomers } from '../components/NewCustomers';
import { JobFormModal } from '../components/JobFormModal';
import { CustomerFormModal } from '../components/CustomerFormModal';
import { SendMessageModal } from '../components/SendMessageModal';
import { addJob } from '../data/jobs';
import { addCustomer } from '../data/customers';
import { getErrorMessage } from '../api/client';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(null);
  const [savingJob, setSavingJob] = useState(false);
  const [jobError, setJobError] = useState('');
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [customerError, setCustomerError] = useState('');

  const handleAction = (actionId) => {
    if (actionId === 'invoice') {
      navigate('/invoices/new');
    } else {
      setActiveModal(actionId);
    }
  };

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
              <QuickAction onAction={handleAction} />
              <JobsChart />
            </div>
          </div>

          <div className="dashboard__row">
            <UpcomingJobs />
            <NewCustomers />
          </div>
        </div>
      </div>

      {activeModal === 'job' && (
        <JobFormModal
          onClose={() => {
            setActiveModal(null);
            setJobError('');
          }}
          saving={savingJob}
          error={jobError}
          onSave={async (values) => {
            setSavingJob(true);
            setJobError('');
            try {
              const created = await addJob(values);
              setActiveModal(null);
              if (created?.id) {
                navigate(`/jobs/${created.id}`);
              }
            } catch (error) {
              setJobError(getErrorMessage(error, 'Could not save this job.'));
            } finally {
              setSavingJob(false);
            }
          }}
        />
      )}

      {activeModal === 'customer' && (
        <CustomerFormModal
          saving={savingCustomer}
          error={customerError}
          onClose={() => {
            setActiveModal(null);
            setCustomerError('');
          }}
          onSave={async (values) => {
            setSavingCustomer(true);
            setCustomerError('');
            try {
              const created = await addCustomer(values);
              setActiveModal(null);
              if (created?.id) {
                navigate(`/customers/${created.id}`);
              }
            } catch (error) {
              setCustomerError(getErrorMessage(error, 'Could not save this customer.'));
            } finally {
              setSavingCustomer(false);
            }
          }}
        />
      )}

      {activeModal === 'message' && (
        <SendMessageModal
          onClose={() => setActiveModal(null)}
          onSend={() => {
            setActiveModal(null);
          }}
        />
      )}
    </AppShell>
  );
};

export default Dashboard;
