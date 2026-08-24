import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { SettingsNav } from '../components/profile/SettingsNav';
import { AccountPanel } from '../components/profile/AccountPanel';
import { BrandingPanel } from '../components/profile/BrandingPanel';
import { BusinessInfoPanel } from '../components/profile/BusinessInfoPanel';
import { ServicesPanel } from '../components/profile/ServicesPanel';
import { InvoicingPanel } from '../components/profile/InvoicingPanel';
import { NotificationsPanel } from '../components/profile/NotificationsPanel';
import { IntegrationsPanel } from '../components/profile/IntegrationsPanel';
import { ImportPanel } from '../components/profile/ImportPanel';
import { BillingPanel } from '../components/profile/BillingPanel';
import { PlaceholderPanel } from '../components/profile/PlaceholderPanel';
import { ConfirmDialog } from '../components/profile/ConfirmDialog';
import {
  SETTINGS_SECTIONS,
  SECTION_HEADINGS,
  useCustomers,
  useJobs,
  useInvoices,
  useTeamMembers,
  invoiceTotal,
  resetCustomers,
  resetJobs,
  resetInvoices,
  resetTeam,
  resetProfile,
} from '../data';
import './Profile.css';

const DEFAULT_SECTION = 'account';

/** Serializes one table's worth of records into CSV rows. */
const toCsvSection = (title, columns, rows) => [
  title,
  columns.map((column) => column.label).join(','),
  ...rows.map((row) =>
    columns
      .map((column) => `"${String(column.value(row) ?? '').replace(/"/g, '""')}"`)
      .join(','),
  ),
  '',
];

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [confirming, setConfirming] = useState(null);

  const customers = useCustomers();
  const jobs = useJobs();
  const invoices = useInvoices();
  const team = useTeamMembers();

  /* The tab lives in the URL so a section can be linked to and survives a
     refresh. Anything unrecognised falls back to Account. */
  const requested = searchParams.get('section');
  const activeId = SETTINGS_SECTIONS.some((section) => section.id === requested)
    ? requested
    : DEFAULT_SECTION;

  const activeSection = useMemo(
    () => SETTINGS_SECTIONS.find((section) => section.id === activeId),
    [activeId],
  );

  const selectSection = (id) =>
    setSearchParams(id === DEFAULT_SECTION ? {} : { section: id }, { replace: true });

  const handleExport = () => {
    const csv = [
      ...toCsvSection(
        'Customers',
        [
          { label: 'Name', value: (row) => row.name },
          { label: 'Email', value: (row) => row.email },
          { label: 'Phone', value: (row) => row.phone },
          { label: 'Status', value: (row) => row.status },
        ],
        customers,
      ),
      ...toCsvSection(
        'Jobs',
        [
          { label: 'Title', value: (row) => row.title },
          { label: 'Customer', value: (row) => row.customer },
          { label: 'Technician', value: (row) => row.technician },
          { label: 'Status', value: (row) => row.status },
        ],
        jobs,
      ),
      ...toCsvSection(
        'Invoices',
        [
          { label: 'Number', value: (row) => row.number },
          { label: 'Customer', value: (row) => row.customer },
          { label: 'Status', value: (row) => row.status },
          { label: 'Total', value: (row) => invoiceTotal(row) },
        ],
        invoices,
      ),
      ...toCsvSection(
        'Team',
        [
          { label: 'Name', value: (row) => row.name },
          { label: 'Role', value: (row) => row.role },
          { label: 'Email', value: (row) => row.email },
          { label: 'Crew', value: (row) => row.crew },
        ],
        team,
      ),
    ].join('\n');

    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'serviceos_export.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleResetData = () => {
    resetCustomers();
    resetJobs();
    resetInvoices();
    resetTeam();
    resetProfile();
    setConfirming(null);
  };

  const handleDeleteAccount = () => {
    try {
      localStorage.clear();
    } catch {
      // Ignore storage errors — navigating away is what matters.
    }
    setConfirming(null);
    navigate('/login');
  };

  const renderPanel = () => {
    switch (activeId) {
      case 'account':
        return (
          <AccountPanel
            onExport={handleExport}
            onResetData={() => setConfirming('reset')}
            onDeleteAccount={() => setConfirming('delete')}
          />
        );
      case 'branding':
        return <BrandingPanel />;
      case 'business':
        return <BusinessInfoPanel />;
      case 'services':
        return <ServicesPanel />;
      case 'invoicing':
        return <InvoicingPanel />;
      case 'notifications':
        return <NotificationsPanel />;
      case 'integrations':
        return <IntegrationsPanel />;
      case 'import':
        return <ImportPanel />;
      case 'billing':
        return <BillingPanel />;
      default:
        return (
          <PlaceholderPanel
            section={activeSection}
            heading={SECTION_HEADINGS[activeId]}
          />
        );
    }
  };

  return (
    <AppShell>
      <div className="app-shell__content profile">
        <SettingsNav
          sections={SETTINGS_SECTIONS}
          activeId={activeId}
          onSelect={selectSection}
        />

        <div className="profile__panel">{renderPanel()}</div>
      </div>

      {confirming === 'reset' && (
        <ConfirmDialog
          title="Reset all data?"
          description="Every customer, job, invoice and team edit you have made will be replaced with the original demo dataset. This cannot be undone."
          confirmLabel="Reset Data"
          onConfirm={handleResetData}
          onCancel={() => setConfirming(null)}
        />
      )}

      {confirming === 'delete' && (
        <ConfirmDialog
          title="Delete your account?"
          description="This permanently deletes your account and every record stored with it. You will be signed out immediately."
          confirmLabel="Delete Account"
          onConfirm={handleDeleteAccount}
          onCancel={() => setConfirming(null)}
        />
      )}
    </AppShell>
  );
};

export default Profile;
